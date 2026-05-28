import { useMemo } from "react";
import { useTransactionStore } from "@/stores/transactionStore";
import TransactionItem from "@/components/transactions/TransactionItem";
import EmptyState from "@/components/shared/EmptyState";
import { Receipt } from "lucide-react";

export default function RecentTransactions() {
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
      <EmptyState
        icon={Receipt}
        title="Belum ada transaksi"
        description="Transaksi terbaru akan muncul di sini."
      />
    );
  }

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-medium text-muted-foreground">Transaksi Terbaru</h2>
      <div className="flex flex-col gap-2">
        {recent.map((t) => (
          <TransactionItem key={t.id} transaction={t} />
        ))}
      </div>
    </div>
  );
}
