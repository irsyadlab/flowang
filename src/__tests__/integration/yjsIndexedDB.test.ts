import { describe, expect, test, beforeEach, afterEach } from 'bun:test';
import 'fake-indexeddb/auto';
import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import { openDB, closeDB } from '../../db/db';

describe('Yjs + IndexedDB persistence', () => {
  beforeEach(async () => {
    await openDB();
  });

  afterEach(() => {
    closeDB();
  });

  test('Yjs changes persist to IndexedDB via y-indexeddb', async () => {
    const doc1 = new Y.Doc();
    const persistence = new IndexeddbPersistence('test-yjs', doc1);

    // Wait for synced event
    await new Promise<void>((resolve) => {
      persistence.on('synced', () => resolve());
    });

    // Make changes
    const map = doc1.getMap('wallets');
    map.set('w1', { id: 'w1', name: 'Test Wallet', balance: 1000 });

    // Wait a bit for persistence
    await new Promise((r) => setTimeout(r, 100));

    // Create new doc and load from persistence
    const doc2 = new Y.Doc();
    const persistence2 = new IndexeddbPersistence('test-yjs', doc2);

    await new Promise<void>((resolve) => {
      persistence2.on('synced', () => resolve());
    });

    const map2 = doc2.getMap('wallets');
    expect(map2.get('w1')).toEqual({ id: 'w1', name: 'Test Wallet', balance: 1000 });

    // Cleanup
    persistence.destroy();
    persistence2.destroy();
    doc1.destroy();
    doc2.destroy();
  });

  test('reload Yjs doc from IndexedDB preserves state', async () => {
    const doc1 = new Y.Doc();
    const persistence1 = new IndexeddbPersistence('test-state', doc1);

    await new Promise<void>((resolve) => {
      persistence1.on('synced', () => resolve());
    });

    // Add data to three maps
    doc1.getMap('wallets').set('w1', { id: 'w1', name: 'Wallet 1' });
    doc1.getMap('transactions').set('t1', { id: 't1', amount: 500 });
    doc1.getMap('categories').set('c1', { id: 'c1', name: 'Food' });

    await new Promise((r) => setTimeout(r, 100));

    persistence1.destroy();
    doc1.destroy();

    // Reload
    const doc2 = new Y.Doc();
    const persistence2 = new IndexeddbPersistence('test-state', doc2);

    await new Promise<void>((resolve) => {
      persistence2.on('synced', () => resolve());
    });

    expect(doc2.getMap('wallets').get('w1')).toEqual({ id: 'w1', name: 'Wallet 1' });
    expect(doc2.getMap('transactions').get('t1')).toEqual({ id: 't1', amount: 500 });
    expect(doc2.getMap('categories').get('c1')).toEqual({ id: 'c1', name: 'Food' });

    persistence2.destroy();
    doc2.destroy();
  });
});
