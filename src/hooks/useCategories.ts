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
  } = useCategoryStore();

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