import { TargetScript } from '../types/mantra';

const SCRIPT_BASES: Record<string, number> = {
  telugu: 0x0c00,
  kannada: 0x0c80,
  malayalam: 0x0d00,
};

const OM_MAP: Record<TargetScript, string> = {
  devanagari: 'ॐ',
  telugu: 'ఓం',
  kannada: 'ಓಂ',
  malayalam: 'ഓം',
  tamil: 'ௐ',
  iast: 'oṃ',
};

const TAMIL_MAP: Record<string, string> = {
  'अ': 'அ', 'आ': 'ஆ', 'इ': 'இ', 'ई': 'ஈ', 'உ': 'உ', 'ऊ': 'ஊ',
  'ऋ': 'ரு', 'ॠ': 'ரூ', 'ए': 'ஏ', 'ऐ': 'ஐ', 'ओ': 'ஓ', 'औ': 'ஔ',
  'ा': 'ா', 'ि': 'ி', 'ी': 'ீ', 'ु': 'ு', 'ू': 'ூ',
  'ृ': '்ரு', 'ॄ': '்ரூ', 'े': 'ே', 'ै': 'ை', 'ो': 'ோ', 'ौ': 'ௌ',
  '्': '்', 'ं': 'ம்', 'ः': 'ஃ',
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

export function transliterateVedic(src: string, target: TargetScript): string {
  if (!src) return '';
  if (target === 'devanagari') return src;

  if (target === 'telugu' || target === 'kannada' || target === 'malayalam') {
    const base = SCRIPT_BASES[target];
    let out = '';
    const len = src.length;
    for (let i = 0; i < len; i++) {
      const c = src.charCodeAt(i);
      if (c === 0x0950) {
        out += OM_MAP[target];
      } else if (c === 0x0951 || c === 0x0952 || c === 0x1cda || c === 0x0964 || c === 0x0965) {
        out += src[i];
      } else if ((c >= 0x0901 && c <= 0x094d) || (c >= 0x0960 && c <= 0x0963)) {
        out += String.fromCharCode(base + (c - 0x0900));
      } else {
        out += src[i];
      }
    }
    return out;
  }

  if (target === 'tamil') {
    let out = '';
    let i = 0;
    const len = src.length;
    while (i < len) {
      const ch = src[i];
      if (ch === 'ॐ') {
        out += OM_MAP.tamil;
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

  if (target === 'iast') {
    let out = '';
    let i = 0;
    const n = src.length;
    while (i < n) {
      const ch = src[i];
      if (ch === 'ॐ') {
        out += OM_MAP.iast;
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
      if (ch === 'ः') { out += 'ḥ'; i++; continue; }
      if (ch === '।') { out += ' | '; i++; continue; }
      if (ch === '॥') { out += ' || '; i++; continue; }
      out += ch;
      i++;
    }
    return out;
  }

  return src;
}
