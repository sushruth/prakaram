/**
 * The vendored sources the app can open: every document the runtime loader can fetch, one directory per
 * source under `sources/` (see sources/README.md). Nothing here is fetched at boot; the generic adapter
 * loads a source's index and the parts a route needs on demand. `label` is also the title shown while a
 * load is pending, before the document itself is in the corpus.
 */
export interface VendoredSource {
  id: string;
  /** The index document, relative to `sources/`; its parts sit beside it. */
  index: string;
  /** The IAST label; also the title shown while a load is pending, before the document is in the corpus. */
  label: string;
  /** The Devanagari title, so the home can show a source in the selected script before it is loaded. */
  sanskrit: string;
}

const DEVANAGARI_DIGITS = '०१२३४५६७८९';
const devanagari = (n: number) => String(n).replace(/\d/g, (d) => DEVANAGARI_DIGITS[+d]);

const rigvedaMandala = (n: number): VendoredSource => ({
  id: `rigveda-${n}`,
  index: `rigveda-${n}/index.json`,
  label: `Ṛgveda, Maṇḍala ${n}`,
  sanskrit: `ऋग्वेद, मण्डलम् ${devanagari(n)}`,
});
const aranyakaPrapathaka = (n: number): VendoredSource => ({
  id: `taittiriya-aranyaka-${n}`,
  index: `taittiriya-aranyaka-${n}/index.json`,
  label: `Taittirīya Āraṇyaka, Prapāṭhaka ${n}`,
  sanskrit: `तैत्तिरीय आरण्यक, प्रपाठकः ${devanagari(n)}`,
});

export const VENDORED_SOURCES: VendoredSource[] = [
  ...Array.from({ length: 10 }, (_, i) => rigvedaMandala(i + 1)),
  { id: 'taittiriya-samhita-4', index: 'taittiriya-samhita-4/index.json', label: 'Taittirīya Saṃhitā, Kāṇḍa 4', sanskrit: 'तैत्तिरीय संहिता, काण्डः ४' },
  ...Array.from({ length: 10 }, (_, i) => aranyakaPrapathaka(i + 1)),
  { id: 'rigveda-khila-sri', index: 'rigveda-khila-sri/index.json', label: 'Śrī Sūkta (Ṛgveda Khila)', sanskrit: 'श्री सूक्तम् (ऋग्वेद खिलम्)' },
];

/** The label for a vendored source id, for the loading state before its document is registered. */
export const liveSourceLabel = (id: string): string | undefined => VENDORED_SOURCES.find((s) => s.id === id)?.label;
