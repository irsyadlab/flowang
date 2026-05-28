import { formatCurrency } from "@/lib/utils";
import type { Wallet, Transaction } from "@/types";
import { TrendingUp, TrendingDown, Scale } from "lucide-react";

interface WalletDetailHeaderProps {
  wallet: Wallet;
  transactions: Transaction[];
}

export default function WalletDetailHeader({ wallet, transactions }: WalletDetailHeaderProps) {
  let totalIncome = 0;
  let totalExpense = 0;

  for (const tx of transactions) {
    const isSource = tx.walletId === wallet.id;
    if (tx.type === "income" && isSource) totalIncome += tx.amount;
    else if (tx.type === "expense" && isSource) totalExpense += tx.amount;
  }

  const netBalance = totalIncome - totalExpense;

  return (
    <div className="hero-card noise-overlay rounded-2xl p-5 text-white shadow-xl shadow-primary/20">
      <p className="text-[10px] text-white/50 uppercase tracking-widest mb-1">Saldo Wallet</p>
      <p className="text-3xl font-bold tracking-tight mb-1" style={{ fontFamily: "'DM Serif Display', serif" }}>
        {formatCurrency(wallet.balance)}
      </p>
      <p className="text-xs text-white/40 mb-5">Saldo awal: {formatCurrency(wallet.initialBalance)}</p>

      <div className="h-px bg-white/10 mb-4" />

      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-1.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-400/20">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-300" />
          </div>
          <p className="text-[10px] text-white/50 uppercase tracking-wider">Masuk</p>
          <p className="text-sm font-semibold text-emerald-300 tabular-nums">{formatCurrency(totalIncome)}</p>
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-400/20">
            <TrendingDown className="h-3.5 w-3.5 text-red-300" />
          </div>
          <p className="text-[10px] text-white/50 uppercase tracking-wider">Keluar</p>
          <p className="text-sm font-semibold text-red-300 tabular-nums">{formatCurrency(totalExpense)}</p>
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-400/20">
            <Scale className="h-3.5 w-3.5 text-blue-300" />
          </div>
          <p className="text-[10px] text-white/50 uppercase tracking-wider">Bersih</p>
          <p className={`text-sm font-semibold tabular-nums ${netBalance >= 0 ? "text-emerald-300" : "text-red-300"}`}>
            {formatCurrency(netBalance)}
          </p>
        </div>
      </div>
    </div>
  );
}
