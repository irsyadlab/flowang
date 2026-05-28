/**
 * Environment Configuration for Multi-Device Sync
 * 
 * Validates and provides access to environment variables required
 * for WebRTC, Google OAuth, and STUN/TURN server configuration.
 */

// Required environment variables that MUST be defined at startup
const REQUIRED_VARS = [
  'VITE_WEBRTC_SIGNALING_URL',
  'VITE_GOOGLE_CLIENT_ID',
  'VITE_GOOGLE_API_KEY',
] as const;

// Optional environment variables for STUN/TURN configuration
// Type is used by validateTurnConfig and getIceServers implicitly

/**
 * EnvConfig interface representing validated environment configuration
 */
export interface EnvConfig {
  signalingUrl: string;
  googleClientId: string;
  googleApiKey: string;
  stunUrl?: string;
  turnUrl?: string;
  turnUsername?: string;
  turnCredential?: string;
}

/**
 * Error thrown when required environment variables are missing or invalid
 */
export class EnvConfigError extends Error {
  constructor(public missingVars: string[]) {
    super(
      missingVars.length === 1
        ? `Missing required environment variable: ${missingVars[0]}`
        : `Missing required environment variables: ${missingVars.join(', ')}`
    );
    this.name = 'EnvConfigError';
  }
}

/**
 * Get a value from import.meta.env, returning undefined if not set
 */
function getEnvVar(name: string): string | undefined {
  return import.meta.env[name] as string | undefined;
}

/**
 * Check if all required environment variables are defined
 * @returns Array of missing variable names (empty if all present)
 */
export function getMissingRequiredVars(): string[] {
  const missing: string[] = [];
  
  for (const varName of REQUIRED_VARS) {
    const value = getEnvVar(varName);
    if (!value || value.trim() === '') {
      missing.push(varName);
    }
  }
  
  return missing;
}

/**
 * Validate TURN configuration - all or nothing
 * If any TURN variable is defined, all must be defined
 * @returns Array with error message if invalid, empty array if valid
 */
export function validateTurnConfig(): string[] {
  const turnUrl = getEnvVar('VITE_TURN_URL');
  const turnUsername = getEnvVar('VITE_TURN_USERNAME');
  const turnCredential = getEnvVar('VITE_TURN_CREDENTIAL');
  
  const hasUrl = turnUrl && turnUrl.trim() !== '';
  const hasUsername = turnUsername && turnUsername.trim() !== '';
  const hasCredential = turnCredential && turnCredential.trim() !== '';
  
  const allDefined = hasUrl && hasUsername && hasCredential;
  const noneDefined = !hasUrl && !hasUsername && !hasCredential;
  
  // Valid if all defined OR none defined
  if (allDefined || noneDefined) {
    return [];
  }
  
  // Partial configuration - invalid
  const missing: string[] = [];
  if (!hasUrl) missing.push('VITE_TURN_URL');
  if (!hasUsername) missing.push('VITE_TURN_USERNAME');
  if (!hasCredential) missing.push('VITE_TURN_CREDENTIAL');
  
  return [`Partial TURN configuration - missing: ${missing.join(', ')}`];
}

/**
 * Validate all environment configuration
 * @throws {EnvConfigError} If required variables are missing or TURN config is invalid
 */
export function validateEnvConfig(): void {
  const missing = getMissingRequiredVars();
  
  if (missing.length > 0) {
    throw new EnvConfigError(missing);
  }
  
  const turnErrors = validateTurnConfig();
  if (turnErrors.length > 0) {
    throw new EnvConfigError(turnErrors);
  }
}

/**
 * Build RTCIceServer[] from environment variables
 * Returns empty array if no STUN/TURN vars are defined
 */
export function getIceServers(): RTCIceServer[] {
  const servers: RTCIceServer[] = [];
  
  // Add STUN server if defined
  const stunUrl = getEnvVar('VITE_STUN_URL');
  if (stunUrl && stunUrl.trim() !== '') {
    servers.push({
      urls: stunUrl.trim(),
    });
  }
  
  // Add TURN server if ALL TURN variables are defined
  const turnUrl = getEnvVar('VITE_TURN_URL');
  const turnUsername = getEnvVar('VITE_TURN_USERNAME');
  const turnCredential = getEnvVar('VITE_TURN_CREDENTIAL');
  
  if (
    turnUrl && turnUrl.trim() !== '' &&
    turnUsername && turnUsername.trim() !== '' &&
    turnCredential && turnCredential.trim() !== ''
  ) {
    servers.push({
      urls: turnUrl.trim(),
      username: turnUsername.trim(),
      credential: turnCredential.trim(),
    });
  }
  
  return servers;
}

/**
 * Create and validate the singleton EnvConfig instance
 * @throws {EnvConfigError} If configuration is invalid
 */
function createEnvConfig(): EnvConfig {
  validateEnvConfig();
  
  return {
    signalingUrl: getEnvVar('VITE_WEBRTC_SIGNALING_URL')!,
    googleClientId: getEnvVar('VITE_GOOGLE_CLIENT_ID')!,
    googleApiKey: getEnvVar('VITE_GOOGLE_API_KEY')!,
    stunUrl: getEnvVar('VITE_STUN_URL'),
    turnUrl: getEnvVar('VITE_TURN_URL'),
    turnUsername: getEnvVar('VITE_TURN_USERNAME'),
    turnCredential: getEnvVar('VITE_TURN_CREDENTIAL'),
  };
}

/**
 * Lazy-initialized singleton instance of EnvConfig.
 * Validated and initialized on first access.
 */
let _envConfig: EnvConfig | null = null;

export function getEnvConfig(): EnvConfig {
  if (!_envConfig) {
    _envConfig = createEnvConfig();
  }
  return _envConfig;
}

/** @deprecated Use getEnvConfig() instead */
export const envConfig: EnvConfig = (() => {
  try {
    return createEnvConfig();
  } catch {
    // Will be validated on first access via getEnvConfig()
    return {} as EnvConfig;
  }
})();

export default getEnvConfig;