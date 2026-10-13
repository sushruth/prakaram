import { create } from 'zustand';
import { chantingRoom } from '../services/webrtcRoom';
import { SyncMessage } from '../types/cadence';
import { useMantraStore } from './useMantraStore';
import { useCadenceStore } from './useCadenceStore';

interface RoomState {
  isInRoom: boolean;
  roomCode: string;
  isHost: boolean;
  peerCount: number;
  /** True while a room is being created (connecting to the trackers). */
  creating: boolean;

  /** The owner starts a parāyaṇam: resolves once the room can be found, then the owner is its host. */
  createRoom: (roomCode: string) => Promise<void>;
  joinRoom: (roomCode: string, asHost: boolean) => void;
  leaveRoom: () => void;
}

export const useRoomStore = create<RoomState>((set) => {
  const connect = (roomCode: string, asHost: boolean) =>
    chantingRoom.connect(roomCode, asHost, {
      onPeerJoin: () => set((s) => ({ peerCount: s.peerCount + 1 })),
      onPeerLeave: () => set((s) => ({ peerCount: Math.max(0, s.peerCount - 1) })),
      onSyncMessage: (msg: SyncMessage) => {
        if (!asHost) {
          useMantraStore.getState().setActiveChunkIndex(msg.chunkIndex);
          if (msg.msPerMatra) {
            useCadenceStore.getState().setMsPerMatra(msg.msPerMatra);
          }
          useCadenceStore.getState().followHost(msg.autoProgress);
        }
      },
    });

  return {
    isInRoom: false,
    roomCode: '',
    isHost: false,
    peerCount: 0,
    creating: false,

    createRoom: async (roomCode) => {
      set({ creating: true });
      connect(roomCode, true);
      await chantingRoom.ready();
      set({ creating: false, isInRoom: true, roomCode, isHost: true, peerCount: 0 });
    },

    joinRoom: (roomCode, asHost) => {
      connect(roomCode, asHost);
      set({ isInRoom: true, roomCode, isHost: asHost, peerCount: 0 });
    },

    leaveRoom: () => {
      chantingRoom.disconnect();
      set({ isInRoom: false, roomCode: '', isHost: false, peerCount: 0, creating: false });
    },
  };
});
