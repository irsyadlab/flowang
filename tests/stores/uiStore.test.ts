import { describe, it, expect, beforeEach } from "bun:test";
import { useUIStore } from "../../src/stores/uiStore";

function resetStore() {
  useUIStore.setState({
    dbReady: false,
    dbError: null,
    appReady: false,
    theme: "system",
  });
}

describe("uiStore", () => {
  beforeEach(() => {
    resetStore();
  });

  describe("setDbReady", () => {
    it("sets dbReady to true", () => {
      useUIStore.getState().setDbReady(true);
      expect(useUIStore.getState().dbReady).toBe(true);
    });

    it("sets dbReady to false", () => {
      useUIStore.getState().setDbReady(true);
      useUIStore.getState().setDbReady(false);
      expect(useUIStore.getState().dbReady).toBe(false);
    });
  });

  describe("setDbError", () => {
    it("sets error message", () => {
      useUIStore.getState().setDbError("connection failed");
      expect(useUIStore.getState().dbError).toBe("connection failed");
    });

    it("clears error with null", () => {
      useUIStore.getState().setDbError("error");
      useUIStore.getState().setDbError(null);
      expect(useUIStore.getState().dbError).toBeNull();
    });
  });

  describe("setAppReady", () => {
    it("sets appReady to true", () => {
      useUIStore.getState().setAppReady(true);
      expect(useUIStore.getState().appReady).toBe(true);
    });
  });

  describe("setTheme", () => {
    it("sets theme to light", () => {
      useUIStore.getState().setTheme("light");
      expect(useUIStore.getState().theme).toBe("light");
    });

    it("sets theme to dark", () => {
      useUIStore.getState().setTheme("dark");
      expect(useUIStore.getState().theme).toBe("dark");
    });

    it("sets theme to system", () => {
      useUIStore.getState().setTheme("dark");
      useUIStore.getState().setTheme("system");
      expect(useUIStore.getState().theme).toBe("system");
    });
  });

  describe("initial state", () => {
    it("has correct defaults", () => {
      resetStore();
      const state = useUIStore.getState();
      expect(state.dbReady).toBe(false);
      expect(state.dbError).toBeNull();
      expect(state.appReady).toBe(false);
      expect(state.theme).toBe("system");
    });
  });
});
