import { useNavigate } from "react-router-dom";
import { useTransactionStore } from "@/stores/transactionStore";
import TransactionForm from "@/components/transactions/TransactionForm";
import type { TransactionInput } from "@/lib/validators";

export default function NewTransactionPage() {
  const navigate = useNavigate();
  const addTransaction = useTransactionStore((s) => s.addTransaction);

  const handleSubmit = async (data: TransactionInput) => {
    await addTransaction({
      type: data.type,
      amount: data.amount,
      walletId: data.walletId,
      toWalletId: data.toWalletId || undefined,
      categoryId: data.categoryId || undefined,
      date: data.date,
      note: data.note || undefined,
    });
    navigate("/transactions");
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-lg font-semibold">Transaksi Baru</h1>
      <TransactionForm onSubmit={handleSubmit} submitLabel="Buat Transaksi" />
    </div>
  );
}
