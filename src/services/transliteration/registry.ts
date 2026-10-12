import type { ScriptTransliterator } from './types';
import type { TargetScript } from '../../types/mantra';
import { devanagari } from './devanagari';
import { telugu } from './telugu';
import { kannada } from './kannada';
import { tamil } from './tamil';
import { malayalam } from './malayalam';
import { iast } from './iast';

export const SCRIPTS: readonly ScriptTransliterator[] = [devanagari, telugu, kannada, tamil, malayalam, iast];

const BY_ID = new Map<TargetScript, ScriptTransliterator>(SCRIPTS.map((s) => [s.id, s]));

export function getScript(id: TargetScript): ScriptTransliterator | undefined {
  return BY_ID.get(id);
}
