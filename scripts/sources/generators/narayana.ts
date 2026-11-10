/**
 * Generator contract: a module under `scripts/sources/generators/` default-exports
 * `{ id: string; generate(): Promise<ManifestEntry[]> }`. `generate()` fetches its upstream, parses,
 * builds the document's index + part files under `sources/<docId>/` and returns the manifest entries.
 * It never writes `manifest.json` — `scripts/sources/refresh.ts` owns that — so any two generators can
 * run at once without racing. A module is directly runnable
 * (`bun scripts/sources/generators/narayana.ts`) and writes only its own files.
 */
import { join } from 'node:path';
import { NARAYANA_URL, parseNarayana } from '../parsers/narayana';
import { getText, head } from '../lib/fetch';
import { buildSource, writeSource } from '../lib/parts';
import type { ManifestEntry } from '../lib/manifest';

const ID = 'narayana-upanishad';
const PARSER = 'narayana@1';
const URL = NARAYANA_URL;
const LICENSE = 'Text from sanskritdocuments.org; permission not yet confirmed.';
const SOURCES_DIR = join(import.meta.dir, '../../..', 'sources');

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

/** The one Nārāyaṇa Upaniṣad document; a failed fetch or parse propagates so the refresh sees it. */
async function generate(): Promise<ManifestEntry[]> {
  const retrievedAt = new Date().toISOString().slice(0, 10);
  const upstreamRef = await upstreamRefFor(URL, retrievedAt);
  const html = await getText(URL);
  const parsed = parseNarayana(html);
  const entry = writeSource(
    SOURCES_DIR,
    buildSource(parsed, {
      upstreamUrl: URL,
      upstreamRef,
      retrievedAt,
      parser: PARSER,
      license: parsed.metadata.license ?? LICENSE,
      attribution: 'Nārāyaṇa Upaniṣad — sanskritdocuments.org, encoded and proofread by Sunder Hattangadi',
    }),
  );
  console.log(`[${ID}] wrote ${entry.index} + ${entry.parts.length} part(s)`);
  return [entry];
}

export default { id: ID, generate };

if (import.meta.main) {
  const entries = await generate();
  console.log(`[${ID}] ${entries.length} doc written`);
}
