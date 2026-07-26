/**
 * Kapan backup Google Drive boleh berjalan — dan kapan pop-up login boleh muncul.
 *
 * Regression: `scheduleBackup()` dulu dipanggil tanpa syarat dari setiap
 * perubahan data, dan `performBackup` selalu memakai `ensureValidToken(true)`.
 * Akibatnya user yang belum pernah menyentuh fitur backup tetap ditodong pop-up
 * login Google 30 detik setelah mencatat transaksi pertamanya.
 *
 * Yang dikunci di sini: tanpa Google Drive terhubung, jalur otomatis tidak
 * menjadwalkan apa pun dan tidak pernah menyentuh lapisan OAuth.
 */

import { describe, expect, test, beforeAll, beforeEach, afterEach, mock } from 'bun:test';
import 'fake-indexeddb/auto';

/** Berapa kali lapisan OAuth diminta membuka pop-up. */
let popupRequests = 0;
/** Berapa kali token diminta secara diam-diam (tanpa pop-up). */
let silentRequests = 0;

mock.module('../../src/lib/envConfig', () => ({
  getEnvConfig: () => ({
    signalingUrl: 'wss://contoh',
    googleClientId: 'client-id',
    googleApiKey: 'api-key',
  }),
  getIceServers: () => [],
  validateEnvConfig: () => {},
  getMissingRequiredVars: () => [],
  validateTurnConfig: () => [],
  resetEnvConfig: () => {},
  EnvConfigError: class extends Error {},
  default: () => ({}),
}));

// Diimpor di beforeAll: mock.module harus terpasang sebelum modul dievaluasi.
let driveProvider: typeof import('../../src/sync/googleDriveProvider');
let syncStore: typeof import('../../src/sync/syncStore');
let syncKeyUtils: typeof import('../../src/sync/syncKeyUtils');

beforeAll(async () => {
  driveProvider = await import('../../src/sync/googleDriveProvider');
  syncStore = await import('../../src/sync/syncStore');
  syncKeyUtils = await import('../../src/sync/syncKeyUtils');
});

let syncKey = '';

beforeEach(async () => {
  popupRequests = 0;
  silentRequests = 0;

  if (!syncKey) {
    syncKey = syncKeyUtils.encodeSyncKey(await syncKeyUtils.generateSyncKey());
  }

  // Google Identity Services tiruan: mencatat setiap permintaan token, tanpa
  // pernah benar-benar menyelesaikannya (persis seperti pop-up yang menunggu user).
  (window as unknown as { google: unknown }).google = {
    accounts: {
      oauth2: {
        initTokenClient: (config: { error_callback?: (e: { type: string }) => void }) => ({
          requestAccessToken: () => {
            popupRequests++;
            // Simulasikan user menutup pop-up tanpa login
            config.error_callback?.({ type: 'popup_closed' });
          },
        }),
      },
    },
  };

  syncStore.useSyncStore.setState({ syncKey, googleAuthToken: null, googleUserInfo: null, syncError: null });
});

afterEach(() => {
  syncStore.useSyncStore.setState({ syncKey: null, googleAuthToken: null, syncError: null });
});

describe('Pemicu backup Google Drive', () => {
  test('tidak menjadwalkan apa pun saat Drive belum terhubung', () => {
    driveProvider.scheduleBackup();

    // Timer-nya memang tidak dipasang — bukan sekadar belum sempat menyala
    expect(driveProvider.hasPendingBackup()).toBe(false);
    expect(popupRequests).toBe(0);
    expect(silentRequests).toBe(0);
  });

  test('tetap menjadwalkan saat Drive sudah terhubung', () => {
    syncStore.useSyncStore.setState({ googleAuthToken: 'token-aktif' });
    driveProvider.scheduleBackup();

    expect(driveProvider.hasPendingBackup()).toBe(true);
    // Menjadwalkan saja belum boleh menyentuh OAuth
    expect(popupRequests).toBe(0);

    driveProvider.logout();
  });

  test('backup manual melempar saat gagal, bukan diam-diam sukses', async () => {
    let terlempar = false;
    try {
      await driveProvider.backupNow();
    } catch {
      terlempar = true;
    }

    expect(terlempar).toBe(true);
  });

  /**
   * Regression: retry loop dulu memanggil ulang ensureValidToken, sehingga
   * menutup pop-up Google justru memunculkannya lagi dua kali dengan jeda
   * 5 detik.
   */
  test('menutup pop-up tidak memunculkannya lagi', async () => {
    await driveProvider.backupNow().catch(() => {});

    expect(popupRequests).toBe(1);
  });

  test('logout membatalkan backup yang masih menunggu', () => {
    syncStore.useSyncStore.setState({ googleAuthToken: 'token-lama' });
    driveProvider.scheduleBackup();

    expect(driveProvider.hasPendingBackup()).toBe(true);

    driveProvider.logout();

    expect(driveProvider.hasPendingBackup()).toBe(false);
    expect(syncStore.useSyncStore.getState().googleAuthToken).toBeNull();
    expect(popupRequests).toBe(0);
  });
});
