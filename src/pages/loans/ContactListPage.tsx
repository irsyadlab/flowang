import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Handshake } from 'lucide-react';
import { useLoanContacts } from '@/hooks/useLoanContacts';
import { useLoanEntryStore } from '@/stores/loanEntryStore';
import { countContactsWithActiveLoans } from '@/lib/loanUtils';
import ContactList from '@/components/loans/ContactList';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
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
    <div className="flex flex-col gap-4 p-4 pb-6">
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-foreground">Hutang</h1>
          {activeCount > 0 && (
            <Badge variant="secondary" className="text-[10px]">
              {activeCount} aktif
            </Badge>
          )}
        </div>
        <button
          type="button"
          onClick={() => navigate('/loans/new')}
          className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-95"
        >
          <Plus className="h-3.5 w-3.5" />
          Tambah
        </button>
      </div>

      {contacts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-6">
          <div className="flex flex-col items-center justify-center gap-4 px-4 py-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
              <Handshake className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">Belum ada kontak</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Tambahkan kontak pertama untuk mulai mencatat hutang-piutang.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/loans/new')}
              className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
            >
              Tambah Kontak
            </button>
          </div>
        </div>
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
    </div>
  );
}
