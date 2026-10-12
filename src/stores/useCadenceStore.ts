import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LAYA_PRESETS, LayaType } from '../types/cadence';
import { CadenceLearningEngine, TEMPO } from '../services/cadenceEngine';
import { boolOr, clampNumber, oneOf } from './persistence';

export const LEARN_LINES = 4;

export type CadencePhase = 'plain' | 'learning' | 'engaged';

interface CadenceState {
  smart: boolean;
  learnedLines: number;
  laya: LayaType;
  bpm: number;
  msPerMatra: number;
  engine: CadenceLearningEngine;
  setSmart: (smart: boolean, learnedLines?: number) => void;
  setBpm: (bpm: number, laya?: LayaType) => void;
  setLayaPreset: (laya: LayaType) => void;
  registerTap: (chunkId: string, chunkSanskrit: string) => void;
  resetCadence: () => void;
}

const LAYA_IDS = Object.keys(LAYA_PRESETS) as LayaType[];

export const selectPhase = (s: Pick<CadenceState, 'smart' | 'learnedLines'>): CadencePhase =>
  !s.smart ? 'plain' : s.learnedLines < LEARN_LINES ? 'learning' : 'engaged';

const engine = new CadenceLearningEngine(TEMPO.fallback);

const snapshot = () => {
  const m = engine.getMetrics();
  return { bpm: m.currentBpm, laya: m.activeLaya, msPerMatra: m.msPerMatra };
};

export const useCadenceStore = create<CadenceState>()(
  persist(
    (set) => ({
      smart: false,
      learnedLines: 0,
      laya: 'abhyasa',
      bpm: TEMPO.fallback,
      msPerMatra: engine.getMsPerMatra(),
      engine,
      setSmart: (smart, learnedLines = 0) => {
        if (smart) engine.resetSession();
        set({ smart, learnedLines: smart ? learnedLines : 0, ...snapshot() });
      },
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
        set((s) => ({ ...snapshot(), learnedLines: Math.min(LEARN_LINES, s.learnedLines + 1) }));
      },
      resetCadence: () => {
        engine.resetSession();
        set({ learnedLines: 0, ...snapshot() });
      },
    }),
    {
      name: 'parayanam-cadence',
      version: 2,
      partialize: ({ smart, learnedLines, laya, bpm }) => ({ smart, learnedLines, laya, bpm }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Record<string, unknown>;
        const legacySmart = p.mode === 'learn' || p.mode === 'auto';
        return {
          ...current,
          smart: boolOr(p.smart, legacySmart),
          learnedLines: clampNumber(p.learnedLines, 0, LEARN_LINES, 0),
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
