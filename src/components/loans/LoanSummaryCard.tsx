import { formatCurrency } from '@/lib/utils';
import { getNetBalanceLabel } from '@/lib/loanUtils';

interface LoanSummaryCardProps {
  totalLend: number;
  totalBorrow: number;
}

export default function LoanSummaryCard({ totalLend, totalBorrow }: LoanSummaryCardProps) {
  const net = totalLend - totalBorrow;
  const label = getNetBalanceLabel(totalLend, totalBorrow);

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Piutang Aktif</p>
          <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {formatCurrency(totalLend)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Hutang Aktif</p>
          <p className="text-sm font-semibold text-red-600 dark:text-red-400 tabular-nums">
            {formatCurrency(totalBorrow)}
          </p>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-border/60">
        <p className="text-xs text-muted-foreground mb-0.5">Selisih</p>
        <p className={`text-sm font-semibold tabular-nums ${net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
          {net >= 0 ? '+' : ''}{formatCurrency(Math.abs(net))}
          <span className="text-xs font-normal text-muted-foreground ml-2">{label}</span>
        </p>
      </div>
    </div>
  );
}
