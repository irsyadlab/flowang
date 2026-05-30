import { create } from 'zustand';
import type { LoanEntry, LoanEntryFormData, LinkedTransactionInput } from '../types';
import * as loanEntryDb from '../db/loanEntryDb';
import { getDB } from '../db/db';
import { useUIStore } from './uiStore';
import { localISOString } from '../lib/utils';
import { useSyncStore } from '../sync/syncStore';
import { onLocalChange } from '../sync/syncManager';
import { createLoanEntryWithTransaction, deleteLoanEntryWithCascade } from '../lib/transactionIntegrator';
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
        note: data.note,
        categoryId: data.categoryId,
        remainingAmount: data.amount,
        linkedTransactionId: undefined,
        createdAt: now,
        updatedAt: now,
      };

      if (data.createTransaction && data.walletId) {
        // Build LinkedTransactionInput and call Transaction_Integrator atomically
        const transactionData: LinkedTransactionInput = {
          walletId: data.walletId,
          categoryId: data.categoryId,
          date: data.date,
          amount: data.amount,
          note: data.note,
        };
        await createLoanEntryWithTransaction(db, entry, transactionData);
      } else {
        // No transaction integration — save entry directly
        await loanEntryDb.addEntry(db, entry);
      }

      set((state) => ({
        entries: [...state.entries, entry],
        isLoading: false,
      }));
      if (useSyncStore.getState().syncKey) {
        onLocalChange('loan_entries', entry);
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
      await deleteLoanEntryWithCascade(db, id);
      set((state) => ({
        entries: state.entries.filter((e) => e.id !== id),
        isLoading: false,
      }));

      // Reload repayments to keep state in sync after cascade delete
      // Lazy import to avoid circular dependency (loanRepaymentStore imports loanEntryStore)
      const { useLoanRepaymentStore } = await import('./loanRepaymentStore');
      useLoanRepaymentStore.getState().loadRepayments();

      if (useSyncStore.getState().syncKey) {
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

      const updated = await loanEntryDb.toggleEntryStatus(db, id);
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

  markAllSettled: async (contactId) => {
    if (!useUIStore.getState().dbReady) return;

    set({ isLoading: true, error: null });
    try {
      const db = getDB();
      if (!db) throw new Error('Database not initialized');

      await loanEntryDb.markAllSettled(db, contactId);
      const now = localISOString();
      set((state) => ({
        entries: state.entries.map((e) =>
          e.contactId === contactId && e.status === 'active'
            ? { ...e, status: 'settled' as const, settledAt: now, updatedAt: now }
            : e
        ),
        isLoading: false,
      }));
      if (useSyncStore.getState().syncKey) {
        // Broadcast each settled entry individually
        const settled = get().entries.filter(
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
