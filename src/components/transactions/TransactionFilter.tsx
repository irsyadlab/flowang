import { useState } from "react";
import { useTransactionStore } from "@/stores/transactionStore";
import { useWalletStore } from "@/stores/walletStore";
import { useCategoryStore } from "@/stores/categoryStore";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, RotateCcw, ChevronDown } from "lucide-react";

export default function TransactionFilter() {
  const { filter, setFilter, clearFilter } = useTransactionStore();
  const wallets = useWalletStore((s) => s.wallets);
  const categories = useCategoryStore((s) => s.categories);
  const [expanded, setExpanded] = useState(false);

  const hasFilter = filter.walletId || filter.categoryId || filter.type || filter.dateFrom || filter.dateTo;
  const activeCount = [filter.walletId, filter.categoryId, filter.type, filter.dateFrom || filter.dateTo]
    .filter(Boolean).length;

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Filter toggle header */}
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium transition-colors hover:bg-accent/50"
      >
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <span>Filter</span>
          {activeCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {activeCount}
            </span>
          )}
        </div>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
      </button>

      {/* Filter content */}
      {expanded && (
        <div className="border-t border-border px-4 pb-4 pt-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Select
              value={filter.walletId ?? ""}
              onValueChange={(v) => setFilter({ walletId: v || undefined })}
            >
              <SelectTrigger className="rounded-xl h-9 text-xs">
                <SelectValue placeholder="Semua Wallet" />
              </SelectTrigger>
              <SelectContent>
                {wallets.map((w) => (
                  <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filter.categoryId ?? ""}
              onValueChange={(v) => setFilter({ categoryId: v || undefined })}
            >
              <SelectTrigger className="rounded-xl h-9 text-xs">
                <SelectValue placeholder="Semua Kategori" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Select
            value={filter.type ?? ""}
            onValueChange={(v) => setFilter({ type: (v || undefined) as "income" | "expense" | "transfer" | undefined })}
          >
            <SelectTrigger className="rounded-xl h-9 text-xs">
              <SelectValue placeholder="Semua Tipe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="income">Pemasukan</SelectItem>
              <SelectItem value="expense">Pengeluaran</SelectItem>
              <SelectItem value="transfer">Transfer</SelectItem>
            </SelectContent>
          </Select>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Dari Tanggal</label>
              <input
                type="date"
                value={filter.dateFrom ?? ""}
                onChange={(e) => setFilter({ dateFrom: e.target.value || undefined })}
                className="flex h-9 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-xs shadow-xs transition-[color,box-shadow] focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-ring/50"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Sampai Tanggal</label>
              <input
                type="date"
                value={filter.dateTo ?? ""}
                onChange={(e) => setFilter({ dateTo: e.target.value || undefined })}
                className="flex h-9 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-xs shadow-xs transition-[color,box-shadow] focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-ring/50"
              />
            </div>
          </div>

          {hasFilter && (
            <Button variant="ghost" size="sm" onClick={clearFilter} className="w-full gap-1.5 rounded-xl text-xs">
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Filter
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
