import { describe, expect, it } from 'bun:test';
import { BURST, burstStrength, channelRange } from './FlameMark';

describe('flame bursts', () => {
  it('envelope is zero before the burst starts, at its end and after it', () => {
    expect(burstStrength(100, 500, 400, 1)).toBe(0);
    expect(burstStrength(900, 500, 400, 1)).toBe(0);
    expect(burstStrength(1200, 500, 400, 1)).toBe(0);
  });

  it('envelope peaks at the start and decays linearly across the burst', () => {
    expect(burstStrength(500, 500, 400, 0.8)).toBeCloseTo(0.8);
    expect(burstStrength(700, 500, 400, 0.8)).toBeCloseTo(0.4);
    expect(burstStrength(899, 500, 400, 0.8)).toBeGreaterThan(0);
  });

  it('channel ranges stay calm at rest and widen by BURST.spread at full burst', () => {
    expect(channelRange([0.5, 1.5], 0)).toEqual([0.5, 1.5]);
    expect(channelRange([-3, 3], 0)).toEqual([-3, 3]);

    const [lo, hi] = channelRange([0.5, 1.5], 1);
    expect(hi - lo).toBeCloseTo((1.5 - 0.5) * BURST.spread);
    expect((lo + hi) / 2).toBeCloseTo(1);
  });

  it('burst tuning keeps the hot interval faster than the calm interval', () => {
    expect(BURST.hotInterval[0]).toBeLessThan(BURST.calmInterval[0]);
    expect(BURST.hotInterval[1]).toBeLessThan(BURST.calmInterval[1]);
    expect(BURST.spread).toBeGreaterThan(1);
    expect(BURST.rush).toBeGreaterThan(1);
  });
});
