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
import AboutCard from '@/components/settings/AboutCard';
import { generateSyncKey, encodeSyncKey } from '@/sync/syncKeyUtils';
import { usePeerCount } from '@/hooks/usePeerCount';

type SheetId = 'sync-key' | 'google-drive' | 'theme' | null;

const THEME_LABEL: Record<string, string> = {
  light: 'Terang',
  dark: 'Gelap',
  system: 'Sistem',
};

export default function SettingsPage() {
  const { syncStatus, syncKey, connect } = useSync();
  const { theme } = useTheme();
  const { googleAuthToken, googleUserInfo, lastBackupTimestamp } = useSync();
  const navigate = useNavigate();
  const peerCount = usePeerCount();
  const [openSheet, setOpenSheet] = useState<SheetId>(null);
  const [connecting, setConnecting] = useState(false);

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
  // We read syncKey via getState() to avoid re-running when the key changes
  // (e.g. after scanning a QR code), which would cause unnecessary re-renders.
  useEffect(() => {
    if (useSyncStore.getState().syncKey) return;
    const generate = async () => {
      const payload = await generateSyncKey();
      const encoded = encodeSyncKey(payload);
      useSyncStore.getState().setSyncKey(encoded);
    };
    generate();
  }, []);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      connect();
    } finally {
      setTimeout(() => setConnecting(false), 1500);
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
    <div className="px-4 py-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
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

      <OfflineBanner />

      {/* Sync section */}
      <div className="space-y-1">
        <p className="px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Sinkronisasi
        </p>
        <div className="overflow-hidden rounded-xl border border-border bg-card divide-y divide-border">

          {/* Sync status row */}
          <div data-tour="settings-sync-status" className="flex items-center gap-3 px-4 py-3.5">
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
                onClick={handleConnect}
                disabled={connecting}
              >
                {connecting
                  ? <Loader2 className="h-3 w-3 animate-spin" />
                  : 'Hubungkan'
                }
              </Button>
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
      <div className="space-y-1 mb-24">
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

      {/* About */}
      <AboutCard />

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
    </div>
  );
}
