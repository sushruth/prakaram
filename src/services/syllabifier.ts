import { AksharaToken } from '../types/mantra';

const GURU_VOWELS = new Set(['आ', 'ई', 'ऊ', 'ऋ', 'ॠ', 'ए', 'ऐ', 'ओ', 'औ']);
const GURU_MATRAS = new Set(['ा', 'ी', 'ू', 'ॄ', 'े', 'ै', 'ो', 'ौ']);

// Verse-number annotations such as "॥ २ ॥" or "|| 12 ||" are not chanted. Keep one danda from each so the line keeps its pause.
const VERSE_NUMBER = /[।॥|]*\s*[0-9०-९]+\s*[।॥|]*/g;
// Only Devanagari chant (letters, marks, swara, dandas) is timed. Latin text, brackets and pipes are not.
const NOT_CHANT = /[^\u0900-\u0965\u0970-\u097F\u1CD0-\u1CFF\uA8E0-\uA8FF\s]/g;

// A vowel letter, a vowel sign, the ꣳ sign, or a consonant not closed by virama.
const HAS_NUCLEUS = /[\u0904-\u0914\u093E-\u094C\u0962\u0963\uA8F3\u0950]|ॐ|[\u0915-\u0939](?!\u094D)/;

const ANUDATTA = '\u0952';
const SVARITA = '\u0951';
const DIRGHA_SVARITA = '\u1CDA';

export function syllabifyVedic(text: string): AksharaToken[] {
  if (!text) return [];

  const tokens: AksharaToken[] = [];
  const spoken = text.replace(VERSE_NUMBER, (m) => m.match(/[।॥]+/)?.[0] ?? ' ').replace(NOT_CHANT, ' ');
  const words = spoken.split(/(\s+|[।॥])/);

  for (const word of words) {
    if (!word || /^\s+$/.test(word)) {
      continue;
    }

    if (word === '।') {
      tokens.push({ text: '।', weight: 2.0, swara: 'none' });
      continue;
    }
    if (word === '॥') {
      tokens.push({ text: '॥', weight: 3.5, swara: 'none' });
      continue;
    }

    const wordTokens = tokenizeWord(word);
    // A token with no vowel sound (a bare final consonant, avagraha, chandrabindu) takes no time.
    tokens.push(...wordTokens.map((t) => (HAS_NUCLEUS.test(t.text) ? t : { ...t, weight: 0 })));
  }

  for (let i = 0; i < tokens.length - 1; i++) {
    const curr = tokens[i];
    const next = tokens[i + 1];

    if (curr.weight === 1 && next && isConjunctStart(next.text)) {
      curr.weight = 2;
    }
  }

  return tokens;
}

function tokenizeWord(word: string): AksharaToken[] {
  const result: AksharaToken[] = [];
  let i = 0;
  const len = word.length;

  while (i < len) {
    let char = word[i];

    if (char === 'ॐ') {
      result.push({ text: 'ॐ', weight: 3, swara: 'none' });
      i++;
      continue;
    }

    let syllableText = '';
    let isGuru = false;
    let swara: 'anudatta' | 'svarita' | 'dirgha_svarita' | 'none' = 'none';

    while (i < len) {
      const c = word[i];
      syllableText += c;
      i++;

      if (c >= 'क' && c <= 'ह' && i < len && word[i] === '्') {
        syllableText += word[i];
        i++;
        continue;
      }
      break;
    }

    if (GURU_VOWELS.has(char)) {
      isGuru = true;
    }

    while (i < len) {
      const c = word[i];

      if (GURU_MATRAS.has(c)) {
        isGuru = true;
        syllableText += c;
        i++;
      } else if (c === 'ि' || c === 'ु' || c === 'ृ' || c === 'ॢ') {
        syllableText += c;
        i++;
      } else if (c === 'ं' || c === 'ः') {
        isGuru = true;
        syllableText += c;
        i++;
      } else if (c === ANUDATTA) {
        swara = 'anudatta';
        syllableText += c;
        i++;
      } else if (c === SVARITA) {
        swara = 'svarita';
        syllableText += c;
        i++;
      } else if (c === DIRGHA_SVARITA) {
        swara = 'dirgha_svarita';
        isGuru = true;
        syllableText += c;
        i++;
      } else {
        break;
      }
    }

    result.push({
      text: syllableText,
      weight: isGuru ? 2 : 1,
      swara
    });
  }

  return result;
}

function isConjunctStart(tokenText: string): boolean {
  return tokenText.includes('्');
}

export function calculateChunkWeight(text: string): number {
  const tokens = syllabifyVedic(text);
  return tokens.reduce((sum, t) => sum + t.weight, 0);
}
