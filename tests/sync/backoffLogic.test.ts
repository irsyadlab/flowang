import { describe, expect, test } from 'bun:test';
import { calculateBackoffDelay, MAX_ATTEMPTS } from '../../src/sync/backoffUtils';

describe('Backoff Logic', () => {
  test('delay at attempt 0 = 1000ms', () => {
    expect(calculateBackoffDelay(0)).toBe(1000);
  });

  test('delay at attempt 1 = 2000ms', () => {
    expect(calculateBackoffDelay(1)).toBe(2000);
  });

  test('delay at attempt 5 = 30000ms (capped)', () => {
    expect(calculateBackoffDelay(5)).toBe(30000);
  });

  test('delay never exceeds 30000ms', () => {
    for (let i = 0; i <= 20; i++) {
      expect(calculateBackoffDelay(i)).toBeLessThanOrEqual(30000);
    }
  });

  test('MAX_ATTEMPTS is 10', () => {
    expect(MAX_ATTEMPTS).toBe(10);
  });
});
