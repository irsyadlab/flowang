import { useShallow } from 'zustand/react/shallow';
import { useCategoryStore } from '../stores/categoryStore';

export function useCategories() {
  const {
    categories,
    isLoading,
    error,
    loadCategories,
    addCategory,
    updateCategory,
    deleteCategory,
  } = useCategoryStore(
    useShallow((s) => ({
      categories: s.categories,
      isLoading: s.isLoading,
      error: s.error,
      loadCategories: s.loadCategories,
      addCategory: s.addCategory,
      updateCategory: s.updateCategory,
      deleteCategory: s.deleteCategory,
    })),
  );

  return {
    // Data
    categories,
    isLoading,
    error,
    
    // Actions
    loadCategories,
    addCategory,
    updateCategory,
    deleteCategory,
  };
}