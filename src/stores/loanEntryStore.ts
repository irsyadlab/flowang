import { create } from 'zustand';
import type { LoanEntry, LoanEntryFormData, LinkedTransactionInput, Transaction } from '../types';
import * as loanEntryDb from '../db/loanEntryDb';
import { getDB } from '../db/db';
import { useUIStore } from './uiStore';
import { localISOString } from '../lib/utils';
import { useSyncStore } from '../sync/syncStore';
import { onLocalChange } from '../sync/syncManager';
import { createLoanEntryWithTransaction, deleteLoanEntryWithCascade, settleEntryWithReversal, unsettleEntryWithReversal } from '../lib/transactionIntegrator';
import { toast } from 'sonner';

interface LoanEntryState {
  entries: LoanEntry[];
  isLoading: boolean;
  error: string | null;
}

interface LoanEntryActions {
  loadEntries: () => Promise<void>;
  addEntry: (data: LoanEntryFormData) => Promise<void>;
  updateEntry: (id: string, data: Partial<Omit<LoanEntry, 'id' | 'createdAt'>>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  toggleEntryStatus: (id: string) => Promise<void>;
  markAllSettled: (contactId: string) => Promise<void>;
}

export const useLoanEntryStore = create<LoanEntryState & LoanEntryActions>((set, get) => ({
  entries: [],
  isLoading: false,
  error: null,

  loadEntries: async () => {
    if (!useUIStore.getState().dbReady) return;

    set({ isLoading: true, error: null });
    try {
      const db = getDB();
      if (!db) throw new Error('Database not initialized');

      const entries = await loanEntryDb.getAllEntries(db);
      set({ entries, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addEntry: async (data) => {
    if (!useUIStore.getState().dbReady) return;

    set({ isLoading: true, error: null });
    try {
      const db = getDB();
      if (!db) throw new Error('Database not initialized');

      const now = localISOString();
      const entry: LoanEntry = {
        id: crypto.randomUUID(),
        contactId: data.contactId,
        amount: data.amount,
        direction: data.direction,
        status: 'active',
        date: data.date,
        time: data.time,
        note: data.note,
        categoryId: data.categoryId,
        remainingAmount: data.amount,
        linkedTransactionId: undefined,
        createdAt: now,
        updatedAt: now,
      };

      // Entry yang benar-benar tersimpan. Saat integrator dipakai, dialah yang
      // memegang `linkedTransactionId` — bukan objek `entry` di atas.
      let savedEntry = entry;
      let linkedTransaction: Transaction | undefined;

      if (data.createTransaction && data.walletId) {
        // Build LinkedTransactionInput and call Transaction_Integrator atomically
        const transactionData: LinkedTransactionInput = {
          walletId: data.walletId,
          categoryId: data.categoryId,
          date: data.date,
          time: data.time,
          amount: data.amount,
          note: data.note,
        };
        const result = await createLoanEntryWithTransaction(db, entry, transactionData);
        savedEntry = result.savedEntry;
        linkedTransaction = result.linkedTransaction;
      } else {
        // No transaction integration — save entry directly
        await loanEntryDb.addEntry(db, entry);
      }

      set((state) => ({
        entries: [...state.entries, savedEntry],
        isLoading: false,
      }));

      if (linkedTransaction) {
        const { useWalletStore } = await import('./walletStore');
        const { useTransactionStore } = await import('./transactionStore');
        await Promise.all([
          useWalletStore.getState().loadWallets(),
          useTransactionStore.getState().loadTransactions(),
        ]);
      }

      if (useSyncStore.getState().syncKey) {
        onLocalChange('loan_entries', savedEntry);
        // Transaksi linked ditulis dalam IDBTransaction yang sama, jadi harus
        // ikut ter-publish — kalau tidak, device lain menerima loan entry-nya
        // saja dan saldo wallet-nya jadi tidak cocok.
        if (linkedTransaction) {
          onLocalChange('transactions', linkedTransaction);
        }
      }
    } catch (error) {
      const message = (error as Error).message;
      toast.error(message);
      set({ error: message, isLoading: false });
    }
  },

  updateEntry: async (id, data) => {
    if (!useUIStore.getState().dbReady) return;

    set({ isLoading: true, error: null });
    try {
      const db = getDB();
      if (!db) throw new Error('Database not initialized');

      const existing = get().entries.find((e) => e.id === id);
      if (!existing) throw new Error('Entry not found');

      const updated: LoanEntry = {
        ...existing,
        ...data,
        updatedAt: localISOString(),
      };

      await loanEntryDb.updateEntry(db, id, updated);
      set((state) => ({
        entries: state.entries.map((e) => (e.id === id ? updated : e)),
        isLoading: false,
      }));
      if (useSyncStore.getState().syncKey) {
        onLocalChange('loan_entries', updated);
      }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  deleteEntry: async (id) => {
    if (!useUIStore.getState().dbReady) return;

    set({ isLoading: true, error: null });
    try {
      const db = getDB();
      if (!db) throw new Error('Database not initialized');

      // Use cascade delete to also remove all related Repayments and Linked_Transactions atomically
      // Requirements: 2.7, 6.3
      const deletedEntry = get().entries.find((e) => e.id === id);
      const { deletedRepaymentIds, deletedTransactionIds } =
        await deleteLoanEntryWithCascade(db, id);
      set((state) => ({
        entries: state.entries.filter((e) => e.id !== id),
        isLoading: false,
      }));

      // Reload repayments to keep state in sync after cascade delete
      // Lazy import to avoid circular dependency (loanRepaymentStore imports loanEntryStore)
      const { useLoanRepaymentStore } = await import('./loanRepaymentStore');
      await useLoanRepaymentStore.getState().loadRepayments();

      // Reload wallets and transactions if the deleted entry had a linked transaction
      if (deletedEntry?.linkedTransactionId) {
        const { useWalletStore } = await import('./walletStore');
        const { useTransactionStore } = await import('./transactionStore');
        await Promise.all([
          useWalletStore.getState().loadWallets(),
          useTransactionStore.getState().loadTransactions(),
        ]);
      }

      if (useSyncStore.getState().syncKey) {
        // Cascade delete juga menghapus semua repayment dan transaksi linked-nya.
        // Tombstone-nya harus ikut di-publish, kalau tidak device lain menyimpan
        // repayment yatim yang loan entry-nya sudah tidak ada.
        for (const repaymentId of deletedRepaymentIds) {
          onLocalChange('loan_repayments', { id: repaymentId, _deleted: true });
        }
        for (const transactionId of deletedTransactionIds) {
          onLocalChange('transactions', { id: transactionId, _deleted: true });
        }
        onLocalChange('loan_entries', { id, _deleted: true });
      }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  toggleEntryStatus: async (id) => {
    if (!useUIStore.getState().dbReady) return;

    set({ isLoading: true, error: null });
    try {
      const db = getDB();
      if (!db) throw new Error('Database not initialized');

      const entry = get().entries.find((e) => e.id === id);
      if (!entry) throw new Error('Entry not found');

      if (entry.status === 'active') {
        // Settle: create reversal transaction for remaining amount
        await settleEntryWithReversal(db, entry);
      } else {
        // Unsettle: delete reversal transaction and restore wallet balance
        await unsettleEntryWithReversal(db, entry);
      }

      // Reload entry from DB to get the updated state
      const { getEntryById } = await import('../db/loanEntryDb');
      const updated = await getEntryById(db, id);
      if (!updated) throw new Error('Entry not found after update');

      set((state) => ({
        entries: state.entries.map((e) => (e.id === id ? updated : e)),
        isLoading: false,
      }));

      // Reload wallets and transactions if entry has a linked transaction
      if (entry.linkedTransactionId) {
        const { useWalletStore } = await import('./walletStore');
        const { useTransactionStore } = await import('./transactionStore');
        await Promise.all([
          useWalletStore.getState().loadWallets(),
          useTransactionStore.getState().loadTransactions(),
        ]);
      }

      if (useSyncStore.getState().syncKey) {
        onLocalChange('loan_entries', updated);
      }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  markAllSettled: async (contactId) => {
    if (!useUIStore.getState().dbReady) return;

    set({ isLoading: true, error: null });
    try {
      const db = getDB();
      if (!db) throw new Error('Database not initialized');

      const activeEntries = get().entries.filter(
        (e) => e.contactId === contactId && e.status === 'active'
      );

      // Settle each entry with reversal transaction
      for (const entry of activeEntries) {
        await settleEntryWithReversal(db, entry);
      }

      // Reload entries from DB
      const allEntries = await loanEntryDb.getAllEntries(db);
      set({ entries: allEntries, isLoading: false });

      // Reload wallets and transactions if any entry had a linked transaction
      const hasLinkedEntries = activeEntries.some((e) => e.linkedTransactionId);
      if (hasLinkedEntries) {
        const { useWalletStore } = await import('./walletStore');
        const { useTransactionStore } = await import('./transactionStore');
        await Promise.all([
          useWalletStore.getState().loadWallets(),
          useTransactionStore.getState().loadTransactions(),
        ]);
      }

      if (useSyncStore.getState().syncKey) {
        const settled = allEntries.filter(
          (e) => e.contactId === contactId && e.status === 'settled'
        );
        for (const e of settled) {
          onLocalChange('loan_entries', e);
        }
      }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },
}));
