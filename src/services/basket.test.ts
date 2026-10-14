import { afterAll, expect, test } from 'bun:test';
import { ALL_SUKTAMS, SUKTA_MAP, registerDocument } from '../data';
import type { MantraDocument } from '../types/mantra';
import { basketToPrakara, mergeStoredBasket, migrateBasket, migrateStoredBasket, moveItem } from './basket';
import { decodePrakaraFromUrlHash, encodePrakaraToUrlHash } from './urlCodec';

// Fixtures standing in for the live corpus: nothing is bundled in `src/data` any more, so the basket
// functions (which resolve a nirdeśa against the default corpus) get these registered for the file.
const mkDoc = (id: string, sections: number, chunks: number): MantraDocument => ({
  id,
  title: { sanskrit: 'सूक्तम्', transliteration: id, english: `Hymn ${id}` },
  metadata: { source: 'test' },
  sections: Array.from({ length: sections }, (_, i) => ({
    id: `${id}-${i + 1}`,
    title: `Anuvaka ${i + 1}`,
    sectionNumber: i + 1,
    chunks: Array.from({ length: chunks }, (_, j) => ({ id: `${id}-${i + 1}-${j + 1}`, chunkNumber: j + 1, sanskrit: 'अ' })),
  })),
});

const multi = mkDoc('multi', 3, 10);
const other = mkDoc('other', 1, 1);
for (const d of [multi, other]) registerDocument(d);
afterAll(() => {
  for (let i = ALL_SUKTAMS.length - 1; i >= 0; i--) if (ALL_SUKTAMS[i].id === multi.id || ALL_SUKTAMS[i].id === other.id) ALL_SUKTAMS.splice(i, 1);
  SUKTA_MAP.delete(multi.id);
  SUKTA_MAP.delete(other.id);
});

test('moveItem swaps neighbours and stops at the ends', () => {
  const l = ['a', 'b', 'c'];
  expect(moveItem(l, 'c', -1).join()).toBe('a,c,b');
  expect(moveItem(l, 'a', -1).join()).toBe('a,b,c');
  expect(moveItem(l, 'c', 1).join()).toBe('a,b,c');
});

test('section and range items keep their nirdesa through the url codec', async () => {
  const p = basketToPrakara([`${multi.id}/2`, other.id, `${multi.id}/3.2-3.4`], '  ');
  expect(p.title).toBe('My prakaram');
  expect(p.items.map((i) => i.nirdesa)).toEqual([`${multi.id}/2`, undefined, `${multi.id}/3.2-4`]);
  const round = await decodePrakaraFromUrlHash(await encodePrakaraToUrlHash(p));
  expect(round?.items.map((i) => i.nirdesa)).toEqual([`${multi.id}/2`, undefined, `${multi.id}/3.2-4`]);
});

test('an old saved basket of piece ids still loads, and junk is dropped', () => {
  const a = `${multi.id}/2`;
  expect(migrateBasket([{ pieceId: a }, { pieceId: other.id }, a, { pieceId: 'gone' }, 7, null, `${multi.id}/2.1-3`])).toEqual([a, other.id, `${multi.id}/2.1-3`]);
  expect(migrateBasket('x')).toEqual([]);
});

// zustand v5 persist: a stored version that differs from `version` goes through migrate(state, version), then merge(migrated, current).
const rehydrate = (stored: { state: unknown; version: number }) => mergeStoredBasket(stored.version === 2 ? stored.state : migrateStoredBasket(stored.state), { items: [] as string[] });

test('a version 1 stored basket survives rehydration', () => {
  const item = `${multi.id}/3`;
  expect(rehydrate({ state: { items: [{ pieceId: item }] }, version: 1 }).items).toEqual([item]);
  expect(rehydrate({ state: { items: [item] }, version: 2 }).items).toEqual([item]);
  expect(mergeStoredBasket(undefined, { items: [] }).items).toEqual([]);
  expect(mergeStoredBasket('junk', { items: [] }).items).toEqual([]);
});

test('basket titles tell sections and ranges of one source apart', () => {
  const doc = multi.title.english;
  const sec = multi.sections.find((s) => s.sectionNumber === 3)!;
  const t = basketToPrakara([multi.id, `${multi.id}/3`, `${multi.id}/3.3-9`, `${multi.id}/3.2`], 'x').items.map((i) => i.customTitle);
  expect(t).toEqual([doc, `${doc}: ${sec.title}`, `${doc}: §3 padas 3–9`, `${doc}: §3 pada 2`]);
});

test('a kriyā name becomes its sankalpa on a whole source or section, and is migrated tolerantly', () => {
  const a = `${multi.id}/2`;
  const [one, two] = basketToPrakara([a, `${multi.id}/3.2`], 'x', 1, { [a]: ' kalaśārādhanaṁ ', [`${multi.id}/3.2`]: 'ignored' }).items;
  expect([one.kriyaName, one.sankalpa]).toEqual(['kalaśārādhanaṁ', 'kalaśārādhanaṁ kariṣye']);
  expect(two.kriyaName).toBeUndefined();
  expect(migrateStoredBasket({ items: [a], names: { [a]: 'x', gone: 'y', [multi.id]: 'z' } })).toEqual({ items: [a], names: { [a]: 'x' } });
  expect(migrateStoredBasket({ items: [a] }).names).toEqual({});
});
