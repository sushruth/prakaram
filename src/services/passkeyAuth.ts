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

async function postJson<T>(path: string, body: unknown, fallbackError: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || fallbackError);
  }
  return res.json();
}

export class PasskeyService {
  public static isSupported(): boolean {
    return browserSupportsWebAuthn();
  }

  public static async canAutofill(): Promise<boolean> {
    return (await browserSupportsWebAuthnAutofill()) ?? false;
  }

  public static async register(username: string): Promise<UserProfile> {
    const { challengeId, options } = await postJson<any>(
      '/register/options',
      { username },
      'Failed to start passkey registration',
    );

    const regResponse = await startRegistration({ optionsJSON: options });

    const data = await postJson<any>(
      '/register/verify',
      { challengeId, response: regResponse },
      'Failed to verify passkey',
    );
    return data.user;
  }

  public static async login(username?: string): Promise<UserProfile> {
    const { challengeId, options } = await postJson<any>(
      '/login/options',
      { username },
      'Failed to start passkey login',
    );

    const authResponse = await startAuthentication({ optionsJSON: options });

    const data = await postJson<any>(
      '/login/verify',
      { challengeId, response: authResponse },
      'Passkey authentication failed',
    );
    return data.user;
  }
}
