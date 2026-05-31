import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { useTransactionStore } from "@/stores/transactionStore";
import { useWalletStore } from "@/stores/walletStore";
import { useCategoryStore } from "@/stores/categoryStore";
import TransactionFilter from "@/components/transactions/TransactionFilter";
import TransactionList from "@/components/transactions/TransactionList";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { localDateStr } from "@/lib/utils";

export default function TransactionsPage() {
  const navigate = useNavigate();
  const { isLoading: txLoading, loadTransactions, setFilter } = useTransactionStore();
  const { loadWallets } = useWalletStore();
  const { loadCategories } = useCategoryStore();

  useEffect(() => {
    loadTransactions();
    loadWallets();
    loadCategories();
  }, [loadTransactions, loadWallets, loadCategories]);

  // Restore last selected date from sessionStorage, fallback to today
  useEffect(() => {
    const saved = sessionStorage.getItem("tx_filter_date");
    const t = saved ?? localDateStr();
    setFilter({ dateFrom: t, dateTo: t });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (txLoading) {
    return <LoadingSpinner fullscreen />;
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-28">
      <div className="pt-1">
        <h1 className="text-xl font-bold text-foreground">Transaksi</h1>
      </div>
      <TransactionFilter />
      <TransactionList />

      {/* FAB — fixed tapi dibatasi lebar container via left/right calc */}
      <div className="fixed bottom-[calc(4rem+1.5rem)] left-1/2 z-40 w-full max-w-[480px] -translate-x-1/2 px-4 pointer-events-none">
        <div className="flex justify-end">
          <button
            type="button"
            data-tour="tx-add-fab"
            onClick={() => navigate("/transactions/new")}
            className="pointer-events-auto flex items-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition-all hover:bg-primary/90 active:scale-95"
            aria-label="Tambah transaksi"
          >
            <Plus className="h-4 w-4" />
            Tambah
          </button>
        </div>
      </div>
    </div>
  );
}
