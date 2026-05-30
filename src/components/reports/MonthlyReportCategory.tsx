import { useMemo } from "react";
import { filterByDateRange } from "@/lib/reportEngine";
import { formatCurrency } from "@/lib/utils";
import { useTransactionStore } from "@/stores/transactionStore";
import { useCategoryStore } from "@/stores/categoryStore";
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

interface Props {
  dateFrom: string;
  dateTo: string;
}

export default function MonthlyReportCategory({ dateFrom, dateTo }: Props) {
  const rawTransactions = useTransactionStore((s) => s.transactions);
  const { categories } = useCategoryStore();

  const transactions = useMemo(
    () => filterByDateRange(rawTransactions, dateFrom, dateTo),
    [rawTransactions, dateFrom, dateTo]
  );

  // Days in range for daily average
  const daysInRange = useMemo(() => {
    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    return Math.max(1, Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1);
  }, [dateFrom, dateTo]);

  const { expenseBreakdown, incomeBreakdown, totalExpense, totalIncome } = useMemo(() => {
    const expMap = new Map<string, number>();
    const incMap = new Map<string, number>();
    let totalExpense = 0;
    let totalIncome = 0;

    for (const tx of transactions) {
      if (tx.isCorrection || tx.isLoanLinked || tx.type === "transfer") continue;
      const key = tx.categoryId ?? "__none__";
      if (tx.type === "expense") {
        expMap.set(key, (expMap.get(key) ?? 0) + tx.amount);
        totalExpense += tx.amount;
      } else if (tx.type === "income") {
        incMap.set(key, (incMap.get(key) ?? 0) + tx.amount);
        totalIncome += tx.amount;
      }
    }

    const toBreakdown = (map: Map<string, number>, total: number) =>
      Array.from(map.entries())
        .map(([categoryId, amount]) => ({
          categoryId,
          name: categories.find((c) => c.id === categoryId)?.name ?? "Lainnya",
          amount,
          percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
          color: "",
        }))
        .sort((a, b) => b.amount - a.amount)
        .map((item, i) => ({ ...item, color: getColor(i) }));

    return {
      expenseBreakdown: toBreakdown(expMap, totalExpense),
      incomeBreakdown: toBreakdown(incMap, totalIncome),
      totalExpense,
      totalIncome,
    };
  }, [transactions, categories]);

  const avgDailyExpense = totalExpense / daysInRange;
  const avgDailyIncome = totalIncome / daysInRange;

  return (
    <div className="space-y-3">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-card border border-border/60 p-4 space-y-3">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Total Pengeluaran</p>
            <p className="text-base font-bold text-red-600 dark:text-red-400 tabular-nums">{formatCurrency(totalExpense)}</p>
          </div>
          <div className="h-px bg-border/40" />
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Rata-rata Harian</p>
            <p className="text-sm font-semibold text-red-600/80 dark:text-red-400/80 tabular-nums">{formatCurrency(avgDailyExpense)}</p>
          </div>
        </div>
        <div className="rounded-2xl bg-card border border-border/60 p-4 space-y-3">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Total Pendapatan</p>
            <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{formatCurrency(totalIncome)}</p>
          </div>
          <div className="h-px bg-border/40" />
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Rata-rata Harian</p>
            <p className="text-sm font-semibold text-emerald-600/80 dark:text-emerald-400/80 tabular-nums">{formatCurrency(avgDailyIncome)}</p>
          </div>
        </div>
      </div>

      {/* Expense breakdown */}
      {expenseBreakdown.length > 0 && (
        <div className="rounded-2xl bg-card border border-border/60 p-4">
          <p className="text-sm font-semibold text-foreground mb-4">Pengeluaran per Kategori</p>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie data={expenseBreakdown} dataKey="amount" nameKey="name" cx="50%" cy="50%"
                  innerRadius="38%" outerRadius="58%" paddingAngle={2} labelLine={false} label={renderLabel} strokeWidth={0}>
                  {expenseBreakdown.map((item, i) => <Cell key={item.categoryId} fill={getColor(i)} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2.5 mt-2">
            {expenseBreakdown.map((item, i) => (
              <div key={item.categoryId}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: getColor(i) }} />
                  <p className="flex-1 text-xs text-foreground truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground tabular-nums">{item.percentage}%</p>
                  <p className="text-xs font-semibold tabular-nums text-foreground w-24 text-right">{formatCurrency(item.amount)}</p>
                </div>
                <div className="h-1 w-full rounded-full bg-muted overflow-hidden ml-4">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${item.percentage}%`, backgroundColor: getColor(i), opacity: 0.75 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Income breakdown */}
      {incomeBreakdown.length > 0 && (
        <div className="rounded-2xl bg-card border border-border/60 p-4">
          <p className="text-sm font-semibold text-foreground mb-3">Pendapatan per Kategori</p>
          <div className="space-y-2.5">
            {incomeBreakdown.map((item, i) => (
              <div key={item.categoryId}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="h-2 w-2 rounded-full flex-shrink-0 bg-emerald-500" style={{ opacity: 1 - i * 0.1 }} />
                  <p className="flex-1 text-xs text-foreground truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground tabular-nums">{item.percentage}%</p>
                  <p className="text-xs font-semibold tabular-nums text-foreground w-24 text-right">{formatCurrency(item.amount)}</p>
                </div>
                <div className="h-1 w-full rounded-full bg-muted overflow-hidden ml-4">
                  <div className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                    style={{ width: `${item.percentage}%`, opacity: 0.7 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
