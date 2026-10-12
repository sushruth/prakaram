const VIRAMA = '्';
const OM = 'ॐ';

function startsAkshara(ch: string, prev: string): boolean {
  if (ch === OM) return true;
  if (prev === VIRAMA) return false;
  const cp = ch.codePointAt(0) ?? 0;
  const consonant = (cp >= 0x0915 && cp <= 0x0939) || (cp >= 0x0958 && cp <= 0x095f);
  const vowel = cp >= 0x0904 && cp <= 0x0914;
  return consonant || vowel;
}

export function countAksharas(text: string): number {
  let count = 0;
  let prev = '';
  for (const ch of text) {
    if (startsAkshara(ch, prev)) count++;
    prev = ch;
  }
  return count;
}

export function truncateAksharas(text: string, max: number): string {
  let count = 0;
  let prev = '';
  const chars = Array.from(text);
  for (let i = 0; i < chars.length; i++) {
    if (startsAkshara(chars[i], prev)) {
      if (count === max) return chars.slice(0, i).join('').trimEnd() + '…';
      count++;
    }
    prev = chars[i];
  }
  return text;
}
