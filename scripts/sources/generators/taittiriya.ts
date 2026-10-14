/**
 * Generator contract: a module under `scripts/sources/generators/` default-exports
 * `{ id: string; generate(): Promise<ManifestEntry[]> }`. `generate()` fetches its upstream, parses,
 * builds the document's index + part files under `sources/<docId>/` and returns the manifest entries.
 * It never writes `manifest.json` — `scripts/sources/refresh.ts` owns that — so any two generators can
 * run at once without racing. A module is directly runnable
 * (`bun scripts/sources/generators/taittiriya.ts`) and writes only its own files.
 */
import { join } from 'node:path';
import { parseTaittiriya, type PrashnaPage } from '../parsers/taittiriya';
import { getText, head } from '../lib/fetch';
import { buildSource, writeSource } from '../lib/parts';
import type { ManifestEntry } from '../lib/manifest';

const ID = 'taittiriya-samhita';
const PARSER = 'taittiriya@2';
/** Only kāṇḍa 4 is in the vendored table. */
const KANDA = 4;
const PRASHNAS = Array.from({ length: 7 }, (_, i) => i + 1);
const SOURCES_DIR = join(import.meta.dir, '../../..', 'sources');
const LICENSE = 'Text from taittiriya.com; permission not yet confirmed.';

const pageUrl = (kanda: number, prashna: number): string => `https://taittiriya.com/samhita/kanda_${kanda}_prashna_${prashna}`;

/** The newest upstream `Last-Modified` across the pages as an ISO date, or `fallback` (the retrieval date) when absent. */
async function upstreamRefFor(urls: string[], fallback: string): Promise<string> {
  try {
    const dates = (await Promise.all(urls.map((u) => head(u)))).map((r) => r.headers.get('last-modified')).filter((d): d is string => !!d).map((d) => new Date(d).getTime()).filter((t) => !Number.isNaN(t));
    return dates.length ? new Date(Math.max(...dates)).toISOString().slice(0, 10) : fallback;
  } catch {
    return fallback;
  }
}

/** Fetch kāṇḍa 4's seven prashna pages, parse them into one document, build and write its index + parts. */
async function generate(): Promise<ManifestEntry[]> {
  const retrievedAt = new Date().toISOString().slice(0, 10);
  const urls = PRASHNAS.map((p) => pageUrl(KANDA, p));
  const pages: PrashnaPage[] = [];
  for (const [i, url] of urls.entries()) pages.push({ prashna: PRASHNAS[i], html: await getText(url) });
  const doc = parseTaittiriya(pages, KANDA);
  const entry = writeSource(
    SOURCES_DIR,
    buildSource(doc, {
      upstreamUrl: `https://taittiriya.com/samhita/kanda_${KANDA}_prashna_1`,
      upstreamRef: await upstreamRefFor(urls, retrievedAt),
      retrievedAt,
      parser: PARSER,
      license: LICENSE,
      attribution: `Taittirīya Saṃhitā, kāṇḍa ${KANDA} — taittiriya.com, edited by Sridhar Iyer`,
    }),
  );
  console.log(`[${ID}] wrote ${entry.index} + ${entry.parts.length} part(s)`);
  return [entry];
}

export default { id: ID, generate };

if (import.meta.main) {
  const entries = await generate();
  console.log(`[${ID}] ${entries.length} document(s) written`);
}
