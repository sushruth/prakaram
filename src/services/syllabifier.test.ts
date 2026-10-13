import { describe, expect, it } from 'bun:test';
import { calculateChunkWeight, END_REST, syllabifyVedic } from './syllabifier';

describe('chunk weight ignores verse-number annotations', () => {
  it('weighs a line with a numbered end mark the same as without it', () => {
    const plain = 'यदन्नेनातिरोहति ॥';
    expect(calculateChunkWeight('यदन्नेनातिरोहति ॥ २ ॥')).toBe(calculateChunkWeight(plain));
  });

  it('ignores Latin digits and pipe-style markers too', () => {
    const plain = 'ॐ नमः शिवाय';
    expect(calculateChunkWeight('|| 12 || ॐ नमः शिवाय')).toBe(calculateChunkWeight(plain));
  });

  it('keeps the pause at a real line end', () => {
    expect(calculateChunkWeight('ॐ नमः ॥')).toBeGreaterThan(calculateChunkWeight('ॐ नमः'));
  });
});

describe('only chant is timed', () => {
  it('ignores Latin text inside a chant line', () => {
    expect(calculateChunkWeight('पsourceरा॒यणम्')).toBe(calculateChunkWeight('परा॒यणम्'));
  });

  it('ignores brackets and stray Latin letters', () => {
    expect(calculateChunkWeight('[ॐ] नमः (शिवाय)')).toBe(calculateChunkWeight('ॐ नमः शिवाय'));
  });

  it('times the Vedic sign ꣳ as a syllable of its own, one matra', () => {
    expect(calculateChunkWeight('नमꣳ')).toBe(calculateChunkWeight('नम') + 1);
  });
});

describe('end rest', () => {
  const total = (t: string) => syllabifyVedic(t).reduce((n, x) => n + x.weight, 0);

  it('a pada with no danda rests one matra at its end', () => {
    expect(calculateChunkWeight('नम॒स्ते रु॒द्र')).toBe(total('नम॒स्ते रु॒द्र') + END_REST);
  });

  it('a printed danda or double danda is the rest and replaces it, so pauses never stack', () => {
    expect(calculateChunkWeight('नम॒स्ते रु॒द्र ।')).toBe(total('नम॒स्ते रु॒द्र ।'));
    expect(calculateChunkWeight('नम॒स्ते रु॒द्र ॥ १ ॥')).toBe(total('नम॒स्ते रु॒द्र ॥ १ ॥'));
  });
});

describe('double svarita', () => {
  it('a full letter carrying the double svarita is one dvimatra, short vowel or not', () => {
    for (const w of ['क᳚', 'कि᳚', 'कु᳚', 'का᳚']) {
      const [t] = syllabifyVedic(w);
      expect(t.weight).toBe(2);
    }
  });
});
