import { ChevronRight, User } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { LoanContact, ContactSummary } from '@/types';

interface ContactItemProps {
  contact: LoanContact;
  summary: ContactSummary;
  onClick: () => void;
  onDelete: () => void;
}

export default function ContactItem({ contact, summary, onClick, onDelete: _onDelete }: ContactItemProps) {
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
      className="group flex cursor-pointer items-center gap-3 rounded-2xl border border-border/60 bg-card px-4 py-3.5 transition-all duration-200 hover:border-border hover:shadow-sm active:scale-[0.99]"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/8">
        <User className="h-4.5 w-4.5 text-primary" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-foreground">{contact.name}</p>
          {!summary.hasActiveEntries && (summary.totalLend > 0 || summary.totalBorrow > 0) && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              Lunas
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          {summary.totalLend > 0 && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 tabular-nums">
              Piutang {formatCurrency(summary.totalLend)}
            </p>
          )}
          {summary.totalBorrow > 0 && (
            <p className="text-xs text-red-600 dark:text-red-400 tabular-nums">
              Hutang {formatCurrency(summary.totalBorrow)}
            </p>
          )}
          {summary.totalLend === 0 && summary.totalBorrow === 0 && (
            <p className="text-xs text-muted-foreground">Belum ada catatan</p>
          )}
        </div>
      </div>

      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
    </div>
  );
}
