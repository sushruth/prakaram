/**
 * Generator contract: a module under `scripts/sources/generators/` default-exports
 * `{ id: string; generate(): Promise<ManifestEntry[]> }`. `generate()` fetches its upstream, parses,
 * builds the document's index + part files under `sources/<docId>/` and returns the manifest entries.
 * It never writes `manifest.json` — `scripts/sources/refresh.ts` owns that — so any two generators can
 * run at once without racing. A module is directly runnable
 * (`bun scripts/sources/generators/aranyaka.ts`) and writes only its own files.
 */
import { join } from 'node:path';
import { parseAranyaka } from '../parsers/aranyaka';
import { getText, head } from '../lib/fetch';
import { buildSource, writeSource } from '../lib/parts';
import type { ManifestEntry } from '../lib/manifest';

const ID = 'taittiriya-aranyaka';
const PARSER = 'aranyaka@1';
const PRAPATHAKAS = Array.from({ length: 10 }, (_, i) => i + 1);
const SOURCES_DIR = join(import.meta.dir, '../../..', 'sources');

const pageUrl = (p: number): string => `https://taittiriya.com/aranyaka/prapathaka_${p}`;

/** The upstream `Last-Modified` as an ISO date, or `fallback` (the retrieval date) when absent. */
async function upstreamRefFor(url: string, fallback: string): Promise<string> {
  try {
    const res = await head(url);
    const lastModified = res.headers.get('last-modified');
    if (!lastModified) return fallback;
    const date = new Date(lastModified);
    return Number.isNaN(date.getTime()) ? lastModified : date.toISOString().slice(0, 10);
  } catch {
    return fallback;
  }
}

/** One entry per prapāṭhaka; a page that fails to fetch or parse is logged and skipped. */
async function generate(): Promise<ManifestEntry[]> {
  const retrievedAt = new Date().toISOString().slice(0, 10);
  const entries: ManifestEntry[] = [];
  for (const p of PRAPATHAKAS) {
    const url = pageUrl(p);
    try {
      const upstreamRef = await upstreamRefFor(url, retrievedAt);
      const html = await getText(url);
      const parsed = parseAranyaka(html, p);
      const entry = writeSource(
        SOURCES_DIR,
        buildSource(parsed, {
          upstreamUrl: url,
          upstreamRef,
          retrievedAt,
          parser: PARSER,
          license: parsed.metadata.license ?? 'Text from taittiriya.com; permission not yet confirmed.',
          attribution: `Taittirīya Āraṇyaka, prapāṭhaka ${p} — taittiriya.com, edited by Sridhar Iyer`,
        }),
      );
      entries.push(entry);
      console.log(`[${ID}] wrote ${entry.index} + ${entry.parts.length} part(s)`);
    } catch (err) {
      console.warn(`[${ID}] skipped prapāṭhaka ${p}: ${(err as Error).message}`);
    }
  }
  return entries;
}

export default { id: ID, generate };

if (import.meta.main) {
  const entries = await generate();
  console.log(`[${ID}] ${entries.length}/${PRAPATHAKAS.length} prapāṭhakas written`);
}
