import { describe, expect, test } from 'bun:test';
import {
  generateSyncKey,
  validateSyncKey,
} from '../../src/sync/syncKeyUtils';

describe('SyncKeyUtils', () => {
  test('generateSyncKey produces payload with all required fields', async () => {
    const payload = await generateSyncKey();
    expect(payload).toHaveProperty('roomName');
    expect(payload).toHaveProperty('encryptionKey');
    expect(payload).toHaveProperty('version');
    expect(typeof payload.roomName).toBe('string');
    expect(payload.roomName.length).toBeGreaterThan(0);
    expect(typeof payload.encryptionKey).toBe('string');
    expect(payload.encryptionKey.length).toBeGreaterThan(0);
    expect(typeof payload.version).toBe('number');
    expect(payload.version).toBe(1);
  });

  test('validateSyncKey returns false for empty string', () => {
    expect(validateSyncKey('')).toBe(false);
  });

  test('validateSyncKey returns false for string < 32 chars', () => {
    expect(validateSyncKey('short')).toBe(false);
  });

  test('validateSyncKey returns false for string > 512 chars', () => {
    expect(validateSyncKey('a'.repeat(513))).toBe(false);
  });

  test('validateSyncKey returns false for valid JSON without roomName', () => {
    const payload = { encryptionKey: 'test', version: 1 };
    const encoded = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    if (encoded.length >= 32) {
      expect(validateSyncKey(encoded)).toBe(false);
    } else {
      expect(validateSyncKey(encoded)).toBe(false);
    }
  });
});
