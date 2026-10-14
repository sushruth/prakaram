import type { TargetScript } from '../../types/mantra';
import { getScript } from './registry';

export { SCRIPTS } from './registry';
export type { ScriptTransliterator } from './types';

/**
 * taittiriya.com writes the Taittirīya "gum" as ꣳ/ꣴ and a nasalised half-consonant as virama + candrabindu.
 * Stock Kannada, Telugu, Malayalam and Tamil fonts draw neither, so write them the way printed editions do:
 * ꣳ/ꣴ as ग्ं and virama + candrabindu as virama + anusvara (anusvara before the swara mark).
 */
const toPrintedNasals = (s: string): string =>
  s.replace(/[\uA8F3\uA8F4]/g, '\u0917\u094D\u0902').replace(/\u094D([\u0951\u0952\u1CDA]*)\u0901/g, '\u094D\u0902$1');

export function transliterateVedic(src: string, target: TargetScript, printedNasals = true): string {
  if (!src) return '';
  if (printedNasals && target !== 'devanagari') src = toPrintedNasals(src);
  // Tamil and IAST write numbers as Arabic digits; the Brahmic scripts map them by offset.
  if (target === 'tamil' || target === 'iast') src = src.replace(/[\u0966-\u096F]/g, (d) => String(d.charCodeAt(0) - 0x966));
  return getScript(target)?.transliterate(src) ?? src;
}
