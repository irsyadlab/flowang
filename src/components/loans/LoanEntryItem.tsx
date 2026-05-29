import { useState } from 'react';
import { Trash2, Check } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
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
  const directionLabel = isLend ? 'Piutang' : 'Hutang';
  const directionColor = isLend ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400';
  const directionBadge = isLend ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';

  return (
    <>
      <div className="rounded-xl border border-border/60 bg-card px-3.5 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium px-1.5 py-0.5 rounded-md ${directionBadge}`}>
                {directionLabel}
              </span>
              <Badge variant={entry.status === 'settled' ? 'secondary' : 'default'} className="text-[10px] px-1.5 py-0">
                {entry.status === 'settled' ? 'Lunas' : 'Aktif'}
              </Badge>
            </div>
            <p className={`mt-1.5 text-base font-semibold tabular-nums ${directionColor}`}>
              {formatCurrency(entry.amount)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{formatDate(entry.date)}</p>
            {entry.note && (
              <p className="text-xs text-muted-foreground/70 italic mt-0.5">{entry.note}</p>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => onToggleSettled(entry.id)}
              className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${
                entry.status === 'settled'
                  ? 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
                  : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50'
              }`}
              aria-label={entry.status === 'settled' ? 'Batalkan lunas' : 'Tandai lunas'}
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
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
