/**
 * Sync Key Utilities
 * Encode/decode/validate/generate Sync Keys for multi-device sync.
 */

import { generateEncryptionKey, exportKeyToBase64 } from './cryptoService';

export interface SyncKeyPayload {
  roomName: string;
  encryptionKey: string;
  version: number;
}

function base64UrlEncode(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64UrlDecode(encoded: string): string {
  let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
  const padding = base64.length % 4;
  if (padding) {
    base64 += '='.repeat(4 - padding);
  }
  return atob(base64);
}

/**
 * Generate a new SyncKeyPayload with fresh roomName and encryptionKey.
 */
export async function generateSyncKey(): Promise<SyncKeyPayload> {
  const roomName = crypto.randomUUID();
  const key = await generateEncryptionKey();
  const encryptionKey = await exportKeyToBase64(key);

  return {
    roomName,
    encryptionKey,
    version: 1,
  };
}

/**
 * Encode a SyncKeyPayload to a base64url string.
 */
export function encodeSyncKey(payload: SyncKeyPayload): string {
  return base64UrlEncode(JSON.stringify(payload));
}

/**
 * Decode a base64url string back to SyncKeyPayload.
 */
export function decodeSyncKey(encoded: string): SyncKeyPayload {
  const json = base64UrlDecode(encoded);
  return JSON.parse(json) as SyncKeyPayload;
}

/**
 * Validate a sync key string.
 * Returns true only if the string is a valid base64url-encoded SyncKeyPayload
 * with all required fields present and valid.
 */
export function validateSyncKey(input: string): boolean {
  if (!input || typeof input !== 'string') return false;
  if (input.length < 32 || input.length > 512) return false;

  // Must be valid base64url
  if (!/^[A-Za-z0-9_-]+$/.test(input)) return false;

  try {
    const payload = decodeSyncKey(input);

    if (!payload || typeof payload !== 'object') return false;
    if (typeof payload.roomName !== 'string' || payload.roomName.length === 0) return false;
    if (typeof payload.encryptionKey !== 'string' || payload.encryptionKey.length === 0) return false;
    if (typeof payload.version !== 'number' || !Number.isInteger(payload.version) || payload.version <= 0) return false;

    return true;
  } catch {
    return false;
  }
}
