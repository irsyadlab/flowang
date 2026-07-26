import { useMemo } from "react";
import { useTransactionStore } from "@/stores/transactionStore";
import { useCategoryStore } from "@/stores/categoryStore";
import { formatCurrency, localDateStr } from "@/lib/utils";
import { filterByDateRange, calculateSummary } from "@/lib/reportEngine";
import { TrendingUp, TrendingDown } from "lucide-react";
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

function getColor(index: number): string {
  return CATEGORY_COLORS[index % CATEGORY_COLORS.length];
}

function renderCustomLabel(props: PieLabelRenderProps) {
  const { cx, cy, midAngle, outerRadius, name, percent } = props as {
    cx: number; cy: number; midAngle: number; outerRadius: number;
    name: string; percent: number;
  };

  if (percent < 0.04) return null;

  const RADIAN = Math.PI / 180;
  const r1 = outerRadius + 8;
  const r2 = outerRadius + 22;
  const r3 = outerRadius + 28;

  const sx = cx + r1 * Math.cos(-midAngle * RADIAN);
  const sy = cy + r1 * Math.sin(-midAngle * RADIAN);
  const ex = cx + r2 * Math.cos(-midAngle * RADIAN);
  const ey = cy + r2 * Math.sin(-midAngle * RADIAN);
  const lx = cx + r3 * Math.cos(-midAngle * RADIAN);
  const ly = cy + r3 * Math.sin(-midAngle * RADIAN);

  const isRight = lx > cx;
  const truncated = name.length > 8 ? name.slice(0, 7) + "…" : name;

  return (
    <g>
      <line x1={sx} y1={sy} x2={ex} y2={ey} stroke="#94a3b8" strokeWidth={1} />
      <text
        x={lx}
        y={ly}
        textAnchor={isRight ? "start" : "end"}
        dominantBaseline="central"
        fontSize={10}
        fill="#94a3b8"
      >
        {truncated}
      </text>
    </g>
  );
}

interface TooltipItem {
  name: string;
  value: number;
  payload: { percentage: number; color: string };
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipItem[] }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="rounded-xl border border-border/60 bg-card px-3 py-2 shadow-lg text-xs space-y-0.5">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.payload.color }} />
        <span className="font-semibold text-foreground">{item.name}</span>
      </div>
      <p className="text-muted-foreground tabular-nums pl-4">{formatCurrency(item.value)}</p>
      <p className="text-muted-foreground pl-4">{item.payload.percentage}%</p>
    </div>
  );
}

export default function RealtimeReport() {
  const rawTransactions = useTransactionStore((s) => s.transactions);
  const categories = useCategoryStore((s) => s.categories);

  const { dateFrom, dateTo, monthLabel } = useMemo(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      dateFrom: localDateStr(firstDay),
      dateTo: localDateStr(lastDay),
      monthLabel: now.toLocaleDateString("id-ID", { month: "long", year: "numeric" }),
    };
  }, []);

  const monthlyTransactions = useMemo(
    () => filterByDateRange(rawTransactions, dateFrom, dateTo),
    [rawTransactions, dateFrom, dateTo]
  );

  const summary = useMemo(() => calculateSummary(monthlyTransactions), [monthlyTransactions]);

  const savingsRate = summary.totalIncome > 0
    ? Math.round(((summary.totalIncome - summary.totalExpense) / summary.totalIncome) * 100)
    : 0;

  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    for (const tx of monthlyTransactions) {
      if (tx.type !== "expense" || tx.isCorrection || tx.isLoanLinked) continue;
      const key = tx.categoryId ?? "__uncategorized__";
      map.set(key, (map.get(key) ?? 0) + tx.amount);
    }
    const total = summary.totalExpense || 1;
    return Array.from(map.entries())
      .map(([categoryId, amount]) => {
        const category = categories.find((c) => c.id === categoryId);
        return {
          categoryId,
          name: category?.name ?? "Lainnya",
          amount,
          percentage: Math.round((amount / total) * 100),
          color: "",
        };
      })
      .sort((a, b) => b.amount - a.amount)
      .map((item, i) => ({ ...item, color: getColor(i) }));
  }, [monthlyTransactions, categories, summary.totalExpense]);

  return (
    <div className="space-y-3">

      {/* Hero card — income / expense / savings */}
      <div className="hero-card noise-overlay rounded-2xl p-5 text-white shadow-[0_4px_16px_rgba(0,0,0,0.25)]">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-[10px] font-medium text-white/50 uppercase tracking-widest">Ringkasan Bulan Ini</p>
            <p className="text-xs text-white/40 capitalize mt-0.5">{monthLabel}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-white/40 uppercase tracking-wider">Tabungan</p>
            <p className={`text-sm font-bold ${savingsRate >= 0 ? "text-emerald-300" : "text-red-300"}`}>
              {savingsRate}%
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-400/20">
              <TrendingUp className="h-4 w-4 text-emerald-300" />
            </div>
            <div>
              <p className="text-[10px] text-white/50 uppercase tracking-wider">Pemasukan</p>
              <p className="text-sm font-semibold text-emerald-300 tabular-nums">
                {formatCurrency(summary.totalIncome)}
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
                {formatCurrency(summary.totalExpense)}
              </p>
            </div>
          </div>
        </div>

        {/* Saldo bersih */}
        <div className="h-px bg-white/10 mb-3" />
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-white/40 uppercase tracking-wider">Saldo Bersih</p>
          <p className={`text-base font-bold tabular-nums ${summary.netBalance >= 0 ? "text-emerald-300" : "text-red-300"}`}>
            {formatCurrency(summary.netBalance)}
          </p>
        </div>

        {/* Progress bar */}
        {summary.totalIncome > 0 && (
          <div className="mt-3">
            <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-red-400 to-orange-300 transition-all duration-700"
                style={{ width: `${Math.max(0, Math.min(100, (summary.totalExpense / summary.totalIncome) * 100))}%` }}
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

          {/* Donut chart */}
          <div className="w-full" style={{ height: 280 }}>
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
                  label={renderCustomLabel}
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

          {/* Category list dengan progress bar */}
          <div className="space-y-3 mt-1">
            {categoryBreakdown.map((item, i) => (
              <div key={item.categoryId}>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: getColor(i) }}
                  />
                  <p className="flex-1 text-xs text-foreground truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground tabular-nums">{item.percentage}%</p>
                  <p className="text-xs font-semibold tabular-nums text-foreground w-24 text-right">
                    {formatCurrency(item.amount)}
                  </p>
                </div>
                <div className="h-1 w-full rounded-full bg-muted overflow-hidden ml-[18px]">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: getColor(i),
                      opacity: 0.75,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
