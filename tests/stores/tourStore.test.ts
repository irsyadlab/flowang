import { describe, it, expect, beforeEach } from "bun:test";
import { useTourStore } from "../../src/stores/tourStore";
import { TOUR_STATUS_KEY } from "../../src/lib/tourStorage";

function resetStore() {
  useTourStore.setState({ run: false, stepIndex: 0, hasAutoStarted: false });
}

describe("tourStore", () => {
  beforeEach(() => {
    resetStore();
    localStorage.removeItem(TOUR_STATUS_KEY);
  });

  describe("startTour", () => {
    it("sets run to true", () => {
      useTourStore.getState().startTour();
      expect(useTourStore.getState().run).toBe(true);
    });

    it("persists in_progress status to localStorage", () => {
      useTourStore.getState().startTour();
      const stored = JSON.parse(localStorage.getItem(TOUR_STATUS_KEY)!);
      expect(stored).toBe("in_progress");
    });
  });

  describe("stopTour", () => {
    it("sets run to false", () => {
      useTourStore.setState({ run: true });
      useTourStore.getState().stopTour();
      expect(useTourStore.getState().run).toBe(false);
    });
  });

  describe("setStepIndex", () => {
    it("updates stepIndex", () => {
      useTourStore.getState().setStepIndex(3);
      expect(useTourStore.getState().stepIndex).toBe(3);
    });

    it("can set stepIndex to 0", () => {
      useTourStore.setState({ stepIndex: 5 });
      useTourStore.getState().setStepIndex(0);
      expect(useTourStore.getState().stepIndex).toBe(0);
    });
  });

  describe("restartTour", () => {
    it("resets stepIndex and sets run to true", () => {
      useTourStore.setState({ run: true, stepIndex: 5 });
      useTourStore.getState().restartTour();
      expect(useTourStore.getState().run).toBe(true);
      expect(useTourStore.getState().stepIndex).toBe(0);
    });

    it("clears previous status and sets in_progress", () => {
      localStorage.setItem(TOUR_STATUS_KEY, JSON.stringify("completed"));
      useTourStore.getState().restartTour();
      const stored = JSON.parse(localStorage.getItem(TOUR_STATUS_KEY)!);
      expect(stored).toBe("in_progress");
    });
  });

  describe("completeTour", () => {
    it("sets run to false", () => {
      useTourStore.setState({ run: true });
      useTourStore.getState().completeTour();
      expect(useTourStore.getState().run).toBe(false);
    });

    it("persists completed status to localStorage", () => {
      useTourStore.getState().completeTour();
      const stored = JSON.parse(localStorage.getItem(TOUR_STATUS_KEY)!);
      expect(stored).toBe("completed");
    });
  });

  describe("skipTour", () => {
    it("sets run to false", () => {
      useTourStore.setState({ run: true });
      useTourStore.getState().skipTour();
      expect(useTourStore.getState().run).toBe(false);
    });

    it("persists skipped status to localStorage", () => {
      useTourStore.getState().skipTour();
      const stored = JSON.parse(localStorage.getItem(TOUR_STATUS_KEY)!);
      expect(stored).toBe("skipped");
    });
  });

  describe("markAutoStarted", () => {
    it("sets hasAutoStarted to true", () => {
      expect(useTourStore.getState().hasAutoStarted).toBe(false);
      useTourStore.getState().markAutoStarted();
      expect(useTourStore.getState().hasAutoStarted).toBe(true);
    });

    it("does not affect run state", () => {
      useTourStore.setState({ run: true });
      useTourStore.getState().markAutoStarted();
      expect(useTourStore.getState().run).toBe(true);
    });
  });
});
