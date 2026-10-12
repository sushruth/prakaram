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

  joinRoom: (roomCode: string, asHost: boolean) => void;
  leaveRoom: () => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  isInRoom: false,
  roomCode: '',
  isHost: false,
  peerCount: 0,

  joinRoom: (roomCode: string, asHost: boolean) => {
    chantingRoom.connect(roomCode, asHost, {
      onPeerJoin: () => {
        set((s) => ({ peerCount: s.peerCount + 1 }));
      },
      onPeerLeave: () => {
        set((s) => ({ peerCount: Math.max(0, s.peerCount - 1) }));
      },
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

    set({
      isInRoom: true,
      roomCode,
      isHost: asHost,
      peerCount: 0,
    });
  },

  leaveRoom: () => {
    chantingRoom.disconnect();
    set({
      isInRoom: false,
      roomCode: '',
      isHost: false,
      peerCount: 0,
    });
  },
}));
