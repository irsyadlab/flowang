/**
 * OfflineBanner - non-blocking banner when sync is disconnected but key exists.
 */

import { useSyncStore } from '@/sync/syncStore';

export default function OfflineBanner() {
  const syncStatus = useSyncStore((s) => s.syncStatus);
  const syncKey = useSyncStore((s) => s.syncKey);

  if (!syncKey || syncStatus !== 'disconnected') return null;

  return (
    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-200">
      Data tersimpan lokal dan akan disinkronkan otomatis saat koneksi pulih
    </div>
  );
}
