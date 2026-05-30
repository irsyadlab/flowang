import type { LoanDirection, LoanEntry, LinkedTransactionInput, Repayment, Transaction } from '../types';
import { localISOString } from './utils';

/**
 * Menentukan tipe Transaction yang harus dibuat berdasarkan konteks dan arah hutang.
 *
 * Untuk Loan_Entry:
 *   - direction 'borrow' → 'income' (uang masuk ke wallet karena meminjam)
 *   - direction 'lend'   → 'expense' (uang keluar dari wallet karena meminjamkan)
 *
 * Untuk Repayment:
 *   - direction LoanEntry 'lend'   → 'income' (uang kembali masuk karena piutang dibayar)
 *   - direction LoanEntry 'borrow' → 'expense' (uang keluar untuk membayar hutang)
 *
 * Requirements: 2.3, 3.3
 */
export function resolveTransactionType(
  context: 'loan_entry' | 'repayment',
  direction: LoanDirection
): 'income' | 'expense' {
  if (context === 'loan_entry') {
    return direction === 'borrow' ? 'income' : 'expense';
  }
  // context === 'repayment'
  return direction === 'lend' ? 'income' : 'expense';
}

/**
 * Membuat Loan_Entry beserta Linked_Transaction secara atomik dalam satu IndexedDB transaction.
 * Jika salah satu operasi gagal, seluruh operasi di-rollback secara otomatis.
 *
 * Langkah-langkah:
 * 1. Tentukan tipe transaksi berdasarkan direction LoanEntry
 * 2. Generate UUID untuk Linked_Transaction
 * 3. Simpan LoanEntry dengan linkedTransactionId yang sudah diset
 * 4. Simpan Linked_Transaction ke object store `transactions`
 * 5. Update saldo Wallet secara atomik (income: +amount, expense: -amount)
 *
 * Requirements: 2.3, 2.4, 2.6, 6.1
 */
export async function createLoanEntryWithTransaction(
  db: IDBDatabase,
  entry: LoanEntry,
  transactionData: LinkedTransactionInput
): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['loan_entries', 'transactions', 'wallets'], 'readwrite');
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(new Error('Transaction aborted'));

    const run = async () => {
      try {
        const loanEntriesStore = tx.objectStore('loan_entries');
        const transactionsStore = tx.objectStore('transactions');
        const walletsStore = tx.objectStore('wallets');

        // 1. Determine transaction type based on entry direction
        const txType = resolveTransactionType('loan_entry', entry.direction);

        // 2. Generate UUID for the Linked_Transaction
        const linkedTransactionId = crypto.randomUUID();

        // 3. Save LoanEntry with linkedTransactionId set
        const entryToSave: LoanEntry = {
          ...entry,
          linkedTransactionId,
        };
        loanEntriesStore.add(entryToSave);

        // 4. Build and save the Linked_Transaction
        const now = localISOString();
        const linkedTransaction: Transaction = {
          id: linkedTransactionId,
          type: txType,
          amount: transactionData.amount,
          walletId: transactionData.walletId,
          categoryId: transactionData.categoryId,
          date: transactionData.date,
          time: transactionData.time,
          note: transactionData.note,
          isLoanLinked: true,
          createdAt: now,
          updatedAt: now,
        };
        transactionsStore.add(linkedTransaction);

        // 5. Update wallet balance atomically
        const delta = txType === 'income' ? transactionData.amount : -transactionData.amount;
        const getWalletReq = walletsStore.get(transactionData.walletId);
        getWalletReq.onsuccess = () => {
          const wallet = getWalletReq.result;
          if (!wallet) {
            tx.abort();
            return;
          }
          wallet.balance = (wallet.balance || 0) + delta;
          wallet.updatedAt = localISOString();
          walletsStore.put(wallet);
        };
        getWalletReq.onerror = () => {
          tx.abort();
        };

        tx.oncomplete = () => resolve();
      } catch (err) {
        try { tx.abort(); } catch { /* already aborted */ }
        reject(err);
      }
    };

    run();
  });
}

