import { describe, expect, test } from 'bun:test';
import 'fake-indexeddb/auto';
import { getDB } from '../../src/db/db';
import { SYNCED_STORES, isSyncedStore, syncedStoreNames } from '../../src/sync/syncedStores';
import { resetDB } from '../helpers/dbHelpers';

describe('SYNCED_STORES registry', () => {
  /**
   * Guard utama: registry harus identik dengan skema `flowang-db`.
   *
   * Test ini ada karena `loan_repayments` pernah ditambahkan ke skema (v3) tanpa
   * didaftarkan ke jalur sync/backup, sehingga seluruh riwayat pelunasan tidak
   * ikut ter-sync antar-device dan hilang saat restore backup — tanpa error
   * apa pun. Object store baru akan menggagalkan test ini sampai didaftarkan.
   */
  test('mencakup persis semua object store di flowang-db', async () => {
    await resetDB();
    const db = getDB()!;

    const schemaStores = Array.from(db.objectStoreNames).sort();
    const registryStores: string[] = [...syncedStoreNames()].sort();

    expect(registryStores).toEqual(schemaStores);
  });

  test('tidak ada duplikat', () => {
    expect(new Set(SYNCED_STORES).size).toBe(SYNCED_STORES.length);
  });

  test('isSyncedStore mengenali store yang terdaftar dan menolak yang tidak', () => {
    expect(isSyncedStore('loan_repayments')).toBe(true);
    expect(isSyncedStore('transactions')).toBe(true);
    expect(isSyncedStore('sync_config')).toBe(false);
    expect(isSyncedStore('')).toBe(false);
  });

  test('syncedStoreNames mengembalikan salinan, bukan referensi', () => {
    const a = syncedStoreNames();
    a.pop();
    expect(syncedStoreNames()).toHaveLength(SYNCED_STORES.length);
  });
});
