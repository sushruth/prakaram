import { describe, expect, it } from 'bun:test';
import { Glob } from 'bun';
import { readFileSync } from 'node:fs';
import type { MantraDocument } from '../types/mantra';
import { citeInWords, ordinal } from './cite';

// Fixtures standing in for the live corpus: nothing is bundled in `src/data` any more. Two documents carry
// a `place` (as the Taittirīya Saṃhitā does) and one does not, so both citation paths are exercised.
const withPlace = (id: string, prapathaka: number): MantraDocument => ({
  id,
  title: { sanskrit: 'तैत्तिरीय संहिता', transliteration: id, english: id },
  metadata: {
    source: 'test',
    place: { work: { sanskrit: 'तैत्तिरीय संहिता', english: 'Taittirīya Saṃhitā' }, divisions: [{ kind: 'kāṇḍa', n: 4 }, { kind: 'prapāṭhaka', n: prapathaka }] },
  },
  sections: [{ id: `${id}-1`, title: 'Anuvaka 1', sectionNumber: 1, chunks: [{ id: `${id}-1-1`, chunkNumber: 1, sanskrit: 'अ' }] }],
});

const FIXTURES: MantraDocument[] = [
  withPlace('rudram-namakam', 5),
  withPlace('rudram-chamakam', 7),
  {
    id: 'sri-suktam',
    title: { sanskrit: 'श्री सूक्तम्', transliteration: 'Śrī Sūktam', english: 'Sri Suktam' },
    metadata: { source: 'test' },
    sections: [{ id: 'sri-suktam-1', title: 'Anuvaka 1', sectionNumber: 1, chunks: [{ id: 'sri-suktam-1-1', chunkNumber: 1, sanskrit: 'अ' }] }],
  },
];

const doc = (id: string) => FIXTURES.find((d) => d.id === id)!;

describe('ordinals', () => {
  it('are Sanskrit words up to 30, then a numeral with a suffix', () => {
    expect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(ordinal).join(' ')).toBe('प्रथम द्वितीय तृतीय चतुर्थ पञ्चम षष्ठ सप्तम अष्टम नवम दशम एकादश द्वादश');
    expect(ordinal(30)).toBe('त्रिंश');
    for (let i = 1; i <= 30; i++) expect(ordinal(i)).not.toContain('-');
    expect(ordinal(31)).toBe('31-तम');
  });
});

describe('citeInWords', () => {
  it('names the work, its divisions and the anuvāka in the chosen script', () => {
    expect(citeInWords(doc('rudram-namakam'), 'rudram-namakam/1', 'iast')).toBe('Taittirīya Saṃhitā · caturtha-kāṇḍa · pañcama-prapāṭhaka · prathama-anuvāka');
    expect(citeInWords(doc('rudram-chamakam'), 'rudram-chamakam/11', 'devanagari')).toBe('तैत्तिरीय संहिता · चतुर्थ-काण्ड · सप्तम-प्रपाठक · एकादश-अनुवाक');
    expect(citeInWords(doc('rudram-namakam'), 'rudram-namakam', 'kannada')).toContain('ತೈತ್ತಿರೀಯ');
    expect(citeInWords(doc('rudram-namakam'), 'rudram-namakam', 'iast')).toBe('Taittirīya Saṃhitā · caturtha-kāṇḍa · pañcama-prapāṭhaka');
  });
  it('appends padya and pada words', () => {
    expect(citeInWords(doc('rudram-namakam'), 'rudram-namakam/3.2-9', 'iast')).toEndWith('tṛtīya-anuvāka · dvitīya–navama-pāda');
    expect(citeInWords(doc('rudram-namakam'), 'rudram-namakam/3.4', 'iast')).toEndWith('tṛtīya-anuvāka · caturtha-pāda');
    expect(citeInWords(doc('rudram-namakam'), 'rudram-namakam/3.p2', 'iast')).toEndWith('tṛtīya-anuvāka · dvitīya-ṛk');
    expect(citeInWords(doc('rudram-namakam'), 'rudram-namakam/3.p2-p5', 'iast')).toEndWith('dvitīya–pañcama-ṛk');
    expect(citeInWords(doc('rudram-namakam'), 'rudram-namakam/3.p2.4', 'iast')).toEndWith('dvitīya-ṛk · caturtha-pāda');
    expect(citeInWords(doc('rudram-namakam'), 'rudram-namakam/2.1-4.1', 'iast')).toEndWith('dvitīya–caturtha-anuvāka');
  });
  it('gives just the title when the source has no place', () => {
    expect(citeInWords(doc('sri-suktam'), 'sri-suktam/1.p2', 'devanagari')).toBe(doc('sri-suktam').title.sanskrit);
  });
  it('has places only where filled, with no dotted cite left', () => {
    expect(FIXTURES.filter((d) => d.metadata.place).map((d) => d.id)).toEqual(['rudram-namakam', 'rudram-chamakam']);
    for (const d of FIXTURES) expect('cite' in d.metadata).toBe(false);
  });
});

describe('display', () => {
  it('no component shows the old dotted or abbreviated citation', () => {
    for (const f of new Glob('src/components/**/*.tsx').scanSync('.')) {
      const src = readFileSync(f, 'utf8');
      expect(/metadata\.cite|partLabel|\bTS \d|§\$\{[^}]*\}\.\$\{/.test(src) ? f : '').toBe('');
    }
  });
});
