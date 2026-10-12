import { describe, expect, it } from 'bun:test';
import { sourcePieces } from './swaraSegments';

describe('sourcePieces', () => {
  it('tones each swara syllable and merges plain runs', () => {
    expect(sourcePieces('उ॒तामृ॑त')).toEqual([
      { text: 'उ॒', tone: 'anudatta' },
      { text: 'ता' },
      { text: 'मृ॑', tone: 'svarita' },
      { text: 'त' },
    ]);
  });

  it('keeps conjuncts whole and tones dirgha svarita', () => {
    expect(sourcePieces('क्ष᳚')).toEqual([{ text: 'क्ष᳚', tone: 'dirgha' }]);
  });

  it('returns a single plain piece when there are no marks', () => {
    expect(sourcePieces('ॐ गणानां')).toEqual([{ text: 'ॐ गणानां' }]);
  });

  it('joins pieces back to the original text', () => {
    const src = 'अग्निमी॒ळे पु॑रोहि॒तं';
    expect(sourcePieces(src).map((p) => p.text).join('')).toBe(src);
  });
});
