import { describe, expect, it } from 'bun:test';
import { INITIAL_LEARNING, LEARN_LINES, LearningState, transition } from './cadenceMachine';

const tap = (s: LearningState, now = 1000) => transition(s, { type: 'tap', now, chunkId: 'c', chunkSanskrit: 'ॐ' });
const tapN = (s: LearningState, n: number) => {
  let cur = s;
  for (let i = 0; i < n; i++) cur = tap(cur, 1000 + i * 800);
  return cur;
};
const waiting: LearningState = { phase: 'waiting', learnedLines: 0, firstTapAt: null };

describe('cadence phase machine', () => {
  it('starts plain and moves to waiting when Smart turns on', () => {
    expect(INITIAL_LEARNING.phase).toBe('plain');
    expect(transition(INITIAL_LEARNING, { type: 'smartOn' })).toEqual(waiting);
  });

  it('starts the clock on the first tap, not on smartOn', () => {
    const s = tap(waiting, 5000);
    expect(s).toEqual({ phase: 'measuring', learnedLines: 1, firstTapAt: 5000 });
  });

  it('keeps the first tap time for the whole run', () => {
    const s = tapN(waiting, 3);
    expect(s.firstTapAt).toBe(1000);
  });

  it('engages after LEARN_LINES taps and ignores further taps', () => {
    expect(tapN(waiting, LEARN_LINES - 1).phase).toBe('measuring');
    const engaged = tapN(waiting, LEARN_LINES);
    expect(engaged.phase).toBe('engaged');
    expect(tapN(engaged, 3)).toBe(engaged);
  });

  it('ignores taps when plain', () => {
    expect(tap(INITIAL_LEARNING)).toBe(INITIAL_LEARNING);
  });

  it('reset returns learning to waiting from zero, and is a no-op when plain', () => {
    expect(transition(tapN(waiting, 2), { type: 'reset' })).toEqual(waiting);
    expect(transition(INITIAL_LEARNING, { type: 'reset' })).toBe(INITIAL_LEARNING);
  });

  it('smartOff from any phase returns to plain', () => {
    expect(transition(tapN(waiting, LEARN_LINES), { type: 'smartOff' })).toEqual(INITIAL_LEARNING);
    expect(transition(tapN(waiting, 2), { type: 'smartOff' })).toEqual(INITIAL_LEARNING);
  });

  it('smartOn while already learning does nothing', () => {
    const measuring = tapN(waiting, 2);
    expect(transition(measuring, { type: 'smartOn' })).toBe(measuring);
  });

  it('a host engages a follower and releases only engaged', () => {
    const engaged = transition(INITIAL_LEARNING, { type: 'hostOn' });
    expect(engaged.phase).toBe('engaged');
    expect(transition(engaged, { type: 'hostOff' })).toEqual(INITIAL_LEARNING);
    expect(transition(waiting, { type: 'hostOff' })).toBe(waiting);
  });
});
