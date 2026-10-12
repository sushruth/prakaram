import { TapRecord } from '../types/cadence';
import { calculateChunkWeight } from './syllabifier';

export const MIN_CHUNK_MATRAS = 2;

// Milliseconds per matra. Lower is faster.
export const TEMPO = { min: 400, max: 3000, fallback: 833, step: 10 } as const;

// The slider is logarithmic: equal moves multiply the pace by the same factor.
export const PACE_SLIDER_STEPS = 200;

export function paceToSlider(ms: number): number {
  return Math.round((Math.log(ms / TEMPO.min) / Math.log(TEMPO.max / TEMPO.min)) * PACE_SLIDER_STEPS);
}

export function sliderToPace(position: number): number {
  const ms = TEMPO.min * Math.pow(TEMPO.max / TEMPO.min, position / PACE_SLIDER_STEPS);
  return Math.round(ms / TEMPO.step) * TEMPO.step;
}

export function chunkMatras(sanskrit: string): number {
  return Math.max(MIN_CHUNK_MATRAS, calculateChunkWeight(sanskrit));
}

export function lineMs(sanskrit: string, msPerMatra: number): number {
  return chunkMatras(sanskrit) * msPerMatra;
}

export interface CadenceMetrics {
  msPerMatra: number;
  confidenceScore: number;
  canAutoProgress: boolean;
  historyLength: number;
}

export class CadenceLearningEngine {
  private history: TapRecord[] = [];
  private lastTapTime: number = 0;
  private currentMsPerMatra: number = 833;
  private maxHistory: number = 12;

  constructor(initialMs: number = TEMPO.fallback) {
    this.setMsPerMatra(initialMs);
  }

  public setMsPerMatra(ms: number) {
    this.currentMsPerMatra = Math.round(Math.max(TEMPO.min, Math.min(TEMPO.max, ms)));
  }

  public getMsPerMatra(): number {
    return this.currentMsPerMatra;
  }

  public registerTap(chunkId: string, chunkSanskrit: string, timestamp: number = Date.now()): CadenceMetrics {
    const matraWeight = chunkMatras(chunkSanskrit);

    if (this.lastTapTime === 0) {
      this.lastTapTime = timestamp;
      return this.getMetrics();
    }

    const intervalMs = timestamp - this.lastTapTime;
    this.lastTapTime = timestamp;

    if (intervalMs < 400) {
      return this.getMetrics();
    }

    const expectedDuration = matraWeight * this.currentMsPerMatra;
    if (intervalMs > 3.0 * expectedDuration) {
      return this.getMetrics();
    }

    const instantaneousMsPerMatra = intervalMs / matraWeight;

    this.history.push({
      timestamp,
      chunkId,
      matraWeight,
      intervalMs,
      instantaneousMsPerMatra
    });

    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    const alpha = 0.35;
    const learned = alpha * instantaneousMsPerMatra + (1 - alpha) * this.currentMsPerMatra;
    this.currentMsPerMatra = Math.round(Math.max(TEMPO.min, Math.min(TEMPO.max, learned)));

    return this.getMetrics();
  }

  public getMetrics(): CadenceMetrics {
    const n = this.history.length;
    let confidence = 0;
    let canAuto = false;

    if (n >= 3) {
      const values = this.history.slice(-6).map((h) => h.instantaneousMsPerMatra);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (values.length - 1);
      const stdDev = Math.sqrt(variance);
      const cv = stdDev / (mean || 1);

      const sampleWeight = Math.min(1.0, n / 5);
      const varianceScore = Math.max(0, Math.min(1.0, (0.24 - cv) / (0.24 - 0.08)));
      confidence = Math.round(sampleWeight * varianceScore * 100);

      canAuto = confidence >= 80;
    }

    return {
      msPerMatra: this.currentMsPerMatra,
      confidenceScore: confidence,
      canAutoProgress: canAuto,
      historyLength: n
    };
  }

  public resetSession() {
    this.history = [];
    this.lastTapTime = 0;
  }
}
