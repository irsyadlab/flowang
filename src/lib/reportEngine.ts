import type { Transaction } from '../types';

export interface ReportSummary {
  totalIncome: number;
  totalExpense: number;
  netBalance: number; // totalIncome - totalExpense
}

export interface MonthlyReportRow {
  year: number;
  month: number; // 1–12
  totalIncome: number;
  totalExpense: number;
}

// Filter transaksi berdasarkan rentang tanggal
export function filterByDateRange(
  transactions: Transaction[],
  from: string, // YYYY-MM-DD
  to: string // YYYY-MM-DD
): Transaction[] {
  return transactions.filter((tx) => {
    const txDate = tx.date;
    return txDate >= from && txDate <= to;
  });
}

// Hitung summary (Transfer dikecualikan dari income/expense)
export function calculateSummary(transactions: Transaction[]): ReportSummary {
  let totalIncome = 0;
  let totalExpense = 0;

  for (const tx of transactions) {
    if (tx.type === 'income') {
      totalIncome += tx.amount;
    } else if (tx.type === 'expense') {
      totalExpense += tx.amount;
    }
    // Transfer tidak dihitung dalam income atau expense
  }

  return {
    totalIncome,
    totalExpense,
    netBalance: totalIncome - totalExpense,
  };
}

// Kelompokkan per bulan, urutkan terbaru ke terlama
export function groupByMonth(transactions: Transaction[]): MonthlyReportRow[] {
  const monthlyMap = new Map<string, MonthlyReportRow>();

  for (const tx of transactions) {
    // Skip transfer
    if (tx.type === 'transfer') continue;

    const date = new Date(tx.date);
    const key = `${date.getFullYear()}-${date.getMonth()}`;

    let row = monthlyMap.get(key);
    if (!row) {
      row = {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        totalIncome: 0,
        totalExpense: 0,
      };
      monthlyMap.set(key, row);
    }

    if (tx.type === 'income') {
      row.totalIncome += tx.amount;
    } else if (tx.type === 'expense') {
      row.totalExpense += tx.amount;
    }
  }

  // Convert ke array dan urutkan descending
  return Array.from(monthlyMap.values()).sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });
}