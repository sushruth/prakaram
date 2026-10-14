import { registerDocument } from '../../data';
import { VENDORED_SOURCES } from '../../data/vendoredSources';
import { fetchSourceDocument } from '../vendored';
import { rebuildCorpus } from '../wiki';
import type { SourceAdapter } from '../sourceAdapter';

/**
 * One generic adapter over the vendored-source table: every source the app can open is a processed
 * `MantraDocument` under `sources/`, fetched on demand (jsDelivr in production, the dev middleware
 * locally; see src/services/vendored.ts). Registration only; a failed load resolves undefined.
 */
export const vendoredAdapter: SourceAdapter = {
  id: 'vendored',
  owns: (docId) => VENDORED_SOURCES.some((s) => s.id === docId),
  async ensure(docId) {
    const doc = await fetchSourceDocument(docId);
    if (!doc) return undefined;
    registerDocument(doc);
    rebuildCorpus();
    return doc;
  },
};
