import type { ScriptTransliterator } from './types';
import type { TargetScript } from '../../types/mantra';

interface BrahmicOffsetOptions {
  id: TargetScript;
  label: string;
  native: string;
  base: number;
  om: string;
}

export function createBrahmicScript({ id, label, native, base, om }: BrahmicOffsetOptions): ScriptTransliterator {
  return {
    id,
    label,
    native,
    transliterate(src) {
      let out = '';
      const len = src.length;
      for (let i = 0; i < len; i++) {
        const c = src.charCodeAt(i);
        if (c === 0x0950) {
          out += om;
        } else if (c === 0x0951 || c === 0x0952 || c === 0x1cda || c === 0x0964 || c === 0x0965) {
          out += src[i];
        } else if ((c >= 0x0901 && c <= 0x094d) || (c >= 0x0960 && c <= 0x0963)) {
          out += String.fromCharCode(base + (c - 0x0900));
        } else {
          out += src[i];
        }
      }
      return out;
    },
  };
}
