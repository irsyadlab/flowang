/**
 * CryptoService - AES-256-GCM encryption/decryption using Web Crypto API
 * Used for end-to-end encryption in multi-device sync
 */

export interface CryptoService {
  generateEncryptionKey(): Promise<CryptoKey>;
  exportKeyToBase64(key: CryptoKey): Promise<string>;
  importKeyFromBase64(base64: string): Promise<CryptoKey>;
  encrypt(data: Uint8Array, key: CryptoKey): Promise<Uint8Array>;
  decrypt(data: Uint8Array, key: CryptoKey): Promise<Uint8Array>;
}

/**
 * Generate a new AES-256-GCM encryption key locally.
 * Uses crypto.subtle.generateKey with extractable=true so the key
 * can be exported to base64url for storage in Sync_Key.
 */
export async function generateEncryptionKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true, // extractable
    ['encrypt', 'decrypt']
  );
}

/**
 * Export a CryptoKey to a base64url string for storage.
 * Uses 'raw' format (256-bit = 32 bytes for AES-256).
 */
export async function exportKeyToBase64(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey('raw', key);
  return bytesToBase64Url(new Uint8Array(exported));
}

/**
 * Import a key from a base64url string (from SyncKeyPayload.encryptionKey).
 * Uses 'raw' format, AES-GCM algorithm, extractable=false.
 */
export async function importKeyFromBase64(base64: string): Promise<CryptoKey> {
  const keyData = base64UrlToBytes(base64);
  return await crypto.subtle.importKey(
    'raw',
    keyData.buffer as ArrayBuffer,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false, // extractable
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt data using AES-256-GCM.
 * Output format: [12-byte IV][encrypted data with 16-byte GCM auth tag]
 * A new random IV is generated for each encryption operation.
 */
export async function encrypt(data: Uint8Array, key: CryptoKey): Promise<Uint8Array> {
  // Generate random 12-byte IV
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    data.buffer as ArrayBuffer
  );

  // Combine IV + encrypted data (which includes the 16-byte auth tag)
  const result = new Uint8Array(iv.length + encrypted.byteLength);
  result.set(iv, 0);
  result.set(new Uint8Array(encrypted), iv.length);

  return result;
}

/**
 * Decrypt data encrypted with encrypt().
 * Extracts IV from first 12 bytes, then decrypts the rest.
 * Automatically verifies GCM auth tag - throws if data has been tampered with.
 * @throws DOMException with 'OperationError' if auth tag is invalid
 */
export async function decrypt(data: Uint8Array, key: CryptoKey): Promise<Uint8Array> {
  // Extract IV from first 12 bytes
  const iv = data.slice(0, 12);
  const ciphertext = data.slice(12);

  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    ciphertext.buffer as ArrayBuffer
  );

  return new Uint8Array(decrypted);
}

// ==================== Base64url Utilities ====================

/**
 * Convert Uint8Array to base64url string.
 * Replaces '+' with '-', '/' with '_', removes '=' padding.
 */
function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return base64UrlEncode(base64);
}

/**
 * Convert base64url string to Uint8Array.
 * Adds back any removed padding, replaces '-' with '+' and '_' with '/'.
 */
function base64UrlToBytes(base64url: string): Uint8Array {
  const base64 = base64UrlDecode(base64url);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Encode base64 to base64url format.
 */
function base64UrlEncode(base64: string): string {
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Decode base64url to base64 format.
 */
function base64UrlDecode(base64url: string): string {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  // Add padding if needed
  const padding = base64.length % 4;
  if (padding) {
    base64 += '='.repeat(4 - padding);
  }
  return base64;
}