import { LEARN_LINES, useCadenceStore } from '../stores/useCadenceStore';
import { useMantraStore } from '../stores/useMantraStore';
import { lineMs } from '../services/cadenceEngine';
import { useChunks } from '../hooks/useChunks';
import { useElapsedSeconds } from './cadence/useElapsedSeconds';
import { useFrozen } from '../hooks/useFrozen';
import { useGuest } from '../hooks/useGuest';
import { Minimap } from './Minimap';

export function LearnIndicator() {
  const phase = useCadenceStore((s) => s.phase);
  const learnedLines = useCadenceStore((s) => s.learnedLines);
  const firstTapAt = useCadenceStore((s) => s.firstTapAt);
  const msPerMatra = useCadenceStore((s) => s.msPerMatra);
  const frozen = useFrozen();
  const guest = useGuest();
  const togglePause = useCadenceStore((s) => s.togglePause);
  const activeChunkIndex = useMantraStore((s) => s.activeChunkIndex);
  const chunks = useChunks();
  const seconds = useElapsedSeconds(firstTapAt, phase === 'measuring');

  if (phase === 'manual' || phase === 'engaged') {
    const current = chunks[activeChunkIndex];
    return (
      <div className="learn-indicator" data-phase={phase}>
        <Minimap
          chunks={chunks}
          index={activeChunkIndex}
          duration={current ? lineMs(current.sanskrit, msPerMatra) : 0}
          frozen={frozen}
          disabled={guest}
          onToggle={togglePause}
        />
      </div>
    );
  }

  return (
    <div className="learn-indicator" data-phase={phase} aria-hidden={phase === 'off'} title="Learning your pace">
      <span className="learn-seconds">{seconds} s</span>
      <span className="learn-progress">
        <svg className="learn-led" viewBox="0 0 10 10" aria-hidden="true">
          <circle cx="5" cy="5" r="3.6" />
        </svg>
        {learnedLines}/{LEARN_LINES}
      </span>
    </div>
  );
}
