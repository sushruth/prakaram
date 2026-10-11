import { ScriptSelector } from './ScriptSelector';
import { useThemeStore, AppTheme } from '../stores/useThemeStore';
import { useRoomStore } from '../stores/useRoomStore';
import { useMantraStore } from '../stores/useMantraStore';

interface HeaderProps {
  onOpenPrakara: () => void;
  onOpenRoom: () => void;
  onOpenAuth: () => void;
}

export function Header({ onOpenPrakara, onOpenRoom, onOpenAuth }: HeaderProps) {
  const { theme, setTheme, zenMode, toggleZenMode } = useThemeStore();
  const { isInRoom, isHost, peerCount } = useRoomStore();
  const { fontSize, setFontSize } = useMantraStore();

  const cycleTheme = () => {
    const themes: AppTheme[] = ['sandhya', 'dark', 'light'];
    const nextIdx = (themes.indexOf(theme) + 1) % themes.length;
    setTheme(themes[nextIdx]);
  };

  return (
    <header className="app-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <h1 className="title-serif" style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--accent)' }}>
          पारायणम्
        </h1>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Parayanam</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        <ScriptSelector />

        {/* Font size adjustment */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.1rem 0.3rem' }}>
          <button
            className="btn-icon"
            style={{ width: '1.6rem', height: '1.6rem', border: 'none', fontSize: '0.8rem' }}
            onClick={() => setFontSize(fontSize - 2)}
            title="Decrease font size"
          >
            A-
          </button>
          <button
            className="btn-icon"
            style={{ width: '1.6rem', height: '1.6rem', border: 'none', fontSize: '0.9rem' }}
            onClick={() => setFontSize(fontSize + 2)}
            title="Increase font size"
          >
            A+
          </button>
        </div>

        {/* Prakara Sequence Selector */}
        <button
          className="btn-icon"
          onClick={onOpenPrakara}
          title="Prakara Sequence Builder"
        >
          📜
        </button>

        {/* WebRTC Live Room */}
        <button
          className="btn-icon"
          onClick={onOpenRoom}
          title={isInRoom ? `Live Chanting Room (${isHost ? 'Host' : 'Follower'}, ${peerCount} peers)` : 'Connect to Live Room'}
          style={isInRoom ? { borderColor: 'var(--accent)', background: 'var(--accent-light)', position: 'relative' } : {}}
        >
          🌐
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

        {/* Theme Cycler */}
        <button
          className="btn-icon"
          onClick={cycleTheme}
          title={`Theme: ${theme}`}
        >
          {theme === 'sandhya' ? '🌅' : theme === 'dark' ? '🌙' : '☀️'}
        </button>

        {/* WebAuthn Passkey Button */}
        <button
          className="btn-icon"
          onClick={onOpenAuth}
          title="Passkey Authentication"
        >
          🔑
        </button>

        {/* Zen Mode Button */}
        <button
          className="btn-icon"
          onClick={toggleZenMode}
          title="Enter Zen Mode (Focus Chanting)"
          style={{ background: 'var(--accent)', color: '#fff', border: 'none' }}
        >
          🧘
        </button>
      </div>
    </header>
  );
}
