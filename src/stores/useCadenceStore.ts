import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CadenceLearningEngine, TEMPO } from '../services/cadenceEngine';
import {
  CadenceEvent,
  CadencePhase,
  INITIAL_LEARNING,
  LEARN_LINES,
  LearningState,
  isLearning,
  transition,
} from '../services/cadenceMachine';
import { clampNumber, oneOf } from './persistence';

export { LEARN_LINES, isLearning };
export type { CadencePhase };

const PHASES: readonly CadencePhase[] = ['plain', 'waiting', 'measuring', 'engaged'];

interface CadenceState extends LearningState {
  bpm: number;
  msPerMatra: number;
  engine: CadenceLearningEngine;
  send: (event: CadenceEvent) => void;
  smartOn: () => void;
  smartOff: () => void;
  tap: (chunkId: string, chunkSanskrit: string) => void;
  resetLearning: () => void;
  followHost: (on: boolean) => void;
  setBpm: (bpm: number) => void;
}

const engine = new CadenceLearningEngine(TEMPO.fallback);

const snapshot = () => {
  const m = engine.getMetrics();
  return { bpm: m.currentBpm, msPerMatra: m.msPerMatra };
};

export const useCadenceStore = create<CadenceState>()(
  persist(
    (set, get) => {
      const send = (event: CadenceEvent) => {
        const before = get();
        const next = transition(before, event);
        if (next === before) return;
        if (event.type === 'smartOn' || event.type === 'smartOff' || event.type === 'reset') engine.resetSession();
        if (event.type === 'tap') engine.registerTap(event.chunkId, event.chunkSanskrit);
        set({ ...next, ...snapshot() });
      };
      return {
        ...INITIAL_LEARNING,
        bpm: TEMPO.fallback,
        msPerMatra: engine.getMsPerMatra(),
        engine,
        send,
        smartOn: () => send({ type: 'smartOn' }),
        smartOff: () => send({ type: 'smartOff' }),
        tap: (chunkId, chunkSanskrit) => send({ type: 'tap', now: Date.now(), chunkId, chunkSanskrit }),
        resetLearning: () => send({ type: 'reset' }),
        followHost: (on) => send({ type: on ? 'hostOn' : 'hostOff' }),
        setBpm: (bpm) => {
          engine.setBpm(clampNumber(bpm, TEMPO.min, TEMPO.max, TEMPO.fallback));
          set(snapshot());
        },
      };
    },
    {
      name: 'parayanam-cadence',
      version: 3,
      partialize: ({ phase, learnedLines, bpm }) => ({
        phase: phase === 'measuring' ? 'waiting' : phase,
        learnedLines,
        bpm,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Record<string, unknown>;
        const learned = clampNumber(p.learnedLines, 0, LEARN_LINES, 0);
        const legacy: CadencePhase =
          p.smart === true ? (learned >= LEARN_LINES ? 'engaged' : 'waiting') : 'plain';
        const phase = oneOf(p.phase, PHASES, legacy);
        return {
          ...current,
          phase,
          learnedLines: phase === 'plain' ? 0 : phase === 'engaged' ? LEARN_LINES : learned,
          firstTapAt: null,
          bpm: clampNumber(p.bpm, TEMPO.min, TEMPO.max, current.bpm),
        };
      },
    },
  ),
);

const hydrated = useCadenceStore.getState();
engine.setBpm(hydrated.bpm);
useCadenceStore.setState(snapshot());
