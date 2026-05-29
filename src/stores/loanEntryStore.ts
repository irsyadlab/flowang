import { create } from 'zustand';
import type { LoanEntry } from '../types';
import * as loanEntryDb from '../db/loanEntryDb';
import { getDB } from '../db/db';
import { useUIStore } from './uiStore';
import { localISOString } from '../lib/utils';

interface LoanEntryState {
  entries: LoanEntry[];
  isLoading: boolean;
  error: string | null;
}

interface LoanEntryActions {
  loadEntries: () => Promise<void>;
  addEntry: (data: Omit<LoanEntry, 'id' | 'status' | 'settledAt' | 'createdAt' | 'updatedAt'>) => Promise<void>;
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
        createdAt: now,
        updatedAt: now,
      };

      await loanEntryDb.addEntry(db, entry);
      set((state) => ({
        entries: [...state.entries, entry],
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
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

      await loanEntryDb.deleteEntry(db, id);
      set((state) => ({
        entries: state.entries.filter((e) => e.id !== id),
        isLoading: false,
      }));
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
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },
}));
