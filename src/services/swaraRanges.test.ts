import { describe, expect, it } from 'bun:test';
import { vedicText } from './swaraRanges';
import { sourcePieces } from './swaraSegments';
import { transliterateVedic } from './transliteration';
import type { TargetScript } from '../types/mantra';

// उ॒ (anudātta) ता (plain) मृ॑ (svarita) त (plain).
const SWARA_LINE = 'उ॒तामृ॑त';
const SCRIPTS: TargetScript[] = ['devanagari', 'telugu', 'kannada', 'malayalam', 'tamil', 'iast'];

describe('vedicText', () => {
  it('returns the whole line and no ranges when the line carries no swara', () => {
    const { text, ranges } = vedicText('ॐ गणानां', 'iast');
    expect(ranges).toEqual([]);
    expect(text).toBe('oṃ gaṇānāṃ');
  });

  it('indexes the swara syllables in the transliterated output (IAST)', () => {
    const { text, ranges } = vedicText(SWARA_LINE, 'iast');
    expect(ranges).toEqual([
      { tone: 'down', start: 0, end: 2 },
      { tone: 'up', start: 4, end: 7 },
    ]);
    // u + combining macron below, and m + ṛ + combining acute.
    expect(text.slice(0, 2)).toBe('u\u0331');
    expect(text.slice(4, 7)).toBe('mṛ\u0301');
  });

  it('uses output offsets, which differ from the Devanagari lengths (Tamil)', () => {
    const devanagari = vedicText(SWARA_LINE, 'devanagari');
    const tamil = vedicText(SWARA_LINE, 'tamil');
    // The up syllable grows from 3 Devanagari code units to 5 Tamil ones (ம + ் + ர + ு + ॑).
    expect(tamil.ranges).toEqual([
      { tone: 'down', start: 0, end: 2 },
      { tone: 'up', start: 4, end: 9 },
    ]);
    expect(tamil.text.slice(4, 9)).toBe('ம்ரு॑');
    expect(tamil.text.length).not.toBe(devanagari.text.length);
  });

  it('keeps the concatenated pieces equal to the whole transliterated text', () => {
    for (const script of SCRIPTS) {
      const { text } = vedicText(SWARA_LINE, script);
      const joined = sourcePieces(SWARA_LINE).map((p) => transliterateVedic(p.text, script)).join('');
      expect(joined).toBe(text);
    }
  });

  it('keeps the non-breaking-space normalisation of a danda', () => {
    const { text, ranges } = vedicText('नमः । 1 ॥', 'devanagari');
    expect(text).toBe('नमः\u00A0।\u00A01\u00A0॥');
    expect(ranges).toEqual([]);
  });
});
