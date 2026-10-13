import { describe, expect, it } from 'bun:test';
import type { SuktaSection } from '../types/mantra';
import { padyas, printedNumeral } from './padya';

const sec = (...lines: string[]): SuktaSection => ({ id: 's', title: 't', sectionNumber: 1, chunks: lines.map((l, i) => ({ id: `c${i}`, chunkNumber: i + 1, sanskrit: l })) });

describe('printedNumeral', () => {
  it('reads numerals in any script, only at the end of a pada', () => {
    expect(printedNumeral('अ ॥ १२ ॥')).toBe(12);
    expect(printedNumeral('a ॥ 7 ॥')).toBe(7);
    expect(printedNumeral('அ ॥ ௩ ॥')).toBe(3);
    expect(printedNumeral('ಅ ॥ ೧೦ ॥')).toBe(10);
    expect(printedNumeral('अ ॥ ३ ॥ आ')).toBeUndefined();
    expect(printedNumeral('अ ॥')).toBeUndefined();
  });
});

describe('padyas', () => {
  it('groups padas under the printed number at their end', () => {
    expect(padyas(sec('a', 'b ॥ १ ॥', 'c', 'd', 'e ॥ २ ॥'))).toEqual([{ number: 1, from: 1, to: 2 }, { number: 2, from: 3, to: 5 }]);
  });
  it('has no padya level for none or one numeral (the anuvāka number)', () => {
    expect(padyas(sec('a', 'b'))).toBeNull();
    expect(padyas(sec('a', 'b ॥ ३ ॥'))).toBeNull();
  });
  it('keeps gaps as printed and leaves trailing padas outside any padya', () => {
    expect(padyas(sec('a ॥ 2 ॥', 'b ॥ 5 ॥', 'c'))).toEqual([{ number: 2, from: 1, to: 1 }, { number: 5, from: 2, to: 2 }]);
  });
  it('ignores a repeated or lower numeral as a boundary', () => {
    expect(padyas(sec('a ॥ १ ॥', 'b ॥ १ ॥', 'c ॥ २ ॥'))).toEqual([{ number: 1, from: 1, to: 1 }, { number: 2, from: 2, to: 3 }]);
    expect(padyas(sec('a ॥ १ ॥', 'b ॥ १ ॥'))).toBeNull();
  });
});
