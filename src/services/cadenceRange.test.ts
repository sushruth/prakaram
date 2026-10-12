import { describe, expect, it } from 'bun:test';
import { CadenceLearningEngine, PACE_SLIDER_STEPS, TEMPO, chunkMatras, paceToSlider, sliderToPace } from './cadenceEngine';

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
  it('moving right is faster: the right end is the shortest pace', () => {
    expect(sliderToPace(0)).toBe(TEMPO.max);
    expect(sliderToPace(PACE_SLIDER_STEPS)).toBe(TEMPO.min);
    expect(paceToSlider(TEMPO.max)).toBe(0);
    expect(paceToSlider(TEMPO.min)).toBe(PACE_SLIDER_STEPS);
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

describe('learning a fast reader', () => {
  it('learns a pace below the slider minimum instead of pinning at it', () => {
    const lines = ['ॐ सहस्रशीर्षा पुरुषः । सहस्राक्षः सहस्रपात् ।', 'स भूमिं विश्वतो वृत्वा । अत्यतिष्ठद्दशाङ्गुलम् ॥'];
    const engine = new CadenceLearningEngine();
    let t = 1_000_000;
    engine.registerTap('0', lines[0], t);
    for (let i = 1; i <= 5; i++) {
      const prev = lines[(i - 1) % 2];
      t += chunkMatras(prev) * 200;
      engine.registerTap(String(i), lines[i % 2], t);
    }
    expect(engine.getMsPerMatra()).toBeGreaterThanOrEqual(195);
    expect(engine.getMsPerMatra()).toBeLessThanOrEqual(205);
  });
});
