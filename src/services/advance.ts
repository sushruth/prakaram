import { MantraChunk } from '../types/mantra';
import { useMantraStore } from '../stores/useMantraStore';
import { useCadenceStore } from '../stores/useCadenceStore';

export function advanceChunk(chunks: MantraChunk[]) {
  const { activeChunkIndex, nextChunk } = useMantraStore.getState();
  const cadence = useCadenceStore.getState();
  const current = chunks[activeChunkIndex];
  if (current && cadence.mode === 'learn') {
    cadence.registerTap(current.id, current.sanskrit);
  }
  nextChunk(chunks.length);
}
