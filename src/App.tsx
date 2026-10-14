import { useState, useEffect, useRef } from 'preact/hooks';
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
import { FlameLoader } from './components/FlameLoader';
import { usePrakaraStore } from './stores/usePrakaraStore';
import { useMantraStore } from './stores/useMantraStore';
import { isLearning, useCadenceStore } from './stores/useCadenceStore';
import { decodePrakaraFromUrlHash } from './services/urlCodec';
import { initLineClock } from './services/lineClock';
import { getArticle, listArticles, prakaraSourceParts, requiredSourceParts } from './services/wiki';
import { adapterFor, ensureDocument, ensureDocumentSections, hasDocument } from './services/sourceAdapter';
import { pendingSourceParts } from './services/liveLoading';
import { SUKTA_MAP } from './data';
import { liveSourceLabel } from './data/liveSources';
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

/** Shown while a live source is fetched on demand, or when its edition cannot be reached. */
function LiveSourceNotice({ id, status }: { id: string; status: 'loading' | 'failed' }) {
  const label = liveSourceLabel(id) ?? id;
  // The loader (flame + quiet line) replaces the old plain loading paragraph; the failure stays a quiet note.
  if (status === 'loading') return <FlameLoader label={label} />;
  return (
    <main className="wiki-article">
      <h1 className="wiki-title">{label}</h1>
      <p className="wiki-muted" role="status">This source could not be loaded.</p>
    </main>
  );
}

export function App() {
  const [isPrakaraOpen, setIsPrakaraOpen] = useState(false);
  const [drop, setDrop] = useState<DropKind | null>(null);
  const [route, setRoute] = useState<Route>(() => {
    // The mount effect below replaces an empty hash with HOME_HASH. Resolve the wiki in the meantime so an
    // empty initial hash paints the wiki, never a one-frame flash of the player.
    const h = window.location.hash;
    return h === '' || h === '#' ? { kind: 'home' } : readRoute();
  });
  // A live source is not in the corpus until asked for; while a load is pending show the loader, and a failure a quiet note.
  const [live, setLive] = useState<{ id: string; status: 'loading' | 'failed' } | null>(null);
  // True while a composition's or the player's live sources are being fetched; the loader shows until it settles.
  const [loadingSources, setLoadingSources] = useState(false);
  // Live sources whose load already failed this session, so a composition does not retry in a loop.
  const failedSources = useRef(new Set<string>());
  const playing = route.kind === 'player';

  useEffect(() => {
    // Opening the site with no hash lands on the wiki home, not the player. `location.replace` keeps the
    // empty hash out of history, so Back does not bounce the visitor onto the player. This runs once, on
    // mount only: in-app navigation that sets the hash to '' (Follow, Run) must still reach the player.
    if (window.location.hash === '' || window.location.hash === '#') {
      window.location.replace(HOME_HASH);
    }
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

  // Load a live source the route asks for, then re-render once it is registered. No live source loads at boot.
  useEffect(() => {
    if (route.kind !== 'article') {
      setLive(null);
      setLoadingSources(false);
      return;
    }
    // A direct source route loads every section and shows the loader until it is registered.
    if (adapterFor(route.id) && !hasDocument(route.id)) {
      let cancelled = false;
      setLoadingSources(false);
      setLive({ id: route.id, status: 'loading' });
      void ensureDocument(route.id).then((doc) => {
        if (cancelled) return;
        if (!doc) {
          setLive({ id: route.id, status: 'failed' });
          return;
        }
        setLive(null);
        // Re-read the route: a padya deep link was resolved before the source was loaded, so its range was dropped.
        setRoute(readRoute());
      });
      return () => {
        cancelled = true;
      };
    }
    // A composition loads the live sources its parts reference, showing the loader instead of the half-built article.
    const needed = pendingSourceParts(requiredSourceParts(route.id), failedSources.current);
    if (needed.length === 0) {
      setLive(null);
      setLoadingSources(false);
      return;
    }
    let cancelled = false;
    setLive(null);
    setLoadingSources(true);
    void ensureDocumentSections(needed).then((docs) => {
      if (cancelled) return;
      docs.forEach((doc, i) => {
        if (!doc) failedSources.current.add(needed[i].id);
      });
      setLoadingSources(false);
      if (docs.some((d) => d)) setRoute(readRoute());
    });
    return () => {
      cancelled = true;
    };
  }, [route]);

  // The active prakara (the default maha-prakaram included) may reference live sources; load them when it opens.
  const activePrakaraId = usePrakaraStore((s) => s.activePrakaraId);
  useEffect(() => {
    if (!playing) return;
    const needed = pendingSourceParts(prakaraSourceParts(usePrakaraStore.getState().getActivePrakara()), failedSources.current);
    if (needed.length === 0) {
      setLoadingSources(false);
      return;
    }
    let cancelled = false;
    setLoadingSources(true);
    void ensureDocumentSections(needed).then((docs) => {
      if (cancelled) return;
      docs.forEach((doc, i) => {
        if (!doc) failedSources.current.add(needed[i].id);
      });
      setLoadingSources(false);
      // Re-render the reader, whose lines only now resolve against the registered sources.
      if (docs.some((d) => d)) usePrakaraStore.getState().bumpDocuments();
    });
    return () => {
      cancelled = true;
    };
  }, [playing, activePrakaraId]);

  // Derived during render so the loader is up on the first paint, before the fetch effect runs: a screen whose
  // live sources are not yet registered is pending whether or not the effect has flipped `loadingSources` yet.
  const livePending = (() => {
    if (playing) return pendingSourceParts(prakaraSourceParts(usePrakaraStore.getState().getActivePrakara()), failedSources.current).length > 0;
    if (route.kind !== 'article') return false;
    if (adapterFor(route.id) && !hasDocument(route.id)) return true;
    return pendingSourceParts(requiredSourceParts(route.id), failedSources.current).length > 0;
  })();
  // Name the work whose live sources are loading: a source's label, a composition's title, or the active prakara.
  const loadingLabel = playing
    ? usePrakaraStore.getState().getActivePrakara().title
    : route.kind === 'article'
      ? liveSourceLabel(route.id) ?? getArticle(route.id)?.title.english ?? route.id
      : '';

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

  // Running a piece makes it the active prakara, then leaves the wiki for the player.
  const runPiece = (pieceId: string) => {
    usePrakaraStore.getState().runPiece(pieceId);
    window.location.hash = '';
  };

  return (
    <>
      {/* The flame's light on the room's frame: a fixed overlay behind the content (see layout.css). */}
      <div className="flame-room-light" aria-hidden="true" />
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
        loadingSources || livePending ? (
          <FlameLoader label={loadingLabel} />
        ) : (
          <>
            <ZenMantraReader />
            <LocateLine />
          </>
        )
      ) : (
        <>
          <div className="wiki-main">
            {route.kind === 'home' && <WikiHome />}
            {route.kind === 'article' &&
              (live?.id === route.id ? (
                <LiveSourceNotice id={route.id} status={live.status} />
              ) : loadingSources || livePending ? (
                <FlameLoader label={loadingLabel} />
              ) : (
                <WikiArticle id={route.id} section={route.section} range={route.range} onRun={runPiece} />
              ))}
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
