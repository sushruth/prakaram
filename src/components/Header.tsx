import { useMantraStore } from '../stores/useMantraStore';
import { useRoomStore } from '../stores/useRoomStore';
import { Icon } from './Icon';

interface HeaderProps {
  onOpenPrakara: () => void;
  onOpenRoom: () => void;
  onOpenSettings: () => void;
  settingsOpen: boolean;
}

export function Header({ onOpenPrakara, onOpenRoom, onOpenSettings, settingsOpen }: HeaderProps) {
  const zenMode = useMantraStore((s) => s.zenMode);
  const toggleZenMode = useMantraStore((s) => s.toggleZenMode);
  const { isInRoom, isHost, peerCount } = useRoomStore();

  const roomTitle = isInRoom
    ? `Live room (${isHost ? 'host' : 'follower'}, ${peerCount} peers)`
    : 'Join a live room';

  return (
    <header className="app-header">
      <div className="header-brand">
        <h1 className="brand-title title-display">पारायणम्</h1>
        <span className="brand-sub">Parayanam</span>
      </div>

      <nav className="header-tools" aria-label="Actions">
        <button
          className="icon-btn"
          onClick={onOpenSettings}
          aria-label="Settings"
          aria-expanded={settingsOpen}
          title="Settings"
        >
          <Icon name="gear" size={20} />
        </button>

        <button className="icon-btn" onClick={onOpenPrakara} aria-label="Prakara sequences" title="Prakara sequences">
          <Icon name="scroll" size={20} />
        </button>

        <button className="icon-btn" onClick={onOpenRoom} aria-label={roomTitle} aria-pressed={isInRoom} title={roomTitle}>
          <Icon name="globe" size={20} />
          {isInRoom && <span className="icon-dot" />}
        </button>

        <button
          className="icon-btn"
          onClick={toggleZenMode}
          aria-label="Zen mode"
          aria-pressed={zenMode}
          title="Zen mode (Z)"
        >
          <Icon name="flower-lotus" size={20} />
        </button>
      </nav>
    </header>
  );
}
