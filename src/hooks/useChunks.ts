import { useMemo } from 'preact/hooks';
import { usePrakaraStore } from '../stores/usePrakaraStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { MantraChunk } from '../types/mantra';

export function useChunks(): MantraChunk[] {
  const prakaras = usePrakaraStore((s) => s.prakaras);
  const activePrakaraId = usePrakaraStore((s) => s.activePrakaraId);
  const splitLines = useSettingsStore((s) => s.splitLines);
  return useMemo(() => usePrakaraStore.getState().getFlattenedChunks(), [prakaras, activePrakaraId, splitLines]);
}
