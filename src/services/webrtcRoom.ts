import { getRelaySockets, joinRoom } from 'trystero/torrent';
import { SyncMessage } from '../types/cadence';

export interface RoomPeerCallbacks {
  onPeerJoin?: (peerId: string) => void;
  onPeerLeave?: (peerId: string) => void;
  onSyncMessage?: (message: SyncMessage, peerId: string) => void;
}

export class ChantingRoomService {
  private room: any = null;
  private sendSync: any = null;
  private isHost: boolean = false;
  private currentRoomCode: string = '';

  public connect(roomCode: string, isHost: boolean, callbacks: RoomPeerCallbacks) {
    this.disconnect();
    this.isHost = isHost;
    this.currentRoomCode = roomCode;

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
      if (Object.values(getRelaySockets()).some((s) => s.readyState === 1)) return;
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
