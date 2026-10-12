import { TapRecord, LayaType, LAYA_PRESETS } from '../types/cadence';
import { calculateChunkWeight } from './syllabifier';

export interface CadenceMetrics {
  currentBpm: number;
  msPerMatra: number;
  confidenceScore: number;
  canAutoProgress: boolean;
  activeLaya: LayaType;
  historyLength: number;
}

export class CadenceLearningEngine {
  private history: TapRecord[] = [];
  private lastTapTime: number = 0;
  private currentMsPerMatra: number = 833;
  private activeLaya: LayaType = 'abhyasa';
  private maxHistory: number = 12;

  constructor(initialBpm: number = 72) {
    this.setBpm(initialBpm);
  }

  public setBpm(bpm: number, laya: LayaType = 'custom') {
    const clampedBpm = Math.max(30, Math.min(150, bpm));
    this.currentMsPerMatra = Math.round(60000 / clampedBpm);
    this.activeLaya = laya;
  }

  public setLayaPreset(laya: LayaType) {
    const preset = LAYA_PRESETS[laya];
    if (preset) {
      this.setBpm(preset.bpm, laya);
    }
  }

  public getMsPerMatra(): number {
    return this.currentMsPerMatra;
  }

  public getBpm(): number {
    return Math.round(60000 / this.currentMsPerMatra);
  }

  public registerTap(chunkId: string, chunkSanskrit: string, timestamp: number = Date.now()): CadenceMetrics {
    const matraWeight = Math.max(2, calculateChunkWeight(chunkSanskrit));

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
    this.currentMsPerMatra = Math.round(alpha * instantaneousMsPerMatra + (1 - alpha) * this.currentMsPerMatra);

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
      currentBpm: this.getBpm(),
      msPerMatra: this.currentMsPerMatra,
      confidenceScore: confidence,
      canAutoProgress: canAuto,
      activeLaya: this.activeLaya,
      historyLength: n
    };
  }

  public resetSession() {
    this.history = [];
    this.lastTapTime = 0;
  }
}
