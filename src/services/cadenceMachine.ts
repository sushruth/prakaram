export const LEARN_LINES = 6;

export type CadencePhase = 'plain' | 'waiting' | 'measuring' | 'engaged';

export interface LearningState {
  phase: CadencePhase;
  learnedLines: number;
  firstTapAt: number | null;
  paused: boolean;
}

export type CadenceEvent =
  | { type: 'smartOn' }
  | { type: 'smartOff' }
  | { type: 'tap'; now: number; chunkId: string; chunkSanskrit: string }
  | { type: 'reset' }
  | { type: 'hostOn' }
  | { type: 'hostOff' }
  | { type: 'togglePause' };

export const isLearning = (phase: CadencePhase) => phase === 'waiting' || phase === 'measuring';

export const INITIAL_LEARNING: LearningState = { phase: 'plain', learnedLines: 0, firstTapAt: null, paused: false };

const WAITING: LearningState = { phase: 'waiting', learnedLines: 0, firstTapAt: null, paused: false };

export function transition(state: LearningState, event: CadenceEvent): LearningState {
  switch (event.type) {
    case 'smartOn':
      return state.phase === 'plain' ? WAITING : state;
    case 'smartOff':
      return INITIAL_LEARNING;
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
      return state.phase === 'plain' ? state : WAITING;
    case 'hostOn':
      return { phase: 'engaged', learnedLines: LEARN_LINES, firstTapAt: state.firstTapAt, paused: false };
    case 'hostOff':
      return state.phase === 'engaged' ? INITIAL_LEARNING : state;
    case 'togglePause':
      return state.phase === 'engaged' ? { ...state, paused: !state.paused } : state;
  }
}
