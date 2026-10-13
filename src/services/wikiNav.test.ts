import { expect, test } from 'bun:test';
import { articleHash, categoryHash, legacyHash, nirdesaHash, parseRoute, routeRangeOk, searchHash } from './wikiNav';

test('hash routes', () => {
  expect(parseRoute('')).toEqual({ kind: 'player' });
  expect(parseRoute('#')).toEqual({ kind: 'player' });
  expect(parseRoute('#compose')).toEqual({ kind: 'player' });
  expect(parseRoute('#/wiki')).toEqual({ kind: 'home' });
  expect(parseRoute('#/wiki/')).toEqual({ kind: 'home' });
  expect(parseRoute('#/wiki/Special:Compose')).toEqual({ kind: 'compose' });
  expect(parseRoute('#/wiki/Special:Random')).toEqual({ kind: 'random' });
  expect(parseRoute(articleHash('rudram-namakam'))).toEqual({ kind: 'article', id: 'rudram-namakam' });
  expect(parseRoute('#/wiki/rudram-namakam/3')).toEqual({ kind: 'article', id: 'rudram-namakam', section: 3 });
  expect(parseRoute(articleHash('rudram-namakam/3'))).toEqual({ kind: 'article', id: 'rudram-namakam/3' });
  expect(parseRoute(categoryHash('Rig Veda'))).toEqual({ kind: 'category', name: 'Rig Veda' });
  expect(parseRoute(searchHash('śrī sūkta'))).toEqual({ kind: 'search', q: 'śrī sūkta' });
});

test('legacy #k= links', () => {
  expect(legacyHash('#k=rudram-namakam/3')).toBe('#/wiki/rudram-namakam/3');
  expect(legacyHash('#k=rudram-namakam%2F3')).toBe('#/wiki/rudram-namakam/3');
  expect(legacyHash('#k=rudram-namakam')).toBe('#/wiki/rudram-namakam');
  expect(legacyHash('#k=%E0%A4%A0%')).toBeDefined();
  expect(legacyHash('#/wiki')).toBeUndefined();
});

test('line and range addresses', () => {
  const from = { section: 3, pada: 2 };
  expect(parseRoute('#/wiki/rudram-namakam/3.2-3.9')).toEqual({ kind: 'article', id: 'rudram-namakam', section: 3, range: { from, to: { section: 3, pada: 9 } } });
  expect(parseRoute('#/wiki/rudram-namakam/3.2-9')).toEqual({ kind: 'article', id: 'rudram-namakam', section: 3, range: { from, to: { section: 3, pada: 9 } } });
  expect(parseRoute('#/wiki/rudram-namakam/3.2')).toEqual({ kind: 'article', id: 'rudram-namakam', section: 3, range: { from, to: from } });
  expect((parseRoute('#/wiki/rudram-namakam/3.2-4.1') as { range: { to: unknown } }).range.to).toEqual({ section: 4, pada: 1 });
  expect(parseRoute('#/wiki/rudram-namakam/x.2')).toEqual({ kind: 'article', id: 'rudram-namakam' });
  expect(nirdesaHash('rudram-namakam/3.2-9')).toBe('#/wiki/rudram-namakam/3.2-9');
  expect(nirdesaHash('rudram-namakam')).toBe('#/wiki/rudram-namakam');
});

test('linked ranges must resolve: out-of-range and reversed ones are rejected', () => {
  const ok = (h: string) => {
    const r = parseRoute(h) as Extract<ReturnType<typeof parseRoute>, { kind: 'article' }>;
    return routeRangeOk(r.id, r.range);
  };
  expect(ok('#/wiki/rudram-namakam/3.2-4')).toBe(true);
  expect(ok('#/wiki/rudram-namakam/3.2-999')).toBe(false);
  expect(ok('#/wiki/rudram-namakam/3.999')).toBe(false);
  expect(ok('#/wiki/rudram-namakam/3.9-2')).toBe(false);
  expect(ok('#/wiki/rudram-namakam/999.1')).toBe(false);
  expect(ok('#/wiki/rudram-namakam/3')).toBe(true);
});
