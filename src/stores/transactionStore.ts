import { create } from 'zustand';
import type { Transaction, TransactionFilter } from '../types';
import * as transactionDb from '../db/transactionDb';
import { getDB } from '../db/db';
import { useUIStore } from './uiStore';
import { useWalletStore } from './walletStore';
import { useSyncStore } from '../sync/syncStore';
import { onLocalChange } from '../sync/syncManager';

interface TransactionState {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  filter: TransactionFilter;
}

interface TransactionActions {
  loadTransactions: () => Promise<void>;
  addTransaction: (data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTransaction: (id: string, data: Partial<Omit<Transaction, 'id' | 'createdAt'>>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  setFilter: (filter: Partial<TransactionFilter>) => void;
  clearFilter: () => void;
}

function calculateWalletUpdates(
  transaction: Transaction,
  oldTransaction?: Transaction
): { walletId: string; delta: number }[] {
  const updates: { walletId: string; delta: number }[] = [];

  // If updating, reverse old transaction effects first
  if (oldTransaction) {
    if (oldTransaction.walletId) {
      if (oldTransaction.type === 'income') {
        updates.push({ walletId: oldTransaction.walletId, delta: -oldTransaction.amount });
      } else if (oldTransaction.type === 'expense') {
        updates.push({ walletId: oldTransaction.walletId, delta: oldTransaction.amount });
      } else if (oldTransaction.type === 'transfer' && oldTransaction.toWalletId) {
        updates.push({ walletId: oldTransaction.walletId, delta: oldTransaction.amount });
        updates.push({ walletId: oldTransaction.toWalletId, delta: -oldTransaction.amount });
      }
    }
  }

  // Apply new transaction effects
  if (transaction.walletId) {
    if (transaction.type === 'income') {
      updates.push({ walletId: transaction.walletId, delta: transaction.amount });
    } else if (transaction.type === 'expense') {
      updates.push({ walletId: transaction.walletId, delta: -transaction.amount });
    } else if (transaction.type === 'transfer' && transaction.toWalletId) {
      updates.push({ walletId: transaction.walletId, delta: -transaction.amount });
      updates.push({ walletId: transaction.toWalletId, delta: transaction.amount });
    } else if (transaction.type === 'adjustment_increase') {
      updates.push({ walletId: transaction.walletId, delta: transaction.amount });
    } else if (transaction.type === 'adjustment_decrease') {
      updates.push({ walletId: transaction.walletId, delta: -transaction.amount });
    }
  }

  return updates;
}

export const useTransactionStore = create<TransactionState & TransactionActions>((set, get) => ({
  transactions: [],
  isLoading: false,
  error: null,
  filter: {},

  loadTransactions: async () => {
    if (!useUIStore.getState().dbReady) return;
    
    set({ isLoading: true, error: null });
    try {
      const db = getDB();
      if (!db) throw new Error('Database not initialized');
      
      const transactions = await transactionDb.getAllTransactions(db);
      set({ transactions, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addTransaction: async (data) => {
    if (!useUIStore.getState().dbReady) return;
    
    set({ isLoading: true, error: null });
    try {
      const db = getDB();
      if (!db) throw new Error('Database not initialized');
      
      const now = new Date().toISOString();
      const transaction: Transaction = {
        id: crypto.randomUUID(),
        type: data.type,
        amount: data.amount,
        walletId: data.walletId,
        toWalletId: data.toWalletId,
        categoryId: data.categoryId,
        date: data.date,
        note: data.note,
        createdAt: now,
        updatedAt: now,
      };
      
      const walletUpdates = calculateWalletUpdates(transaction);
      await transactionDb.addTransaction(db, transaction, walletUpdates);
      
      set((state) => ({
        transactions: [...state.transactions, transaction],
        isLoading: false,
      }));
      
      // Reload wallets to reflect balance changes
      await useWalletStore.getState().loadWallets();

      if (useSyncStore.getState().syncKey) {
        onLocalChange('transactions', transaction);
      }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  updateTransaction: async (id, data) => {
    if (!useUIStore.getState().dbReady) return;
    
    set({ isLoading: true, error: null });
    try {
      const db = getDB();
      if (!db) throw new Error('Database not initialized');
      
      const existing = get().transactions.find((t) => t.id === id);
      if (!existing) throw new Error('Transaction not found');
      
      const updated: Transaction = {
        ...existing,
        ...data,
        updatedAt: new Date().toISOString(),
      };
      
      const walletUpdates = calculateWalletUpdates(updated, existing);
      await transactionDb.updateTransaction(db, id, updated, walletUpdates);
      
      set((state) => ({
        transactions: state.transactions.map((t) => (t.id === id ? updated : t)),
        isLoading: false,
      }));
      
      // Reload wallets to reflect balance changes
      await useWalletStore.getState().loadWallets();

      if (useSyncStore.getState().syncKey) {
        onLocalChange('transactions', updated);
      }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  deleteTransaction: async (id) => {
    if (!useUIStore.getState().dbReady) return;
    
    set({ isLoading: true, error: null });
    try {
      const db = getDB();
      if (!db) throw new Error('Database not initialized');
      
      const existing = get().transactions.find((t) => t.id === id);
      if (!existing) throw new Error('Transaction not found');
      
      if (existing.isCorrection) {
        set({ error: 'Transaksi koreksi tidak dapat dihapus', isLoading: false });
        return;
      }
      
      // Reverse wallet effects
      const walletUpdates = calculateWalletUpdates(existing).map((u) => ({
        ...u,
        delta: -u.delta,
      }));
      
      await transactionDb.deleteTransaction(db, id, walletUpdates);
      
      set((state) => ({
        transactions: state.transactions.filter((t) => t.id !== id),
        isLoading: false,
      }));
      
      // Reload wallets to reflect balance changes
      await useWalletStore.getState().loadWallets();

      if (useSyncStore.getState().syncKey) {
        onLocalChange('transactions', { id, _deleted: true });
      }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  setFilter: (filter) => {
    set((state) => ({
      filter: { ...state.filter, ...filter },
    }));
  },

  clearFilter: () => {
    set({ filter: {} });
  },
}));