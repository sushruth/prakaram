import { useState, useEffect } from 'preact/hooks';
import { Header, WikiTopBar, WikiFooter } from './components/Header';
import { CadenceStrip } from './components/CadenceStrip';
import { ZenMantraReader } from './components/ZenMantraReader';
import { LocateLine } from './components/LocateLine';
import { CadencePanel } from './components/CadencePanel';
import { PrakaraBuilderModal } from './components/PrakaraBuilderModal';
import { RoomPanel } from './components/RoomPanel';
import { roomFromHash } from './services/roomLink';
import { useRoomStore } from './stores/useRoomStore';
import { SettingsSheet } from './components/SettingsSheet';
import { PrakaraDetails } from './components/PrakaraDetails';
import { WikiHome } from './components/WikiHome';
import { WikiArticle } from './components/WikiArticle';
import { WikiCategory } from './components/WikiCategory';
import { WikiSearch } from './components/WikiSearch';
import { WikiCompose } from './components/WikiCompose';
import { usePrakaraStore } from './stores/usePrakaraStore';
import { useMantraStore } from './stores/useMantraStore';
import { isLearning, useCadenceStore } from './stores/useCadenceStore';
import { decodePrakaraFromUrlHash } from './services/urlCodec';
import { initLineClock } from './services/lineClock';
import { listArticles } from './services/wiki';
import { HOME_HASH, type Route, articleHash, legacyHash, parseRoute } from './services/wikiNav';

type DropKind = 'settings' | 'details' | 'cadence' | 'room';

/** The route for the current hash. Old `#k=<id>` links are moved to the wiki address of their piece. */
const readRoute = (): Route => {
  const to = legacyHash(window.location.hash);
  if (to) {
    window.location.replace(to);
    return parseRoute(to);
  }
  return parseRoute(window.location.hash);
};

export function App() {
  const [isPrakaraOpen, setIsPrakaraOpen] = useState(false);
  const [drop, setDrop] = useState<DropKind | null>(null);
  const [route, setRoute] = useState<Route>(readRoute);

  useEffect(() => {
    const onHash = () => {
      // `#compose` (linked from the wiki) opens the composer in the player, then drops the hash.
      if (window.location.hash === '#compose') {
        setIsPrakaraOpen(true);
        history.replaceState(null, '', window.location.pathname + window.location.search);
      }
      const next = readRoute();
      if (next.kind !== 'article' || next.section === undefined) window.scrollTo(0, 0);
      setRoute(next);
      setDrop(null);
      // A shared parāyaṇam link (#room=<id>) joins the room as a follower, then drops the hash.
      const room = roomFromHash(window.location.hash);
      if (room) {
        const r = useRoomStore.getState();
        if (!r.creating && !(r.isInRoom && r.roomCode === room)) r.joinRoom(room, false);
        history.replaceState(null, '', window.location.pathname + window.location.search);
        setDrop('room');
      }
    };
    onHash();
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    if (route.kind !== 'random') return;
    const all = listArticles();
    const pick = all[Math.floor(Math.random() * all.length)];
    window.location.replace(pick ? articleHash(pick.id) : HOME_HASH);
  }, [route]);

  const { addPrakara } = usePrakaraStore();
  const { setMsPerMatra } = useCadenceStore();
  const zenMode = useMantraStore((s) => s.zenMode);
  const setAway = useMantraStore((s) => s.setAway);

  useEffect(() => {
    const onVisibility = () => setAway(document.hidden);
    const onBlur = () => setAway(true);
    const onFocus = () => setAway(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
    };
  }, [setAway]);

  useEffect(() => initLineClock(), []);

  const toggle = (kind: DropKind) => setDrop((current) => (current === kind ? null : kind));
  const closeDrop = () => setDrop(null);

  useEffect(() => {
    document.documentElement.classList.toggle('zen-active', zenMode);
    if (zenMode) setDrop(null);
  }, [zenMode]);

  const phase = useCadenceStore((s) => s.phase);
  useEffect(() => {
    document.documentElement.classList.toggle('cadence-learning', isLearning(phase));
  }, [phase]);

  useEffect(() => {
    const handleUrlState = async () => {
      const hash = window.location.hash;
      if (hash && hash.startsWith('#p=')) {
        const decoded = await decodePrakaraFromUrlHash(hash);
        if (decoded) {
          addPrakara(decoded);
          if (decoded.preferredBpm) {
            setMsPerMatra(60000 / decoded.preferredBpm);
          }
        }
      }
    };

    handleUrlState();
  }, [addPrakara, setMsPerMatra]);

  const playing = route.kind === 'player';
  // Running a piece makes it the active prakara, then leaves the wiki for the player.
  const runPiece = (pieceId: string) => {
    usePrakaraStore.getState().runPiece(pieceId);
    window.location.hash = '';
  };

  return (
    <>
      <div className="chrome">
        {playing ? (
          <>
            <Header
              onOpenRoom={() => toggle('room')}
              onOpenSettings={() => toggle('settings')}
              onOpenDetails={() => toggle('details')}
              settingsOpen={drop === 'settings'}
              detailsOpen={drop === 'details'}
            />
            <CadenceStrip onOpenPanel={() => toggle('cadence')} panelOpen={drop === 'cadence'} />
          </>
        ) : (
          <WikiTopBar query={route.kind === 'search' ? route.q : ''} onOpenSettings={() => toggle('settings')} settingsOpen={drop === 'settings'} onOpenRoom={() => toggle('room')} />
        )}
      </div>

      <SettingsSheet isOpen={drop === 'settings'} onClose={closeDrop} />
      <PrakaraDetails isOpen={drop === 'details'} onClose={closeDrop} />
      <CadencePanel isOpen={drop === 'cadence'} onClose={closeDrop} />

      {playing ? (
        <>
          <ZenMantraReader />
          <LocateLine />
        </>
      ) : (
        <>
          <div className="wiki-main">
            {route.kind === 'home' && <WikiHome />}
            {route.kind === 'article' && <WikiArticle id={route.id} section={route.section} range={route.range} onRun={runPiece} />}
            {route.kind === 'category' && <WikiCategory name={route.name} />}
            {route.kind === 'search' && <WikiSearch q={route.q} />}
            {route.kind === 'compose' && <WikiCompose />}
          </div>
          <WikiFooter />
        </>
      )}

      <PrakaraBuilderModal isOpen={isPrakaraOpen} onClose={() => setIsPrakaraOpen(false)} />
      <RoomPanel isOpen={drop === 'room'} onClose={closeDrop} />
    </>
  );
}
