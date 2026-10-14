import type { MantraDocument, SourceProvenance } from '../types/mantra';
import { VENDORED_SOURCES } from '../data/vendoredSources';

/**
 * The commit the vendored `sources/` files are pinned to. Set to the data commit sha once the files
 * land; until then the dev server serves them from the repo root. See sources/README.md.
 */
export const SOURCES_PIN = 'local';

/** The Cache API store for vendored sources, keyed by pin + file. */
export const SOURCES_CACHE = 'prakaram-sources-v1';

/**
 * True in the Vite dev server, where `/sources` is served from the repo root by a middleware
 * (vite.config.ts). Bun has no `DEV` field on `import.meta.env`, so tests take the jsDelivr branch.
 */
const isDev = (): boolean => Boolean(import.meta.env?.DEV);

/** Where the processed source files live: same-origin in dev, jsDelivr at the pinned commit in production. */
export function sourcesBaseUrl(): string {
  return isDev() ? '/sources' : `https://cdn.jsdelivr.net/gh/sushruth/prakaram@${SOURCES_PIN}/sources`;
}

const hasCache = (): boolean => typeof caches !== 'undefined';

const cacheKey = (file: string): string => `${SOURCES_PIN}|${file}`;

async function cacheGet(file: string): Promise<MantraDocument | undefined> {
  if (!hasCache()) return undefined;
  try {
    const hit = await (await caches.open(SOURCES_CACHE)).match(cacheKey(file));
    return hit ? ((await hit.json()) as MantraDocument) : undefined;
  } catch {
    return undefined;
  }
}

async function cachePut(file: string, doc: MantraDocument): Promise<void> {
  if (!hasCache()) return;
  try {
    await (await caches.open(SOURCES_CACHE)).put(cacheKey(file), new Response(JSON.stringify(doc), { headers: { 'content-type': 'application/json' } }));
  } catch {
    // A cache write is best-effort; the fetch already succeeded.
  }
}

/**
 * The processed document for a vendored source id: from the Cache API when present, else fetched from
 * `sourcesBaseUrl()` and cached. Resolves undefined on any failure (unknown id, HTTP error, bad JSON);
 * never throws, and never touches the corpus — the adapter registers and rebuilds.
 */
export async function fetchSourceDocument(id: string): Promise<MantraDocument | undefined> {
  const source = VENDORED_SOURCES.find((s) => s.id === id);
  if (!source) return undefined;
  try {
    const cached = await cacheGet(source.file);
    if (cached) return cached;
    const res = await fetch(`${sourcesBaseUrl()}/${source.file}`);
    if (!res.ok) return undefined;
    const doc = (await res.json()) as MantraDocument;
    await cachePut(source.file, doc);
    return doc;
  } catch {
    return undefined;
  }
}

/** One entry of `sources/manifest.json`: a file, its content hash and its provenance. */
export interface VendoredManifestEntry {
  id: string;
  file: string;
  sha256: string;
  provenance: SourceProvenance;
}

/** `sources/manifest.json`: the pin the app should use and the per-file provenance. */
export interface VendoredManifest {
  pin: string;
  generatedAt: string;
  sources: VendoredManifestEntry[];
}

/** The `sources/manifest.json` index, or undefined when it cannot be fetched. The runtime does not need it. */
export async function fetchManifest(): Promise<VendoredManifest | undefined> {
  try {
    const res = await fetch(`${sourcesBaseUrl()}/manifest.json`);
    if (!res.ok) return undefined;
    return (await res.json()) as VendoredManifest;
  } catch {
    return undefined;
  }
}
