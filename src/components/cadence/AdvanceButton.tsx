import { advanceChunk } from '../../services/advance';
import { usePrakaraStore } from '../../stores/usePrakaraStore';
import { useCadenceStore } from '../../stores/useCadenceStore';
import { Icon } from '../Icon';

export function AdvanceButton() {
  const mode = useCadenceStore((s) => s.mode);
  const learning = mode === 'learn';

  return (
    <button
      className="btn-primary"
      onClick={() => advanceChunk(usePrakaraStore.getState().getFlattenedChunks())}
      title={learning ? 'Tap or press Space to record your pace' : 'Press Space to move to the next line'}
    >
      <Icon name="hand-tap" size={15} />
      {learning ? 'Tap' : 'Next'}
    </button>
  );
}
