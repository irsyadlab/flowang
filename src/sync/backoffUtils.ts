/**
 * Backoff utility for exponential reconnect logic.
 */

const INITIAL_DELAY = 1000;
const MAX_DELAY = 30_000;
const MAX_ATTEMPTS = 10;

/**
 * Calculate exponential backoff delay for a given attempt number.
 * Attempt 0 = 1000ms, doubles each time, caps at 30000ms.
 */
export function calculateBackoffDelay(attempt: number): number {
  return Math.min(INITIAL_DELAY * Math.pow(2, attempt), MAX_DELAY);
}

export { MAX_ATTEMPTS };
