import type { LoanContact, LoanEntry, ContactSummary, Repayment } from '../types';

export function validateContactName(name: string): string | null {
  if (!name || name.trim().length === 0) {
    return 'Nama tidak boleh kosong';
  }
  if (name.length > 100) {
    return 'Nama maksimal 100 karakter';
  }
  return null;
}

export function validateAmount(amount: number): string | null {
  if (amount <= 0) {
    return 'Jumlah harus lebih dari 0';
  }
  if (amount > 999_999_999_999) {
    return 'Jumlah melebihi batas maksimum';
  }
  return null;
}

export function computeContactSummary(entries: LoanEntry[]): Omit<ContactSummary, 'contactId'> {
  let totalLend = 0;
  let totalBorrow = 0;
  let hasActiveEntries = false;

  for (const entry of entries) {
    if (entry.status === 'active') {
      hasActiveEntries = true;
      if (entry.direction === 'lend') {
        totalLend += entry.amount;
      } else {
        totalBorrow += entry.amount;
      }
    }
  }

  return { totalLend, totalBorrow, hasActiveEntries };
}

export function getNetBalanceLabel(totalLend: number, totalBorrow: number): string {
  if (totalLend > totalBorrow) return 'Kamu menagih';
  if (totalBorrow > totalLend) return 'Kamu berhutang';
  return 'Lunas semua';
}

export function countContactsWithActiveLoans(
  contacts: LoanContact[],
  entriesByContact: Map<string, LoanEntry[]>
): number {
  let count = 0;
  for (const contact of contacts) {
    const entries = entriesByContact.get(contact.id);
    if (entries) {
      const hasActive = entries.some((e) => e.status === 'active');
      if (hasActive) count++;
    }
  }
  return count;
}

export function sortEntriesByDate(entries: LoanEntry[]): LoanEntry[] {
  return [...entries].sort((a, b) => b.date.localeCompare(a.date));
}

// --- Repayment validation and calculation (Requirements 1.3, 1.4, 1.7, 5.1) ---

export interface ValidationResult {
  success: boolean;
  error?: string;
}

/**
 * Validates a repayment amount against the remaining amount of a loan entry.
 * Rejects values ≤ 0 and values > remainingAmount.
 * Requirements: 1.3, 1.4
 */
export function validateRepaymentAmount(
  amount: number,
  remainingAmount: number
): ValidationResult {
  if (amount <= 0) {
    return { success: false, error: 'Jumlah harus lebih dari 0' };
  }
  if (amount > remainingAmount) {
    return { success: false, error: 'Jumlah melebihi sisa hutang/piutang' };
  }
  return { success: true };
}

/**
 * Calculates the remaining amount of a loan entry after all repayments.
 * remainingAmount = loanAmount - sum(repayments.amount)
 * Requirements: 1.7
 */
export function calculateRemainingAmount(
  loanAmount: number,
  repayments: Repayment[]
): number {
  const totalRepaid = repayments.reduce((sum, r) => sum + r.amount, 0);
  return loanAmount - totalRepaid;
}

export interface LoanReportSummary {
  totalActiveLend: number;   // sum remainingAmount, direction='lend', status='active'
  totalActiveBorrow: number; // sum remainingAmount, direction='borrow', status='active'
  netPosition: number;       // totalActiveLend - totalActiveBorrow
}

/**
 * Calculates the loan report summary for the Loan_Report_Section.
 * Requirements: 5.1
 */
export function calculateLoanReportSummary(
  entries: LoanEntry[],
  repayments: Repayment[]
): LoanReportSummary {
  // Group repayments by loanEntryId for efficient lookup
  const repaymentsByEntry = new Map<string, Repayment[]>();
  for (const repayment of repayments) {
    const existing = repaymentsByEntry.get(repayment.loanEntryId) ?? [];
    existing.push(repayment);
    repaymentsByEntry.set(repayment.loanEntryId, existing);
  }

  let totalActiveLend = 0;
  let totalActiveBorrow = 0;

  for (const entry of entries) {
    if (entry.status !== 'active') continue;

    // Use the entry's remainingAmount if available, otherwise calculate it
    const entryRepayments = repaymentsByEntry.get(entry.id) ?? [];
    const remaining =
      entryRepayments.length > 0
        ? calculateRemainingAmount(entry.amount, entryRepayments)
        : entry.remainingAmount;

    if (entry.direction === 'lend') {
      totalActiveLend += remaining;
    } else {
      totalActiveBorrow += remaining;
    }
  }

  return {
    totalActiveLend,
    totalActiveBorrow,
    netPosition: totalActiveLend - totalActiveBorrow,
  };
}
