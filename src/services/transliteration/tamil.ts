import type { ScriptTransliterator } from './types';

const TAMIL_MAP: Record<string, string> = {
  'अ': 'அ', 'आ': 'ஆ', 'इ': 'இ', 'ई': 'ஈ', 'உ': 'உ', 'ऊ': 'ஊ',
  'ऋ': 'ரு', 'ॠ': 'ரூ', 'ए': 'ஏ', 'ऐ': 'ஐ', 'ओ': 'ஓ', 'औ': 'ஔ',
  'ा': 'ா', 'ि': 'ி', 'ी': 'ீ', 'ु': 'ு', 'ू': 'ூ',
  'ृ': '்ரு', 'ॄ': '்ரூ', 'े': 'ே', 'ै': 'ை', 'ो': 'ோ', 'ौ': 'ௌ',
  '्': '்', 'ं': 'ம்', 'ँ': 'ம்', 'ः': 'ஃ',
};

const TAMIL_CONS: Record<string, [string, number]> = {
  'क': ['க', 1], 'ख': ['க', 2], 'ग': ['க', 3], 'घ': ['க', 4], 'ङ': ['ங', 1],
  'च': ['ச', 1], 'छ': ['ச', 2], 'ज': ['ஜ', 1], 'झ': ['ஜ', 2], 'ञ': ['ஞ', 1],
  'ट': ['ட', 1], 'ठ': ['ட', 2], 'ड': ['ட', 3], 'ढ': ['ட', 4], 'ण': ['ண', 1],
  'त': ['த', 1], 'थ': ['த', 2], 'द': ['த', 3], 'ध': ['த', 4], 'न': ['ந', 1],
  'प': ['ப', 1], 'फ': ['ப', 2], 'ब': ['ப', 3], 'भ': ['ப', 4], 'म': ['ம', 1],
  'य': ['ய', 1], 'र': ['ர', 1], 'ल': ['ல', 1], 'व': ['வ', 1],
  'श': ['ஶ', 1], 'ष': ['ஷ', 1], 'स': ['ஸ', 1], 'ह': ['ஹ', 1],
  'ळ': ['ள', 1], 'ऴ': ['ழ', 1],
};

const SUBSCRIPTS = ['', '', '₂', '₃', '₄'];

const OM = 'ௐ';

function transliterateTamil(src: string): string {
    let out = '';
    let i = 0;
    const len = src.length;
    while (i < len) {
      const ch = src[i];
      if (ch === 'ॐ') {
        out += OM;
        i++;
        continue;
      }
      if (TAMIL_CONS[ch]) {
        const [tBase, grade] = TAMIL_CONS[ch];
        const num = grade > 1 ? SUBSCRIPTS[grade] : '';
        out += tBase;
        i++;
        let virama = '';
        let matra = '';
        let swaras = '';
        while (i < len) {
          const c2 = src[i];
          if (c2 === '्') {
            virama = '்';
            i++;
          } else if (TAMIL_MAP[c2] && ((c2 >= 'ा' && c2 <= 'ौ') || c2 === 'ृ' || c2 === 'ॄ')) {
            matra = TAMIL_MAP[c2];
            i++;
          } else if (c2 === '\u0951' || c2 === '\u0952' || c2 === '\u1cda') {
            swaras += c2;
            i++;
          } else {
            break;
          }
        }
        out += (virama || matra) + swaras + num;
        continue;
      }
      if (TAMIL_MAP[ch]) {
        out += TAMIL_MAP[ch];
        i++;
        continue;
      }
      out += ch;
      i++;
    }
    return out;
}

export const tamil: ScriptTransliterator = {
  id: 'tamil',
  label: 'Tamil',
  native: 'தமிழ்',
  transliterate: transliterateTamil,
};
