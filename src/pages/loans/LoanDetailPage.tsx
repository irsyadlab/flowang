import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, CheckCheck } from 'lucide-react';
import { useLoanContacts } from '@/hooks/useLoanContacts';
import { useLoanEntries } from '@/hooks/useLoanEntries';
import { sortEntriesByDate } from '@/lib/loanUtils';
import LoanSummaryCard from '@/components/loans/LoanSummaryCard';
import LoanEntryList from '@/components/loans/LoanEntryList';
import ErrorMessage from '@/components/shared/ErrorMessage';
import { Button } from '@/components/ui/button';

export default function LoanDetailPage() {
  const { contactId } = useParams<{ contactId: string }>();
  const navigate = useNavigate();
  const { contacts, loadContacts } = useLoanContacts();
  const { entries, loadEntries, toggleEntryStatus, deleteEntry, markAllSettled, isLoading } = useLoanEntries();

  useEffect(() => {
    loadContacts();
    loadEntries();
  }, [loadContacts, loadEntries]);

  const contact = contacts.find((c) => c.id === contactId);
  const contactEntries = entries.filter((e) => e.contactId === contactId);
  const sortedEntries = sortEntriesByDate(contactEntries);
  const hasActiveEntries = contactEntries.some((e) => e.status === 'active');

  if (!contact) {
    return <ErrorMessage message="Kontak tidak ditemukan" />;
  }

  const totalLend = contactEntries
    .filter((e) => e.direction === 'lend' && e.status === 'active')
    .reduce((sum, e) => sum + e.amount, 0);
  const totalBorrow = contactEntries
    .filter((e) => e.direction === 'borrow' && e.status === 'active')
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="flex flex-col gap-4 p-4 pb-28">
      {/* Header */}
      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={() => navigate('/loans')}
          className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          aria-label="Kembali"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-lg font-bold text-foreground truncate flex-1">{contact.name}</h1>
      </div>

      <LoanSummaryCard totalLend={totalLend} totalBorrow={totalBorrow} />

      <Button
        variant="outline"
        size="sm"
        className="w-full gap-2 rounded-xl border-2 disabled:opacity-40 disabled:border-border disabled:text-muted-foreground"
        style={
          hasActiveEntries
            ? {
                borderColor: 'color-mix(in srgb, var(--income) 60%, transparent)',
                color: 'var(--income)',
                backgroundColor: 'var(--income-bg)',
              }
            : undefined
        }
        disabled={!hasActiveEntries || isLoading}
        onClick={() => contactId && markAllSettled(contactId)}
      >
        <CheckCheck className="h-4 w-4" />
        {isLoading ? 'Memproses...' : 'Tandai Semua Lunas'}
      </Button>

      <LoanEntryList
        entries={sortedEntries}
        onToggleSettled={toggleEntryStatus}
        onDelete={deleteEntry}
      />

      {/* FAB */}
      <div className="fixed bottom-[calc(4rem+1.5rem)] left-1/2 z-40 w-full max-w-[480px] -translate-x-1/2 px-4 pointer-events-none">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => navigate(`/loans/${contactId}/new`)}
            className="pointer-events-auto flex items-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition-all hover:bg-primary/90 active:scale-95"
            aria-label="Tambah entri hutang"
          >
            <Plus className="h-4 w-4" />
            Tambah
          </button>
        </div>
      </div>
    </div>
  );
}
