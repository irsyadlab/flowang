/**
 * useSync hook - exposes sync state and actions to UI components.
 */

import { useSyncStore } from '../sync/syncStore';
import * as syncManager from '../sync/syncManager';
import { generateSyncKey, encodeSyncKey } from '../sync/syncKeyUtils';
import { importKeyFromBase64 } from '../sync/cryptoService';
import * as webrtcProvider from '../sync/webrtcProvider';

export function useSync() {
  const syncStatus = useSyncStore((s) => s.syncStatus);
  const syncKey = useSyncStore((s) => s.syncKey);
  const syncError = useSyncStore((s) => s.syncError);
  const lastBackupTimestamp = useSyncStore((s) => s.lastBackupTimestamp);
  const googleAuthToken = useSyncStore((s) => s.googleAuthToken);
  const googleUserInfo = useSyncStore((s) => s.googleUserInfo);
  const setSyncError = useSyncStore((s) => s.setSyncError);

  const connect = () => syncManager.connectToSyncRoom();
  const disconnect = () => syncManager.disconnectFromSyncRoom();

  const generateAndStoreSyncKey = async () => {
    const payload = await generateSyncKey();
    const encoded = encodeSyncKey(payload);
    useSyncStore.getState().setSyncKey(encoded);

    await importKeyFromBase64(payload.encryptionKey);
    webrtcProvider.connect(payload.roomName, payload.encryptionKey);
  };

  const resetSyncKey = async () => {
    await syncManager.resetSyncKey();
  };

  return {
    syncStatus,
    syncKey,
    syncError,
    lastBackupTimestamp,
    googleAuthToken,
    googleUserInfo,
    setSyncError,
    connect,
    disconnect,
    generateAndStoreSyncKey,
    resetSyncKey,
  };
}
