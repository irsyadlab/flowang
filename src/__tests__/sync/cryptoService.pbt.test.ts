import { describe, expect, test } from 'bun:test';
import fc from 'fast-check';
import {
  generateEncryptionKey,
  encrypt,
  decrypt,
} from '../../sync/cryptoService';

describe('Property 2: Encrypt-Decrypt Round-Trip', () => {
  test('encrypt then decrypt returns original plaintext (100 runs)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uint8Array({ minLength: 0, maxLength: 1_048_576 }),
        async (plaintext) => {
          const key = await generateEncryptionKey();
          const ciphertext = await encrypt(plaintext, key);
          const decrypted = await decrypt(ciphertext, key);
          expect(decrypted).toEqual(plaintext);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 3: AES-GCM Authentication Tag Rejection', () => {
  test('any byte modification causes decrypt to throw (100 runs)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uint8Array({ minLength: 1, maxLength: 10_000 }),
        fc.nat(),
        async (plaintext, byteIndexSeed) => {
          const key = await generateEncryptionKey();
          const ciphertext = await encrypt(plaintext, key);
          const tampered = new Uint8Array(ciphertext);
          const byteIndex = byteIndexSeed % tampered.length;
          tampered[byteIndex] ^= 0xff;
          await expect(decrypt(tampered, key)).rejects.toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });
});
