/**
 * Environment Configuration for Multi-Device Sync
 *
 * Validates and provides access to BUN_PUBLIC_* environment variables.
 *
 * IMPORTANT: Bun inlines BUN_PUBLIC_* vars at bundle time only when accessed
 * as static string literals (process.env.BUN_PUBLIC_FOO). Dynamic access via
 * process.env[name] does NOT get inlined and will be undefined in the browser.
 * All env reads in this file must use static property access.
 *
 * For static deployments (Caddy/nginx), env vars are injected at runtime via
 * window.__ENV__ by the server or a generated env.js file. This file reads
 * from both sources, preferring the inlined bundle value when available.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export interface EnvConfig {
  signalingUrl: string;
  googleClientId: string;
  googleApiKey: string;
  stunUrl?: string;
  turnUrl?: string;
  turnUsername?: string;
  turnCredential?: string;
}

export class EnvConfigError extends Error {
  constructor(public readonly missingVars: string[]) {
    super(
      missingVars.length === 1
        ? `Missing required environment variable: ${missingVars[0]}`
        : `Missing required environment variables: ${missingVars.join(', ')}`
    );
    this.name = 'EnvConfigError';
  }
}

// ── Runtime env injection (for static deployments) ───────────────────────────

declare global {
  interface Window {
    __ENV__?: Record<string, string>;
    __hideSplash?: () => void;
  }
}

// ── Raw env reads (static access — required for Bun inlining) ────────────────

// Bun inlines process.env.X only when it appears as a direct top-level static
// literal. Reading via _e[key] or inside try/catch blocks prevents inlining.
// We use window.__ENV__ as fallback for static deployments (Caddy/nginx)
// where process is not defined at runtime.

function _safe(inlined: string | undefined, key: string): string | undefined {
  if (typeof inlined === 'string' && inlined !== '') return inlined;
  if (typeof window !== 'undefined' && window.__ENV__) return window.__ENV__[key];
  return undefined;
}

function readRawEnv(): Record<string, string | undefined> {
  return {
    BUN_PUBLIC_WEBRTC_SIGNALING_URL: _safe(process.env.BUN_PUBLIC_WEBRTC_SIGNALING_URL, 'BUN_PUBLIC_WEBRTC_SIGNALING_URL'),
    BUN_PUBLIC_GOOGLE_CLIENT_ID:     _safe(process.env.BUN_PUBLIC_GOOGLE_CLIENT_ID,     'BUN_PUBLIC_GOOGLE_CLIENT_ID'),
    BUN_PUBLIC_GOOGLE_API_KEY:       _safe(process.env.BUN_PUBLIC_GOOGLE_API_KEY,        'BUN_PUBLIC_GOOGLE_API_KEY'),
    BUN_PUBLIC_STUN_URL:             _safe(process.env.BUN_PUBLIC_STUN_URL,              'BUN_PUBLIC_STUN_URL'),
    BUN_PUBLIC_TURN_URL:             _safe(process.env.BUN_PUBLIC_TURN_URL,              'BUN_PUBLIC_TURN_URL'),
    BUN_PUBLIC_TURN_USERNAME:        _safe(process.env.BUN_PUBLIC_TURN_USERNAME,         'BUN_PUBLIC_TURN_USERNAME'),
    BUN_PUBLIC_TURN_CREDENTIAL:      _safe(process.env.BUN_PUBLIC_TURN_CREDENTIAL,       'BUN_PUBLIC_TURN_CREDENTIAL'),
  };
}

function present(value: string | undefined): boolean {
  return typeof value === 'string' && value.trim() !== '';
}

// ── Validation helpers ────────────────────────────────────────────────────────

const REQUIRED_VARS = [
  'BUN_PUBLIC_WEBRTC_SIGNALING_URL',
  'BUN_PUBLIC_GOOGLE_CLIENT_ID',
  'BUN_PUBLIC_GOOGLE_API_KEY',
] as const;

/** Returns names of required vars that are missing or empty. */
export function getMissingRequiredVars(): string[] {
  const env = readRawEnv();
  return REQUIRED_VARS.filter((name) => !present(env[name]));
}

