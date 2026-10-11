export type LayaType = 'dhyana' | 'abhyasa' | 'parayana' | 'custom';

export interface LayaPreset {
  name: LayaType;
  label: string;
  sanskrit: string;
  bpm: number; // Beats / Matras per minute
  description: string;
}

export const LAYA_PRESETS: Record<LayaType, LayaPreset> = {
  dhyana: {
    name: 'dhyana',
    label: 'Dhyāna (Meditative)',
    sanskrit: 'ध्यान (विलम्बित)',
    bpm: 48,
    description: 'Slow, deep, deliberate articulation for meditation and beginner study'
  },
  abhyasa: {
    name: 'abhyasa',
    label: 'Abhyāsa (Practice)',
    sanskrit: 'अभ्यास (मध्य)',
    bpm: 72,
    description: 'Steady, traditional adhyayana cadence for regular chanting'
  },
  parayana: {
    name: 'parayana',
    label: 'Pārāyaṇa (Fluent)',
    sanskrit: 'पारायण (द्रुत)',
    bpm: 100,
    description: 'Continuous, fluent, rhythmic parayana recital'
  },
  custom: {
    name: 'custom',
    label: 'Custom Laya',
    sanskrit: 'स्वेच्छा लय',
    bpm: 72,
    description: 'Personalized learned tempo'
  }
};

export interface TapRecord {
  timestamp: number;
  chunkId: string;
  matraWeight: number;
  intervalMs: number;
  instantaneousMsPerMatra: number;
}

export interface SyncMessage {
  type: 'CHUNK_CHANGE' | 'TIME_SYNC' | 'TEMPO_CHANGE';
  chunkIndex: number;
  prakaraId?: string;
  hostTimestamp: number;
  msPerMatra: number;
  autoProgress: boolean;
}
