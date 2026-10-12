export const LEARN_LINES = 6;

export type CadenceMode = 'off' | 'manual' | 'learn';
export type CadencePhase = 'off' | 'manual' | 'waiting' | 'measuring' | 'engaged';

export interface LearningState {
  phase: CadencePhase;
  learnedLines: number;
  firstTapAt: number | null;
  paused: boolean;
}

export type CadenceEvent =
  | { type: 'setMode'; mode: CadenceMode }
  | { type: 'tap'; now: number; chunkId: string; chunkSanskrit: string }
  | { type: 'reset' }
  | { type: 'hostOn' }
  | { type: 'hostOff' }
  | { type: 'togglePause' };

export const modeOf = (phase: CadencePhase): CadenceMode =>
  phase === 'off' ? 'off' : phase === 'manual' ? 'manual' : 'learn';

export const isLearning = (phase: CadencePhase) => phase === 'waiting' || phase === 'measuring';

// Lines advance on their own in manual and in learned (engaged) phases, unless paused.
export const isAutoRunning = (s: Pick<LearningState, 'phase' | 'paused'>) =>
  (s.phase === 'manual' || s.phase === 'engaged') && !s.paused;

const MANUAL: LearningState = { phase: 'manual', learnedLines: 0, firstTapAt: null, paused: false };
const OFF: LearningState = { phase: 'off', learnedLines: 0, firstTapAt: null, paused: false };
export const INITIAL_LEARNING = OFF;
const WAITING: LearningState = { phase: 'waiting', learnedLines: 0, firstTapAt: null, paused: false };

export function transition(state: LearningState, event: CadenceEvent): LearningState {
  switch (event.type) {
    case 'setMode': {
      if (modeOf(state.phase) === event.mode) return state;
      return event.mode === 'off' ? OFF : event.mode === 'manual' ? MANUAL : WAITING;
    }
    case 'tap': {
      if (!isLearning(state.phase)) return state;
      const learned = Math.min(LEARN_LINES, state.learnedLines + 1);
      return {
        phase: learned >= LEARN_LINES ? 'engaged' : 'measuring',
        learnedLines: learned,
        firstTapAt: state.firstTapAt ?? event.now,
        paused: false,
      };
    }
    case 'reset':
      return state.phase === 'off' || state.phase === 'manual' ? state : WAITING;
    case 'hostOn':
      return { phase: 'engaged', learnedLines: LEARN_LINES, firstTapAt: state.firstTapAt, paused: false };
    case 'hostOff':
      return state.phase === 'engaged' ? OFF : state;
    case 'togglePause':
      return state.phase === 'manual' || state.phase === 'engaged' ? { ...state, paused: !state.paused } : state;
  }
}
