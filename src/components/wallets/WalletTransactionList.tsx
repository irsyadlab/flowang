import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTransactionStore } from "@/stores/transactionStore";
import TransactionItem from "@/components/transactions/TransactionItem";
import EmptyState from "@/components/shared/EmptyState";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import VirtualList from "@/components/shared/VirtualList";
import { ArrowLeftRight } from "lucide-react";

interface WalletTransactionListProps {
  walletId: string;
}

export default function WalletTransactionList({ walletId }: WalletTransactionListProps) {
  const navigate = useNavigate();
  const transactions = useTransactionStore((s) => s.transactions);
  const isLoading = useTransactionStore((s) => s.isLoading);

  // Daftar ini tidak dibatasi periode apa pun — isinya seluruh riwayat wallet.
  // Filter + sort di-memo supaya tidak diulang di setiap render; sebelumnya
  // keduanya berjalan langsung di badan render.
  const filtered = useMemo(
    () =>
      transactions
        .filter((t) => t.walletId === walletId || t.toWalletId === walletId)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [transactions, walletId],
  );

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (filtered.length === 0) {
    return (
      <EmptyState
        icon={ArrowLeftRight}
        title="Belum ada transaksi"
        description="Transaksi yang melibatkan wallet ini akan muncul di sini."
      />
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">{filtered.length} transaksi</p>

      {/* `stagger-children` hanya dipakai saat daftar dirender biasa. Pada mode
          tervirtualisasi baris di-mount ulang tiap kali masuk layar, jadi
          animasi masuknya akan terpicu berulang selama scroll. */}
      <VirtualList
        items={filtered}
        getKey={(t) => t.id}
        plainClassName="flex flex-col gap-2 stagger-children"
      >
        {(t) => (
          <div
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
        )}
      </VirtualList>
    </div>
  );
}
