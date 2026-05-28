import { formatCurrency } from "@/lib/utils";
import type { Wallet, Transaction } from "@/types";

interface WalletDetailHeaderProps {
  wallet: Wallet;
  transactions: Transaction[];
}

export default function WalletDetailHeader({ wallet, transactions }: WalletDetailHeaderProps) {
  let totalIncome = 0;
  let totalExpense = 0;

  for (const tx of transactions) {
    const isSource = tx.walletId === wallet.id;

    if (tx.type === "income" && isSource) {
      totalIncome += tx.amount;
    } else if (tx.type === "expense" && isSource) {
      totalExpense += tx.amount;
    }
    // Transfer excluded from income/expense totals
  }

  const netBalance = totalIncome - totalExpense;

  return (
    <div className="space-y-4 rounded-lg border border-border p-4">
      <div>
        <p className="text-sm text-muted-foreground">Saldo</p>
        <p className="text-2xl font-semibold">{formatCurrency(wallet.balance)}</p>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-md bg-emerald-500/10 p-2">
          <p className="text-xs text-muted-foreground">Income</p>
          <p className="text-sm font-medium text-emerald-600">{formatCurrency(totalIncome)}</p>
        </div>
        <div className="rounded-md bg-red-500/10 p-2">
          <p className="text-xs text-muted-foreground">Expense</p>
          <p className="text-sm font-medium text-red-600">{formatCurrency(totalExpense)}</p>
        </div>
        <div className="rounded-md bg-blue-500/10 p-2">
          <p className="text-xs text-muted-foreground">Bersih</p>
          <p className="text-sm font-medium text-blue-600">{formatCurrency(netBalance)}</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Saldo awal</span>
        <span>{formatCurrency(wallet.initialBalance)}</span>
      </div>
    </div>
  );
}
