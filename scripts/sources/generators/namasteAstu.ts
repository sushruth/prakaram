import { join } from 'node:path';
import { parseNamasteAstu, RUDRAM_URL } from '../parsers/namasteAstu';
import { getText } from '../lib/fetch';
import { buildSource, writeSource } from '../lib/parts';
import type { ManifestEntry } from '../lib/manifest';

const ID = 'namaste-astu-bhagavan';
const SOURCES_DIR = join(import.meta.dir, '../../..', 'sources');

async function generate(): Promise<ManifestEntry[]> {
  const retrievedAt = new Date().toISOString().slice(0, 10);
  const parsed = parseNamasteAstu(await getText(RUDRAM_URL));
  const entry = writeSource(
    SOURCES_DIR,
    buildSource(parsed, {
      upstreamUrl: RUDRAM_URL,
      upstreamRef: retrievedAt,
      retrievedAt,
      parser: 'namaste-astu@1',
      license: parsed.metadata.license!,
      attribution: 'Namaste astu bhagavan — sanskritdocuments.org, Rudram without svara (doc_shiva/rudram.html)',
    }),
  );
  console.log(`[${ID}] wrote ${entry.index}`);
  return [entry];
}

export default { id: ID, generate };

if (import.meta.main) await generate();
