import { useMemo } from "react";
import { filterByDateRange } from "@/lib/reportEngine";
import { formatCurrency } from "@/lib/utils";
import { useTransactionStore } from "@/stores/transactionStore";

interface Props {
  dateFrom: string;
  dateTo: string;
}

interface NoteGroup {
  note: string;
  totalExpense: number;
  totalIncome: number;
  count: number;
}

const FALLBACK = "Lainnya";

export default function MonthlyReportNote({ dateFrom, dateTo }: Props) {
  const rawTransactions = useTransactionStore((s) => s.transactions);

  const transactions = useMemo(
    () => filterByDateRange(rawTransactions, dateFrom, dateTo),
    [rawTransactions, dateFrom, dateTo]
  );

  const daysInRange = useMemo(() => {
    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    return Math.max(1, Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1);
  }, [dateFrom, dateTo]);

  const { groups, totalExpense, totalIncome } = useMemo(() => {
    const map = new Map<string, NoteGroup>();
    let totalExpense = 0;
    let totalIncome = 0;

    for (const tx of transactions) {
      if (tx.isCorrection || tx.type === "transfer") continue;
      const key = tx.note?.trim() || FALLBACK;
      const cur = map.get(key) ?? { note: key, totalExpense: 0, totalIncome: 0, count: 0 };
      if (tx.type === "expense") { cur.totalExpense += tx.amount; totalExpense += tx.amount; }
      else if (tx.type === "income") { cur.totalIncome += tx.amount; totalIncome += tx.amount; }
      cur.count++;
      map.set(key, cur);
    }

    const groups = Array.from(map.values()).sort((a, b) => (b.totalExpense + b.totalIncome) - (a.totalExpense + a.totalIncome));
    return { groups, totalExpense, totalIncome };
  }, [transactions]);

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

      {/* Note list */}
      <div className="rounded-2xl bg-card border border-border/60 overflow-hidden">
        <div className="px-4 py-3 border-b border-border/40">
          <p className="text-sm font-semibold text-foreground">Berdasarkan Judul</p>
        </div>
        {groups.map((group, idx) => {
          const isLast = idx === groups.length - 1;
          const expPct = totalExpense > 0 ? Math.round((group.totalExpense / totalExpense) * 100) : 0;
          const incPct = totalIncome > 0 ? Math.round((group.totalIncome / totalIncome) * 100) : 0;

          return (
            <div key={group.note} className={`px-4 py-3.5 ${!isLast ? "border-b border-border/40" : ""}`}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-xs font-semibold text-foreground truncate flex-1">{group.note}</p>
                <span className="text-[10px] text-muted-foreground flex-shrink-0">{group.count}x</span>
              </div>
              <div className="space-y-1.5">
                {group.totalExpense > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500 flex-shrink-0" />
                        <span className="text-[10px] text-muted-foreground">Keluar</span>
                        <span className="text-[10px] text-muted-foreground">· {expPct}%</span>
                      </div>
                      <span className="text-[11px] font-medium text-red-600 dark:text-red-400 tabular-nums">
                        {formatCurrency(group.totalExpense)}
                      </span>
                    </div>
                    <div className="h-1 w-full rounded-full bg-muted overflow-hidden ml-3.5">
                      <div className="h-full rounded-full bg-red-500 transition-all duration-700" style={{ width: `${expPct}%`, opacity: 0.7 }} />
                    </div>
                  </div>
                )}
                {group.totalIncome > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                        <span className="text-[10px] text-muted-foreground">Masuk</span>
                        <span className="text-[10px] text-muted-foreground">· {incPct}%</span>
                      </div>
                      <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {formatCurrency(group.totalIncome)}
                      </span>
                    </div>
                    <div className="h-1 w-full rounded-full bg-muted overflow-hidden ml-3.5">
                      <div className="h-full rounded-full bg-emerald-500 transition-all duration-700" style={{ width: `${incPct}%`, opacity: 0.7 }} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {groups.length === 0 && (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-muted-foreground">Belum ada data</p>
          </div>
        )}
      </div>
    </div>
  );
}
