import { useState } from "react";
import { calculateSummary, filterByDateRange } from "@/lib/reportEngine";
import { formatCurrency } from "@/lib/utils";
import { useTransactionStore } from "@/stores/transactionStore";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/shared/EmptyState";
import { BarChart3, TrendingUp, TrendingDown, Scale, Search } from "lucide-react";

export default function CustomReport() {
  const transactions = useTransactionStore((s) => s.transactions);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [result, setResult] = useState<ReturnType<typeof calculateSummary> | null>(null);
  const [rangeError, setRangeError] = useState("");

  const handleSubmit = () => {
    setRangeError("");
    if (!startDate || !endDate) {
      setRangeError("Tanggal mulai dan akhir wajib diisi");
      return;
    }
    if (startDate > endDate) {
      setRangeError("Tanggal mulai tidak boleh lebih besar dari tanggal akhir");
      return;
    }
    const filtered = filterByDateRange(transactions, startDate, endDate);
    setResult(calculateSummary(filtered));
  };

  const savingsRate = result && result.totalIncome > 0
    ? Math.round(((result.totalIncome - result.totalExpense) / result.totalIncome) * 100)
    : 0;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border/60 bg-card p-4 space-y-3">
        <p className="text-sm font-semibold text-foreground">Pilih Rentang Tanggal</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Tanggal Mulai</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="flex h-9 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-ring/50"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Tanggal Akhir</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="flex h-9 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-ring/50"
            />
          </div>
        </div>

        {rangeError && (
          <p className="text-xs text-destructive">{rangeError}</p>
        )}

        <Button
          onClick={handleSubmit}
          className="w-full rounded-xl gap-2"
          disabled={!startDate || !endDate}
        >
          <Search className="h-4 w-4" />
          Tampilkan Laporan
        </Button>
      </div>

      {result && (
        <>
          {result.totalIncome === 0 && result.totalExpense === 0 ? (
            <EmptyState
              icon={BarChart3}
              title="Tidak ada data"
              description="Tidak ada transaksi dalam rentang tanggal ini."
            />
          ) : (
            <div className="space-y-3 animate-[slide-up_0.3s_ease-out]">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-card border border-border/60 p-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 mb-3">
                    <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">Pemasukan</p>
                  <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 tabular-nums leading-tight">
                    {formatCurrency(result.totalIncome)}
                  </p>
                </div>
                <div className="rounded-2xl bg-card border border-border/60 p-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-500/10 mb-3">
                    <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">Pengeluaran</p>
                  <p className="text-base font-bold text-red-600 dark:text-red-400 tabular-nums leading-tight">
                    {formatCurrency(result.totalExpense)}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-card border border-border/60 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/8">
                      <Scale className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Saldo Bersih</p>
                      <p className={`text-lg font-bold tabular-nums ${result.netBalance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                        {formatCurrency(result.netBalance)}
                      </p>
                    </div>
                  </div>
                  {result.totalIncome > 0 && (
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Tabungan</p>
                      <p className={`text-sm font-semibold ${savingsRate >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                        {savingsRate}%
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
