import type { Transaction } from '../types';
import { localISOString } from '../lib/utils';

interface WalletUpdate {
  walletId: string;
  delta: number; // perubahan saldo: + untuk income/transferIn, - untuk expense/transferOut
}

// Helper: wrap IDBRequest to Promise
function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Helper: get all from object store
async function getAllFromStore<T>(db: IDBDatabase, storeName: string): Promise<T[]> {
  const tx = db.transaction(storeName, 'readonly');
  const store = tx.objectStore(storeName);
  const request = store.getAll();
  return requestToPromise(request);
}

// Get all transactions
export async function getAllTransactions(db: IDBDatabase): Promise<Transaction[]> {
  return getAllFromStore<Transaction>(db, 'transactions');
}

// Get transaction by ID
export async function getTransactionById(db: IDBDatabase, id: string): Promise<Transaction | undefined> {
  const tx = db.transaction('transactions', 'readonly');
  const store = tx.objectStore('transactions');
  const request = store.get(id);
  return requestToPromise(request);
}

// Get transactions by wallet ID
export async function getTransactionsByWalletId(db: IDBDatabase, walletId: string): Promise<Transaction[]> {
  const tx = db.transaction('transactions', 'readonly');
  const store = tx.objectStore('transactions');
  const index = store.index('by_walletId');
  const request = index.getAll(walletId);
  return requestToPromise(request);
}

// Add wallet update + correction transaction atomically
export async function addTransactionWithWalletUpdate(
  db: IDBDatabase,
  walletData: { id: string; balance: number; initialBalance: number; updatedAt: string },
  correctionTx: Transaction
): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['transactions', 'wallets'], 'readwrite');
    const txStore = tx.objectStore('transactions');
    const walletStore = tx.objectStore('wallets');

    // Add correction transaction
    txStore.add(correctionTx);

    // Update wallet
    walletStore.put(walletData);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(new Error('Transaction aborted'));
  });
}

// Add transaction dengan atomic wallet balance update
export async function addTransaction(
  db: IDBDatabase,
  transaction: Transaction,
  walletUpdates: WalletUpdate[]
): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['transactions', 'wallets'], 'readwrite');
    const txStore = tx.objectStore('transactions');
    const walletStore = tx.objectStore('wallets');

    // Add transaction
    txStore.add(transaction);

    // Update wallet balances
    for (const { walletId, delta } of walletUpdates) {
      const getReq = walletStore.get(walletId);
      getReq.onsuccess = () => {
        const wallet = getReq.result;
        if (wallet) {
          wallet.balance = (wallet.balance || 0) + delta;
          wallet.updatedAt = localISOString();
          walletStore.put(wallet);
        }
      };
    }

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(new Error('Transaction aborted'));
  });
}

// Update transaction dengan atomic wallet balance update
export async function updateTransaction(
  db: IDBDatabase,
  id: string,
  newRecord: Transaction,
  walletUpdates: WalletUpdate[]
): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['transactions', 'wallets'], 'readwrite');
    const txStore = tx.objectStore('transactions');
    const walletStore = tx.objectStore('wallets');

    // Update transaction
    txStore.put(newRecord);

    // Update wallet balances
    for (const { walletId, delta } of walletUpdates) {
      const getReq = walletStore.get(walletId);
      getReq.onsuccess = () => {
        const wallet = getReq.result;
        if (wallet) {
          wallet.balance = (wallet.balance || 0) + delta;
          wallet.updatedAt = localISOString();
          walletStore.put(wallet);
        }
      };
    }

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(new Error('Transaction aborted'));
  });
}

// Delete transaction dengan atomic wallet balance update (reverse)
export async function deleteTransaction(
  db: IDBDatabase,
  id: string,
  walletUpdates: WalletUpdate[]
): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['transactions', 'wallets'], 'readwrite');
    const txStore = tx.objectStore('transactions');
    const walletStore = tx.objectStore('wallets');

    // Delete transaction
    txStore.delete(id);

    // Reverse wallet balances
    for (const { walletId, delta } of walletUpdates) {
      const getReq = walletStore.get(walletId);
      getReq.onsuccess = () => {
        const wallet = getReq.result;
        if (wallet) {
          wallet.balance = (wallet.balance || 0) + delta;
          wallet.updatedAt = localISOString();
          walletStore.put(wallet);
        }
      };
    }

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(new Error('Transaction aborted'));
  });
}