/**
 * Validates TURN config: all-or-nothing.
 * Returns names of the missing TURN vars if partially configured, empty array otherwise.
 */
export function validateTurnConfig(): string[] {
  const env = readRawEnv();
  const hasUrl        = present(env.BUN_PUBLIC_TURN_URL);
  const hasUsername   = present(env.BUN_PUBLIC_TURN_USERNAME);
  const hasCredential = present(env.BUN_PUBLIC_TURN_CREDENTIAL);

  // Valid: all defined or none defined
  if ((hasUrl && hasUsername && hasCredential) || (!hasUrl && !hasUsername && !hasCredential)) {
    return [];
  }

  // Partial — return the missing ones
  const missing: string[] = [];
  if (!hasUrl)        missing.push('BUN_PUBLIC_TURN_URL');
  if (!hasUsername)   missing.push('BUN_PUBLIC_TURN_USERNAME');
  if (!hasCredential) missing.push('BUN_PUBLIC_TURN_CREDENTIAL');
  return missing;
}

/**
 * Validates all environment configuration.
 * @throws {EnvConfigError} if required vars are missing or TURN config is partial.
 */
export function validateEnvConfig(): void {
  const missing = getMissingRequiredVars();
  if (missing.length > 0) throw new EnvConfigError(missing);

  const turnMissing = validateTurnConfig();
  if (turnMissing.length > 0) throw new EnvConfigError(turnMissing);
}

/** Builds RTCIceServer[] from optional STUN/TURN env vars. */
export function getIceServers(): RTCIceServer[] {
  const env = readRawEnv();
  const servers: RTCIceServer[] = [];

  if (present(env.BUN_PUBLIC_STUN_URL)) {
    servers.push({ urls: env.BUN_PUBLIC_STUN_URL!.trim() });
  }

  if (
    present(env.BUN_PUBLIC_TURN_URL) &&
    present(env.BUN_PUBLIC_TURN_USERNAME) &&
    present(env.BUN_PUBLIC_TURN_CREDENTIAL)
  ) {
    servers.push({
      urls:       env.BUN_PUBLIC_TURN_URL!.trim(),
      username:   env.BUN_PUBLIC_TURN_USERNAME!.trim(),
      credential: env.BUN_PUBLIC_TURN_CREDENTIAL!.trim(),
    });
  }

  return servers;
}

// ── Singleton ─────────────────────────────────────────────────────────────────

let _config: EnvConfig | null = null;

/**
 * Returns the validated EnvConfig singleton.
 * Config is built fresh on first call; subsequent calls return the cached instance.
 * Call `resetEnvConfig()` in tests to force re-evaluation after mutating process.env.
 *
 * @throws {EnvConfigError} if required vars are missing or TURN config is partial.
 */
export function getEnvConfig(): EnvConfig {
  if (_config) return _config;

  validateEnvConfig();

  const env = readRawEnv();
  _config = {
    signalingUrl:   env.BUN_PUBLIC_WEBRTC_SIGNALING_URL!.trim(),
    googleClientId: env.BUN_PUBLIC_GOOGLE_CLIENT_ID!.trim(),
    googleApiKey:   env.BUN_PUBLIC_GOOGLE_API_KEY!.trim(),
    stunUrl:        env.BUN_PUBLIC_STUN_URL?.trim(),
    turnUrl:        env.BUN_PUBLIC_TURN_URL?.trim(),
    turnUsername:   env.BUN_PUBLIC_TURN_USERNAME?.trim(),
    turnCredential: env.BUN_PUBLIC_TURN_CREDENTIAL?.trim(),
  };

  return _config;
}

/**
 * Clears the cached EnvConfig singleton.
 * Only needed in tests that mutate process.env between assertions.
 */
export function resetEnvConfig(): void {
  _config = null;
}

export default getEnvConfig;
