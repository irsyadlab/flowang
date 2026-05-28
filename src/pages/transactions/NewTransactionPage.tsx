import { useNavigate, useSearchParams } from "react-router-dom";

import { useTransactionStore } from "@/stores/transactionStore";
import TransactionForm from "@/components/transactions/TransactionForm";
import type { TransactionInput } from "@/lib/validators";
import { localDateStr } from "@/lib/utils";

export default function NewTransactionPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const addTransaction = useTransactionStore((s) => s.addTransaction);

  const walletId = searchParams.get("walletId") || undefined;

  const today = localDateStr();

  const initialData = walletId
    ? {
        type: "expense" as const,
        amount: 0,
        walletId,
        toWalletId: "",
        categoryId: "",
        date: today,
        note: "",
      }
    : undefined;

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
    <div className="flex flex-col gap-4 p-4 pb-6">
      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          aria-label="Kembali"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h1 className="text-xl font-bold text-foreground">Transaksi Baru</h1>
      </div>
      <TransactionForm initialData={initialData} onSubmit={handleSubmit} submitLabel="Buat Transaksi" />
    </div>
  );
}
