import { MantraChunk } from '../types/mantra';

// Split after each danda (।) or double danda (॥), keeping the mark with the phrase before it.
export function splitAtDanda(text: string): string[] {
  return text
    .split(/(?<=[।॥])\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[sorted.length >> 1] ?? 0;
}

// Break a phrase longer than 1.5× target at the word boundary nearest the target.
export function splitLong(text: string, target: number): string[] {
  if (text.length <= target * 1.5) return [text];

  const spaces: number[] = [];
  for (let i = 0; i < text.length; i++) if (text[i] === ' ') spaces.push(i);
  if (spaces.length === 0) return [text];

  const cut = spaces.reduce((best, i) => (Math.abs(i - target) < Math.abs(best - target) ? i : best), spaces[0]);
  return [text.slice(0, cut).trim(), ...splitLong(text.slice(cut).trim(), target)].filter(Boolean);
}

// Reading mode: split every verse into danda phrases, then break any long phrase
// near the median phrase length. Pieces keep the verse's chunkNumber so the
// reader can tell where a verse starts.
export function splitForReading(chunks: MantraChunk[]): MantraChunk[] {
  const phrases = chunks.map((c) => splitAtDanda(c.sanskrit));
  const target = median(phrases.flat().map((p) => p.length));

  return chunks.flatMap((chunk, ci) =>
    phrases[ci].flatMap((phrase) => splitLong(phrase, target)).map((piece, pi) => ({
      ...chunk,
      id: `${chunk.id}-${pi}`,
      sanskrit: piece,
      isInstruction: pi === 0 ? chunk.isInstruction : false,
    }))
  );
}
