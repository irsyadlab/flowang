import { useShallow } from 'zustand/react/shallow';
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
  } = useTransactionStore(
    useShallow((s) => ({
      transactions: s.transactions,
      isLoading: s.isLoading,
      error: s.error,
      filter: s.filter,
      loadTransactions: s.loadTransactions,
      addTransaction: s.addTransaction,
      updateTransaction: s.updateTransaction,
      deleteTransaction: s.deleteTransaction,
      setFilter: s.setFilter,
      clearFilter: s.clearFilter,
    })),
  );

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