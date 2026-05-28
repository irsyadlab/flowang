import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Trash2, ChevronRight, Wallet } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { Wallet as WalletType } from "@/types";
import { useWalletStore } from "@/stores/walletStore";
import ConfirmDialog from "@/components/shared/ConfirmDialog";

interface WalletItemProps {
  wallet: WalletType;
}

export default function WalletItem({ wallet }: WalletItemProps) {
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const deleteWallet = useWalletStore((s) => s.deleteWallet);
  const error = useWalletStore((s) => s.error);

  const handleDelete = async () => {
    await deleteWallet(wallet.id);
    setConfirmOpen(false);
  };

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => navigate(`/wallets/${wallet.id}/detail`)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            navigate(`/wallets/${wallet.id}/detail`);
          }
        }}
        className="group flex cursor-pointer items-center gap-3 rounded-2xl border border-border/60 bg-card px-4 py-3.5 transition-all duration-200 hover:border-border hover:shadow-sm active:scale-[0.99]"
      >
        {/* Icon */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/8">
          <Wallet className="h-4.5 w-4.5 text-primary" />
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{wallet.name}</p>
          <p className="text-sm font-medium text-muted-foreground tabular-nums">{formatCurrency(wallet.balance)}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/wallets/${wallet.id}`);
            }}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground opacity-0 group-hover:opacity-100 transition-all hover:bg-accent hover:text-accent-foreground"
            aria-label="Edit wallet"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setConfirmOpen(true);
            }}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground opacity-0 group-hover:opacity-100 transition-all hover:bg-destructive/10 hover:text-destructive"
            aria-label="Hapus wallet"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Hapus Wallet"
        description="Yakin ingin menghapus wallet ini? Wallet yang memiliki transaksi tidak dapat dihapus."
        onConfirm={handleDelete}
      />

      {error && !confirmOpen && (
        <p className="mt-1 px-1 text-xs text-destructive">{error}</p>
      )}
    </>
  );
}
