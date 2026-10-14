import type { MantraDocument } from '../types/mantra';
import { rebuildCorpus } from './wiki';
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
  /** Fetch/parse/cache the document and register it in the corpus. Idempotent; resolves undefined on failure. */
  ensure(docId: string): Promise<MantraDocument | undefined>;
  /** Optional live translation. The reader's on-the-wire lines go through services/translation instead. */
  translate?(doc: MantraDocument): Promise<Record<string, string>>;
}

export const SOURCE_ADAPTERS: SourceAdapter[] = [vendoredAdapter];

/** The adapter that owns `docId`, or undefined when no live source does. */
export function adapterFor(docId: string): SourceAdapter | undefined {
  return SOURCE_ADAPTERS.find((a) => a.owns(docId));
}

/** Loads already in flight, so two callers asking for the same document share one fetch. */
const inFlight = new Map<string, Promise<MantraDocument | undefined>>();

/** `adapterFor(id)?.ensure(id)`; registers + rebuilds the corpus. Idempotent, including concurrent calls. */
export function ensureDocument(docId: string): Promise<MantraDocument | undefined> {
  const existing = inFlight.get(docId);
  if (existing) return existing;
  const adapter = adapterFor(docId);
  if (!adapter) return Promise.resolve(undefined);
  const load = adapter
    .ensure(docId)
    .then((doc) => {
      if (doc) rebuildCorpus();
      return doc;
    })
    .finally(() => inFlight.delete(docId));
  inFlight.set(docId, load);
  return load;
}

/**
 * Load every live source among `docIds`, in parallel (a composition asks for the parts it references).
 * Ids no adapter owns are ignored; already-loaded documents resolve at once. Quiet and idempotent.
 */
export function ensureDocuments(docIds: Iterable<string>): Promise<(MantraDocument | undefined)[]> {
  return Promise.all([...new Set(docIds)].filter((id) => adapterFor(id)).map(ensureDocument));
}
