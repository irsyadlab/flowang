import { useState } from "react";
import { calculateSummary, filterByDateRange } from "@/lib/reportEngine";
import { formatCurrency } from "@/lib/utils";
import { useTransactionStore } from "@/stores/transactionStore";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/shared/EmptyState";
import { BarChart3 } from "lucide-react";

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

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Tanggal Mulai</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] focus-visible:ring-4 focus-visible:outline-1"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Tanggal Akhir</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] focus-visible:ring-4 focus-visible:outline-1"
          />
        </div>
      </div>

      {rangeError && (
        <p className="text-sm text-destructive">{rangeError}</p>
      )}

      <Button onClick={handleSubmit} className="w-full" disabled={!startDate || !endDate}>
        Tampilkan Laporan
      </Button>

      {result && (
        <div className="rounded-lg border border-border p-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Income</span>
              <span className="text-sm font-medium text-emerald-500">
                {formatCurrency(result.totalIncome)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Expense</span>
              <span className="text-sm font-medium text-red-500">
                {formatCurrency(result.totalExpense)}
              </span>
            </div>
            <div className="border-t border-border pt-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Saldo Bersih</span>
                <span className="text-sm font-bold">
                  {formatCurrency(result.netBalance)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {result && result.totalIncome === 0 && result.totalExpense === 0 && (
        <EmptyState
          icon={BarChart3}
          title="Tidak ada data"
          description="Tidak ada transaksi dalam rentang tanggal ini."
        />
      )}
    </div>
  );
}
