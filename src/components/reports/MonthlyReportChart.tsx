import { useMemo } from "react";
import { filterByDateRange, calculateSummary } from "@/lib/reportEngine";
import { formatCurrency } from "@/lib/utils";
import { useTransactionStore } from "@/stores/transactionStore";
import { TrendingUp, TrendingDown } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

interface Props {
  year: number;
  month: number; // 1-12
  dateFrom: string;
  dateTo: string;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: { dataKey: string; value: number; payload: { label: string } }[];
}

function BarTooltip({ active, payload }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const income = payload.find((p) => p.dataKey === "income")?.value ?? 0;
  const expense = payload.find((p) => p.dataKey === "expense")?.value ?? 0;
  const label = payload[0]?.payload?.label;
  return (
    <div className="rounded-xl border border-border/60 bg-card px-3 py-2 shadow-lg text-xs space-y-1 min-w-[130px]">
      <p className="font-semibold text-foreground">{label}</p>
      <div className="flex justify-between gap-3">
        <span className="text-muted-foreground">Masuk</span>
        <span className="text-emerald-600 dark:text-emerald-400 tabular-nums">{formatCurrency(income)}</span>
      </div>
      <div className="flex justify-between gap-3">
        <span className="text-muted-foreground">Keluar</span>
        <span className="text-red-600 dark:text-red-400 tabular-nums">{formatCurrency(expense)}</span>
      </div>
    </div>
  );
}

interface LineTooltipProps {
  active?: boolean;
  payload?: { value: number; payload: { label: string } }[];
}

function LineTooltip({ active, payload }: LineTooltipProps) {
  if (!active || !payload?.length) return null;
  const label = payload[0]?.payload?.label;
  return (
    <div className="rounded-xl border border-border/60 bg-card px-3 py-2 shadow-lg text-xs space-y-1">
      <p className="font-semibold text-foreground">{label}</p>
      <div className="flex justify-between gap-3">
        <span className="text-muted-foreground">Kumulatif</span>
        <span className="text-primary tabular-nums">{formatCurrency(payload[0].value)}</span>
      </div>
    </div>
  );
}

export default function MonthlyReportChart({ dateFrom, dateTo }: Props) {
  const rawTransactions = useTransactionStore((s) => s.transactions);

  const transactions = useMemo(
    () => filterByDateRange(rawTransactions, dateFrom, dateTo),
    [rawTransactions, dateFrom, dateTo]
  );

  const summary = useMemo(() => calculateSummary(transactions), [transactions]);

  const savingsRate = summary.totalIncome > 0
    ? Math.round(((summary.totalIncome - summary.totalExpense) / summary.totalIncome) * 100)
    : 0;

  // Group by day for bar chart
  const dailyData = useMemo(() => {
    const map = new Map<string, { income: number; expense: number }>();
    for (const tx of transactions) {
      if (tx.isCorrection || tx.isLoanLinked || tx.type === "transfer") continue;
      const cur = map.get(day) ?? { income: 0, expense: 0 };
      if (tx.type === "income") cur.income += tx.amount;
      else if (tx.type === "expense") cur.expense += tx.amount;
      map.set(day, cur);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, val]) => ({
        label: date.slice(8), // day number
        ...val,
      }));
  }, [transactions]);

  // Cumulative expense line
  const cumulativeData = useMemo(() => {
    return dailyData.reduce<{ label: string; cumulative: number }[]>((acc, d) => {
      const prev = acc.length > 0 ? acc[acc.length - 1].cumulative : 0;
      return [...acc, { label: d.label, cumulative: prev + d.expense }];
    }, []);
  }, [dailyData]);

  return (
    <div className="space-y-3">
      {/* Summary hero */}
      <div className="hero-card noise-overlay rounded-2xl p-5 text-white shadow-[0_4px_16px_rgba(0,0,0,0.25)]">
        <div className="flex items-start justify-between mb-4">
          <p className="text-[10px] font-medium text-white/50 uppercase tracking-widest">Ringkasan</p>
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
              <p className="text-sm font-semibold text-emerald-300 tabular-nums">{formatCurrency(summary.totalIncome)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-400/20">
              <TrendingDown className="h-4 w-4 text-red-300" />
            </div>
            <div>
              <p className="text-[10px] text-white/50 uppercase tracking-wider">Pengeluaran</p>
              <p className="text-sm font-semibold text-red-300 tabular-nums">{formatCurrency(summary.totalExpense)}</p>
            </div>
          </div>
        </div>
        <div className="h-px bg-white/10 mb-3" />
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-white/40 uppercase tracking-wider">Saldo Bersih</p>
          <p className={`text-base font-bold tabular-nums ${summary.netBalance >= 0 ? "text-emerald-300" : "text-red-300"}`}>
            {formatCurrency(summary.netBalance)}
          </p>
        </div>
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

      {/* Daily bar chart */}
      {dailyData.length > 0 && (
        <div className="rounded-2xl bg-card border border-border/60 p-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-foreground">Harian</p>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />Masuk
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-red-500" />Keluar
              </div>
            </div>
          </div>
          <div style={{ height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData} barCategoryGap="30%" barGap={2}>
                <CartesianGrid vertical={false} stroke="currentColor" strokeOpacity={0.06} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "currentColor", opacity: 0.4 }} />
                <YAxis axisLine={false} tickLine={false} width={30}
                  tick={{ fontSize: 9, fill: "currentColor", opacity: 0.35 }}
                  tickFormatter={(v: number) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(0)}jt` : v >= 1_000 ? `${(v / 1_000).toFixed(0)}rb` : String(v)}
                />
                <Tooltip content={<BarTooltip />} cursor={{ fill: "currentColor", opacity: 0.04 }} />
                <Bar dataKey="income" fill="#22c55e" radius={[3, 3, 0, 0]} opacity={0.8} />
                <Bar dataKey="expense" fill="#ef4444" radius={[3, 3, 0, 0]} opacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Cumulative expense line */}
      {cumulativeData.length > 1 && (
        <div className="rounded-2xl bg-card border border-border/60 p-4">
          <p className="text-sm font-semibold text-foreground mb-4">Kumulatif Pengeluaran</p>
          <div style={{ height: 140 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cumulativeData}>
                <CartesianGrid vertical={false} stroke="currentColor" strokeOpacity={0.06} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "currentColor", opacity: 0.4 }} />
                <YAxis axisLine={false} tickLine={false} width={30}
                  tick={{ fontSize: 9, fill: "currentColor", opacity: 0.35 }}
                  tickFormatter={(v: number) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(0)}jt` : v >= 1_000 ? `${(v / 1_000).toFixed(0)}rb` : String(v)}
                />
                <Tooltip content={<LineTooltip />} />
                <Line type="monotone" dataKey="cumulative" stroke="#ef4444" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
