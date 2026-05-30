/**
 * OfflineBanner - shown in Settings when the device is offline or sync is disconnected.
 */

import { WifiOff } from 'lucide-react';
import { useSyncStore } from '@/sync/syncStore';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export default function OfflineBanner() {
  const syncStatus = useSyncStore((s) => s.syncStatus);
  const syncKey = useSyncStore((s) => s.syncKey);
  const isOnline = useOnlineStatus();

  if (!isOnline) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2.5 text-sm text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-200">
        <WifiOff className="h-4 w-4 shrink-0" />
        <span>Tidak ada koneksi internet — data tetap tersimpan lokal</span>
      </div>
    );
  }

  if (syncKey && syncStatus === 'disconnected') {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-200">
        Data tersimpan lokal dan akan disinkronkan otomatis saat koneksi pulih
      </div>
    );
  }

  return null;
}
