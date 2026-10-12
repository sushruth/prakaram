import type { TargetScript } from '../../types/mantra';
import { getScript } from './registry';

export { SCRIPTS } from './registry';
export type { ScriptTransliterator } from './types';

export function transliterateVedic(src: string, target: TargetScript): string {
  if (!src) return '';
  // Tamil and IAST write numbers as Arabic digits; the Brahmic scripts map them by offset.
  if (target === 'tamil' || target === 'iast') src = src.replace(/[\u0966-\u096F]/g, (d) => String(d.charCodeAt(0) - 0x966));
  return getScript(target)?.transliterate(src) ?? src;
}
