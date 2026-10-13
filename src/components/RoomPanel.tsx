import { useState } from 'preact/hooks';
import { DropPanel, DropHead } from './DropPanel';
import { Icon } from './Icon';
import { Sanskrit } from './Sanskrit';
import { useRoomStore } from '../stores/useRoomStore';
import { describeRoom, generateRoomName } from '../services/roomName';
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

/** A room name: the two Sanskrit terms in the selected script, the code muted, the transliteration beneath. */
function RoomName({ id }: { id: string }) {
  const r = describeRoom(id);
  if (!r) return <p className="room-name">{id}</p>;
  return (
    <>
      <p className="room-name">
        <Sanskrit text={r.a.sa} />-<Sanskrit text={r.b.sa} /> <span className="room-code">{r.code}</span>
      </p>
      <p className="room-sub">{r.a.en}-{r.b.en}</p>
    </>
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

      <RoomName id={id} />
      <p className="room-id-row"><code className="room-id">{id}</code></p>

      {isInRoom ? (
        <>
          <p className="room-sub" role="status">
            {who} {peerCount === 0 ? 'No one else is here yet.' : `${peerCount} ${peerCount === 1 ? 'person' : 'people'} with you.`}
          </p>
          <div className="room-actions">
            <button className="icon-btn" onClick={copyLink} aria-label="Copy link" title="Copy link">
              <Icon name="copy" size={20} />
            </button>
            <button className="text-btn text-btn-muted" onClick={leave}>
              Leave
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="room-actions">
            <button className="icon-btn" onClick={() => setName(generateRoomName())} disabled={creating} aria-label="Another name" title="Another name">
              <Icon name="arrows-clockwise" size={20} />
            </button>
            <button className="icon-btn" onClick={copyLink} disabled={creating} aria-busy={creating} aria-label={creating ? 'Creating the room' : 'Copy link'} title={creating ? 'Creating…' : 'Copy link'}>
              <span className={creating ? 'room-creating' : undefined}>
                <Icon name={creating ? 'circle-notch' : 'copy'} size={20} />
              </span>
            </button>
          </div>
        </>
      )}
    </DropPanel>
  );
}
