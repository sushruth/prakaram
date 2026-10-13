import { describe, expect, it } from 'bun:test';
import { CODE_ALPHABET, CODE_LENGTH, DOMAINS, PAIRS, describeRoom, generateRoomName } from './roomName';

const seeded = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 2 ** 32;
  return seed / 2 ** 32;
};

describe('room name lists', () => {
  it('are complete', () => {
    const n = (d: keyof typeof DOMAINS) => DOMAINS[d].length;
    expect([n('loka'), n('nakshatra'), n('masa'), n('rtu'), n('graha'), n('vasara'), n('disha')]).toEqual([14, 27, 12, 6, 9, 7, 10]);
    expect(DOMAINS.nakshatra[0].en).toBe('Aśvinī');
    expect(DOMAINS.nakshatra[26].en).toBe('Revatī');
  });
  it('have unique ASCII slugs across every domain, and Devanagari forms', () => {
    const all = Object.values(DOMAINS).flat();
    for (const x of all) {
      expect(x.slug).toMatch(/^[a-z]+$/);
      expect(x.sa).toMatch(/^[ऀ-ॿ]+$/);
    }
    expect(new Set(all.map((x) => x.slug)).size).toBe(all.length);
  });
  it('pair two different domains', () => {
    for (const [a, b] of PAIRS) expect(a).not.toBe(b);
  });
});

describe('generateRoomName', () => {
  it('is deterministic with a seeded random', () => {
    expect(generateRoomName(seeded(7))).toEqual(generateRoomName(seeded(7)));
  });
  it('makes URL-safe ids, a code from the alphabet, and never two terms of one domain', () => {
    const rand = seeded(42);
    for (let i = 0; i < 500; i++) {
      const r = generateRoomName(rand);
      expect(r.id).toMatch(/^[a-z]+-[a-z]+-[a-z0-9]+$/);
      expect(r.id).toBe(encodeURIComponent(r.id));
      expect(r.code).toHaveLength(CODE_LENGTH);
      for (const c of r.code) expect(CODE_ALPHABET).toContain(c);
      expect(PAIRS.some(([da, db]) => DOMAINS[da].includes(r.a) && DOMAINS[db].includes(r.b))).toBe(true);
      expect(describeRoom(r.id)).toEqual(r);
    }
  });
  it('uses the real random by default', () => {
    expect(generateRoomName().id).not.toBe(generateRoomName().id);
  });
  it('does not describe a typed name', () => {
    expect(describeRoom('satsang')).toBeNull();
    expect(describeRoom('bhu-krittika-7k2')?.a.en).toBe('Bhū');
    expect(describeRoom('bhu-krittika-0o1')).toBeNull();
  });
});
