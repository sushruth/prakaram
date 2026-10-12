import type { TargetScript } from '../../types/mantra';

export interface ScriptTransliterator {
  id: TargetScript;
  label: string;
  native: string;
  transliterate(src: string): string;
}
