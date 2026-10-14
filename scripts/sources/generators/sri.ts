/**
 * Generator contract: a module under `scripts/sources/generators/` default-exports
 * `{ id: string; generate(): Promise<ManifestEntry[]> }`. `generate()` fetches its upstream, parses,
 * attaches provenance and writes `sources/<docId>.json` for every document it produces, then returns
 * the manifest entries. It never writes `manifest.json` — `scripts/sources/refresh.ts` owns that — so
 * any two generators can run at once without racing. A module is directly runnable
 * (`bun scripts/sources/generators/sri.ts`) and writes only its own file.
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseSri } from '../parsers/sri';
import { getText, head } from '../lib/fetch';
import { withProvenance } from '../lib/provenance';
import type { ManifestEntry } from '../lib/manifest';

const ID = 'rigveda-khila-sri';
const PARSER = 'sri@1';
/** The `-accent` page; the plain `s-sukta.html` carries no swara. */
const URL = 'https://sanskritdocuments.org/doc_veda/s-sukta-accent.html';
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

/** The one Śrī Sūkta document; a failed fetch or parse propagates so the refresh sees it. */
async function generate(): Promise<ManifestEntry[]> {
  const retrievedAt = new Date().toISOString().slice(0, 10);
  const upstreamRef = await upstreamRefFor(URL, retrievedAt);
  const html = await getText(URL);
  const parsed = parseSri(html);
  const doc = withProvenance(parsed, {
    upstreamUrl: URL,
    upstreamRef,
    retrievedAt,
    parser: PARSER,
    license: parsed.metadata.license ?? LICENSE,
    attribution: 'Śrī Sūkta (Ṛgveda Khila 2.6) — sanskritdocuments.org',
  });
  const file = `${doc.id}.json`;
  writeFileSync(join(SOURCES_DIR, file), `${JSON.stringify(doc, null, 2)}\n`);
  const provenance = doc.metadata.provenance!;
  console.log(`[${ID}] wrote ${file}`);
  return [{ id: doc.id, file, sha256: provenance.sha256, provenance }];
}

export default { id: ID, generate };

if (import.meta.main) {
  const entries = await generate();
  console.log(`[${ID}] ${entries.length} doc written`);
}
