import { useNavigate } from "react-router-dom";
import { Wallet, Plus, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useWalletStore } from "@/stores/walletStore";
import WalletItem from "@/components/wallets/WalletItem";
import EmptyState from "@/components/shared/EmptyState";
import { useBalanceVisibility } from "@/hooks/useBalanceVisibility";
import { useStickyHeader } from "@/hooks/useStickyHeader";

export default function WalletsPage() {
  const stickyHeader = useStickyHeader();
  const navigate = useNavigate();
  const wallets = useWalletStore((s) => s.wallets);
  const { isHidden, setIsHidden } = useBalanceVisibility();

  return (
    <div>
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
          <h1 className="text-xl font-bold text-foreground">Wallet</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsHidden(!isHidden)}
            data-tour="wallets-eye-toggle"
            className="flex items-center justify-center h-8 w-8 rounded-xl bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            aria-label={isHidden ? "Tampilkan saldo" : "Sembunyikan saldo"}
          >
            {isHidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() => navigate("/wallets/new")}
            data-tour="wallets-add"
            className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" />
            Tambah
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-4 px-4 pb-6">

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
    </div>
  );
}
