/**
 * The storage IAST of src/services/transliteration/iastCodec.ts, written in NFD with swara marks last,
 * so the decoder can match after normalising its input the same way. Combining marks are escaped
 * because they are invisible in an editor.
 */
export const SEPARATOR = '·';

export const VIRAMA = '्';

/** [independent vowel, vowel sign ('' for the inherent a), IAST]. */
export const VOWELS: [string, string, string][] = [
  ['अ', '', 'a'],
  ['आ', 'ा', 'ā'],
  ['इ', 'ि', 'i'],
  ['ई', 'ी', 'ī'],
  ['उ', 'ु', 'u'],
  ['ऊ', 'ू', 'ū'],
  ['ऋ', 'ृ', 'ṛ'],
  ['ॠ', 'ॄ', 'ṝ'],
  ['ऌ', 'ॢ', 'l̥'],
  ['ॡ', 'ॣ', 'l̥̄'],
  ['ए', 'े', 'e'],
  ['ऐ', 'ै', 'ai'],
  ['ओ', 'ो', 'o'],
  ['औ', 'ौ', 'au'],
];

const CONSONANT_LETTERS = 'कखगघङचछजझञटठडढणतथदधनपफबभमयरलवशषसहळऴ';
const CONSONANT_IAST = [
  'k', 'kh', 'g', 'gh', 'ṅ',
  'c', 'ch', 'j', 'jh', 'ñ',
  'ṭ', 'ṭh', 'ḍ', 'ḍh', 'ṇ',
  't', 'th', 'd', 'dh', 'n',
  'p', 'ph', 'b', 'bh', 'm',
  'y', 'r', 'l', 'v',
  'ś', 'ṣ', 's', 'h',
  'ḷ', 'ḻ',
];
export const CONSONANTS: [string, string][] = [...CONSONANT_LETTERS].map((c, i) => [c, CONSONANT_IAST[i]]);

/** Svarita, anudātta and dīrgha svarita, as the vertical line above, the plus below and the double line above. */
export const SWARAS: [string, string][] = [
  ['॑', '̍'],
  ['॒', '̠'],
  ['᳚', '̎'],
];

/** Signs that stand on their own: nasals, visarga, avagraha, oṃ, dandas, the Taittirīya gum, digits. */
export const SIGNS: [string, string][] = [
  ['ं', 'ṃ'],
  ['ः', 'ḥ'],
  ['ँ', 'm̐'],
  ['ऽ', "'"],
  ['ॐ', 'ōṃ'],
  ['।', '|'],
  ['॥', '||'],
  ['ꣳ', 'gͫ'],
  ['ꣴ', 'gͫͫ'],
  ...[...'०१२३४५६७८९'].map((d, i): [string, string] => [d, String(i)]),
];

/** Spellings people type that the encoder never writes: ṁ is the common anusvara. [Devanagari, IAST]. */
export const DECODE_ALIASES: [string, string][] = [['ं', 'ṁ']];

export const SWARA_IAST = new Set(SWARAS.map(([, i]) => i));
