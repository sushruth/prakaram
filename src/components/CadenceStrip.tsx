import { useCadenceStore } from '../stores/useCadenceStore';
import { useFrozen } from '../hooks/useFrozen';
import { useGuest } from '../hooks/useGuest';
import { isLearning } from '../services/cadenceMachine';
import { Switch } from '../settings/controls';
import { LearnIndicator } from './LearnIndicator';

interface CadenceStripProps {
  onOpenPanel: () => void;
  panelOpen: boolean;
}

export function CadenceStrip({ onOpenPanel, panelOpen }: CadenceStripProps) {
  const phase = useCadenceStore((s) => s.phase);
  const msPerMatra = useCadenceStore((s) => s.msPerMatra);
  const setMode = useCadenceStore((s) => s.setMode);
  const frozen = useFrozen();
  const guest = useGuest();
  const on = phase !== 'off';
  const learn = phase !== 'off' && phase !== 'manual';

  const readout = isLearning(phase)
    ? phase === 'waiting'
      ? 'Tap the next line'
      : 'Learning'
    : frozen
      ? 'Paused'
      : phase === 'engaged'
        ? `Learned · ${msPerMatra} ms/mātrā`
        : `${msPerMatra} ms/mātrā`;

  return (
    <div className="cadence-strip" role="group" aria-label="Cadence">
      <div className="cadence-modes">
        <label className="cadence-auto-toggle">
          <Switch checked={on} onToggle={() => !guest && setMode(on ? 'off' : 'manual')} />
          <span>Auto</span>
        </label>
        {on && (
          <button
            className="segment"
            role="switch"
            aria-checked={learn}
            data-phase={phase}
            disabled={guest}
            onClick={() => setMode(learn ? 'manual' : 'learn')}
            title="Learn your pace from taps"
          >
            Learn
          </button>
        )}
      </div>
      {on ? (
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
      ) : (
        <span className="cadence-readout" />
      )}
      <LearnIndicator />
    </div>
  );
}
