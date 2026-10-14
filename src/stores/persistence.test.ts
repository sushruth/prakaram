import { describe, expect, it } from 'bun:test';
import { boolOr, clampNumber, oneOf, stringList } from './persistence';

describe('stored value validation', () => {
  it('keeps a known value and falls back on anything else', () => {
    expect(oneOf('kannada', ['devanagari', 'kannada'] as const, 'devanagari')).toBe('kannada');
    expect(oneOf('klingon', ['devanagari', 'kannada'] as const, 'devanagari')).toBe('devanagari');
    expect(oneOf(42, ['devanagari'] as const, 'devanagari')).toBe('devanagari');
  });

  it('clamps numbers and rejects non-finite values', () => {
    expect(clampNumber(999, 16, 42, 26)).toBe(42);
    expect(clampNumber(-5, 16, 42, 26)).toBe(16);
    expect(clampNumber(Number.NaN, 16, 42, 26)).toBe(26);
    expect(clampNumber('26', 16, 42, 26)).toBe(26);
  });

  it('accepts only real booleans', () => {
    expect(boolOr(true, false)).toBe(true);
    expect(boolOr('true', false)).toBe(false);
  });

  it('keeps non-empty strings, trims, dedupes and caps', () => {
    expect(stringList([' a ', 'b', 'a', '', 7, null, 'c'], 12)).toEqual(['a', 'b', 'c']);
    expect(stringList('junk', 12)).toEqual([]);
    expect(stringList(Array.from({ length: 20 }, (_, i) => `x${i}`), 12)).toHaveLength(12);
  });
});
