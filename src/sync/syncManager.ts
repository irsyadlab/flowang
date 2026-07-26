/**
 * Sync Manager - orchestrates sync between IndexedDB, Yjs CRDT, and Google Drive.
 */

import { useSyncStore } from './syncStore';
import { importKeyFromBase64 } from './cryptoService';
import { decodeSyncKey } from './syncKeyUtils';
import * as webrtcProvider from './webrtcProvider';
import { YJS_STORE } from './webrtcProvider';
import * as googleDriveProvider from './googleDriveProvider';
import { getDB } from '../db/db';
import * as walletDb from '../db/walletDb';
import * as categoryDb from '../db/categoryDb';
import * as loanContactDb from '../db/loanContactDb';
import * as loanEntryDb from '../db/loanEntryDb';
import * as loanRepaymentDb from '../db/loanRepaymentDb';
import * as transactionDb from '../db/transactionDb';
import { SYNCED_STORES, syncedStoreNames, type SyncedStoreName } from './syncedStores';
import { sumWalletDeltas, resolveBalance } from '../lib/walletBalance';
import { createSerialQueue } from '../lib/serialQueue';
import type * as Y from 'yjs';
import type { Wallet, Transaction, Category, LoanContact, LoanEntry, Repayment } from '../types';

/**
 * Bentuk record apa pun yang dibaca dari sebuah Yjs map. Index signature-nya
 * dipakai untuk mengecek `_deleted` pada nilai remote yang belum di-narrow.
 */
interface SyncEntity {
  id: string;
  _deleted?: boolean;
  [key: string]: unknown;
}

/** Tombstone: penanda bahwa sebuah record dihapus di device asal. */
interface SyncTombstone {
  id: string;
  _deleted: true;
}

/**
 * Payload yang boleh di-publish ke Yjs.
 *
 * Sengaja berupa union tipe domain, bukan `SyncEntity`. Interface TypeScript
 * tidak punya implicit index signature, jadi `SyncEntity` justru menolak
 * `Wallet`/`LoanEntry`/dst. dan memaksa caller melakukan cast.
 */
export type SyncPayload =
  | Wallet
  | Transaction
  | Category
  | LoanContact
  | LoanEntry
  | Repayment
  | SyncTombstone;

let initialized = false;
// Track active Yjs observers so we can clean them up on reconnect
let activeObservers: (() => void)[] = [];

/**
 * Antrian serial untuk semua penerapan perubahan remote.
 *
 * Handler observer bersifat async (IndexedDB + reload store), sementara Yjs
 * memanggilnya secara sinkron dan bisa beruntun. Tanpa antrian, dua handler
 * saling menyalip: yang satu sedang menghitung ulang saldo dari snapshot
 * transaksi, yang lain di tengah jalan sudah menulis transaksi baru — hasilnya
 * saldo dihitung dari state setengah jadi.
 *
 * Antrian ini sengaja dipakai bersama LINTAS map, bukan satu antrian per map:
 * saldo wallet bergantung pada isi store transaksi, jadi handler wallet dan
 * handler transaksi pun tidak boleh tumpang tindih.
 */
const syncQueue = createSerialQueue((error) => {
  // Satu perubahan yang gagal tidak boleh mematikan antrian untuk selamanya
  console.error('[Flowang] Gagal menerapkan perubahan sync:', error);
});

function enqueue(task: () => Promise<void>): void {
  syncQueue.enqueue(task);
}

/**
 * Resolve setelah semua perubahan yang sudah masuk antrian selesai diterapkan.
 *
 * Dipakai test (dan berguna untuk diagnosis) karena penerapan perubahan remote
 * berlangsung asinkron di luar jalur pemanggilan Yjs.
 */
export function whenSyncSettled(): Promise<void> {
  return syncQueue.settled();
}

/** Kunci yang berubah pada sebuah event Yjs map. */
function changedKeys(event: Y.YMapEvent<unknown>): string[] {
  return Array.from(event.changes.keys.keys());
}

export async function initialize(): Promise<void> {
  if (initialized) return;
  initialized = true;

  try {
    await useSyncStore.getState().loadFromStorage();

    // Handle OAuth callback
    if (googleDriveProvider.handleOAuthCallback()) {
      return;
    }

    const syncKey = useSyncStore.getState().syncKey;
    if (syncKey) {
      try {
        const payload = decodeSyncKey(syncKey);
        const encryptionKey = await importKeyFromBase64(payload.encryptionKey);
        // Key is imported to verify validity; connection uses the string key
        void encryptionKey;
        webrtcProvider.connect(payload.roomName, payload.encryptionKey);
        _attachObservers();
      } catch {
        useSyncStore.getState().setSyncError('Sync Key tidak valid');
      }
    }

    // Check for Google Drive restore if authenticated
    if (useSyncStore.getState().googleAuthToken) {
      const shouldRestore = await googleDriveProvider.checkRestore();
      if (shouldRestore) {
        useSyncStore.getState().setSyncError('RESTORE_AVAILABLE');
      }
    }
  } catch (error) {
    useSyncStore.getState().setSyncError(
      `Gagal inisialisasi sync: ${(error as Error).message}`
    );
  }
}

