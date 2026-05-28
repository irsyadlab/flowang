import { useMemo } from "react";
import { useTransactionStore } from "@/stores/transactionStore";
import TransactionItem from "@/components/transactions/TransactionItem";
import EmptyState from "@/components/shared/EmptyState";
import { Receipt } from "lucide-react";

export default function TransactionList() {
  const { transactions, filter } = useTransactionStore();

  const filtered = useMemo(() => {
    let result = transactions;

    if (filter.walletId) {
      result = result.filter(
        (t) => t.walletId === filter.walletId || t.toWalletId === filter.walletId
      );
    }
    if (filter.categoryId) {
      result = result.filter((t) => t.categoryId === filter.categoryId);
    }
    if (filter.type) {
      result = result.filter((t) => t.type === filter.type);
    }
    if (filter.dateFrom) {
      result = result.filter((t) => t.date >= filter.dateFrom!);
    }
    if (filter.dateTo) {
      result = result.filter((t) => t.date <= filter.dateTo!);
    }

    return [...result].sort(
      (a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)
    );
  }, [transactions, filter]);

  if (filtered.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title="Tidak ada transaksi"
        description="Tidak ada transaksi yang sesuai filter."
      />
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">{filtered.length} transaksi</p>
      <div className="flex flex-col gap-2">
        {filtered.map((t) => (
          <TransactionItem key={t.id} transaction={t} />
        ))}
      </div>
    </div>
  );
}
