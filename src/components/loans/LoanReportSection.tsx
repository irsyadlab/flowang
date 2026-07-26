import { useMemo } from 'react';
import { TrendingUp, TrendingDown, ArrowRight, Info } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { calculateLoanReportSummary } from '@/lib/loanUtils';
import { useLoanContactStore } from '@/stores/loanContactStore';
import type { LoanEntry, Repayment } from '@/types';

interface LoanReportSectionProps {
  entries: LoanEntry[];
  repayments: Repayment[];
  onNavigateToContact: (contactId: string) => void;
}

interface ContactLoanSummary {
  contactId: string;
  contactName: string;
  totalLend: number;
  totalBorrow: number;
  netPosition: number;
}

export default function LoanReportSection({
  entries,
  repayments,
  onNavigateToContact,
}: LoanReportSectionProps) {
  const contacts = useLoanContactStore((s) => s.contacts);

  // Only consider active entries
  const activeEntries = useMemo(
    () => entries.filter((e) => e.status === 'active'),
    [entries]
  );

  // Group repayments by loanEntryId for per-contact calculation
  const repaymentsByEntry = useMemo(() => {
    const map = new Map<string, Repayment[]>();
    for (const r of repayments) {
      const existing = map.get(r.loanEntryId) ?? [];
      existing.push(r);
      map.set(r.loanEntryId, existing);
    }
    return map;
  }, [repayments]);

  // Build per-contact summaries (Requirement 5.5)
  const contactSummaries = useMemo((): ContactLoanSummary[] => {
    const map = new Map<string, ContactLoanSummary>();

    for (const entry of activeEntries) {
      const entryRepayments = repaymentsByEntry.get(entry.id) ?? [];
      const totalRepaid = entryRepayments.reduce((sum, r) => sum + r.amount, 0);
      const remaining = entry.amount - totalRepaid;

      const existing = map.get(entry.contactId) ?? {
        contactId: entry.contactId,
        contactName: '',
        totalLend: 0,
        totalBorrow: 0,
        netPosition: 0,
      };

      if (entry.direction === 'lend') {
        existing.totalLend += remaining;
      } else {
        existing.totalBorrow += remaining;
      }
      existing.netPosition = existing.totalLend - existing.totalBorrow;

      map.set(entry.contactId, existing);
    }

    // Attach contact names
    return Array.from(map.values()).map((item) => {
      const contact = contacts.find((c) => c.id === item.contactId);
      return { ...item, contactName: contact?.name ?? item.contactId };
    });
  }, [activeEntries, repaymentsByEntry, contacts]);

  // Hide section if no active entries (Requirement 5.2)
  if (activeEntries.length === 0) return null;

  // Calculate overall summary (Requirement 5.1)
  const summary = calculateLoanReportSummary(entries, repayments);

  const netIsPositive = summary.netPosition >= 0;

  return (
    <div className="rounded-2xl bg-card border border-border/60 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">Posisi Hutang-Piutang</p>
        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
          Aktif
        </span>
      </div>

      {/* Summary grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-muted/40 p-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Piutang Aktif</p>
          </div>
          <p className="text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
            {formatCurrency(summary.totalActiveLend)}
          </p>
        </div>

        <div className="rounded-xl bg-muted/40 p-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <TrendingDown className="h-3.5 w-3.5 text-red-500" />
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Hutang Aktif</p>
          </div>
          <p className="text-sm font-semibold tabular-nums text-red-600 dark:text-red-400">
            {formatCurrency(summary.totalActiveBorrow)}
          </p>
        </div>
      </div>

      {/* Net position */}
      <div className="flex items-center justify-between pt-1 border-t border-border/60">
        <p className="text-xs text-muted-foreground">Net Posisi</p>
        <p
          className={`text-sm font-semibold tabular-nums ${
            netIsPositive
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-red-600 dark:text-red-400'
          }`}
        >
          {summary.netPosition >= 0 ? '+' : ''}
          {formatCurrency(summary.netPosition)}
        </p>
      </div>

      {/* Current position note (Requirement 5.4) */}
      <div className="flex items-start gap-2 rounded-xl bg-muted/30 px-3 py-2.5">
        <Info className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Data ini mencerminkan posisi hutang-piutang terkini, bukan snapshot historis per periode.
        </p>
      </div>

      {/* Per-contact list (Requirement 5.5) */}
      {contactSummaries.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Per Kontak</p>
          {contactSummaries.map((item) => (
            <button
              key={item.contactId}
              type="button"
              onClick={() => onNavigateToContact(item.contactId)}
              className="w-full flex items-center justify-between rounded-xl border border-border/60 bg-background px-3.5 py-2.5 text-left transition-colors hover:bg-muted/40 active:bg-muted/60"
              aria-label={`Lihat detail hutang-piutang ${item.contactName}`}
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">{item.contactName}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {item.totalLend > 0 && (
                    <span className="text-[10px] tabular-nums text-emerald-600 dark:text-emerald-400">
                      +{formatCurrency(item.totalLend)}
                    </span>
                  )}
                  {item.totalBorrow > 0 && (
                    <span className="text-[10px] tabular-nums text-red-600 dark:text-red-400">
                      -{formatCurrency(item.totalBorrow)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <p
                  className={`text-xs font-semibold tabular-nums ${
                    item.netPosition >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {item.netPosition >= 0 ? '+' : ''}
                  {formatCurrency(item.netPosition)}
                </p>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