/**
 * Menghapus Loan_Entry beserta semua Repayment terkait, semua Linked_Transaction dari Repayment,
 * dan Linked_Transaction dari LoanEntry secara atomik dalam satu IndexedDB transaction.
 * Membalikkan efek saldo Wallet untuk setiap Linked_Transaction yang dihapus.
 *
 * Langkah-langkah:
 * 1. Fetch LoanEntry berdasarkan entryId
 * 2. Fetch semua Repayment untuk entryId ini (via index by_loanEntryId)
 * 3. Untuk setiap Repayment yang memiliki linkedTransactionId:
 *    - Fetch Transaction terkait
 *    - Balikkan efek saldo Wallet (income → kurangi, expense → tambah)
 *    - Hapus Transaction
 * 4. Hapus semua Repayment untuk entryId ini
 * 5. Jika LoanEntry memiliki linkedTransactionId:
 *    - Fetch Transaction terkait
 *    - Balikkan efek saldo Wallet
 *    - Hapus Transaction
 * 6. Hapus LoanEntry
 *
 * Requirements: 2.7, 6.3
 */
export async function deleteLoanEntryWithCascade(
  db: IDBDatabase,
  entryId: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(
      ['loan_entries', 'loan_repayments', 'transactions', 'wallets'],
      'readwrite'
    );
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(new Error('Transaction aborted'));

    const run = async () => {
      try {
        const loanEntriesStore = tx.objectStore('loan_entries');
        const loanRepaymentsStore = tx.objectStore('loan_repayments');
        const transactionsStore = tx.objectStore('transactions');
        const walletsStore = tx.objectStore('wallets');

        // Helper: reverse wallet balance for a given transaction
        const reverseWalletBalance = (linkedTxId: string): Promise<void> => {
          return new Promise((res, rej) => {
            const getTxReq = transactionsStore.get(linkedTxId);
            getTxReq.onsuccess = () => {
              const linkedTx = getTxReq.result;
              if (!linkedTx) {
                // Transaction not found — nothing to reverse
                res();
                return;
              }
              // Reverse: income → subtract, expense → add back
              const delta = linkedTx.type === 'income' ? -linkedTx.amount : linkedTx.amount;
              const getWalletReq = walletsStore.get(linkedTx.walletId);
              getWalletReq.onsuccess = () => {
                const wallet = getWalletReq.result;
                if (wallet) {
                  wallet.balance = (wallet.balance || 0) + delta;
                  wallet.updatedAt = localISOString();
                  walletsStore.put(wallet);
                }
                transactionsStore.delete(linkedTxId);
                res();
              };
              getWalletReq.onerror = () => rej(getWalletReq.error);
            };
            getTxReq.onerror = () => rej(getTxReq.error);
          });
        };

        // 1. Fetch LoanEntry
        const entry: import('../types').LoanEntry = await new Promise((res, rej) => {
          const req = loanEntriesStore.get(entryId);
          req.onsuccess = () => res(req.result);
          req.onerror = () => rej(req.error);
        });

        // 2. Fetch all Repayments for this entryId
        const repayments: import('../types').Repayment[] = await new Promise((res, rej) => {
          const index = loanRepaymentsStore.index('by_loanEntryId');
          const req = index.getAll(entryId);
          req.onsuccess = () => res(req.result);
          req.onerror = () => rej(req.error);
        });

        // 3. For each Repayment with a linkedTransactionId: reverse wallet balance and delete transaction
        for (const repayment of repayments) {
          if (repayment.linkedTransactionId) {
            await reverseWalletBalance(repayment.linkedTransactionId);
          }
        }

        // 4. Delete all Repayments for this entryId
        for (const repayment of repayments) {
          loanRepaymentsStore.delete(repayment.id);
        }

        // 5. If LoanEntry has a linkedTransactionId: reverse wallet balance and delete transaction
        if (entry && entry.linkedTransactionId) {
          await reverseWalletBalance(entry.linkedTransactionId);
        }

        // 6. Delete the LoanEntry
        loanEntriesStore.delete(entryId);

        tx.oncomplete = () => resolve();
      } catch (err) {
        try { tx.abort(); } catch { /* already aborted */ }
        reject(err);
      }
    };

    run();
  });
}

/**
 * Membuat Repayment beserta Linked_Transaction (opsional) secara atomik dalam satu IndexedDB transaction.
 * Juga mengecek apakah LoanEntry perlu di-settle setelah repayment ini ditambahkan.
 *
 * Langkah-langkah:
 * 1. Buka satu IDBTransaction yang mencakup loan_repayments, loan_entries, transactions, wallets
 * 2. Jika transactionData disediakan:
 *    - Tentukan tipe transaksi berdasarkan direction LoanEntry
 *    - Generate UUID untuk Linked_Transaction
 *    - Simpan Repayment dengan linkedTransactionId yang sudah diset
 *    - Simpan Linked_Transaction ke object store `transactions`
 *    - Update saldo Wallet secara atomik
 * 3. Jika transactionData TIDAK disediakan:
 *    - Simpan Repayment tanpa linkedTransactionId
 * 4. Fetch semua repayments untuk loanEntry ini dan hitung total yang sudah dibayar
 * 5. Auto-settle: jika total repaid == loanEntry.amount, ubah status ke 'settled' dan set settledAt
 * 6. Update loanEntry.remainingAmount = loanEntry.amount - totalRepaid
 * 7. Return { autoSettled: boolean }
 *
 * Requirements: 1.5, 1.6, 3.3, 3.5, 6.2
 */
