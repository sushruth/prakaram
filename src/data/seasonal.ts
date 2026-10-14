/**
 * PLACEHOLDER — seasonal picks keyed off the current date.
 *
 * The seasons and their picks are MADE UP. No panchangam, festival calendar or location is consulted;
 * a pick is "relevant now" only because this table says so. Replace the table (or this module) when
 * real panchangam plumbing exists. Every `id` must be a live source (`LIVE_SOURCES`) or a default
 * composition (`DEFAULT_PRAKARAS`) so the link resolves; the season name is the only other data the
 * home shows.
 */
import type { HomePick } from './topBrowsed';

export interface Season {
  name: string;
  /** Calendar months (1–12) this season covers. */
  months: number[];
  picks: HomePick[];
}

export const SEASONS: Season[] = [
  {
    name: 'Śiśira (winter)',
    months: [1, 2],
    picks: [
      { id: 'rudram-ts', label: 'Śrī Rudram (Taittirīya Saṃhitā)' },
      { id: 'taittiriya-aranyaka-10', label: 'Taittirīya Āraṇyaka, Prapāṭhaka 10' },
      { id: 'shanti-patha', label: 'Śānti Pāṭha & Meditation' },
    ],
  },
  {
    name: 'Vasanta (spring)',
    months: [3, 4],
    picks: [
      { id: 'rigveda-khila-sri', label: 'Śrī Sūkta (Ṛgveda Khila)' },
      { id: 'purusha-sri-combo', label: 'Purusha & Sri Suktam Combo' },
      { id: 'rigveda-1', label: 'Ṛgveda, Maṇḍala 1' },
    ],
  },
  {
    name: 'Grīṣma (summer)',
    months: [5, 6],
    picks: [
      { id: 'taittiriya-aranyaka-3', label: 'Taittirīya Āraṇyaka, Prapāṭhaka 3' },
      { id: 'rigveda-10', label: 'Ṛgveda, Maṇḍala 10' },
      { id: 'maha-prakaram', label: 'Mahāpārāyaṇam' },
    ],
  },
  {
    name: 'Varṣā (monsoon)',
    months: [7, 8],
    picks: [
      { id: 'rudram-ts', label: 'Śrī Rudram (Taittirīya Saṃhitā)' },
      { id: 'taittiriya-samhita-4', label: 'Taittirīya Saṃhitā, Kāṇḍa 4' },
      { id: 'shanti-patha', label: 'Śānti Pāṭha & Meditation' },
    ],
  },
  {
    name: 'Śarad (autumn)',
    months: [9, 10],
    picks: [
      { id: 'rigveda-khila-sri', label: 'Śrī Sūkta (Ṛgveda Khila)' },
      { id: 'taittiriya-aranyaka-10', label: 'Taittirīya Āraṇyaka, Prapāṭhaka 10' },
      { id: 'maha-prakaram', label: 'Mahāpārāyaṇam' },
    ],
  },
  {
    name: 'Hemanta (pre-winter)',
    months: [11, 12],
    picks: [
      { id: 'rudram-ts', label: 'Śrī Rudram (Taittirīya Saṃhitā)' },
      { id: 'taittiriya-samhita-4', label: 'Taittirīya Saṃhitā, Kāṇḍa 4' },
      { id: 'shanti-patha', label: 'Śānti Pāṭha & Meditation' },
    ],
  },
];

/** The season entry for a date (its month); falls back to the first entry for an out-of-range month. */
export function seasonAt(now: Date): Season {
  const month = now.getMonth() + 1;
  return SEASONS.find((s) => s.months.includes(month)) ?? SEASONS[0];
}

/** The picks relevant "now" (placeholder; see the module header). */
export function seasonalPicks(now: Date): HomePick[] {
  return seasonAt(now).picks;
}
