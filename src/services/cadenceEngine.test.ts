import { describe, it, expect } from 'bun:test';
import { CadenceLearningEngine, TEMPO } from './cadenceEngine';

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
    expect(engine.getMsPerMatra()).toBe(TEMPO.min);
    engine.setMsPerMatra(99999);
    expect(engine.getMsPerMatra()).toBe(TEMPO.max);
  });

  it('learns pacing and boosts confidence with steady tapping', () => {
    const engine = new CadenceLearningEngine(72);
    const testSanskrit = 'ॐ स॒हस्र॑शीर्षा॒ पुरु॑षः ।';
    let t = 10000;

    engine.registerTap('c1', testSanskrit, t);

    for (let i = 1; i <= 5; i++) {
      t += 9600;
      engine.registerTap(`c${i + 1}`, testSanskrit, t);
    }

    const metrics = engine.getMetrics();
    expect(metrics.historyLength).toBe(5);
    expect(metrics.confidenceScore).toBeGreaterThanOrEqual(75);
  });
});
