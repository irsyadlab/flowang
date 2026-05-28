import { useEffect } from "react";
import { useWalletStore } from "@/stores/walletStore";
import { useTransactionStore } from "@/stores/transactionStore";
import SummaryCard from "@/components/dashboard/SummaryCard";
import WalletList from "@/components/dashboard/WalletList";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

export default function Dashboard() {
  const { isLoading: walletLoading, loadWallets } = useWalletStore();
  const { isLoading: txLoading, loadTransactions } = useTransactionStore();

  useEffect(() => {
    loadWallets();
    loadTransactions();
  }, [loadWallets, loadTransactions]);

  if (walletLoading || txLoading) {
    return <LoadingSpinner fullscreen />;
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <SummaryCard />
      <WalletList />
      <RecentTransactions />
    </div>
  );
}
