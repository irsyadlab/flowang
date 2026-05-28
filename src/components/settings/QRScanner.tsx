/**
 * QRScanner - camera-based QR code scanner with manual input fallback.
 *
 * After a successful scan the user is shown a confirmation dialog warning
 * that ALL local data will be wiped before joining the scanned device's sync
 * room.  This prevents category/wallet ID mismatches between devices.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { validateSyncKey, decodeSyncKey } from '@/sync/syncKeyUtils';
import { useSyncStore } from '@/sync/syncStore';
import { importKeyFromBase64 } from '@/sync/cryptoService';
import { clearAllLocalData, connectToSyncRoom } from '@/sync/syncManager';
import { seedDefaultCategories } from '@/db/categoryDb';
import { getDB } from '@/db/db';
import ConfirmDialog from '@/components/shared/ConfirmDialog';

interface QRScannerProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export default function QRScanner({ onClose, onSuccess }: QRScannerProps) {
  const [manualKey, setManualKey] = useState('');
  const [error, setError] = useState('');
  const [cameraError, setCameraError] = useState(false);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const scannerRef = useRef<{ stop: () => Promise<void>; clear: () => void } | null>(null);
  const handledRef = useRef(false);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {
        // ignore stop errors
      }
      scannerRef.current = null;
    }
  }, []);

  // Called when QR is scanned or manual key is submitted — shows confirm dialog
  const handleKeyScanned = useCallback(async (key: string) => {
    // Prevent duplicate calls (html5-qrcode fires callback multiple times)
    if (handledRef.current) return;
    handledRef.current = true;

    await stopScanner();
    setPendingKey(key);
  }, [stopScanner]);

  // Called after user confirms the wipe-and-connect dialog
  const handleConfirmConnect = async () => {
    if (!pendingKey) return;
    setConnecting(true);
    try {
      // 1. Wipe all local data (wallets, transactions, categories, Yjs state)
      await clearAllLocalData();

      // 2. Re-seed default categories so the app isn't completely empty
      const db = getDB();
      if (db) await seedDefaultCategories(db);

      // 3. Save the new sync key and connect
      useSyncStore.getState().setSyncKey(pendingKey);
      await importKeyFromBase64(decodeSyncKey(pendingKey).encryptionKey);
      await connectToSyncRoom();

      onClose();
      onSuccess?.();
    } catch {
      setError('Gagal menghubungkan. Coba lagi.');
      setConnecting(false);
      // Allow retry
      handledRef.current = false;
      setPendingKey(null);
    }
  };

  const handleCancelConnect = () => {
    setPendingKey(null);
    handledRef.current = false;
    // Restart scanner
    setError('');
  };

  useEffect(() => {
    let mounted = true;

    const startCamera = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (!mounted) return;

        const scanner = new Html5Qrcode('qr-reader');
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          async (decodedText: string) => {
            if (!validateSyncKey(decodedText)) {
              setError('QR Code tidak valid');
              return;
            }
            await handleKeyScanned(decodedText);
          },
          () => {} // ignore errors during scanning
        );
      } catch {
        if (mounted) {
          setCameraError(true);
        }
      }
    };

    startCamera();

    return () => {
      mounted = false;
      stopScanner();
    };
  }, [handleKeyScanned, stopScanner]);

  const handleManualSubmit = async () => {
    if (!validateSyncKey(manualKey)) {
      setError('Format Sync Key tidak valid');
      return;
    }
    await handleKeyScanned(manualKey);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex flex-col bg-black">
        <div className="flex items-center justify-between p-4">
          <h3 className="text-lg font-semibold text-white">Scan QR Code</h3>
          <button onClick={onClose} className="text-sm text-white/80">
            Batal
          </button>
        </div>

        {cameraError ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
            <p className="text-center text-sm text-white/80">
              Izin kamera diperlukan untuk memindai QR Code
            </p>
            <div className="w-full max-w-sm space-y-3">
              <textarea
                value={manualKey}
                onChange={(e) => {
                  setManualKey(e.target.value);
                  setError('');
                }}
                placeholder="Masukkan Sync Key secara manual"
                className="w-full rounded-lg border border-white/20 bg-white/10 p-3 text-sm text-white placeholder:text-white/40"
                rows={3}
              />
              {error && <p className="text-xs text-red-400">{error}</p>}
              <button
                onClick={handleManualSubmit}
                className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
              >
                Hubungkan
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-1 items-center justify-center">
              <div id="qr-reader" className="w-full max-w-sm" />
            </div>

            <div className="space-y-3 p-6">
              {error && (
                <p className="text-center text-xs text-red-400">{error}</p>
              )}
              <textarea
                value={manualKey}
                onChange={(e) => {
                  setManualKey(e.target.value);
                  setError('');
                }}
                placeholder="Atau masukkan Sync Key secara manual"
                className="w-full rounded-lg border border-white/20 bg-white/10 p-3 text-sm text-white placeholder:text-white/40"
                rows={2}
              />
              <button
                onClick={handleManualSubmit}
                className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
              >
                Hubungkan
              </button>
            </div>
          </>
        )}
      </div>

      {/* Confirmation dialog — shown after scan, before wiping data */}
      <ConfirmDialog
        open={pendingKey !== null && !connecting}
        onOpenChange={(open) => { if (!open) handleCancelConnect(); }}
        title="Hapus Data Lokal?"
        description="Semua data di perangkat ini (dompet, transaksi, kategori) akan dihapus dan diganti dengan data dari perangkat yang di-scan. Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Hapus & Hubungkan"
        onConfirm={handleConfirmConnect}
        destructive
      />
    </>
  );
}
