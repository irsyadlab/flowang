import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLoanContacts } from '@/hooks/useLoanContacts';
import { useLoanEntries } from '@/hooks/useLoanEntries';
import { useLoanRepayments } from '@/hooks/useLoanRepayments';
import { useCategoryStore } from '@/stores/categoryStore';
import { sortEntriesByDate } from '@/lib/loanUtils';

export function useLoanDetail() {
  const { contactId } = useParams<{ contactId: string }>();
  const navigate = useNavigate();

  const { contacts, loadContacts, deleteContact } = useLoanContacts();
  const { entries, loadEntries, toggleEntryStatus, deleteEntry, markAllSettled, isLoading } = useLoanEntries();
  const { repayments, loadRepayments, addRepayment, deleteRepayment } = useLoanRepayments();
  const categories = useCategoryStore((s) => s.categories);

  useEffect(() => {
    loadContacts();
    loadEntries();
    loadRepayments();
  }, [loadContacts, loadEntries, loadRepayments]);

  const contact = contacts.find((c) => c.id === contactId);
  const contactEntries = entries.filter((e) => e.contactId === contactId);
  const sortedEntries = sortEntriesByDate(contactEntries);
  const hasActiveEntries = contactEntries.some((e) => e.status === 'active');

  const totalLend = contactEntries
    .filter((e) => e.direction === 'lend' && e.status === 'active')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalBorrow = contactEntries
    .filter((e) => e.direction === 'borrow' && e.status === 'active')
    .reduce((sum, e) => sum + e.amount, 0);

  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return 'Tanpa kategori';
    const cat = categories.find((c) => c.id === categoryId);
    return cat ? cat.name : 'Tanpa kategori';
  };

  const getEntryRepayments = (entryId: string) =>
    repayments.filter((r) => r.loanEntryId === entryId);

  const handleDeleteContact = async () => {
    if (contactId) {
      await deleteContact(contactId);
      navigate('/loans');
    }
  };

  return {
    contactId,
    contact,
    contactEntries,
    sortedEntries,
    hasActiveEntries,
    totalLend,
    totalBorrow,
    isLoading,
    categories,
    getCategoryName,
    getEntryRepayments,
    toggleEntryStatus,
    deleteEntry,
    markAllSettled,
    addRepayment,
    deleteRepayment,
    handleDeleteContact,
  };
}
