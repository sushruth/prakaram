import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LAYA_PRESETS, LayaType } from '../types/cadence';
import { CadenceLearningEngine, TEMPO } from '../services/cadenceEngine';
import { clampNumber, oneOf } from './persistence';

export type CadenceMode = 'off' | 'learn' | 'auto';
export const CADENCE_MODES: readonly CadenceMode[] = ['off', 'learn', 'auto'];

const LAYA_IDS = Object.keys(LAYA_PRESETS) as LayaType[];

interface CadenceState {
  mode: CadenceMode;
  laya: LayaType;
  bpm: number;
  msPerMatra: number;
  confidenceScore: number;
  engine: CadenceLearningEngine;
  setMode: (mode: CadenceMode) => void;
  setBpm: (bpm: number, laya?: LayaType) => void;
  setLayaPreset: (laya: LayaType) => void;
  registerTap: (chunkId: string, chunkSanskrit: string) => void;
  resetCadence: () => void;
}

const engine = new CadenceLearningEngine(TEMPO.fallback);

const snapshot = () => {
  const m = engine.getMetrics();
  return {
    bpm: m.currentBpm,
    laya: m.activeLaya,
    msPerMatra: m.msPerMatra,
    confidenceScore: m.confidenceScore,
  };
};

export const useCadenceStore = create<CadenceState>()(
  persist(
    (set) => ({
      mode: 'off',
      laya: 'abhyasa',
      bpm: TEMPO.fallback,
      msPerMatra: engine.getMsPerMatra(),
      confidenceScore: 0,
      engine,
      setMode: (mode) => set({ mode }),
      setBpm: (bpm, laya = 'custom') => {
        engine.setBpm(clampNumber(bpm, TEMPO.min, TEMPO.max, TEMPO.fallback), laya);
        set(snapshot());
      },
      setLayaPreset: (laya) => {
        engine.setLayaPreset(laya);
        set(snapshot());
      },
      registerTap: (chunkId, chunkSanskrit) => {
        engine.registerTap(chunkId, chunkSanskrit);
        set(snapshot());
      },
      resetCadence: () => {
        engine.resetSession();
        set(snapshot());
      },
    }),
    {
      name: 'parayanam-cadence',
      version: 1,
      partialize: ({ mode, laya, bpm }) => ({ mode, laya, bpm }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<CadenceState>;
        return {
          ...current,
          mode: oneOf(p.mode, CADENCE_MODES, current.mode),
          laya: oneOf(p.laya, LAYA_IDS, current.laya),
          bpm: clampNumber(p.bpm, TEMPO.min, TEMPO.max, current.bpm),
        };
      },
    },
  ),
);

const hydrated = useCadenceStore.getState();
engine.setBpm(hydrated.bpm, hydrated.laya);
useCadenceStore.setState(snapshot());
