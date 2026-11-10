import type { MantraDocument } from '../../../src/types/mantra';
import { decodeEntities, TAGS, ZERO_WIDTH } from './aranyaka';

export const RUDRAM_URL = 'https://sanskritdocuments.org/doc_shiva/rudram.html';
const DOC_ID = 'namaste-astu-bhagavan';

const PRE = /<pre\b[^>]*\bid="content"[^>]*>([\s\S]*?)<\/pre>/i;
/** The page numbers the salutation `२.०`, between the last ṛk of anuvāka 1 (`१.१५`) and anuvāka 2. */
const BETWEEN = /॥\s*१\.१५\s*॥([\s\S]*?)॥\s*२\.०\s*॥/;

/**
 * The salutation chanted after the first anuvāka of the Rudram ("namaste astu bhagavan …"), taken from the
 * unaccented Rudram on sanskritdocuments.org. It is not in the Taittirīya Saṃhitā, so it has no svara.
 */
export function parseNamasteAstu(html: string): MantraDocument {
  const pre = PRE.exec(html);
  if (!pre) throw new Error('namaste-astu: no <PRE id="content"> in the page');
  const found = BETWEEN.exec(decodeEntities(pre[1].replace(TAGS, '')).replace(ZERO_WIDTH, ''));
  if (!found) throw new Error('namaste-astu: no passage between ॥ १.१५॥ and ॥ २.०॥');
  const sanskrit = `${found[1].replace(/\s+/g, ' ').trim()} ॥`;
  return {
    id: DOC_ID,
    title: { sanskrit: 'namaste astu bhagavan', transliteration: 'Namaste astu bhagavan', english: 'Namaste astu bhagavan' },
    metadata: {
      kind: 'source',
      vedaNote: 'Not in the Veda: a salutation chanted after the first anuvāka of the Rudram.',
      source: 'sanskritdocuments.org (doc_shiva/rudram.html, the Rudram without svara), between 1.15 and 2.1',
      status: 'draft',
      license: 'Text from sanskritdocuments.org; permission not yet confirmed.',
      deity: 'Shiva',
      categories: ['Stotras'],
      summary:
        'A salutation to Śiva chanted after the first anuvāka of the Śrī Rudram. It is not in the Taittirīya Saṃhitā and has no svara. The Śivarahasya sets it between the first and second anuvākas, and Nīlakaṇṭha Dīkṣita (17th century) calls its names "known from śruti" without naming one.',
      remoteUrl: RUDRAM_URL,
    },
    sections: [{ id: `${DOC_ID}-1`, title: 'Namaste astu bhagavan', sectionNumber: 1, chunks: [{ id: `${DOC_ID}-1-1`, chunkNumber: 1, sanskrit, section: 1 }] }],
  };
}
