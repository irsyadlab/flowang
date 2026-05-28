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

  // Setup IndexedDB persistence
  indexeddbProvider = new IndexeddbPersistence(YJS_STORE, ydoc);

  // Setup WebRTC provider
  webrtcProvider = new WebrtcProvider(roomName, ydoc, {
    signaling: [config.signalingUrl],
    password: encryptionKey,
  });

  // Connected to signaling server = we're "connected" (ready to sync)
  // This fires even without a peer, which is the correct UX for a local-first app
  webrtcProvider.on('status', ({ connected }: { connected: boolean }) => {
    if (connected) {
      useSyncStore.getState().setSyncStatus('connected');
      reconnectAttempt = 0;
      isReconnecting = false;
    } else {
      // Lost signaling connection — schedule reconnect
      useSyncStore.getState().setSyncStatus('connecting');
      scheduleReconnect();
    }
  });

  useSyncStore.getState().setSyncStatus('connecting');

  // Listen for browser online event
  if (onlineHandler) {
    window.removeEventListener('online', onlineHandler);
  }
  onlineHandler = () => {
    if (useSyncStore.getState().syncStatus !== 'connected') {
      isReconnecting = false; // treat coming back online as a fresh connect
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

/** Destroy providers without touching reconnect state or status */
function _destroyProviders(): void {
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
