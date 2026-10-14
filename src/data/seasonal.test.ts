import { describe, expect, it } from 'bun:test';
import { DEFAULT_PRAKARAS } from './defaultPrakaras';
import { LIVE_SOURCES } from './liveSources';
import { SEASONS, seasonAt, seasonalPicks } from './seasonal';
import { TOP_BROWSED } from './topBrowsed';

// Every id the home can link to: a live source or a default composition. Placeholder picks must resolve.
const known = new Set([...LIVE_SOURCES.map((s) => s.id), ...DEFAULT_PRAKARAS.map((p) => p.id)]);

describe('seasonal picks (placeholder)', () => {
  it('covers every calendar month exactly once', () => {
    const months = SEASONS.flatMap((s) => s.months).sort((a, b) => a - b);
    expect(months).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it('returns the season for a date', () => {
    expect(seasonAt(new Date(2026, 9, 14)).name).toContain('Śarad'); // October
    expect(seasonAt(new Date(2026, 0, 5)).name).toContain('Śiśira'); // January
    expect(seasonAt(new Date(2026, 6, 1)).name).toContain('Varṣā'); // July
  });

  it('links only to known source or composition ids', () => {
    for (const s of SEASONS) for (const p of s.picks) expect(known.has(p.id)).toBe(true);
  });

  it('seasonalPicks is the picks of seasonAt', () => {
    const now = new Date(2026, 9, 14);
    expect(seasonalPicks(now)).toEqual(seasonAt(now).picks);
  });
});

describe('top browsed (placeholder)', () => {
  it('is non-empty and links only to known ids', () => {
    expect(TOP_BROWSED.length).toBeGreaterThan(0);
    for (const p of TOP_BROWSED) expect(known.has(p.id)).toBe(true);
  });
});
