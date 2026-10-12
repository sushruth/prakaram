import { Icon } from './Icon';
import type { UserProfile } from '../services/passkeyAuth';

export function PasskeySignedIn({ user, onLogout }: { user: UserProfile; onLogout: () => void }) {
  return (
    <div>
      <div style={{ padding: '1rem', background: 'var(--bg-card)', borderRadius: '10px', marginBottom: '1.2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Icon name="identification-card" size={28} />
          <div>
            <div style={{ fontWeight: 600 }}>{user.username}</div>
            <div style={{ fontSize: '0.8rem', color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}><Icon name="check" size={14} />Passkey Authenticated (TouchID / FaceID)</div>
          </div>
        </div>
      </div>

      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.2rem' }}>
        Your customized Prakaras, learned cadence scales, and recitation preferences are securely synchronized with your device.
      </p>

      <button
        onClick={onLogout}
        style={{ width: '100%', padding: '0.6rem', borderRadius: '999px', background: 'var(--bg-card)', cursor: 'pointer' }}
      >
        Sign Out
      </button>
    </div>
  );
}

interface SignInFormProps {
  username: string;
  onUsernameChange: (value: string) => void;
  isRegistering: boolean;
  onToggleRegistering: () => void;
  loading: boolean;
  message: string | null;
  onSubmit: () => void;
}

export function PasskeySignInForm({
  username,
  onUsernameChange,
  isRegistering,
  onToggleRegistering,
  loading,
  message,
  onSubmit,
}: SignInFormProps) {
  return (
    <div>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.2rem', lineHeight: 1.5 }}>
        Zero passwords. Zero SMS codes. Simply enter your username and touch your device fingerprint sensor or scan FaceID / Windows Hello.
      </p>

      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="username-input" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
          Username
        </label>
        <input
          id="username-input"
          type="text"
          autoComplete="username webauthn"
          placeholder={isRegistering ? 'e.g. sushruth' : 'Tap for Passkey or enter username'}
          value={username}
          onChange={(e) => onUsernameChange((e.target as HTMLInputElement).value)}
          style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', background: 'var(--bg-card)' }}
        />
      </div>

      {message && (
        <div style={{ fontSize: '0.82rem', color: 'var(--accent)', marginBottom: '1rem', textAlign: 'center' }}>
          {message}
        </div>
      )}

      <button
        className="btn-primary"
        disabled={loading}
        onClick={onSubmit}
        style={{ width: '100%', justifyContent: 'center', padding: '0.7rem', marginBottom: '1rem' }}
      >
        {loading ? 'Authenticating...' : isRegistering ? <><Icon name="sparkle" size={16} />Create Account with Passkey</> : <><Icon name="key" size={16} />Sign In with Passkey</>}
      </button>

      <div style={{ textAlign: 'center', fontSize: '0.82rem' }}>
        <button
          type="button"
          onClick={onToggleRegistering}
          style={{ background: 'none', border: 'none', color: 'var(--accent-gold)', textDecoration: 'underline', cursor: 'pointer' }}
        >
          {isRegistering ? 'Already registered? Sign In with Passkey' : 'New here? Create account with Passkey'}
        </button>
      </div>
    </div>
  );
}
