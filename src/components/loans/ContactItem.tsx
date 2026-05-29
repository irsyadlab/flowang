import { ChevronRight, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { LoanContact, ContactSummary } from '@/types';

interface ContactItemProps {
  contact: LoanContact;
  summary: ContactSummary;
  onClick: () => void;
  onDelete: () => void;
}

/** Get initials from a name, max 2 chars */
function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

export default function ContactItem({ contact, summary, onClick, onDelete }: ContactItemProps) {
  const net = summary.totalLend - summary.totalBorrow;
  const isSettled = !summary.hasActiveEntries;
  const hasAny = summary.totalLend > 0 || summary.totalBorrow > 0;

  // Progress bar: proportion of lend vs borrow
  const total = summary.totalLend + summary.totalBorrow;
  const lendPct = total > 0 ? Math.round((summary.totalLend / total) * 100) : 0;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="group relative flex cursor-pointer items-center gap-3 rounded-2xl border border-border/60 bg-card px-4 py-3.5 transition-all duration-200 hover:border-border hover:shadow-sm active:scale-[0.99]"
    >
      {/* Avatar */}
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold transition-colors ${
        isSettled
          ? 'bg-muted text-muted-foreground'
          : net > 0
          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
          : net < 0
          ? 'bg-red-500/10 text-red-600 dark:text-red-400'
          : 'bg-primary/8 text-primary'
      }`}>
        {getInitials(contact.name)}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 space-y-1.5">
        {/* Name row */}
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-foreground">{contact.name}</p>
          {isSettled && hasAny && (
            <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              Lunas
            </span>
          )}
        </div>

        {/* Amounts */}
        {hasAny ? (
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              {summary.totalLend > 0 && (
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 tabular-nums">
                  +{formatCurrency(summary.totalLend)}
                </span>
              )}
              {summary.totalBorrow > 0 && (
                <span className="text-[11px] text-red-600 dark:text-red-400 tabular-nums ml-auto">
                  -{formatCurrency(summary.totalBorrow)}
                </span>
              )}
            </div>

            {/* Progress bar — only when both sides exist */}
            {summary.totalLend > 0 && summary.totalBorrow > 0 && (
              <div className="h-1 w-full overflow-hidden rounded-full bg-red-200/60 dark:bg-red-900/30">
                <div
                  className="h-full rounded-full bg-emerald-500/70 transition-all duration-500"
                  style={{ width: `${lendPct}%` }}
                />
              </div>
            )}

            {/* Net */}
            {!isSettled && (
              <p className={`text-[11px] font-semibold tabular-nums ${net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                Selisih {net >= 0 ? '+' : ''}{formatCurrency(Math.abs(net))}
              </p>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Belum ada catatan</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/40 opacity-0 transition-all group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
          aria-label="Hapus kontak"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
        <ChevronRight className="h-4 w-4 text-muted-foreground/40 transition-colors group-hover:text-muted-foreground" />
      </div>
    </div>
  );
}
