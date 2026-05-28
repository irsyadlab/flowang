import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { Wallet } from "@/types";
import { useWalletStore } from "@/stores/walletStore";
import ConfirmDialog from "@/components/shared/ConfirmDialog";

interface WalletItemProps {
  wallet: Wallet;
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
        className="flex cursor-pointer items-center justify-between rounded-lg border border-border px-4 py-3 transition-colors hover:bg-accent/50"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{wallet.name}</p>
          <p className="text-sm text-muted-foreground">{formatCurrency(wallet.balance)}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/wallets/${wallet.id}`);
            }}
            className="inline-flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setConfirmOpen(true);
            }}
            className="inline-flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Hapus Wallet"
        description="Yakin ingin menghapus wallet ini?"
        onConfirm={handleDelete}
      />

      {error && !confirmOpen && (
        <p className="mt-2 text-sm text-destructive">{error}</p>
      )}
    </>
  );
}
