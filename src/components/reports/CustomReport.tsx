import { useMemo, useState } from "react";
import { calculateSummary, filterByDateRange } from "@/lib/reportEngine";
import { formatCurrency } from "@/lib/utils";
import { useTransactionStore } from "@/stores/transactionStore";
import { useCategoryStore } from "@/stores/categoryStore";
import { Button } from "@/components/ui/button";
import { DatePickerSheet, formatDateID } from "@/components/ui/date-picker-sheet";
import EmptyState from "@/components/shared/EmptyState";
import {
  BarChart3, TrendingUp, TrendingDown, Search, CalendarRange,
} from "lucide-react";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  type PieLabelRenderProps,
} from "recharts";

const CATEGORY_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6",
  "#f59e0b", "#6366f1", "#84cc16", "#06b6d4",
  "#a855f7", "#10b981", "#fb923c", "#e11d48",
];
function getColor(i: number) { return CATEGORY_COLORS[i % CATEGORY_COLORS.length]; }

function renderLabel(props: PieLabelRenderProps) {
  const { cx, cy, midAngle, outerRadius, name, percent } = props as {
    cx: number; cy: number; midAngle: number; outerRadius: number; name: string; percent: number;
  };
  if (percent < 0.04) return null;
  const R = Math.PI / 180;
  const sx = cx + (outerRadius + 6) * Math.cos(-midAngle * R);
  const sy = cy + (outerRadius + 6) * Math.sin(-midAngle * R);
  const ex = cx + (outerRadius + 20) * Math.cos(-midAngle * R);
  const ey = cy + (outerRadius + 20) * Math.sin(-midAngle * R);
  const lx = cx + (outerRadius + 26) * Math.cos(-midAngle * R);
  const ly = cy + (outerRadius + 26) * Math.sin(-midAngle * R);
  const truncated = name.length > 8 ? name.slice(0, 7) + "…" : name;
  return (
    <g>
      <line x1={sx} y1={sy} x2={ex} y2={ey} stroke="#94a3b8" strokeWidth={1} />
      <text x={lx} y={ly} textAnchor={lx > cx ? "start" : "end"} dominantBaseline="central" fontSize={10} fill="#94a3b8">
        {truncated}
      </text>
    </g>
  );
}

interface TooltipItem {
  name: string; value: number; payload: { percentage: number; color: string };
}
function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipItem[] }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="rounded-xl border border-border/60 bg-card px-3 py-2 shadow-lg text-xs space-y-0.5">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.payload.color }} />
        <span className="font-semibold text-foreground">{item.name}</span>
      </div>
      <p className="text-muted-foreground tabular-nums pl-4">{formatCurrency(item.value)}</p>
      <p className="text-muted-foreground pl-4">{item.payload.percentage}%</p>
    </div>
  );
}

function formatDateLabel(dateStr: string) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

