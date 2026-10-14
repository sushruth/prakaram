import type { MantraChunk, MantraDocument } from '../../../src/types/mantra';
import { decodeEntities, TAGS, ZERO_WIDTH } from './aranyaka';
import { splitAtDanda } from './danda';

/**
 * Parse taittiriya.com Taittirīya Saṃhitā prashna pages (samhita/kanda_K_prashna_P) into one kāṇḍa's
 * MantraDocument: one section per anuvāka, numbered in reading order across the kāṇḍa, one pada per daṇḍa.
 * The fetch and cache live in the generator; only the parse lives here.
 */
const SECTION = /<section class="anuvaka-section" id="anuvaka-([^"]+)">/g;
/** The Devanagari half of a pañcāśat's text. The nested `pancashati-reading` span is a different class and is skipped. */
const PANCASHATI = /<span class="pancashati-text"[^>]*><span class="script-devanagari">([\s\S]*?)<\/span><span class="script-kannada"/g;

export interface PrashnaPage {
  prashna: number;
  html: string;
}

const text = (html: string): string => decodeEntities(html.replace(TAGS, '')).replace(ZERO_WIDTH, '').replace(/\s+/g, ' ').trim();

/** The Devanagari text of each anuvāka on a page, in order, with its printed id. */
function anuvakas(html: string): { id: string; text: string }[] {
  const marks = [...html.matchAll(SECTION)];
  return marks.map((m, i) => {
    const body = html.slice(m.index! + m[0].length, i + 1 < marks.length ? marks[i + 1].index! : html.length);
    return { id: m[1], text: [...body.matchAll(PANCASHATI)].map((p) => text(p[1])).filter(Boolean).join(' ') };
  });
}

/** One kāṇḍa of the Taittirīya Saṃhitā as a document; `pages` are its prashnas in order. */
export function parseTaittiriya(pages: PrashnaPage[], kanda: number): MantraDocument {
  let n = 0;
  const sections = pages.flatMap(({ prashna, html }) =>
    anuvakas(html)
      .filter((a) => a.text)
      .map((a) => {
        const anuvaka = Number(a.id);
        const chunks: MantraChunk[] = splitAtDanda(a.text).map((sanskrit, j) => ({
          id: `ts-${kanda}-${prashna}-${anuvaka}-${j + 1}`,
          chunkNumber: j + 1,
          sanskrit,
          ...(j === 0 ? { section: anuvaka } : {}),
        }));
        return { id: `taittiriya-samhita-${kanda}-${prashna}-${anuvaka}`, title: `Kāṇḍa ${kanda} · Prapāṭhaka ${prashna} · Anuvāka ${anuvaka}`, sectionNumber: ++n, chunks };
      }),
  );
  if (!sections.length) throw new Error(`no text for Taittiriya Samhita kanda ${kanda}`);

  return {
    id: `taittiriya-samhita-${kanda}`,
    title: { sanskrit: 'तैत्तिरीय संहिता', transliteration: 'Taittirīya Saṃhitā', english: 'Taittirīya Saṃhitā' },
    metadata: {
      veda: 'yajurveda',
      vedaNote: `Krishna Yajurveda, Taittiriya Samhita (kāṇḍa ${kanda}).`,
      // No `place`: the work's division (prapāṭhaka) changes from section to section, which `place` cannot express.
      source: `taittiriya.com (Taittirīya Saṃhitā, kāṇḍa ${kanda}), edited by Sridhar Iyer`,
      status: 'draft',
      license: 'Text from taittiriya.com; permission not yet confirmed.',
      categories: ['Yajurveda', 'Krishna Yajurveda', 'Samhitas'],
      summary: `The Taittirīya Saṃhitā of the Krishna Yajurveda, kāṇḍa ${kanda}, from taittiriya.com. The Rudram (Namakam, TS 4.5, and Chamakam, TS 4.7) is a range inside it.`,
    },
    sections,
  };
}
