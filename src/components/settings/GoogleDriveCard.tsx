/**
 * GoogleDriveCard - Google Drive backup/restore UI.
 */

import { useState, useEffect, useRef } from 'react';
import { useSync } from '@/hooks/useSync';
import * as googleDriveProvider from '@/sync/googleDriveProvider';

export default function GoogleDriveCard() {
  const {
    googleAuthToken,
    googleUserInfo,
    lastBackupTimestamp,
    syncError,
    setSyncError,
  } = useSync();
  const [showRestore, setShowRestore] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const prevSyncErrorRef = useRef(syncError);

  useEffect(() => {
    const prev = prevSyncErrorRef.current;
    prevSyncErrorRef.current = syncError;
    if (syncError === 'RESTORE_AVAILABLE' && prev !== 'RESTORE_AVAILABLE') {
      setShowRestore(true);
      setSyncError(null);
    }
  }, [syncError, setSyncError]);

  useEffect(() => {
    if (!googleAuthToken) return;
    let cancelled = false;
    const check = async () => {
      const should = await googleDriveProvider.checkRestore();
      if (!cancelled && should) {
        setShowRestore(true);
      }
    };
    check();
    return () => { cancelled = true; };
  }, [googleAuthToken]);

  if (!googleAuthToken) {
    return (
      <button
        onClick={() => googleDriveProvider.login()}
        className="w-full rounded-lg border border-border px-4 py-3 text-sm font-medium transition-colors hover:bg-muted"
      >
        Login dengan Google
      </button>
    );
  }

  const handleLogout = () => {
    googleDriveProvider.logout();
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      await googleDriveProvider.restore();
      setShowRestore(false);
    } catch (error) {
      setSyncError((error as Error).message);
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="space-y-3">
      {googleUserInfo && (
        <div className="rounded-lg border border-border p-3">
          <p className="text-sm font-medium">{googleUserInfo.name}</p>
          <p className="text-xs text-muted-foreground">{googleUserInfo.email}</p>
        </div>
      )}

      {lastBackupTimestamp && (
        <p className="text-xs text-muted-foreground">
          Backup terakhir: {new Date(lastBackupTimestamp).toLocaleString('id-ID')}
        </p>
      )}

      {syncError && syncError !== 'RESTORE_AVAILABLE' && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
          {syncError}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => googleDriveProvider.scheduleBackup()}
          className="flex-1 rounded-lg border border-border px-3 py-2 text-xs font-medium transition-colors hover:bg-muted"
        >
          Backup Sekarang
        </button>
        <button
          onClick={handleLogout}
          className="flex-1 rounded-lg border border-destructive/30 px-3 py-2 text-xs font-medium text-destructive transition-colors hover:bg-destructive/5"
        >
          Logout Google
        </button>
      </div>

      {showRestore && (
        <div className="rounded-lg border border-border p-4 space-y-3">
          <p className="text-sm font-medium">Backup ditemukan di Google Drive</p>
          <p className="text-xs text-muted-foreground">
            Data lokal kosong. Apakah Anda ingin merestore dari backup?
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleRestore}
              disabled={restoring}
              className="flex-1 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground disabled:opacity-50"
            >
              {restoring ? 'Merestore...' : 'Restore'}
            </button>
            <button
              onClick={() => setShowRestore(false)}
              className="flex-1 rounded-lg border border-border px-3 py-2 text-xs font-medium transition-colors hover:bg-muted"
            >
              Batal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
