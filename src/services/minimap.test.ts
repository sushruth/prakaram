import { describe, expect, it } from 'bun:test';
import { minimap } from './minimap';
import { MantraChunk } from '../types/mantra';

const chunk = (sanskrit: string, kind?: MantraChunk['kind']): MantraChunk => ({ id: sanskrit, chunkNumber: 1, sanskrit, kind });

describe('minimap', () => {
  it('sizes rows against the longest line and splits words', () => {
    const [prev, cur, next] = minimap([chunk('ab cd'), chunk('abcdefghij', 'shloka'), chunk('abc')]);
    expect(prev).toEqual({ className: 'line-mantra', widthPct: 50, words: [2, 2] });
    expect(cur).toEqual({ className: 'line-shloka', widthPct: 100, words: [10] });
    expect(next?.widthPct).toBe(30);
  });

  it('leaves a missing neighbour null', () => {
    expect(minimap([undefined, chunk('ab'), undefined])).toEqual([null, { className: 'line-mantra', widthPct: 100, words: [2] }, null]);
  });
});
