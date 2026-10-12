import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CadenceLearningEngine, TEMPO } from '../services/cadenceEngine';
import {
  CadenceEvent,
  CadenceMode,
  CadencePhase,
  INITIAL_LEARNING,
  LEARN_LINES,
  LearningState,
  isAutoRunning,
  isLearning,
  modeOf,
  transition,
} from '../services/cadenceMachine';
import { clampNumber, oneOf } from './persistence';

export { LEARN_LINES, isAutoRunning, isLearning, modeOf };
export type { CadenceMode, CadencePhase };

const MODES: readonly CadenceMode[] = ['off', 'manual', 'learn'];

interface CadenceState extends LearningState {
  msPerMatra: number;
  engine: CadenceLearningEngine;
  send: (event: CadenceEvent) => void;
  setMode: (mode: CadenceMode) => void;
  tap: (chunkId: string, chunkSanskrit: string) => void;
  resetLearning: () => void;
  followHost: (on: boolean) => void;
  togglePause: () => void;
  setMsPerMatra: (ms: number) => void;
}

const engine = new CadenceLearningEngine(TEMPO.fallback);

const snapshot = () => ({ msPerMatra: engine.getMsPerMatra() });

export const useCadenceStore = create<CadenceState>()(
  persist(
    (set, get) => {
      const send = (event: CadenceEvent) => {
        const before = get();
        const next = transition(before, event);
        if (next === before) return;
        if (event.type === 'setMode' || event.type === 'reset') engine.resetSession();
        if (event.type === 'tap') engine.registerTap(event.chunkId, event.chunkSanskrit);
        set({ ...next, ...snapshot() });
      };
      return {
        ...INITIAL_LEARNING,
        msPerMatra: engine.getMsPerMatra(),
        engine,
        send,
        setMode: (mode) => send({ type: 'setMode', mode }),
        tap: (chunkId, chunkSanskrit) => send({ type: 'tap', now: Date.now(), chunkId, chunkSanskrit }),
        resetLearning: () => send({ type: 'reset' }),
        followHost: (on) => send({ type: on ? 'hostOn' : 'hostOff' }),
        togglePause: () => send({ type: 'togglePause' }),
        setMsPerMatra: (ms) => {
          engine.setMsPerMatra(clampNumber(ms, TEMPO.min, TEMPO.max, TEMPO.fallback));
          set(snapshot());
        },
      };
    },
    {
      name: 'parayanam-cadence',
      version: 5,
      partialize: ({ phase, learnedLines, msPerMatra }) => ({
        mode: modeOf(phase),
        learnedLines,
        msPerMatra,
      }),
      // Older saves are passed through, so their phases can be mapped to modes in merge.
      migrate: (persisted) => persisted as { mode: CadenceMode; learnedLines: number; msPerMatra: number },
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Record<string, unknown>;
        const learned = clampNumber(p.learnedLines, 0, LEARN_LINES, 0);
        // Older saves used phases; a plain save meant no auto-advance.
        const legacy: CadenceMode =
          p.phase === 'plain' ? 'off' : p.smart === true || typeof p.phase === 'string' ? 'learn' : 'manual';
        const mode = oneOf(p.mode, MODES, legacy);
        const phase: CadencePhase =
          mode === 'off' ? 'off' : mode === 'manual' ? 'manual' : learned >= LEARN_LINES ? 'engaged' : 'waiting';
        return {
          ...current,
          phase,
          learnedLines: phase === 'engaged' ? LEARN_LINES : mode === 'learn' ? learned : 0,
          firstTapAt: null,
          paused: false,
          msPerMatra: clampNumber(p.msPerMatra, TEMPO.min, TEMPO.max, current.msPerMatra),
        };
      },
    },
  ),
);

const hydrated = useCadenceStore.getState();
engine.setMsPerMatra(hydrated.msPerMatra);
useCadenceStore.setState(snapshot());
