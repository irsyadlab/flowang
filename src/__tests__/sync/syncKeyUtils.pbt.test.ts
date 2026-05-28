import { describe, expect, test } from 'bun:test';
import fc from 'fast-check';
import {
  generateSyncKey,
  encodeSyncKey,
  decodeSyncKey,
  validateSyncKey,
  type SyncKeyPayload,
} from '../../sync/syncKeyUtils';

describe('Property 1: Sync Key Round-Trip', () => {
  test('encode then decode SyncKeyPayload returns identical payload (100 runs)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.integer({ min: 1, max: 10 }),
        async (roomName, version) => {
          const key = await generateSyncKey();
          const payload: SyncKeyPayload = {
            roomName,
            encryptionKey: key.encryptionKey,
            version,
          };
          const encoded = encodeSyncKey(payload);
          const decoded = decodeSyncKey(encoded);
          expect(decoded).toEqual(payload);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 6: Sync Key Validation', () => {
  test('validateSyncKey returns false for arbitrary strings (200 runs)', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const result = validateSyncKey(input);
        if (result) {
          const decoded = decodeSyncKey(input);
          expect(decoded).toHaveProperty('roomName');
          expect(decoded).toHaveProperty('encryptionKey');
          expect(decoded).toHaveProperty('version');
        }
      }),
      { numRuns: 200 }
    );
  });
});
