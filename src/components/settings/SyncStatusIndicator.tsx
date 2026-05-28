/**
 * SyncStatusIndicator - displays sync status with colored dot + label.
 */

import { useSyncStore } from '@/sync/syncStore';

export default function SyncStatusIndicator() {
  const syncStatus = useSyncStore((s) => s.syncStatus);

  const dotClass =
    syncStatus === 'connected'
      ? 'bg-green-500'
      : syncStatus === 'connecting'
        ? 'bg-yellow-500 animate-pulse'
        : 'bg-red-500';

  const label =
    syncStatus === 'connected'
      ? 'Terhubung (Real-time)'
      : syncStatus === 'connecting'
        ? 'Menghubungkan...'
        : 'Tidak Terhubung';

  return (
    <div className="flex items-center gap-2">
      <span className={`inline-block h-2 w-2 rounded-full ${dotClass}`} />
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
}
