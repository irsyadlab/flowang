import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Handshake } from 'lucide-react';
import { useLoanContacts } from '@/hooks/useLoanContacts';
import { useLoanEntryStore } from '@/stores/loanEntryStore';
import { countContactsWithActiveLoans } from '@/lib/loanUtils';
import ContactList from '@/components/loans/ContactList';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import EmptyState from '@/components/shared/EmptyState';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { Badge } from '@/components/ui/badge';

export default function ContactListPage() {
  const navigate = useNavigate();
  const { contacts, isLoading, summaries, loadContacts, deleteContact } = useLoanContacts();
  const { entries, loadEntries } = useLoanEntryStore();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  useEffect(() => {
    loadContacts();
    loadEntries();
  }, [loadContacts, loadEntries]);

  if (isLoading && contacts.length === 0) {
    return <LoadingSpinner fullscreen />;
  }

  const activeCount = countContactsWithActiveLoans(
    contacts,
    new Map(entries.map((e) => [e.contactId, entries.filter((en) => en.contactId === e.contactId)]))
  );

  const deleteContactEntries = deleteTarget
    ? entries.filter((e) => e.contactId === deleteTarget)
    : [];
  const deleteContactName = contacts.find((c) => c.id === deleteTarget)?.name || '';

  return (
    <div className="flex flex-col gap-4 p-4 pb-28">
      <div className="flex items-center gap-2 pt-1">
        <h1 className="text-xl font-bold text-foreground">Hutang</h1>
        {activeCount > 0 && (
          <Badge variant="secondary" className="text-[10px]">
            {activeCount} aktif
          </Badge>
        )}
      </div>

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
          onContactDelete={(contactId) => setDeleteTarget(contactId)}
        />
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Hapus Kontak"
        description={
          deleteContactEntries.length > 0
            ? `Yakin ingin menghapus "${deleteContactName}"? ${deleteContactEntries.length} entri hutang akan ikut terhapus secara permanen.`
            : `Yakin ingin menghapus "${deleteContactName}"?`
        }
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteContact(deleteTarget);
            setDeleteTarget(null);
          }
        }}
      />

      {/* FAB */}
      <div className="fixed bottom-[calc(4rem+1.5rem)] left-1/2 z-40 w-full max-w-[480px] -translate-x-1/2 px-4 pointer-events-none">
        <div className="flex justify-end">
          <button
            type="button"
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
