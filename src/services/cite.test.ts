import { describe, expect, it } from 'bun:test';
import { Glob } from 'bun';
import { readFileSync } from 'node:fs';
import { ALL_SUKTAMS } from '../data';
import { citeInWords, ordinal } from './cite';

const doc = (id: string) => ALL_SUKTAMS.find((d) => d.id === id)!;

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
    expect(ALL_SUKTAMS.filter((d) => d.metadata.place).map((d) => d.id)).toEqual(['rudram-namakam', 'rudram-chamakam']);
    for (const d of ALL_SUKTAMS) expect('cite' in d.metadata).toBe(false);
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
