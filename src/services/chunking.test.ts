import { describe, expect, test } from 'bun:test';
import { splitAtDanda, splitForReading, splitVerseNumber } from './chunking';
import { devanagariToIast, iastToDevanagari } from './transliteration/iastCodec';
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

  test('a long phrase with no daṇḍa stays whole', () => {
    const long = 'aaaa bbbb cccc dddd eeee ffff gggg hhhh iiii jjjj ।';
    expect(splitForReading([chunk('x', 'अ ।'), chunk('y', long)]).map((c) => c.sanskrit)).toEqual(['अ ।', long]);
  });

  test('pieces keep their kind and only the first piece leads', () => {
    const out = splitForReading([chunk('x', 'अ आ । इ ई ॥', 'shloka')]);
    expect(out.map((c) => c.id)).toEqual(['x-0', 'x-1']);
    expect(out.map((c) => c.kind)).toEqual(['shloka', 'shloka']);
    expect(out.map((c) => c.isLead)).toEqual([true, false]);
  });
});

describe('verse numbers', () => {
  const d = iastToDevanagari;
  test('a printed verse number stays with the phrase before it', () => {
    const out = splitForReading([chunk('x', d('vārayante || 3 || etonvindram |'), 'mantra')]);
    expect(out.map((c) => devanagariToIast(c.sanskrit))).toEqual(['vārayante || 3 ||', 'etonvindram |']);
  });

  test('splitVerseNumber separates the unspoken number', () => {
    expect(splitVerseNumber(d('vārayante || 3 ||')).map(devanagariToIast)).toEqual(['vārayante', ' || 3 ||']);
  });
});
