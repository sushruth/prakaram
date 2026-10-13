import { AksharaToken } from '../types/mantra';

const GURU_VOWELS = new Set(['आ', 'ई', 'ऊ', 'ऋ', 'ॠ', 'ए', 'ऐ', 'ओ', 'औ']);
const GURU_MATRAS = new Set(['ा', 'ी', 'ू', 'ॄ', 'े', 'ै', 'ो', 'ौ']);

// Verse-number annotations such as "॥ २ ॥" or "|| 12 ||" are not chanted. Keep one danda from each so the line keeps its pause.
const VERSE_NUMBER = /[।॥|]*\s*[0-9०-९]+\s*[।॥|]*/g;
// Only Devanagari chant (letters, marks, swara, dandas) is timed. Latin text, brackets and pipes are not.
const NOT_CHANT = /[^\u0900-\u0965\u0970-\u097F\u1CD0-\u1CFF\uA8E0-\uA8FF\s]/g;

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
    tokens.push(...wordTokens);
  }

  for (let i = 0; i < tokens.length - 1; i++) {
    const curr = tokens[i];
    const next = tokens[i + 1];

    if (curr.weight === 1 && !curr.text.includes('्') && next && isConjunctStart(next.text)) {
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

    // Half letters (a consonant with a virama) are beats of their own: half a mātrā bare, one with a swara, two with the
    // double svarita. The syllable that follows is then just its own consonant and vowel.
    while (i + 1 < len && word[i] >= 'क' && word[i] <= 'ह' && word[i + 1] === '्') {
      let halfText = word[i] + word[i + 1];
      i += 2;
      let halfSwara: 'anudatta' | 'svarita' | 'dirgha_svarita' | 'none' = 'none';
      while (i < len && (word[i] === ANUDATTA || word[i] === SVARITA || word[i] === DIRGHA_SVARITA)) {
        halfSwara = word[i] === ANUDATTA ? 'anudatta' : word[i] === SVARITA ? 'svarita' : 'dirgha_svarita';
        halfText += word[i];
        i++;
      }
      result.push({ text: halfText, weight: halfSwara === 'none' ? 0.5 : halfSwara === 'dirgha_svarita' ? 2 : 1, swara: halfSwara });
    }
    if (i >= len) continue;
    char = word[i];

    let syllableText = char;
    i++;
    let isGuru = false;
    let swara: 'anudatta' | 'svarita' | 'dirgha_svarita' | 'none' = 'none';

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

// Every pada (and so every padya, which ends on a pada) rests one mātrā at its end. A printed danda or double danda
// already is that rest and is longer, so it replaces the rest instead of adding to it: pauses never stack.
export const END_REST = 1;

export function calculateChunkWeight(text: string): number {
  const tokens = syllabifyVedic(text);
  const sum = tokens.reduce((total, t) => total + t.weight, 0);
  const last = tokens[tokens.length - 1];
  const endsOnPause = last !== undefined && (last.text === '।' || last.text === '॥');
  return endsOnPause ? sum : sum + END_REST;
}
