import { useThemeStore } from '../stores/useThemeStore';
import { useRoomStore } from '../stores/useRoomStore';
import { Icon } from './Icon';

interface HeaderProps {
  onOpenPrakara: () => void;
  onOpenRoom: () => void;
  onOpenAuth: () => void;
  onOpenSettings: () => void;
  settingsOpen: boolean;
}

export function Header({ onOpenPrakara, onOpenRoom, onOpenAuth, onOpenSettings, settingsOpen }: HeaderProps) {
  const { zenMode, toggleZenMode } = useThemeStore();
  const { isInRoom, isHost, peerCount } = useRoomStore();

  return (
    <header className="app-header">
      <div className="header-brand">
        <h1 className="title-display" style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--accent)' }}>
          पारायणम्
        </h1>
        <span className="brand-sub">Parayanam</span>
      </div>

      <div className="header-tools">
        <button
          className="btn-icon"
          onClick={onOpenSettings}
          aria-label="Settings"
          aria-expanded={settingsOpen}
          title="Settings"
        >
          <Icon name="gear" size={20} />
        </button>

        {/* Prakara Sequence Selector */}
        <button
          className="btn-icon"
          onClick={onOpenPrakara}
          title="Prakara Sequence Builder"
        >
          <Icon name="scroll" size={20} />
        </button>

        {/* WebRTC Live Room */}
        <button
          className="btn-icon"
          onClick={onOpenRoom}
          title={isInRoom ? `Live Chanting Room (${isHost ? 'Host' : 'Follower'}, ${peerCount} peers)` : 'Connect to Live Room'}
          style={isInRoom ? { borderColor: 'var(--accent)', background: 'var(--accent-light)', position: 'relative' } : {}}
        >
          <Icon name="globe" size={20} />
          {isInRoom && (
            <span
              style={{
                position: 'absolute',
                top: '-3px',
                right: '-3px',
                width: '9px',
                height: '9px',
                background: '#10b981',
                borderRadius: '50%',
              }}
            />
          )}
        </button>

        {/* WebAuthn Passkey Button */}
        <button
          className="btn-icon"
          onClick={onOpenAuth}
          title="Passkey Authentication"
        >
          <Icon name="key" size={20} />
        </button>

        {/* Zen Mode Button */}
        <button
          className="btn-icon"
          onClick={toggleZenMode}
          title="Enter Zen Mode (Focus Chanting)"
          style={{ background: 'var(--accent)', color: 'var(--on-accent)', border: 'none' }}
        >
          <Icon name="flower-lotus" size={20} />
        </button>
      </div>
    </header>
  );
}
