import { describe, it, expect, beforeEach } from "bun:test";
import "fake-indexeddb/auto";
import { useSyncStore } from "../../src/sync/syncStore";

function resetStore() {
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
}

describe("syncStore", () => {
  beforeEach(() => {
    resetStore();
  });

  describe("setSyncStatus", () => {
    it("sets status to connecting", () => {
      useSyncStore.getState().setSyncStatus("connecting");
      expect(useSyncStore.getState().syncStatus).toBe("connecting");
    });

    it("sets status to connected", () => {
      useSyncStore.getState().setSyncStatus("connected");
      expect(useSyncStore.getState().syncStatus).toBe("connected");
    });

    it("sets status to disconnected", () => {
      useSyncStore.getState().setSyncStatus("connected");
      useSyncStore.getState().setSyncStatus("disconnected");
      expect(useSyncStore.getState().syncStatus).toBe("disconnected");
    });
  });

  describe("setSyncKey", () => {
    it("sets syncKey value", () => {
      useSyncStore.getState().setSyncKey("test-key-123");
      expect(useSyncStore.getState().syncKey).toBe("test-key-123");
    });

    it("clears syncKey with null", () => {
      useSyncStore.getState().setSyncKey("key");
      useSyncStore.getState().setSyncKey(null);
      expect(useSyncStore.getState().syncKey).toBeNull();
    });
  });

  describe("setGoogleAuth", () => {
    it("sets auth token and user info", () => {
      const userInfo = { name: "Test User", email: "test@example.com" };
      useSyncStore.getState().setGoogleAuth("token-abc", userInfo, 3600);
      expect(useSyncStore.getState().googleAuthToken).toBe("token-abc");
      expect(useSyncStore.getState().googleUserInfo).toEqual(userInfo);
      expect(useSyncStore.getState().googleTokenExpiry).toBeGreaterThan(Date.now());
    });

    it("clears auth when token is null", () => {
      const userInfo = { name: "Test", email: "test@test.com" };
      useSyncStore.getState().setGoogleAuth("token", userInfo);
      useSyncStore.getState().setGoogleAuth(null, null);
      expect(useSyncStore.getState().googleAuthToken).toBeNull();
      expect(useSyncStore.getState().googleUserInfo).toBeNull();
      expect(useSyncStore.getState().googleTokenExpiry).toBeNull();
    });
  });

  describe("setLastBackupTimestamp", () => {
    it("sets timestamp", () => {
      useSyncStore.getState().setLastBackupTimestamp("2025-01-01T00:00:00Z");
      expect(useSyncStore.getState().lastBackupTimestamp).toBe("2025-01-01T00:00:00Z");
    });
  });

  describe("setSyncError", () => {
    it("sets error message", () => {
      useSyncStore.getState().setSyncError("connection failed");
      expect(useSyncStore.getState().syncError).toBe("connection failed");
    });

    it("clears error with null", () => {
      useSyncStore.getState().setSyncError("error");
      useSyncStore.getState().setSyncError(null);
      expect(useSyncStore.getState().syncError).toBeNull();
    });
  });

  describe("initial state", () => {
    it("has correct defaults", () => {
      resetStore();
      const state = useSyncStore.getState();
      expect(state.syncStatus).toBe("disconnected");
      expect(state.syncKey).toBeNull();
      expect(state.googleAuthToken).toBeNull();
      expect(state.googleUserInfo).toBeNull();
      expect(state.lastBackupTimestamp).toBeNull();
      expect(state.syncError).toBeNull();
      expect(state.storageLoaded).toBe(false);
    });
  });
});
