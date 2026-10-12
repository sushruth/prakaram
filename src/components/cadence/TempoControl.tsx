import { selectPhase, useCadenceStore } from '../../stores/useCadenceStore';
import { TEMPO } from '../../services/cadenceEngine';

export function TempoControl() {
  const bpm = useCadenceStore((s) => s.bpm);
  const setBpm = useCadenceStore((s) => s.setBpm);
  const phase = useCadenceStore(selectPhase);

  return (
    <label className="tempo" data-phase={phase}>
      <span className="bar-label">Tempo</span>
      <input
        type="range"
        min={TEMPO.min}
        max={TEMPO.max}
        value={bpm}
        onInput={(e) => setBpm(Number((e.currentTarget as HTMLInputElement).value))}
        aria-label="Tempo in matras per minute"
      />
      <span className="tempo-value">{bpm} BPM</span>
    </label>
  );
}
