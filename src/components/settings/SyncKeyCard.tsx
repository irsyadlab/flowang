/**
 * SyncKeyCard - QR Code display, key text with toggle, copy, reset, and scan.
 */

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useSync } from '@/hooks/useSync';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import QRScanner from './QRScanner';

export default function SyncKeyCard({ onConnected }: { onConnected?: () => void }) {
  const { syncKey, resetSyncKey } = useSync();
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  if (!syncKey) return null;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(syncKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = async () => {
    await resetSyncKey();
    setShowResetConfirm(false);
    setShowKey(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <div className="rounded-xl border border-border bg-white p-4">
          <QRCodeSVG value={syncKey} size={160} level="M" bgColor="#ffffff" fgColor="#000000" />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
          <code className="flex-1 truncate font-mono text-xs">
            {showKey ? syncKey : '•'.repeat(Math.min(syncKey.length, 50))}
          </code>
          <button
            onClick={() => setShowKey(!showKey)}
            className="shrink-0 text-xs font-medium text-primary hover:underline"
          >
            {showKey ? 'Sembunyikan' : 'Tampilkan'}
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="flex-1 rounded-lg border border-border px-3 py-2 text-xs font-medium transition-colors hover:bg-muted"
          >
            {copied ? 'Tersalin!' : 'Salin'}
          </button>
          <button
            onClick={() => setShowScanner(true)}
            className="flex-1 rounded-lg border border-border px-3 py-2 text-xs font-medium transition-colors hover:bg-muted"
          >
            Scan QR Code
          </button>
        </div>

        <button
          onClick={() => setShowResetConfirm(true)}
          className="w-full rounded-lg border border-destructive/30 px-3 py-2 text-xs font-medium text-destructive transition-colors hover:bg-destructive/5"
        >
          Reset Sync Key
        </button>
      </div>

      <ConfirmDialog
        open={showResetConfirm}
        onOpenChange={setShowResetConfirm}
        title="Reset Sync Key?"
        description="Sync Key baru akan di-generate. Perangkat lain perlu di-pair ulang menggunakan Sync Key baru. Backup lama tidak valid dengan key baru."
        onConfirm={handleReset}
      />

      {showScanner && (
        <QRScanner onClose={() => setShowScanner(false)} onSuccess={onConnected} />
      )}
    </div>
  );
}
