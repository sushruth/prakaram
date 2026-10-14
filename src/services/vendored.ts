import type { MantraDocument, SourceIndex, SourcePart, SourceProvenance } from '../types/mantra';
import { mergeDocument } from '../data';
import { VENDORED_SOURCES } from '../data/vendoredSources';
import { rebuildCorpus } from './wiki';

/**
 * The commit the vendored `sources/` files are pinned to. Injected at build time by `vite.config.ts`
 * (the last commit that touched `sources/`, or `VITE_SOURCES_PIN` when set); `'local'` when no pin is
 * available, e.g. under Bun in tests. The dev server serves `/sources` from the repo root, so the pin
 * is unused in dev. See sources/README.md.
 */
export const SOURCES_PIN = import.meta.env.VITE_SOURCES_PIN || 'local';

/** The Cache API store for vendored sources, keyed by pin + path. */
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

const cacheKey = (path: string): string => `${SOURCES_PIN}|${path}`;

async function cacheGet<T>(path: string): Promise<T | undefined> {
  if (!hasCache()) return undefined;
  try {
    const hit = await (await caches.open(SOURCES_CACHE)).match(cacheKey(path));
    return hit ? ((await hit.json()) as T) : undefined;
  } catch {
    return undefined;
  }
}

async function cachePut<T>(path: string, value: T): Promise<void> {
  if (!hasCache()) return;
  try {
    await (await caches.open(SOURCES_CACHE)).put(cacheKey(path), new Response(JSON.stringify(value), { headers: { 'content-type': 'application/json' } }));
  } catch {
    // A cache write is best-effort; the fetch already succeeded.
  }
}

/** Fetch one JSON document from the sources base URL, caching it. Resolves undefined on any failure. */
async function fetchJson<T>(path: string): Promise<T | undefined> {
  const cached = await cacheGet<T>(path);
  if (cached) return cached;
  try {
    const res = await fetch(`${sourcesBaseUrl()}/${path}`);
    if (!res.ok) return undefined;
    const value = (await res.json()) as T;
    await cachePut(path, value);
    return value;
  } catch {
    return undefined;
  }
}

/** A vendored source's index (its metadata and per-section part pointers), from cache or the wire. */
export function fetchSourceIndex(id: string): Promise<SourceIndex | undefined> {
  const source = VENDORED_SOURCES.find((s) => s.id === id);
  return source ? fetchJson<SourceIndex>(source.index) : Promise.resolve(undefined);
}

/** One part file of a vendored source, from cache or the wire. `file` is as the index names it. */
export function fetchSourcePart(id: string, file: string): Promise<SourcePart | undefined> {
  return fetchJson<SourcePart>(`${id}/${file}`);
}

/**
 * Load a vendored source into the corpus: fetch its index, then the parts covering `sections` (every part when
 * `sections` is omitted), assemble a `MantraDocument`, merge it into `SUKTA_MAP` (register when absent, else
 * add/replace sections so a partial load later completes) and rebuild the corpus. Resolves undefined on any
 * failure; never throws.
 */
export async function loadSource(id: string, sections?: number[]): Promise<MantraDocument | undefined> {
  const index = await fetchSourceIndex(id);
  if (!index) return undefined;
  const wanted = sections === undefined ? undefined : new Set(sections);
  const files = [...new Set(index.sections.filter((s) => !wanted || wanted.has(s.sectionNumber)).map((s) => s.file))];
  const fetched = await Promise.all(files.map((file) => fetchSourcePart(id, file)));
  if (fetched.some((part) => part === undefined)) return undefined;
  const order = new Map(index.sections.map((s, i) => [s.sectionNumber, i]));
  const loaded = fetched
    .flatMap((part) => part!.sections)
    .sort((a, b) => (order.get(a.sectionNumber) ?? Number.MAX_SAFE_INTEGER) - (order.get(b.sectionNumber) ?? Number.MAX_SAFE_INTEGER));
  const doc: MantraDocument = { id: index.id, title: index.title, metadata: index.metadata, sections: loaded };
  const stored = mergeDocument(doc);
  rebuildCorpus();
  return stored;
}

/** One part of `sources/manifest.json`: a file, its content hash and its raw/gzipped size. */
export interface VendoredManifestPart {
  file: string;
  sha256: string;
  bytes: number;
  gzip: number;
}

/** One entry of `sources/manifest.json`: an index, its provenance and its part files. */
export interface VendoredManifestEntry {
  id: string;
  index: string;
  sha256: string;
  provenance: SourceProvenance;
  parts: VendoredManifestPart[];
}

/** `sources/manifest.json`: the pin the app should use, the per-source files and the size report. */
export interface VendoredManifest {
  pin: string;
  generatedAt: string;
  sources: VendoredManifestEntry[];
  metrics?: unknown;
}

/** The `sources/manifest.json` index, or undefined when it cannot be fetched. The runtime does not need it. */
export async function fetchManifest(): Promise<VendoredManifest | undefined> {
  return fetchJson<VendoredManifest>('manifest.json');
}
