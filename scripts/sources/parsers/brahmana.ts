import type { MantraChunk, MantraDocument } from '../../../src/types/mantra';
import { anuvakaNumber, devanagariText, splitSections } from './aranyaka';
import { splitAtDanda } from './danda';

export const brahmanaUrl = (ashtaka: number, prapathaka: number) => `https://taittiriya.com/brahmana/ashtaka_${ashtaka}_prapathaka_${prapathaka}`;

/** One prapāṭhaka of the Taittirīya Brāhmaṇa from taittiriya.com: one section per anuvāka, one pada per daṇḍa. */
export function parseBrahmana(html: string, ashtaka: number, prapathaka: number): MantraDocument {
  const id = `taittiriya-brahmana-${ashtaka}-${prapathaka}`;
  const sections = splitSections(html)
    .map((s, i) => {
      const number = anuvakaNumber(s.html, s.key, i + 1);
      const chunks: MantraChunk[] = splitAtDanda(devanagariText(s.html)).map((sanskrit, j) => ({
        id: `tb-${ashtaka}-${prapathaka}-${number}-${j + 1}`,
        chunkNumber: j + 1,
        sanskrit,
        ...(j === 0 ? { section: number } : {}),
      }));
      return { number, chunks };
    })
    .filter((s) => s.chunks.length > 0);
  if (!sections.length) throw new Error(`no text for Taittiriya Brahmana ${ashtaka}.${prapathaka}`);

  return {
    id,
    title: { sanskrit: 'Taittirīya Brāhmaṇa', transliteration: 'Taittirīya Brāhmaṇa', english: `Taittirīya Brāhmaṇa, Aṣṭaka ${ashtaka}, Prapāṭhaka ${prapathaka}` },
    metadata: {
      kind: 'source',
      veda: 'yajurveda',
      vedaNote: `Krishna Yajurveda, Taittirīya Brāhmaṇa, aṣṭaka ${ashtaka}, prapāṭhaka ${prapathaka}.`,
      place: { work: { sanskrit: 'Taittirīya Brāhmaṇa', english: 'Taittirīya Brāhmaṇa' }, divisions: [{ kind: 'aṣṭaka', n: ashtaka }, { kind: 'prapāṭhaka', n: prapathaka }] },
      source: `taittiriya.com (Taittirīya Brāhmaṇa, aṣṭaka ${ashtaka}, prapāṭhaka ${prapathaka}), edited by Sridhar Iyer`,
      status: 'draft',
      license: 'Text from taittiriya.com; permission not yet confirmed.',
      categories: ['Yajurveda', 'Krishna Yajurveda', 'Brahmanas'],
      summary: `The Taittirīya Brāhmaṇa of the Krishna Yajurveda, aṣṭaka ${ashtaka}, prapāṭhaka ${prapathaka}, from taittiriya.com. Each section is an anuvāka and each line a pada.`,
      remoteUrl: brahmanaUrl(ashtaka, prapathaka),
    },
    sections: sections.map((s) => ({ id: `${id}-${s.number}`, title: `Aṣṭaka ${ashtaka} · Prapāṭhaka ${prapathaka} · Anuvāka ${s.number}`, sectionNumber: s.number, chunks: s.chunks })),
  };
}
