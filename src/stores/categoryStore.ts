import { create } from 'zustand';
import type { Category } from '../types';
import * as categoryDb from '../db/categoryDb';
import { getDB } from '../db/db';
import { getAllTransactions } from '../db/transactionDb';
import { useUIStore } from './uiStore';

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
        createdAt: new Date().toISOString(),
      };
      
      await categoryDb.addCategory(db, category);
      set((state) => ({
        categories: [...state.categories, category],
        isLoading: false,
      }));
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
        throw new Error('Cannot delete default category');
      }
      
      // Check if category is used by any transactions
      const allTransactions = await getAllTransactions(db);
      const hasTransactions = allTransactions.some((t) => t.categoryId === id);
      
      if (hasTransactions) {
        throw new Error('Cannot delete category with existing transactions');
      }
      
      await categoryDb.deleteCategory(db, id);
      set((state) => ({
        categories: state.categories.filter((c) => c.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },
}));