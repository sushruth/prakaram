import { CadenceMode, LEARN_LINES, modeOf, useCadenceStore } from '../../stores/useCadenceStore';
import { useGuest } from '../../hooks/useGuest';

const MODES: { id: CadenceMode; label: string; hint: string }[] = [
  { id: 'off', label: 'Off', hint: 'Off: you move the lines' },
  { id: 'manual', label: 'Manual', hint: 'Manual: lines advance at the set pace' },
  { id: 'learn', label: 'Learn', hint: 'Learn: lines advance at the pace you teach' },
];

export function CadenceStatus() {
  const phase = useCadenceStore((s) => s.phase);
  const learnedLines = useCadenceStore((s) => s.learnedLines);
  const setMode = useCadenceStore((s) => s.setMode);
  const followingHost = useGuest();
  const mode = modeOf(phase);

  const status =
    phase === 'off'
      ? 'Off: you move the lines'
      : phase === 'manual'
        ? 'Manual: lines advance at the set pace'
        : phase === 'waiting'
          ? 'Learn: tap the next line to begin'
          : phase === 'measuring'
            ? `Learn: ${learnedLines} of ${LEARN_LINES} lines`
            : 'Learned: lines advance at the learned pace';

  return (
    <div className="cadence-status">
      <div className="segmented cadence-modes" role="radiogroup" aria-label="Cadence mode" data-phase={phase}>
        {MODES.map((m) => (
          <button
            key={m.id}
            role="radio"
            aria-checked={mode === m.id}
            className="segment"
            data-mode={m.id}
            disabled={followingHost}
            title={followingHost ? 'The host controls cadence' : m.hint}
            onClick={() => setMode(m.id)}
          >
            {m.label}
          </button>
        ))}
      </div>
      <span className="cadence-text">{followingHost ? 'The host controls cadence' : status}</span>
    </div>
  );
}
