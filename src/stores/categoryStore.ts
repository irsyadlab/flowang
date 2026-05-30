import { create } from 'zustand';
import type { Category } from '../types';
import * as categoryDb from '../db/categoryDb';
import { getDB } from '../db/db';
import { getAllTransactions } from '../db/transactionDb';
import { useUIStore } from './uiStore';
import { useSyncStore } from '../sync/syncStore';
import { onLocalChange } from '../sync/syncManager';
import { localISOString } from '../lib/utils';

interface CategoryState {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
}

interface CategoryActions {
  loadCategories: () => Promise<void>;
  addCategory: (data: Omit<Category, 'id' | 'createdAt'>) => Promise<void>;
  updateCategory: (id: string, data: Partial<Omit<Category, 'id' | 'createdAt'>>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
}

export const useCategoryStore = create<CategoryState & CategoryActions>((set, get) => ({
  categories: [],
  isLoading: false,
  error: null,

  loadCategories: async () => {
    if (!useUIStore.getState().dbReady) return;
    
    set({ isLoading: true, error: null });
    try {
      const db = getDB();
      if (!db) throw new Error('Database not initialized');
      
      const categories = await categoryDb.getAllCategories(db);
      set({ categories, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addCategory: async (data) => {
    if (!useUIStore.getState().dbReady) return;
    
    set({ isLoading: true, error: null });
    try {
      const db = getDB();
      if (!db) throw new Error('Database not initialized');
      
      const category: Category = {
        id: crypto.randomUUID(),
        name: data.name,
        type: data.type,
        isDefault: data.isDefault ?? false,
        createdAt: localISOString(),
      };
      
      await categoryDb.addCategory(db, category);
      set((state) => ({
        categories: [...state.categories, category],
        isLoading: false,
      }));

      if (useSyncStore.getState().syncKey) {
        onLocalChange('categories', category);
      }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  updateCategory: async (id, data) => {
    if (!useUIStore.getState().dbReady) return;
    
    set({ isLoading: true, error: null });
    try {
      const db = getDB();
      if (!db) throw new Error('Database not initialized');
      
      const existing = get().categories.find((c) => c.id === id);
      if (!existing) throw new Error('Category not found');
      
      const updated: Category = {
        ...existing,
        ...data,
      };
      
      await categoryDb.updateCategory(db, updated);
      set((state) => ({
        categories: state.categories.map((c) => (c.id === id ? updated : c)),
        isLoading: false,
      }));

      if (useSyncStore.getState().syncKey) {
        onLocalChange('categories', updated);
      }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  deleteCategory: async (id) => {
    if (!useUIStore.getState().dbReady) return;
    
    set({ isLoading: true, error: null });
    try {
      const db = getDB();
      if (!db) throw new Error('Database not initialized');
      
      const category = get().categories.find((c) => c.id === id);
      if (!category) throw new Error('Category not found');
      
      // Check if category is default
      if (category.isDefault) {
        throw new Error('Kategori default tidak dapat dihapus');
      }
      
      // Check if category is used by any transactions
      const allTransactions = await getAllTransactions(db);
      const hasTransactions = allTransactions.some((t) => t.categoryId === id);
      
      if (hasTransactions) {
        throw new Error('Kategori masih digunakan');
      }
      
      // Cascade set null: update all LoanEntry and Repayment records that use this categoryId,
      // then delete the category — all in one atomic IDBTransaction (Requirements 6.4)
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(['categories', 'loan_entries', 'loan_repayments'], 'readwrite');
        tx.onerror = () =>
          reject(new Error(`Delete category failed: ${tx.error?.message || 'Unknown error'}`));
        tx.onabort = () => reject(new Error('Transaction aborted'));

        const loanEntriesStore = tx.objectStore('loan_entries');
        const loanRepaymentsStore = tx.objectStore('loan_repayments');
        const categoriesStore = tx.objectStore('categories');

        let pendingOps = 0;
        let allCursorsComplete = false;

        const checkDone = () => {
          if (allCursorsComplete && pendingOps === 0) {
            categoriesStore.delete(id);
            tx.oncomplete = () => resolve();
          }
        };

        // Cascade set null on loan_entries
        const loanEntriesCursor = loanEntriesStore.openCursor();
        loanEntriesCursor.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;
          if (cursor) {
            const entry = cursor.value as Record<string, unknown>;
            if (entry['categoryId'] === id) {
              entry['categoryId'] = undefined;
              pendingOps++;
              const updateReq = cursor.update(entry);
              updateReq.onsuccess = () => {
                pendingOps--;
                checkDone();
              };
              updateReq.onerror = () => {
                tx.abort();
                reject(new Error(`Failed to update loan entry: ${updateReq.error?.message || 'Unknown error'}`));
              };
            }
            cursor.continue();
          } else {
            // loan_entries cursor done; now open loan_repayments cursor
            const repaymentsCursor = loanRepaymentsStore.openCursor();
            repaymentsCursor.onsuccess = (repEvent) => {
              const repCursor = (repEvent.target as IDBRequest<IDBCursorWithValue | null>).result;
              if (repCursor) {
                const repayment = repCursor.value as Record<string, unknown>;
                if (repayment['categoryId'] === id) {
                  repayment['categoryId'] = undefined;
                  pendingOps++;
                  const updateReq = repCursor.update(repayment);
                  updateReq.onsuccess = () => {
                    pendingOps--;
                    checkDone();
                  };
                  updateReq.onerror = () => {
                    tx.abort();
                    reject(new Error(`Failed to update repayment: ${updateReq.error?.message || 'Unknown error'}`));
                  };
                }
                repCursor.continue();
              } else {
                // Both cursors done
                allCursorsComplete = true;
                checkDone();
              }
            };
            repaymentsCursor.onerror = () => {
              tx.abort();
              reject(new Error(`Cursor error on loan_repayments: ${repaymentsCursor.error?.message || 'Unknown error'}`));
            };
          }
        };
        loanEntriesCursor.onerror = () => {
          tx.abort();
          reject(new Error(`Cursor error on loan_entries: ${loanEntriesCursor.error?.message || 'Unknown error'}`));
        };
      });

      set((state) => ({
        categories: state.categories.filter((c) => c.id !== id),
        isLoading: false,
      }));

      if (useSyncStore.getState().syncKey) {
        onLocalChange('categories', { id, _deleted: true });
      }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },
}));