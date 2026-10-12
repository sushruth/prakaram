import { expect, test } from 'bun:test';
import { ALL_SUKTAMS } from '../data';
import { basketToPrakara, moveItem } from './basket';
import { decodePrakaraFromUrlHash, encodePrakaraToUrlHash } from './urlCodec';

const multi = ALL_SUKTAMS.find((d) => d.sections.length > 2)!;
const other = ALL_SUKTAMS.find((d) => d.id !== multi.id)!;
const ids = (l: { pieceId: string }[]) => l.map((i) => i.pieceId).join();

test('moveItem swaps neighbours and stops at the ends', () => {
  const l = [{ pieceId: 'a' }, { pieceId: 'b' }, { pieceId: 'c' }];
  expect(ids(moveItem(l, 'c', -1))).toBe('a,c,b');
  expect(ids(moveItem(l, 'a', -1))).toBe('a,b,c');
  expect(ids(moveItem(l, 'c', 1))).toBe('a,b,c');
});

test('a section item keeps its sectionId through the url codec', async () => {
  const p = basketToPrakara([{ pieceId: `${multi.id}/2` }, { pieceId: other.id }], '  ');
  expect(p.title).toBe('My prakaram');
  expect(p.items[0].sectionId).toBe(multi.sections[1].id);
  expect(p.items[1].sectionId).toBeUndefined();
  const round = await decodePrakaraFromUrlHash(await encodePrakaraToUrlHash(p));
  expect(round?.items[0].sectionId).toBe(multi.sections[1].id);
});
