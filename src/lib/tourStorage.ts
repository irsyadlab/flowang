export type TourStatus = 'completed' | 'skipped' | 'in_progress';

export const TOUR_STATUS_KEY = 'flowang_tour_status';

export const VALID_STATUSES: TourStatus[] = ['completed', 'skipped', 'in_progress'];

/**
 * Check if a value is a valid TourStatus
 */
function isValidStatus(value: unknown): value is TourStatus {
  return VALID_STATUSES.includes(value as TourStatus);
}

/**
 * Get the current tour status from localStorage
 * Returns null if the value is corrupt, invalid, or not set
 */
export function getStatus(): TourStatus | null {
  try {
    const stored = localStorage.getItem(TOUR_STATUS_KEY);
    if (stored === null) {
      return null;
    }

    const parsed = JSON.parse(stored);
    if (isValidStatus(parsed)) {
      return parsed;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Save the tour status to localStorage
 * Performs round-trip verification to ensure data integrity
 */
export function setStatus(status: TourStatus): boolean {
  try {
    localStorage.setItem(TOUR_STATUS_KEY, JSON.stringify(status));

    // Round-trip verification
    const verified = getStatus();
    if (verified !== status) {
      console.error(`[tourStorage] Verification failed: expected "${status}", got "${verified}"`);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`[tourStorage] Failed to set status:`, error);
    return false;
  }
}

/**
 * Clear the tour status from localStorage
 */
export function clearStatus(): void {
  try {
    localStorage.removeItem(TOUR_STATUS_KEY);
  } catch (error) {
    console.error(`[tourStorage] Failed to clear status:`, error);
  }
}

/**
 * Determine if the tour should auto-start
 * Returns true only if no status has been set (first-time user)
 */
export function shouldAutoStart(): boolean {
  return getStatus() === null;
}