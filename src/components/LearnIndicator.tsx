import { LEARN_LINES, useCadenceStore } from '../stores/useCadenceStore';
import { useElapsedSeconds } from './cadence/useElapsedSeconds';

export function LearnIndicator() {
  const phase = useCadenceStore((s) => s.phase);
  const learnedLines = useCadenceStore((s) => s.learnedLines);
  const firstTapAt = useCadenceStore((s) => s.firstTapAt);
  const seconds = useElapsedSeconds(firstTapAt, phase === 'measuring');

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
