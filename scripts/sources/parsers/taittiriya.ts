import type { MantraDocument } from '../../../src/types/mantra';
import { splitAtDanda } from './danda';

/**
 * Parse a Taittiriya Samhita page (Wikisource wikitext) into a MantraDocument.
 *
 * The Wikisource text is typed in a font whose Vedic marks live in the Private Use Area. They are
 * mapped here to Unicode; the two stray marks that could not be identified from context are dropped.
 * The source is the saṃhitā with words spaced; each printed mantra is split at its daṇḍas into padas.
 */
const PUA: Record<string, string> = {
  '\ue001': 'ं', // anusvara
  '\uf131': 'ः', // visarga (upadhmaniya before p)
  '\uf156': 'ः', // visarga (before s)
  '\uf176': '', // spurious reph-like mark
  '\uf185': '', // stray mark
  '\ue007': '', // stray mark
};

const clean = (s: string) =>
  [...s.replace(/[<>\u200b\u200c\u200d]/g, '')]
    .map((ch) => PUA[ch] ?? ch)
    .join('')
    .replace(/\s{2,}/g, ' ')
    .trim();

export interface TsRecord {
  k: number;
  p: number;
  a: number;
  m: number;
  text: string;
}

/** Records keyed by their `k.p.a.m` address; the text is the next line. */
export function parseRecords(wikitext: string): TsRecord[] {
  const body = wikitext.replace(/<\/?pre>/g, '').split('\n');
  const recs: TsRecord[] = [];
  for (let i = 0; i < body.length - 1; i++) {
    const m = body[i].trim().match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
    if (!m) continue;
    const [k, p, a, n] = m.slice(1).map(Number);
    const text = clean(body[i + 1]);
    if (text) recs.push({ k, p, a, m: n, text });
  }
  return recs;
}

/** Records for one kāṇḍa, one section per anuvāka, one pada per line. */
export function parseTaittiriya(wikitext: string, kanda: number): MantraDocument {
  const all = parseRecords(wikitext).filter((r) => r.k === kanda);
  if (!all.length) throw new Error(`no records for kanda ${kanda}`);

  const byAnuvaka = new Map<string, TsRecord[]>();
  for (const r of all) {
    if (r.a === 0) continue; // a=0 is the prapāṭhaka heading, not an anuvāka
    const key = `${r.k}.${r.p}.${r.a}`;
    if (!byAnuvaka.has(key)) byAnuvaka.set(key, []);
    byAnuvaka.get(key)!.push(r);
  }

  return {
    id: `taittiriya-samhita-${kanda}`,
    title: { sanskrit: 'तैत्तिरीय संहिता', transliteration: 'Taittirīya Saṃhitā', english: 'Taittirīya Saṃhitā' },
    metadata: {
      veda: 'yajurveda',
      vedaNote: `Krishna Yajurveda, Taittiriya Samhita (kāṇḍa ${kanda}).`,
      // No `place`: the work's division (prapāṭhaka) changes from section to section, which `place` cannot express.
      source: 'Wikisource (sa.wikisource.org), तैत्तिरीयसंहिता-१-४ (revid 417990) / -५-७ (revid 417991)',
      status: 'draft',
      license: 'CC BY-SA 4.0 — Wikisource contributors, https://creativecommons.org/licenses/by-sa/4.0/ (text fetched live, revision pinned)',
      categories: ['Yajurveda', 'Krishna Yajurveda', 'Samhitas'],
      summary: `The Taittirīya Saṃhitā of the Krishna Yajurveda, kāṇḍa ${kanda}, from Wikisource. The Rudram (Namakam, TS 4.5, and Chamakam, TS 4.7) is a range inside it.`,
    },
    sections: [...byAnuvaka.entries()].map(([key, recs], i) => {
      const [k, p, a] = key.split('.').map(Number);
      return {
        id: `taittiriya-samhita-${k}-${p}-${a}`,
        title: `Kāṇḍa ${k} · Prapāṭhaka ${p} · Anuvāka ${a}`,
        sectionNumber: i + 1,
        // `section` (the anuvāka) goes on the first pada only, so the player prints the heading once.
        chunks: recs
          .filter((r) => r.m > 0)
          .flatMap((r) => splitAtDanda(r.text))
          .map((sanskrit, j) => ({ id: `ts-${k}-${p}-${a}-${j + 1}`, chunkNumber: j + 1, sanskrit, ...(j === 0 ? { section: a } : {}) })),
      };
    }),
  };
}
