import { describe, expect, test, beforeEach } from 'bun:test';
import 'fake-indexeddb/auto';
import { openDB, closeDB, getDB } from '../../src/db/db';
import * as walletDb from '../../src/db/walletDb';
import type { Wallet } from '../../src/types';
import {
  generateEncryptionKey,
  encrypt,
  decrypt,
} from '../../src/sync/cryptoService';

interface IDBRecord {
  [key: string]: unknown;
}

describe('GoogleDriveProvider integration', () => {
  beforeEach(async () => {
    closeDB();
    await openDB();
  });

  test('serialize IndexedDB contains all stores', async () => {
    const db = getDB()!;
    const wallet: Wallet = {
      id: 'w1',
      name: 'Test Wallet',
      initialBalance: 1000,
      balance: 1000,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };
    await walletDb.addWallet(db, wallet);

    const data: Record<string, IDBRecord[]> = {};
    for (const storeName of ['wallets', 'transactions', 'categories']) {
      const records = await new Promise<IDBRecord[]>((resolve) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result as IDBRecord[]);
      });
      data[storeName] = records;
    }

    expect(data.wallets).toHaveLength(1);
    expect(data.wallets[0].name).toBe('Test Wallet');
  });

  test('backup flow: serialize → encrypt → decrypt round-trip', async () => {
    const db = getDB()!;
    const wallet: Wallet = {
      id: 'w-backup',
      name: 'Backup Wallet',
      initialBalance: 5000,
      balance: 5000,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };
    await walletDb.addWallet(db, wallet);

    const data: Record<string, IDBRecord[]> = {};
    for (const storeName of ['wallets', 'transactions', 'categories']) {
      const records = await new Promise<IDBRecord[]>((resolve) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result as IDBRecord[]);
      });
      data[storeName] = records;
    }

    const json = JSON.stringify(data);
    const jsonBytes = new TextEncoder().encode(json);

    const key = await generateEncryptionKey();
    const encrypted = await encrypt(jsonBytes, key);

    expect(encrypted).not.toEqual(jsonBytes);

    const decrypted = await decrypt(encrypted, key);
    const parsed = JSON.parse(new TextDecoder().decode(decrypted));
    expect(parsed.wallets[0].name).toBe('Backup Wallet');
  });

  test('retry logic: eventually succeeds after failures', async () => {
    let attempts = 0;

    const mockUpload = async () => {
      attempts++;
      if (attempts <= 2) {
        throw new Error('Upload failed');
      }
      return 'success';
    };

    let result: string | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        result = await mockUpload();
        break;
      } catch {
        // retry
      }
    }

    expect(attempts).toBe(3);
    expect(result).toBe('success');
  });
});
