import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useLoanRepaymentStore } from '../stores/loanRepaymentStore';

export function useLoanRepayments() {
  const {
    repayments,
    isLoading,
    error,
    loadRepayments,
    addRepayment,
    deleteRepayment,
  } = useLoanRepaymentStore(
    useShallow((s) => ({
      repayments: s.repayments,
      isLoading: s.isLoading,
      error: s.error,
      loadRepayments: s.loadRepayments,
      addRepayment: s.addRepayment,
      deleteRepayment: s.deleteRepayment,
    })),
  );

  const getRepaymentsByLoanEntryId = useMemo(() => {
    return (loanEntryId: string) => {
      return repayments.filter((r) => r.loanEntryId === loanEntryId);
    };
  }, [repayments]);

  return {
    repayments,
    isLoading,
    error,
    loadRepayments,
    addRepayment,
    deleteRepayment,
    getRepaymentsByLoanEntryId,
  };
}
