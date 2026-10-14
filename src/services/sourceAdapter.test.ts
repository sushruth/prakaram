import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ALL_SUKTAMS, SUKTA_MAP } from '../data';
import { LIVE_SOURCES } from '../data/liveSources';
import { VENDORED_SOURCES } from '../data/vendoredSources';
import type { MantraDocument, SourceIndex, SourcePart } from '../types/mantra';
import { SOURCE_ADAPTERS, adapterFor, ensureDocument, ensureDocumentSections, hasDocument } from './sourceAdapter';
import { SOURCES_PIN } from './vendored';
import { getArticle, rebuildCorpus, requiredSourceIds, requiredSourceParts } from './wiki';

/** A minimal processed document for a vendored id, with one chunk per section. */
const mkDoc = (id: string, sectionNumbers: number[]): MantraDocument => ({
  id,
  title: { sanskrit: 'सूक्तम्', transliteration: id, english: id },
  metadata: { kind: 'source', source: 'test', categories: [] },
  sections: sectionNumbers.map((n) => ({
    id: `${id}-${n}`,
    title: `Section ${n}`,
    sectionNumber: n,
    chunks: [{ id: `${id}-${n}-1`, chunkNumber: 1, sanskrit: 'अ॒ग्निमी॑ळे।' }],
  })),
});

const DOCS: Record<string, MantraDocument> = {
  'rigveda-1': mkDoc('rigveda-1', [1]),
  'rigveda-2': mkDoc('rigveda-2', [23]),
  'taittiriya-aranyaka-3': mkDoc('taittiriya-aranyaka-3', [12]),
  'taittiriya-aranyaka-10': mkDoc('taittiriya-aranyaka-10', [2, 13]),
  'rigveda-khila-sri': mkDoc('rigveda-khila-sri', [1]),
};

/** The index the loader would fetch, one part file per section. */
const indexOf = (doc: MantraDocument): SourceIndex => ({
  id: doc.id,
  title: doc.title,
  metadata: doc.metadata,
  sections: doc.sections.map((section, i) => ({ id: section.id, sectionNumber: section.sectionNumber, title: section.title, file: `part-${i + 1}.json`, chunkCount: section.chunks.length })),
});

const partOf = (doc: MantraDocument, i: number): SourcePart => ({ sections: [doc.sections[i]] });

/** The path of a fetched URL relative to `sources/`, e.g. `rigveda-1/index.json`. */
const sourcePath = (url: string): string => url.replace(/^.*\/sources\//, '');

const installStubs = (docs: Record<string, MantraDocument>) => {
  const store = new Map<string, Response>();
  const opened: string[] = [];
  const fetchCalls: string[] = [];
  globalThis.caches = {
    open: async (name: string) => {
      opened.push(name);
      return {
        match: async (key: string) => store.get(key),
        put: async (key: string, res: Response) => void store.set(key, res),
      };
    },
  } as unknown as CacheStorage;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    fetchCalls.push(url);
    const [id, file] = sourcePath(url).split('/');
    const doc = docs[id];
    if (!doc) return new Response('not found', { status: 404 });
    const json = (value: unknown) => new Response(JSON.stringify(value), { status: 200, headers: { 'content-type': 'application/json' } });
    if (file === 'index.json') return json(indexOf(doc));
    const m = /^part-(\d+)\.json$/.exec(file ?? '');
    const i = m ? Number(m[1]) - 1 : -1;
    return i >= 0 && i < doc.sections.length ? json(partOf(doc, i)) : new Response('not found', { status: 404 });
  }) as typeof fetch;
  return { store, opened, fetchCalls };
};

// Bun shares module state across test files, so a document registered here must be removed again.
const VENDORED_IDS = new Set(VENDORED_SOURCES.map((s) => s.id));
const resetCorpus = () => {
  for (let i = ALL_SUKTAMS.length - 1; i >= 0; i--) if (VENDORED_IDS.has(ALL_SUKTAMS[i].id)) ALL_SUKTAMS.splice(i, 1);
  for (const id of [...SUKTA_MAP.keys()]) if (VENDORED_IDS.has(id)) SUKTA_MAP.delete(id);
  rebuildCorpus();
};

