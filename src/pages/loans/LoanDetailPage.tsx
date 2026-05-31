import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, CheckCheck, Trash2 } from 'lucide-react';
import { useLoanDetail } from '@/hooks/useLoanDetail';
import LoanSummaryCard from '@/components/loans/LoanSummaryCard';
import LoanEntryCard from '@/components/loans/LoanEntryCard';
import RepaymentForm from '@/components/loans/RepaymentForm';
import RepaymentList from '@/components/loans/RepaymentList';
import ErrorMessage from '@/components/shared/ErrorMessage';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import ResponsiveSheet from '@/components/shared/ResponsiveSheet';
import { Button } from '@/components/ui/button';
import type { LoanEntry } from '@/types';

export default function LoanDetailPage() {
  const navigate = useNavigate();
  const {
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
  } = useLoanDetail();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [activeRepaymentEntry, setActiveRepaymentEntry] = useState<LoanEntry | null>(null);

  if (!contact) {
    return <ErrorMessage message="Kontak tidak ditemukan" />;
  }

  return (
    <div>
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background px-4 flex items-center gap-2 py-3">
        <button
          type="button"
          onClick={() => navigate('/loans')}
          className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          aria-label="Kembali"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-lg font-bold text-foreground truncate flex-1">{contact.name}</h1>
        <button
          type="button"
          onClick={() => setShowDeleteDialog(true)}
          className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          aria-label="Hapus kontak"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <div className="flex flex-col gap-4 px-4 pb-28">

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

      {/* Loan entries */}
      {sortedEntries.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-10 text-center">
          <p className="text-sm text-muted-foreground">Belum ada catatan hutang</p>
          <p className="text-xs text-muted-foreground/60">Tambahkan entri hutang pertama untuk mulai mencatat.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {sortedEntries.map((entry) => {
            const entryRepayments = getEntryRepayments(entry.id);
            return (
              <div key={entry.id} className="flex flex-col gap-2">
                <LoanEntryCard
                  entry={entry}
                  categoryName={getCategoryName(entry.categoryId)}
                  isLend={entry.direction === 'lend'}
                  isSettled={entry.status === 'settled'}
                  hasRepayments={entryRepayments.length > 0}
                  onToggleSettled={toggleEntryStatus}
                  onDelete={deleteEntry}
                  onCatatPembayaran={() => setActiveRepaymentEntry(entry)}
                />
                {entryRepayments.length > 0 && (
                  <div className="ml-2 pl-3 border-l-2 border-border/40">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Riwayat Pembayaran</p>
                    <RepaymentList
                      repayments={entryRepayments}
                      loanEntry={entry}
                      categories={categories}
                      onDelete={deleteRepayment}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

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

      {/* Repayment sheet */}
      <ResponsiveSheet
        open={activeRepaymentEntry !== null}
        onOpenChange={(open) => { if (!open) setActiveRepaymentEntry(null); }}
        title="Catat Pembayaran"
      >
        {activeRepaymentEntry && (
          <RepaymentForm
            loanEntry={activeRepaymentEntry}
            onSubmit={async (data) => {
              await addRepayment(data, activeRepaymentEntry);
              setActiveRepaymentEntry(null);
            }}
            onCancel={() => setActiveRepaymentEntry(null)}
          />
        )}
      </ResponsiveSheet>

      {/* Delete contact dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Hapus Kontak"
        description={
          contactEntries.length > 0
            ? `Yakin ingin menghapus "${contact.name}"? ${contactEntries.length} entri hutang akan ikut terhapus secara permanen.`
            : `Yakin ingin menghapus "${contact.name}"?`
        }
        onConfirm={handleDeleteContact}
      />
    </div>
    </div>
  );
}
