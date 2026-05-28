/**
 * Google Drive Provider - OAuth + Drive API for backup/restore.
 */

import { useSyncStore } from './syncStore';
import { getEnvConfig } from '../lib/envConfig';
import { importKeyFromBase64, encrypt, decrypt } from './cryptoService';
import { decodeSyncKey } from './syncKeyUtils';
import { getDB } from '../db/db';

const BACKUP_FILENAME = 'flowang-backup.enc';
const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3';
const SCOPE = [
  'https://www.googleapis.com/auth/drive.appdata',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ');
const RETRY_COUNT = 3;
const RETRY_INTERVAL = 5000;

let backupDebounceTimer: ReturnType<typeof setTimeout> | null = null;

function getAccessToken(): string | null {
  return useSyncStore.getState().googleAuthToken;
}

interface DriveFile {
  id: string;
  name: string;
}

interface DriveFilesResponse {
  files: DriveFile[];
}

interface SerializedData {
  wallets: Record<string, unknown>[];
  transactions: Record<string, unknown>[];
  categories: Record<string, unknown>[];
}

interface GoogleUserInfoResponse {
  name?: string;
  email?: string;
}

async function listAppDataFiles(): Promise<DriveFile[]> {
  const token = getAccessToken();
  if (!token) return [];

  const res = await fetch(
    `${DRIVE_API_BASE}/files?spaces=appDataFolder&fields=files(id,name)`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error('Gagal mengakses Google Drive');
  const data = await res.json() as DriveFilesResponse;
  return data.files || [];
}

async function uploadFile(name: string, data: Uint8Array): Promise<void> {
  const token = getAccessToken();
  if (!token) throw new Error('Tidak terautentikasi');

  const metadata = {
    name,
    parents: ['appDataFolder'],
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  const fileBlob = new Blob([new Uint8Array(data)], { type: 'application/octet-stream' });
  form.append('file', fileBlob);

  const res = await fetch(
    `${DRIVE_UPLOAD_BASE}/files?uploadType=multipart`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    }
  );

  if (!res.ok) throw new Error('Gagal upload ke Google Drive');
}

async function downloadFile(fileId: string): Promise<Uint8Array> {
  const token = getAccessToken();
  if (!token) throw new Error('Tidak terautentikasi');

  const res = await fetch(`${DRIVE_API_BASE}/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error('Gagal download dari Google Drive');
  return new Uint8Array(await res.arrayBuffer());
}

async function deleteFile(fileId: string): Promise<void> {
  const token = getAccessToken();
  if (!token) return;

  await fetch(`${DRIVE_API_BASE}/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

async function serializeIndexedDB(): Promise<Uint8Array> {
  const db = getDB();
  if (!db) throw new Error('Database tidak tersedia');

  const data: SerializedData = {
    wallets: [],
    transactions: [],
    categories: [],
  };

  for (const storeName of ['wallets', 'transactions', 'categories'] as const) {
    const records = await new Promise<Record<string, unknown>[]>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result as Record<string, unknown>[]);
      request.onerror = () => reject(request.error);
    });
    data[storeName] = records;
  }

  const json = JSON.stringify(data);
  return new TextEncoder().encode(json);
}

async function deserializeToIndexedDB(data: Uint8Array): Promise<void> {
  const db = getDB();
  if (!db) throw new Error('Database tidak tersedia');

  const json = new TextDecoder().decode(data);
  const parsed = JSON.parse(json) as SerializedData;

  for (const [storeName, records] of Object.entries(parsed)) {
    if (!db.objectStoreNames.contains(storeName)) continue;

    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);

    // Clear existing data before restoring to avoid stale/duplicate records
    store.clear();
    for (const record of records) {
      store.put(record);
    }
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}

export async function login(): Promise<void> {
  const config = getEnvConfig();
  const redirectUri = `${window.location.origin}`;

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', config.googleClientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'token');
  authUrl.searchParams.set('scope', SCOPE);
  authUrl.searchParams.set('prompt', 'consent');

  window.location.href = authUrl.toString();
}

export function handleOAuthCallback(): boolean {
  const hash = window.location.hash;
  if (!hash.includes('access_token')) return false;

  const params = new URLSearchParams(hash.substring(1));
  const token = params.get('access_token');
  if (!token) return false;

  useSyncStore.getState().setGoogleAuth(token, {
    name: 'Google User',
    email: '',
  });

  // Fetch user info
  fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((res) => res.json() as Promise<GoogleUserInfoResponse>)
    .then((info) => {
      if (info.name || info.email) {
        useSyncStore.getState().setGoogleAuth(token, {
          name: info.name || 'Google User',
          email: info.email || '',
        });
      }
    })
    .catch(() => {});

  window.history.replaceState({}, '', window.location.pathname);
  return true;
}

export function logout(): void {
  const token = getAccessToken();
  if (token) {
    fetch(`https://accounts.google.com/o/oauth2/revoke?token=${token}`).catch(() => {});
  }
  useSyncStore.getState().setGoogleAuth(null, null);
}

export function scheduleBackup(): void {
  if (backupDebounceTimer) clearTimeout(backupDebounceTimer);
  backupDebounceTimer = setTimeout(() => {
    performBackup().catch(() => {});
  }, 30_000);
}

export async function backupNow(): Promise<void> {
  if (backupDebounceTimer) {
    clearTimeout(backupDebounceTimer);
    backupDebounceTimer = null;
  }
  await performBackup();
}

async function performBackup(): Promise<void> {
  const syncKey = useSyncStore.getState().syncKey;
  if (!syncKey) return;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < RETRY_COUNT; attempt++) {
    try {
      const jsonBytes = await serializeIndexedDB();
      // Use decodeSyncKey consistently (same as restore)
      const decoded = decodeSyncKey(syncKey);
      const key = await importKeyFromBase64(decoded.encryptionKey);
      const encrypted = await encrypt(jsonBytes, key);

      const files = await listAppDataFiles();
      const existing = files.find((f) => f.name === BACKUP_FILENAME);
      if (existing) {
        await deleteFile(existing.id);
      }

      await uploadFile(BACKUP_FILENAME, encrypted);

      const now = new Date().toISOString();
      useSyncStore.getState().setLastBackupTimestamp(now);

      useSyncStore.getState().setSyncError(null);
      return;
    } catch (error) {
      lastError = error as Error;
      if (attempt < RETRY_COUNT - 1) {
        await new Promise((r) => setTimeout(r, RETRY_INTERVAL));
      }
    }
  }

  useSyncStore.getState().setSyncError(
    `Backup gagal: ${lastError?.message || 'Unknown error'}`
  );
}

