import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Wallet } from "lucide-react";
import { useWalletStore } from "@/stores/walletStore";
import WalletItem from "@/components/wallets/WalletItem";
import EmptyState from "@/components/shared/EmptyState";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";

export default function WalletsPage() {
  const navigate = useNavigate();
  const { wallets, isLoading, loadWallets } = useWalletStore();

  useEffect(() => {
    loadWallets();
  }, [loadWallets]);

  if (isLoading && wallets.length === 0) {
    return <LoadingSpinner fullscreen />;
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Wallet</h1>
        <Button size="sm" onClick={() => navigate("/wallets/new")}>
          Tambah
        </Button>
      </div>

      {wallets.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Belum ada wallet"
          description="Buat wallet pertama untuk mulai mencatat keuangan."
          action={{ label: "Tambah Wallet", onClick: () => navigate("/wallets/new") }}
        />
      ) : (
        <div className="flex flex-col gap-2">
          {wallets.map((w) => (
            <WalletItem key={w.id} wallet={w} />
          ))}
        </div>
      )}
    </div>
  );
}
