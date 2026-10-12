import { MantraChunk } from '../types/mantra';

export function splitAtDanda(text: string): string[] {
  return text
    .split(/(?<=[।॥])\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function median(values: number[]): number {
  const sorted = values.toSorted((a, b) => a - b);
  return sorted[sorted.length >> 1] ?? 0;
}

export function splitLong(text: string, target: number): string[] {
  if (text.length <= target * 1.5) return [text];

  const spaces: number[] = [];
  for (let i = 0; i < text.length; i++) if (text[i] === ' ') spaces.push(i);
  if (spaces.length === 0) return [text];

  const cut = spaces.reduce((best, i) => (Math.abs(i - target) < Math.abs(best - target) ? i : best), spaces[0]);
  return [text.slice(0, cut).trim(), ...splitLong(text.slice(cut).trim(), target)].filter(Boolean);
}

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

export type ChunkTransform = (chunks: MantraChunk[]) => MantraChunk[];

export const READING_TRANSFORMS: Record<'verse' | 'phrase', ChunkTransform[]> = {
  verse: [],
  phrase: [splitForReading],
};

export function applyTransforms(chunks: MantraChunk[], transforms: ChunkTransform[]): MantraChunk[] {
  return transforms.reduce((acc, t) => t(acc), chunks);
}
