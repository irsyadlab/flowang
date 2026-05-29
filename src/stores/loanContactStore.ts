import { create } from 'zustand';
import type { LoanContact } from '../types';
import * as loanContactDb from '../db/loanContactDb';
import { getDB } from '../db/db';
import { useUIStore } from './uiStore';
import { localISOString } from '../lib/utils';

interface LoanContactState {
  contacts: LoanContact[];
  isLoading: boolean;
  error: string | null;
}

interface LoanContactActions {
  loadContacts: () => Promise<void>;
  addContact: (data: Omit<LoanContact, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  addContactAndGetId: (data: Omit<LoanContact, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateContact: (id: string, data: Partial<Omit<LoanContact, 'id' | 'createdAt'>>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
}

export const useLoanContactStore = create<LoanContactState & LoanContactActions>((set, get) => ({
  contacts: [],
  isLoading: false,
  error: null,

  loadContacts: async () => {
    if (!useUIStore.getState().dbReady) return;

    set({ isLoading: true, error: null });
    try {
      const db = getDB();
      if (!db) throw new Error('Database not initialized');

      const contacts = await loanContactDb.getAllContacts(db);
      set({ contacts, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addContact: async (data) => {
    if (!useUIStore.getState().dbReady) return;

    set({ isLoading: true, error: null });
    try {
      const db = getDB();
      if (!db) throw new Error('Database not initialized');

      const now = localISOString();
      const contact: LoanContact = {
        id: crypto.randomUUID(),
        name: data.name,
        note: data.note,
        createdAt: now,
        updatedAt: now,
      };

      await loanContactDb.addContact(db, contact);
      set((state) => ({
        contacts: [...state.contacts, contact],
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addContactAndGetId: async (data) => {
    if (!useUIStore.getState().dbReady) throw new Error('Database not ready');

    const db = getDB();
    if (!db) throw new Error('Database not initialized');

    const now = localISOString();
    const contact: LoanContact = {
      id: crypto.randomUUID(),
      name: data.name,
      note: data.note,
      createdAt: now,
      updatedAt: now,
    };

    await loanContactDb.addContact(db, contact);
    set((state) => ({ contacts: [...state.contacts, contact] }));
    return contact.id;
  },

  updateContact: async (id, data) => {
    if (!useUIStore.getState().dbReady) return;

    set({ isLoading: true, error: null });
    try {
      const db = getDB();
      if (!db) throw new Error('Database not initialized');

      const existing = get().contacts.find((c) => c.id === id);
      if (!existing) throw new Error('Contact not found');

      const updated: LoanContact = {
        ...existing,
        ...data,
        updatedAt: localISOString(),
      };

      await loanContactDb.updateContact(db, id, updated);
      set((state) => ({
        contacts: state.contacts.map((c) => (c.id === id ? updated : c)),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  deleteContact: async (id) => {
    if (!useUIStore.getState().dbReady) return;

    set({ isLoading: true, error: null });
    try {
      const db = getDB();
      if (!db) throw new Error('Database not initialized');

      await loanContactDb.deleteContact(db, id);
      set((state) => ({
        contacts: state.contacts.filter((c) => c.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },
}));
