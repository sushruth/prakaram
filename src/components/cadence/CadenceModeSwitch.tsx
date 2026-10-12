import { CADENCE_MODES, CadenceMode, useCadenceStore } from '../../stores/useCadenceStore';

const LABELS: Record<CadenceMode, string> = { off: 'Off', learn: 'Learn', auto: 'Auto' };

const HINTS: Record<CadenceMode, string> = {
  off: 'Off: Tap or Space moves to the next line. Nothing is recorded.',
  learn: 'Learn: Each tap is measured to learn your pace. Lines do not advance by themselves.',
  auto: 'Auto: Lines advance by themselves at the current tempo.',
};

export function CadenceModeSwitch() {
  const mode = useCadenceStore((s) => s.mode);
  const setMode = useCadenceStore((s) => s.setMode);

  return (
    <div className="cadence-mode">
      <span className="bar-label">Cadence</span>
      <div className="segmented" role="radiogroup" aria-label="Cadence mode">
        {CADENCE_MODES.map((m) => (
          <button
            key={m}
            role="radio"
            aria-checked={mode === m}
            className="segment"
            title={HINTS[m]}
            onClick={() => setMode(m)}
          >
            {LABELS[m]}
          </button>
        ))}
      </div>
    </div>
  );
}
