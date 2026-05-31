import { create } from 'zustand';
import type { Wallet, Transaction } from '../types';
import * as walletDb from '../db/walletDb';
import { getDB } from '../db/db';
import { getAllTransactions, addTransactionWithWalletUpdate } from '../db/transactionDb';
import { useUIStore } from './uiStore';
import { useSyncStore } from '../sync/syncStore';
import { onLocalChange } from '../sync/syncManager';
import { localDateStr, localISOString, localTimeStr } from '../lib/utils';

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
      
      const now = localISOString();
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

      if (useSyncStore.getState().syncKey) {
        onLocalChange('wallets', wallet);
      }
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
      
      const balanceChanged = data.initialBalance !== undefined && data.initialBalance !== existing.initialBalance;
      
      if (balanceChanged) {
        const oldBalance = existing.initialBalance;
        const newBalance = data.initialBalance!;
        const delta = newBalance - oldBalance;
        const now = new Date();
        const today = localDateStr(now);
        const nowISO = localISOString(now);
        const currentTime = localTimeStr(now);
        
        const correctionTx: Transaction = {
          id: crypto.randomUUID(),
          type: delta > 0 ? 'adjustment_increase' : 'adjustment_decrease',
          amount: Math.abs(delta),
          walletId: id,
          date: today,
          time: currentTime,
          note: `Koreksi saldo: ${existing.name}`,
          isCorrection: true,
          createdAt: nowISO,
          updatedAt: nowISO,
        };
        
        const updatedWallet: Wallet = {
          ...existing,
          ...data,
          balance: existing.balance + delta,
          updatedAt: nowISO,
        };
        
        await addTransactionWithWalletUpdate(db, updatedWallet, correctionTx);
        
        // Reload both wallets and transactions
        const [wallets, transactions] = await Promise.all([
          walletDb.getAllWallets(db),
          getAllTransactions(db),
        ]);
        set({
          wallets,
          isLoading: false,
        });
        // Update transaction store too
        const { useTransactionStore } = await import('./transactionStore');
        useTransactionStore.setState({ transactions });

        if (useSyncStore.getState().syncKey) {
          onLocalChange('wallets', updatedWallet);
        }
      } else {
        const updated: Wallet = {
          ...existing,
          ...data,
          updatedAt: localISOString(),
        };
        
        await walletDb.updateWallet(db, updated);
        set((state) => ({
          wallets: state.wallets.map((w) => (w.id === id ? updated : w)),
          isLoading: false,
        }));

        if (useSyncStore.getState().syncKey) {
          onLocalChange('wallets', updated);
        }
      }
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
      const linkedTransactions = allTransactions.filter(
        (t) => t.walletId === id || t.toWalletId === id
      );
      
      if (linkedTransactions.length > 0) {
        throw new Error(`Wallet tidak dapat dihapus karena masih memiliki ${linkedTransactions.length} transaksi terkait`);
      }
      
      await walletDb.deleteWallet(db, id);
      set((state) => ({
        wallets: state.wallets.filter((w) => w.id !== id),
        isLoading: false,
      }));

      if (useSyncStore.getState().syncKey) {
        onLocalChange('wallets', { id, _deleted: true });
      }
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
          if (t.type === 'income' || t.type === 'adjustment_increase') {
            balanceDelta += t.amount;
          } else if (t.type === 'expense' || t.type === 'adjustment_decrease') {
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
        updatedAt: localISOString(),
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