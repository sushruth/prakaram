import { afterAll, describe, it, expect } from 'bun:test';
import { encodePrakaraToUrlHash, decodePrakaraFromUrlHash } from './urlCodec';
import { Prakara } from '../types/mantra';
import { normalizePrakara } from './koshah';
import { ALL_SUKTAMS, SUKTA_MAP, registerDocument } from '../data';
import type { MantraDocument } from '../types/mantra';

// A fixture standing in for the live corpus: nothing is bundled in `src/data` any more, so the persistence
// migration (which resolves a nirdeśa against the default corpus) gets this registered for the file.
const rudra: MantraDocument = {
  id: 'rudra-demo',
  title: { sanskrit: 'रुद्रम्', transliteration: 'Rudram', english: 'Rudram' },
  metadata: { source: 'test' },
  sections: [1, 2, 3].map((n) => ({
    id: `rudra-demo-${n}`,
    title: `Anuvaka ${n}`,
    sectionNumber: n,
    chunks: Array.from({ length: 5 }, (_, j) => ({ id: `rudra-demo-${n}-${j + 1}`, chunkNumber: j + 1, sanskrit: 'अ' })),
  })),
};
registerDocument(rudra);
afterAll(() => {
  const i = ALL_SUKTAMS.findIndex((d) => d.id === rudra.id);
  if (i >= 0) ALL_SUKTAMS.splice(i, 1);
  SUKTA_MAP.delete(rudra.id);
});

describe('Prakara URL Codec', () => {
  const testPrakara: Prakara = {
    id: 'test-prakara',
    title: 'Purusha Suktam Test',
    description: 'Unit test sequence',
    preferredBpm: 84,
    createdTimestamp: 1700000000,
    items: [
      { id: 'item-1', type: 'sukta_ref', suktaId: 'demo-source' },
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
        { id: 'a', type: 'sukta_ref', suktaId: 'rudra-demo', sectionId: 'rudra-demo-3' },
        { id: 'b', type: 'sukta_ref', suktaId: 'rudra-demo', nirdesa: 'rudra-demo/2.3-2.5' },
        { id: 'c', type: 'sukta_ref', suktaId: 'rudra-demo', nirdesa: 'bad//' },
      ],
    };
    const back = await decodePrakaraFromUrlHash(await encodePrakaraToUrlHash(old));
    expect(back?.items.map((i) => [i.sectionId, i.nirdesa])).toEqual([[undefined, 'rudra-demo/3'], [undefined, 'rudra-demo/2.3-5'], [undefined, undefined]]);
  });

  it('rejects what is not a prakara', () => {
    expect(normalizePrakara({ id: 1 })).toBeNull();
    expect(normalizePrakara({ id: 'x', items: [{ id: 'i', type: 'other' }, 3] })?.items).toEqual([]);
  });
});
