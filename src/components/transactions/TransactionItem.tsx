import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowDownCircle, ArrowUpCircle, ArrowLeftRight, SlidersHorizontal,
  Pencil, Trash2,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Transaction } from "@/types";
import { useWalletStore } from "@/stores/walletStore";
import { useCategoryStore } from "@/stores/categoryStore";
import { useTransactionStore } from "@/stores/transactionStore";
import ConfirmDialog from "@/components/shared/ConfirmDialog";

const TYPE_CONFIG = {
  income: {
    icon: ArrowDownCircle,
    colorClass: "type-income",
    bgClass: "type-income-bg",
    label: "Pemasukan",
    prefix: "+",
    amountClass: "text-emerald-600 dark:text-emerald-400",
  },
  expense: {
    icon: ArrowUpCircle,
    colorClass: "type-expense",
    bgClass: "type-expense-bg",
    label: "Pengeluaran",
    prefix: "-",
    amountClass: "text-red-600 dark:text-red-400",
  },
  transfer: {
    icon: ArrowLeftRight,
    colorClass: "type-transfer",
    bgClass: "type-transfer-bg",
    label: "Transfer",
    prefix: "",
    amountClass: "text-blue-600 dark:text-blue-400",
  },
  adjustment_increase: {
    icon: SlidersHorizontal,
    colorClass: "type-adjustment",
    bgClass: "type-adjustment-bg",
    label: "Koreksi Saldo",
    prefix: "+",
    amountClass: "text-amber-600 dark:text-amber-400",
  },
  adjustment_decrease: {
    icon: SlidersHorizontal,
    colorClass: "type-adjustment",
    bgClass: "type-adjustment-bg",
    label: "Koreksi Saldo",
    prefix: "-",
    amountClass: "text-amber-600 dark:text-amber-400",
  },
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

  const isTransfer = transaction.type === "transfer";
  const isCorrection = transaction.isCorrection === true;

  const label = isCorrection
    ? config.label
    : isTransfer
      ? "Transfer"
      : category?.name ?? "Tanpa kategori";

  const walletLabel = isTransfer
    ? `${wallet?.name ?? "?"} → ${toWallet?.name ?? "?"}`
    : wallet?.name ?? "?";

  const handleDelete = async () => {
    await deleteTransaction(transaction.id);
    setConfirmOpen(false);
  };

  return (
    <>
      <div className="group flex items-center gap-3 rounded-xl bg-card border border-border/60 px-3.5 py-3 transition-all duration-200 hover:border-border hover:shadow-sm">
        {/* Icon */}
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${config.bgClass}`}>
          <Icon className={`h-4 w-4 ${config.colorClass}`} />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-medium text-foreground">{label}</p>
            <p className={`shrink-0 text-sm font-semibold tabular-nums ${config.amountClass}`}>
              {config.prefix}{formatCurrency(transaction.amount)}
            </p>
          </div>
          <div className="flex items-center justify-between gap-2 mt-0.5">
            <p className="text-xs text-muted-foreground truncate">
              {walletLabel} · {formatDate(transaction.date)}
            </p>
            {!isCorrection && (
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => navigate(`/transactions/${transaction.id}`)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  aria-label="Edit transaksi"
                >
                  <Pencil className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmOpen(true)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  aria-label="Hapus transaksi"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
          {transaction.note && (
            <p className="mt-0.5 text-xs text-muted-foreground/70 italic truncate">{transaction.note}</p>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Hapus Transaksi"
        description="Yakin ingin menghapus transaksi ini? Tindakan ini tidak dapat dibatalkan."
        onConfirm={handleDelete}
      />
    </>
  );
}
