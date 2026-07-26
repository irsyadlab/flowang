import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { useTransactionStore } from "@/stores/transactionStore";
import TransactionForm from "@/components/transactions/TransactionForm";
import ErrorMessage from "@/components/shared/ErrorMessage";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import type { TransactionInput } from "@/lib/validators";

export default function EditTransactionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const transactions = useTransactionStore((s) => s.transactions);
  const updateTransaction = useTransactionStore((s) => s.updateTransaction);
  const deleteTransaction = useTransactionStore((s) => s.deleteTransaction);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const transaction = transactions.find((t) => t.id === id);

  if (!transaction) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <ErrorMessage message="Transaksi tidak ditemukan" />
      </div>
    );
  }

  const handleSubmit = async (data: TransactionInput) => {
    await updateTransaction(transaction.id, {
      type: data.type,
      amount: data.amount,
      walletId: data.walletId,
      toWalletId: data.toWalletId || undefined,
      categoryId: data.categoryId || undefined,
      date: data.date,
      time: data.time || undefined,
      note: data.note || undefined,
    });
    navigate("/transactions");
  };

  const handleDelete = async () => {
    await deleteTransaction(transaction.id);
    setConfirmOpen(false);
    navigate("/transactions");
  };

  return (
    <div className="flex flex-col gap-4 p-4 pb-6">
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            aria-label="Kembali"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <h1 className="text-xl font-bold text-foreground">Edit Transaksi</h1>
        </div>
        {!transaction.isCorrection && (
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            aria-label="Hapus transaksi"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <TransactionForm
        initialData={{
          type: transaction.type as 'income' | 'expense' | 'transfer',
          amount: transaction.amount,
          walletId: transaction.walletId,
          toWalletId: transaction.toWalletId ?? "",
          categoryId: transaction.categoryId ?? "",
          date: transaction.date,
          time: transaction.time ?? "",
          note: transaction.note ?? "",
        }}
        onSubmit={handleSubmit}
        submitLabel="Simpan Perubahan"
      />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Hapus Transaksi"
        description="Yakin ingin menghapus transaksi ini? Tindakan ini tidak dapat dibatalkan."
        onConfirm={handleDelete}
      />
    </div>
  );
}
