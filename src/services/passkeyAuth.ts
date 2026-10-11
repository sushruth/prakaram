import {
  startRegistration,
  startAuthentication,
  browserSupportsWebAuthn,
  browserSupportsWebAuthnAutofill,
} from '@simplewebauthn/browser';

export interface UserProfile {
  id: string;
  username: string;
  displayName?: string;
}

const API_BASE = '/api/auth';

export class PasskeyService {
  public static isSupported(): boolean {
    return browserSupportsWebAuthn();
  }

  public static async canAutofill(): Promise<boolean> {
    return (await browserSupportsWebAuthnAutofill()) ?? false;
  }

  /**
   * Register a new passkey account without passwords.
   */
  public static async register(username: string): Promise<UserProfile> {
    // 1. Get options from server
    const optRes = await fetch(`${API_BASE}/register/options`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });

    if (!optRes.ok) {
      const err = await optRes.json();
      throw new Error(err.error || 'Failed to start passkey registration');
    }

    const { challengeId, options } = await optRes.json();

    // 2. Trigger browser passkey dialog
    const regResponse = await startRegistration({ optionsJSON: options });

    // 3. Verify attestation on server
    const verifyRes = await fetch(`${API_BASE}/register/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challengeId, response: regResponse }),
    });

    if (!verifyRes.ok) {
      const err = await verifyRes.json();
      throw new Error(err.error || 'Failed to verify passkey');
    }

    const data = await verifyRes.json();
    return data.user;
  }

  /**
   * Login using Passkey (TouchID / FaceID / Windows Hello / YubiKey)
   */
  public static async login(username?: string): Promise<UserProfile> {
    const optRes = await fetch(`${API_BASE}/login/options`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });

    if (!optRes.ok) {
      const err = await optRes.json();
      throw new Error(err.error || 'Failed to start passkey login');
    }

    const { challengeId, options } = await optRes.json();

    // Trigger browser biometric prompt
    const authResponse = await startAuthentication({ optionsJSON: options });

    const verifyRes = await fetch(`${API_BASE}/login/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challengeId, response: authResponse }),
    });

    if (!verifyRes.ok) {
      const err = await verifyRes.json();
      throw new Error(err.error || 'Passkey authentication failed');
    }

    const data = await verifyRes.json();
    return data.user;
  }
}
