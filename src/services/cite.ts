import type { DivisionKind, MantraDocument, TargetScript } from '../types/mantra';
import { transliterateVedic } from './transliteration';
import { parseNirdesa } from './nirdesa';

// Citation in words: the way older texts cite, in the work's own division names with Sanskrit ordinals.
// Built in Devanagari and passed through the one transliterator, so it follows the selected script.

const ORDINALS = [
  '', 'प्रथम', 'द्वितीय', 'तृतीय', 'चतुर्थ', 'पञ्चम', 'षष्ठ', 'सप्तम', 'अष्टम', 'नवम', 'दशम',
  'एकादश', 'द्वादश', 'त्रयोदश', 'चतुर्दश', 'पञ्चदश', 'षोडश', 'सप्तदश', 'अष्टादश', 'एकोनविंश', 'विंश',
  'एकविंश', 'द्वाविंश', 'त्रयोविंश', 'चतुर्विंश', 'पञ्चविंश', 'षड्विंश', 'सप्तविंश', 'अष्टाविंश', 'एकोनत्रिंश', 'त्रिंश',
];

/** Sanskrit ordinal word in Devanagari (1 प्रथम … 30 त्रिंश); beyond that the numeral with a suffix ('31-तम'). */
export const ordinal = (n: number): string => ORDINALS[n] ?? `${n}-तम`;

const DIVISION: Record<DivisionKind, string> = {
  'kāṇḍa': 'काण्ड', 'prapāṭhaka': 'प्रपाठक', 'aṣṭaka': 'अष्टक', 'adhyāya': 'अध्याय', 'varga': 'वर्ग', 'anuvāka': 'अनुवाक',
  'maṇḍala': 'मण्डल', 'sūkta': 'सूक्त', 'praśna': 'प्रश्न', 'khaṇḍa': 'खण्ड', 'valli': 'वल्ली',
};

const word = (n: number, noun: string) => `${ordinal(n)}-${noun}`;
const span = (a: number, b: number, noun: string) => (a === b ? word(a, noun) : `${ordinal(a)}–${ordinal(b)}-${noun}`);

/**
 * Citation in words, e.g. 'Taittirīya Saṃhitā · caturtha-kāṇḍa · pañcama-prapāṭhaka · prathama-anuvāka' (in the given script).
 * The section is the anuvāka; a padya or pada address adds 'dvitīya-padya' / 'caturtha-pāda'. A source without `place` gives just its title.
 */
export function citeInWords(doc: MantraDocument, address: string, script: TargetScript): string {
  const place = doc.metadata.place;
  // IAST has case: the work's name is capitalised word by word ('Taittirīya Saṃhitā').
  const out = ([head, ...rest]: string[]) => {
    const t = (x: string) => transliterateVedic(x, script);
    const h = script === 'iast' ? t(head).replace(/(^| )(\S)/g, (_, a, b) => a + b.toUpperCase()) : t(head);
    return [h, ...rest.map(t)].join(' · ');
  };
  if (!place) return out([doc.title.sanskrit]);
  const n = parseNirdesa(address) ?? { source: doc.id };
  const parts = [place.work.sanskrit, ...place.divisions.map((d) => word(d.n, DIVISION[d.kind]))];
  if (n.section !== undefined) {
    const endSection = n.padya?.to?.section ?? n.to?.section ?? n.section;
    parts.push(span(n.section, endSection, DIVISION['anuvāka']));
    if (endSection === n.section) {
      if (n.padya) {
        const p = n.padya;
        parts.push(span(p.n, p.to?.n ?? p.n, 'पद्य'));
        if (p.pada !== undefined) parts.push(span(p.pada, p.toPada ?? p.pada, 'पाद'));
      } else if (n.pada !== undefined) parts.push(span(n.pada, n.to?.pada ?? n.pada, 'पाद'));
    }
  }
  return out(parts);
}
