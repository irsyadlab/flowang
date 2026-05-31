import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { useWalletStore } from "@/stores/walletStore";
import { useTransactionStore } from "@/stores/transactionStore";
import WalletDetailHeader from "@/components/wallets/WalletDetailHeader";
import WalletTransactionList from "@/components/wallets/WalletTransactionList";
import ErrorMessage from "@/components/shared/ErrorMessage";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { useStickyHeader } from "@/hooks/useStickyHeader";

export default function WalletDetailPage() {
  const stickyHeader = useStickyHeader();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const wallets = useWalletStore((s) => s.wallets);
  const deleteWallet = useWalletStore((s) => s.deleteWallet);
  const transactions = useTransactionStore((s) => s.transactions);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const wallet = wallets.find((w) => w.id === id);

  if (!wallet) {
    return <ErrorMessage message="Wallet tidak ditemukan" />;
  }

  const walletTransactions = transactions.filter(
    (t) => t.walletId === id || t.toWalletId === id
  );

  const handleDelete = async () => {
    await deleteWallet(wallet.id);
    setConfirmOpen(false);
    navigate(-1);
  };

  return (
    <div>
      {/* Header */}
      <div className={`${stickyHeader} px-4 flex items-center justify-between py-3`}>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            aria-label="Kembali"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="text-lg font-bold text-foreground">{wallet.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(`/wallets/${id}`)}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            aria-label="Edit wallet"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            aria-label="Hapus wallet"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-4 px-4 pb-6">

      <WalletDetailHeader wallet={wallet} transactions={walletTransactions} />

      <button
        type="button"
        onClick={() => navigate(`/transactions/new?walletId=${id}`)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border py-3 text-sm font-medium text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
      >
        <Plus className="h-4 w-4" />
        Tambah Transaksi
      </button>

      <WalletTransactionList walletId={id!} />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Hapus Wallet"
        description="Yakin ingin menghapus wallet ini? Wallet yang memiliki transaksi tidak dapat dihapus."
        onConfirm={handleDelete}
      />
    </div>
    </div>
  );
}
