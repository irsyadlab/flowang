/**
 * Deteksi dan pemulihan untuk kegagalan memuat chunk.
 *
 * Route di-code-split dan nama file chunk mengandung hash isi. Setelah deploy
 * baru, tab yang sudah terbuka masih memegang index.html lama yang menunjuk
 * hash lama — hash itu sudah tidak ada di server, jadi navigasi ke route yang
 * belum ter-load akan gagal.
 *
 * Perbaikannya adalah reload (mengambil index.html baru), bukan retry: URL chunk
 * yang dituju memang sudah tidak eksis, berapa kali pun dicoba.
 */

/**
 * Penanda satu kali reload otomatis, disimpan di sessionStorage supaya chunk
 * error yang persisten (mis. benar-benar offline) tidak berujung reload loop.
 */
const RELOAD_GUARD_KEY = 'flowang:chunk-reload-attempted';

/**
 * Pesan error gagal-muat-modul berbeda-beda per browser, jadi dicocokkan dengan
 * beberapa pola sekaligus (Chrome/Edge, Firefox, Safari).
 */
const CHUNK_ERROR_PATTERNS = [
  'dynamically imported module',
  'importing a module script failed',
  'loading chunk',
  'error loading dynamically imported module',
];

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Unknown error';
}

export function isChunkLoadError(error: unknown): boolean {
  const haystack = getErrorMessage(error).toLowerCase();
  return CHUNK_ERROR_PATTERNS.some((pattern) => haystack.includes(pattern));
}

/**
 * Coba reload otomatis satu kali untuk error chunk basi.
 *
 * @returns true jika reload dipicu
 */
export function attemptChunkReload(error: unknown): boolean {
  if (!isChunkLoadError(error)) return false;
  if (sessionStorage.getItem(RELOAD_GUARD_KEY)) return false;

  sessionStorage.setItem(RELOAD_GUARD_KEY, '1');
  window.location.reload();
  return true;
}

export function reloadApp(): void {
  // Bersihkan guard supaya reload manual selalu benar-benar dicoba
  sessionStorage.removeItem(RELOAD_GUARD_KEY);
  window.location.reload();
}
