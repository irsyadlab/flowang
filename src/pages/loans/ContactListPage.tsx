import { useNavigate } from 'react-router-dom';
import { Plus, Handshake } from 'lucide-react';
import { useLoanContacts } from '@/hooks/useLoanContacts';
import { useLoanEntryStore } from '@/stores/loanEntryStore';
import { countContactsWithActiveLoans } from '@/lib/loanUtils';
import ContactList from '@/components/loans/ContactList';
import EmptyState from '@/components/shared/EmptyState';
import { Badge } from '@/components/ui/badge';
import { useStickyHeader } from '@/hooks/useStickyHeader';

export default function ContactListPage() {
  const stickyHeader = useStickyHeader();
  const navigate = useNavigate();
  const { contacts, summaries } = useLoanContacts();
  const { entries } = useLoanEntryStore();

  const activeCount = countContactsWithActiveLoans(
    contacts,
    new Map(entries.map((e) => [e.contactId, entries.filter((en) => en.contactId === e.contactId)]))
  );

  return (
    <div className="flex flex-col gap-4 pb-28">
      <div className={`${stickyHeader} px-4 py-3 flex items-center gap-2`}>
        <h1 className="text-xl font-bold text-foreground">Hutang</h1>
        {activeCount > 0 && (
          <Badge variant="secondary" className="text-[10px]">
            {activeCount} aktif
          </Badge>
        )}
      </div>
      <div className="px-4 flex flex-col gap-4">

      {contacts.length === 0 ? (
        <EmptyState
          icon={Handshake}
          title="Belum ada catatan hutang"
          description="Mulai catat hutang atau piutang dengan menambahkan entri baru."
        />
      ) : (
        <ContactList
          contacts={contacts}
          summaries={summaries}
          onContactClick={(contactId) => navigate(`/loans/${contactId}`)}
        />
      )}
      </div>

      {/* FAB */}
      <div className="fixed bottom-[calc(4rem+1.5rem)] left-1/2 z-40 w-full max-w-[480px] -translate-x-1/2 px-4 pointer-events-none">
        <div className="flex justify-end">
          <button
            type="button"
            data-tour="loans-fab"
            onClick={() => navigate('/loans/new')}
            className="pointer-events-auto flex items-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition-all hover:bg-primary/90 active:scale-95"
            aria-label="Tambah catatan hutang"
          >
            <Plus className="h-4 w-4" />
            Tambah
          </button>
        </div>
      </div>
    </div>
  );
}
