import { describe, expect, test } from 'bun:test';
import { splitAtDanda, splitForReading, splitLong } from './chunking';
import { MantraChunk } from '../types/mantra';

const chunk = (id: string, sanskrit: string, kind: MantraChunk['kind'] = 'vakya'): MantraChunk => ({
  id,
  chunkNumber: 1,
  sanskrit,
  kind,
  isLead: true,
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

  test('pieces keep their kind and only the first piece leads', () => {
    const out = splitForReading([chunk('x', 'अ आ । इ ई ॥', 'shloka')]);
    expect(out.map((c) => c.id)).toEqual(['x-0', 'x-1']);
    expect(out.map((c) => c.kind)).toEqual(['shloka', 'shloka']);
    expect(out.map((c) => c.isLead)).toEqual([true, false]);
  });
});