describe('source adapters', () => {
  it('registers one generic adapter for the vendored sources', () => {
    expect(SOURCE_ADAPTERS.map((a) => a.id)).toEqual(['vendored']);
  });

  it('resolves the adapter that owns a document id, and no other', () => {
    expect(adapterFor('rigveda-1')?.id).toBe('vendored');
    expect(adapterFor('rigveda-10')?.id).toBe('vendored');
    expect(adapterFor('taittiriya-samhita-4')?.id).toBe('vendored');
    expect(adapterFor('taittiriya-aranyaka-3')?.id).toBe('vendored');
    expect(adapterFor('rigveda-khila-sri')?.id).toBe('vendored');
    expect(adapterFor('shanti-mantras')).toBeUndefined();
  });

  it('owns only the ids of the vendored table', () => {
    const adapter = adapterFor('rigveda-1')!;
    expect(adapter.owns('rigveda-1')).toBe(true);
    expect(adapter.owns('rigveda-10')).toBe(true);
    expect(adapter.owns('rigveda')).toBe(false);
    expect(adapter.owns('rigveda-11')).toBe(false);
    expect(adapter.owns('taittiriya-aranyaka-11')).toBe(false);
    expect(adapter.owns('taittiriya-samhita-4')).toBe(true);
    expect(adapter.owns('shanti-mantras')).toBe(false);
  });

  it('gives every navigable live source an adapter', () => {
    expect(LIVE_SOURCES.length).toBe(22);
    for (const s of LIVE_SOURCES) expect(adapterFor(s.id)).toBeDefined();
  });
});

describe('ensureDocument', () => {
  beforeEach(resetCorpus);
  afterEach(() => {
    resetCorpus();
    delete (globalThis as { fetch?: unknown }).fetch;
    delete (globalThis as { caches?: unknown }).caches;
  });

  it('fetches the index and its parts, caches them, registers the document, and is idempotent', async () => {
    const { store, opened, fetchCalls } = installStubs(DOCS);
    expect(SUKTA_MAP.has('rigveda-1')).toBe(false);
    const doc = await ensureDocument('rigveda-1');
    expect(doc?.id).toBe('rigveda-1');
    expect(SUKTA_MAP.has('rigveda-1')).toBe(true);
    expect(fetchCalls.map(sourcePath)).toEqual(['rigveda-1/index.json', 'rigveda-1/part-1.json']);
    expect(opened).toContain('prakaram-sources-v1');
    expect(store.has(`${SOURCES_PIN}|rigveda-1/index.json`)).toBe(true);
    expect(store.has(`${SOURCES_PIN}|rigveda-1/part-1.json`)).toBe(true);

    await ensureDocument('rigveda-1');
    expect(fetchCalls).toHaveLength(2);
  });

  it('shares one fetch between concurrent callers', async () => {
    const { fetchCalls } = installStubs(DOCS);
    const [a, b] = await Promise.all([ensureDocument('rigveda-1'), ensureDocument('rigveda-1')]);
    expect(a?.id).toBe('rigveda-1');
    expect(b?.id).toBe('rigveda-1');
    expect(fetchCalls).toHaveLength(2);
  });

  it('loads one section, then completes the document when all are asked for, without duplicates', async () => {
    const { fetchCalls } = installStubs(DOCS);
    await ensureDocumentSections([{ id: 'taittiriya-aranyaka-10', sections: [13] }]);
    expect(SUKTA_MAP.get('taittiriya-aranyaka-10')!.sections.map((s) => s.sectionNumber)).toEqual([13]);
    expect(hasDocument('taittiriya-aranyaka-10', [13])).toBe(true);
    expect(hasDocument('taittiriya-aranyaka-10')).toBe(false);

    await ensureDocument('taittiriya-aranyaka-10');
    expect(SUKTA_MAP.get('taittiriya-aranyaka-10')!.sections.map((s) => s.sectionNumber)).toEqual([2, 13]);
    expect(hasDocument('taittiriya-aranyaka-10')).toBe(true);
    // The whole load re-reads the index and part 2 from cache; only the still-missing part 1 hits the wire.
    expect(fetchCalls.map(sourcePath)).toEqual([
      'taittiriya-aranyaka-10/index.json',
      'taittiriya-aranyaka-10/part-2.json',
      'taittiriya-aranyaka-10/part-1.json',
    ]);
  });

  it('resolves the article once the source is registered', async () => {
    installStubs(DOCS);
    expect(getArticle('rigveda-1')).toBeUndefined();
    await ensureDocument('rigveda-1');
    const article = getArticle('rigveda-1');
    expect(article?.kind).toBe('source');
    expect(article?.sections.map((s) => s.number)).toEqual([1]);
  });

  it('returns undefined, fetching nothing, when no adapter owns the id', async () => {
    const { fetchCalls } = installStubs(DOCS);
    expect(await ensureDocument('shanti-mantras')).toBeUndefined();
    expect(fetchCalls).toEqual([]);
  });

  it('resolves undefined when the edition cannot be fetched', async () => {
    const { fetchCalls } = installStubs({});
    expect(await ensureDocument('rigveda-1')).toBeUndefined();
    expect(SUKTA_MAP.has('rigveda-1')).toBe(false);
    expect(fetchCalls).toHaveLength(1);
  });

  it('fetches nothing at import or boot', async () => {
    const { fetchCalls } = installStubs(DOCS);
    // A query suffix makes Bun re-evaluate the module, so this is its first (and only) import.
    const fresh = './sourceAdapter?import-check';
    await import(/* @vite-ignore */ fresh);
    expect(fetchCalls).toEqual([]);
    const main = readFileSync(join(import.meta.dir, '..', 'main.tsx'), 'utf8');
    expect(main).not.toMatch(/loadRemoteSource|ensureDocument|REMOTE_SOURCES|rigveda|Dharmic/i);
  });
});