export async function createRepaymentWithTransaction(
  db: IDBDatabase,
  repayment: Repayment,
  loanEntry: LoanEntry,
  transactionData?: LinkedTransactionInput
): Promise<{ autoSettled: boolean }> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(
      ['loan_repayments', 'loan_entries', 'transactions', 'wallets'],
      'readwrite'
    );
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(new Error('Transaction aborted'));

    const run = async () => {
      try {
        const loanRepaymentsStore = tx.objectStore('loan_repayments');
        const loanEntriesStore = tx.objectStore('loan_entries');
        const transactionsStore = tx.objectStore('transactions');
        const walletsStore = tx.objectStore('wallets');

        if (transactionData) {
          // 1. Determine transaction type based on loanEntry direction
          const txType = resolveTransactionType('repayment', loanEntry.direction);

          // 2. Generate UUID for the Linked_Transaction
          const linkedTransactionId = crypto.randomUUID();

          // 3. Save Repayment with linkedTransactionId set
          loanRepaymentsStore.add({
            ...repayment,
            linkedTransactionId,
          });

          // 4. Build and save the Linked_Transaction
          const now = localISOString();
          const linkedTransaction: Transaction = {
            id: linkedTransactionId,
            type: txType,
            amount: transactionData.amount,
            walletId: transactionData.walletId,
            categoryId: transactionData.categoryId,
            date: transactionData.date,
            time: transactionData.time,
            note: transactionData.note,
            isLoanLinked: true,
            createdAt: now,
            updatedAt: now,
          };
          transactionsStore.add(linkedTransaction);

          // 5. Update wallet balance atomically
          const delta = txType === 'income' ? transactionData.amount : -transactionData.amount;
          await new Promise<void>((res, rej) => {
            const getWalletReq = walletsStore.get(transactionData.walletId);
            getWalletReq.onsuccess = () => {
              const wallet = getWalletReq.result;
              if (!wallet) {
                tx.abort();
                rej(new Error(`Wallet with id "${transactionData.walletId}" not found`));
                return;
              }
              wallet.balance = (wallet.balance || 0) + delta;
              wallet.updatedAt = localISOString();
              walletsStore.put(wallet);
              res();
            };
            getWalletReq.onerror = () => rej(getWalletReq.error);
          });
        } else {
          // No transaction data — save Repayment without linkedTransactionId
          loanRepaymentsStore.add({ ...repayment });
        }

        // 6. Fetch all repayments for this loanEntry to calculate total repaid
        const allRepayments: Repayment[] = await new Promise((res, rej) => {
          const index = loanRepaymentsStore.index('by_loanEntryId');
          const req = index.getAll(loanEntry.id);
          req.onsuccess = () => res(req.result);
          req.onerror = () => rej(req.error);
        });

        // Include the repayment we just added (it may not be in the index result yet
        // depending on IDB implementation, but typically it is since we're in the same tx)
        const totalRepaid = allRepayments.reduce((sum, r) => sum + r.amount, 0);

        // 7. Auto-settle check
        const now = localISOString();
        const autoSettled = totalRepaid >= loanEntry.amount;
        const updatedEntry: LoanEntry = {
          ...loanEntry,
          remainingAmount: Math.max(0, loanEntry.amount - totalRepaid),
          updatedAt: now,
          ...(autoSettled && loanEntry.status !== 'settled'
            ? { status: 'settled' as const, settledAt: now }
            : {}),
        };
        loanEntriesStore.put(updatedEntry);

        tx.oncomplete = () => resolve({ autoSettled: autoSettled && loanEntry.status !== 'settled' });
      } catch (err) {
        try { tx.abort(); } catch { /* already aborted */ }
        reject(err);
      }
    };

    run();
  });
}

