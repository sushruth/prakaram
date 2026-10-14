import { MantraDocument } from '../types/mantra';
export { DEFAULT_PRAKARAS } from './defaultPrakaras';

/**
 * The bundled corpus is empty: every text the app shows is a live source, vendored under `sources/` and
 * fetched on demand (see `src/services/sourceAdapter.ts`). Nothing ships as JSON in `src/data`. Documents
 * loaded at runtime are registered here; `SUKTA_MAP` is the id → document index over the same list.
 */
export const ALL_SUKTAMS: MantraDocument[] = [];

/** Adds a document loaded at runtime (a live-referenced source). Idempotent. */
export function registerDocument(doc: MantraDocument): void {
  if (ALL_SUKTAMS.some((d) => d.id === doc.id)) return;
  ALL_SUKTAMS.push(doc);
  SUKTA_MAP.set(doc.id, doc);
}

/**
 * Register a live document, or merge its sections into the one already registered so a partial load later
 * completes without duplicating or losing sections. Returns the document held in `SUKTA_MAP`.
 */
export function mergeDocument(doc: MantraDocument): MantraDocument {
  const existing = SUKTA_MAP.get(doc.id);
  if (!existing) {
    registerDocument(doc);
    return doc;
  }
  const byNumber = new Map(existing.sections.map((section) => [section.sectionNumber, section]));
  for (const section of doc.sections) byNumber.set(section.sectionNumber, section);
  existing.sections = [...byNumber.values()].sort((a, b) => a.sectionNumber - b.sectionNumber);
  existing.title = doc.title;
  existing.metadata = { ...existing.metadata, ...doc.metadata };
  return existing;
}

export const SUKTA_MAP = new Map<string, MantraDocument>(
  ALL_SUKTAMS.map((s) => [s.id, s])
);

/**
 * The JSON file each bundled document lived in, relative to `src/data`. Kept for the wiki's source and edit
 * links, which fall back to `<id>.json` for any document without a `metadata.remoteUrl`. Empty now that
 * nothing is bundled: every source is live and links to its upstream via `metadata.remoteUrl`.
 */
export const SUKTA_FILE: Record<string, string> = {};
