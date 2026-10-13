import { useState } from 'preact/hooks';
import { DropPanel, DropHead } from './DropPanel';
import { Icon } from './Icon';
import { useRoomStore } from '../stores/useRoomStore';
import { generateRoomName } from '../services/roomName';
import { roomLink } from '../services/roomLink';

/** Clipboard API, with a textarea fallback for pages where it is unavailable. */
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      return document.execCommand('copy');
    } finally {
      ta.remove();
    }
  }
}

/** The room id in a monospace code fill with the copy icon inside it, on one line. */
function RoomId({ id, onCopy, busy }: { id: string; onCopy: () => void; busy: boolean }) {
  return (
    <span className="room-id">
      <code>{id}</code>
      <button className="room-copy" onClick={onCopy} disabled={busy} aria-busy={busy} aria-label={busy ? 'Creating the room' : 'Copy link'} title={busy ? 'Creating…' : 'Copy link'}>
        <span className={busy ? 'room-creating' : undefined}>
          <Icon name={busy ? 'circle-notch' : 'copy'} size={18} />
        </span>
      </button>
    </span>
  );
}

export function RoomPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { isInRoom, roomCode, isHost, peerCount, creating, createRoom, leaveRoom } = useRoomStore();
  const [name, setName] = useState(() => generateRoomName());
  const [copied, setCopied] = useState(false);

  const id = isInRoom ? roomCode : name.id;
  const link = () => roomLink(window.location.href, id);

  const copyLink = async () => {
    // Copy first, inside the tap, because browsers only allow it from a user gesture; creation can take seconds.
    const ok = await copyText(link());
    if (!isInRoom) await createRoom(id);
    setCopied(ok);
  };

  const leave = () => {
    leaveRoom();
    setCopied(false);
    setName(generateRoomName());
  };

  const who = copied ? 'Copied. You are the host.' : isHost ? 'You are the host.' : 'You are following the host.';

  return (
    <DropPanel label="Parāyaṇam" isOpen={isOpen} onClose={onClose}>
      <DropHead title="Parāyaṇam" onClose={onClose} />
      <p className="room-sub">Group recitation. Anyone with the name can join.</p>


      {isInRoom ? (
        <>
          <p className="room-sub" role="status">
            {who} {peerCount === 0 ? 'No one else is here yet.' : `${peerCount} ${peerCount === 1 ? 'person' : 'people'} with you.`}
          </p>
          <div className="room-actions">
            <RoomId id={id} onCopy={copyLink} busy={false} />
            <button className="text-btn text-btn-muted" onClick={leave}>
              Leave
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="room-actions">
            <RoomId id={id} onCopy={copyLink} busy={creating} />
            <button className="icon-btn" onClick={() => setName(generateRoomName())} disabled={creating} aria-label="Another name" title="Another name">
              <Icon name="arrows-clockwise" size={20} />
            </button>
          </div>
        </>
      )}
    </DropPanel>
  );
}
