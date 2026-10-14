import type { MantraChunk, MantraDocument } from '../../../src/types/mantra';
import { splitAtDanda } from './danda';

/**
 * Parse the Śrī Sūkta page (sanskritdocuments.org, `-accent` page) into a MantraDocument. The fetch,
 * cache and registration live in the build script; only the parse lives here. The host sends no
 * Access-Control-Allow-Origin, so it is fetched server-side at build time. Use the `-accent` page:
 * the plain `s-sukta.html` has no swara.
 */
const DOC_ID = 'rigveda-khila-sri';
const HOST = 'sanskritdocuments.org';
const PAGE = '/doc_veda/s-sukta-accent.html';

/** The upstream page, cited as the source. */
const pageUrl = `https://${HOST}${PAGE}`;

const PRE = /<pre\b[^>]*\bid="content"[^>]*>([\s\S]*?)<\/pre>/i;
const H2 = /<h2\b[\s\S]*?<\/h2>/gi;
const TAGS = /<[^>]*>/g;
const ZERO_WIDTH = /[\u200b\u200c\u200d\u2060]/g;
/** The colophon that closes the sūkta; the encoder credits follow it and are not text. */
const COLOPHON = 'श्रीसूक्तोपनिषद्';
/** The phalaśruti heading, printed on a line of its own; a heading, not a chant line. */
const PHALASHRUTI_LINE = /^[ \t]*फलश्रुति[ \t]*$/m;
/** The printed verse numeral (`॥ १॥`), which must stay with the pada it closes, not split off at its daṇḍa. */
const VERSE_NUMERAL = /॥\s*\p{Nd}+\s*॥/gu;
const SENTINEL = /\uE000(\d+)\uE001/g;

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

/** A pada that is only daṇḍas (the `॥` that opens the closing śānti) carries no text. */
const hasText = (s: string) => /[^\s।॥]/.test(s);

/**
 * The Śrī Sūkta of the page: the `<PRE id="content">` block, its heading and tags stripped, entities
 * decoded, zero-width characters dropped, swara kept exactly. Verses are the blank-line blocks; the
 * phalaśruti heading, the closing colophon and the encoder credits are left out; each daṇḍa ends a pada,
 * and the printed `॥ N ॥` stays in the text so the ṛk level derives from it.
 */
export function parseSri(html: string): MantraDocument {
  const pre = PRE.exec(html);
  if (!pre) throw new Error('sri: no <PRE id="content"> in the page');
  const body = decodeEntities(pre[1].replace(H2, '').replace(TAGS, ''))
    .replace(ZERO_WIDTH, '')
    .split(COLOPHON)[0]
    .replace(PHALASHRUTI_LINE, '');
  // The verse numeral `॥ १॥` prints with a space after the closing daṇḍa of the verse, so `splitAtDanda`
  // would split it into a pada of its own and the ṛk level would be lost. Hold it aside, split, restore.
  const numerals: string[] = [];
  const held = body.replace(VERSE_NUMERAL, (m) => `\uE000${numerals.push(m) - 1}\uE001`);
  const padas = held
    .split(/\n\s*\n/)
    .map((block) => block.replace(/\s+/g, ' ').trim())
    // A block in parentheses is an editorial variant reading, not chant text.
    .filter((block) => block && !block.startsWith('('))
    .flatMap((block) => splitAtDanda(block))
    .filter(hasText)
    .map((pada) => pada.replace(SENTINEL, (_, i) => numerals[Number(i)]));
  if (!padas.length) throw new Error('sri: no text in the page');

  const chunks: MantraChunk[] = padas.map((sanskrit, i) => ({ id: `${DOC_ID}-1-${i + 1}`, chunkNumber: i + 1, sanskrit }));
  return {
    id: DOC_ID,
    title: { sanskrit: 'श्री सूक्तम्', transliteration: 'Śrī Sūktam', english: 'Śrī Sūkta (Ṛgveda Khila)' },
    metadata: {
      kind: 'source',
      veda: 'rigveda',
      vedaNote: 'Rigveda Khila (RvKh 2.6), the appendix to the Rigveda.',
      // RvKh 2.6: khaṇḍa 2, sūkta 6 (the closest division name to the Khila's own grouping).
      place: { work: { sanskrit: 'ऋग्वेद खिल', english: 'Ṛgveda (Khila)' }, divisions: [{ kind: 'khaṇḍa', n: 2 }, { kind: 'sūkta', n: 6 }] },
      source: 'sanskritdocuments.org (Śrī Sūkta, s-sukta-accent.html)',
      status: 'draft',
      license: 'Text from sanskritdocuments.org; permission not yet confirmed.',
      deity: 'Sri Mahalakshmi',
      categories: ['Suktas', 'Devi', 'Rigveda'],
      summary: 'The Śrī Sūkta, the hymn to Śrī (Lakṣmī), from the Khila appendix to the Ṛgveda (RvKh 2.6). The sixteen printed verse numerals give the ṛk level; each printed line is a pada.',
      remoteUrl: pageUrl,
    },
    sections: [{ id: `${DOC_ID}-1`, title: 'Śrī Sūkta (RvKh 2.6)', sectionNumber: 1, chunks }],
  };
}
