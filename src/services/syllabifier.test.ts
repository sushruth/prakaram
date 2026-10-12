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
