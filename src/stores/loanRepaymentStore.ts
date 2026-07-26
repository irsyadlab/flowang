import { create } from 'zustand';
import { toast } from 'sonner';
import type { LoanEntry, Repayment, RepaymentFormData, LinkedTransactionInput } from '../types';
import { getAllRepayments } from '../db/loanRepaymentDb';
import {
  createRepaymentWithTransaction,
  deleteRepaymentWithCascade,
} from '../lib/transactionIntegrator';
import { validateRepaymentAmount } from '../lib/loanUtils';
import { getDB } from '../db/db';
import { useUIStore } from './uiStore';
import { useLoanEntryStore } from './loanEntryStore';
import { localISOString } from '../lib/utils';
import { useSyncStore } from '../sync/syncStore';
import { onLocalChange } from '../sync/syncManager';

interface LoanRepaymentState {
  repayments: Repayment[];
  isLoading: boolean;
  error: string | null;
}

interface LoanRepaymentActions {
  loadRepayments: () => Promise<void>;
  addRepayment: (data: RepaymentFormData, loanEntry: LoanEntry) => Promise<void>;
  deleteRepayment: (id: string, loanEntry: LoanEntry) => Promise<void>;
}

export const useLoanRepaymentStore = create<LoanRepaymentState & LoanRepaymentActions>(
  (set, get) => ({
    repayments: [],
    isLoading: false,
    error: null,

    /**
     * Load all repayments from IndexedDB.
     * Requirements: 1.5, 7.4
     */
    loadRepayments: async () => {
      if (!useUIStore.getState().dbReady) return;

      set({ isLoading: true, error: null });
      try {
        const db = getDB();
        if (!db) throw new Error('Database not initialized');

        const repayments = await getAllRepayments(db);
        set({ repayments, isLoading: false });
      } catch (error) {
        set({ error: (error as Error).message, isLoading: false });
      }
    },

    /**
     * Add a new repayment for a loan entry.
     * Validates amount, optionally creates a linked transaction, and updates state.
     * Requirements: 1.5, 7.4
     */
    addRepayment: async (data: RepaymentFormData, loanEntry: LoanEntry) => {
      if (!useUIStore.getState().dbReady) return;

      // Validate repayment amount against remaining amount
      const validation = validateRepaymentAmount(data.amount, loanEntry.remainingAmount);
      if (!validation.success) {
        set({ error: validation.error ?? 'Validasi gagal' });
        return;
      }

      set({ isLoading: true, error: null });
      try {
        const db = getDB();
        if (!db) throw new Error('Database not initialized');

        const now = localISOString();
        const repayment: Repayment = {
          id: crypto.randomUUID(),
          loanEntryId: data.loanEntryId,
          amount: data.amount,
          date: data.date,
          time: data.time,
          note: data.note,
          categoryId: data.categoryId,
          linkedTransactionId: undefined,
          createdAt: now,
          updatedAt: now,
        };

        let transactionData: LinkedTransactionInput | undefined;
        if (data.createTransaction && data.walletId) {
          transactionData = {
            walletId: data.walletId,
            categoryId: data.categoryId,
            date: data.date,
            time: data.time,
            amount: data.amount,
            note: data.note,
          };
        }

        const { savedRepayment, updatedEntry, linkedTransaction } =
          await createRepaymentWithTransaction(db, repayment, loanEntry, transactionData);

        set((state) => ({
          // savedRepayment, bukan `repayment` — integrator yang mengisi
          // linkedTransactionId, dan state in-memory harus mencerminkan
          // apa yang benar-benar tersimpan di IndexedDB.
          repayments: [...state.repayments, savedRepayment],
          isLoading: false,
        }));

        // Reload wallets and transactions if a linked transaction was created
        if (transactionData) {
          const { useWalletStore } = await import('./walletStore');
          const { useTransactionStore } = await import('./transactionStore');
          await Promise.all([
            useWalletStore.getState().loadWallets(),
            useTransactionStore.getState().loadTransactions(),
          ]);
        }

        // Reload entries dari DB: remainingAmount selalu berubah setelah
        // repayment, bukan hanya saat auto-settle.
        await useLoanEntryStore.getState().loadEntries();

        // Publish SEMUA efek operasi ini. Repayment, transaksi linked, dan
        // loan entry yang ter-update ditulis dalam satu IDBTransaction, jadi
        // ketiganya harus ikut ter-sync bersama — kalau hanya sebagian yang
        // di-publish, device lain melihat state yang tidak konsisten (mis.
        // sisa hutang berubah tanpa riwayat pelunasan).
        if (useSyncStore.getState().syncKey) {
          onLocalChange('loan_repayments', savedRepayment);
          if (linkedTransaction) {
            onLocalChange('transactions', linkedTransaction);
          }
          onLocalChange('loan_entries', updatedEntry);
        }
      } catch (error) {
        const message = (error as Error).message;
        set({ error: message, isLoading: false });
        toast.error(message);
      }
    },

    /**
     * Delete a repayment and its linked transaction (if any).
     * Auto-unsettle the loan entry if it was settled due to this repayment.
     * Requirements: 1.8, 7.4
     */
    deleteRepayment: async (id: string, loanEntry: LoanEntry) => {
      if (!useUIStore.getState().dbReady) return;

      set({ isLoading: true, error: null });
      try {
        const db = getDB();
        if (!db) throw new Error('Database not initialized');

        const deletedRepayment = get().repayments.find((r) => r.id === id);
        const { updatedEntry, deletedTransactionId } =
          await deleteRepaymentWithCascade(db, id, loanEntry);

        set((state) => ({
          repayments: state.repayments.filter((r) => r.id !== id),
          isLoading: false,
        }));

        // Reload wallets and transactions if the deleted repayment had a linked transaction
        if (deletedRepayment?.linkedTransactionId) {
          const { useWalletStore } = await import('./walletStore');
          const { useTransactionStore } = await import('./transactionStore');
          await Promise.all([
            useWalletStore.getState().loadWallets(),
            useTransactionStore.getState().loadTransactions(),
          ]);
        }

        // Reload entries dari DB: remainingAmount selalu berubah setelah
        // repayment dihapus, bukan hanya saat auto-unsettle.
        await useLoanEntryStore.getState().loadEntries();

        // Publish semua efek operasi (lihat catatan di addRepayment)
        if (useSyncStore.getState().syncKey) {
          onLocalChange('loan_repayments', { id, _deleted: true });
          if (deletedTransactionId) {
            onLocalChange('transactions', { id: deletedTransactionId, _deleted: true });
          }
          onLocalChange('loan_entries', updatedEntry);
        }
      } catch (error) {
        const message = (error as Error).message;
        set({ error: message, isLoading: false });
        toast.error(message);
      }
    },
  })
);
