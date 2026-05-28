import { describe, expect, test } from 'bun:test';
import {
  validateEnvConfig,
  getIceServers,
  getMissingRequiredVars,
  validateTurnConfig,
  EnvConfigError,
  resetEnvConfig,
} from '../../lib/envConfig';

describe('EnvConfig', () => {
  test('getMissingRequiredVars returns missing vars', () => {
    const original = {
      signaling: process.env.BUN_PUBLIC_WEBRTC_SIGNALING_URL,
      clientId: process.env.BUN_PUBLIC_GOOGLE_CLIENT_ID,
      apiKey: process.env.BUN_PUBLIC_GOOGLE_API_KEY,
    };
    delete process.env.BUN_PUBLIC_WEBRTC_SIGNALING_URL;
    delete process.env.BUN_PUBLIC_GOOGLE_CLIENT_ID;
    delete process.env.BUN_PUBLIC_GOOGLE_API_KEY;
    try {
      const missing = getMissingRequiredVars();
      expect(missing).toContain('BUN_PUBLIC_WEBRTC_SIGNALING_URL');
      expect(missing).toContain('BUN_PUBLIC_GOOGLE_CLIENT_ID');
      expect(missing).toContain('BUN_PUBLIC_GOOGLE_API_KEY');
    } finally {
      if (original.signaling) process.env.BUN_PUBLIC_WEBRTC_SIGNALING_URL = original.signaling;
      if (original.clientId) process.env.BUN_PUBLIC_GOOGLE_CLIENT_ID = original.clientId;
      if (original.apiKey) process.env.BUN_PUBLIC_GOOGLE_API_KEY = original.apiKey;
    }
  });

  test('validateEnvConfig throws EnvConfigError if vars missing', () => {
    const original = process.env.BUN_PUBLIC_WEBRTC_SIGNALING_URL;
    delete process.env.BUN_PUBLIC_WEBRTC_SIGNALING_URL;
    resetEnvConfig();
    try {
      expect(() => validateEnvConfig()).toThrow(EnvConfigError);
    } finally {
      if (original) process.env.BUN_PUBLIC_WEBRTC_SIGNALING_URL = original;
      resetEnvConfig();
    }
  });

  test('validateEnvConfig succeeds with all required vars', () => {
    const original = {
      signaling: process.env.BUN_PUBLIC_WEBRTC_SIGNALING_URL,
      clientId: process.env.BUN_PUBLIC_GOOGLE_CLIENT_ID,
      apiKey: process.env.BUN_PUBLIC_GOOGLE_API_KEY,
    };
    process.env.BUN_PUBLIC_WEBRTC_SIGNALING_URL = 'wss://test';
    process.env.BUN_PUBLIC_GOOGLE_CLIENT_ID = 'test';
    process.env.BUN_PUBLIC_GOOGLE_API_KEY = 'test';
    resetEnvConfig();
    try {
      expect(() => validateEnvConfig()).not.toThrow();
    } finally {
      if (original.signaling) process.env.BUN_PUBLIC_WEBRTC_SIGNALING_URL = original.signaling;
      else delete process.env.BUN_PUBLIC_WEBRTC_SIGNALING_URL;
      if (original.clientId) process.env.BUN_PUBLIC_GOOGLE_CLIENT_ID = original.clientId;
      else delete process.env.BUN_PUBLIC_GOOGLE_CLIENT_ID;
      if (original.apiKey) process.env.BUN_PUBLIC_GOOGLE_API_KEY = original.apiKey;
      else delete process.env.BUN_PUBLIC_GOOGLE_API_KEY;
      resetEnvConfig();
    }
  });

  test('getIceServers returns empty array if no STUN/TURN', () => {
    const original = {
      stun: process.env.BUN_PUBLIC_STUN_URL,
      turnUrl: process.env.BUN_PUBLIC_TURN_URL,
      turnUser: process.env.BUN_PUBLIC_TURN_USERNAME,
      turnPass: process.env.BUN_PUBLIC_TURN_CREDENTIAL,
    };
    delete process.env.BUN_PUBLIC_STUN_URL;
    delete process.env.BUN_PUBLIC_TURN_URL;
    delete process.env.BUN_PUBLIC_TURN_USERNAME;
    delete process.env.BUN_PUBLIC_TURN_CREDENTIAL;
    try {
      expect(getIceServers()).toEqual([]);
    } finally {
      if (original.stun) process.env.BUN_PUBLIC_STUN_URL = original.stun;
      if (original.turnUrl) process.env.BUN_PUBLIC_TURN_URL = original.turnUrl;
      if (original.turnUser) process.env.BUN_PUBLIC_TURN_USERNAME = original.turnUser;
      if (original.turnPass) process.env.BUN_PUBLIC_TURN_CREDENTIAL = original.turnPass;
    }
  });

  test('partial TURN config is invalid', () => {
    const original = {
      turnUrl: process.env.BUN_PUBLIC_TURN_URL,
      turnUser: process.env.BUN_PUBLIC_TURN_USERNAME,
      turnPass: process.env.BUN_PUBLIC_TURN_CREDENTIAL,
    };
    process.env.BUN_PUBLIC_TURN_URL = 'turn:test';
    delete process.env.BUN_PUBLIC_TURN_USERNAME;
    delete process.env.BUN_PUBLIC_TURN_CREDENTIAL;
    try {
      expect(validateTurnConfig().length).toBeGreaterThan(0);
    } finally {
      if (original.turnUrl) process.env.BUN_PUBLIC_TURN_URL = original.turnUrl;
      else delete process.env.BUN_PUBLIC_TURN_URL;
      if (original.turnUser) process.env.BUN_PUBLIC_TURN_USERNAME = original.turnUser;
      else delete process.env.BUN_PUBLIC_TURN_USERNAME;
      if (original.turnPass) process.env.BUN_PUBLIC_TURN_CREDENTIAL = original.turnPass;
      else delete process.env.BUN_PUBLIC_TURN_CREDENTIAL;
    }
  });
});
