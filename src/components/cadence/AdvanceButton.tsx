import { advanceChunk } from '../../services/advance';
import { usePrakaraStore } from '../../stores/usePrakaraStore';
import { isLearning, useCadenceStore } from '../../stores/useCadenceStore';

export function AdvanceButton() {
  const phase = useCadenceStore((s) => s.phase);
  const learning = isLearning(phase);

  return (
    <button
      className="btn-primary"
      data-phase={phase}
      onClick={() => advanceChunk(usePrakaraStore.getState().getFlattenedChunks())}
      title={learning ? 'Tap the line or press Space to teach your pace' : 'Next line (Space). Restarts the countdown'}
    >
      {learning ? 'Tap' : 'Next'}
    </button>
  );
}
