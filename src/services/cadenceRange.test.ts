import { describe, expect, it } from 'bun:test';
import { CadenceLearningEngine, PACE_SLIDER_STEPS, TEMPO, paceToSlider, sliderToPace } from './cadenceEngine';

describe('cadence tempo range', () => {
  it('keeps learned tempo inside the slider range', () => {
    const engine = new CadenceLearningEngine(TEMPO.fallback);
    let t = 1_000_000;
    engine.registerTap('a', 'अ आ', t);
    for (let i = 0; i < 20; i++) {
      t += 150;
      engine.registerTap('a', 'अ आ', t);
    }
    const ms = engine.getMsPerMatra();
    expect(ms).toBeLessThanOrEqual(TEMPO.max);
    expect(ms).toBeGreaterThanOrEqual(TEMPO.min);
  });
});

describe('logarithmic pace slider', () => {
  it('maps the ends of the slider to the ends of the pace range', () => {
    expect(sliderToPace(0)).toBe(TEMPO.min);
    expect(sliderToPace(PACE_SLIDER_STEPS)).toBe(TEMPO.max);
    expect(paceToSlider(TEMPO.min)).toBe(0);
    expect(paceToSlider(TEMPO.max)).toBe(PACE_SLIDER_STEPS);
  });

  it('gives equal slider moves equal ratios', () => {
    const a = sliderToPace(50) / sliderToPace(0);
    const b = sliderToPace(100) / sliderToPace(50);
    expect(Math.abs(a - b) / a).toBeLessThan(0.02); // allows for 10 ms rounding
  });

  it('round-trips the default pace to within one slider step', () => {
    expect(Math.abs(sliderToPace(paceToSlider(TEMPO.fallback)) - TEMPO.fallback)).toBeLessThan(TEMPO.max / TEMPO.min);
  });
});
