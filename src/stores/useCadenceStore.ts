import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CadenceLearningEngine, TEMPO } from '../services/cadenceEngine';
import { boolOr, clampNumber } from './persistence';

export const LEARN_LINES = 4;

export type CadencePhase = 'plain' | 'learning' | 'engaged';

interface CadenceState {
  smart: boolean;
  learnedLines: number;
  bpm: number;
  msPerMatra: number;
  engine: CadenceLearningEngine;
  setSmart: (smart: boolean, learnedLines?: number) => void;
  setBpm: (bpm: number) => void;
  registerTap: (chunkId: string, chunkSanskrit: string) => void;
  resetCadence: () => void;
}

export const selectPhase = (s: Pick<CadenceState, 'smart' | 'learnedLines'>): CadencePhase =>
  !s.smart ? 'plain' : s.learnedLines < LEARN_LINES ? 'learning' : 'engaged';

const engine = new CadenceLearningEngine(TEMPO.fallback);

const snapshot = () => {
  const m = engine.getMetrics();
  return { bpm: m.currentBpm, msPerMatra: m.msPerMatra };
};

export const useCadenceStore = create<CadenceState>()(
  persist(
    (set) => ({
      smart: false,
      learnedLines: 0,
      bpm: TEMPO.fallback,
      msPerMatra: engine.getMsPerMatra(),
      engine,
      setSmart: (smart, learnedLines = 0) => {
        if (smart) engine.resetSession();
        set({ smart, learnedLines: smart ? learnedLines : 0, ...snapshot() });
      },
      setBpm: (bpm) => {
        engine.setBpm(clampNumber(bpm, TEMPO.min, TEMPO.max, TEMPO.fallback));
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
      partialize: ({ smart, learnedLines, bpm }) => ({ smart, learnedLines, bpm }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Record<string, unknown>;
        const legacySmart = p.mode === 'learn' || p.mode === 'auto';
        return {
          ...current,
          smart: boolOr(p.smart, legacySmart),
          learnedLines: clampNumber(p.learnedLines, 0, LEARN_LINES, 0),
          bpm: clampNumber(p.bpm, TEMPO.min, TEMPO.max, current.bpm),
        };
      },
    },
  ),
);

const hydrated = useCadenceStore.getState();
engine.setBpm(hydrated.bpm);
useCadenceStore.setState(snapshot());
