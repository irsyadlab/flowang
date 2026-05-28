import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTransactionStore } from "@/stores/transactionStore";
import TransactionItem from "@/components/transactions/TransactionItem";
import EmptyState from "@/components/shared/EmptyState";
import { Receipt, ArrowRight } from "lucide-react";

export default function RecentTransactions() {
  const navigate = useNavigate();
  const transactions = useTransactionStore((s) => s.transactions);

  const recent = useMemo(
    () =>
      [...transactions]
        .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
        .slice(0, 5),
    [transactions]
  );

  if (recent.length === 0) {
    return (
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground tracking-tight">Transaksi Terbaru</h2>
        <div className="rounded-2xl border border-dashed border-border bg-card p-6">
          <EmptyState
            icon={Receipt}
            title="Belum ada transaksi"
            description="Transaksi terbaru akan muncul di sini."
            action={{ label: "Catat Transaksi", onClick: () => navigate("/transactions/new") }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground tracking-tight">Transaksi Terbaru</h2>
        <button
          type="button"
          onClick={() => navigate("/transactions")}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Lihat semua
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="flex flex-col gap-2 stagger-children">
        {recent.map((t) => (
          <TransactionItem key={t.id} transaction={t} />
        ))}
      </div>
    </div>
  );
}