export async function checkRestore(): Promise<boolean> {
  try {
    const files = await listAppDataFiles();
    const backup = files.find((f) => f.name === BACKUP_FILENAME);
    if (!backup) return false;

    const db = getDB();
    if (!db) return false;

    const counts = await Promise.all(
      ['wallets', 'transactions', 'categories'].map((storeName) => {
        return new Promise<number>((resolve) => {
          const tx = db.transaction(storeName, 'readonly');
          const store = tx.objectStore(storeName);
          const request = store.count();
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => resolve(0);
        });
      })
    );

    const totalRecords = counts.reduce((sum, c) => sum + c, 0);
    return totalRecords === 0;
  } catch {
    return false;
  }
}

/** Check if a backup file exists in Drive, regardless of local data state. */
export async function checkBackupExists(): Promise<boolean> {
  try {
    const files = await listAppDataFiles();
    return files.some((f) => f.name === BACKUP_FILENAME);
  } catch {
    return false;
  }
}

export async function restore(): Promise<void> {
  const syncKey = useSyncStore.getState().syncKey;
  if (!syncKey) throw new Error('Sync Key tidak tersedia');
  return restoreWithKey(syncKey);
}

/**
 * Restore backup using an explicitly provided sync key.
 * Used when restoring on a new device where the local key differs from the backup key.
 */
export async function restoreWithKey(syncKey: string): Promise<void> {
  try {
    const files = await listAppDataFiles();
    const backup = files.find((f) => f.name === BACKUP_FILENAME);
    if (!backup) throw new Error('Backup tidak ditemukan di Google Drive');

    const encrypted = await downloadFile(backup.id);

    const decoded = decodeSyncKey(syncKey);
    const key = await importKeyFromBase64(decoded.encryptionKey);
    const decrypted = await decrypt(encrypted, key);

    await deserializeToIndexedDB(decrypted);

    // After successful restore, adopt the provided sync key as the active one
    useSyncStore.getState().setSyncKey(syncKey);

    // Reload all Zustand stores
    const { useWalletStore } = await import('../stores/walletStore');
    const { useTransactionStore } = await import('../stores/transactionStore');
    const { useCategoryStore } = await import('../stores/categoryStore');

    await Promise.all([
      useWalletStore.getState().loadWallets(),
      useTransactionStore.getState().loadTransactions(),
      useCategoryStore.getState().loadCategories(),
    ]);
  } catch (error) {
    const msg = (error as Error).message ?? '';
    if (msg.includes('OperationError') || msg.includes('decrypt')) {
      throw new Error('Sync Key tidak cocok dengan backup — pastikan menggunakan Sync Key dari device asal', { cause: error });
    }
    throw error;
  }
}
