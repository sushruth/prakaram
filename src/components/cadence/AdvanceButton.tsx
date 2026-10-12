import { advanceChunk } from '../../services/advance';
import { usePrakaraStore } from '../../stores/usePrakaraStore';
import { selectPhase, useCadenceStore } from '../../stores/useCadenceStore';

export function AdvanceButton() {
  const phase = useCadenceStore(selectPhase);
  const label = phase === 'learning' ? 'Tap' : 'Next';

  return (
    <button
      className="btn-primary"
      disabled={phase === 'engaged'}
      onClick={() => advanceChunk(usePrakaraStore.getState().getFlattenedChunks())}
      title={phase === 'learning' ? 'Tap or press Space to teach your pace' : 'Press Space to move to the next line'}
    >
      {label}
    </button>
  );
}
