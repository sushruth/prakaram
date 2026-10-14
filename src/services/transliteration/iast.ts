import type { ScriptTransliterator } from './types';

const IAST_VOWELS: Record<string, string> = {
  'अ': 'a', 'आ': 'ā', 'इ': 'i', 'ई': 'ī', 'उ': 'u', 'ऊ': 'ū',
  'ऋ': 'ṛ', 'ॠ': 'ṝ', 'ऌ': 'ḷ', 'ॡ': 'ḹ',
  'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au',
};
const IAST_MATRAS: Record<string, string> = {
  'ा': 'ā', 'ि': 'i', 'ी': 'ī', 'ु': 'u', 'ू': 'ū',
  'ृ': 'ṛ', 'ॄ': 'ṝ', 'ॢ': 'ḷ', 'ॣ': 'ḹ',
  'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au',
};
const IAST_CONS: Record<string, string> = {
  'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'ṅ',
  'च': 'c', 'छ': 'ch', 'ज': 'j', 'झ': 'jh', 'ञ': 'ñ',
  'ट': 'ṭ', 'ठ': 'ṭh', 'ड': 'ḍ', 'ढ': 'ḍh', 'ण': 'ṇ',
  'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
  'प': 'p', 'फ': 'ph', 'ब': 'b', 'भ': 'bh', 'म': 'm',
  'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v',
  'श': 'ś', 'ष': 'ṣ', 'स': 's', 'ह': 'h',
  'ळ': 'ḷ', 'ऴ': 'ḻ',
};
const IAST_SWARAS: Record<string, string> = {
  '\u0951': '\u0301',
  '\u0952': '\u0331',
  '\u1cda': '\u030b',
};

const OM = 'oṃ';

function transliterateIast(src: string): string {
    let out = '';
    let i = 0;
    const n = src.length;
    while (i < n) {
      const ch = src[i];
      if (ch === 'ॐ') {
        out += OM;
        i++;
        continue;
      }
      if (IAST_VOWELS[ch]) {
        let v = IAST_VOWELS[ch];
        i++;
        while (i < n && IAST_SWARAS[src[i]]) {
          v += IAST_SWARAS[src[i]];
          i++;
        }
        out += v;
        continue;
      }
      if (IAST_CONS[ch]) {
        const c = IAST_CONS[ch];
        i++;
        let hasVirama = false;
        let matraStr = '';
        let swaraStr = '';
        while (i < n) {
          const c2 = src[i];
          if (c2 === '्') {
            hasVirama = true;
            i++;
          } else if (IAST_MATRAS[c2]) {
            matraStr = IAST_MATRAS[c2];
            i++;
          } else if (IAST_SWARAS[c2]) {
            swaraStr += IAST_SWARAS[c2];
            i++;
          } else {
            break;
          }
        }
        if (hasVirama) {
          out += c + swaraStr;
        } else if (matraStr) {
          out += c + matraStr + swaraStr;
        } else {
          out += c + 'a' + swaraStr;
        }
        continue;
      }
      if (ch === 'ं') { out += 'ṃ'; i++; continue; }
      if (ch === 'ँ') { out += 'm\u0310'; i++; continue; }
      if (ch === 'ः') { out += 'ḥ'; i++; continue; }
      if (ch === '।') { out += ' | '; i++; continue; }
      if (ch === '॥') { out += ' || '; i++; continue; }
      out += ch;
      i++;
    }
    return out;
}

export const iast: ScriptTransliterator = {
  id: 'iast',
  label: 'IAST Roman',
  native: 'IAST',
  transliterate: transliterateIast,
};
