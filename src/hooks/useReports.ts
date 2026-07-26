import { useMemo } from 'react';
import { useTransactionStore } from '../stores/transactionStore';
import {
  filterByDateRange,
  calculateSummary,
  groupByMonth,
  type ReportSummary,
  type MonthlyReportRow,
} from '../lib/reportEngine';

export function useReports() {
  const transactions = useTransactionStore((s) => s.transactions);
  const filter = useTransactionStore((s) => s.filter);

  // Get filtered transactions based on current filter
  const filteredTransactions = useMemo(() => {
    let result = transactions;

    if (filter.walletId) {
      result = result.filter(
        (t) => t.walletId === filter.walletId || t.toWalletId === filter.walletId
      );
    }

    if (filter.categoryId) {
      result = result.filter((t) => t.categoryId === filter.categoryId);
    }

    if (filter.type) {
      result = result.filter((t) => t.type === filter.type);
    }

    if (filter.dateFrom) {
      result = result.filter((t) => t.date >= filter.dateFrom!);
    }

    if (filter.dateTo) {
      result = result.filter((t) => t.date <= filter.dateTo!);
    }

    return result;
  }, [transactions, filter]);

  // Calculate summary using reportEngine
  const summary: ReportSummary = useMemo(
    () => calculateSummary(filteredTransactions),
    [filteredTransactions]
  );

  // Group transactions by month
  const monthlyReports: MonthlyReportRow[] = useMemo(
    () => groupByMonth(filteredTransactions),
    [filteredTransactions]
  );

  // Helper function to filter by custom date range
  const getSummaryByDateRange = (from: string, to: string): ReportSummary => {
    const filtered = filterByDateRange(filteredTransactions, from, to);
    return calculateSummary(filtered);
  };

  // Helper function to get monthly report by custom date range
  const getMonthlyReportByDateRange = (
    from: string,
    to: string
  ): MonthlyReportRow[] => {
    const filtered = filterByDateRange(filteredTransactions, from, to);
    return groupByMonth(filtered);
  };

  return {
    // Data
    transactions: filteredTransactions,
    summary,
    monthlyReports,
    
    // Actions
    getSummaryByDateRange,
    getMonthlyReportByDateRange,
  };
}