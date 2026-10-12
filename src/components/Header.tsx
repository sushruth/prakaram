import { useMantraStore } from '../stores/useMantraStore';
import { useRoomStore } from '../stores/useRoomStore';
import { usePrakaraStore } from '../stores/usePrakaraStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { transliterateVedic } from '../services/transliteration';
import { displayTitle } from '../services/titles';
import { Icon } from './Icon';

interface HeaderProps {
  onOpenPrakara: () => void;
  onOpenRoom: () => void;
  onOpenSettings: () => void;
  onOpenDetails: () => void;
  settingsOpen: boolean;
  detailsOpen: boolean;
}

export function Header({
  onOpenPrakara,
  onOpenRoom,
  onOpenSettings,
  onOpenDetails,
  settingsOpen,
  detailsOpen,
}: HeaderProps) {
  const zenMode = useMantraStore((s) => s.zenMode);
  const toggleZenMode = useMantraStore((s) => s.toggleZenMode);
  const script = useSettingsStore((s) => s.script);
  const prakara = usePrakaraStore((s) => s.getActivePrakara());
  const { isInRoom, isHost, peerCount } = useRoomStore();

  const roomTitle = isInRoom
    ? `Live room (${isHost ? 'host' : 'follower'}, ${peerCount} peers)`
    : 'Join a live room';

  return (
    <header className="app-header">
      <div className="header-start">
        <span className="header-flame" aria-hidden="true">
          <Icon name="flame" size={22} />
        </span>
        <button className="header-title" onClick={onOpenDetails} aria-expanded={detailsOpen} title={prakara.title}>
          {transliterateVedic(displayTitle(prakara.title), script)}
        </button>
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
          className="icon-btn zen-toggle"
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
