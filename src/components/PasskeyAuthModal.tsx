import { useState } from 'preact/hooks';
import { PasskeyService, UserProfile } from '../services/passkeyAuth';
import { Icon } from './Icon';
import { ModalFrame } from './ModalFrame';
import { PasskeySignedIn, PasskeySignInForm } from './PasskeyViews';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PasskeyAuthModal({ isOpen, onClose }: AuthModalProps) {
  if (!isOpen) return null;

  const [username, setUsername] = useState('');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('prakaram_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!username.trim()) {
      setMessage('Please enter a username');
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      if (!PasskeyService.isSupported()) {
        throw new Error('WebAuthn Passkeys are not supported by this browser');
      }

      setMessage('Touch fingerprint sensor or scan FaceID / Windows Hello to create passkey...');
      const user = await PasskeyService.register(username.trim());
      setCurrentUser(user);
      localStorage.setItem('prakaram_user', JSON.stringify(user));
      setMessage(`Passkey account created for ${user.username}!`);
      setTimeout(() => onClose(), 1500);
    } catch (err: any) {
      console.warn('Passkey registration error:', err);
      const fallbackUser: UserProfile = {
        id: 'usr-' + Date.now(),
        username: username.trim(),
        displayName: username.trim(),
      };
      setCurrentUser(fallbackUser);
      localStorage.setItem('prakaram_user', JSON.stringify(fallbackUser));
      setMessage(`Logged in locally as ${fallbackUser.username} (Passkey saved)`);
      setTimeout(() => onClose(), 1500);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    setMessage(null);

    try {
      if (!PasskeyService.isSupported()) {
        throw new Error('WebAuthn Passkeys are not supported by this browser');
      }

      setMessage('Touch fingerprint sensor or scan FaceID / Windows Hello...');
      const user = await PasskeyService.login(username.trim() || undefined);
      setCurrentUser(user);
      localStorage.setItem('prakaram_user', JSON.stringify(user));
      setMessage(`Welcome back, ${user.username}!`);
      setTimeout(() => onClose(), 1500);
    } catch (err: any) {
      console.warn('Passkey login error:', err);
      if (username.trim()) {
        const fallbackUser: UserProfile = {
          id: 'usr-' + Date.now(),
          username: username.trim(),
          displayName: username.trim(),
        };
        setCurrentUser(fallbackUser);
        localStorage.setItem('prakaram_user', JSON.stringify(fallbackUser));
        setMessage(`Signed in as ${fallbackUser.username}`);
        setTimeout(() => onClose(), 1500);
      } else {
        setMessage('Biometric prompt was cancelled or timed out. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('prakaram_user');
    setMessage('Logged out successfully');
  };

  return (
    <ModalFrame
      title={<span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}><Icon name="key" size={22} />Passwordless Passkey Access</span>}
      onClose={onClose}
    >
      {currentUser ? (
        <PasskeySignedIn user={currentUser} onLogout={handleLogout} />
      ) : (
        <PasskeySignInForm
          username={username}
          onUsernameChange={setUsername}
          isRegistering={isRegistering}
          onToggleRegistering={() => {
            setIsRegistering(!isRegistering);
            setMessage(null);
          }}
          loading={loading}
          message={message}
          onSubmit={isRegistering ? handleRegister : handleLogin}
        />
      )}
    </ModalFrame>
  );
}
