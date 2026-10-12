import { describe, expect, it } from 'bun:test';
import { countAksharas, truncateAksharas } from './aksharas';
import { displayTitle, splitTitle, TITLE_AKSHARA_LIMIT } from './titles';
import { hasSwara } from './swara';

describe('akshara counting', () => {
  it('counts syllables, not code points', () => {
    expect(countAksharas('महापारायणम्')).toBe(7);
    expect(countAksharas('क्ष')).toBe(1);
    expect(countAksharas('ॐ')).toBe(1);
  });

  it('truncates on akshara boundaries', () => {
    expect(truncateAksharas('महापारायणम्', 7)).toBe('महापारायणम्');
    expect(truncateAksharas('महापारायणम्', 3)).toBe('महापा…');
  });
});

describe('titles', () => {
  it('splits Sanskrit from the English note', () => {
    expect(splitTitle('महापारायणम् (Maha Parayanam)')).toEqual({ sanskrit: 'महापारायणम्', english: 'Maha Parayanam' });
  });

  it('limits displayed titles to the longest default title', () => {
    expect(TITLE_AKSHARA_LIMIT).toBeGreaterThanOrEqual(7);
    expect(countAksharas(displayTitle('महापारायणम् (Maha Parayanam)'))).toBeLessThanOrEqual(TITLE_AKSHARA_LIMIT + 1);
  });
});

describe('swara detection', () => {
  it('finds svarita, anudatta and dirgha svarita marks only', () => {
    expect(hasSwara('उ॒तामृ॑त')).toBe(true);
    expect(hasSwara('ॐ गणानां त्वा')).toBe(false);
  });
});
