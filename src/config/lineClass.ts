import { MantraChunk } from '../types/mantra';

/** The colour class for a line, shared by the reader and the minimap so both read the same. */
export const lineClass = (chunk: Pick<MantraChunk, 'kind'>) =>
  chunk.kind === 'shloka' ? 'line-shloka' : chunk.kind === 'vakya' ? 'line-vakya' : 'line-mantra';
