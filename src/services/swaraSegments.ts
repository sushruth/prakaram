export type SwaraTone = 'up' | 'down' | 'double';

export interface SourcePiece {
  text: string;
  tone?: SwaraTone;
}

const TONE_BY_MARK: Partial<Record<string, SwaraTone>> = {
  '॑': 'up',
  '॒': 'down',
  '᳚': 'double',
};

const COMBINING = /[ऀ-ःऺ-ॏ॑-ॗॢॣ᳐-᳿]/;
const VIRAMA = '्';
const LETTER = /[ऄ-हक़-य़]/;

export function clusters(text: string): string[] {
  const out: string[] = [];
  for (const ch of text) {
    const last = out.length - 1;
    const joins = COMBINING.test(ch) || (last >= 0 && out[last].endsWith(VIRAMA) && LETTER.test(ch));
    if (last >= 0 && joins) out[last] += ch;
    else out.push(ch);
  }
  return out;
}

export const toneOf = (cluster: string): SwaraTone | undefined => [...cluster].map((ch) => TONE_BY_MARK[ch]).find(Boolean);

// Splits Devanagari source into pieces. Each syllable that carries a swara mark
// becomes its own piece with a tone; everything else is merged into plain runs.
// Cuts only fall between syllables, never inside a conjunct, so shaping is kept.
export function sourcePieces(text: string): SourcePiece[] {
  const pieces: SourcePiece[] = [];
  for (const cluster of clusters(text)) {
    const tone = toneOf(cluster);
    const prev = pieces[pieces.length - 1];
    if (!tone && prev && !prev.tone) prev.text += cluster;
    else pieces.push(tone ? { text: cluster, tone } : { text: cluster });
  }
  return pieces;
}
