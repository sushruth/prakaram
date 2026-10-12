import { useCadenceStore } from '../../stores/useCadenceStore';
import { TEMPO } from '../../services/cadenceEngine';

export function TempoControl() {
  const msPerMatra = useCadenceStore((s) => s.msPerMatra);
  const setMsPerMatra = useCadenceStore((s) => s.setMsPerMatra);
  const phase = useCadenceStore((s) => s.phase);

  return (
    <label className="tempo" data-phase={phase}>
      <span className="bar-label">Pace</span>
      <input
        type="range"
        min={TEMPO.min}
        max={TEMPO.max}
        step={TEMPO.step}
        value={msPerMatra}
        onInput={(e) => setMsPerMatra(Number((e.currentTarget as HTMLInputElement).value))}
        aria-label="Milliseconds per mātrā"
      />
      <span className="tempo-value">{msPerMatra} ms per mātrā</span>
    </label>
  );
}
