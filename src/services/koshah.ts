import { mixedTitle } from './titles';
import { MantraChunk, MantraDocument, Prakara, PrakaraItem } from '../types/mantra';
import { ALL_SUKTAMS } from '../data';
import { formatNirdesa, normaliseNirdesa, rangeWords, resolveNirdesa } from './nirdesa';

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
    items: [{ id: 'piece', type: 'sukta_ref', suktaId: piece.documentId, ...(piece.sectionId ? { nirdesa: piece.id } : {}), customTitle: piece.title.english }],
  };
  prakaraCache.set(piece.id, prakara);
  return prakara;
}

/** A one-item prakara that runs the lines a nirdeśa addresses (a range, say). Cached like `pieceAsPrakara`. */
export function nirdesaAsPrakara(addr: string): Prakara | undefined {
  const cached = prakaraCache.get(addr);
  if (cached) return cached;
  const r = resolveNirdesa(addr);
  if (!r.ok) return undefined;
  const title = mixedTitle(r.document.title);
  const prakara: Prakara = {
    id: PIECE_PREFIX + addr,
    title,
    description: [r.label.text, rangeWords(r.nirdesa)].join(' · '),
    author: r.document.metadata.source,
    createdTimestamp: 0,
    items: [{ id: 'piece', type: 'sukta_ref', suktaId: r.document.id, nirdesa: formatNirdesa(r.nirdesa), customTitle: r.document.title.english }],
  };
  prakaraCache.set(addr, prakara);
  return prakara;
}

/** The nirdeśa a step follows: its own, or the one its old `sectionId` stands for, or the whole source. */
export function itemNirdesa(item: PrakaraItem, docs: MantraDocument[] = ALL_SUKTAMS): string | undefined {
  if (item.nirdesa) return item.nirdesa;
  if (!item.suktaId) return undefined;
  const sec = item.sectionId ? docs.find((d) => d.id === item.suktaId)?.sections.find((x) => x.id === item.sectionId) : undefined;
  return sec ? `${item.suktaId}/${sec.sectionNumber}` : item.suktaId;
}

/**
 * Validates a prakara read from storage or a `#p=` link and moves old `sectionId` steps to `nirdesa`.
 * Returns null when it is not a prakara. A nirdesa that is malformed, unresolvable or names another source than `suktaId` is dropped (the step then follows the whole sukta, or is removed if that does not exist).
 */
export function normalizePrakara(v: unknown, docs: MantraDocument[] = ALL_SUKTAMS): Prakara | null {
  const p = v as Prakara | null;
  if (typeof p !== 'object' || p === null || typeof p.id !== 'string' || !Array.isArray(p.items)) return null;
  const items = p.items.flatMap((i): PrakaraItem[] => {
    if (typeof i !== 'object' || i === null || typeof i.id !== 'string' || (i.type !== 'sukta_ref' && i.type !== 'vakya')) return [];
    const { sectionId, nirdesa, ...rest } = i;
    const given = typeof nirdesa === 'string' ? normaliseNirdesa(nirdesa) : undefined;
    const addr = given ?? (typeof sectionId === 'string' ? itemNirdesa(i, docs) : undefined);
    if (!addr || addr === rest.suktaId) return [rest];
    // The address must resolve, and into the step's own source; otherwise the step follows the whole sukta, or is dropped.
    const r = resolveNirdesa(addr, docs);
    if (r.ok && r.document.id === rest.suktaId) return [{ ...rest, nirdesa: addr }];
    return docs.some((d) => d.id === rest.suktaId) ? [rest] : [];
  });
  return { ...p, items };
}

/** Case-insensitive match on the English, transliterated and Devanagari titles and the source. */
export function searchPieces(pieces: KoshahPiece[], query: string): KoshahPiece[] {
  const q = query.trim().toLowerCase();
  if (!q) return pieces;
  return pieces.filter((p) => [p.title.sanskrit, p.title.transliteration, p.title.english, p.source].some((t) => t.toLowerCase().includes(q)));
}
