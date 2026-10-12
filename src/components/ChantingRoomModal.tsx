import { useState } from 'preact/hooks';
import { useRoomStore } from '../stores/useRoomStore';
import { Icon } from './Icon';

interface RoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChantingRoomModal({ isOpen, onClose }: RoomModalProps) {
  if (!isOpen) return null;

  const { isInRoom, roomCode, isHost, peerCount, joinRoom, leaveRoom } = useRoomStore();
  const [inputCode, setInputCode] = useState('');
  const [role, setRole] = useState<'host' | 'follower'>('host');
  const [copiedLink, setCopiedLink] = useState(false);

  const handleConnect = () => {
    const code = inputCode.trim() || 'satsang-' + Math.floor(100 + Math.random() * 900);
    joinRoom(code, role === 'host');
  };

  const handleCopyInvite = async () => {
    const url = `${window.location.origin}${window.location.pathname}?room=${roomCode}`;
    await navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
          <h3 className="title-display" style={{ fontSize: '1.25rem', margin: 0, color: 'var(--accent)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}><Icon name="broadcast" size={22} />Live Chanting Room (WebRTC)</span>
          </h3>
          <button className="btn-icon" onClick={onClose} style={{ width: '2rem', height: '2rem' }}>
            <Icon name="x" size={16} />
          </button>
        </div>

        {isInRoom ? (
          <div>
            <div style={{ padding: '1rem', background: 'var(--bg-card)', borderRadius: '10px', border: '1px solid var(--border-subtle)', marginBottom: '1.2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <span style={{ width: '10px', height: '10px', background: '#10b981', borderRadius: '50%' }} />
                <strong style={{ fontSize: '0.95rem' }}>Connected to Room: {roomCode}</strong>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                Role: <strong>{isHost ? 'Host / Reciter (Pacing lead)' : 'Follower (Syncing live)'}</strong> • Peers connected: <strong>{peerCount}</strong>
              </p>
              {isHost && (
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  As Host, your line advancements, pauses, and cadence automatically sync to all followers in real-time.
                </p>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <button className="btn-primary" onClick={handleCopyInvite} style={{ flex: 1, justifyContent: 'center' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}><Icon name={copiedLink ? 'check' : 'link'} size={15} />{copiedLink ? 'Copied Invite Link' : 'Copy Invite Link'}</span>
              </button>
              <button
                onClick={leaveRoom}
                style={{ padding: '0.55rem 1rem', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '999px', background: 'transparent', cursor: 'pointer' }}
              >
                Disconnect
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.2rem', lineHeight: 1.5 }}>
              Chant in sync with teachers, students, or satsang groups worldwide using peer-to-peer WebRTC with sub-100ms latency.
            </p>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Room Code
              </label>
              <input
                type="text"
                placeholder="e.g. satsang-108"
                value={inputCode}
                onChange={(e) => setInputCode((e.target as HTMLInputElement).value)}
                style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)' }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Your Role
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setRole('host')}
                  style={{
                    flex: 1,
                    padding: '0.6rem',
                    borderRadius: '8px',
                    border: role === 'host' ? '2px solid var(--accent)' : '1px solid var(--border-subtle)',
                    background: role === 'host' ? 'var(--highlight-bg)' : 'var(--bg-card)',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  Host (Lead Chanting)
                </button>
                <button
                  type="button"
                  onClick={() => setRole('follower')}
                  style={{
                    flex: 1,
                    padding: '0.6rem',
                    borderRadius: '8px',
                    border: role === 'follower' ? '2px solid var(--accent)' : '1px solid var(--border-subtle)',
                    background: role === 'follower' ? 'var(--highlight-bg)' : 'var(--bg-card)',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  Follower (Sync Screen)
                </button>
              </div>
            </div>

            <button
              className="btn-primary"
              onClick={handleConnect}
              style={{ width: '100%', justifyContent: 'center', padding: '0.7rem' }}
            >
              Connect to Room
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
