import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTransactionStore } from "@/stores/transactionStore";
import { groupByMonth } from "@/lib/reportEngine";
import { formatCurrency } from "@/lib/utils";
import EmptyState from "@/components/shared/EmptyState";
import { BarChart3, ChevronRight, TrendingUp, TrendingDown } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

interface ChartTooltipProps {
  active?: boolean;
  payload?: { dataKey: string; value: number; payload: { label: string } }[];
}

function CustomTooltip({ active, payload }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const income = payload.find((p) => p.dataKey === "totalIncome")?.value ?? 0;
  const expense = payload.find((p) => p.dataKey === "totalExpense")?.value ?? 0;
  const net = income - expense;
  const label = payload[0]?.payload?.label;
  return (
    <div className="rounded-xl border border-border/60 bg-card px-3 py-2.5 shadow-lg text-xs space-y-1.5 min-w-[150px]">
      <p className="font-semibold text-foreground">{label}</p>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
          <span className="text-muted-foreground">Masuk</span>
        </div>
        <span className="font-medium text-emerald-600 dark:text-emerald-400 tabular-nums">{formatCurrency(income)}</span>
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500 flex-shrink-0" />
          <span className="text-muted-foreground">Keluar</span>
        </div>
        <span className="font-medium text-red-600 dark:text-red-400 tabular-nums">{formatCurrency(expense)}</span>
      </div>
      <div className="h-px bg-border/60" />
      <div className="flex items-center justify-between gap-4">
        <span className="text-muted-foreground">Selisih</span>
        <span className={`font-semibold tabular-nums ${net >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
          {net >= 0 ? "+" : ""}{formatCurrency(net)}
        </span>
      </div>
    </div>
  );
}

export default function MonthlyReport() {
  const navigate = useNavigate();
  const rawTransactions = useTransactionStore((s) => s.transactions);
  const monthlyReports = useMemo(() => groupByMonth(rawTransactions), [rawTransactions]);

  const chartData = useMemo(() => {
    return [...monthlyReports]
      .slice(0, 6)
      .reverse()
      .map((row) => ({
        label: `${MONTH_SHORT[row.month - 1]} ${row.year}`,
        totalIncome: row.totalIncome,
        totalExpense: row.totalExpense,
      }));
  }, [monthlyReports]);

  if (monthlyReports.length === 0) {
    return (
      <EmptyState
        icon={BarChart3}
        title="Belum ada data"
        description="Data laporan bulanan akan muncul setelah ada transaksi."
      />
    );
  }

  return (
    <div className="space-y-3">
      {/* Bar chart tren */}
      <div className="rounded-2xl bg-card border border-border/60 p-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-foreground">Tren Bulanan</p>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />Masuk
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-500" />Keluar
            </div>
          </div>
        </div>
        <div style={{ height: 180 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barCategoryGap="32%" barGap={3}>
              <CartesianGrid vertical={false} stroke="currentColor" strokeOpacity={0.06} />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "currentColor", opacity: 0.45 }} />
              <YAxis axisLine={false} tickLine={false} width={32}
                tick={{ fontSize: 9, fill: "currentColor", opacity: 0.35 }}
                tickFormatter={(v: number) =>
                  v >= 1_000_000 ? `${(v / 1_000_000).toFixed(0)}jt` : v >= 1_000 ? `${(v / 1_000).toFixed(0)}rb` : String(v)
                }
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "currentColor", opacity: 0.04, radius: 6 }} />
              <Bar dataKey="totalIncome" fill="#22c55e" radius={[4, 4, 0, 0]} opacity={0.8} />
              <Bar dataKey="totalExpense" fill="#ef4444" radius={[4, 4, 0, 0]} opacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly list — tiap item bisa diklik */}
      <div className="rounded-2xl bg-card border border-border/60 overflow-hidden">
        {monthlyReports.map((row, idx) => {
          const net = row.totalIncome - row.totalExpense;
          const isPositive = net >= 0;
          const isLast = idx === monthlyReports.length - 1;

          return (
            <button
              key={`${row.year}-${row.month}`}
              type="button"
              onClick={() => navigate(`/reports/monthly/${row.year}/${row.month}`)}
              className={`w-full grid items-center px-4 py-3 text-left hover:bg-accent/50 active:bg-accent transition-colors gap-x-3
                [grid-template-columns:2.5rem_1px_1fr_1px_auto_1rem]
                sm:[grid-template-columns:2.5rem_1px_1fr_1fr_1px_auto_1rem]
                ${!isLast ? "border-b border-border/40" : ""}`}
            >
              {/* Month badge */}
              <div className="text-center">
                <p className="text-[11px] font-bold text-foreground leading-none">{MONTH_SHORT[row.month - 1]}</p>
                <p className="text-[9px] text-muted-foreground mt-0.5">{row.year}</p>
              </div>

              <div className="h-8 bg-border/50" />

              {/* Income & Expense — 2 baris di mobile, 1 baris di desktop */}
              <div className="flex flex-col gap-1 min-w-0 sm:contents">
                <div className="flex items-center gap-1.5 min-w-0">
                  <TrendingUp className="h-3 w-3 text-emerald-500 flex-shrink-0" />
                  <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 tabular-nums truncate">
                    {formatCurrency(row.totalIncome)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 min-w-0">
                  <TrendingDown className="h-3 w-3 text-red-500 flex-shrink-0" />
                  <span className="text-[11px] font-medium text-red-600 dark:text-red-400 tabular-nums truncate">
                    {formatCurrency(row.totalExpense)}
                  </span>
                </div>
              </div>

              <div className="h-8 bg-border/50" />

              {/* Net */}
              <div className="text-right">
                <p className="text-[9px] text-muted-foreground mb-0.5">Selisih</p>
                <p className={`text-xs font-bold tabular-nums ${isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                  {isPositive ? "+" : ""}{formatCurrency(net)}
                </p>
              </div>

              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 justify-self-end" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
