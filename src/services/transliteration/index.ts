import type { TargetScript } from '../../types/mantra';
import { getScript } from './registry';

export { SCRIPTS } from './registry';
export type { ScriptTransliterator } from './types';

export function transliterateVedic(src: string, target: TargetScript): string {
  if (!src) return '';
  return getScript(target)?.transliterate(src) ?? src;
}
