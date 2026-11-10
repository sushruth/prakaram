import { MantraChunk } from '../types/mantra';

export function splitAtDanda(text: string): string[] {
  return text
    .split(/(?<=[।॥])\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** A piece that is only a printed verse number and its daṇḍas (`३ ॥`); it is not chanted, so it stays with the phrase before it. */
const NUMBER_ONLY = /^[\s।॥0-9\u0966-\u096F]*[0-9\u0966-\u096F][\s।॥0-9\u0966-\u096F]*$/;

function phrasesOf(text: string): string[] {
  return splitAtDanda(text).reduce<string[]>((out, piece) => {
    if (NUMBER_ONLY.test(piece) && out.length) out[out.length - 1] += ` ${piece}`;
    else out.push(piece);
    return out;
  }, []);
}

/** A trailing printed verse number (`॥ ३ ॥`), split off so the reader can leave it unlit. */
export function splitVerseNumber(text: string): [string, string] {
  const m = /\s*॥\s*[0-9\u0966-\u096F]+\s*॥\s*$/.exec(text);
  return m ? [text.slice(0, m.index), text.slice(m.index)] : [text, ''];
}

export function splitForReading(chunks: MantraChunk[]): MantraChunk[] {
  // Phrases end only where the text itself pauses, at a daṇḍa; a long passage with none lights up whole.
  const phrases = chunks.map((c) => phrasesOf(c.sanskrit));

  return chunks.flatMap((chunk, ci) =>
    phrases[ci].map((piece, pi) => ({
      ...chunk,
      id: `${chunk.id}-${pi}`,
      sanskrit: piece,
      isLead: pi === 0 && (chunk.isLead ?? true),
      section: pi === 0 ? chunk.section : undefined,
      padya: pi === 0 ? chunk.padya : undefined,
      note: pi === 0 ? chunk.note : undefined,
      kriya: pi === 0 ? chunk.kriya : undefined,
      breakBefore: pi === 0 ? chunk.breakBefore : undefined,
    }))
  );
}
