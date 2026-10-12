import { expect, test } from 'bun:test';
import { articleHash, categoryHash, legacyHash, parseRoute, searchHash } from './wikiNav';

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
