import type { MantraChunk, MantraDocument, SuktaSection } from '../../../src/types/mantra';

/**
 * Parse one maṇḍala page of Dayananda Aithal's Saswara Rigveda Samhita (Devanagari, Format 1, without padapāṭha)
 * into a MantraDocument. Unlike DharmicData it marks the dīrgha svarita (᳚). Each mantra is a
 * `<td class='VargaStyleN'>`, its padas are split by `<p>`, and each pada ends in a `MantraIndentation` daṇḍa;
 * the last carries `{k/n}{maṇḍala.sūkta.ṛk}…` in `MantraNumbering`.
 */

const REPO = 'daithal/saswara-rigveda';
export const mandalaPath = (m: number): string =>
  `Rigveda/SamhitaPatha/Devanagari/Mandala/Format1/RVS-Devanagari-F1-M${String(m).padStart(2, '0')}-T1.html`;

const MANTRA = /<td class='VargaStyle\d'>([\s\S]*?)<\/td>/g;
const DANDA = /<span class='MantraIndentation'>(\|\|?)<\/span>/;
const ADDRESS = /\{\d+\/\d+\}\{(\d+)\.(\d+)\.(\d+)\}/;
const DEVANAGARI_DIGITS = '०१२३४५६७८९';

const devanagariNumber = (n: number): string => String(n).replace(/\d/g, (d) => DEVANAGARI_DIGITS[Number(d)]);

/** The bare text of a pada: tags and the zero-width non-joiner gone, the hiatus comma (`ते, असुर्य`) dropped. */
const clean = (html: string): string =>
  html
    .replace(/<[^>]+>/g, '')
    .replace(/‌/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/,\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

interface Mantra {
  sukta: number;
  rk: number;
  padas: string[];
}

/** One mantra cell: its address and its padas, each ending in `।` or, the last, in `॥ N ॥`. */
function parseMantra(cell: string, mandala: number): Mantra {
  const address = ADDRESS.exec(cell);
  if (!address) throw new Error(`mantra without an address in maṇḍala ${mandala}: ${clean(cell).slice(0, 60)}`);
  const [, m, sukta, rk] = address.map(Number);
  if (m !== mandala) throw new Error(`mantra ${m}.${sukta}.${rk} on the page of maṇḍala ${mandala}`);
  const padas = cell.split('<p>').map((piece) => {
    const danda = DANDA.exec(piece);
    if (!danda) throw new Error(`pada without a daṇḍa at ${m}.${sukta}.${rk}`);
    const text = clean(piece.slice(0, danda.index));
    return danda[1] === '||' ? `${text} ॥ ${devanagariNumber(rk)} ॥` : `${text} ।`;
  });
  return { sukta, rk, padas };
}

/** One maṇḍala as a document: one section per sūkta, one pada per chunk, the opening pada of a ṛk carrying its number. */
export function parseSaswaraRigvedaMandala(html: string, mandala: number): MantraDocument {
  const mantras = [...html.matchAll(MANTRA)].map((match) => parseMantra(match[1], mandala));
  if (!mantras.length) throw new Error(`no mantras on the page of maṇḍala ${mandala}`);

  const sections: SuktaSection[] = [];
  for (const { sukta, rk, padas } of mantras) {
    let section = sections.at(-1);
    if (section?.sectionNumber !== sukta) {
      section = { id: `saswara-rigveda-${mandala}-${sukta}`, title: `Maṇḍala ${mandala} · Sūkta ${sukta}`, sectionNumber: sukta, chunks: [] };
      sections.push(section);
    }
    const chunks = section.chunks as MantraChunk[];
    padas.forEach((sanskrit, i) => {
      const n = chunks.length + 1;
      chunks.push({ id: `srv-${mandala}-${sukta}-${n}`, chunkNumber: n, sanskrit, ...(n === 1 ? { section: sukta } : {}), ...(i === 0 ? { padya: rk } : {}) });
    });
  }

  return {
    id: `saswara-rigveda-${mandala}`,
    title: { sanskrit: 'ऋग्वेद', transliteration: `Ṛgveda (Saswara), Maṇḍala ${mandala}`, english: `Ṛgveda (Saswara), Maṇḍala ${mandala}` },
    metadata: {
      kind: 'source',
      veda: 'rigveda',
      vedaNote: `Ṛgveda, maṇḍala ${mandala}, from Dayananda Aithal's Saswara Rigveda Samhita, with the dīrgha svarita marked.`,
      place: { work: { sanskrit: 'ऋग्वेद', english: 'Ṛgveda' }, divisions: [{ kind: 'maṇḍala', n: mandala }] },
      source: `Saswara Rigveda Samhita (github.com/${REPO}), ${mandalaPath(mandala)}`,
      status: 'draft',
      categories: ['Rigveda', 'Samhitas'],
      summary: `The Ṛgveda, maṇḍala ${mandala}, in the South Indian svara marking with the dīrgha svarita. Each section is a sūkta and each line a pada.`,
    },
    sections,
  };
}
