import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { useWalletStore } from "@/stores/walletStore";
import { useTransactionStore } from "@/stores/transactionStore";
import SummaryCard from "@/components/dashboard/SummaryCard";
import WalletList from "@/components/dashboard/WalletList";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { useBalanceVisibility } from "@/hooks/useBalanceVisibility";

export default function Dashboard() {
  const navigate = useNavigate();
  const { isLoading: walletLoading, loadWallets } = useWalletStore();
  const { isLoading: txLoading, loadTransactions } = useTransactionStore();
  const { isHidden, setIsHidden } = useBalanceVisibility();

  useEffect(() => {
    loadWallets();
    loadTransactions();
  }, [loadWallets, loadTransactions]);

  if (walletLoading || txLoading) {
    return <LoadingSpinner fullscreen />;
  }

  return (
    <div className="flex flex-col gap-5 p-4 pb-6">
      {/* Page header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-xl font-bold text-foreground leading-tight">Flowang</h1>
          <p className="text-xs text-muted-foreground">Catatan keuangan pribadi</p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/transactions/new")}
          className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-95"
        >
          <Plus className="h-3.5 w-3.5" />
          Catat
        </button>
      </div>

      <SummaryCard isHidden={isHidden} onHiddenChange={setIsHidden} />
      <WalletList isHidden={isHidden} />
      <RecentTransactions />
    </div>
  );
}
