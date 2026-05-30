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
import type { Wallet, Transaction, Category, LoanContact, LoanEntry } from '../types';

interface SyncEntity {
  id: string;
  _deleted?: boolean;
  [key: string]: unknown;
}

let initialized = false;
// Track active Yjs observers so we can clean them up on reconnect
let activeObservers: (() => void)[] = [];

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

  const handleWalletsChange = async () => {
    const db = getDB();
    if (!db) return;

    const entries = Array.from(walletsMap.values());
    for (const entry of entries) {
      if ((entry as SyncEntity)._deleted) {
        await walletDb.deleteWallet(db, entry.id).catch(() => {});
      } else {
        const incoming = entry as Wallet;
        // `balance` is a derived value (initialBalance + sum of transactions).
        // Never overwrite it with the remote snapshot — the remote device may
        // have a different transaction history at the time it wrote to Yjs.
        // Instead, preserve the local balance if the wallet already exists, or
        // use initialBalance for a brand-new wallet (transactions haven't
        // arrived yet; handleTransactionsChange will recalculate after they do).
        const existing = await walletDb.getWalletById(db, incoming.id).catch(() => undefined);
        const walletToSave: Wallet = {
          ...incoming,
          balance: existing ? existing.balance : incoming.initialBalance,
        };
        await walletDb.updateWallet(db, walletToSave).catch(() => {});
      }
    }

    // Reload store so UI reflects remote changes
    const { useWalletStore } = await import('../stores/walletStore');
    await useWalletStore.getState().loadWallets();
  };

  const handleTransactionsChange = async () => {
    const db = getDB();
    if (!db) return;

    // Track which wallets are affected so we can recalculate their balances
    const affectedWalletIds = new Set<string>();

    const entries = Array.from(transactionsMap.values());
    for (const entry of entries) {
      if ((entry as SyncEntity)._deleted) {
        const tx = db.transaction('transactions', 'readwrite');
        tx.objectStore('transactions').delete(entry.id);
        await new Promise<void>((res, rej) => {
          tx.oncomplete = () => res();
          tx.onerror = () => rej(tx.error);
        }).catch(() => {});
      } else {
        const incoming = entry as Transaction;
        if (incoming.walletId) affectedWalletIds.add(incoming.walletId);
        if (incoming.toWalletId) affectedWalletIds.add(incoming.toWalletId);

        const tx = db.transaction('transactions', 'readwrite');
        tx.objectStore('transactions').put(incoming);
        await new Promise<void>((res, rej) => {
          tx.oncomplete = () => res();
          tx.onerror = () => rej(tx.error);
        }).catch(() => {});
      }
    }

    // Recalculate balance for every affected wallet from the full transaction
    // history — this is the only correct way since balance is a derived value.
    if (affectedWalletIds.size > 0) {
      const { getAllTransactions } = await import('../db/transactionDb');
      const allTxs = await getAllTransactions(db);

      for (const walletId of Array.from(affectedWalletIds)) {
        const wallet = await walletDb.getWalletById(db, walletId).catch(() => undefined);
        if (!wallet) continue;

        let delta = 0;
        for (const t of allTxs) {
          if (t.walletId === walletId) {
            if (t.type === 'income' || t.type === 'adjustment_increase') delta += t.amount;
            else if (t.type === 'expense' || t.type === 'adjustment_decrease') delta -= t.amount;
            else if (t.type === 'transfer') delta -= t.amount;
          }
          if (t.toWalletId === walletId && t.type === 'transfer') delta += t.amount;
        }

        await walletDb.updateWallet(db, {
          ...wallet,
          balance: wallet.initialBalance + delta,
        }).catch(() => {});
      }
    }

    // Reload stores so UI reflects remote changes
    const { useTransactionStore } = await import('../stores/transactionStore');
    const { useWalletStore } = await import('../stores/walletStore');
    await Promise.all([
      useTransactionStore.getState().loadTransactions(),
      useWalletStore.getState().loadWallets(),
    ]);
  };

  const handleCategoriesChange = async () => {
    const db = getDB();
    if (!db) return;

    const entries = Array.from(categoriesMap.values());
    for (const entry of entries) {
      if ((entry as SyncEntity)._deleted) {
        await categoryDb.deleteCategory(db, entry.id).catch(() => {});
      } else {
        await categoryDb.updateCategory(db, entry as Category).catch(() => {});
      }
    }

    // Reload store so UI reflects remote changes
    const { useCategoryStore } = await import('../stores/categoryStore');
    await useCategoryStore.getState().loadCategories();
  };

  const handleLoanContactsChange = async () => {
    const db = getDB();
    if (!db) return;

    const entries = Array.from(loanContactsMap.values());
    for (const entry of entries) {
      if ((entry as SyncEntity)._deleted) {
        await loanContactDb.deleteContact(db, entry.id).catch(() => {});
      } else {
        await loanContactDb.updateContact(db, entry.id, entry as LoanContact).catch(() => {});
      }
    }

    const { useLoanContactStore } = await import('../stores/loanContactStore');
    await useLoanContactStore.getState().loadContacts();
  };

  const handleLoanEntriesChange = async () => {
    const db = getDB();
    if (!db) return;

    const entries = Array.from(loanEntriesMap.values());
    for (const entry of entries) {
      if ((entry as SyncEntity)._deleted) {
        await loanEntryDb.deleteEntry(db, entry.id).catch(() => {});
      } else {
        await loanEntryDb.updateEntry(db, entry.id, entry as LoanEntry).catch(() => {});
      }
    }

    const { useLoanEntryStore } = await import('../stores/loanEntryStore');
    await useLoanEntryStore.getState().loadEntries();
  };

  walletsMap.observe(handleWalletsChange);
  transactionsMap.observe(handleTransactionsChange);
  categoriesMap.observe(handleCategoriesChange);
  loanContactsMap.observe(handleLoanContactsChange);
  loanEntriesMap.observe(handleLoanEntriesChange);

  activeObservers.push(
    () => walletsMap.unobserve(handleWalletsChange),
    () => transactionsMap.unobserve(handleTransactionsChange),
    () => categoriesMap.unobserve(handleCategoriesChange),
    () => loanContactsMap.unobserve(handleLoanContactsChange),
    () => loanEntriesMap.unobserve(handleLoanEntriesChange),
  );
}

export function onLocalChange(
  entityType: 'wallets' | 'transactions' | 'categories' | 'loan_contacts' | 'loan_entries',
  entity: SyncEntity
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
      const tx = db.transaction(['wallets', 'transactions', 'categories', 'loan_contacts', 'loan_entries'], 'readwrite');
      tx.objectStore('wallets').clear();
      tx.objectStore('transactions').clear();
      tx.objectStore('categories').clear();
      tx.objectStore('loan_contacts').clear();
      tx.objectStore('loan_entries').clear();
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
  const [{ useWalletStore }, { useTransactionStore }, { useCategoryStore }, { useLoanContactStore }, { useLoanEntryStore }] = await Promise.all([
    import('../stores/walletStore'),
    import('../stores/transactionStore'),
    import('../stores/categoryStore'),
    import('../stores/loanContactStore'),
    import('../stores/loanEntryStore'),
  ]);
  await Promise.all([
    useWalletStore.getState().loadWallets(),
    useTransactionStore.getState().loadTransactions(),
    useCategoryStore.getState().loadCategories(),
    useLoanContactStore.getState().loadContacts(),
    useLoanEntryStore.getState().loadEntries(),
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
