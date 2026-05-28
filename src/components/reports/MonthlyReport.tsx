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
    <div className="space-y-2">
      {monthlyReports.map((row) => (
        <div
          key={`${row.year}-${row.month}`}
          className="rounded-lg border border-border p-3"
        >
          <p className="mb-2 text-sm font-medium">
            {MONTH_NAMES[row.month - 1]} {row.year}
          </p>
          <div className="flex gap-4 text-xs">
            <div>
              <span className="text-muted-foreground">Income: </span>
              <span className="font-medium text-emerald-500">
                {formatCurrency(row.totalIncome)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Expense: </span>
              <span className="font-medium text-red-500">
                {formatCurrency(row.totalExpense)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