/**
 * Menghapus Repayment beserta Linked_Transaction secara atomik dalam satu IndexedDB transaction.
 * Membalikkan efek saldo Wallet jika ada Linked_Transaction.
 * Juga mengecek apakah LoanEntry perlu di-unsettled setelah penghapusan.
 *
 * Langkah-langkah:
 * 1. Buka satu IDBTransaction yang mencakup loan_repayments, loan_entries, transactions, wallets
 * 2. Fetch Repayment berdasarkan repaymentId
 * 3. Jika Repayment memiliki linkedTransactionId:
 *    - Fetch Transaction terkait
 *    - Balikkan efek saldo Wallet (income → kurangi, expense → tambah)
 *    - Hapus Transaction
 * 4. Hapus Repayment
 * 5. Fetch semua repayments yang tersisa untuk loanEntry.id dan hitung total baru
 * 6. Update loanEntry.remainingAmount = loanEntry.amount - newTotalRepaid
 * 7. Auto-unsettle: jika loanEntry.status === 'settled' DAN newTotalRepaid < loanEntry.amount,
 *    ubah status kembali ke 'active' dan hapus settledAt
 * 8. Return { autoUnsettled: boolean }
 *
 * Requirements: 1.8, 3.6, 6.2
 */
export async function deleteRepaymentWithCascade(
  db: IDBDatabase,
  repaymentId: string,
  loanEntry: LoanEntry
): Promise<{ autoUnsettled: boolean }> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(
      ['loan_repayments', 'loan_entries', 'transactions', 'wallets'],
      'readwrite'
    );
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(new Error('Transaction aborted'));

    const run = async () => {
      try {
        const loanRepaymentsStore = tx.objectStore('loan_repayments');
        const loanEntriesStore = tx.objectStore('loan_entries');
        const transactionsStore = tx.objectStore('transactions');
        const walletsStore = tx.objectStore('wallets');

        // 2. Fetch the Repayment by repaymentId
        const repayment: Repayment | undefined = await new Promise((res, rej) => {
          const req = loanRepaymentsStore.get(repaymentId);
          req.onsuccess = () => res(req.result);
          req.onerror = () => rej(req.error);
        });

        if (!repayment) {
          tx.abort();
          reject(new Error(`Repayment with id "${repaymentId}" not found`));
          return;
        }

        // 3. If Repayment has a linkedTransactionId: reverse wallet balance and delete transaction
        if (repayment.linkedTransactionId) {
          await new Promise<void>((res, rej) => {
            const getTxReq = transactionsStore.get(repayment.linkedTransactionId!);
            getTxReq.onsuccess = () => {
              const linkedTx = getTxReq.result;
              if (!linkedTx) {
                // Transaction not found — nothing to reverse, just continue
                res();
                return;
              }
              // Reverse: income → subtract, expense → add back
              const delta = linkedTx.type === 'income' ? -linkedTx.amount : linkedTx.amount;
              const getWalletReq = walletsStore.get(linkedTx.walletId);
              getWalletReq.onsuccess = () => {
                const wallet = getWalletReq.result;
                if (wallet) {
                  wallet.balance = (wallet.balance || 0) + delta;
                  wallet.updatedAt = localISOString();
                  walletsStore.put(wallet);
                }
                transactionsStore.delete(repayment.linkedTransactionId!);
                res();
              };
              getWalletReq.onerror = () => rej(getWalletReq.error);
            };
            getTxReq.onerror = () => rej(getTxReq.error);
          });
        }

        // 4. Delete the Repayment
        loanRepaymentsStore.delete(repaymentId);

        // 5. Fetch all remaining repayments for loanEntry.id to calculate new total repaid
        const remainingRepayments: Repayment[] = await new Promise((res, rej) => {
          const index = loanRepaymentsStore.index('by_loanEntryId');
          const req = index.getAll(loanEntry.id);
          req.onsuccess = () => res(req.result);
          req.onerror = () => rej(req.error);
        });

        // Filter out the deleted repayment in case IDB returns it before the delete is visible
        const newTotalRepaid = remainingRepayments
          .filter((r) => r.id !== repaymentId)
          .reduce((sum, r) => sum + r.amount, 0);

        // 6. Update loanEntry.remainingAmount
        const now = localISOString();
        const wasSettled = loanEntry.status === 'settled';
        const autoUnsettled = wasSettled && newTotalRepaid < loanEntry.amount;

        const updatedEntry: LoanEntry = {
          ...loanEntry,
          remainingAmount: loanEntry.amount - newTotalRepaid,
          updatedAt: now,
          ...(autoUnsettled
            ? { status: 'active' as const, settledAt: undefined }
            : {}),
        };
        loanEntriesStore.put(updatedEntry);

        tx.oncomplete = () => resolve({ autoUnsettled });
      } catch (err) {
        try { tx.abort(); } catch { /* already aborted */ }
        reject(err);
      }
    };

    run();
  });
}
