/**
 * ErrorBoundary - jaring pengaman terakhir untuk error render di luar router.
 *
 * Kenapa ini penting di Flowang: app berjalan sebagai PWA `display: standalone`,
 * jadi user tidak punya address bar maupun tombol reload. Tanpa boundary, satu
 * error render berarti layar putih tanpa jalan keluar sama sekali.
 *
 * Error yang terjadi DI DALAM route ditangani `RouteErrorBoundary` lewat
 * `errorElement` — boundary ini menangkap sisanya (provider, shell, dan error
 * apa pun yang lolos dari router).
 */

import { Component, type ErrorInfo, type ReactNode } from 'react';
import ErrorFallback from './ErrorFallback';
import { attemptChunkReload } from '@/lib/chunkErrors';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Tidak ada backend untuk mengirim laporan error — console adalah satu-satunya
    // tempat, dan itu memang cukup untuk app yang sepenuhnya lokal.
    console.error('[Flowang] Uncaught render error:', error, info.componentStack);
    attemptChunkReload(error);
  }

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;
    return <ErrorFallback error={error} />;
  }
}
