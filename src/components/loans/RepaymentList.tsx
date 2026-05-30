import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import type { Repayment, LoanEntry, Category } from '@/types';

interface RepaymentListProps {
  repayments: Repayment[];
  loanEntry: LoanEntry;
  categories: Category[];
  onDelete: (id: string, loanEntry: LoanEntry) => void;
}

interface RepaymentItemProps {
  repayment: Repayment;
  loanEntry: LoanEntry;
  categoryName: string;
  onDelete: (id: string, loanEntry: LoanEntry) => void;
}

function RepaymentItem({ repayment, loanEntry, categoryName, onDelete }: RepaymentItemProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <>
      <div className="rounded-xl border border-border/60 bg-card px-3.5 py-3 transition-opacity">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            {/* Amount */}
            <p className="text-base font-semibold tabular-nums" style={{ color: 'var(--income)' }}>
              {formatCurrency(repayment.amount)}
            </p>

            {/* Date */}
            <p className="text-xs text-muted-foreground mt-0.5">{formatDate(repayment.date)}</p>

            {/* Category */}
            <p className="text-xs text-muted-foreground/70 mt-0.5">{categoryName}</p>

            {/* Note */}
            {repayment.note && (
              <p className="text-xs text-muted-foreground/70 italic mt-0.5">{repayment.note}</p>
            )}
          </div>

          {/* Delete button */}
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="flex h-8 w-8 items-center justify-center rounded-xl border transition-colors hover:opacity-80 shrink-0"
            style={{
              backgroundColor: 'var(--expense-bg)',
              color: 'var(--expense)',
              borderColor: 'color-mix(in srgb, var(--expense) 30%, transparent)',
            }}
            aria-label="Hapus pembayaran"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Hapus Pembayaran"
        description="Yakin ingin menghapus catatan pembayaran ini secara permanen?"
        onConfirm={() => {
          onDelete(repayment.id, loanEntry);
          setConfirmDelete(false);
        }}
      />
    </>
  );
}

export default function RepaymentList({
  repayments,
  loanEntry,
  categories,
  onDelete,
}: RepaymentListProps) {
  if (repayments.length === 0) {
    return (
      <div className="rounded-xl border border-border/40 bg-card px-3.5 py-4 text-center">
        <p className="text-sm text-muted-foreground">Belum ada catatan pembayaran</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {repayments.map((repayment) => {
        const category = categories.find((c) => c.id === repayment.categoryId);
        const categoryName = category ? category.name : 'Tanpa kategori';

        return (
          <RepaymentItem
            key={repayment.id}
            repayment={repayment}
            loanEntry={loanEntry}
            categoryName={categoryName}
            onDelete={onDelete}
          />
        );
      })}
    </div>
  );
}
