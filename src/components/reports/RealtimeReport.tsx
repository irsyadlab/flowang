import { useReports } from "@/hooks/useReports";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown, Scale } from "lucide-react";

export default function RealtimeReport() {
  const { summary } = useReports();

  const savingsRate = summary.totalIncome > 0
    ? Math.round(((summary.totalIncome - summary.totalExpense) / summary.totalIncome) * 100)
    : 0;

  return (
    <div className="space-y-3">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-card border border-border/60 p-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 mb-3">
            <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-xs text-muted-foreground mb-1">Total Pemasukan</p>
          <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 tabular-nums leading-tight">
            {formatCurrency(summary.totalIncome)}
          </p>
        </div>
        <div className="rounded-2xl bg-card border border-border/60 p-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-500/10 mb-3">
            <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
          </div>
          <p className="text-xs text-muted-foreground mb-1">Total Pengeluaran</p>
          <p className="text-base font-bold text-red-600 dark:text-red-400 tabular-nums leading-tight">
            {formatCurrency(summary.totalExpense)}
          </p>
        </div>
      </div>

      {/* Net balance */}
      <div className="rounded-2xl bg-card border border-border/60 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/8">
              <Scale className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Saldo Bersih</p>
              <p className={`text-lg font-bold tabular-nums ${summary.netBalance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                {formatCurrency(summary.netBalance)}
              </p>
            </div>
          </div>
          {summary.totalIncome > 0 && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Tabungan</p>
              <p className={`text-sm font-semibold ${savingsRate >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                {savingsRate}%
              </p>
            </div>
          )}
        </div>

        {summary.totalIncome > 0 && (
          <div className="mt-3">
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700"
                style={{ width: `${Math.max(0, Math.min(100, (summary.totalExpense / summary.totalIncome) * 100))}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <p className="text-[10px] text-muted-foreground">Pengeluaran</p>
              <p className="text-[10px] text-muted-foreground">Pemasukan</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
