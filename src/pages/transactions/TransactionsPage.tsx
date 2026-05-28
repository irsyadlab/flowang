import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { useTransactionStore } from "@/stores/transactionStore";
import { useWalletStore } from "@/stores/walletStore";
import { useCategoryStore } from "@/stores/categoryStore";
import TransactionFilter from "@/components/transactions/TransactionFilter";
import TransactionList from "@/components/transactions/TransactionList";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";

export default function TransactionsPage() {
  const navigate = useNavigate();
  const { isLoading: txLoading, loadTransactions } = useTransactionStore();
  const { loadWallets } = useWalletStore();
  const { loadCategories } = useCategoryStore();

  useEffect(() => {
    loadTransactions();
    loadWallets();
    loadCategories();
  }, [loadTransactions, loadWallets, loadCategories]);

  if (txLoading) {
    return <LoadingSpinner fullscreen />;
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Transaksi</h1>
        <Button size="sm" onClick={() => navigate("/transactions/new")}>
          <Plus className="h-4 w-4" />
          Tambah
        </Button>
      </div>
      <TransactionFilter />
      <TransactionList />
    </div>
  );
}
