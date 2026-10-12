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
      disabled={phase === 'engaged'}
      onClick={() => advanceChunk(usePrakaraStore.getState().getFlattenedChunks())}
      title={learning ? 'Tap the line or press Space to teach your pace' : 'Press Space to move to the next line'}
    >
      {learning ? 'Tap' : 'Next'}
    </button>
  );
}
