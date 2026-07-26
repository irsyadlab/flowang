/**
 * RouteErrorBoundary - `errorElement` untuk root route.
 *
 * React Router menangkap error yang terjadi saat merender route DAN saat
 * meresolusi `lazy()`. Yang kedua itu justru mode gagal utama setelah route
 * di-code-split: chunk basi sesudah deploy, atau fetch gagal saat offline.
 */

import { useEffect } from 'react';
import { useRouteError } from 'react-router-dom';
import ErrorFallback from './ErrorFallback';
import { attemptChunkReload, getErrorMessage } from '@/lib/chunkErrors';

export default function RouteErrorBoundary() {
  const error = useRouteError();

  useEffect(() => {
    console.error('[Flowang] Route error:', getErrorMessage(error), error);
    attemptChunkReload(error);
  }, [error]);

  return <ErrorFallback error={error} />;
}
