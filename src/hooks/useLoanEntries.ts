import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
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
  } = useLoanEntryStore(
    useShallow((s) => ({
      entries: s.entries,
      isLoading: s.isLoading,
      error: s.error,
      loadEntries: s.loadEntries,
      addEntry: s.addEntry,
      updateEntry: s.updateEntry,
      deleteEntry: s.deleteEntry,
      toggleEntryStatus: s.toggleEntryStatus,
      markAllSettled: s.markAllSettled,
    })),
  );

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
