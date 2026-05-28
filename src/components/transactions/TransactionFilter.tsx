import { useTransactionStore } from "@/stores/transactionStore";
import { useWalletStore } from "@/stores/walletStore";
import { useCategoryStore } from "@/stores/categoryStore";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

export default function TransactionFilter() {
  const { filter, setFilter, clearFilter } = useTransactionStore();
  const wallets = useWalletStore((s) => s.wallets);
  const categories = useCategoryStore((s) => s.categories);

  const hasFilter = filter.walletId || filter.categoryId || filter.type || filter.dateFrom || filter.dateTo;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-3">
      <div className="grid grid-cols-2 gap-3">
        <Select
          value={filter.walletId ?? ""}
          onValueChange={(v) => setFilter({ walletId: v || undefined })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Semua Wallet" />
          </SelectTrigger>
          <SelectContent>
            {wallets.map((w) => (
              <SelectItem key={w.id} value={w.id}>
                {w.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filter.categoryId ?? ""}
          onValueChange={(v) => setFilter({ categoryId: v || undefined })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Semua Kategori" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Select
        value={filter.type ?? ""}
        onValueChange={(v) => setFilter({ type: (v || undefined) as "income" | "expense" | "transfer" | undefined })}
      >
        <SelectTrigger>
          <SelectValue placeholder="Semua Tipe" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="income">Income</SelectItem>
          <SelectItem value="expense">Expense</SelectItem>
          <SelectItem value="transfer">Transfer</SelectItem>
        </SelectContent>
      </Select>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Dari Tanggal</label>
          <input
            type="date"
            value={filter.dateFrom ?? ""}
            onChange={(e) => setFilter({ dateFrom: e.target.value || undefined })}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] focus-visible:ring-4 focus-visible:outline-1"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Sampai Tanggal</label>
          <input
            type="date"
            value={filter.dateTo ?? ""}
            onChange={(e) => setFilter({ dateTo: e.target.value || undefined })}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] focus-visible:ring-4 focus-visible:outline-1"
          />
        </div>
      </div>

      {hasFilter && (
        <Button variant="ghost" size="sm" onClick={clearFilter} className="gap-1.5">
          <RotateCcw className="h-3.5 w-3.5" />
          Reset Filter
        </Button>
      )}
    </div>
  );
}
