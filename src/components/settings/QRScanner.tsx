/**
 * QRScanner - camera-based QR code scanner with manual input fallback.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { validateSyncKey, decodeSyncKey } from '@/sync/syncKeyUtils';
import { useSyncStore } from '@/sync/syncStore';
import { importKeyFromBase64 } from '@/sync/cryptoService';
import { connectToSyncRoom } from '@/sync/syncManager';

interface QRScannerProps {
  onClose: () => void;
}

export default function QRScanner({ onClose }: QRScannerProps) {
  const [manualKey, setManualKey] = useState('');
  const [error, setError] = useState('');
  const [cameraError, setCameraError] = useState(false);
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

  const handleConnectWithKey = useCallback(async (key: string) => {
    // Prevent duplicate calls (html5-qrcode fires callback multiple times)
    if (handledRef.current) return;
    handledRef.current = true;

    await stopScanner();

    // Save key then connect via syncManager so observers are attached
    useSyncStore.getState().setSyncKey(key);
    await importKeyFromBase64(decodeSyncKey(key).encryptionKey);
    await connectToSyncRoom();
    onClose();
  }, [onClose, stopScanner]);

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
            await handleConnectWithKey(decodedText);
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
      // Fire-and-forget but must call stop() so html5-qrcode releases the camera
      stopScanner();
    };
  }, [handleConnectWithKey, stopScanner]);

  const handleManualSubmit = async () => {
    if (!validateSyncKey(manualKey)) {
      setError('Format Sync Key tidak valid');
      return;
    }
    await handleConnectWithKey(manualKey);
  };

  return (
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
  );
}
