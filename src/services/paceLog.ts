import { MantraChunk } from '../types/mantra';
import { chunkMatras } from './cadenceEngine';

export interface PaceLogLine {
  index: number;
  id: string;
  sourceId?: string;
  sanskrit: string;
  matras: number;
  activeMs: number;
  msPerMatra: number;
  endedAt: string;
}

let lines: PaceLogLine[] = [];

export function logLine(index: number, chunk: MantraChunk, activeMs: number) {
  const matras = chunkMatras(chunk.sanskrit);
  lines.push({
    index,
    id: chunk.id,
    sourceId: chunk.sourceId,
    sanskrit: chunk.sanskrit,
    matras,
    activeMs,
    msPerMatra: Math.round(activeMs / matras),
    endedAt: new Date().toISOString(),
  });
}

export const paceLogSize = () => lines.length;

export function clearPaceLog() {
  lines = [];
}

export function downloadPaceLog(prakaraId: string) {
  const blob = new Blob([JSON.stringify({ prakaraId, lines }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `pace-${prakaraId}-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}
