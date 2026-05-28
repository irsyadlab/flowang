import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { useTransactionStore } from "@/stores/transactionStore";
import { useWalletStore } from "@/stores/walletStore";
import { useCategoryStore } from "@/stores/categoryStore";
import TransactionFilter from "@/components/transactions/TransactionFilter";
import TransactionList from "@/components/transactions/TransactionList";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

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
    <div className="flex flex-col gap-4 p-4 pb-6">
      <div className="flex items-center justify-between pt-1">
        <h1 className="text-xl font-bold text-foreground">Transaksi</h1>
        <button
          type="button"
          onClick={() => navigate("/transactions/new")}
          className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-95"
        >
          <Plus className="h-3.5 w-3.5" />
          Tambah
        </button>
      </div>
      <TransactionFilter />
      <TransactionList />
    </div>
  );
}
