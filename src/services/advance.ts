import { MantraChunk } from '../types/mantra';
import { useMantraStore } from '../stores/useMantraStore';
import { isLearning, useCadenceStore } from '../stores/useCadenceStore';

export function advanceChunk(chunks: MantraChunk[]) {
  const { activeChunkIndex, nextChunk } = useMantraStore.getState();
  const cadence = useCadenceStore.getState();
  if (cadence.phase === 'engaged') return;
  const current = chunks[activeChunkIndex];
  if (current && isLearning(cadence.phase)) cadence.tap(current.id, current.sanskrit);
  nextChunk(chunks.length);
}
