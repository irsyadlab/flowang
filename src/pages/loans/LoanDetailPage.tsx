import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, CheckCheck, Check, Trash2, CreditCard } from 'lucide-react';
import { useLoanContacts } from '@/hooks/useLoanContacts';
import { useLoanEntries } from '@/hooks/useLoanEntries';
import { useLoanRepayments } from '@/hooks/useLoanRepayments';
import { useCategoryStore } from '@/stores/categoryStore';
import { sortEntriesByDate } from '@/lib/loanUtils';
import LoanSummaryCard from '@/components/loans/LoanSummaryCard';
import RepaymentForm from '@/components/loans/RepaymentForm';
import RepaymentList from '@/components/loans/RepaymentList';
import ErrorMessage from '@/components/shared/ErrorMessage';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { LoanEntry } from '@/types';

export default function LoanDetailPage() {
  const { contactId } = useParams<{ contactId: string }>();
  const navigate = useNavigate();
  const { contacts, loadContacts, deleteContact } = useLoanContacts();
  const { entries, loadEntries, toggleEntryStatus, deleteEntry, markAllSettled, isLoading } = useLoanEntries();
  const { repayments, loadRepayments, addRepayment, deleteRepayment } = useLoanRepayments();
  const categories = useCategoryStore((s) => s.categories);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [activeRepaymentEntry, setActiveRepaymentEntry] = useState<LoanEntry | null>(null);

  useEffect(() => {
    loadContacts();
    loadEntries();
    loadRepayments();
  }, [loadContacts, loadEntries, loadRepayments]);

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

  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return 'Tanpa kategori';
    const cat = categories.find((c) => c.id === categoryId);
    return cat ? cat.name : 'Tanpa kategori';
  };

  const getEntryRepayments = (entryId: string) =>
    repayments.filter((r) => r.loanEntryId === entryId);

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
        <button
          type="button"
          onClick={() => setShowDeleteDialog(true)}
          className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          aria-label="Hapus kontak"
        >
          <Trash2 className="h-4 w-4" />
        </button>
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

      {/* Loan entries with repayments */}
      {sortedEntries.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-10 text-center">
          <p className="text-sm text-muted-foreground">Belum ada catatan hutang</p>
          <p className="text-xs text-muted-foreground/60">Tambahkan entri hutang pertama untuk mulai mencatat.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {sortedEntries.map((entry) => {
            const isLend = entry.direction === 'lend';
            const isSettled = entry.status === 'settled';
            const entryRepayments = getEntryRepayments(entry.id);
            const hasRepayments = entryRepayments.length > 0;
            const categoryName = getCategoryName(entry.categoryId);

            return (
              <div key={entry.id} className="flex flex-col gap-2">
                {/* LoanEntry card */}
                <LoanEntryCard
                  entry={entry}
                  categoryName={categoryName}
                  isLend={isLend}
                  isSettled={isSettled}
                  hasRepayments={hasRepayments}
                  onToggleSettled={toggleEntryStatus}
                  onDelete={deleteEntry}
                  onCatatPembayaran={() => setActiveRepaymentEntry(entry)}
                />

                {/* RepaymentList below each entry */}
                {hasRepayments && (
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

      {/* RepaymentForm Sheet */}
      <Sheet
        open={activeRepaymentEntry !== null}
        onOpenChange={(open) => {
          if (!open) setActiveRepaymentEntry(null);
        }}
      >
        <SheetContent side="bottom" className="max-h-[90dvh] overflow-y-auto rounded-t-2xl pb-safe">
          <SheetHeader className="pb-2">
            <SheetTitle>Catat Pembayaran</SheetTitle>
          </SheetHeader>
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
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Hapus Kontak"
        description={
          contactEntries.length > 0
            ? `Yakin ingin menghapus "${contact.name}"? ${contactEntries.length} entri hutang akan ikut terhapus secara permanen.`
            : `Yakin ingin menghapus "${contact.name}"?`
        }
        onConfirm={async () => {
          if (contactId) {
            await deleteContact(contactId);
            navigate('/loans');
          }
        }}
      />
    </div>
  );
}

// ─── LoanEntryCard ────────────────────────────────────────────────────────────

interface LoanEntryCardProps {
  entry: LoanEntry;
  categoryName: string;
  isLend: boolean;
  isSettled: boolean;
  hasRepayments: boolean;
  onToggleSettled: (id: string) => void;
  onDelete: (id: string) => void;
  onCatatPembayaran: () => void;
}

function LoanEntryCard({
  entry,
  categoryName,
  isLend,
  isSettled,
  hasRepayments,
  onToggleSettled,
  onDelete,
  onCatatPembayaran,
}: LoanEntryCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const directionLabel = isLend ? 'Piutang' : 'Hutang';

  return (
    <>
      <div
        className={`rounded-xl border bg-card px-3.5 py-3 transition-opacity ${
          isSettled ? 'border-border/40 opacity-60' : 'border-border/60'
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            {/* Badges */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className="text-xs font-medium px-1.5 py-0.5 rounded-md border"
                style={
                  isLend
                    ? {
                        backgroundColor: 'var(--income-bg)',
                        color: 'var(--income)',
                        borderColor: 'color-mix(in srgb, var(--income) 35%, transparent)',
                      }
                    : {
                        backgroundColor: 'var(--expense-bg)',
                        color: 'var(--expense)',
                        borderColor: 'color-mix(in srgb, var(--expense) 35%, transparent)',
                      }
                }
              >
                {directionLabel}
              </span>

              {isSettled ? (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">
                  Lunas
                </span>
              ) : (
                <span
                  className="text-[10px] font-medium px-1.5 py-0.5 rounded-md border"
                  style={{
                    backgroundColor: 'var(--transfer-bg)',
                    color: 'var(--transfer)',
                    borderColor: 'color-mix(in srgb, var(--transfer) 35%, transparent)',
                  }}
                >
                  Aktif
                </span>
              )}
            </div>

            {/* Amount */}
            <p
              className={`mt-1.5 text-base font-semibold tabular-nums ${isSettled ? 'text-muted-foreground line-through' : ''}`}
              style={isSettled ? undefined : { color: isLend ? 'var(--income)' : 'var(--expense)' }}
            >
              {formatCurrency(entry.amount)}
            </p>

            {/* Remaining amount — shown for active entries with at least one repayment (Requirements 1.7) */}
            {!isSettled && hasRepayments && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Sisa:{' '}
                <span className="font-semibold text-foreground">
                  {formatCurrency(entry.remainingAmount)}
                </span>
              </p>
            )}

            <p className="text-xs text-muted-foreground mt-0.5">{formatDate(entry.date)}</p>

            {/* Category name (Requirements 4.6) */}
            <p className="text-xs text-muted-foreground/70 mt-0.5">{categoryName}</p>

            {entry.note && (
              <p className="text-xs text-muted-foreground/70 italic mt-0.5">{entry.note}</p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Catat Pembayaran button — only for active entries (Requirements 1.1) */}
            {!isSettled && (
              <button
                type="button"
                onClick={onCatatPembayaran}
                className="flex h-8 w-8 items-center justify-center rounded-xl border transition-colors hover:opacity-80"
                style={{
                  backgroundColor: 'var(--transfer-bg)',
                  color: 'var(--transfer)',
                  borderColor: 'color-mix(in srgb, var(--transfer) 30%, transparent)',
                }}
                aria-label="Catat pembayaran"
              >
                <CreditCard className="h-3.5 w-3.5" />
              </button>
            )}

            {/* Toggle settled */}
            <button
              type="button"
              onClick={() => onToggleSettled(entry.id)}
              className="flex h-8 w-8 items-center justify-center rounded-xl border transition-colors hover:opacity-80"
              style={
                isSettled
                  ? undefined
                  : {
                      backgroundColor: 'var(--income-bg)',
                      color: 'var(--income)',
                      borderColor: 'color-mix(in srgb, var(--income) 30%, transparent)',
                    }
              }
              aria-label={isSettled ? 'Batalkan lunas' : 'Tandai lunas'}
            >
              <Check className="h-3.5 w-3.5" />
            </button>

            {/* Delete */}
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="flex h-8 w-8 items-center justify-center rounded-xl border transition-colors hover:opacity-80"
              style={{
                backgroundColor: 'var(--expense-bg)',
                color: 'var(--expense)',
                borderColor: 'color-mix(in srgb, var(--expense) 35%, transparent)',
              }}
              aria-label="Hapus entri"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Hapus Entri Hutang"
        description="Yakin ingin menghapus entri hutang ini secara permanen?"
        onConfirm={() => {
          onDelete(entry.id);
          setConfirmDelete(false);
        }}
      />
    </>
  );
}
