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
// Refresh token 5 minutes before expiry
const TOKEN_EXPIRY_BUFFER_MS = 5 * 60 * 1000;

let backupDebounceTimer: ReturnType<typeof setTimeout> | null = null;

// GIS TokenClient type (minimal)
interface GisTokenClient {
  requestAccessToken: (overrides?: { prompt?: string }) => void;
}

interface GisTokenResponse {
  access_token: string;
  expires_in: number;
  error?: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: GisTokenResponse) => void;
            error_callback?: (error: { type: string }) => void;
          }) => GisTokenClient;
        };
      };
    };
  }
}

let tokenClient: GisTokenClient | null = null;
// Pending promise resolvers for token refresh
let tokenRefreshResolve: ((token: string) => void) | null = null;
let tokenRefreshReject: ((err: Error) => void) | null = null;

function getOrCreateTokenClient(): GisTokenClient {
  if (tokenClient) return tokenClient;

  const config = getEnvConfig();
  if (!window.google?.accounts?.oauth2) {
    throw new Error('Google Identity Services belum dimuat');
  }

  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: config.googleClientId,
    scope: SCOPE,
    callback: (response: GisTokenResponse) => {
      if (response.error || !response.access_token) {
        const err = new Error(response.error ?? 'Token request gagal');
        tokenRefreshReject?.(err);
        tokenRefreshResolve = null;
        tokenRefreshReject = null;
        return;
      }

      const { access_token, expires_in } = response;

      // Fetch user info then store token
      fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${access_token}` },
      })
        .then((res) => res.json() as Promise<GoogleUserInfoResponse>)
        .then((info) => {
          useSyncStore.getState().setGoogleAuth(
            access_token,
            { name: info.name || 'Google User', email: info.email || '' },
            expires_in,
          );
        })
        .catch(() => {
          // Store token even if userinfo fails
          const existing = useSyncStore.getState().googleUserInfo;
          useSyncStore.getState().setGoogleAuth(
            access_token,
            existing ?? { name: 'Google User', email: '' },
            expires_in,
          );
        })
        .finally(() => {
          tokenRefreshResolve?.(access_token);
          tokenRefreshResolve = null;
          tokenRefreshReject = null;
        });
    },
    error_callback: (error) => {
      tokenRefreshReject?.(new Error(`OAuth error: ${error.type}`));
      tokenRefreshResolve = null;
      tokenRefreshReject = null;
    },
  });

  return tokenClient;
}

/**
 * Returns a valid access token, refreshing silently if expired or near expiry.
 * If a user interaction is needed (first login), opens the consent popup.
 *
 * @param allowPopup - When false (default), throws TOKEN_EXPIRED without touching
 *   stored credentials. Pass true only from explicit user actions (login, backup,
 *   restore) so the popup never fires automatically.
 */
async function ensureValidToken(allowPopup = false): Promise<string> {
  const state = useSyncStore.getState();
  const { googleAuthToken, googleTokenExpiry } = state;

  // Token still valid with buffer
  if (googleAuthToken && googleTokenExpiry && Date.now() < googleTokenExpiry - TOKEN_EXPIRY_BUFFER_MS) {
    return googleAuthToken;
  }

  // Token missing or expired — only open popup when explicitly allowed
  if (!allowPopup) {
    // Do NOT clear stored credentials — user info is still valid, only the
    // access token needs refreshing. The UI will trigger a silent refresh
    // when the sheet is opened.
    throw new Error('TOKEN_EXPIRED');
  }

  // Need to refresh — request a new token
  return new Promise<string>((resolve, reject) => {
    tokenRefreshResolve = resolve;
    tokenRefreshReject = reject;

    try {
      const client = getOrCreateTokenClient();
      // prompt: '' = silent refresh if session exists; falls back to popup if needed
      client.requestAccessToken({ prompt: '' });
    } catch (err) {
      tokenRefreshResolve = null;
      tokenRefreshReject = null;
      reject(err);
    }
  });
}

function getAccessToken(): string | null {
  return useSyncStore.getState().googleAuthToken;
}

interface DriveFile {
  id: string;
  name: string;
  modifiedTime?: string;
}

interface DriveFilesResponse {
  files: DriveFile[];
}

interface SerializedData {
  wallets: Record<string, unknown>[];
  transactions: Record<string, unknown>[];
  categories: Record<string, unknown>[];
  loan_contacts: Record<string, unknown>[];
  loan_entries: Record<string, unknown>[];
}

interface GoogleUserInfoResponse {
  name?: string;
  email?: string;
}

async function listAppDataFiles(token: string): Promise<DriveFile[]> {
  const res = await fetch(
    `${DRIVE_API_BASE}/files?spaces=appDataFolder&fields=files(id,name,modifiedTime)`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error('Gagal mengakses Google Drive');
  const data = await res.json() as DriveFilesResponse;
  return data.files || [];
}

async function listAppDataFilesBackground(): Promise<DriveFile[]> {
  const token = await ensureValidToken(false);
  return listAppDataFiles(token);
}

async function uploadFile(name: string, data: Uint8Array, token: string): Promise<void> {

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

async function downloadFile(fileId: string, token: string): Promise<Uint8Array> {

  const res = await fetch(`${DRIVE_API_BASE}/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error('Gagal download dari Google Drive');
  return new Uint8Array(await res.arrayBuffer());
}

async function deleteFile(fileId: string, token: string): Promise<void> {
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
    loan_contacts: [],
    loan_entries: [],
  };

  for (const storeName of ['wallets', 'transactions', 'categories', 'loan_contacts', 'loan_entries'] as const) {
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

/**
 * Silently refresh the access token using the existing Google session.
 * Does not open a popup — throws if the session is no longer valid.
 */
export async function silentRefresh(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    tokenRefreshResolve = (token) => {
      void token;
      resolve();
    };
    tokenRefreshReject = reject;

    try {
      const client = getOrCreateTokenClient();
      client.requestAccessToken({ prompt: '' });
    } catch (err) {
      tokenRefreshResolve = null;
      tokenRefreshReject = null;
      reject(err);
    }
  });
}

