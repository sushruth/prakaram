import { AksharaToken } from '../types/mantra';

// Long vowels that make a syllable Guru
const GURU_VOWELS = new Set(['आ', 'ई', 'ऊ', 'ऋ', 'ॠ', 'ए', 'ऐ', 'ओ', 'औ']);
const GURU_MATRAS = new Set(['ा', 'ी', 'ू', 'ॄ', 'े', 'ै', 'ो', 'ौ']);

// Vedic accent marks
const ANUDATTA = '\u0952';
const SVARITA = '\u0951';
const DIRGHA_SVARITA = '\u1CDA';

/**
 * Syllabifies Devanagari text into Akshara tokens and calculates exact
 * Chandaḥ-śāstra prosodic matra weights (Laghu = 1, Guru = 2, Pluta = 3).
 */
export function syllabifyVedic(text: string): AksharaToken[] {
  if (!text) return [];

  const tokens: AksharaToken[] = [];
  const words = text.split(/(\s+|[।॥])/);

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

    // Tokenize word into syllables
    const wordTokens = tokenizeWord(word);
    tokens.push(...wordTokens);
  }

  // Second pass: apply Samyoga (conjunct consonant) rule
  // A short vowel becomes Guru if followed by a conjunct consonant (samyoga)
  for (let i = 0; i < tokens.length - 1; i++) {
    const curr = tokens[i];
    const next = tokens[i + 1];

    if (curr.weight === 1 && next && isConjunctStart(next.text)) {
      curr.weight = 2; // Made Guru by position
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

    // Handle Om
    if (char === 'ॐ') {
      result.push({ text: 'ॐ', weight: 3, swara: 'none' });
      i++;
      continue;
    }

    let syllableText = '';
    let isGuru = false;
    let swara: 'anudatta' | 'svarita' | 'dirgha_svarita' | 'none' = 'none';

    // Consume base consonant cluster with viramas (e.g., k-sh-v-a)
    while (i < len) {
      const c = word[i];
      syllableText += c;
      i++;

      // If consonant followed by virama, keep attaching next consonant
      if (c >= 'क' && c <= 'ह' && i < len && word[i] === '्') {
        syllableText += word[i]; // add virama
        i++;
        continue;
      }
      break;
    }

    // Check independent vowel
    if (GURU_VOWELS.has(char)) {
      isGuru = true;
    }

    // Check vowel matras, anusvara, visarga, accents
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
        // Anusvara or Visarga makes syllable Guru
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
        isGuru = true; // Dirgha svarita is inherently long
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

/**
 * Calculates total matra weight of an entire Sanskrit chunk
 */
export function calculateChunkWeight(text: string): number {
  const tokens = syllabifyVedic(text);
  return tokens.reduce((sum, t) => sum + t.weight, 0);
}
