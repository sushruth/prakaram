import { LEARN_LINES, useCadenceStore } from '../stores/useCadenceStore';
import { useMantraStore } from '../stores/useMantraStore';
import { lineMs } from '../services/cadenceEngine';
import { useChunks } from '../hooks/useChunks';
import { useElapsedSeconds } from './cadence/useElapsedSeconds';

export function LearnIndicator() {
  const phase = useCadenceStore((s) => s.phase);
  const learnedLines = useCadenceStore((s) => s.learnedLines);
  const firstTapAt = useCadenceStore((s) => s.firstTapAt);
  const msPerMatra = useCadenceStore((s) => s.msPerMatra);
  const activeChunkIndex = useMantraStore((s) => s.activeChunkIndex);
  const chunks = useChunks();
  const seconds = useElapsedSeconds(firstTapAt, phase === 'measuring');

  if (phase === 'engaged') {
    const current = chunks[activeChunkIndex];
    const duration = current ? lineMs(current.sanskrit, msPerMatra) : 0;
    return (
      <div className="learn-indicator" data-phase="engaged" title="Time until the next line">
        <svg className="learn-ring" viewBox="0 0 20 20" aria-hidden="true">
          <circle key={activeChunkIndex} cx="10" cy="10" r="8" style={{ animationDuration: `${duration}ms` }} />
        </svg>
      </div>
    );
  }

  return (
    <div className="learn-indicator" data-phase={phase} aria-hidden={phase === 'plain'} title="Learning your pace">
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
