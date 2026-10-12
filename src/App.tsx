import { useState, useEffect } from 'preact/hooks';
import { Header } from './components/Header';
import { ZenMantraReader } from './components/ZenMantraReader';
import { CadenceControlBar } from './components/CadenceControlBar';
import { PrakaraBuilderModal } from './components/PrakaraBuilderModal';
import { ChantingRoomModal } from './components/ChantingRoomModal';
import { PasskeyAuthModal } from './components/PasskeyAuthModal';
import { SettingsSheet } from './components/SettingsSheet';
import { usePrakaraStore } from './stores/usePrakaraStore';
import { useCadenceStore } from './stores/useCadenceStore';
import { useThemeStore, applyThemeAttribute } from './stores/useThemeStore';
import { decodePrakaraFromUrlHash } from './services/urlCodec';

export function App() {
  const [isPrakaraOpen, setIsPrakaraOpen] = useState(false);
  const [isRoomOpen, setIsRoomOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const { theme } = useThemeStore();
  const { addPrakara } = usePrakaraStore();
  const { setBpm } = useCadenceStore();

  useEffect(() => {
    applyThemeAttribute(theme);
  }, [theme]);

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
      const roomParam = params.get('room');
      if (roomParam) {
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
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenSettings={() => setIsSettingsOpen((o) => !o)}
        settingsOpen={isSettingsOpen}
      />

      <SettingsSheet isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      <ZenMantraReader />

      <CadenceControlBar />

      <PrakaraBuilderModal
        isOpen={isPrakaraOpen}
        onClose={() => setIsPrakaraOpen(false)}
      />

      <ChantingRoomModal
        isOpen={isRoomOpen}
        onClose={() => setIsRoomOpen(false)}
      />

      <PasskeyAuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />
    </>
  );
}
