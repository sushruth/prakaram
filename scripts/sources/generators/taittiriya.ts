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
const PARSER = 'taittiriya@3';
/** The kāṇḍas in the vendored table and their prapāṭhaka counts. */
const KANDAS: Record<number, number> = { 1: 8, 4: 7, 5: 7 };
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

/** Fetch one kāṇḍa's prashna pages, parse them into one document, build and write its index + parts. */
async function generateKanda(kanda: number, prashnas: number, retrievedAt: string): Promise<ManifestEntry> {
  const numbers = Array.from({ length: prashnas }, (_, i) => i + 1);
  const urls = numbers.map((p) => pageUrl(kanda, p));
  const pages: PrashnaPage[] = [];
  for (const [i, url] of urls.entries()) pages.push({ prashna: numbers[i], html: await getText(url) });
  const entry = writeSource(
    SOURCES_DIR,
    buildSource(parseTaittiriya(pages, kanda), {
      upstreamUrl: pageUrl(kanda, 1),
      upstreamRef: await upstreamRefFor(urls, retrievedAt),
      retrievedAt,
      parser: PARSER,
      license: LICENSE,
      attribution: `Taittirīya Saṃhitā, kāṇḍa ${kanda} — taittiriya.com, edited by Sridhar Iyer`,
    }),
  );
  console.log(`[${ID}] wrote ${entry.index} + ${entry.parts.length} part(s)`);
  return entry;
}

async function generate(): Promise<ManifestEntry[]> {
  const retrievedAt = new Date().toISOString().slice(0, 10);
  const entries: ManifestEntry[] = [];
  for (const [kanda, prashnas] of Object.entries(KANDAS)) entries.push(await generateKanda(Number(kanda), prashnas, retrievedAt));
  return entries;
}

export default { id: ID, generate };

if (import.meta.main) {
  const entries = await generate();
  console.log(`[${ID}] ${entries.length} document(s) written`);
}
