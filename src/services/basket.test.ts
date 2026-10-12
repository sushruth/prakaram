import { expect, test } from 'bun:test';
import { ALL_SUKTAMS } from '../data';
import { basketToPrakara, mergeStoredBasket, migrateBasket, migrateStoredBasket, moveItem } from './basket';
import { decodePrakaraFromUrlHash, encodePrakaraToUrlHash } from './urlCodec';

const multi = ALL_SUKTAMS.find((d) => d.sections.length > 2)!;
const other = ALL_SUKTAMS.find((d) => d.id !== multi.id)!;

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
  const item = 'rudram-namakam/3';
  expect(rehydrate({ state: { items: [{ pieceId: item }] }, version: 1 }).items).toEqual([item]);
  expect(rehydrate({ state: { items: [item] }, version: 2 }).items).toEqual([item]);
  expect(mergeStoredBasket(undefined, { items: [] }).items).toEqual([]);
  expect(mergeStoredBasket('junk', { items: [] }).items).toEqual([]);
});

test('basket titles tell sections and ranges of one source apart', () => {
  const doc = multi.title.english;
  const sec = multi.sections.find((s) => s.sectionNumber === 3)!;
  const t = basketToPrakara([multi.id, `${multi.id}/3`, `${multi.id}/3.3-9`, `${multi.id}/3.2`], 'x').items.map((i) => i.customTitle);
  expect(t).toEqual([doc, `${doc}: ${sec.title}`, `${doc}: §3 lines 3–9`, `${doc}: §3 line 2`]);
});
