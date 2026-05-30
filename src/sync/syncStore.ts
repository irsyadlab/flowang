/**
 * Sync Store - Zustand store for sync state management.
 */

import { create } from 'zustand';

export type SyncStatus = 'disconnected' | 'connecting' | 'connected';

export interface GoogleUserInfo {
  name: string;
  email: string;
}

interface SyncState {
  syncStatus: SyncStatus;
  syncKey: string | null;
  googleAuthToken: string | null;
  googleTokenExpiry: number | null;
  googleUserInfo: GoogleUserInfo | null;
  lastBackupTimestamp: string | null;
  syncError: string | null;
  storageLoaded: boolean;

  setSyncStatus: (status: SyncStatus) => void;
  setSyncKey: (key: string | null) => void;
  setGoogleAuth: (token: string | null, userInfo: GoogleUserInfo | null, expiresIn?: number) => void;
  setLastBackupTimestamp: (ts: string) => void;
  setSyncError: (error: string | null) => void;
  loadFromStorage: () => Promise<void>;
}

function openSyncConfigDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('sync-config', 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('config')) {
        db.createObjectStore('config');
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getConfigValue<T>(key: string): Promise<T | null> {
  try {
    const db = await openSyncConfigDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('config', 'readonly');
      const store = tx.objectStore('config');
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return null;
  }
}

async function setConfigValue<T>(key: string, value: T): Promise<void> {
  const db = await openSyncConfigDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('config', 'readwrite');
    const store = tx.objectStore('config');
    const request = store.put(value, key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteConfigValue(key: string): Promise<void> {
  try {
    const db = await openSyncConfigDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('config', 'readwrite');
      const store = tx.objectStore('config');
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    // silent
  }
}

export const useSyncStore = create<SyncState>((set) => ({
  syncStatus: 'disconnected',
  syncKey: null,
  googleAuthToken: null,
  googleTokenExpiry: null,
  googleUserInfo: null,
  lastBackupTimestamp: null,
  syncError: null,
  storageLoaded: false,

  setSyncStatus: (status) => set({ syncStatus: status }),
  setSyncKey: (key) => {
    if (key) {
      setConfigValue('syncKey', key);
    } else {
      deleteConfigValue('syncKey');
    }
    set({ syncKey: key });
  },
  setGoogleAuth: (token, userInfo, expiresIn) => {
    if (token && userInfo) {
      // expiresIn is in seconds; store absolute expiry timestamp (ms)
      const expiry = expiresIn ? Date.now() + expiresIn * 1000 : null;
      setConfigValue('googleAuthToken', token);
      setConfigValue('googleUserInfo', userInfo);
      if (expiry) setConfigValue('googleTokenExpiry', expiry);
      set({ googleAuthToken: token, googleUserInfo: userInfo, googleTokenExpiry: expiry });
    } else {
      deleteConfigValue('googleAuthToken');
      deleteConfigValue('googleUserInfo');
      deleteConfigValue('googleTokenExpiry');
      set({ googleAuthToken: null, googleUserInfo: null, googleTokenExpiry: null });
    }
  },
  setLastBackupTimestamp: (ts) => {
    setConfigValue('lastBackupTimestamp', ts);
    set({ lastBackupTimestamp: ts });
  },
  setSyncError: (error) => set({ syncError: error }),

  loadFromStorage: async () => {
    try {
      const [syncKey, googleAuthToken, googleUserInfo, lastBackupTimestamp, googleTokenExpiry] = await Promise.all([
        getConfigValue<string>('syncKey'),
        getConfigValue<string>('googleAuthToken'),
        getConfigValue<GoogleUserInfo>('googleUserInfo'),
        getConfigValue<string>('lastBackupTimestamp'),
        getConfigValue<number>('googleTokenExpiry'),
      ]);

      set({
        syncKey: syncKey ?? null,
        googleAuthToken: googleAuthToken ?? null,
        googleUserInfo: googleUserInfo ?? null,
        googleTokenExpiry: googleTokenExpiry ?? null,
        lastBackupTimestamp: lastBackupTimestamp ?? null,
        storageLoaded: true,
      });
    } catch {
      set({ storageLoaded: true });
    }
  },
}));
