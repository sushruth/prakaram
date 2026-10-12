import { describe, it, expect } from 'bun:test';
import { CadenceLearningEngine } from './cadenceEngine';

describe('CadenceLearningEngine (Option A)', () => {
  it('initializes with default Abhyasa 72 BPM', () => {
    const engine = new CadenceLearningEngine(72);
    expect(engine.getBpm()).toBe(72);
    expect(engine.getMsPerMatra()).toBe(833);
  });

  it('updates BPM and msPerMatra on scale change', () => {
    const engine = new CadenceLearningEngine(72);
    engine.setBpm(48);
    expect(engine.getBpm()).toBe(48);
    expect(engine.getMsPerMatra()).toBe(1250);
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
