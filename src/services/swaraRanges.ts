import { hasSwara } from './swara';
import { sourcePieces, type SwaraTone } from './swaraSegments';
import { transliterateVedic } from './transliteration';
import type { TargetScript } from '../types/mantra';

/** One swara syllable's span in the transliterated line, in UTF-16 code units. */
export interface SwaraRange {
  tone: SwaraTone;
  /** Inclusive start offset into `text`. */
  start: number;
  /** Exclusive end offset into `text`. */
  end: number;
}

/**
 * The line as the reader shows it: the Devanagari source transliterated to `script`, plus the
 * character range of every swara syllable in that transliterated string.
 *
 * Offsets are in the output, whose length differs per script, so they are accumulated from each
 * piece's transliterated length — never from its source length. Pieces are cut only between
 * syllables, so their transliterations concatenate to the whole line's.
 */
export function vedicText(raw: string, script: TargetScript, printedNasals = true): { text: string; ranges: SwaraRange[] } {
  // Non-breaking spaces keep a danda with the word before it and with its verse number.
  const sanskrit = raw.replace(/ ([।॥])/g, '\u00A0$1').replace(/([।॥]) (\d)/g, '$1\u00A0$2');
  const text = transliterateVedic(sanskrit, script, printedNasals);
  if (!hasSwara(sanskrit)) return { text, ranges: [] };
  const ranges: SwaraRange[] = [];
  let offset = 0;
  for (const piece of sourcePieces(sanskrit)) {
    const length = transliterateVedic(piece.text, script, printedNasals).length;
    if (piece.tone) ranges.push({ tone: piece.tone, start: offset, end: offset + length });
    offset += length;
  }
  return { text, ranges };
}
