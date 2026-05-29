import { useMemo } from 'react';
import { useLoanEntryStore } from '../stores/loanEntryStore';
import { computeContactSummary, getNetBalanceLabel, sortEntriesByDate } from '../lib/loanUtils';

export function useLoanEntries() {
  const {
    entries,
    isLoading,
    error,
    loadEntries,
    addEntry,
    updateEntry,
    deleteEntry,
    toggleEntryStatus,
    markAllSettled,
  } = useLoanEntryStore();

  const sortedEntries = useMemo(() => sortEntriesByDate(entries), [entries]);

  const getContactSummary = useMemo(() => {
    return (contactId: string) => {
      const contactEntries = entries.filter((e) => e.contactId === contactId);
      return computeContactSummary(contactEntries);
    };
  }, [entries]);

  const getNetBalance = useMemo(() => {
    return (contactId: string) => {
      const contactEntries = entries.filter((e) => e.contactId === contactId);
      const summary = computeContactSummary(contactEntries);
      return getNetBalanceLabel(summary.totalLend, summary.totalBorrow);
    };
  }, [entries]);

  return {
    entries,
    sortedEntries,
    isLoading,
    error,
    loadEntries,
    addEntry,
    updateEntry,
    deleteEntry,
    toggleEntryStatus,
    markAllSettled,
    getContactSummary,
    getNetBalance,
  };
}
