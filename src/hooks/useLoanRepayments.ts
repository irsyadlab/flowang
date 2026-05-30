import { useMemo } from 'react';
import { useLoanRepaymentStore } from '../stores/loanRepaymentStore';

export function useLoanRepayments() {
  const {
    repayments,
    isLoading,
    error,
    loadRepayments,
    addRepayment,
    deleteRepayment,
  } = useLoanRepaymentStore();

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
