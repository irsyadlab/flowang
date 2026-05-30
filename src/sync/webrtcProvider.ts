/**
 * WebRTC Provider - wraps y-webrtc with reconnect logic and IndexedDB persistence.
 */

import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { IndexeddbPersistence } from 'y-indexeddb';
import { useSyncStore } from './syncStore';
import { calculateBackoffDelay, MAX_ATTEMPTS } from './backoffUtils';
import { getEnvConfig, getIceServers } from '../lib/envConfig';

export const YJS_STORE = 'yjs-sync';

let ydoc: Y.Doc | null = null;
let webrtcProvider: WebrtcProvider | null = null;
let indexeddbProvider: IndexeddbPersistence | null = null;
// reconnectAttempt lives outside connect() so disconnect() doesn't reset it
let reconnectAttempt = 0;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let onlineHandler: (() => void) | null = null;
let currentRoomName: string | null = null;
let currentEncryptionKey: string | null = null;
// Track whether we're in a scheduled reconnect (vs fresh connect)
let isReconnecting = false;

export function getYDoc(): Y.Doc | null {
  return ydoc;
}

export function getProvider(): WebrtcProvider | null {
  return webrtcProvider;
}

/**
 * Resolves once the IndexedDB persistence has finished loading into the ydoc.
 * Use this before attaching Yjs observers so you don't miss the initial state.
 */
export function whenPersistenceSynced(): Promise<void> {
  if (!indexeddbProvider) return Promise.resolve();
  return indexeddbProvider.whenSynced.then(() => undefined);
}

export function connect(roomName: string, encryptionKey: string): void {
  // On a fresh connect (not a reconnect), reset the attempt counter
  if (!isReconnecting) {
    reconnectAttempt = 0;
  }

  _destroyProviders();

  currentRoomName = roomName;
  currentEncryptionKey = encryptionKey;

  ydoc = new Y.Doc();
  const config = getEnvConfig();
  const iceServers = getIceServers();

  // Setup IndexedDB persistence. The ydoc will be populated from local storage
  // asynchronously — callers should await whenPersistenceSynced() before
  // reading or observing the ydoc to avoid missing the initial state.
  indexeddbProvider = new IndexeddbPersistence(YJS_STORE, ydoc);

  // Setup WebRTC provider synchronously so it can start signaling immediately.
  // y-webrtc will exchange updates with peers as soon as the connection is
  // established, and Yjs merges them with whatever the ydoc already contains —
  // so starting WebRTC before IndexedDB finishes is safe; the CRDT handles it.
  webrtcProvider = new WebrtcProvider(roomName, ydoc, {
    signaling: [config.signalingUrl],
    password: encryptionKey,
    ...(iceServers.length > 0 && { peerOpts: { config: { iceServers } } }),
  });

  webrtcProvider.on('status', ({ connected }: { connected: boolean }) => {
    if (connected) {
      useSyncStore.getState().setSyncStatus('connected');
      reconnectAttempt = 0;
      isReconnecting = false;
    } else {
      useSyncStore.getState().setSyncStatus('connecting');
      scheduleReconnect();
    }
  });

  // Listen for new peers joining and broadcast all local data to them
  webrtcProvider.on('peers', ({ added }: { added: string[] }) => {
    if (added.length > 0) {
      // New peer joined — broadcast all current data
      broadcastAllLocalData();
    }
  });

  useSyncStore.getState().setSyncStatus('connecting');

  // Listen for browser online event
  if (onlineHandler) {
    window.removeEventListener('online', onlineHandler);
  }
  onlineHandler = () => {
    if (useSyncStore.getState().syncStatus !== 'connected') {
      isReconnecting = false;
      reconnectAttempt = 0;
      scheduleReconnect();
    }
  };
  window.addEventListener('online', onlineHandler);
}

function scheduleReconnect(): void {
  if (!currentRoomName || !currentEncryptionKey) return;
  if (reconnectAttempt >= MAX_ATTEMPTS) {
    useSyncStore.getState().setSyncStatus('disconnected');
    isReconnecting = false;
    return;
  }

  if (reconnectTimer) clearTimeout(reconnectTimer);

  const delay = calculateBackoffDelay(reconnectAttempt);
  reconnectAttempt++;
  isReconnecting = true;

  reconnectTimer = setTimeout(() => {
    try {
      connect(currentRoomName!, currentEncryptionKey!);
    } catch {
      scheduleReconnect();
    }
  }, delay);
}

/** Destroy providers and cancel any pending reconnect timer */
function _destroyProviders(): void {
  // Cancel any pending reconnect so the old timer doesn't fire after a new
  // connect() call (e.g. after scanning a QR code with a different key).
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  if (webrtcProvider) {
    webrtcProvider.disconnect();
    webrtcProvider.destroy();
    webrtcProvider = null;
  }
  if (indexeddbProvider) {
    indexeddbProvider.destroy();
    indexeddbProvider = null;
  }
  if (ydoc) {
    ydoc.destroy();
    ydoc = null;
  }
}

export function disconnect(): void {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  reconnectAttempt = 0;
  isReconnecting = false;
  currentRoomName = null;
  currentEncryptionKey = null;

  if (onlineHandler) {
    window.removeEventListener('online', onlineHandler);
    onlineHandler = null;
  }

  _destroyProviders();

  useSyncStore.getState().setSyncStatus('disconnected');
}

/**
 * Broadcast all local IndexedDB data to Yjs CRDT when a new peer joins.
 * This ensures new devices get the full dataset, not just incremental changes.
 */
async function broadcastAllLocalData(): Promise<void> {
  if (!ydoc) return;

  try {
    const { getDB } = await import('../db/db');
    const db = getDB();
    if (!db) return;

    const storeNames = ['wallets', 'transactions', 'categories', 'loan_contacts', 'loan_entries'] as const;
    
    for (const storeName of storeNames) {
      if (!db.objectStoreNames.contains(storeName)) continue;

      const records = await new Promise<Record<string, unknown>[]>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result as Record<string, unknown>[]);
        request.onerror = () => reject(request.error);
      });

      const map = ydoc.getMap(storeName);
      for (const record of records) {
        if (record.id) {
          map.set(record.id as string, record);
        }
      }
    }
  } catch (error) {
    console.warn('Failed to broadcast local data:', error);
  }
}
