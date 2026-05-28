import { useReports } from "@/hooks/useReports";
import { formatCurrency } from "@/lib/utils";
import EmptyState from "@/components/shared/EmptyState";
import { BarChart3 } from "lucide-react";

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export default function MonthlyReport() {
  const { monthlyReports } = useReports();

  if (monthlyReports.length === 0) {
    return (
      <EmptyState
        icon={BarChart3}
        title="Belum ada data"
        description="Data laporan bulanan akan muncul setelah ada transaksi."
      />
    );
  }

  return (
    <div className="space-y-2 stagger-children">
      {monthlyReports.map((row) => {
        const net = row.totalIncome - row.totalExpense;
        const expenseRatio = row.totalIncome > 0
          ? Math.min(100, (row.totalExpense / row.totalIncome) * 100)
          : 0;

        return (
          <div
            key={`${row.year}-${row.month}`}
            className="rounded-2xl border border-border/60 bg-card p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-foreground">
                {MONTH_NAMES[row.month - 1]} {row.year}
              </p>
              <span className={`text-xs font-semibold tabular-nums ${net >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                {net >= 0 ? "+" : ""}{formatCurrency(net)}
              </span>
            </div>

            <div className="flex gap-4 text-xs mb-3">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-muted-foreground">Masuk:</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {formatCurrency(row.totalIncome)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-red-500" />
                <span className="text-muted-foreground">Keluar:</span>
                <span className="font-medium text-red-600 dark:text-red-400 tabular-nums">
                  {formatCurrency(row.totalExpense)}
                </span>
              </div>
            </div>

            {row.totalIncome > 0 && (
              <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-red-400 to-red-500 transition-all duration-500"
                  style={{ width: `${expenseRatio}%` }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
