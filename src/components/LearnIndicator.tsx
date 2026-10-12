import { LEARN_LINES, useCadenceStore } from '../stores/useCadenceStore';
import { useMantraStore } from '../stores/useMantraStore';
import { lineMs } from '../services/cadenceEngine';
import { useChunks } from '../hooks/useChunks';
import { useElapsedSeconds } from './cadence/useElapsedSeconds';
import { useFrozen } from '../hooks/useFrozen';
import { useGuest } from '../hooks/useGuest';

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
    const rows = [-1, 0, 1].map((d) => chunks[activeChunkIndex + d]);
    const longest = Math.max(1, ...rows.map((c) => c?.sanskrit.length ?? 0));
    const duration = rows[1] ? lineMs(rows[1].sanskrit, msPerMatra) : 0;
    return (
      <div className="learn-indicator" data-phase={phase}>
        <button
          className="minimap"
          onClick={togglePause}
          disabled={guest}
          aria-pressed={frozen}
          data-frozen={frozen}
          aria-label={frozen ? 'Resume auto progress' : 'Pause auto progress'}
          title={frozen ? 'Resume auto progress' : 'Pause auto progress'}
        >
          <span className="minimap-lines" aria-hidden="true">
            {rows.map((c, i) => (
              <span key={i} className="minimap-line" data-now={i === 1} data-empty={!c} style={{ width: `${c ? 35 + (65 * c.sanskrit.length) / longest : 50}%` }}>
                {i === 1 && (
                  <span
                    key={activeChunkIndex}
                    className="minimap-fill"
                    style={{ animationDuration: `${duration}ms`, animationPlayState: frozen ? 'paused' : 'running' }}
                  />
                )}
              </span>
            ))}
          </span>
          <svg className="minimap-pause" viewBox="0 0 20 20" aria-hidden="true">
            <rect x="5.5" y="4" width="3.4" height="12" rx="0.8" />
            <rect x="11.1" y="4" width="3.4" height="12" rx="0.8" />
          </svg>
        </button>
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
