import { useCadenceStore } from '../../stores/useCadenceStore';
import { PACE_SLIDER_STEPS, paceToSlider, sliderToPace } from '../../services/cadenceEngine';

export function TempoControl() {
  const msPerMatra = useCadenceStore((s) => s.msPerMatra);
  const setMsPerMatra = useCadenceStore((s) => s.setMsPerMatra);
  const phase = useCadenceStore((s) => s.phase);
  const off = phase === 'off';

  return (
    <label className="tempo" data-phase={phase} data-off={off}>
      <span className="bar-label">Pace</span>
      <input
        type="range"
        min={0}
        max={PACE_SLIDER_STEPS}
        step={1}
        value={paceToSlider(msPerMatra)}
        disabled={off}
        onInput={(e) => setMsPerMatra(sliderToPace(Number((e.currentTarget as HTMLInputElement).value)))}
        aria-label="Milliseconds per mātrā"
      />
      <span className="tempo-value">{msPerMatra} ms per mātrā</span>
    </label>
  );
}
