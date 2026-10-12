import { expect, test } from 'bun:test';
import { ALL_SUKTAMS } from '../data';
import { basketToPrakara, migrateBasket, moveItem } from './basket';
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
