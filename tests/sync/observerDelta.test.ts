/**
 * Perilaku observer sync: penerapan berbasis delta, serialisasi, dan
 * perhitungan ulang saldo.
 *
 * Memakai Y.Doc sungguhan (bukan mock CRDT) dengan webrtcProvider di-mock,
 * supaya yang diuji adalah logika penerapan perubahan — bukan jaringan.
 */

import { describe, expect, test, beforeAll, beforeEach, afterEach, afterAll, mock } from 'bun:test';
import 'fake-indexeddb/auto';
import * as Y from 'yjs';
import { getDB } from '../../src/db/db';
import { resetDB } from '../helpers/dbHelpers';
import * as walletDb from '../../src/db/walletDb';
import * as transactionDb from '../../src/db/transactionDb';
import type { Wallet, Transaction } from '../../src/types';

let ydoc = new Y.Doc();

mock.module('../../src/sync/webrtcProvider', () => ({
  YJS_STORE: 'yjs-sync',
  getYDoc: () => ydoc,
  getProvider: () => null,
  connect: () => {},
  disconnect: () => {},
  whenPersistenceSynced: () => Promise.resolve(),
}));

// Diimpor di beforeAll, bukan lewat import statis: mock.module harus sudah
// terpasang sebelum syncManager (dan rantai import-nya) dievaluasi.
let syncManager: typeof import('../../src/sync/syncManager');
let syncStore: typeof import('../../src/sync/syncStore');
let uiStore: typeof import('../../src/stores/uiStore');
let syncKeyUtils: typeof import('../../src/sync/syncKeyUtils');

beforeAll(async () => {
  syncManager = await import('../../src/sync/syncManager');
  syncStore = await import('../../src/sync/syncStore');
  uiStore = await import('../../src/stores/uiStore');
  syncKeyUtils = await import('../../src/sync/syncKeyUtils');
});

const NOW = '2024-01-01T00:00:00.000Z';

function makeWallet(id: string, initialBalance: number): Wallet {
  return { id, name: `Wallet ${id}`, initialBalance, balance: initialBalance, createdAt: NOW, updatedAt: NOW };
}

function makeTx(id: string, partial: Partial<Transaction> & Pick<Transaction, 'type' | 'amount'>): Transaction {
  return { id, date: '2024-01-01', createdAt: NOW, updatedAt: NOW, ...partial } as Transaction;
}

/** Pasang observer pada ydoc bersih lewat jalur publik. */
async function attachToFreshDoc(): Promise<void> {
  ydoc = new Y.Doc();
  const payload = await syncKeyUtils.generateSyncKey();
  syncStore.useSyncStore.setState({ syncKey: syncKeyUtils.encodeSyncKey(payload) });
  await syncManager.connectToSyncRoom();
}

