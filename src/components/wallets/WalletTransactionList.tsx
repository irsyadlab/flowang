import { useNavigate } from "react-router-dom";
import { useTransactionStore } from "@/stores/transactionStore";
import TransactionItem from "@/components/transactions/TransactionItem";
import EmptyState from "@/components/shared/EmptyState";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { ArrowLeftRight } from "lucide-react";

interface WalletTransactionListProps {
  walletId: string;
}

export default function WalletTransactionList({ walletId }: WalletTransactionListProps) {
  const navigate = useNavigate();
  const transactions = useTransactionStore((s) => s.transactions);
  const isLoading = useTransactionStore((s) => s.isLoading);

  const filtered = transactions
    .filter((t) => t.walletId === walletId || t.toWalletId === walletId)
    .sort((a, b) => b.date.localeCompare(a.date));

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (filtered.length === 0) {
    return (
      <EmptyState
        icon={ArrowLeftRight}
        title="Belum ada transaksi"
        description="Transaksi yang melibatkan wallet ini akan muncul di sini."
        action={{
          label: "Tambah Transaksi",
          onClick: () => navigate(`/transactions/new?walletId=${walletId}`),
        }}
      />
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">{filtered.length} transaksi</p>
      <div className="flex flex-col gap-2 stagger-children">
        {filtered.map((t) => (
          <div
            key={t.id}
            role="button"
            tabIndex={0}
            onClick={() => navigate(`/transactions/${t.id}`)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                navigate(`/transactions/${t.id}`);
              }
            }}
            className="cursor-pointer"
          >
            <TransactionItem transaction={t} />
          </div>
        ))}
      </div>
    </div>
  );
}