describe('cross-source compositions', () => {
  beforeEach(resetCorpus);
  afterEach(() => {
    resetCorpus();
    delete (globalThis as { fetch?: unknown }).fetch;
    delete (globalThis as { caches?: unknown }).caches;
  });

  it('collects the live sources a composition references, with the sections its parts use', () => {
    const parts = requiredSourceParts('maha-prakaram').filter((p) => adapterFor(p.id));
    expect(parts.map((p) => p.id).toSorted()).toEqual(['rigveda-2', 'rigveda-khila-sri', 'taittiriya-aranyaka-10', 'taittiriya-aranyaka-3']);
    expect(parts.find((p) => p.id === 'rigveda-2')?.sections).toEqual([23]);
    expect(parts.find((p) => p.id === 'taittiriya-aranyaka-10')?.sections).toEqual([2, 13]);
    expect(requiredSourceIds('rigveda-2')).toEqual([]);
  });

  it('loads a composition\'s live parts in parallel, and they resolve to their sections', async () => {
    const { fetchCalls } = installStubs(DOCS);
    const parts = requiredSourceParts('maha-prakaram').filter((p) => adapterFor(p.id));
    const docs = await ensureDocumentSections(parts);
    expect(docs.every((d) => d !== undefined)).toBe(true);
    const indexes = fetchCalls.map(sourcePath).filter((p) => p.endsWith('/index.json')).toSorted();
    expect(indexes).toEqual([
      'rigveda-2/index.json',
      'rigveda-khila-sri/index.json',
      'taittiriya-aranyaka-10/index.json',
      'taittiriya-aranyaka-3/index.json',
    ]);

    const article = getArticle('maha-prakaram')!;
    expect(article.kind).toBe('composition');
    expect(article.sources.map((s) => s.id).toSorted()).toEqual(['rigveda-2', 'rigveda-khila-sri', 'taittiriya-aranyaka-10', 'taittiriya-aranyaka-3']);
    expect(article.parts.map((p) => `${p.from?.id}/${p.from?.number}`)).toEqual([
      'rigveda-2/23',
      'taittiriya-aranyaka-3/12',
      'rigveda-khila-sri/1',
      'taittiriya-aranyaka-10/2',
      'taittiriya-aranyaka-10/13',
    ]);
  });
});
