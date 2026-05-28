/**
 * QRScanner - camera-based QR code scanner with manual input fallback.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { validateSyncKey, decodeSyncKey } from '@/sync/syncKeyUtils';
import { useSyncStore } from '@/sync/syncStore';
import { importKeyFromBase64 } from '@/sync/cryptoService';
import * as webrtcProvider from '@/sync/webrtcProvider';

interface QRScannerProps {
  onClose: () => void;
}

export default function QRScanner({ onClose }: QRScannerProps) {
  const [manualKey, setManualKey] = useState('');
  const [error, setError] = useState('');
  const [cameraError, setCameraError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scannerRef = useRef<{ stop: () => Promise<void>; clear: () => void } | null>(null);

  const handleConnectWithKey = useCallback(async (key: string) => {
    useSyncStore.getState().setSyncKey(key);
    const payload = decodeSyncKey(key);
    await importKeyFromBase64(payload.encryptionKey);
    webrtcProvider.connect(payload.roomName, payload.encryptionKey);
    onClose();
  }, [onClose]);

  useEffect(() => {
    let mounted = true;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

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
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current.clear();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [handleConnectWithKey]);

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
            <video
              ref={videoRef}
              className="hidden"
              playsInline
              muted
            />
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
