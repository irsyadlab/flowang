import { useMemo } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useWalletStore } from "@/stores/walletStore";
import { useTransactionStore } from "@/stores/transactionStore";
import { formatCurrency } from "@/lib/utils";

export default function SummaryCard() {
  const wallets = useWalletStore((s) => s.wallets);
  const transactions = useTransactionStore((s) => s.transactions);

  const totalBalance = useMemo(
    () => wallets.reduce((sum, w) => sum + w.balance, 0),
    [wallets]
  );

  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const today = now.toISOString().split("T")[0];

  const monthSummary = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const t of transactions) {
      if (t.date < monthStart || t.date > today) continue;
      if (t.type === "income") income += t.amount;
      else if (t.type === "expense") expense += t.amount;
    }
    return { income, expense };
  }, [transactions, monthStart, today]);

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">Total Saldo</p>
      <p className="text-xl font-bold">{formatCurrency(totalBalance)}</p>
      <div className="mt-3 flex gap-4">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="h-4 w-4 text-emerald-500" />
          <div>
            <p className="text-xs text-muted-foreground">Income</p>
            <p className="text-sm font-medium">{formatCurrency(monthSummary.income)}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <TrendingDown className="h-4 w-4 text-red-500" />
          <div>
            <p className="text-xs text-muted-foreground">Expense</p>
            <p className="text-sm font-medium">{formatCurrency(monthSummary.expense)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