export default function CustomReport() {
  const rawTransactions = useTransactionStore((s) => s.transactions);
  const { categories } = useCategoryStore();

  const today = (() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
  })();

  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [appliedRange, setAppliedRange] = useState<{ from: string; to: string } | null>(null);
  const [rangeError, setRangeError] = useState("");

  const handleSubmit = () => {
    setRangeError("");
    if (startDate > endDate) {
      setRangeError("Tanggal mulai tidak boleh lebih besar dari tanggal akhir");
      return;
    }
    setAppliedRange({ from: startDate, to: endDate });
  };

  const filteredTransactions = useMemo(() => {
    if (!appliedRange) return [];
    return filterByDateRange(rawTransactions, appliedRange.from, appliedRange.to);
  }, [rawTransactions, appliedRange]);

  const result = useMemo(() => {
    if (!appliedRange) return null;
    return calculateSummary(filteredTransactions);
  }, [filteredTransactions, appliedRange]);

  const savingsRate = result && result.totalIncome > 0
    ? Math.round(((result.totalIncome - result.totalExpense) / result.totalIncome) * 100)
    : 0;

  const categoryBreakdown = useMemo(() => {
    if (!result) return [];
    const map = new Map<string, number>();
    for (const tx of filteredTransactions) {
      if (tx.type !== "expense" || tx.isCorrection || tx.isLoanLinked) continue;
      const key = tx.categoryId ?? "__none__";
      map.set(key, (map.get(key) ?? 0) + tx.amount);
    }
    const total = result.totalExpense || 1;
    return Array.from(map.entries())
      .map(([categoryId, amount]) => ({
        categoryId,
        name: categories.find((c) => c.id === categoryId)?.name ?? "Lainnya",
        amount,
        percentage: Math.round((amount / total) * 100),
        color: "",
      }))
      .sort((a, b) => b.amount - a.amount)
      .map((item, i) => ({ ...item, color: getColor(i) }));
  }, [filteredTransactions, categories, result]);

  const hasData = result && (result.totalIncome > 0 || result.totalExpense > 0);

  return (
    <div className="space-y-3">
      {/* Date range picker */}
      <div className="rounded-2xl border border-border/60 bg-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/8">
            <CalendarRange className="h-4 w-4 text-primary" />
          </div>
          <p className="text-sm font-semibold text-foreground">Rentang Tanggal</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              Mulai
            </label>
            <DatePickerSheet
              value={startDate}
              onChange={(ymd) => { setStartDate(ymd); setRangeError(""); }}
              label="Tanggal Mulai"
              trigger={
                <div className="flex h-9 w-full items-center rounded-xl border border-input bg-transparent px-3 text-sm font-medium text-foreground cursor-pointer hover:bg-muted transition-colors">
                  {formatDateID(startDate)}
                </div>
              }
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              Akhir
            </label>
            <DatePickerSheet
              value={endDate}
              onChange={(ymd) => { setEndDate(ymd); setRangeError(""); }}
              label="Tanggal Akhir"
              trigger={
                <div className="flex h-9 w-full items-center rounded-xl border border-input bg-transparent px-3 text-sm font-medium text-foreground cursor-pointer hover:bg-muted transition-colors">
                  {formatDateID(endDate)}
                </div>
              }
            />
          </div>
        </div>

        {rangeError && (
          <p className="text-xs text-destructive">{rangeError}</p>
        )}

        <Button
          onClick={handleSubmit}
          className="w-full rounded-xl gap-2"
        >
          <Search className="h-4 w-4" />
          Tampilkan Laporan
        </Button>
      </div>

      {/* Results */}
      {result && !hasData && (
        <EmptyState
          icon={BarChart3}
          title="Tidak ada data"
          description="Tidak ada transaksi dalam rentang tanggal ini."
        />
      )}

      {hasData && appliedRange && (
        <div className="space-y-3 animate-[slide-up_0.3s_ease-out]">

          {/* Hero summary */}
          <div className="hero-card noise-overlay rounded-2xl p-5 text-white shadow-[0_4px_16px_rgba(0,0,0,0.25)]">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-[10px] font-medium text-white/50 uppercase tracking-widest">Ringkasan</p>
                <p className="text-xs text-white/40 mt-0.5">
                  {formatDateLabel(appliedRange.from)} – {formatDateLabel(appliedRange.to)}
                </p>
              </div>
              {result.totalIncome > 0 && (
                <div className="text-right">
                  <p className="text-[10px] text-white/40 uppercase tracking-wider">Tabungan</p>
                  <p className={`text-sm font-bold ${savingsRate >= 0 ? "text-emerald-300" : "text-red-300"}`}>
                    {savingsRate}%
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-400/20">
                  <TrendingUp className="h-4 w-4 text-emerald-300" />
                </div>
                <div>
                  <p className="text-[10px] text-white/50 uppercase tracking-wider">Pemasukan</p>
                  <p className="text-sm font-semibold text-emerald-300 tabular-nums">
                    {formatCurrency(result.totalIncome)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-400/20">
                  <TrendingDown className="h-4 w-4 text-red-300" />
                </div>
                <div>
                  <p className="text-[10px] text-white/50 uppercase tracking-wider">Pengeluaran</p>
                  <p className="text-sm font-semibold text-red-300 tabular-nums">
                    {formatCurrency(result.totalExpense)}
                  </p>
                </div>
              </div>
            </div>

            <div className="h-px bg-white/10 mb-3" />
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-white/40 uppercase tracking-wider">Saldo Bersih</p>
              <p className={`text-base font-bold tabular-nums ${result.netBalance >= 0 ? "text-emerald-300" : "text-red-300"}`}>
                {formatCurrency(result.netBalance)}
              </p>
            </div>

            {result.totalIncome > 0 && (
              <div className="mt-3">
                <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-red-400 to-orange-300 transition-all duration-700"
                    style={{ width: `${Math.max(0, Math.min(100, (result.totalExpense / result.totalIncome) * 100))}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <p className="text-[9px] text-white/30">0%</p>
                  <p className="text-[9px] text-white/30">Rasio pengeluaran</p>
                  <p className="text-[9px] text-white/30">100%</p>
                </div>
              </div>
            )}
          </div>

          {/* Category breakdown */}
          {categoryBreakdown.length > 0 && (
            <div className="rounded-2xl bg-card border border-border/60 p-4">
              <p className="text-sm font-semibold text-foreground mb-4">Pengeluaran per Kategori</p>

              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={categoryBreakdown}
                      dataKey="amount"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius="38%"
                      outerRadius="58%"
                      paddingAngle={2}
                      labelLine={false}
                      label={renderLabel}
                      strokeWidth={0}
                    >
                      {categoryBreakdown.map((item, i) => (
                        <Cell key={item.categoryId} fill={getColor(i)} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2.5 mt-2">
                {categoryBreakdown.map((item, i) => (
                  <div key={item.categoryId}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: getColor(i) }} />
                      <p className="flex-1 text-xs text-foreground truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground tabular-nums">{item.percentage}%</p>
                      <p className="text-xs font-semibold tabular-nums text-foreground w-24 text-right">
                        {formatCurrency(item.amount)}
                      </p>
                    </div>
                    <div className="h-1 w-full rounded-full bg-muted overflow-hidden ml-4">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${item.percentage}%`, backgroundColor: getColor(i), opacity: 0.75 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
