/**
 * Backup Google Drive harus mencakup SEMUA object store yang di-sync.
 *
 * Regression guard: sebelumnya serializer hanya menyalin 5 store dan melewatkan
 * `loan_repayments`, jadi restore mengembalikan loan entry dengan
 * `remainingAmount` yang sudah berkurang tetapi tanpa satu pun baris pelunasan —
 * kehilangan data yang tidak menimbulkan error apa pun.
 *
 * Test ini memanggil serializer/deserializer yang asli, bukan menyalin ulang
 * logikanya, supaya benar-benar menjaga kode produksi.
 */

import { describe, expect, test, beforeEach } from 'bun:test';
import 'fake-indexeddb/auto';
import { getDB } from '../../src/db/db';
import { serializeIndexedDB, deserializeToIndexedDB } from '../../src/sync/googleDriveProvider';
import { SYNCED_STORES } from '../../src/sync/syncedStores';
import * as walletDb from '../../src/db/walletDb';
import * as loanContactDb from '../../src/db/loanContactDb';
import * as loanEntryDb from '../../src/db/loanEntryDb';
import * as loanRepaymentDb from '../../src/db/loanRepaymentDb';
import type { Wallet, LoanContact, LoanEntry, Repayment } from '../../src/types';
import { resetDB } from '../helpers/dbHelpers';

const NOW = '2024-01-01T00:00:00.000Z';

const wallet: Wallet = {
  id: 'w1',
  name: 'Dompet',
  initialBalance: 1_000_000,
  balance: 1_000_000,
  createdAt: NOW,
  updatedAt: NOW,
};

const contact: LoanContact = {
  id: 'c1',
  name: 'Budi',
  createdAt: NOW,
  updatedAt: NOW,
};

const entry: LoanEntry = {
  id: 'e1',
  contactId: 'c1',
  amount: 1_000_000,
  direction: 'lend',
  status: 'active',
  date: '2024-01-01',
  remainingAmount: 400_000,
  createdAt: NOW,
  updatedAt: NOW,
};

const repayments: Repayment[] = [
  {
    id: 'r1',
    loanEntryId: 'e1',
    amount: 400_000,
    date: '2024-02-01',
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'r2',
    loanEntryId: 'e1',
    amount: 200_000,
    date: '2024-03-01',
    createdAt: NOW,
    updatedAt: NOW,
  },
];

async function seed(): Promise<void> {
  const db = getDB()!;
  await walletDb.addWallet(db, wallet);
  await loanContactDb.addContact(db, contact);
  await loanEntryDb.addEntry(db, entry);
  for (const r of repayments) {
    await loanRepaymentDb.putRepayment(db, r);
  }
}

describe('Cakupan backup Google Drive', () => {
  beforeEach(async () => {
    await resetDB();
  });

  test('serialisasi memuat sebuah key untuk setiap store yang di-sync', async () => {
    await seed();

    const parsed = JSON.parse(new TextDecoder().decode(await serializeIndexedDB()));

    expect(Object.keys(parsed).sort()).toEqual([...SYNCED_STORES].sort());
  });

  test('repayment ikut ter-backup dan pulih utuh setelah restore', async () => {
    await seed();
    const backup = await serializeIndexedDB();

    // Simulasikan device kosong, lalu restore
    await resetDB();
    const dbBefore = getDB()!;
    expect(await loanRepaymentDb.getAllRepayments(dbBefore)).toHaveLength(0);

    await deserializeToIndexedDB(backup);

    const db = getDB()!;
    const restored = await loanRepaymentDb.getAllRepayments(db);
    expect(restored.sort((a, b) => a.id.localeCompare(b.id))).toEqual(repayments);

    // Loan entry dan riwayat pelunasannya harus konsisten satu sama lain
    const restoredEntry = await loanEntryDb.getEntryById(db, 'e1');
    const totalRepaid = restored.reduce((sum, r) => sum + r.amount, 0);
    expect(restoredEntry!.remainingAmount).toBe(restoredEntry!.amount - totalRepaid);
  });

  test('restore mengosongkan store yang tidak ada di backup lama', async () => {
    // Backup versi lama: dibuat sebelum loan_repayments terdaftar, jadi tidak
    // punya key tersebut sama sekali.
    const legacyBackup = new TextEncoder().encode(
      JSON.stringify({
        wallets: [wallet],
        transactions: [],
        categories: [],
        loan_contacts: [contact],
        loan_entries: [entry],
      })
    );

    // Device ini punya repayment lokal yang TIDAK ada di backup
    await seed();
    expect(await loanRepaymentDb.getAllRepayments(getDB()!)).toHaveLength(2);

    await deserializeToIndexedDB(legacyBackup);

    // Restore harus menghasilkan state persis seperti isi backup — repayment
    // lokal yang tertinggal akan bercampur dan membuat sisa hutang tidak cocok.
    expect(await loanRepaymentDb.getAllRepayments(getDB()!)).toHaveLength(0);
    expect(await walletDb.getAllWallets(getDB()!)).toHaveLength(1);
  });
});
