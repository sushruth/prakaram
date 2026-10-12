import { MantraChunk } from '../types/mantra';
import { useMantraStore } from '../stores/useMantraStore';
import { selectPhase, useCadenceStore } from '../stores/useCadenceStore';

export function advanceChunk(chunks: MantraChunk[]) {
  const { activeChunkIndex, nextChunk } = useMantraStore.getState();
  const cadence = useCadenceStore.getState();
  const phase = selectPhase(cadence);
  if (phase === 'engaged') return;
  const current = chunks[activeChunkIndex];
  if (current && phase === 'learning') cadence.registerTap(current.id, current.sanskrit);
  nextChunk(chunks.length);
}
