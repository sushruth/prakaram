import { describe, expect, test } from 'bun:test';
import { splitAtDanda, splitForReading, splitLong } from './chunking';
import { MantraChunk } from '../types/mantra';

const chunk = (id: string, sanskrit: string, isInstruction = false): MantraChunk => ({
  id,
  chunkNumber: 1,
  sanskrit,
  isInstruction,
});

describe('chunking', () => {
  test('splits at danda and keeps the mark with the phrase', () => {
    expect(splitAtDanda('अ आ । इ ई ॥')).toEqual(['अ आ ।', 'इ ई ॥']);
  });

  test('breaks a long phrase near target at a word boundary', () => {
    const pieces = splitLong('aaaa bbbb cccc dddd eeee ffff gggg', 10);
    expect(pieces.every((p) => p.length <= 15)).toBe(true);
    expect(pieces.join(' ')).toBe('aaaa bbbb cccc dddd eeee ffff gggg');
  });

  test('pieces inherit the instruction badge only on the first piece', () => {
    const out = splitForReading([chunk('x', 'अ आ । इ ई ॥', true)]);
    expect(out.map((c) => c.id)).toEqual(['x-0', 'x-1']);
    expect(out.map((c) => c.isInstruction)).toEqual([true, false]);
  });
});
