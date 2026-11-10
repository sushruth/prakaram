/** Generator for the Taittirīya Brāhmaṇa (taittiriya.com): one document per prapāṭhaka. Contract as in `taittiriya.ts`. */
import { join } from 'node:path';
import { brahmanaUrl, parseBrahmana } from '../parsers/brahmana';
import { getText, head } from '../lib/fetch';
import { buildSource, writeSource } from '../lib/parts';
import type { ManifestEntry } from '../lib/manifest';

const ID = 'taittiriya-brahmana';
const PARSER = 'brahmana@3';
/** The aṣṭakas in the vendored table and their prapāṭhaka counts. */
const ASHTAKAS: Record<number, number> = { 2: 8 };
const SOURCES_DIR = join(import.meta.dir, '../../..', 'sources');

async function upstreamRefFor(url: string, fallback: string): Promise<string> {
  try {
    const lastModified = (await head(url)).headers.get('last-modified');
    const date = lastModified ? new Date(lastModified) : undefined;
    return date && !Number.isNaN(date.getTime()) ? date.toISOString().slice(0, 10) : fallback;
  } catch {
    return fallback;
  }
}

async function generate(): Promise<ManifestEntry[]> {
  const retrievedAt = new Date().toISOString().slice(0, 10);
  const entries: ManifestEntry[] = [];
  for (const [a, count] of Object.entries(ASHTAKAS)) {
    const ashtaka = Number(a);
    for (let p = 1; p <= count; p++) {
      const url = brahmanaUrl(ashtaka, p);
      const doc = parseBrahmana(await getText(url), ashtaka, p);
      const entry = writeSource(
        SOURCES_DIR,
        buildSource(doc, {
          upstreamUrl: url,
          upstreamRef: await upstreamRefFor(url, retrievedAt),
          retrievedAt,
          parser: PARSER,
          license: 'Text from taittiriya.com; permission not yet confirmed.',
          attribution: `Taittirīya Brāhmaṇa, aṣṭaka ${ashtaka}, prapāṭhaka ${p} — taittiriya.com, edited by Sridhar Iyer`,
        }),
      );
      entries.push(entry);
      console.log(`[${ID}] wrote ${entry.index} + ${entry.parts.length} part(s)`);
    }
  }
  return entries;
}

export default { id: ID, generate };

if (import.meta.main) console.log(`[${ID}] ${(await generate()).length} document(s) written`);
