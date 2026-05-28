/**
 * Sync Manager - orchestrates sync between IndexedDB, Yjs CRDT, and Google Drive.
 */

import { useSyncStore } from './syncStore';
import { importKeyFromBase64 } from './cryptoService';
import { decodeSyncKey } from './syncKeyUtils';
import * as webrtcProvider from './webrtcProvider';
import * as googleDriveProvider from './googleDriveProvider';

interface SyncEntity {
  id: string;
  _deleted?: boolean;
  [key: string]: unknown;
}

let initialized = false;

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
  } catch (error) {
    useSyncStore.getState().setSyncError(
      `Gagal terhubung: ${(error as Error).message}`
    );
  }
}

export function disconnectFromSyncRoom(): void {
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
}

export { googleDriveProvider };