/**
 * Attach Yjs observers that write remote CRDT changes back to IndexedDB and reload stores.
 * Called after every fresh connect() so observers always point to the current ydoc.
 */
function _attachObservers(): void {
  // Clean up previous observers
  for (const cleanup of activeObservers) cleanup();
  activeObservers = [];

  const ydoc = webrtcProvider.getYDoc();
  if (!ydoc) return;

  const walletsMap = ydoc.getMap<Wallet | { id: string; _deleted: true }>('wallets');
  const transactionsMap = ydoc.getMap<Transaction | { id: string; _deleted: true }>('transactions');
  const categoriesMap = ydoc.getMap<Category | { id: string; _deleted: true }>('categories');
  const loanContactsMap = ydoc.getMap<LoanContact | { id: string; _deleted: true }>('loan_contacts');
  const loanEntriesMap = ydoc.getMap<LoanEntry | { id: string; _deleted: true }>('loan_entries');
  const loanRepaymentsMap = ydoc.getMap<Repayment | { id: string; _deleted: true }>('loan_repayments');

  /**
   * Nilai sebuah kunci pada map, atau `undefined` bila kunci itu sudah tidak
   * ada / bertanda tombstone. Penghapusan di aplikasi ini dilakukan dengan
   * menulis `{ _deleted: true }`, tapi `map.delete()` dari Yjs pun ditangani.
   */
  function liveValue<T>(map: Y.Map<T | { id: string; _deleted: true }>, key: string): T | undefined {
    const value = map.get(key);
    if (value === undefined) return undefined;
    if ((value as SyncEntity)._deleted) return undefined;
    return value as T;
  }

  const handleWalletsChange = async (keys: string[]) => {
    const db = getDB();
    if (!db) return;

    for (const key of keys) {
      const incoming = liveValue(walletsMap, key);
      if (!incoming) {
        await walletDb.deleteWallet(db, key).catch(() => {});
        continue;
      }

      // `balance` adalah nilai turunan (initialBalance + jumlah transaksi).
      // Jangan pernah menimpanya dengan snapshot remote — device asal bisa punya
      // riwayat transaksi yang berbeda saat menulis ke Yjs. Pertahankan saldo
      // lokal bila wallet-nya sudah ada, atau pakai initialBalance untuk wallet
      // yang benar-benar baru (transaksinya belum tiba; handleTransactionsChange
      // akan menghitung ulang setelah masuk).
      const existing = await walletDb.getWalletById(db, incoming.id).catch(() => undefined);
      await walletDb
        .updateWallet(db, {
          ...incoming,
          balance: existing ? existing.balance : incoming.initialBalance,
        })
        .catch(() => {});
    }

    const { useWalletStore } = await import('../stores/walletStore');
    await useWalletStore.getState().loadWallets();
  };

  const handleTransactionsChange = async (keys: string[]) => {
    const db = getDB();
    if (!db) return;

    const affectedWalletIds = new Set<string>();
    const noteAffected = (t: Transaction | undefined) => {
      if (!t) return;
      if (t.walletId) affectedWalletIds.add(t.walletId);
      if (t.toWalletId) affectedWalletIds.add(t.toWalletId);
    };

    for (const key of keys) {
      // Baca record lokal SEBELUM menulis/menghapus. Transaksi yang dihapus —
      // dan wallet lama pada transaksi yang dipindahkan antar-wallet — tetap
      // memengaruhi saldo, dan setelah operasi ini informasinya sudah hilang.
      noteAffected(await transactionDb.getTransactionById(db, key).catch(() => undefined));

      const incoming = liveValue(transactionsMap, key);
      if (!incoming) {
        await transactionDb.deleteTransactionRecord(db, key).catch(() => {});
        continue;
      }

      noteAffected(incoming);
      await transactionDb.putTransactionRecord(db, incoming).catch(() => {});
    }

    // Hitung ulang saldo wallet terdampak dari keseluruhan riwayat transaksi.
    // Aman karena initialBalance tidak pernah diubah setelah wallet dibuat —
    // koreksi saldo selalu berupa transaksi adjustment.
    if (affectedWalletIds.size > 0) {
      const allTxs = await transactionDb.getAllTransactions(db);
      const deltas = sumWalletDeltas(allTxs);

      for (const walletId of Array.from(affectedWalletIds)) {
        const wallet = await walletDb.getWalletById(db, walletId).catch(() => undefined);
        if (!wallet) continue;

        await walletDb
          .updateWallet(db, {
            ...wallet,
            balance: resolveBalance(wallet.initialBalance, deltas.get(walletId)),
          })
          .catch(() => {});
      }
    }

    const { useTransactionStore } = await import('../stores/transactionStore');
    const { useWalletStore } = await import('../stores/walletStore');
    await Promise.all([
      useTransactionStore.getState().loadTransactions(),
      useWalletStore.getState().loadWallets(),
    ]);
  };

  const handleCategoriesChange = async (keys: string[]) => {
    const db = getDB();
    if (!db) return;

    for (const key of keys) {
      const incoming = liveValue(categoriesMap, key);
      if (!incoming) {
        await categoryDb.deleteCategory(db, key).catch(() => {});
      } else {
        await categoryDb.updateCategory(db, incoming).catch(() => {});
      }
    }

    const { useCategoryStore } = await import('../stores/categoryStore');
    await useCategoryStore.getState().loadCategories();
  };

  const handleLoanContactsChange = async (keys: string[]) => {
    const db = getDB();
    if (!db) return;

    for (const key of keys) {
      const incoming = liveValue(loanContactsMap, key);
      if (!incoming) {
        await loanContactDb.deleteContact(db, key).catch(() => {});
      } else {
        await loanContactDb.updateContact(db, key, incoming).catch(() => {});
      }
    }

    const { useLoanContactStore } = await import('../stores/loanContactStore');
    await useLoanContactStore.getState().loadContacts();
  };

  const handleLoanEntriesChange = async (keys: string[]) => {
    const db = getDB();
    if (!db) return;

    for (const key of keys) {
      const incoming = liveValue(loanEntriesMap, key);
      if (!incoming) {
        await loanEntryDb.deleteEntry(db, key).catch(() => {});
      } else {
        await loanEntryDb.updateEntry(db, key, incoming).catch(() => {});
      }
    }

    const { useLoanEntryStore } = await import('../stores/loanEntryStore');
    await useLoanEntryStore.getState().loadEntries();
  };

  const handleLoanRepaymentsChange = async (keys: string[]) => {
    const db = getDB();
    if (!db) return;

    for (const key of keys) {
      const incoming = liveValue(loanRepaymentsMap, key);
      if (!incoming) {
        await loanRepaymentDb.deleteRepayment(db, key).catch(() => {});
      } else {
        // `remainingAmount` / `status` loan entry TIDAK dihitung ulang di sini —
        // nilainya ikut ter-sync lewat map `loan_entries` yang di-publish
        // bersamaan oleh device asal, jadi map itulah yang otoritatif.
        await loanRepaymentDb.putRepayment(db, incoming).catch(() => {});
      }
    }

    const { useLoanRepaymentStore } = await import('../stores/loanRepaymentStore');
    await useLoanRepaymentStore.getState().loadRepayments();
  };

  /**
   * Pasang observer untuk sebuah map.
   *
   * Handler hanya menerima kunci yang BERUBAH. Versi sebelumnya memindai ulang
   * seluruh map dan menulis ulang semua record ke IndexedDB pada setiap event,
   * sehingga satu transaksi dari device lain memicu N operasi tulis.
   */
  function bind<T>(
    map: Y.Map<T | { id: string; _deleted: true }>,
    handler: (keys: string[]) => Promise<void>,
  ): void {
    const observer = (event: Y.YMapEvent<T | { id: string; _deleted: true }>) => {
      const keys = changedKeys(event);
      if (keys.length === 0) return;
      enqueue(() => handler(keys));
    };
    map.observe(observer);
    activeObservers.push(() => map.unobserve(observer));
  }

  bind(walletsMap, handleWalletsChange);
  bind(transactionsMap, handleTransactionsChange);
  bind(categoriesMap, handleCategoriesChange);
  bind(loanContactsMap, handleLoanContactsChange);
  bind(loanEntriesMap, handleLoanEntriesChange);
  bind(loanRepaymentsMap, handleLoanRepaymentsChange);

  // Rekonsiliasi awal: `connect()` selalu membuat Y.Doc baru yang kosong, jadi
  // seluruh state (dari IndexedDB lokal maupun peer) tiba lewat event dan sudah
  // tercakup delta di atas. Sapuan sekali ini hanya jaring pengaman bila
  // observer dipasang pada doc yang sudah terisi — pada doc kosong biayanya nol.
  const pending: Array<[string[], (keys: string[]) => Promise<void>]> = [
    [Array.from(walletsMap.keys()), handleWalletsChange],
    [Array.from(transactionsMap.keys()), handleTransactionsChange],
    [Array.from(categoriesMap.keys()), handleCategoriesChange],
    [Array.from(loanContactsMap.keys()), handleLoanContactsChange],
    [Array.from(loanEntriesMap.keys()), handleLoanEntriesChange],
    [Array.from(loanRepaymentsMap.keys()), handleLoanRepaymentsChange],
  ];
  for (const [keys, handler] of pending) {
    if (keys.length > 0) enqueue(() => handler(keys));
  }
}

