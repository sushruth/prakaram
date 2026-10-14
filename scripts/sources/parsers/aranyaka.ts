import type { MantraChunk, MantraDocument } from '../../../src/types/mantra';
import { splitAtDanda } from './danda';

/**
 * Parse a taittiriya.com Āraṇyaka page into a MantraDocument: one section per anuvāka, one pada per
 * daṇḍa. The fetch, cache and registration live in the build script; only the parse lives here.
 * The host sends no Access-Control-Allow-Origin, so it is fetched server-side at build time.
 */
const HOST = 'taittiriya.com';

/** The upstream page, cited as the source. */
const pageUrl = (n: number) => `https://${HOST}/aranyaka/prapathaka_${n}`;

const SECTION = /<section class="anuvaka-section" id="anuvaka-([^"]+)">/g;
const ANUVAKA_NUMBER = /<span class="anuvaka-number">[\s\S]*?<span class="script-devanagari">([^<]*)<\/span>/;
/** The Devanagari half of a five-script group: it ends where the next script begins. */
const DEVANAGARI_BLOCK = /<span class="script-devanagari">([\s\S]*?)<\/span><span class="script-(?:kannada|telugu|tamil|grantha)"/g;

const DEVANAGARI_DIGITS = '०१२३४५६७८९';
const ZERO_WIDTH = /[\u200b\u200c\u200d\u2060]/g;
const TAGS = /<[^>]*>/g;

/** Decode the entities the page prints (`&amp;`, numeric, and the named few). `&amp;` last, so it is not decoded twice. */
function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&amp;/g, '&');
}

/** The Devanagari numeral in an `anuvaka-number`, or undefined when it is not a plain numeral. */
function devanagariNumber(s: string): number | undefined {
  const t = s.trim();
  if (!t) return undefined;
  let n = 0;
  for (const ch of t) {
    const d = DEVANAGARI_DIGITS.indexOf(ch);
    if (d < 0) return undefined;
    n = n * 10 + d;
  }
  return n;
}

/** The sections of the page, each with the HTML between its marker and the next. */
function splitSections(html: string): { key: string; html: string }[] {
  const marks = [...html.matchAll(SECTION)];
  return marks.map((m, i) => ({
    key: m[1],
    html: html.slice(m.index! + m[0].length, i + 1 < marks.length ? marks[i + 1].index! : html.length),
  }));
}

/**
 * The Devanagari text of one anuvāka: every sentence-bearing `script-devanagari` block, tags stripped,
 * entities decoded, zero-width characters dropped. The other four scripts, the anuvāka/pancashati number
 * markers and the korvai passages carry no `sentence` spans and are left out. Swara is kept exactly.
 */
function devanagariText(sectionHtml: string): string {
  const parts: string[] = [];
  for (const m of sectionHtml.matchAll(DEVANAGARI_BLOCK)) {
    if (!m[1].includes('class="sentence"')) continue;
    const text = decodeEntities(m[1].replace(TAGS, '')).replace(ZERO_WIDTH, '').replace(/\s+/g, ' ').trim();
    if (text) parts.push(text);
  }
  return parts.join(' ');
}

/** The anuvāka's number: the numeral printed in its `anuvaka-number`, else the number in its id (`K`). */
function anuvakaNumber(sectionHtml: string, key: string, fallback: number): number {
  const printed = ANUVAKA_NUMBER.exec(sectionHtml);
  const n = printed ? devanagariNumber(printed[1]) : undefined;
  if (n !== undefined) return n;
  const k = Number(key);
  return Number.isFinite(k) ? k : fallback;
}

/** One prapāṭhaka of the Taittiriya Aranyaka as a document: one section per anuvāka, one pada per daṇḍa. */
export function parseAranyaka(html: string, prapathaka: number): MantraDocument {
  const sections = splitSections(html)
    .map((s, i) => {
      const number = anuvakaNumber(s.html, s.key, i + 1);
      const chunks: MantraChunk[] = splitAtDanda(devanagariText(s.html)).map((sanskrit, j) => ({
        id: `ta-${prapathaka}-${number}-${j + 1}`,
        chunkNumber: j + 1,
        sanskrit,
        ...(j === 0 ? { section: number } : {}),
      }));
      return { number, chunks };
    })
    .filter((s) => s.chunks.length > 0);
  if (!sections.length) throw new Error(`no text for Taittiriya Aranyaka prapathaka ${prapathaka}`);

  return {
    id: `taittiriya-aranyaka-${prapathaka}`,
    title: { sanskrit: 'तैत्तिरीय आरण्यक', transliteration: 'Taittirīya Āraṇyaka', english: `Taittirīya Āraṇyaka, Prapāṭhaka ${prapathaka}` },
    metadata: {
      kind: 'source',
      veda: 'yajurveda',
      vedaNote: `Krishna Yajurveda, Taittirīya Āraṇyaka, prapāṭhaka ${prapathaka}.`,
      place: { work: { sanskrit: 'तैत्तिरीय आरण्यक', english: 'Taittirīya Āraṇyaka' }, divisions: [{ kind: 'prapāṭhaka', n: prapathaka }] },
      source: `taittiriya.com (Taittirīya Āraṇyaka, prapāṭhaka ${prapathaka})`,
      status: 'draft',
      license: 'Text from taittiriya.com; permission not yet confirmed.',
      categories: ['Yajurveda', 'Krishna Yajurveda', 'Aranyakas'],
      summary: `The Taittirīya Āraṇyaka of the Krishna Yajurveda, prapāṭhaka ${prapathaka}, from taittiriya.com. Each section is an anuvāka and each line a pada.`,
      remoteUrl: pageUrl(prapathaka),
    },
    sections: sections.map((s) => ({ id: `taittiriya-aranyaka-${prapathaka}-${s.number}`, title: `Prapāṭhaka ${prapathaka} · Anuvāka ${s.number}`, sectionNumber: s.number, chunks: s.chunks })),
  };
}
