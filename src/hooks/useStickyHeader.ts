import { useTourStore } from "@/stores/tourStore";

/**
 * Returns the appropriate position class for page headers.
 * When a tour is active, sticky is disabled so tour spotlights
 * are not clipped by the fixed header.
 */
export function useStickyHeader(): string {
  const tourRunning = useTourStore((s) => s.run);
  return tourRunning
    ? "relative z-40 bg-background"
    : "sticky top-0 z-40 bg-background";
}
