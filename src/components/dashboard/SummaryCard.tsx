import { useMemo } from "react";
import { TrendingUp, TrendingDown, Eye, EyeOff } from "lucide-react";
import { useWalletStore } from "@/stores/walletStore";
import { useTransactionStore } from "@/stores/transactionStore";
import { formatCurrency } from "@/lib/utils";

interface SummaryCardProps {
  isHidden: boolean;
  onHiddenChange: (isHidden: boolean) => void;
}

export default function SummaryCard({ isHidden, onHiddenChange }: SummaryCardProps) {
  const wallets = useWalletStore((s) => s.wallets);
  const transactions = useTransactionStore((s) => s.transactions);

  const totalBalance = useMemo(
    () => wallets.reduce((sum, w) => sum + w.balance, 0),
    [wallets]
  );

  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const today = now.toISOString().split("T")[0];
  const monthName = now.toLocaleDateString("id-ID", { month: "long", year: "numeric" });

  const monthSummary = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const t of transactions) {
      if (t.date < monthStart || t.date > today) continue;
      if (t.isCorrection) continue;
      if (t.type === "income") income += t.amount;
      else if (t.type === "expense") expense += t.amount;
    }
    return { income, expense };
  }, [transactions, monthStart, today]);

  const savingsRate = monthSummary.income > 0
    ? Math.round(((monthSummary.income - monthSummary.expense) / monthSummary.income) * 100)
    : 0;

  return (
    <div className="hero-card noise-overlay rounded-2xl p-5 text-white shadow-[0_4px_16px_rgba(0,0,0,0.35)] animate-[slide-up_0.4s_ease-out]">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-xs font-medium text-white/50 uppercase tracking-widest mb-0.5">Total Saldo</p>
          <p className="text-[11px] text-white/40">{monthName}</p>
        </div>
        <button
          type="button"
          onClick={() => onHiddenChange(!isHidden)}
          className="flex items-center justify-center h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          aria-label={isHidden ? "Tampilkan saldo" : "Sembunyikan saldo"}
        >
          {isHidden ? <EyeOff className="h-3.5 w-3.5 text-white/70" /> : <Eye className="h-3.5 w-3.5 text-white/70" />}
        </button>
      </div>

      {/* Balance */}
      <div className="mb-5">
        {isHidden ? (
          <div className="flex items-center gap-1.5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-3 w-3 rounded-full bg-white/30" />
            ))}
          </div>
        ) : (
          <p className="text-3xl font-bold tracking-tight" style={{ fontFamily: "'DM Serif Display', serif" }}>
            {formatCurrency(totalBalance)}
          </p>
        )}
      </div>

      {/* Divider */}
      <div className="h-px bg-white/10 mb-4" />

      {/* Income / Expense */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-400/20">
            <TrendingUp className="h-4 w-4 text-emerald-300" />
          </div>
          <div>
            <p className="text-[10px] text-white/50 uppercase tracking-wider">Pemasukan</p>
            <p className="text-sm font-semibold text-emerald-300">
              {isHidden ? "••••" : formatCurrency(monthSummary.income)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-400/20">
            <TrendingDown className="h-4 w-4 text-red-300" />
          </div>
          <div>
            <p className="text-[10px] text-white/50 uppercase tracking-wider">Pengeluaran</p>
            <p className="text-sm font-semibold text-red-300">
              {isHidden ? "••••" : formatCurrency(monthSummary.expense)}
            </p>
          </div>
        </div>
      </div>

      {/* Savings rate bar */}
      {monthSummary.income > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[10px] text-white/40 uppercase tracking-wider">Tabungan bulan ini</p>
            <p className="text-[10px] font-semibold text-white/60">{savingsRate}%</p>
          </div>
          <div className="h-1 w-full rounded-full bg-white/10 overflow-isHidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-300 transition-all duration-700"
              style={{ width: `${Math.max(0, Math.min(100, savingsRate))}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
