import { describe, it, expect, beforeEach } from "bun:test";
import {
  getStatus,
  setStatus,
  clearStatus,
  shouldAutoStart,
  TOUR_STATUS_KEY,
  VALID_STATUSES,
} from "../../src/lib/tourStorage";

describe("tourStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("getStatus", () => {
    it("returns null when not set", () => {
      expect(getStatus()).toBeNull();
    });

    it("returns stored status after setStatus", () => {
      setStatus("completed");
      expect(getStatus()).toBe("completed");
    });

    it("returns null for corrupt data", () => {
      localStorage.setItem(TOUR_STATUS_KEY, '"invalid_status"');
      expect(getStatus()).toBeNull();
    });

    it("returns null for non-JSON data", () => {
      localStorage.setItem(TOUR_STATUS_KEY, "not-json");
      expect(getStatus()).toBeNull();
    });
  });

  describe("setStatus", () => {
    it("saves completed status", () => {
      const result = setStatus("completed");
      expect(result).toBe(true);
      expect(getStatus()).toBe("completed");
    });

    it("saves skipped status", () => {
      const result = setStatus("skipped");
      expect(result).toBe(true);
      expect(getStatus()).toBe("skipped");
    });

    it("saves in_progress status", () => {
      const result = setStatus("in_progress");
      expect(result).toBe(true);
      expect(getStatus()).toBe("in_progress");
    });

    it("returns true on success", () => {
      expect(setStatus("completed")).toBe(true);
    });
  });

  describe("clearStatus", () => {
    it("removes the stored status", () => {
      setStatus("completed");
      clearStatus();
      expect(getStatus()).toBeNull();
    });

    it("is safe to call when nothing is stored", () => {
      expect(() => clearStatus()).not.toThrow();
    });
  });

  describe("shouldAutoStart", () => {
    it("returns true when no status is set (first-time user)", () => {
      expect(shouldAutoStart()).toBe(true);
    });

    it("returns false when status is completed", () => {
      setStatus("completed");
      expect(shouldAutoStart()).toBe(false);
    });

    it("returns false when status is skipped", () => {
      setStatus("skipped");
      expect(shouldAutoStart()).toBe(false);
    });

    it("returns false when status is in_progress", () => {
      setStatus("in_progress");
      expect(shouldAutoStart()).toBe(false);
    });
  });

  describe("VALID_STATUSES", () => {
    it("contains all three statuses", () => {
      expect(VALID_STATUSES).toContain("completed");
      expect(VALID_STATUSES).toContain("skipped");
      expect(VALID_STATUSES).toContain("in_progress");
      expect(VALID_STATUSES.length).toBe(3);
    });
  });
});
