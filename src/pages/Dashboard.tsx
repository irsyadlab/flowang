import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import SummaryCard from "@/components/dashboard/SummaryCard";
import WalletList from "@/components/dashboard/WalletList";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import { useBalanceVisibility } from "@/hooks/useBalanceVisibility";
import { useStickyHeader } from "@/hooks/useStickyHeader";

export default function Dashboard() {
  const stickyHeader = useStickyHeader();
  const navigate = useNavigate();
  // Tidak berlangganan store di sini: SummaryCard, WalletList, dan
  // RecentTransactions masing-masing sudah mengambil potongan state yang
  // dibutuhkannya sendiri. Berlangganan di level halaman hanya membuat seluruh
  // subtree ini ikut re-render setiap kali `isLoading` berkedip.
  const { isHidden, setIsHidden } = useBalanceVisibility();

  return (
    <div className="flex flex-col gap-5 pb-6">
      {/* Page header */}
      <div className={`${stickyHeader} px-4 flex items-center justify-between py-3`}>
        <div>
          <h1 className="text-xl font-bold text-foreground leading-tight">Flowang</h1>
          <p className="text-xs text-muted-foreground">Catatan keuangan pribadi</p>
        </div>
        <button
          type="button"
          data-tour="add-transaction-btn"
          onClick={() => navigate("/transactions/new")}
          className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-95"
        >
          <Plus className="h-3.5 w-3.5" />
          Catat
        </button>
      </div>

      <div data-tour="dashboard-summary" className="px-4">
        <SummaryCard isHidden={isHidden} onHiddenChange={setIsHidden} />
      </div>
      <div className="px-4"><WalletList isHidden={isHidden} /></div>
      <div className="px-4"><RecentTransactions /></div>
    </div>
  );
}
