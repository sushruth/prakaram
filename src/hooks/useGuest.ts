import { useRoomStore } from '../stores/useRoomStore';

// A guest in a shared session follows the host and has no local cadence controls.
export function useGuest(): boolean {
  return useRoomStore((s) => s.isInRoom && !s.isHost);
}
