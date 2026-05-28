import { describe, expect, test } from 'bun:test';
import {
  generateEncryptionKey,
  exportKeyToBase64,
  importKeyFromBase64,
  encrypt,
  decrypt,
} from '../../sync/cryptoService';

describe('CryptoService', () => {
  test('generateEncryptionKey produces AES-GCM 256-bit key', async () => {
    const key = await generateEncryptionKey();
    expect(key).toBeDefined();
    expect(key.algorithm.name).toBe('AES-GCM');
    expect((key.algorithm as AesKeyAlgorithm).length).toBe(256);
    expect(key.type).toBe('secret');
    expect(key.extractable).toBe(true);
  });

  test('exportKeyToBase64 produces valid base64url string', async () => {
    const key = await generateEncryptionKey();
    const exported = await exportKeyToBase64(key);
    expect(typeof exported).toBe('string');
    expect(exported.length).toBeGreaterThan(0);
    expect(/^[A-Za-z0-9_-]+$/.test(exported)).toBe(true);
    expect(exported.length).toBeGreaterThanOrEqual(40);
    expect(exported.length).toBeLessThanOrEqual(44);
  });

  test('importKeyFromBase64 succeeds for valid key', async () => {
    const key = await generateEncryptionKey();
    const exported = await exportKeyToBase64(key);
    const imported = await importKeyFromBase64(exported);
    expect(imported).toBeDefined();
    expect(imported.algorithm.name).toBe('AES-GCM');
    expect((imported.algorithm as AesKeyAlgorithm).length).toBe(256);
  });

  test('importKeyFromBase64 throws for invalid string', async () => {
    await expect(importKeyFromBase64('not-a-valid-key')).rejects.toThrow();
  });

  test('encrypt and decrypt empty data', async () => {
    const key = await generateEncryptionKey();
    const empty = new Uint8Array(0);
    const encrypted = await encrypt(empty, key);
    expect(encrypted.length).toBeGreaterThanOrEqual(12);
    const decrypted = await decrypt(encrypted, key);
    expect(decrypted.length).toBe(0);
  });

  test('encrypt and decrypt 1-byte data', async () => {
    const key = await generateEncryptionKey();
    const data = new Uint8Array([42]);
    const encrypted = await encrypt(data, key);
    const decrypted = await decrypt(encrypted, key);
    expect(decrypted.length).toBe(1);
    expect(decrypted[0]).toBe(42);
  });
});
