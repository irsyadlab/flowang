/**
 * Sync Manager - orchestrates sync between IndexedDB, Yjs CRDT, and Google Drive.
 */

import { useSyncStore } from './syncStore';
import { importKeyFromBase64 } from './cryptoService';
import { decodeSyncKey } from './syncKeyUtils';
import * as webrtcProvider from './webrtcProvider';
import * as googleDriveProvider from './googleDriveProvider';
import { getDB } from '../db/db';
import * as walletDb from '../db/walletDb';
import type { Wallet, Transaction } from '../types';

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

  const handleWalletsChange = async () => {
    const db = getDB();
    if (!db) return;

    const entries = Array.from(walletsMap.values());
    for (const entry of entries) {
      if ((entry as SyncEntity)._deleted) {
        await walletDb.deleteWallet(db, entry.id).catch(() => {});
      } else {
        // put() acts as upsert — safe to call for both new and existing
        await walletDb.updateWallet(db, entry as Wallet).catch(() => {});
      }
    }

    // Reload store so UI reflects remote changes
    const { useWalletStore } = await import('../stores/walletStore');
    await useWalletStore.getState().loadWallets();
  };

  const handleTransactionsChange = async () => {
    const db = getDB();
    if (!db) return;

    const entries = Array.from(transactionsMap.values());
    for (const entry of entries) {
      if ((entry as SyncEntity)._deleted) {
        // For deleted transactions, we skip wallet balance recalc here —
        // a full reload handles consistency
        const tx = db.transaction('transactions', 'readwrite');
        tx.objectStore('transactions').delete(entry.id);
        await new Promise<void>((res, rej) => {
          tx.oncomplete = () => res();
          tx.onerror = () => rej(tx.error);
        }).catch(() => {});
      } else {
        const tx = db.transaction('transactions', 'readwrite');
        tx.objectStore('transactions').put(entry as Transaction);
        await new Promise<void>((res, rej) => {
          tx.oncomplete = () => res();
          tx.onerror = () => rej(tx.error);
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

  walletsMap.observe(handleWalletsChange);
  transactionsMap.observe(handleTransactionsChange);

  activeObservers.push(
    () => walletsMap.unobserve(handleWalletsChange),
    () => transactionsMap.unobserve(handleTransactionsChange),
  );
}

export function onLocalChange(
  entityType: 'wallets' | 'transactions' | 'categories',
  entity: SyncEntity
): void {
  const ydoc = webrtcProvider.getYDoc();
  if (!ydoc) return;

  const map = ydoc.getMap(entityType);
  map.set(entity.id, entity);

  // Schedule Google Drive backup
  googleDriveProvider.scheduleBackup();
}

export async function connectToSyncRoom(): Promise<void> {
  const syncKey = useSyncStore.getState().syncKey;
  if (!syncKey) return;

  try {
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
