import { describe, expect, it } from 'bun:test';
import { calculateChunkWeight } from './syllabifier';

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

describe('tokens without a vowel sound take no time', () => {
  it('a bare word-final consonant adds nothing, and closes the syllable before it', () => {
    expect(calculateChunkWeight('सहस्रपात्')).toBe(calculateChunkWeight('सहस्रपा'));
    expect(calculateChunkWeight('अग्निम्')).toBe(4);
  });

  it('avagraha and chandrabindu take no time', () => {
    expect(calculateChunkWeight('नमः ऽ')).toBe(calculateChunkWeight('नमः'));
    expect(calculateChunkWeight('नमः ँ')).toBe(calculateChunkWeight('नमः'));
  });
});
