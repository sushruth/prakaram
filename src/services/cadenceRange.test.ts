import { describe, expect, it } from 'bun:test';
import { CadenceLearningEngine, TEMPO } from './cadenceEngine';

describe('cadence tempo range', () => {
  it('keeps learned tempo inside the slider range', () => {
    const engine = new CadenceLearningEngine(TEMPO.fallback);
    let t = 1_000_000;
    engine.registerTap('a', 'अ आ', t);
    for (let i = 0; i < 20; i++) {
      t += 150;
      engine.registerTap('a', 'अ आ', t);
    }
    const bpm = engine.getBpm();
    expect(bpm).toBeLessThanOrEqual(TEMPO.max);
    expect(bpm).toBeGreaterThanOrEqual(TEMPO.min);
  });
});
