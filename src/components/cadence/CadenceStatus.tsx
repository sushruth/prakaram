import { LEARN_LINES, useCadenceStore } from '../../stores/useCadenceStore';
import { useRoomStore } from '../../stores/useRoomStore';
import { Icon } from '../Icon';

export function CadenceStatus() {
  const phase = useCadenceStore((s) => s.phase);
  const learnedLines = useCadenceStore((s) => s.learnedLines);
  const smartOn = useCadenceStore((s) => s.smartOn);
  const smartOff = useCadenceStore((s) => s.smartOff);
  const { isInRoom, isHost } = useRoomStore();
  const followingHost = isInRoom && !isHost;

  const text =
    phase === 'plain'
      ? 'Plain: you move the lines'
      : phase === 'waiting'
        ? 'Waiting for your first tap'
        : phase === 'measuring'
          ? `Learning: ${learnedLines} of ${LEARN_LINES} lines`
          : 'Smart: following your pace';

  return (
    <div className="cadence-status">
      <button
        className="icon-btn"
        data-phase={phase}
        aria-pressed={phase !== 'plain'}
        disabled={followingHost}
        onClick={() => (phase === 'plain' ? smartOn() : smartOff())}
        aria-label={phase === 'plain' ? 'Turn on Smart cadence' : 'Turn off Smart cadence'}
        title={followingHost ? 'The host controls cadence' : text}
      >
        <Icon name="sparkle" size={20} />
      </button>
      <span className="cadence-text">{text}</span>
    </div>
  );
}
