import { CadenceMode, LEARN_LINES, modeOf, useCadenceStore } from '../stores/useCadenceStore';
import { useFrozen } from '../hooks/useFrozen';
import { useGuest } from '../hooks/useGuest';
import { isLearning } from '../services/cadenceMachine';
import { LearnIndicator } from './LearnIndicator';

const MODES: { id: CadenceMode; label: string }[] = [
  { id: 'off', label: 'Off' },
  { id: 'manual', label: 'Manual' },
  { id: 'learn', label: 'Learn' },
];

interface CadenceStripProps {
  onOpenPanel: () => void;
  panelOpen: boolean;
}

export function CadenceStrip({ onOpenPanel, panelOpen }: CadenceStripProps) {
  const phase = useCadenceStore((s) => s.phase);
  const msPerMatra = useCadenceStore((s) => s.msPerMatra);
  const learnedLines = useCadenceStore((s) => s.learnedLines);
  const setMode = useCadenceStore((s) => s.setMode);
  const frozen = useFrozen();
  const guest = useGuest();
  const mode = modeOf(phase);

  if (phase === 'off') {
    return (
      <div className="cadence-strip" role="group" aria-label="Cadence">
        <button
          className="cadence-auto"
          disabled={guest}
          onClick={() => setMode('manual')}
          title="Turn auto-advance on"
        >
          Auto
        </button>
      </div>
    );
  }

  const readout = isLearning(phase)
    ? phase === 'waiting'
      ? 'Tap the next line'
      : `Learning ${learnedLines}/${LEARN_LINES}`
    : frozen
      ? 'Paused'
      : phase === 'engaged'
        ? `Learned · ${msPerMatra} ms/mātrā`
        : `${msPerMatra} ms/mātrā`;

  return (
    <div className="cadence-strip" role="group" aria-label="Cadence">
      <div className="cadence-modes" role="radiogroup" aria-label="Cadence mode" data-phase={phase}>
        {MODES.map((m) => (
          <button
            key={m.id}
            role="radio"
            aria-checked={mode === m.id}
            className="segment"
            data-mode={m.id}
            disabled={guest}
            onClick={() => setMode(m.id)}
          >
            {m.label}
          </button>
        ))}
      </div>
      <button
        className="cadence-readout"
        onClick={onOpenPanel}
        disabled={guest}
        aria-haspopup="dialog"
        aria-expanded={panelOpen}
        title={guest ? 'The host controls cadence' : 'Pace'}
      >
        <span aria-live="polite">{readout}</span>
      </button>
      <LearnIndicator />
    </div>
  );
}
