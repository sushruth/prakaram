import { describe, it, expect } from 'bun:test';
import { encodePrakaraToUrlHash, decodePrakaraFromUrlHash } from './urlCodec';
import { Prakara } from '../types/mantra';
import { normalizePrakara } from './koshah';

describe('Prakara URL Codec', () => {
  const testPrakara: Prakara = {
    id: 'test-prakara',
    title: 'Purusha Suktam Test',
    description: 'Unit test sequence',
    preferredBpm: 84,
    createdTimestamp: 1700000000,
    items: [
      { id: 'item-1', type: 'sukta_ref', suktaId: 'purusha-suktam' },
      { id: 'item-2', type: 'vakya', customTitle: 'Dhyanam', customText: 'शान्ताकारं भुजगशयनम्' }
    ]
  };

  it('compresses Prakara into URL safe string and decompresses accurately', async () => {
    const hash = await encodePrakaraToUrlHash(testPrakara);
    expect(typeof hash).toBe('string');
    expect(hash.length).toBeGreaterThan(10);
    expect(hash).toMatch(/^[A-Za-z0-9_-]+$/);

    const decoded = await decodePrakaraFromUrlHash(hash);
    expect(decoded).not.toBeNull();
    expect(decoded?.id).toBe(testPrakara.id);
    expect(decoded?.title).toBe(testPrakara.title);
    expect(decoded?.preferredBpm).toBe(84);
    expect(decoded?.items.length).toBe(2);
    expect(decoded?.items[1].customText).toBe('शान्ताकारं भुजगशयनम्');
  });
});

describe('Prakara persistence shape', () => {
  it('moves an old sectionId step to a nirdesa, and keeps a range', async () => {
    const old: Prakara = {
      id: 'old', title: 't', description: '', createdTimestamp: 1,
      items: [
        { id: 'a', type: 'sukta_ref', suktaId: 'rudram-namakam', sectionId: 'rudram-namakam-3' },
        { id: 'b', type: 'sukta_ref', suktaId: 'rudram-namakam', nirdesa: 'rudram-namakam/2.3-2.5' },
        { id: 'c', type: 'sukta_ref', suktaId: 'rudram-namakam', nirdesa: 'bad//' },
      ],
    };
    const back = await decodePrakaraFromUrlHash(await encodePrakaraToUrlHash(old));
    expect(back?.items.map((i) => [i.sectionId, i.nirdesa])).toEqual([[undefined, 'rudram-namakam/3'], [undefined, 'rudram-namakam/2.3-5'], [undefined, undefined]]);
  });

  it('rejects what is not a prakara', () => {
    expect(normalizePrakara({ id: 1 })).toBeNull();
    expect(normalizePrakara({ id: 'x', items: [{ id: 'i', type: 'other' }, 3] })?.items).toEqual([]);
  });
});
