/**
 * PLACEHOLDER — static stand-in for real browse counts.
 *
 * These picks are MADE UP. Nothing records what readers open yet, so this list is a hand-written
 * stand-in; replace it (or this whole module) when real counts exist. Nothing else depends on its
 * contents. Every `id` must be a live source (`LIVE_SOURCES`) or a default composition
 * (`DEFAULT_PRAKARAS`) so the link resolves; the label is the text the home shows.
 */
export interface HomePick {
  id: string;
  label: string;
}

export const TOP_BROWSED: HomePick[] = [
  { id: 'rudram-ts', label: 'Śrī Rudram (Taittirīya Saṃhitā)' },
  { id: 'maha-prakaram', label: 'Mahāpārāyaṇam' },
  { id: 'rigveda-khila-sri', label: 'Śrī Sūkta (Ṛgveda Khila)' },
  { id: 'taittiriya-aranyaka-10', label: 'Taittirīya Āraṇyaka, Prapāṭhaka 10' },
  { id: 'shanti-patha', label: 'Śānti Pāṭha & Meditation' },
];
