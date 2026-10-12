export interface TapRecord {
  timestamp: number;
  chunkId: string;
  matraWeight: number;
  intervalMs: number;
  instantaneousMsPerMatra: number;
}

export interface SyncMessage {
  type: 'CHUNK_CHANGE' | 'TIME_SYNC' | 'TEMPO_CHANGE';
  chunkIndex: number;
  prakaraId?: string;
  hostTimestamp: number;
  msPerMatra: number;
  autoProgress: boolean;
}