describe('Observer sync', () => {
  beforeEach(async () => {
    await resetDB();
    uiStore.useUIStore.getState().setDbReady(true);
    await attachToFreshDoc();
  });

  afterEach(async () => {
    // Lepas observer supaya doc dari test ini tidak lagi menulis ke IndexedDB
    syncManager.disconnectFromSyncRoom();
    await syncManager.whenSyncSettled();
    uiStore.useUIStore.getState().setDbReady(false);
  });

  /**
   * State sync bersifat global untuk seluruh proses test. Selama `syncKey`
   * masih terisi, store LAIN akan menganggap sync aktif dan mem-publish
   * perubahannya ke Yjs — sehingga test di file lain ikut terpengaruh.
   */
  afterAll(() => {
    syncManager.disconnectFromSyncRoom();
    syncStore.useSyncStore.setState({ syncKey: null });
  });

  test('menerapkan record baru dari map remote ke IndexedDB', async () => {
    ydoc.getMap('wallets').set('w1', makeWallet('w1', 1000));
    await syncManager.whenSyncSettled();

    const stored = await walletDb.getWalletById(getDB()!, 'w1');
    expect(stored?.name).toBe('Wallet w1');
  });

  test('tombstone menghapus record secara lokal', async () => {
    ydoc.getMap('wallets').set('w1', makeWallet('w1', 1000));
    await syncManager.whenSyncSettled();
    expect(await walletDb.getWalletById(getDB()!, 'w1')).toBeDefined();

    ydoc.getMap('wallets').set('w1', { id: 'w1', _deleted: true });
    await syncManager.whenSyncSettled();
    expect(await walletDb.getWalletById(getDB()!, 'w1')).toBeUndefined();
  });

  /**
   * Regression inti dari penerapan berbasis delta.
   *
   * Versi sebelumnya memindai ulang SELURUH map pada setiap event dan menulis
   * ulang semua record ke IndexedDB. Akibatnya, perubahan pada satu record dari
   * device lain akan menimpa balik record LAIN yang baru saja diubah secara
   * lokal — nilai basi di Yjs mengalahkan perubahan lokal yang lebih baru,
   * tanpa peringatan apa pun.
   */
  test('perubahan pada satu kunci tidak menimpa record lain yang lebih baru secara lokal', async () => {
    const wallets = ydoc.getMap('wallets');
    wallets.set('w1', makeWallet('w1', 1000));
    wallets.set('w2', makeWallet('w2', 2000));
    await syncManager.whenSyncSettled();

    // Perubahan lokal pada w1 yang BELUM ter-publish ke Yjs
    const local = await walletDb.getWalletById(getDB()!, 'w1');
    await walletDb.updateWallet(getDB()!, { ...local!, name: 'Diubah secara lokal' });

    // Device lain menyentuh w2 saja
    wallets.set('w2', { ...makeWallet('w2', 2000), name: 'Wallet w2 diubah' });
    await syncManager.whenSyncSettled();

    expect((await walletDb.getWalletById(getDB()!, 'w1'))?.name).toBe('Diubah secara lokal');
    expect((await walletDb.getWalletById(getDB()!, 'w2'))?.name).toBe('Wallet w2 diubah');
  });

  test('menghitung ulang saldo wallet dari riwayat transaksi', async () => {
    ydoc.getMap('wallets').set('w1', makeWallet('w1', 1000));
    await syncManager.whenSyncSettled();

    ydoc.getMap('transactions').set('t1', makeTx('t1', { type: 'income', amount: 500, walletId: 'w1' }));
    ydoc.getMap('transactions').set('t2', makeTx('t2', { type: 'expense', amount: 200, walletId: 'w1' }));
    await syncManager.whenSyncSettled();

    expect((await walletDb.getWalletById(getDB()!, 'w1'))?.balance).toBe(1300);
  });

  /**
   * Transaksi yang dihapus tetap memengaruhi saldo wallet yang dulu dirujuknya.
   * Dengan penerapan delta, wallet terdampak hanya bisa diketahui dengan membaca
   * record lokal SEBELUM dihapus — kalau tidak, saldo akan tertinggal basi.
   */
  test('menghitung ulang saldo saat transaksi dihapus dari jarak jauh', async () => {
    ydoc.getMap('wallets').set('w1', makeWallet('w1', 1000));
    ydoc.getMap('transactions').set('t1', makeTx('t1', { type: 'income', amount: 500, walletId: 'w1' }));
    await syncManager.whenSyncSettled();
    expect((await walletDb.getWalletById(getDB()!, 'w1'))?.balance).toBe(1500);

    ydoc.getMap('transactions').set('t1', { id: 't1', _deleted: true });
    await syncManager.whenSyncSettled();

    expect((await walletDb.getWalletById(getDB()!, 'w1'))?.balance).toBe(1000);
    expect(await transactionDb.getTransactionById(getDB()!, 't1')).toBeUndefined();
  });

  test('transfer memperbarui saldo kedua wallet', async () => {
    ydoc.getMap('wallets').set('w1', makeWallet('w1', 1000));
    ydoc.getMap('wallets').set('w2', makeWallet('w2', 0));
    await syncManager.whenSyncSettled();

    ydoc
      .getMap('transactions')
      .set('t1', makeTx('t1', { type: 'transfer', amount: 300, walletId: 'w1', toWalletId: 'w2' }));
    await syncManager.whenSyncSettled();

    expect((await walletDb.getWalletById(getDB()!, 'w1'))?.balance).toBe(700);
    expect((await walletDb.getWalletById(getDB()!, 'w2'))?.balance).toBe(300);
  });

  /**
   * Ledakan perubahan dalam satu putaran sinkron harus berakhir pada state yang
   * konsisten — semua transaksi tersimpan dan saldo cocok dengan jumlahnya.
   *
   * Catatan: test ini TIDAK membuktikan handler-nya terserialisasi. Perhitungan
   * saldo membaca ulang seluruh transaksi dari IndexedDB, jadi bersifat idempoten
   * dan sering menghasilkan jawaban benar meski handler saling menyalip.
   * Jaminan serialisasinya diuji langsung di `tests/lib/serialQueue.test.ts`.
   */
  test('ledakan perubahan berakhir pada state yang konsisten', async () => {
    ydoc.getMap('wallets').set('w1', makeWallet('w1', 0));
    await syncManager.whenSyncSettled();

    const transactions = ydoc.getMap('transactions');
    // Ditulis dalam satu putaran sinkron: semua observer terpicu beruntun
    for (let i = 0; i < 25; i++) {
      transactions.set(`t${i}`, makeTx(`t${i}`, { type: 'income', amount: 10, walletId: 'w1' }));
    }
    await syncManager.whenSyncSettled();

    expect((await transactionDb.getAllTransactions(getDB()!)).length).toBe(25);
    expect((await walletDb.getWalletById(getDB()!, 'w1'))?.balance).toBe(250);
  });

  test('repayment dari device lain ikut tersimpan', async () => {
    ydoc.getMap('loan_repayments').set('r1', {
      id: 'r1',
      loanEntryId: 'e1',
      amount: 400,
      date: '2024-02-01',
      createdAt: NOW,
      updatedAt: NOW,
    });
    await syncManager.whenSyncSettled();

    const { getAllRepayments } = await import('../../src/db/loanRepaymentDb');
    const stored = await getAllRepayments(getDB()!);
    expect(stored).toHaveLength(1);
    expect(stored[0].amount).toBe(400);
  });
});
