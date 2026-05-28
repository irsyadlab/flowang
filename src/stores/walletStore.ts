import { create } from 'zustand';
import type { Wallet } from '../types';
import * as walletDb from '../db/walletDb';
import { getDB } from '../db/db';
import { getAllTransactions } from '../db/transactionDb';
import { useUIStore } from './uiStore';

interface WalletState {
  wallets: Wallet[];
  isLoading: boolean;
  error: string | null;
}

interface WalletActions {
  loadWallets: () => Promise<void>;
  addWallet: (data: Omit<Wallet, 'id' | 'createdAt' | 'updatedAt' | 'balance'>) => Promise<void>;
  updateWallet: (id: string, data: Partial<Omit<Wallet, 'id' | 'createdAt'>>) => Promise<void>;
  deleteWallet: (id: string) => Promise<void>;
  recalculateBalance: (walletId: string) => Promise<void>;
}

export const useWalletStore = create<WalletState & WalletActions>((set, get) => ({
  wallets: [],
  isLoading: false,
  error: null,

  loadWallets: async () => {
    if (!useUIStore.getState().dbReady) return;
    
    set({ isLoading: true, error: null });
    try {
      const db = getDB();
      if (!db) throw new Error('Database not initialized');
      
      const wallets = await walletDb.getAllWallets(db);
      set({ wallets, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addWallet: async (data) => {
    if (!useUIStore.getState().dbReady) return;
    
    set({ isLoading: true, error: null });
    try {
      const db = getDB();
      if (!db) throw new Error('Database not initialized');
      
      const now = new Date().toISOString();
      const wallet: Wallet = {
        id: crypto.randomUUID(),
        name: data.name,
        initialBalance: data.initialBalance,
        balance: data.initialBalance,
        createdAt: now,
        updatedAt: now,
      };
      
      await walletDb.addWallet(db, wallet);
      set((state) => ({
        wallets: [...state.wallets, wallet],
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  updateWallet: async (id, data) => {
    if (!useUIStore.getState().dbReady) return;
    
    set({ isLoading: true, error: null });
    try {
      const db = getDB();
      if (!db) throw new Error('Database not initialized');
      
      const existing = get().wallets.find((w) => w.id === id);
      if (!existing) throw new Error('Wallet not found');
      
      const updated: Wallet = {
        ...existing,
        ...data,
        updatedAt: new Date().toISOString(),
      };
      
      await walletDb.updateWallet(db, updated);
      set((state) => ({
        wallets: state.wallets.map((w) => (w.id === id ? updated : w)),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  deleteWallet: async (id) => {
    if (!useUIStore.getState().dbReady) return;
    
    set({ isLoading: true, error: null });
    try {
      const db = getDB();
      if (!db) throw new Error('Database not initialized');
      
      // Check if wallet has any transactions
      const allTransactions = await getAllTransactions(db);
      const hasTransactions = allTransactions.some(
        (t) => t.walletId === id || t.toWalletId === id
      );
      
      if (hasTransactions) {
        throw new Error('Cannot delete wallet with existing transactions');
      }
      
      await walletDb.deleteWallet(db, id);
      set((state) => ({
        wallets: state.wallets.filter((w) => w.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  recalculateBalance: async (walletId) => {
    if (!useUIStore.getState().dbReady) return;
    
    try {
      const db = getDB();
      if (!db) throw new Error('Database not initialized');
      
      const wallet = get().wallets.find((w) => w.id === walletId);
      if (!wallet) throw new Error('Wallet not found');
      
      const allTransactions = await getAllTransactions(db);
      
      // Calculate balance based on transactions
      let balanceDelta = 0;
      for (const t of allTransactions) {
        if (t.walletId === walletId) {
          if (t.type === 'income') {
            balanceDelta += t.amount;
          } else if (t.type === 'expense') {
            balanceDelta -= t.amount;
          } else if (t.type === 'transfer') {
            balanceDelta -= t.amount;
          }
        }
        if (t.toWalletId === walletId && t.type === 'transfer') {
          balanceDelta += t.amount;
        }
      }
      
      const newBalance = wallet.initialBalance + balanceDelta;
      
      const updated: Wallet = {
        ...wallet,
        balance: newBalance,
        updatedAt: new Date().toISOString(),
      };
      
      await walletDb.updateWallet(db, updated);
      set((state) => ({
        wallets: state.wallets.map((w) => (w.id === walletId ? updated : w)),
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },
}));