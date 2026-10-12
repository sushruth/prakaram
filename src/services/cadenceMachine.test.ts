import { describe, expect, it } from 'bun:test';
import { INITIAL_LEARNING, LEARN_LINES, LearningState, isAutoRunning, modeOf, transition } from './cadenceMachine';

const tap = (s: LearningState, now = 1000) => transition(s, { type: 'tap', now, chunkId: 'c', chunkSanskrit: 'ॐ' });
const tapN = (s: LearningState, n: number) => {
  let cur = s;
  for (let i = 0; i < n; i++) cur = tap(cur, 1000 + i * 800);
  return cur;
};
const learn = (): LearningState => transition(INITIAL_LEARNING, { type: 'setMode', mode: 'learn' });
const manual = transition(INITIAL_LEARNING, { type: 'setMode', mode: 'manual' });
const off = transition(INITIAL_LEARNING, { type: 'setMode', mode: 'off' });

describe('cadence modes', () => {
  it('starts with Auto off; manual auto-advances at the set pace', () => {
    expect(INITIAL_LEARNING.phase).toBe('off');
    expect(isAutoRunning(INITIAL_LEARNING)).toBe(false);
    expect(isAutoRunning(manual)).toBe(true);
  });

  it('off does not auto-advance and ignores taps and pause', () => {
    expect(off.phase).toBe('off');
    expect(isAutoRunning(off)).toBe(false);
    expect(tap(off)).toBe(off);
    expect(transition(off, { type: 'togglePause' })).toBe(off);
  });

  it('learn waits for the first tap and measures six lines', () => {
    const waiting = learn();
    expect(waiting.phase).toBe('waiting');
    expect(isAutoRunning(waiting)).toBe(false);
    const measuring = tap(waiting, 5000);
    expect(measuring).toEqual({ phase: 'measuring', learnedLines: 1, firstTapAt: 5000, paused: false });
    expect(tapN(waiting, LEARN_LINES - 1).phase).toBe('measuring');
  });

  it('learn engages after six taps and then auto-advances, ignoring further taps', () => {
    const engaged = tapN(learn(), LEARN_LINES);
    expect(engaged.phase).toBe('engaged');
    expect(isAutoRunning(engaged)).toBe(true);
    expect(tapN(engaged, 3)).toBe(engaged);
  });

  it('manual ignores taps and does not learn', () => {
    expect(tap(INITIAL_LEARNING)).toBe(INITIAL_LEARNING);
  });

  it('pause works in manual and engaged, and clears when the mode changes', () => {
    const paused = transition(manual, { type: 'togglePause' });
    expect(paused.paused).toBe(true);
    expect(isAutoRunning(paused)).toBe(false);
    expect(transition(paused, { type: 'togglePause' }).paused).toBe(false);
    const engagedPaused = transition(tapN(learn(), LEARN_LINES), { type: 'togglePause' });
    expect(engagedPaused.paused).toBe(true);
    expect(transition(engagedPaused, { type: 'setMode', mode: 'off' }).paused).toBe(false);
    expect(transition(engagedPaused, { type: 'reset' }).paused).toBe(false);
  });

  it('switching to learn from manual starts a fresh learning run', () => {
    expect(transition(INITIAL_LEARNING, { type: 'setMode', mode: 'learn' })).toEqual({
      phase: 'waiting',
      learnedLines: 0,
      firstTapAt: null,
      paused: false,
    });
  });

  it('setting the mode you are already in changes nothing', () => {
    const measuring = tapN(learn(), 2);
    expect(transition(measuring, { type: 'setMode', mode: 'learn' })).toBe(measuring);
    expect(transition(manual, { type: 'setMode', mode: 'manual' })).toBe(manual);
  });

  it('reset restarts learning, and does nothing in off or manual', () => {
    expect(transition(tapN(learn(), 2), { type: 'reset' })).toEqual(learn());
    expect(transition(manual, { type: 'reset' })).toBe(manual);
    expect(transition(off, { type: 'reset' })).toBe(off);
  });

  it('maps phases to modes', () => {
    expect(modeOf('off')).toBe('off');
    expect(modeOf('manual')).toBe('manual');
    expect(modeOf('measuring')).toBe('learn');
    expect(modeOf('engaged')).toBe('learn');
  });

  it('a host engages a follower and releases only engaged', () => {
    const engaged = transition(INITIAL_LEARNING, { type: 'hostOn' });
    expect(engaged.phase).toBe('engaged');
    expect(transition(engaged, { type: 'hostOff' })).toEqual(off);
    expect(transition(learn(), { type: 'hostOff' }).phase).toBe('waiting');
  });
});
