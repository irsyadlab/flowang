import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowDownCircle, ArrowUpCircle, ArrowLeftRight, Pencil, Trash2, SlidersHorizontal } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Transaction } from "@/types";
import { useWalletStore } from "@/stores/walletStore";
import { useCategoryStore } from "@/stores/categoryStore";
import { useTransactionStore } from "@/stores/transactionStore";
import ConfirmDialog from "@/components/shared/ConfirmDialog";

const TYPE_CONFIG = {
  income: { icon: ArrowDownCircle, color: "text-emerald-500", label: "Income" },
  expense: { icon: ArrowUpCircle, color: "text-red-500", label: "Expense" },
  transfer: { icon: ArrowLeftRight, color: "text-blue-500", label: "Transfer" },
  adjustment_increase: { icon: SlidersHorizontal, color: "text-amber-500", label: "Koreksi Saldo" },
  adjustment_decrease: { icon: SlidersHorizontal, color: "text-amber-500", label: "Koreksi Saldo" },
} as const;

interface TransactionItemProps {
  transaction: Transaction;
}

export default function TransactionItem({ transaction }: TransactionItemProps) {
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const wallets = useWalletStore((s) => s.wallets);
  const categories = useCategoryStore((s) => s.categories);
  const deleteTransaction = useTransactionStore((s) => s.deleteTransaction);

  const config = TYPE_CONFIG[transaction.type];
  const Icon = config.icon;
  const wallet = wallets.find((w) => w.id === transaction.walletId);
  const toWallet = transaction.toWalletId
    ? wallets.find((w) => w.id === transaction.toWalletId)
    : null;
  const category = transaction.categoryId
    ? categories.find((c) => c.id === transaction.categoryId)
    : null;

  const handleDelete = async () => {
    await deleteTransaction(transaction.id);
    setConfirmOpen(false);
  };

  const walletLabel = isTransfer()
    ? `${wallet?.name ?? "?"} → ${toWallet?.name ?? "?"}`
    : wallet?.name ?? "?";

  function isTransfer() {
    return transaction.type === "transfer";
  }

  const isCorrection = transaction.isCorrection === true;

  const label = isCorrection
    ? config.label
    : isTransfer()
      ? "Transfer"
      : category?.name ?? "Tanpa kategori";

  return (
    <>
      <div className="flex items-center gap-3 rounded-lg border border-border px-4 py-3">
        <div className={`shrink-0 ${config.color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              <p className="truncate text-sm font-medium">
                {label}
              </p>
            </div>
            <p className="shrink-0 text-sm font-medium">
              {transaction.type === "income" || transaction.type === "adjustment_increase" ? "+" : transaction.type === "expense" || transaction.type === "adjustment_decrease" ? "-" : ""}
              {formatCurrency(transaction.amount)}
            </p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {walletLabel} · {formatDate(transaction.date)}
            </p>
            {!isCorrection && (
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => navigate(`/transactions/${transaction.id}`)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmOpen(true)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
          {transaction.note && (
            <p className="mt-0.5 text-xs text-muted-foreground">{transaction.note}</p>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Hapus Transaksi"
        description="Yakin ingin menghapus transaksi ini?"
        onConfirm={handleDelete}
      />
    </>
  );
}
