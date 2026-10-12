import { LEARN_LINES, selectPhase, useCadenceStore } from '../../stores/useCadenceStore';
import { useRoomStore } from '../../stores/useRoomStore';
import { Icon } from '../Icon';

export function CadenceStatus() {
  const phase = useCadenceStore(selectPhase);
  const learnedLines = useCadenceStore((s) => s.learnedLines);
  const setSmart = useCadenceStore((s) => s.setSmart);
  const { isInRoom, isHost } = useRoomStore();
  const followingHost = isInRoom && !isHost;

  const text =
    phase === 'plain'
      ? 'Plain: you move the lines'
      : phase === 'learning'
        ? `Learning your pace: ${learnedLines} of ${LEARN_LINES} lines`
        : 'Smart: following your pace';

  return (
    <div className="cadence-status">
      <button
        className="icon-btn"
        data-phase={phase}
        aria-pressed={phase !== 'plain'}
        disabled={followingHost}
        onClick={() => setSmart(phase === 'plain')}
        aria-label={phase === 'plain' ? 'Turn on Smart cadence' : 'Turn off Smart cadence'}
        title={followingHost ? 'The host controls cadence' : text}
      >
        <Icon name="sparkle" size={20} />
      </button>
      <span className="cadence-text">{text}</span>
    </div>
  );
}
