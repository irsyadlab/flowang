/**
 * WebRTC Provider - wraps y-webrtc with reconnect logic and IndexedDB persistence.
 */

import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { IndexeddbPersistence } from 'y-indexeddb';
import { useSyncStore } from './syncStore';
import { calculateBackoffDelay, MAX_ATTEMPTS } from './backoffUtils';
import { getEnvConfig } from '../lib/envConfig';

const YJS_STORE = 'yjs-sync';

let ydoc: Y.Doc | null = null;
let webrtcProvider: WebrtcProvider | null = null;
let indexeddbProvider: IndexeddbPersistence | null = null;
let reconnectAttempt = 0;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let onlineHandler: (() => void) | null = null;
let currentRoomName: string | null = null;
let currentEncryptionKey: string | null = null;

export function getYDoc(): Y.Doc | null {
  return ydoc;
}

export function connect(roomName: string, encryptionKey: string): void {
  disconnect();

  currentRoomName = roomName;
  currentEncryptionKey = encryptionKey;

  ydoc = new Y.Doc();
  const config = getEnvConfig();

  // Setup IndexedDB persistence
  indexeddbProvider = new IndexeddbPersistence(YJS_STORE, ydoc);

  // Setup WebRTC provider
  webrtcProvider = new WebrtcProvider(roomName, ydoc, {
    signaling: [config.signalingUrl],
    password: encryptionKey,
  });

  webrtcProvider.on('synced', ({ synced }: { synced: boolean }) => {
    if (synced) {
      useSyncStore.getState().setSyncStatus('connected');
      reconnectAttempt = 0;
    }
  });

  webrtcProvider.on('status', ({ connected }: { connected: boolean }) => {
    if (!connected) {
      useSyncStore.getState().setSyncStatus('connecting');
      scheduleReconnect();
    }
  });

  useSyncStore.getState().setSyncStatus('connecting');

  // Listen for browser online event
  onlineHandler = () => {
    if (useSyncStore.getState().syncStatus !== 'connected') {
      scheduleReconnect();
    }
  };
  window.addEventListener('online', onlineHandler);
}

function scheduleReconnect(): void {
  if (!currentRoomName || !currentEncryptionKey) return;
  if (reconnectAttempt >= MAX_ATTEMPTS) {
    useSyncStore.getState().setSyncStatus('disconnected');
    return;
  }

  if (reconnectTimer) clearTimeout(reconnectTimer);

  const delay = calculateBackoffDelay(reconnectAttempt);
  reconnectAttempt++;

  reconnectTimer = setTimeout(() => {
    try {
      connect(currentRoomName!, currentEncryptionKey!);
    } catch {
      scheduleReconnect();
    }
  }, delay);
}

export function disconnect(): void {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  reconnectAttempt = 0;
  currentRoomName = null;
  currentEncryptionKey = null;

  if (onlineHandler) {
    window.removeEventListener('online', onlineHandler);
    onlineHandler = null;
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

  useSyncStore.getState().setSyncStatus('disconnected');
}
