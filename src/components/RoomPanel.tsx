import { useState } from 'preact/hooks';
import { DropPanel, DropHead } from './DropPanel';
import { Icon } from './Icon';
import { Sanskrit } from './Sanskrit';
import { useRoomStore } from '../stores/useRoomStore';
import { describeRoom, generateRoomName } from '../services/roomName';
import { parseRoomInput, roomLink } from '../services/roomLink';

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
  const { isInRoom, roomCode, isHost, peerCount, creating, createRoom, joinRoom, leaveRoom } = useRoomStore();
  const [name, setName] = useState(() => generateRoomName());
  const [copied, setCopied] = useState(false);
  const [text, setText] = useState('');

  const id = isInRoom ? roomCode : name.id;
  const link = () => roomLink(window.location.href, id);

  const copyLink = async () => {
    // Copy first, inside the tap, because browsers only allow it from a user gesture; creation can take seconds.
    const ok = await copyText(link());
    if (!isInRoom) await createRoom(id);
    setCopied(ok);
  };

  const join = (e: Event) => {
    e.preventDefault();
    const joined = parseRoomInput(text);
    if (!joined) return;
    joinRoom(joined, false);
    setText('');
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

      {isInRoom ? (
        <>
          <p className="room-sub" role="status">
            {who} {peerCount === 0 ? 'No one else is here yet.' : `${peerCount} ${peerCount === 1 ? 'person' : 'people'} with you.`}
          </p>
          <button className="text-btn" onClick={copyLink}>
            Copy link
          </button>
          <button className="text-btn text-btn-muted" onClick={leave}>
            Leave
          </button>
        </>
      ) : (
        <>
          <button className="text-btn text-btn-muted" onClick={() => setName(generateRoomName())} disabled={creating}>
            another name
          </button>
          <button className="text-btn" onClick={copyLink} disabled={creating} aria-busy={creating}>
            {creating ? (
              <span className="room-creating">
                <Icon name="circle-notch" size={16} />
                <span>Creating…</span>
              </span>
            ) : (
              'Copy link'
            )}
          </button>
          <form className="room-join" onSubmit={join}>
            <input
              type="text"
              placeholder="Have a link or name? Join"
              aria-label="Join with a link or name"
              value={text}
              onInput={(e) => setText(e.currentTarget.value)}
              autocapitalize="off"
              autocomplete="off"
              spellcheck={false}
            />
            {parseRoomInput(text) && (
              <button type="submit" className="text-btn">
                Join
              </button>
            )}
          </form>
        </>
      )}
    </DropPanel>
  );
}
