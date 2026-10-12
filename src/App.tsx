import { useState, useEffect } from 'preact/hooks';
import { Header } from './components/Header';
import { ZenMantraReader } from './components/ZenMantraReader';
import { LocateLine } from './components/LocateLine';
import { CadencePanel } from './components/CadencePanel';
import { PrakaraBuilderModal } from './components/PrakaraBuilderModal';
import { ChantingRoomModal } from './components/ChantingRoomModal';
import { SettingsSheet } from './components/SettingsSheet';
import { PrakaraDetails } from './components/PrakaraDetails';
import { usePrakaraStore } from './stores/usePrakaraStore';
import { useMantraStore } from './stores/useMantraStore';
import { isLearning, useCadenceStore } from './stores/useCadenceStore';
import { decodePrakaraFromUrlHash } from './services/urlCodec';

type DropKind = 'settings' | 'details' | 'cadence';

export function App() {
  const [isPrakaraOpen, setIsPrakaraOpen] = useState(false);
  const [isRoomOpen, setIsRoomOpen] = useState(false);
  const [drop, setDrop] = useState<DropKind | null>(null);

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
      <Header
        onOpenPrakara={() => setIsPrakaraOpen(true)}
        onOpenRoom={() => setIsRoomOpen(true)}
        onOpenSettings={() => toggle('settings')}
        onOpenDetails={() => toggle('details')}
        onOpenCadence={() => toggle('cadence')}
        settingsOpen={drop === 'settings'}
        detailsOpen={drop === 'details'}
        cadenceOpen={drop === 'cadence'}
      />

      <SettingsSheet isOpen={drop === 'settings'} onClose={closeDrop} />
      <PrakaraDetails isOpen={drop === 'details'} onClose={closeDrop} />
      <CadencePanel isOpen={drop === 'cadence'} onClose={closeDrop} />

      <ZenMantraReader />
      <LocateLine />

      <PrakaraBuilderModal isOpen={isPrakaraOpen} onClose={() => setIsPrakaraOpen(false)} />
      <ChantingRoomModal isOpen={isRoomOpen} onClose={() => setIsRoomOpen(false)} />
    </>
  );
}