export async function login(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    tokenRefreshResolve = (token) => {
      void token; // token already stored in callback
      resolve();
    };
    tokenRefreshReject = reject;

    try {
      const client = getOrCreateTokenClient();
      // prompt: 'consent' forces account picker on first login
      client.requestAccessToken({ prompt: 'consent' });
    } catch (err) {
      tokenRefreshResolve = null;
      tokenRefreshReject = null;
      reject(err);
    }
  });
}

/**
 * handleOAuthCallback is kept for backward compatibility but is now a no-op.
 * GIS handles the token response via the callback, not via URL hash redirect.
 */
export function handleOAuthCallback(): boolean {
  // Legacy implicit flow: check if there's a token in the hash from an old redirect
  const hash = window.location.hash;
  if (!hash.includes('access_token')) return false;

  const params = new URLSearchParams(hash.substring(1));
  const token = params.get('access_token');
  const expiresIn = parseInt(params.get('expires_in') ?? '3600', 10);
  if (!token) return false;

  useSyncStore.getState().setGoogleAuth(
    token,
    { name: 'Google User', email: '' },
    expiresIn,
  );

  // Fetch user info
  fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((res) => res.json() as Promise<GoogleUserInfoResponse>)
    .then((info) => {
      if (info.name || info.email) {
        useSyncStore.getState().setGoogleAuth(
          token,
          { name: info.name || 'Google User', email: info.email || '' },
          expiresIn,
        );
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
  // Reset GIS token client so next login starts fresh
  tokenClient = null;
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
      const token = await ensureValidToken(true);
      const jsonBytes = await serializeIndexedDB();
      // Use decodeSyncKey consistently (same as restore)
      const decoded = decodeSyncKey(syncKey);
      const key = await importKeyFromBase64(decoded.encryptionKey);
      const encrypted = await encrypt(jsonBytes, key);

      const files = await listAppDataFiles(token);
      const existingFiles = files.filter((f) => f.name === BACKUP_FILENAME);
      // Delete all existing backups (there may be duplicates from previous failed attempts)
      await Promise.all(existingFiles.map((f) => deleteFile(f.id, token)));

      await uploadFile(BACKUP_FILENAME, encrypted, token);

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
    const files = await listAppDataFilesBackground();
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

/** Check if a backup file exists in Drive, regardless of local data state.
 *  Also syncs the backup timestamp from Drive metadata so all devices show
 *  the same "last backup" time regardless of which device performed the backup.
 */
export async function checkBackupExists(): Promise<boolean> {
  try {
    const files = await listAppDataFilesBackground();
    const backup = files.find((f) => f.name === BACKUP_FILENAME);
    if (!backup) return false;

    // Sync Drive's modifiedTime to local state so all devices show the same timestamp
    if (backup.modifiedTime) {
      useSyncStore.getState().setLastBackupTimestamp(backup.modifiedTime);
    }

    return true;
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
    const token = await ensureValidToken(true);
    const files = await listAppDataFiles(token);
    const backup = files.find((f) => f.name === BACKUP_FILENAME);
    if (!backup) throw new Error('Backup tidak ditemukan di Google Drive');

    const encrypted = await downloadFile(backup.id, token);

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
    const { useLoanContactStore } = await import('../stores/loanContactStore');
    const { useLoanEntryStore } = await import('../stores/loanEntryStore');

    await Promise.all([
      useWalletStore.getState().loadWallets(),
      useTransactionStore.getState().loadTransactions(),
      useCategoryStore.getState().loadCategories(),
      useLoanContactStore.getState().loadContacts(),
      useLoanEntryStore.getState().loadEntries(),
    ]);
  } catch (error) {
    const msg = (error as Error).message ?? '';
    if (msg.includes('OperationError') || msg.includes('decrypt')) {
      throw new Error('Sync Key tidak cocok dengan backup — pastikan menggunakan Sync Key dari device asal', { cause: error });
    }
    throw error;
  }
}
