import type { MantraDocument } from '../types/mantra';
import { SUKTA_MAP } from '../data';
import { vendoredAdapter } from './adapters/vendoredAdapter';

/**
 * One pluggable live source. Every source we reference over the wire instead of copying into git is
 * reached through an adapter, so navigation can ask for any of them the same way and a new one is a
 * single file listed in `SOURCE_ADAPTERS`. Nothing here fetches at import: an adapter loads only when
 * `ensure` is called for a document it owns (see `ensureDocument`).
 */
export interface SourceAdapter {
  id: string;
  /** True when this adapter owns a document id, e.g. 'rigveda-3' or 'taittiriya-samhita-4'. */
  owns(docId: string): boolean;
  /**
   * Fetch the document and register it in the corpus. `sections` limits the parts fetched to those covering
   * the section numbers; omitted loads every part. Idempotent; resolves undefined on failure.
   */
  ensure(docId: string, sections?: number[]): Promise<MantraDocument | undefined>;
  /** Optional live translation. The reader's on-the-wire lines go through services/translation instead. */
  translate?(doc: MantraDocument): Promise<Record<string, string>>;
}

export const SOURCE_ADAPTERS: SourceAdapter[] = [vendoredAdapter];

/** The adapter that owns `docId`, or undefined when no live source does. */
export function adapterFor(docId: string): SourceAdapter | undefined {
  return SOURCE_ADAPTERS.find((a) => a.owns(docId));
}

/** Loads already in flight, keyed by id + sorted sections, so two callers asking for the same share one fetch. */
const inFlight = new Map<string, Promise<MantraDocument | undefined>>();

/** Documents loaded whole, so `hasDocument(id)` can tell a partial load from a complete one. */
const complete = new WeakSet<MantraDocument>();

const loadKey = (docId: string, sections?: number[]): string => (sections ? `${docId}|${[...sections].sort((a, b) => a - b).join(',')}` : docId);

/** `adapterFor(id)?.ensure(id, sections)`; registers + rebuilds the corpus. Idempotent, including concurrent calls. */
function ensurePart(docId: string, sections?: number[]): Promise<MantraDocument | undefined> {
  const key = loadKey(docId, sections);
  const existing = inFlight.get(key);
  if (existing) return existing;
  const adapter = adapterFor(docId);
  if (!adapter) return Promise.resolve(undefined);
  const load = adapter
    .ensure(docId, sections)
    .then((doc) => {
      if (doc && sections === undefined) complete.add(doc);
      return doc;
    })
    .finally(() => inFlight.delete(key));
  inFlight.set(key, load);
  return load;
}

/** Load every section of `docId`. Idempotent, including concurrent calls. */
export function ensureDocument(docId: string): Promise<MantraDocument | undefined> {
  return ensurePart(docId);
}

/**
 * Load the parts covering each `{ id, sections }` reference in parallel (a composition asks for the parts it
 * references). A reference without `sections` loads the whole source. Ids no adapter owns are ignored.
 */
export function ensureDocumentSections(parts: { id: string; sections?: number[] }[]): Promise<(MantraDocument | undefined)[]> {
  return Promise.all(parts.filter((p) => adapterFor(p.id)).map((p) => ensurePart(p.id, p.sections)));
}

/** Load every live source among `docIds`, in parallel. Ids no adapter owns are ignored. Quiet and idempotent. */
export function ensureDocuments(docIds: Iterable<string>): Promise<(MantraDocument | undefined)[]> {
  return Promise.all([...new Set(docIds)].filter((id) => adapterFor(id)).map(ensureDocument));
}

/**
 * True when `id` is in the corpus with every section the reference asks for. A reference without `sections`
 * asks for the whole source, so only a document loaded whole (or a bundled one) counts.
 */
export function hasDocument(id: string, sections?: number[]): boolean {
  const doc = SUKTA_MAP.get(id);
  if (!doc) return false;
  if (sections === undefined) return complete.has(doc) || !adapterFor(id);
  const have = new Set(doc.sections.map((s) => s.sectionNumber));
  return sections.every((n) => have.has(n));
}
