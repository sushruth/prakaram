import type { SyncMessage } from '../types/cadence';

export interface RoomPeerCallbacks {
  onPeerJoin?: (peerId: string) => void;
  onPeerLeave?: (peerId: string) => void;
  onSyncMessage?: (message: SyncMessage, peerId: string) => void;
}

/** trystero's relay-socket reader, captured from the dynamic import so `ready` need not re-import it. */
type RelaySockets = () => Record<string, { readyState: number }>;

export class ChantingRoomService {
  private room: any = null;
  private sendSync: any = null;
  private getRelaySockets: RelaySockets | null = null;
  private isHost: boolean = false;
  private currentRoomCode: string = '';

  /**
   * Join a room. The trystero WebRTC stack (~a quarter of the old bundle) is imported here, on the first
   * real join, so it never reaches first paint. Rooms are a niche feature; nothing loads for them until asked.
   */
  public async connect(roomCode: string, isHost: boolean, callbacks: RoomPeerCallbacks): Promise<void> {
    this.disconnect();
    this.isHost = isHost;
    this.currentRoomCode = roomCode;

    const { getRelaySockets, joinRoom } = await import('trystero/torrent');
    this.getRelaySockets = getRelaySockets;

    const config = { appId: 'prakaram-vedic-chanting-v1' };
    this.room = joinRoom(config, roomCode);

    const [sendMsg, getMsg] = this.room.makeAction('sync');
    this.sendSync = sendMsg;

    getMsg((data: SyncMessage, peerId: string) => {
      callbacks.onSyncMessage?.(data, peerId);
    });

    this.room.onPeerJoin((peerId: string) => {
      callbacks.onPeerJoin?.(peerId);
    });

    this.room.onPeerLeave((peerId: string) => {
      callbacks.onPeerLeave?.(peerId);
    });
  }

  /** Resolves when a tracker connection is open (the room can be found), or after `timeoutMs` (offline: the host just waits). */
  public async ready(timeoutMs = 4000): Promise<void> {
    const end = Date.now() + timeoutMs;
    while (Date.now() < end) {
      const sockets = this.getRelaySockets?.() ?? {};
      if (Object.values(sockets).some((s) => s.readyState === 1)) return;
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  public broadcastChunkChange(chunkIndex: number, msPerMatra: number, autoProgress: boolean, prakaraId?: string) {
    if (!this.sendSync || !this.isHost) return;

    const payload: SyncMessage = {
      type: 'CHUNK_CHANGE',
      chunkIndex,
      prakaraId,
      hostTimestamp: Date.now(),
      msPerMatra,
      autoProgress
    };

    this.sendSync(payload);
  }

  public disconnect() {
    if (this.room) {
      try {
        this.room.leave();
      } catch (e) {
        // Best-effort: the room may already be gone, or trystero may throw while tearing down. Disconnecting
        // must still clear local state, so the failure is reported and swallowed rather than propagated.
        console.warn('[room] leave failed', e);
      }
      this.room = null;
      this.sendSync = null;
      this.currentRoomCode = '';
    }
  }

  public getRoomCode(): string {
    return this.currentRoomCode;
  }
}

export const chantingRoom = new ChantingRoomService();
