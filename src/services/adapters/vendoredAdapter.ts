import { VENDORED_SOURCES } from '../../data/vendoredSources';
import { loadSource } from '../vendored';
import type { SourceAdapter } from '../sourceAdapter';

/**
 * One generic adapter over the vendored-source table: every source the app can open is a processed
 * `MantraDocument` under `sources/`, fetched on demand (jsDelivr in production, the dev middleware
 * locally; see src/services/vendored.ts). `loadSource` registers and rebuilds the corpus; a failed load
 * resolves undefined.
 */
export const vendoredAdapter: SourceAdapter = {
  id: 'vendored',
  owns: (docId) => VENDORED_SOURCES.some((s) => s.id === docId),
  ensure: (docId, sections) => loadSource(docId, sections),
};
