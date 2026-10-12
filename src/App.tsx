import { useState, useEffect } from 'preact/hooks';
import { Header } from './components/Header';
import { CadenceStrip } from './components/CadenceStrip';
import { ZenMantraReader } from './components/ZenMantraReader';
import { LocateLine } from './components/LocateLine';
import { CadencePanel } from './components/CadencePanel';
import { PrakaraBuilderModal } from './components/PrakaraBuilderModal';
import { ChantingRoomModal } from './components/ChantingRoomModal';
import { SettingsSheet } from './components/SettingsSheet';
import { PrakaraDetails } from './components/PrakaraDetails';
import { KoshahPanel } from './components/KoshahPanel';
import { PieceView } from './components/PieceView';
import { usePrakaraStore } from './stores/usePrakaraStore';
import { useMantraStore } from './stores/useMantraStore';
import { isLearning, useCadenceStore } from './stores/useCadenceStore';
import { decodePrakaraFromUrlHash } from './services/urlCodec';
import { initLineClock } from './services/lineClock';

type DropKind = 'settings' | 'details' | 'cadence' | 'koshah';

/** The piece id in a `#k=<id>` address, or null. */
const pieceFromHash = () => {
  const m = window.location.hash.match(/^#k=(.+)$/);
  return m ? decodeURIComponent(m[1]) : null;
};

export function App() {
  const [isPrakaraOpen, setIsPrakaraOpen] = useState(false);
  const [isRoomOpen, setIsRoomOpen] = useState(false);
  const [drop, setDrop] = useState<DropKind | null>(null);
  const [pieceId, setPieceId] = useState<string | null>(pieceFromHash);

  useEffect(() => {
    const onHash = () => setPieceId(pieceFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

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

      const params = new URLSearchParams(window.location.search);
      if (params.get('room')) {
        setIsRoomOpen(true);
      }
    };

    handleUrlState();
  }, [addPrakara, setMsPerMatra]);

  return (
    <>
      <div className="chrome">
        <Header
          onOpenKoshah={() => toggle('koshah')}
          koshahOpen={drop === 'koshah'}
          onOpenRoom={() => setIsRoomOpen(true)}
          onOpenSettings={() => toggle('settings')}
          onOpenDetails={() => toggle('details')}
          settingsOpen={drop === 'settings'}
          detailsOpen={drop === 'details'}
        />
        <CadenceStrip onOpenPanel={() => toggle('cadence')} panelOpen={drop === 'cadence'} />
      </div>

      <SettingsSheet isOpen={drop === 'settings'} onClose={closeDrop} />
      <PrakaraDetails isOpen={drop === 'details'} onClose={closeDrop} />
      <KoshahPanel
        isOpen={drop === 'koshah'}
        onClose={closeDrop}
        onCompose={() => {
          closeDrop();
          setIsPrakaraOpen(true);
        }}
      />
      <CadencePanel isOpen={drop === 'cadence'} onClose={closeDrop} />

      {pieceId ? (
        <PieceView pieceId={pieceId} onClose={() => (window.location.hash = '')} />
      ) : (
        <>
          <ZenMantraReader />
          <LocateLine />
        </>
      )}

      <PrakaraBuilderModal isOpen={isPrakaraOpen} onClose={() => setIsPrakaraOpen(false)} />
      <ChantingRoomModal isOpen={isRoomOpen} onClose={() => setIsRoomOpen(false)} />
    </>
  );
}
