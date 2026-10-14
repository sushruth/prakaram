/**
 * The vendored sources the app can open: every document the runtime loader can fetch, one file per
 * source under `sources/` (see sources/README.md). Nothing here is fetched at boot; the generic
 * adapter loads a file on demand. `label` is also the title shown while a load is pending, before the
 * document itself is in the corpus.
 */
export interface VendoredSource {
  id: string;
  file: string;
  label: string;
}

const rigvedaMandala = (n: number): VendoredSource => ({ id: `rigveda-${n}`, file: `rigveda-${n}.json`, label: `Ṛgveda, Maṇḍala ${n}` });
const aranyakaPrapathaka = (n: number): VendoredSource => ({ id: `taittiriya-aranyaka-${n}`, file: `taittiriya-aranyaka-${n}.json`, label: `Taittirīya Āraṇyaka, Prapāṭhaka ${n}` });

export const VENDORED_SOURCES: VendoredSource[] = [
  ...Array.from({ length: 10 }, (_, i) => rigvedaMandala(i + 1)),
  { id: 'taittiriya-samhita-4', file: 'taittiriya-samhita-4.json', label: 'Taittirīya Saṃhitā, Kāṇḍa 4' },
  ...Array.from({ length: 10 }, (_, i) => aranyakaPrapathaka(i + 1)),
  { id: 'rigveda-khila-sri', file: 'rigveda-khila-sri.json', label: 'Śrī Sūkta (Ṛgveda Khila)' },
];

/** The label for a vendored source id, for the loading state before its document is registered. */
export const liveSourceLabel = (id: string): string | undefined => VENDORED_SOURCES.find((s) => s.id === id)?.label;
