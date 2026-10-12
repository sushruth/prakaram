import { mixedTitle } from './titles';
import { MantraChunk, MantraDocument, Prakara } from '../types/mantra';

/** One browsable item in the Koshah: a whole sukta, or one of its sections (an anuvaka). Derived, never stored. */
export interface KoshahPiece {
  /** The document id, or `${documentId}/${sectionNumber}` for a section. Stable, used in URLs (`#k=`). */
  id: string;
  documentId: string;
  /** Present when this piece is one section of a longer document. */
  sectionId?: string;
  kind: 'sukta' | 'anuvaka';
  title: { sanskrit: string; transliteration: string; english: string };
  source: string;
  status: 'draft' | 'proofread' | 'reviewed';
  license?: string;
  lines: number;
}

/** Prefix of the active-prakara id that means "run this piece on its own". */
export const PIECE_PREFIX = 'piece:';

const countLines = (chunks: MantraChunk[]) => chunks.length;

/** Every document becomes a piece, and each section of a multi-section document becomes a piece of its own. */
export function listPieces(docs: MantraDocument[]): KoshahPiece[] {
  return docs.flatMap((doc) => {
    const base = {
      documentId: doc.id,
      source: doc.metadata.source,
      status: doc.metadata.status ?? 'draft',
      license: doc.metadata.license,
    } as const;
    const whole: KoshahPiece = {
      ...base,
      id: doc.id,
      kind: 'sukta',
      title: doc.title,
      lines: doc.sections.reduce((n, s) => n + countLines(s.chunks), 0),
    };
    if (doc.sections.length < 2) return [whole];
    const parts: KoshahPiece[] = doc.sections.map((s) => ({
      ...base,
      id: `${doc.id}/${s.sectionNumber}`,
      sectionId: s.id,
      kind: 'anuvaka',
      title: { sanskrit: doc.title.sanskrit, transliteration: doc.title.transliteration, english: `${doc.title.english}: ${s.title}` },
      lines: countLines(s.chunks),
    }));
    return [whole, ...parts];
  });
}

export const findPiece = (docs: MantraDocument[], id: string) => listPieces(docs).find((p) => p.id === id);

/** The chunks of a piece, in reading order. */
export function pieceChunks(docs: MantraDocument[], piece: KoshahPiece): MantraChunk[] {
  const doc = docs.find((d) => d.id === piece.documentId);
  const sections = doc?.sections.filter((s) => !piece.sectionId || s.id === piece.sectionId) ?? [];
  return sections.flatMap((s) => s.chunks);
}

const prakaraCache = new Map<string, Prakara>();

/**
 * A one-item prakara that runs just this piece. Not saved anywhere.
 * Cached per piece: store selectors return it directly, so a fresh object each call would re-render forever.
 */
export function pieceAsPrakara(piece: KoshahPiece): Prakara {
  const cached = prakaraCache.get(piece.id);
  if (cached) return cached;
  const prakara: Prakara = {
    id: PIECE_PREFIX + piece.id,
    title: mixedTitle(piece.title),
    description: piece.source,
    author: piece.source,
    createdTimestamp: 0,
    items: [{ id: 'piece', type: 'sukta_ref', suktaId: piece.documentId, sectionId: piece.sectionId, customTitle: piece.title.english }],
  };
  prakaraCache.set(piece.id, prakara);
  return prakara;
}

/** Case-insensitive match on the English, transliterated and Devanagari titles and the source. */
export function searchPieces(pieces: KoshahPiece[], query: string): KoshahPiece[] {
  const q = query.trim().toLowerCase();
  if (!q) return pieces;
  return pieces.filter((p) => [p.title.sanskrit, p.title.transliteration, p.title.english, p.source].some((t) => t.toLowerCase().includes(q)));
}
