import { useState } from "react";
import { useTransactionStore } from "@/stores/transactionStore";
import { useWalletStore } from "@/stores/walletStore";
import { useCategoryStore } from "@/stores/categoryStore";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DatePickerSheet } from "@/components/ui/date-picker-sheet";
import { SlidersHorizontal, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { localDateStr } from "@/lib/utils";

/** Get today as YYYY-MM-DD in local time */
function today(): string {
  return localDateStr();
}

/** Shift a YYYY-MM-DD by delta days */
function shiftDay(ymd: string, delta: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + delta);
  return localDateStr(date);
}

export default function TransactionFilter() {
  const filter = useTransactionStore((s) => s.filter);
  const setFilter = useTransactionStore((s) => s.setFilter);
  const wallets = useWalletStore((s) => s.wallets);
  const categories = useCategoryStore((s) => s.categories);
  const [filterOpen, setFilterOpen] = useState(false);

  // Active date — derived from filter.dateFrom, fallback to today
  const activeDate = filter.dateFrom ?? today();

  const applyDate = (ymd: string) => {
    sessionStorage.setItem("tx_filter_date", ymd);
    setFilter({ dateFrom: ymd, dateTo: ymd });
  };

  const hasExtraFilter = filter.walletId || filter.categoryId || filter.type;
  const extraCount = [filter.walletId, filter.categoryId, filter.type].filter(Boolean).length;

  return (
    <div className="space-y-2">
      {/* Top bar: date navigator (left) + filter button (right) */}
      <div className="flex items-center justify-between gap-2">

        {/* Date navigator */}
        <div data-tour="tx-date-nav" className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => applyDate(shiftDay(activeDate, -1))}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:bg-muted"
            aria-label="Hari sebelumnya"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <DatePickerSheet
            value={activeDate}
            onChange={applyDate}
            triggerClassName="border-border bg-card"
          />

          <button
            type="button"
            onClick={() => applyDate(shiftDay(activeDate, 1))}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:bg-muted"
            aria-label="Hari berikutnya"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Filter toggle button */}
        <button
          data-tour="tx-filter-btn"
          type="button"
          onClick={() => setFilterOpen((o) => !o)}
          className={`relative flex h-8 items-center gap-1.5 rounded-xl border px-3 text-xs font-medium transition-colors ${
            filterOpen || hasExtraFilter
              ? "border-primary/40 bg-primary/10 text-primary"
              : "border-border bg-card text-muted-foreground hover:bg-muted"
          }`}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filter
          {extraCount > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
              {extraCount}
            </span>
          )}
        </button>
      </div>

      {/* Expandable filter panel */}
      {filterOpen && (
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
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
            onValueChange={(v) =>
              setFilter({ type: (v || undefined) as "income" | "expense" | "transfer" | undefined })
            }
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

          {hasExtraFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilter({ walletId: undefined, categoryId: undefined, type: undefined })}
              className="w-full gap-1.5 rounded-xl text-xs"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Filter
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
