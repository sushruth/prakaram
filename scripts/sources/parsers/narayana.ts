import type { MantraChunk, MantraDocument } from '../../../src/types/mantra';
import { splitAtDanda } from './danda';
import { decodeEntities, TAGS, ZERO_WIDTH } from './aranyaka';

export const NARAYANA_URL = 'https://sanskritdocuments.org/doc_upanishhat/nArAyaNopaniShat.html';
const DOC_ID = 'narayana-upanishad';

const PRE = /<pre\b[^>]*\bid="content"[^>]*>([\s\S]*?)<\/pre>/i;
/** Khaṇḍa headings the encoder prints in brackets: "(प्रथमः खण्डः\nनारायणात् …)". */
const KHANDA = /\((?:प्रथमः|द्वितीयः|तृतीयः|चतुर्थः) खण्डः[^)]*\)/g;
/** The dhyāna verse the encoder appends after the closing śānti; not part of the Upaniṣad. */
const DHYANA = 'शान्ताकारं';
/** The phalaśruti heading, printed on a line of its own. */
const PHALA_HEADING = /^\s*विद्याऽध्ययनफलम्\s*।\s*$/m;

/** Editorial additions: bracketed notes ("(एतदृग्वेदशिरोऽधीते ।)", "( bhAshya …)") and "var …" readings. */
const editorial = (s: string) => s.replace(/\([^)]*\)/g, ' ').replace(/\bvar\b[^\n]*/g, ' ');

/**
 * The Nārāyaṇa Upaniṣad (Nārāyaṇa Atharvaśiras) from sanskritdocuments.org, as printed in Saswara Veda
 * Mantrāḥ: the opening śānti, the four khaṇḍas (one section each, the phalaśruti closing the fourth) and the
 * closing śānti. The page has no swara. Headings, bracketed notes, variant readings, the appended dhyāna
 * verse and the encoder's credit are left out.
 */
export function parseNarayana(html: string): MantraDocument {
  const pre = PRE.exec(html);
  if (!pre) throw new Error('narayana: no <PRE id="content"> in the page');
  let body = decodeEntities(pre[1].replace(TAGS, '')).replace(ZERO_WIDTH, '');
  body = body.slice(body.indexOf('ॐ सह'), body.indexOf(DHYANA)).replace(PHALA_HEADING, '');
  const khandas = body.split(KHANDA).map((k) => splitAtDanda(editorial(k).replace(/\s+/g, ' ').trim()).filter((p) => /[^\s।॥]/.test(p)));
  if (khandas.length !== 5) throw new Error(`narayana: expected the opening śānti and four khaṇḍas, found ${khandas.length} parts`);
  const [opening, ...rest] = khandas;
  rest[0] = [...opening, ...rest[0]];
  const sections = rest.map((padas, i) => ({
    id: `${DOC_ID}-${i + 1}`,
    title: `Khaṇḍa ${i + 1}`,
    sectionNumber: i + 1,
    chunks: padas.map((sanskrit, j): MantraChunk => ({ id: `${DOC_ID}-${i + 1}-${j + 1}`, chunkNumber: j + 1, sanskrit, ...(j === 0 ? { section: i + 1 } : {}) })),
  }));
  return {
    id: DOC_ID,
    title: { sanskrit: 'Nārāyaṇopaniṣat', transliteration: 'Nārāyaṇopaniṣat', english: 'Nārāyaṇa Upaniṣad' },
    metadata: {
      kind: 'source',
      veda: 'yajurveda',
      vedaNote: 'Nārāyaṇa Upaniṣad, also called the Nārāyaṇa Atharvaśiras; the page heads it as Krishna Yajurveda.',
      source: 'sanskritdocuments.org (nArAyaNopaniShat.html), encoded and proofread by Sunder Hattangadi',
      status: 'draft',
      license: 'Text from sanskritdocuments.org; permission not yet confirmed.',
      deity: 'Narayana',
      categories: ['Upanishads', 'Krishna Yajurveda'],
      summary: 'The short Nārāyaṇa Upaniṣad (Nārāyaṇa Atharvaśiras) in four khaṇḍas, with its opening and closing śānti. The upstream page has no swara marks.',
      remoteUrl: NARAYANA_URL,
    },
    sections,
  };
}
