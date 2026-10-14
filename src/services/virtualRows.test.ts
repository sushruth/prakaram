import { describe, expect, it } from 'bun:test';
import { aroundPinned, cumulative, indexAt, offsetOf, visibleRange, withPinned, type HeightLookup } from './virtualRows';

/** A height lookup backed by a sparse record: absent indices are unmeasured. */
const measured = (heights: Record<number, number>): HeightLookup => (i) => heights[i];

const flat = (count: number, height: number) => cumulative(count, () => undefined, height);

describe('virtualRows', () => {
  describe('cumulative', () => {
    it('uses the estimate for unmeasured rows and returns count + 1 tops', () => {
      expect(flat(3, 100)).toEqual([0, 100, 200, 300]);
    });

    it('uses a measured height instead of the estimate', () => {
      const cum = cumulative(3, measured({ 1: 50 }), 100);
      expect(cum).toEqual([0, 100, 150, 250]);
    });

    it('lets measured rows shift later offsets', () => {
      const cum = cumulative(2, measured({ 0: 200 }), 100);
      expect(cum).toEqual([0, 200, 300]);
      expect(offsetOf(cum, 1)).toBe(200);
    });

    it('totals the sum of heights', () => {
      const cum = cumulative(4, measured({ 0: 10, 1: 20, 3: 30 }), 15);
      expect(cum[4]).toBe(10 + 20 + 15 + 30);
    });
  });

  describe('offsetOf', () => {
    it('returns a row top and clamps outside the list', () => {
      const cum = flat(3, 100);
      expect(offsetOf(cum, 2)).toBe(200);
      expect(offsetOf(cum, -5)).toBe(0);
      expect(offsetOf(cum, 99)).toBe(300);
    });
  });

  describe('indexAt', () => {
    const cum = flat(4, 100); // [0, 100, 200, 300, 400]

    it('returns the row containing the offset', () => {
      expect(indexAt(cum, 0)).toBe(0);
      expect(indexAt(cum, 99)).toBe(0);
      expect(indexAt(cum, 150)).toBe(1);
      expect(indexAt(cum, 399)).toBe(3);
    });

    it('returns the later row at a boundary', () => {
      expect(indexAt(cum, 100)).toBe(1);
      expect(indexAt(cum, 300)).toBe(3);
    });

    it('clamps at both ends', () => {
      expect(indexAt(cum, -50)).toBe(0);
      expect(indexAt(cum, 10_000)).toBe(3);
    });

    it('returns 0 for an empty list', () => {
      expect(indexAt(flat(0, 100), 500)).toBe(0);
    });
  });

  describe('visibleRange', () => {
    const cum = flat(5, 100); // [0, 100, 200, 300, 400, 500]

    it('includes the buffer rows on both sides', () => {
      const range = visibleRange(cum, 200, 100, 50); // window [150, 350]
      expect(range.start).toBe(1);
      expect(range.end).toBe(3);
      expect(range.total).toBe(500);
    });

    it('keeps total = top + mounted + bottom', () => {
      const range = visibleRange(cum, 200, 100, 0); // rows 2..3
      expect(range.start).toBe(2);
      expect(range.end).toBe(3);
      expect(range.top).toBe(200);
      expect(range.bottom).toBe(100);
      expect(range.top + (cum[range.end + 1] - cum[range.start]) + range.bottom).toBe(range.total);
    });

    it('clamps at the top', () => {
      const range = visibleRange(cum, 0, 1000, 100);
      expect(range.start).toBe(0);
      expect(range.end).toBe(4);
      expect(range.top).toBe(0);
      expect(range.bottom).toBe(0);
    });

    it('clamps at the bottom', () => {
      const range = visibleRange(cum, 10_000, 100, 0);
      expect(range.start).toBe(4);
      expect(range.end).toBe(4);
      expect(range.top).toBe(400);
      expect(range.bottom).toBe(0);
    });

    it('is empty for an empty list', () => {
      expect(visibleRange(flat(0, 100), 0, 500, 100)).toEqual({ start: 0, end: -1, top: 0, bottom: 0, total: 0 });
    });
  });

  describe('withPinned', () => {
    it('keeps the pinned index inside with the slack', () => {
      const range = withPinned({ start: 2, end: 4 }, 10, 2, 20);
      expect(range.start).toBeLessThanOrEqual(10 - 2);
      expect(range.end).toBeGreaterThanOrEqual(10 + 2);
      expect(range.start).toBeLessThanOrEqual(10);
      expect(range.end).toBeGreaterThanOrEqual(10);
    });

    it('bridges when the pinned row is outside the range', () => {
      expect(withPinned({ start: 5, end: 6 }, 0, 2, 10)).toEqual({ start: 0, end: 6 });
    });

    it('clamps to the list bounds', () => {
      expect(withPinned({ start: 0, end: 1 }, 0, 2, 5)).toEqual({ start: 0, end: 2 });
      expect(withPinned({ start: 0, end: 1 }, 4, 2, 5)).toEqual({ start: 0, end: 4 });
    });

    it('leaves a range that already contains the slack untouched', () => {
      expect(withPinned({ start: 8, end: 12 }, 10, 2, 20)).toEqual({ start: 8, end: 12 });
    });
  });

  describe('aroundPinned', () => {
    it('returns the range when pinned is inside it', () => {
      expect(aroundPinned({ start: 8, end: 12 }, 10, 2, 20)).toEqual({ start: 8, end: 12 });
    });

    it('jumps to a window around a pinned row below the range', () => {
      expect(aroundPinned({ start: 0, end: 4 }, 15, 2, 20)).toEqual({ start: 13, end: 17 });
    });

    it('jumps to a window around a pinned row above the range', () => {
      expect(aroundPinned({ start: 10, end: 14 }, 3, 2, 20)).toEqual({ start: 1, end: 5 });
    });

    it('clamps to the list bounds', () => {
      expect(aroundPinned({ start: 5, end: 9 }, 0, 2, 20)).toEqual({ start: 0, end: 2 });
      expect(aroundPinned({ start: 0, end: 4 }, 19, 2, 20)).toEqual({ start: 17, end: 19 });
    });
  });
});