export function onLocalChange(
  entityType: SyncedStoreName,
  entity: SyncPayload
): void {
  const ydoc = webrtcProvider.getYDoc();
  if (!ydoc) return;

  const map = ydoc.getMap(entityType);
  map.set(entity.id, entity);

  // Schedule Google Drive backup
  googleDriveProvider.scheduleBackup();
}

/**
 * Wipe all local app data (wallets, transactions, categories) and the Yjs
 * persistence store so the device starts clean before joining another device's
 * sync room via QR scan.
 *
 * sync-config (syncKey, Google auth) is intentionally NOT cleared here —
 * the caller sets the new syncKey right after.
 */
export async function clearAllLocalData(): Promise<void> {
  // Disconnect and clean up any active sync session first
  disconnectFromSyncRoom();

  // Clear app data stores in flowang-db
  const db = getDB();
  if (db) {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(syncedStoreNames(), 'readwrite');
      for (const storeName of SYNCED_STORES) {
        tx.objectStore(storeName).clear();
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // Delete the Yjs IndexedDB persistence store so stale CRDT state doesn't
  // bleed into the new sync room.
  await new Promise<void>((resolve) => {
    const req = indexedDB.deleteDatabase(YJS_STORE);
    req.onsuccess = () => resolve();
    req.onerror = () => resolve(); // non-fatal — proceed even if delete fails
    req.onblocked = () => resolve();
  });

  // Reload stores so UI reflects the empty state
  const [{ useWalletStore }, { useTransactionStore }, { useCategoryStore }, { useLoanContactStore }, { useLoanEntryStore }, { useLoanRepaymentStore }] = await Promise.all([
    import('../stores/walletStore'),
    import('../stores/transactionStore'),
    import('../stores/categoryStore'),
    import('../stores/loanContactStore'),
    import('../stores/loanEntryStore'),
    import('../stores/loanRepaymentStore'),
  ]);
  await Promise.all([
    useWalletStore.getState().loadWallets(),
    useTransactionStore.getState().loadTransactions(),
    useCategoryStore.getState().loadCategories(),
    useLoanContactStore.getState().loadContacts(),
    useLoanEntryStore.getState().loadEntries(),
    useLoanRepaymentStore.getState().loadRepayments(),
  ]);
}

export async function connectToSyncRoom(): Promise<void> {
  const syncKey = useSyncStore.getState().syncKey;
  if (!syncKey) return;

  try {
    // Disconnect first to cancel any pending reconnect timers and clean up
    // the old provider before creating a new one (e.g. after QR scan with a
    // different key).
    webrtcProvider.disconnect();

    useSyncStore.getState().setSyncStatus('connecting');
    const payload = decodeSyncKey(syncKey);
    await importKeyFromBase64(payload.encryptionKey);
    webrtcProvider.connect(payload.roomName, payload.encryptionKey);
    _attachObservers();
  } catch (error) {
    useSyncStore.getState().setSyncError(
      `Gagal terhubung: ${(error as Error).message}`
    );
  }
}

export function disconnectFromSyncRoom(): void {
  for (const cleanup of activeObservers) cleanup();
  activeObservers = [];
  webrtcProvider.disconnect();
}

export async function resetSyncKey(): Promise<void> {
  disconnectFromSyncRoom();

  const { generateSyncKey, encodeSyncKey } = await import('./syncKeyUtils');
  const newPayload = await generateSyncKey();
  const encoded = encodeSyncKey(newPayload);

  useSyncStore.getState().setSyncKey(encoded);
  useSyncStore.getState().setSyncError(
    'Sync Key baru di-generate. Perangkat lain perlu di-pair ulang. Backup lama tidak valid dengan key baru.'
  );

  await importKeyFromBase64(newPayload.encryptionKey);
  webrtcProvider.connect(newPayload.roomName, newPayload.encryptionKey);
  _attachObservers();
}

export { googleDriveProvider };
