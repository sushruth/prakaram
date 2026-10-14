import { VENDORED_SOURCES, type VendoredSource } from './vendoredSources';

/**
 * The live sources a reader can navigate to. The catalog is now derived from the vendored-source table
 * (`src/data/vendoredSources.ts`), so the wiki home can link to every source the loader can fetch.
 */
export type LiveSource = Pick<VendoredSource, 'id' | 'label'>;

export const LIVE_SOURCES: LiveSource[] = VENDORED_SOURCES;

export { liveSourceLabel } from './vendoredSources';
