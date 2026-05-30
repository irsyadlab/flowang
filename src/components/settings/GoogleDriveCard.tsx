/**
 * GoogleDriveCard - Google Drive backup/restore UI.
 */

import { useState, useEffect, useRef } from 'react';
import {
  CloudUpload, LogOut, CheckCircle2, Loader2,
  Download, KeyRound, AlertCircle, Smartphone, MonitorSmartphone,
  ChevronRight, ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import { useSync } from '@/hooks/useSync';
import { Button } from '@/components/ui/button';
import ResponsiveSheet from '@/components/shared/ResponsiveSheet';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import * as googleDriveProvider from '@/sync/googleDriveProvider';
import { validateSyncKey } from '@/sync/syncKeyUtils';
import { cn } from '@/lib/utils';

type RestoreStep = 'choose' | 'import-key' | 'confirm-current';

interface RestoreSheetContentProps {
  restoreStep: RestoreStep;
  setRestoreStep: (step: RestoreStep) => void;
  importedKey: string;
  setImportedKey: (key: string) => void;
  importKeyError: string;
  setImportKeyError: (err: string) => void;
  restoring: boolean;
  onRestoreWithImportedKey: () => void;
  onConfirmCurrentKey: () => void;
  onBack: () => void;
}

function RestoreSheetContent({
  restoreStep,
  setRestoreStep,
  importedKey,
  setImportedKey,
  importKeyError,
  setImportKeyError,
  restoring,
  onRestoreWithImportedKey,
  onConfirmCurrentKey,
  onBack,
}: RestoreSheetContentProps) {

  if (restoreStep === 'choose') {
    return (
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Pilih cara restore sesuai situasi kamu:
        </p>

        <button
          onClick={onConfirmCurrentKey}
          disabled={restoring}
          className="flex w-full items-start gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-muted/50 active:bg-muted disabled:opacity-50"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Smartphone className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Device ini / Sync Key sama</p>
            <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
              Kamu masih punya Sync Key yang sama dengan saat backup dibuat.
            </p>
          </div>
          <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        </button>

        <button
          onClick={() => setRestoreStep('import-key')}
          disabled={restoring}
          className="flex w-full items-start gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-muted/50 active:bg-muted disabled:opacity-50"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <MonitorSmartphone className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Device baru / Sync Key berbeda</p>
            <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
              Pindah ke device baru atau Sync Key sudah berubah. Kamu perlu memasukkan Sync Key dari device asal.
            </p>
          </div>
          <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </div>
    );
  }

  if (restoreStep === 'import-key') {
    return (
      <div className="space-y-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Kembali
        </button>

        <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-1.5">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium">Masukkan Sync Key dari device asal</p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Buka aplikasi di device lama → Pengaturan → Sync Key → Salin. Lalu tempel di bawah ini.
          </p>
        </div>

        <div className="space-y-1.5">
          <textarea
            value={importedKey}
            onChange={(e) => {
              setImportedKey(e.target.value);
              setImportKeyError('');
            }}
            placeholder="Tempel Sync Key di sini..."
            rows={4}
            autoFocus
            className={cn(
              'w-full resize-none rounded-xl border bg-muted/30 px-3 py-2.5 font-mono text-xs outline-none transition-colors',
              'placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20',
              importKeyError ? 'border-destructive focus:border-destructive focus:ring-destructive/20' : 'border-border'
            )}
          />
          {importKeyError ? (
            <p className="flex items-center gap-1.5 text-xs text-destructive">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {importKeyError}
            </p>
          ) : importedKey && validateSyncKey(importedKey.trim()) ? (
            <p className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              Format Sync Key valid
            </p>
          ) : null}
        </div>

        <Button
          className="w-full"
          onClick={onRestoreWithImportedKey}
          disabled={restoring || !importedKey.trim()}
        >
          {restoring
            ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Merestore...</>
            : <><Download className="mr-2 h-4 w-4" />Restore Sekarang</>
          }
        </Button>
      </div>
    );
  }

  return null;
}

export default function GoogleDriveCard() {
  const { googleAuthToken, googleUserInfo, lastBackupTimestamp, syncError, setSyncError } = useSync();

  const [showAutoRestore, setShowAutoRestore] = useState(false);
  const [showRestoreSheet, setShowRestoreSheet] = useState(false);
  const [restoreStep, setRestoreStep] = useState<RestoreStep>('choose');
  const [importedKey, setImportedKey] = useState('');
  const [importKeyError, setImportKeyError] = useState('');
  const [showCurrentKeyConfirm, setShowCurrentKeyConfirm] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [backupSuccess, setBackupSuccess] = useState(false);
  const [backupExists, setBackupExists] = useState(false);
  const [checkingBackup, setCheckingBackup] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const prevSyncErrorRef = useRef(syncError);

  useEffect(() => {
    const prev = prevSyncErrorRef.current;
    prevSyncErrorRef.current = syncError;
    if (syncError === 'RESTORE_AVAILABLE' && prev !== 'RESTORE_AVAILABLE') {
      setShowAutoRestore(true);
      setSyncError(null);
    }
  }, [syncError, setSyncError]);

  useEffect(() => {
    if (!googleAuthToken) {
      return;
    }
    let cancelled = false;
    const check = async () => {
      setCheckingBackup(true);
      try {
        const [autoRestore, exists] = await Promise.all([
          googleDriveProvider.checkRestore(),
          googleDriveProvider.checkBackupExists(),
        ]);
        if (cancelled) return;
        if (autoRestore) setShowAutoRestore(true);
        setBackupExists(exists);
      } finally {
        if (!cancelled) setCheckingBackup(false);
      }
    };
    check();
    return () => { cancelled = true; };
  }, [googleAuthToken]);

  if (!googleAuthToken) {
    return (
      <Button
        variant="outline"
        className="w-full"
        disabled={loggingIn}
        onClick={async () => {
          setLoggingIn(true);
          try {
            await googleDriveProvider.login();
          } catch (error) {
            const msg = (error as Error).message;
            toast.error(`Login gagal: ${msg}`);
          } finally {
            setLoggingIn(false);
          }
        }}
      >
        {loggingIn
          ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menghubungkan...</>
          : 'Login dengan Google'
        }
      </Button>
    );
  }

  const openRestoreSheet = () => {
    setRestoreStep('choose');
    setImportedKey('');
    setImportKeyError('');
    setShowRestoreSheet(true);
  };

  const closeRestoreSheet = () => {
    if (restoring) return;
    setShowRestoreSheet(false);
  };

  const handleBackupNow = async () => {
    setBackingUp(true);
    setBackupSuccess(false);
    const toastId = toast.loading('Membackup data ke Google Drive...');
    try {
      await googleDriveProvider.backupNow();
      setBackupSuccess(true);
      setBackupExists(true);
      toast.success('Backup berhasil disimpan', { id: toastId });
      setTimeout(() => setBackupSuccess(false), 3000);
    } catch (error) {
      const msg = (error as Error).message;
      toast.error(`Backup gagal: ${msg}`, { id: toastId });
      setSyncError(msg);
    } finally {
      setBackingUp(false);
    }
  };

  const handleRestoreWithCurrentKey = async () => {
    setRestoring(true);
    setShowCurrentKeyConfirm(false);
    const toastId = toast.loading('Merestore data dari Google Drive...');
    try {
      await googleDriveProvider.restore();
      setShowAutoRestore(false);
      setShowRestoreSheet(false);
      toast.success('Restore berhasil — data telah dipulihkan', { id: toastId });
    } catch (error) {
      const msg = (error as Error).message;
      toast.error(`Restore gagal: ${msg}`, { id: toastId });
      setSyncError(msg);
    } finally {
      setRestoring(false);
    }
  };

  const handleRestoreWithImportedKey = async () => {
    const trimmed = importedKey.trim();
    if (!trimmed) {
      setImportKeyError('Sync Key tidak boleh kosong');
      return;
    }
    if (!validateSyncKey(trimmed)) {
      setImportKeyError('Format Sync Key tidak valid — pastikan menyalin key secara lengkap');
      return;
    }

    setRestoring(true);
    const toastId = toast.loading('Merestore data dari Google Drive...');
    try {
      await googleDriveProvider.restoreWithKey(trimmed);
      setShowAutoRestore(false);
      setShowRestoreSheet(false);
      setImportedKey('');
      toast.success('Restore berhasil — data telah dipulihkan', { id: toastId });
    } catch (error) {
      const msg = (error as Error).message;
      toast.error(`Restore gagal: ${msg}`, { id: toastId });
      setSyncError(msg);
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="space-y-3">
      {googleUserInfo && (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {googleUserInfo.name?.charAt(0).toUpperCase() ?? 'G'}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{googleUserInfo.name}</p>
            <p className="truncate text-xs text-muted-foreground">{googleUserInfo.email}</p>
          </div>
        </div>
      )}

      {lastBackupTimestamp ? (
        <p className="text-xs text-muted-foreground">
          Backup terakhir:{' '}
          <span className="font-medium text-foreground">
            {new Date(lastBackupTimestamp).toLocaleString('id-ID')}
          </span>
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">Belum ada backup tersimpan</p>
      )}

      {syncError && syncError !== 'RESTORE_AVAILABLE' && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
          {syncError}
        </div>
      )}

      <div className="flex gap-2">
        <Button
          variant="outline" size="sm" className="flex-1"
          onClick={handleBackupNow} disabled={backingUp || restoring}
        >
          {backingUp
            ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Membackup...</>
            : backupSuccess
              ? <><CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-green-500" />Berhasil</>
              : <><CloudUpload className="mr-1.5 h-3.5 w-3.5" />Backup Sekarang</>
          }
        </Button>
        <Button
          variant="outline" size="sm"
          className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/5 hover:text-destructive"
          onClick={() => googleDriveProvider.logout()} disabled={backingUp || restoring}
        >
          <LogOut className="mr-1.5 h-3.5 w-3.5" />Logout
        </Button>
      </div>

      {(backupExists || checkingBackup) && (
        <Button
          variant="outline" size="sm" className="w-full"
          onClick={openRestoreSheet}
          disabled={backingUp || restoring || checkingBackup}
        >
          {checkingBackup
            ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Memeriksa backup...</>
            : <><Download className="mr-1.5 h-3.5 w-3.5" />Restore dari Backup</>
          }
        </Button>
      )}

      {showAutoRestore && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Download className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Backup ditemukan di Google Drive</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Data lokal kosong. Pulihkan data dari backup?
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="flex-1" onClick={openRestoreSheet}>
              Restore
            </Button>
            <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowAutoRestore(false)}>
              Nanti
            </Button>
          </div>
        </div>
      )}

      <ResponsiveSheet
        open={showRestoreSheet}
        onOpenChange={closeRestoreSheet}
        title="Restore dari Backup"
        description={
          restoreStep === 'choose'
            ? 'Pilih metode restore yang sesuai'
            : 'Masukkan Sync Key dari device asal untuk mendekripsi backup'
        }
      >
        <RestoreSheetContent
          restoreStep={restoreStep}
          setRestoreStep={setRestoreStep}
          importedKey={importedKey}
          setImportedKey={setImportedKey}
          importKeyError={importKeyError}
          setImportKeyError={setImportKeyError}
          restoring={restoring}
          onRestoreWithImportedKey={handleRestoreWithImportedKey}
          onConfirmCurrentKey={() => setShowCurrentKeyConfirm(true)}
          onBack={() => { setRestoreStep('choose'); setImportKeyError(''); }}
        />
      </ResponsiveSheet>

      <ConfirmDialog
        open={showCurrentKeyConfirm}
        onOpenChange={(open) => { if (!restoring) setShowCurrentKeyConfirm(open); }}
        title="Restore dari Backup?"
        description="Semua data lokal saat ini akan diganti dengan data dari backup Google Drive. Tindakan ini tidak bisa dibatalkan."
        confirmLabel="Ya, Restore"
        onConfirm={handleRestoreWithCurrentKey}
        confirmDisabled={restoring}
      />
    </div>
  );
}
