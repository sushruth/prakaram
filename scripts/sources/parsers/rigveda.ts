import type { MantraChunk, MantraDocument } from '../../../src/types/mantra';
import { printedNumeral } from '../../../src/services/padya';
import { splitAtDanda } from './danda';

/**
 * Parse one maṇḍala of DharmicData's Rigveda (accented JSON) into a MantraDocument. The fetch, cache
 * and registration live in the build script; only the parse lives here. See sources/README.md.
 */
export interface RigvedaRecord {
  veda: string;
  mandala: number;
  sukta: number;
  /** The sūkta: a header (rishi, devatā, chandas) then its mantras. */
  text: string;
}

/** DharmicData, the upstream edition: repo, pinned commit and the per-maṇḍala path template. */
const REPO = 'bhavykhatri/DharmicData';
const COMMIT = '96b3bafd47ffbfe1902f3f0ef7a1928dd43c34d7';
const PATH = 'Rigveda/rigveda_mandala_<N>.json';

const SWARA = /[\u0951\u0952\u1CDA]/;
/** A verse numeral printed after the verse's daṇḍa (`॥१॥`, `॥ १`, or on its own line); normalised to `॥ १ ॥`. */
const VERSE_NUMERAL = /॥\s*([0-9\u0966-\u096F]+)\s*॥?/g;
/** A split piece that is only a numeral and daṇḍas (`१॥`); it belongs to the pada before it. */
const NUMERAL_PIECE = /^[0-9\u0966-\u096F\s।॥]+$/;

const mandalaPath = (mandala: number) => PATH.replace('<N>', String(mandala));
const commitUrl = (mandala: number) => `https://github.com/${REPO}/blob/${COMMIT}/${mandalaPath(mandala)}`;

/** Drop the header (rishi, devatā, chandas), which has no swara, up to the first accented pada. */
function stripHeader(text: string): string {
  const first = SWARA.exec(text);
  if (!first) return text;
  const cut = Math.max(text.lastIndexOf('\n', first.index), text.lastIndexOf('।', first.index), text.lastIndexOf('॥', first.index));
  return cut < 0 ? text : text.slice(cut + 1);
}

/**
 * The padas of a sūkta body, each with its printed numeral at the end. The source prints a verse's
 * number after its daṇḍa, sometimes on the next line and sometimes without a closing daṇḍa, so the
 * number is first normalised to `॥ N ॥`; a lone numeral piece left by the split joins the pada before it.
 */
function padasOf(body: string): string[] {
  const padas: string[] = [];
  for (const piece of splitAtDanda(body.replace(VERSE_NUMERAL, '॥ $1 ॥ '))) {
    if (NUMERAL_PIECE.test(piece) && /[0-9\u0966-\u096F]/.test(piece) && padas.length) padas[padas.length - 1] += ` ${piece}`;
    else padas.push(piece);
  }
  return padas;
}

/** One maṇḍala of DharmicData's Rigveda as a document: one section per sūkta, one pada per chunk. */
export function parseRigvedaMandala(records: RigvedaRecord[], mandala: number): MantraDocument {
  const suktas = records.filter((r) => r.veda === 'rigveda' && r.mandala === mandala && typeof r.text === 'string').toSorted((a, b) => a.sukta - b.sukta);
  if (!suktas.length) throw new Error(`no records for Rigveda mandala ${mandala}`);

  return {
    id: `rigveda-${mandala}`,
    title: { sanskrit: 'ऋग्वेद', transliteration: `Ṛgveda, Maṇḍala ${mandala}`, english: `Ṛgveda, Maṇḍala ${mandala}` },
    metadata: {
      kind: 'source',
      veda: 'rigveda',
      vedaNote: `Ṛgveda, maṇḍala ${mandala}, from DharmicData (ODbL).`,
      place: { work: { sanskrit: 'ऋग्वेद', english: 'Ṛgveda' }, divisions: [{ kind: 'maṇḍala', n: mandala }] },
      source: `DharmicData (github.com/${REPO}), ${mandalaPath(mandala)}`,
      status: 'draft',
      // Kept in step with scripts/sources/generators/rigveda.ts; the generator overrides it so that
      // metadata.license always equals provenance.license (docs/licence-compliance.md §2.1).
      license: 'ODbL 1.0 — Contains information from DharmicData (https://github.com/bhavykhatri/DharmicData), which is made available here under the Open Database License (ODbL). Licence text: https://opendatacommons.org/licenses/odbl/1-0/',
      categories: ['Rigveda', 'Samhitas'],
      summary: `The Ṛgveda, maṇḍala ${mandala}, from DharmicData's accented text. Each section is a sūkta and each line a pada.`,
      remoteUrl: commitUrl(mandala),
    },
    sections: suktas.map((r) => {
      const chunks: MantraChunk[] = [];
      let last = 0;
      let opens = 0;
      for (const pada of padasOf(stripHeader(r.text))) {
        if (!SWARA.test(pada)) continue; // a colophon or a stray daṇḍa
        chunks.push({ id: `rv-${mandala}-${r.sukta}-${chunks.length + 1}`, chunkNumber: chunks.length + 1, sanskrit: pada, ...(chunks.length === 0 ? { section: r.sukta } : {}) });
        const n = printedNumeral(pada);
        if (n !== undefined && n > last) {
          chunks[opens].padya = n; // the pada that opens the verse carries its printed numeral
          last = n;
          opens = chunks.length;
        }
      }
      return { id: `rigveda-${mandala}-${r.sukta}`, title: `Maṇḍala ${mandala} · Sūkta ${r.sukta}`, sectionNumber: r.sukta, chunks };
    }),
  };
}
