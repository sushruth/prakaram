import { describe, expect, it } from 'bun:test';
import { minimap, MINIMAP_MAX_CELLS } from './minimap';
import { MantraChunk } from '../types/mantra';

const chunk = (sanskrit: string, kind?: MantraChunk['kind']): MantraChunk => ({ id: sanskrit, chunkNumber: 1, sanskrit, kind });

describe('minimap', () => {
  it('draws one box per syllable, a blank per word gap, and tones from swara marks', () => {
    const [prev, cur] = minimap([chunk('अग्नि मी'), chunk('अ॑ग्नि', 'shloka'), undefined]);
    expect(prev?.lines).toEqual([[{}, {}, { blank: true }, {}]]);
    expect(cur?.className).toBe('line-shloka');
    expect(cur?.lines).toEqual([[{ tone: 'up' }, {}]]);
  });

  it('leaves a missing neighbour null', () => {
    expect(minimap([undefined, chunk('अ'), undefined])[0]).toBeNull();
  });

  it('splits a chunk into the screen lines the page wrapped it into', () => {
    const [, cur] = minimap([undefined, chunk('कक कक कक कक'), undefined], [undefined, [6, 4]]);
    expect(cur?.lines.length).toBe(2);
    expect(cur?.lines[0].length).toBeGreaterThan(cur?.lines[1].length ?? 0);
  });

  it('shrinks all lines by the same ratio so the longest fits', () => {
    const long = chunk('क'.repeat(MINIMAP_MAX_CELLS * 2));
    const short = chunk('क'.repeat(MINIMAP_MAX_CELLS));
    const [a, b] = minimap([long, short, undefined]);
    expect(a?.lines[0].length).toBe(MINIMAP_MAX_CELLS);
    expect(b?.lines[0].length).toBe(MINIMAP_MAX_CELLS / 2);
  });
});
