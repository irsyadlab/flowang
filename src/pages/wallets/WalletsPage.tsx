import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Wallet, Plus, Eye, EyeOff } from "lucide-react";
import { useWalletStore } from "@/stores/walletStore";
import WalletItem from "@/components/wallets/WalletItem";
import EmptyState from "@/components/shared/EmptyState";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { useBalanceVisibility } from "@/hooks/useBalanceVisibility";

export default function WalletsPage() {
  const navigate = useNavigate();
  const { wallets, isLoading, loadWallets } = useWalletStore();
  const { isHidden, setIsHidden } = useBalanceVisibility();

  useEffect(() => {
    loadWallets();
  }, [loadWallets]);

  if (isLoading && wallets.length === 0) {
    return <LoadingSpinner fullscreen />;
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-6">
      <div className="flex items-center justify-between pt-1">
        <h1 className="text-xl font-bold text-foreground">Wallet</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsHidden(!isHidden)}
            className="flex items-center justify-center h-8 w-8 rounded-xl bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            aria-label={isHidden ? "Tampilkan saldo" : "Sembunyikan saldo"}
          >
            {isHidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() => navigate("/wallets/new")}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" />
            Tambah
          </button>
        </div>
      </div>

      {wallets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-6">
          <EmptyState
            icon={Wallet}
            title="Belum ada wallet"
            description="Buat wallet pertama untuk mulai mencatat keuangan."
            action={{ label: "Tambah Wallet", onClick: () => navigate("/wallets/new") }}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-2 stagger-children">
          {wallets.map((w) => (
            <WalletItem key={w.id} wallet={w} isHidden={isHidden} />
          ))}
        </div>
      )}
    </div>
  );
}
