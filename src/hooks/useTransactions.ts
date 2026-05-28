import { useTransactionStore } from '../stores/transactionStore';

export function useTransactions() {
  const {
    transactions,
    isLoading,
    error,
    filter,
    loadTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    setFilter,
    clearFilter,
  } = useTransactionStore();

  return {
    // Data
    transactions,
    isLoading,
    error,
    filter,
    
    // Actions
    loadTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    setFilter,
    clearFilter,
  };
}