import { useNavigate, useParams } from "react-router-dom";
import { Plus } from "lucide-react";
import { useWalletStore } from "@/stores/walletStore";
import { useTransactionStore } from "@/stores/transactionStore";
import WalletDetailHeader from "@/components/wallets/WalletDetailHeader";
import WalletTransactionList from "@/components/wallets/WalletTransactionList";
import ErrorMessage from "@/components/shared/ErrorMessage";
import { Button } from "@/components/ui/button";

export default function WalletDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const wallets = useWalletStore((s) => s.wallets);
  const transactions = useTransactionStore((s) => s.transactions);

  const wallet = wallets.find((w) => w.id === id);

  if (!wallet) {
    return <ErrorMessage message="Wallet tidak ditemukan" />;
  }

  const walletTransactions = transactions.filter(
    (t) => t.walletId === id || t.toWalletId === id
  );

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-lg font-semibold">{wallet.name}</h1>

      <WalletDetailHeader wallet={wallet} transactions={walletTransactions} />

      <Button
        variant="outline"
        className="w-full"
        onClick={() => navigate(`/transactions/new?walletId=${id}`)}
      >
        <Plus className="mr-2 h-4 w-4" />
        Tambah Transaksi
      </Button>

      <WalletTransactionList walletId={id!} />
    </div>
  );
}
