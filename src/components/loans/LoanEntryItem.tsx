import { useState } from 'react';
import { Trash2, Check } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import type { LoanEntry } from '@/types';

interface LoanEntryItemProps {
  entry: LoanEntry;
  onToggleSettled: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function LoanEntryItem({ entry, onToggleSettled, onDelete }: LoanEntryItemProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isLend = entry.direction === 'lend';
  const isSettled = entry.status === 'settled';

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
            <div className="flex items-center gap-1.5">
              {/* Direction badge — pakai income/expense token */}
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

              {/* Status badge */}
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

            <p className="text-xs text-muted-foreground mt-0.5">{formatDate(entry.date)}</p>
            {entry.note && (
              <p className="text-xs text-muted-foreground/70 italic mt-0.5">{entry.note}</p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 shrink-0">
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
                borderColor: 'color-mix(in srgb, var(--expense) 30%, transparent)',
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
