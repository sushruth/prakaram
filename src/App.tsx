import { useState, useEffect } from 'preact/hooks';
import { Header } from './components/Header';
import { ZenMantraReader } from './components/ZenMantraReader';
import { CadenceControlBar } from './components/CadenceControlBar';
import { PrakaraBuilderModal } from './components/PrakaraBuilderModal';
import { ChantingRoomModal } from './components/ChantingRoomModal';
import { SettingsSheet } from './components/SettingsSheet';
import { PrakaraDetails } from './components/PrakaraDetails';
import { usePrakaraStore } from './stores/usePrakaraStore';
import { useCadenceStore } from './stores/useCadenceStore';
import { decodePrakaraFromUrlHash } from './services/urlCodec';

type DropKind = 'settings' | 'details';

export function App() {
  const [isPrakaraOpen, setIsPrakaraOpen] = useState(false);
  const [isRoomOpen, setIsRoomOpen] = useState(false);
  const [drop, setDrop] = useState<DropKind | null>(null);

  const { addPrakara } = usePrakaraStore();
  const { setBpm } = useCadenceStore();

  const toggle = (kind: DropKind) => setDrop((current) => (current === kind ? null : kind));
  const closeDrop = () => setDrop(null);

  useEffect(() => {
    const handleUrlState = async () => {
      const hash = window.location.hash;
      if (hash && hash.startsWith('#p=')) {
        const decoded = await decodePrakaraFromUrlHash(hash);
        if (decoded) {
          addPrakara(decoded);
          if (decoded.preferredBpm) {
            setBpm(decoded.preferredBpm);
          }
        }
      }

      const params = new URLSearchParams(window.location.search);
      if (params.get('room')) {
        setIsRoomOpen(true);
      }
    };

    handleUrlState();
  }, [addPrakara, setBpm]);

  return (
    <>
      <Header
        onOpenPrakara={() => setIsPrakaraOpen(true)}
        onOpenRoom={() => setIsRoomOpen(true)}
        onOpenSettings={() => toggle('settings')}
        onOpenDetails={() => toggle('details')}
        settingsOpen={drop === 'settings'}
        detailsOpen={drop === 'details'}
      />

      <SettingsSheet isOpen={drop === 'settings'} onClose={closeDrop} />
      <PrakaraDetails isOpen={drop === 'details'} onClose={closeDrop} />

      <ZenMantraReader />
      <CadenceControlBar />

      <PrakaraBuilderModal isOpen={isPrakaraOpen} onClose={() => setIsPrakaraOpen(false)} />
      <ChantingRoomModal isOpen={isRoomOpen} onClose={() => setIsRoomOpen(false)} />
    </>
  );
}
