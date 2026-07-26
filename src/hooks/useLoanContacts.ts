import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useLoanContactStore } from '../stores/loanContactStore';
import { useLoanEntryStore } from '../stores/loanEntryStore';
import type { ContactSummary } from '../types';
import { computeContactSummary } from '../lib/loanUtils';

export function useLoanContacts() {
  const {
    contacts,
    isLoading,
    error,
    loadContacts,
    addContact,
    updateContact,
    deleteContact,
  } = useLoanContactStore(
    useShallow((s) => ({
      contacts: s.contacts,
      isLoading: s.isLoading,
      error: s.error,
      loadContacts: s.loadContacts,
      addContact: s.addContact,
      updateContact: s.updateContact,
      deleteContact: s.deleteContact,
    })),
  );

  const entries = useLoanEntryStore((s) => s.entries);

  const summaries = useMemo(() => {
    const map = new Map<string, ContactSummary>();
    for (const contact of contacts) {
      const contactEntries = entries.filter((e) => e.contactId === contact.id);
      const summary = computeContactSummary(contactEntries);
      map.set(contact.id, { contactId: contact.id, ...summary });
    }
    return map;
  }, [contacts, entries]);

  return {
    contacts,
    isLoading,
    error,
    summaries,
    loadContacts,
    addContact,
    updateContact,
    deleteContact,
  };
}
