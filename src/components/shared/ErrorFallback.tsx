/**
 * Tampilan bersama untuk kedua error boundary aplikasi:
 *
 *   - `ErrorBoundary`      → error render di luar router (provider, shell)
 *   - `RouteErrorBoundary` → error di dalam route, termasuk gagal memuat chunk
 *
 * Keduanya memakai fallback yang sama supaya user melihat satu perilaku, bukan
 * dua layar error berbeda tergantung di mana error-nya terjadi.
 *
 * Logika deteksi & pemulihan chunk ada di `@/lib/chunkErrors`.
 */

import { AlertTriangle, RotateCw } from 'lucide-react';
import { getErrorMessage, isChunkLoadError, reloadApp } from '@/lib/chunkErrors';

interface ErrorFallbackProps {
  error: unknown;
}

export default function ErrorFallback({ error }: ErrorFallbackProps) {
  const isChunkError = isChunkLoadError(error);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10">
          <AlertTriangle className="h-5 w-5 text-destructive" />
        </div>
        <p className="text-base font-semibold text-foreground">
          {isChunkError ? 'Gagal memuat halaman' : 'Terjadi kesalahan'}
        </p>
        <p className="max-w-[280px] text-sm leading-relaxed text-muted-foreground">
          {isChunkError
            ? 'Sepertinya ada versi baru aplikasi. Muat ulang untuk melanjutkan.'
            : 'Data kamu tetap aman dan tersimpan di perangkat ini. Coba muat ulang aplikasi.'}
        </p>
      </div>

      <button
        type="button"
        onClick={reloadApp}
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        <RotateCw className="h-4 w-4" />
        Muat ulang
      </button>

      {/* Detail teknis disembunyikan di balik <details> — berguna saat user
          melaporkan bug, tapi tidak menakuti pemakaian sehari-hari. */}
      <details className="max-w-[320px] text-center">
        <summary className="cursor-pointer text-xs text-muted-foreground">Detail teknis</summary>
        <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words text-left text-[11px] leading-relaxed text-muted-foreground">
          {getErrorMessage(error)}
        </pre>
      </details>
    </div>
  );
}
