/**
 * Satu sumber kebenaran untuk object store `flowang-db` yang ikut dalam
 * sync P2P, backup Google Drive, dan wipe data lokal.
 *
 * PENTING: menambah object store baru di `db/db.ts` TIDAK otomatis membuatnya
 * ter-sync. Store tersebut harus didaftarkan di sini, kalau tidak datanya akan
 * diam-diam tertinggal saat sync antar-device maupun saat restore backup —
 * persis yang terjadi pada `loan_repayments` sejak schema v3.
 *
 * `tests/sync/syncedStores.test.ts` memaksa daftar ini tetap identik dengan
 * skema database, jadi store baru akan menggagalkan test sampai didaftarkan.
 */

export const SYNCED_STORES = [
  'wallets',
  'transactions',
  'categories',
  'loan_contacts',
  'loan_entries',
  'loan_repayments',
] as const;

export type SyncedStoreName = (typeof SYNCED_STORES)[number];

/** Salinan mutable untuk API yang butuh `string[]` (mis. `db.transaction`). */
export function syncedStoreNames(): SyncedStoreName[] {
  return [...SYNCED_STORES];
}

export function isSyncedStore(name: string): name is SyncedStoreName {
  return (SYNCED_STORES as readonly string[]).includes(name);
}
