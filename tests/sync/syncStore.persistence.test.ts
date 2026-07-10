import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import "fake-indexeddb/auto";
import { useSyncStore } from "../../src/sync/syncStore";
import { useUIStore } from "../../src/stores/uiStore";
import { closeDB } from "../../src/db/db";
import { resetDB } from "../helpers/dbHelpers";

describe("syncStore with IndexedDB persistence", () => {
  beforeEach(async () => {
    await resetDB();
    useUIStore.getState().setDbReady(true);
    useSyncStore.setState({
      syncStatus: "disconnected",
      syncKey: null,
      googleAuthToken: null,
      googleTokenExpiry: null,
      googleUserInfo: null,
      lastBackupTimestamp: null,
      syncError: null,
      storageLoaded: false,
    });
  });

  afterEach(() => {
    useUIStore.getState().setDbReady(false);
    closeDB();
  });

  describe("setSyncKey", () => {
    it("persists syncKey to IndexedDB", async () => {
      useSyncStore.getState().setSyncKey("test-key");
      expect(useSyncStore.getState().syncKey).toBe("test-key");

      // Verify it was stored in IndexedDB
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const req = indexedDB.open("sync-config", 1);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });

      const value = await new Promise<string | null>((resolve, reject) => {
        const tx = db.transaction("config", "readonly");
        const store = tx.objectStore("config");
        const req = store.get("syncKey");
        req.onsuccess = () => resolve(req.result ?? null);
        req.onerror = () => reject(req.error);
      });

      expect(value).toBe("test-key");
      db.close();
    });

    it("deletes syncKey from IndexedDB when set to null", async () => {
      useSyncStore.getState().setSyncKey("key");
      useSyncStore.getState().setSyncKey(null);
      expect(useSyncStore.getState().syncKey).toBeNull();
    });
  });

  describe("setGoogleAuth", () => {
    it("persists Google auth data to IndexedDB", async () => {
      const userInfo = { name: "Test", email: "test@test.com" };
      useSyncStore.getState().setGoogleAuth("token-123", userInfo, 3600);

      expect(useSyncStore.getState().googleAuthToken).toBe("token-123");
      expect(useSyncStore.getState().googleUserInfo).toEqual(userInfo);
      expect(useSyncStore.getState().googleTokenExpiry).toBeGreaterThan(Date.now());
    });

    it("clears Google auth data", async () => {
      useSyncStore.getState().setGoogleAuth("token", { name: "T", email: "t@t.com" });
      useSyncStore.getState().setGoogleAuth(null, null);

      expect(useSyncStore.getState().googleAuthToken).toBeNull();
      expect(useSyncStore.getState().googleUserInfo).toBeNull();
      expect(useSyncStore.getState().googleTokenExpiry).toBeNull();
    });
  });

  describe("setLastBackupTimestamp", () => {
    it("persists timestamp to IndexedDB", async () => {
      const ts = "2025-01-01T00:00:00Z";
      useSyncStore.getState().setLastBackupTimestamp(ts);
      expect(useSyncStore.getState().lastBackupTimestamp).toBe(ts);
    });
  });

  describe("loadFromStorage", () => {
    it("loads persisted values from IndexedDB", async () => {
      // Set values first
      useSyncStore.getState().setSyncKey("loaded-key");
      useSyncStore.getState().setLastBackupTimestamp("2025-06-01T00:00:00Z");

      // Reset in-memory state
      useSyncStore.setState({
        syncKey: null,
        lastBackupTimestamp: null,
        storageLoaded: false,
      });

      // Load from storage
      await useSyncStore.getState().loadFromStorage();

      expect(useSyncStore.getState().syncKey).toBe("loaded-key");
      expect(useSyncStore.getState().lastBackupTimestamp).toBe("2025-06-01T00:00:00Z");
      expect(useSyncStore.getState().storageLoaded).toBe(true);
    });

    it("sets storageLoaded to true even when no data exists", async () => {
      useSyncStore.setState({ storageLoaded: false });
      await useSyncStore.getState().loadFromStorage();
      expect(useSyncStore.getState().storageLoaded).toBe(true);
    });
  });
});
