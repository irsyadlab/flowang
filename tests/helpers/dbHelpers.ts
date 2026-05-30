/**
 * DB test helpers — isolasi IndexedDB antar test file.
 *
 * fake-indexeddb mempertahankan data in-memory selama proses berjalan,
 * sehingga data dari satu test file bisa bocor ke file lain.
 * Gunakan `resetDB()` di beforeEach untuk memastikan DB selalu bersih.
 */

import { openDB, closeDB } from '../../src/db/db';

const DB_NAME = 'flowang-db';

/**
 * Hapus seluruh database lalu buka ulang dengan schema fresh.
 * Panggil di beforeEach pada test yang sensitif terhadap jumlah data.
 */
export async function resetDB(): Promise<void> {
  closeDB();
  await new Promise<void>((resolve) => {
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = () => resolve();
    req.onerror = () => resolve();
    req.onblocked = () => resolve();
  });
  await openDB();
}
