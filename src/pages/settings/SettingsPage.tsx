/**
 * SettingsPage - assembles all settings components for multi-device sync.
 */

import { useEffect } from 'react';
import { useSync } from '@/hooks/useSync';
import { useSyncStore } from '@/sync/syncStore';
import { validateEnvConfig, EnvConfigError } from '@/lib/envConfig';
import SyncStatusIndicator from '@/components/settings/SyncStatusIndicator';
import OfflineBanner from '@/components/settings/OfflineBanner';
import SyncKeyCard from '@/components/settings/SyncKeyCard';
import GoogleDriveCard from '@/components/settings/GoogleDriveCard';
import { generateSyncKey, encodeSyncKey } from '@/sync/syncKeyUtils';

export default function SettingsPage() {
  const { syncStatus, syncKey, connect } = useSync();

  // Validate env config on mount
  let envError: string[] | null = null;
  try {
    validateEnvConfig();
  } catch (e) {
    if (e instanceof EnvConfigError) {
      envError = e.missingVars;
    }
  }

  // Generate sync key if none exists
  useEffect(() => {
    if (syncKey) return;

    const generate = async () => {
      const payload = await generateSyncKey();
      const encoded = encodeSyncKey(payload);
      useSyncStore.getState().setSyncKey(encoded);
    };
    generate();
  }, [syncKey]);

  if (envError) {
    return (
      <div className="flex min-h-[calc(100vh-80px)] items-center justify-center p-6">
        <div className="w-full space-y-4 rounded-xl border border-destructive/30 bg-destructive/5 p-6">
          <h2 className="text-lg font-semibold text-destructive">
            Konfigurasi Tidak Lengkap
          </h2>
          <p className="text-sm text-muted-foreground">
            Environment variable berikut belum dikonfigurasi:
          </p>
          <ul className="space-y-1">
            {envError.map((v) => (
              <li key={v} className="font-mono text-xs text-destructive">
                {v}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 py-6">
      <OfflineBanner />

      <div className="space-y-2">
        <h1 className="text-lg font-semibold">Sinkronisasi Perangkat</h1>
        <SyncStatusIndicator />
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Sync Key</h2>
        <SyncKeyCard />
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          Google Drive Backup
        </h2>
        <GoogleDriveCard />
      </div>

      {syncStatus === 'disconnected' && syncKey && (
        <button
          onClick={connect}
          className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Hubungkan
        </button>
      )}
    </div>
  );
}
