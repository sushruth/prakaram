import { describe, it, expect } from 'bun:test';
import { CadenceLearningEngine, PACE_FLOOR, TEMPO } from './cadenceEngine';

describe('CadenceLearningEngine (Option A)', () => {
  it('initializes at the default pace of 833 ms per matra', () => {
    const engine = new CadenceLearningEngine();
    expect(engine.getMsPerMatra()).toBe(833);
  });

  it('sets the pace and clamps it to the slider range', () => {
    const engine = new CadenceLearningEngine();
    engine.setMsPerMatra(1250);
    expect(engine.getMsPerMatra()).toBe(1250);
    engine.setMsPerMatra(10);
    expect(engine.getMsPerMatra()).toBe(PACE_FLOOR);
    engine.setMsPerMatra(99999);
    expect(engine.getMsPerMatra()).toBe(TEMPO.max);
  });

  it('learns pacing and boosts confidence with steady tapping', () => {
    const engine = new CadenceLearningEngine();
    const testSanskrit = 'ॐ स॒हस्र॑शीर्षा॒ पुरु॑षः ।';
    for (let i = 1; i <= 5; i++) {
      engine.registerLine(`c${i}`, testSanskrit, 9600);
    }

    const metrics = engine.getMetrics();
    expect(metrics.historyLength).toBe(5);
    expect(metrics.confidenceScore).toBeGreaterThanOrEqual(75);
  });
});
