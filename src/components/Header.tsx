import { useEffect, useState } from 'preact/hooks';
import { useMantraStore } from '../stores/useMantraStore';
import { useRoomStore } from '../stores/useRoomStore';
import { usePrakaraStore } from '../stores/usePrakaraStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { transliterateVedic } from '../services/transliteration';
import { displayTitle } from '../services/titles';
import { searchArticles } from '../services/wiki';
import { HOME_HASH, REPO_URL, articleHash, articleLabel, searchHash } from '../services/wikiNav';
import { FlameMark } from './FlameMark';
import { Icon } from './Icon';

interface HeaderProps {
  onOpenRoom: () => void;
  onOpenSettings: () => void;
  onOpenDetails: () => void;
  settingsOpen: boolean;
  detailsOpen: boolean;
}

export function Header({ onOpenRoom, onOpenSettings, onOpenDetails, settingsOpen, detailsOpen }: HeaderProps) {
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
          <FlameMark size={24} />
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

        <a className="icon-btn" href={HOME_HASH} aria-label="Koshah library" title="Koshah">
          <Icon name="scroll" size={20} />
        </a>

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

/** The top bar on every wiki page: logo to the Main page, search with suggestions, and a way back to the player. */
export function WikiTopBar({ query, onOpenSettings, settingsOpen, onOpenRoom }: { query: string; onOpenSettings: () => void; settingsOpen: boolean; onOpenRoom: () => void }) {
  const { isInRoom, isHost, peerCount } = useRoomStore();
  const roomTitle = isInRoom ? `Live room (${isHost ? 'host' : 'follower'}, ${peerCount} peers)` : 'Join a live room';
  const script = useSettingsStore((s) => s.script);
  const [text, setText] = useState(query);
  const [open, setOpen] = useState(false);
  useEffect(() => setText(query), [query]);

  const term = text.trim();
  const suggestions = term ? searchArticles(term).slice(0, 6) : [];

  return (
    <header className="app-header wiki-bar">
      <a className="header-flame" href={HOME_HASH} aria-label="Koshah main page" title="Koshah">
        <FlameMark size={24} />
      </a>

      <form
        className="wiki-search"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          if (!term) return;
          setOpen(false);
          window.location.hash = searchHash(term);
        }}
      >
        <input
          type="search"
          placeholder="Search Koshah"
          aria-label="Search Koshah"
          value={text}
          onInput={(e) => {
            setText(e.currentTarget.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          // Delayed so a click on a suggestion lands before the list closes.
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setOpen(false);
          }}
        />
        {open && suggestions.length > 0 && (
          <ul className="wiki-suggest">
            {suggestions.map((a) => (
              <li key={a.id}>
                <a href={articleHash(a.id)} onClick={() => setOpen(false)}>
                  <span>{articleLabel(a, script)}</span>
                  <span className="wiki-muted">{a.title.english}</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </form>

      <nav className="header-tools" aria-label="Actions">
        <button className="icon-btn" onClick={onOpenSettings} aria-label="Settings" aria-expanded={settingsOpen} title="Settings">
          <Icon name="gear" size={20} />
        </button>
        <a className="icon-btn" href={HOME_HASH} aria-label="Koshah main page" title="Koshah">
          <Icon name="scroll" size={20} />
        </a>
        <button className="icon-btn" onClick={onOpenRoom} aria-label={roomTitle} aria-pressed={isInRoom} title={roomTitle}>
          <Icon name="globe" size={20} />
          {isInRoom && <span className="icon-dot" />}
        </button>
        <a className="icon-btn" href="#" aria-label="Back to the player" title="Player">
          <Icon name="play" size={20} />
        </a>
      </nav>
    </header>
  );
}

export function WikiFooter() {
  return (
    <footer className="wiki-site-footer">
      <p>Each page states its licence and source. Text whose permission is not yet confirmed stays a draft.</p>
      <p>
        Contribute: <a href={REPO_URL}>edit any page on GitHub</a>.
      </p>
    </footer>
  );
}
