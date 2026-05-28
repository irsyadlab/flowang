import { describe, expect, test } from 'bun:test';
import fc from 'fast-check';
import { calculateBackoffDelay } from '../../sync/backoffUtils';

describe('Property 5: Exponential Backoff Bounds', () => {
  test('backoff delay for attempt n equals min(1000 * 2^n, 30000) (100 runs)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 9 }), (n) => {
        const delay = calculateBackoffDelay(n);
        const expected = Math.min(1000 * Math.pow(2, n), 30_000);
        expect(delay).toBe(expected);
      }),
      { numRuns: 100 }
    );
  });
});
