import { describe, expect, test } from 'bun:test';
import {
  validateEnvConfig,
  getIceServers,
  getMissingRequiredVars,
  validateTurnConfig,
  EnvConfigError,
} from '../../lib/envConfig';

type EnvRecord = Record<string, string | undefined>;
const env = import.meta.env as EnvRecord;

describe('EnvConfig', () => {
  test('getMissingRequiredVars returns missing vars', () => {
    const original = { ...env };
    delete env.VITE_WEBRTC_SIGNALING_URL;
    delete env.VITE_GOOGLE_CLIENT_ID;
    delete env.VITE_GOOGLE_API_KEY;
    try {
      const missing = getMissingRequiredVars();
      expect(missing).toContain('VITE_WEBRTC_SIGNALING_URL');
      expect(missing).toContain('VITE_GOOGLE_CLIENT_ID');
      expect(missing).toContain('VITE_GOOGLE_API_KEY');
    } finally {
      Object.assign(env, original);
    }
  });

  test('validateEnvConfig throws EnvConfigError if vars missing', () => {
    const original = { ...env };
    delete env.VITE_WEBRTC_SIGNALING_URL;
    try {
      expect(() => validateEnvConfig()).toThrow(EnvConfigError);
    } finally {
      Object.assign(env, original);
    }
  });

  test('validateEnvConfig succeeds with all required vars', () => {
    const original = { ...env };
    env.VITE_WEBRTC_SIGNALING_URL = 'wss://test';
    env.VITE_GOOGLE_CLIENT_ID = 'test';
    env.VITE_GOOGLE_API_KEY = 'test';
    try {
      expect(() => validateEnvConfig()).not.toThrow();
    } finally {
      Object.assign(env, original);
    }
  });

  test('getIceServers returns empty array if no STUN/TURN', () => {
    const original = { ...env };
    delete env.VITE_STUN_URL;
    delete env.VITE_TURN_URL;
    delete env.VITE_TURN_USERNAME;
    delete env.VITE_TURN_CREDENTIAL;
    try {
      expect(getIceServers()).toEqual([]);
    } finally {
      Object.assign(env, original);
    }
  });

  test('partial TURN config is invalid', () => {
    const original = { ...env };
    env.VITE_TURN_URL = 'turn:test';
    delete env.VITE_TURN_USERNAME;
    delete env.VITE_TURN_CREDENTIAL;
    try {
      expect(validateTurnConfig().length).toBeGreaterThan(0);
    } finally {
      Object.assign(env, original);
    }
  });
});
