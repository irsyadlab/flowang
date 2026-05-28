import { describe, expect, test, beforeEach, afterEach } from 'bun:test';
import 'fake-indexeddb/auto';
import * as Y from 'yjs';
import { openDB, closeDB } from '../../db/db';
import {
  generateEncryptionKey,
  importKeyFromBase64,
  encrypt,
  decrypt,
} from '../../sync/cryptoService';
import { generateSyncKey, encodeSyncKey, decodeSyncKey } from '../../sync/syncKeyUtils';

describe('SyncManager integration', () => {
  beforeEach(async () => {
    await openDB();
  });

  afterEach(() => {
    closeDB();
  });

  test('local change → Yjs update → encrypted broadcast', async () => {
    const key = await generateEncryptionKey();
    const doc = new Y.Doc();

    const map = doc.getMap('wallets');
    map.set('w1', { id: 'w1', name: 'Test Wallet', balance: 1000 });

    const update = Y.encodeStateAsUpdate(doc);
    const encrypted = await encrypt(update, key);

    expect(encrypted).not.toEqual(update);
    expect(encrypted.length).toBeGreaterThan(update.length);

    const decrypted = await decrypt(encrypted, key);
    expect(decrypted).toEqual(update);

    const doc2 = new Y.Doc();
    Y.applyUpdate(doc2, decrypted);
    expect(doc2.getMap('wallets').get('w1')).toEqual({
      id: 'w1',
      name: 'Test Wallet',
      balance: 1000,
    });

    doc.destroy();
    doc2.destroy();
  });

  test('receive encrypted update → decrypt → apply to Yjs', async () => {
    const key = await generateEncryptionKey();

    const senderDoc = new Y.Doc();
    senderDoc.getMap('transactions').set('t1', { id: 't1', amount: 500 });
    const update = Y.encodeStateAsUpdate(senderDoc);

    const encrypted = await encrypt(update, key);
    const decrypted = await decrypt(encrypted, key);

    const receiverDoc = new Y.Doc();
    Y.applyUpdate(receiverDoc, decrypted);

    expect(receiverDoc.getMap('transactions').get('t1')).toEqual({
      id: 't1',
      amount: 500,
    });

    senderDoc.destroy();
    receiverDoc.destroy();
  });

  test('full sync after reconnect merges offline changes', async () => {
    const baseDoc = new Y.Doc();
    baseDoc.getMap('wallets').set('w1', { id: 'w1', name: 'Original' });
    const baseState = Y.encodeStateAsUpdate(baseDoc);
    baseDoc.destroy();

    const docA = new Y.Doc();
    Y.applyUpdate(docA, baseState);
    docA.getMap('wallets').set('w1', { id: 'w1', name: 'Updated by A' });
    docA.getMap('wallets').set('w2', { id: 'w2', name: 'New from A' });

    const docB = new Y.Doc();
    Y.applyUpdate(docB, baseState);
    docB.getMap('wallets').set('w1', { id: 'w1', name: 'Updated by B' });
    docB.getMap('wallets').set('w3', { id: 'w3', name: 'New from B' });

    const mergedDoc = new Y.Doc();
    Y.applyUpdate(mergedDoc, Y.encodeStateAsUpdate(docA));
    Y.applyUpdate(mergedDoc, Y.encodeStateAsUpdate(docB));

    const wallets = mergedDoc.getMap('wallets');
    expect(wallets.get('w2')).toEqual({ id: 'w2', name: 'New from A' });
    expect(wallets.get('w3')).toEqual({ id: 'w3', name: 'New from B' });
    expect(wallets.get('w1')).toBeDefined();

    docA.destroy();
    docB.destroy();
    mergedDoc.destroy();
  });

  test('SyncKey round-trip preserves encryption key', async () => {
    const payload = await generateSyncKey();
    const encoded = encodeSyncKey(payload);
    const decoded = decodeSyncKey(encoded);

    expect(decoded.roomName).toBe(payload.roomName);
    expect(decoded.encryptionKey).toBe(payload.encryptionKey);
    expect(decoded.version).toBe(payload.version);

    const cryptoKey = await importKeyFromBase64(decoded.encryptionKey);
    const data = new Uint8Array([1, 2, 3, 4, 5]);
    const encrypted = await encrypt(data, cryptoKey);
    const decrypted = await decrypt(encrypted, cryptoKey);
    expect(decrypted).toEqual(data);
  });
});
