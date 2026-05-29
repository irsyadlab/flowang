import type { LoanContact, LoanEntry, ContactSummary } from '../types';

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
