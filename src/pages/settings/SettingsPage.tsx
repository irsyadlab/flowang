/**
 * SettingsPage - menu-style settings with responsive sheets for each section.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  KeyRound,
  CloudUpload,
  Palette,
  Wifi,
  WifiOff,
  Loader2,
  ChevronRight,
  Monitor,
  ArrowLeft,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useSync } from '@/hooks/useSync';
import { useTheme } from '@/hooks/useTheme';
import { useSyncStore } from '@/sync/syncStore';
import { validateEnvConfig, EnvConfigError } from '@/lib/envConfig';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ResponsiveSheet from '@/components/shared/ResponsiveSheet';
import SyncKeyCard from '@/components/settings/SyncKeyCard';
import GoogleDriveCard from '@/components/settings/GoogleDriveCard';
import ThemeCard from '@/components/settings/ThemeCard';
import OfflineBanner from '@/components/settings/OfflineBanner';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { generateSyncKey, encodeSyncKey } from '@/sync/syncKeyUtils';
import { SYNCED_STORES, syncedStoreNames } from '@/sync/syncedStores';
import { usePeerCount } from '@/hooks/usePeerCount';
import { usePeerDevices } from '@/hooks/usePeerDevices';
import PeerDevicesDialog from '@/components/settings/PeerDevicesDialog';
import { getDB } from '@/db/db';
import { disconnect } from '@/sync/webrtcProvider';
import { seedDefaultCategories } from '@/db/categoryDb';
import { useWalletStore } from '@/stores/walletStore';
import { useTransactionStore } from '@/stores/transactionStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { useLoanEntryStore } from '@/stores/loanEntryStore';
import { useLoanContactStore } from '@/stores/loanContactStore';
import { useLoanRepaymentStore } from '@/stores/loanRepaymentStore';
import { useStickyHeader } from '@/hooks/useStickyHeader';

type SheetId = 'sync-key' | 'google-drive' | 'theme' | null;

const THEME_LABEL: Record<string, string> = {
  light: 'Terang',
  dark: 'Gelap',
  system: 'Sistem',
};

export default function SettingsPage() {
  const stickyHeader = useStickyHeader();
  const { syncStatus, syncKey, connect } = useSync();
  const { theme } = useTheme();
  const { googleAuthToken, googleUserInfo, lastBackupTimestamp } = useSync();
  const navigate = useNavigate();
  const peerCount = usePeerCount();
  const peerDevices = usePeerDevices();
  const [openSheet, setOpenSheet] = useState<SheetId>(null);
  const [connecting, setConnecting] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [peerDevicesDialogOpen, setPeerDevicesDialogOpen] = useState(false);

  // Validate env config on mount
  let envError: string[] | null = null;
  try {
    validateEnvConfig();
  } catch (e) {
    if (e instanceof EnvConfigError) {
      envError = e.missingVars;
    }
  }

  // Generate sync key if none exists — run once on mount only.
  // Wait for storageLoaded to avoid generating a new key before IndexedDB data
  // is loaded (e.g. after an OAuth redirect page reload).
  const storageLoaded = useSyncStore((s) => s.storageLoaded);
  useEffect(() => {
    if (!storageLoaded) return;
    if (useSyncStore.getState().syncKey) return;
    const generate = async () => {
      const payload = await generateSyncKey();
      const encoded = encodeSyncKey(payload);
      useSyncStore.getState().setSyncKey(encoded);
    };
    generate();
  }, [storageLoaded]);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      connect();
    } finally {
      setTimeout(() => setConnecting(false), 1500);
    }
  };

  const handleClearAllData = async () => {
    setClearing(true);
    try {
      const db = getDB();
      if (!db) throw new Error('Database not initialized');

      // Clear semua object stores di flowang-db
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(syncedStoreNames(), 'readwrite');
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        SYNCED_STORES.forEach((store) => tx.objectStore(store).clear());
      });

      // Clear yjs-sync IndexedDB (Yjs CRDT state) supaya data lama
      // tidak ter-broadcast ke perangkat lain saat sync aktif kembali
      await new Promise<void>((resolve) => {
        const req = indexedDB.deleteDatabase('yjs-sync');
        req.onsuccess = () => resolve();
        req.onerror = () => resolve(); // lanjut meski gagal
        req.onblocked = () => resolve();
      });

      // Disconnect WebRTC provider supaya Yjs in-memory state juga bersih
      disconnect();

      // Reset semua in-memory state di Zustand stores
      useTransactionStore.setState({ transactions: [] });
      useWalletStore.setState({ wallets: [] });
      useCategoryStore.setState({ categories: [] });
      useLoanEntryStore.setState({ entries: [] });
      useLoanContactStore.setState({ contacts: [] });
      useLoanRepaymentStore.setState({ repayments: [] });

      // Re-seed kategori default
      await seedDefaultCategories(db);
      await useCategoryStore.getState().loadCategories();

      sessionStorage.clear();
      setClearDialogOpen(false);
      toast.success('Semua data berhasil dihapus');
      navigate('/');
    } catch {
      toast.error('Gagal menghapus data');
    } finally {
      setClearing(false);
    }
  };

  if (envError) {
    return (
      <div className="flex min-h-[calc(100vh-80px)] items-center justify-center p-6">
        <Card className="w-full border-destructive/30 bg-destructive/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-destructive">
              Konfigurasi Tidak Lengkap
            </CardTitle>
            <CardDescription>
              Environment variable berikut belum dikonfigurasi:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {envError.map((v) => (
                <li key={v} className="font-mono text-xs text-destructive">
                  {v}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Sync status badge
  const syncBadge = (() => {
    if (syncStatus === 'connected') {
      if (peerCount > 0) {
        return (
          <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            <Monitor className="h-3 w-3" />
            {peerCount} perangkat terhubung
          </span>
        );
      }
      return (
        <span className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />
          Menunggu perangkat lain...
        </span>
      );
    }
    if (syncStatus === 'connecting') {
      return (
        <span className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-yellow-500" />
          Menghubungkan...
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
        Tidak Terhubung
      </span>
    );
  })();

  // Google Drive status text
  const driveSubtitle = googleAuthToken
    ? googleUserInfo?.email ?? 'Terhubung'
    : 'Belum login';

  const backupSubtitle = lastBackupTimestamp
    ? `Terakhir: ${new Date(lastBackupTimestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`
    : driveSubtitle;

  return (
    <div>
      <div className={`${stickyHeader} px-4 flex items-center gap-2 py-6`}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          aria-label="Kembali"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-lg font-semibold">Pengaturan</h1>
      </div>
      <div className="px-4 pb-6 space-y-6">

      <OfflineBanner />

      {/* Sync section */}
      <div className="space-y-1">
        <p className="px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Sinkronisasi
        </p>
        <div className="overflow-hidden rounded-xl border border-border bg-card divide-y divide-border">

          {/* Sync status row */}
          <div
            data-tour="settings-sync-status"
            className={`flex items-center gap-3 px-4 py-3.5 ${peerCount > 0 ? 'cursor-pointer hover:bg-muted/50 active:bg-muted transition-colors' : ''}`}
            onClick={() => peerCount > 0 && setPeerDevicesDialogOpen(true)}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              {syncStatus === 'disconnected'
                ? <WifiOff className="h-4 w-4 text-primary" />
                : <Wifi className="h-4 w-4 text-primary" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Status Sinkronisasi</p>
              {syncBadge}
            </div>
            {syncStatus === 'disconnected' && syncKey && (
              <Button
                size="sm"
                variant="outline"
                className="shrink-0 h-7 text-xs"
                onClick={(e) => { e.stopPropagation(); handleConnect(); }}
                disabled={connecting}
              >
                {connecting
                  ? <Loader2 className="h-3 w-3 animate-spin" />
                  : 'Hubungkan'
                }
              </Button>
            )}
            {peerCount > 0 && (
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
          </div>

          {/* Sync Key row */}
          <button
            onClick={() => setOpenSheet('sync-key')}
            data-tour="settings-sync-key"
            className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/50 active:bg-muted"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <KeyRound className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Sync Key</p>
              <p className="text-xs text-muted-foreground truncate">
                {syncKey ? 'QR Code & manajemen key' : 'Belum dibuat'}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </button>

          {/* Google Drive row */}
          <button
            onClick={() => setOpenSheet('google-drive')}
            data-tour="settings-google-drive"
            className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/50 active:bg-muted"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <CloudUpload className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Google Drive Backup</p>
              <p className="text-xs text-muted-foreground truncate">{backupSubtitle}</p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </button>

        </div>
      </div>

      {/* Appearance section */}
      <div className="space-y-1">
        <p className="px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Tampilan
        </p>
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <button
            onClick={() => setOpenSheet('theme')}
            data-tour="settings-theme"
            className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/50 active:bg-muted"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Palette className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Tema</p>
              <p className="text-xs text-muted-foreground">{THEME_LABEL[theme] ?? 'Sistem'}</p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Danger zone */}
      <div className="space-y-1">
        <p className="px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Zona Bahaya
        </p>
        <div className="overflow-hidden rounded-xl border border-destructive/30 bg-card">
          <button
            type="button"
            onClick={() => setClearDialogOpen(true)}
            className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-destructive/5 active:bg-destructive/10"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
              <Trash2 className="h-4 w-4 text-destructive" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-destructive">Hapus Semua Data</p>
              <p className="text-xs text-muted-foreground">Transaksi, wallet, kategori, dan pinjaman</p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* ── Responsive Sheets ── */}

      <ResponsiveSheet
        open={openSheet === 'sync-key'}
        onOpenChange={(o) => !o && setOpenSheet(null)}
        title="Sync Key"
        description="Scan QR Code atau salin key untuk menghubungkan perangkat lain"
      >
        <SyncKeyCard
          onConnected={() => {
            setOpenSheet(null);
            toast.success('Berhasil terhubung', {
              description: 'Perangkat ini sekarang tersinkronisasi.',
            });
          }}
        />
      </ResponsiveSheet>

      <ResponsiveSheet
        open={openSheet === 'google-drive'}
        onOpenChange={(o) => !o && setOpenSheet(null)}
        title="Google Drive Backup"
        description="Backup dan restore data secara terenkripsi ke Google Drive"
      >
        <GoogleDriveCard />
      </ResponsiveSheet>

      <ResponsiveSheet
        open={openSheet === 'theme'}
        onOpenChange={(o) => !o && setOpenSheet(null)}
        title="Tema"
        description="Pilih tampilan aplikasi sesuai preferensi"
      >
        <ThemeCard />
      </ResponsiveSheet>

      <ConfirmDialog
        open={clearDialogOpen}
        onOpenChange={setClearDialogOpen}
        title="Hapus Semua Data?"
        description="Tindakan ini akan menghapus seluruh transaksi, wallet, kategori, dan data pinjaman secara permanen. Data tidak dapat dipulihkan."
        confirmLabel={clearing ? 'Menghapus...' : 'Hapus Semua'}
        confirmDisabled={clearing}
        onConfirm={handleClearAllData}
        destructive
      />

      <PeerDevicesDialog
        open={peerDevicesDialogOpen}
        onOpenChange={setPeerDevicesDialogOpen}
        peers={peerDevices}
      />
    </div>
    </div>
  );
}
