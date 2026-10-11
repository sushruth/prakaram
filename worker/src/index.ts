/**
 * Parayanam Cloudflare Worker API
 * Provides low-friction, zero-password WebAuthn Passkeys and Cloud Prakara Sync
 */

export interface Env {
  DB: any;
  RP_NAME: string;
  RP_ID: string;
  EXPECTED_ORIGIN: string;
  JWT_SECRET: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': env.EXPECTED_ORIGIN || '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Health check
    if (url.pathname === '/api/health') {
      return new Response(JSON.stringify({ status: 'ok', time: Date.now() }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Passkey Registration Options
    if (url.pathname === '/api/auth/register/options' && request.method === 'POST') {
      try {
        const { username } = await request.json() as { username?: string };
        if (!username) {
          return new Response(JSON.stringify({ error: 'Username required' }), {
            status: 400,
            headers: corsHeaders,
          });
        }

        const challengeId = crypto.randomUUID();
        const challenge = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
        const userId = crypto.randomUUID();

        // Passkey options payload
        const options = {
          challenge,
          rp: { name: env.RP_NAME || 'Parayanam', id: env.RP_ID || url.hostname },
          user: {
            id: btoa(userId),
            name: username,
            displayName: username,
          },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' },  // ES256
            { alg: -257, type: 'public-key' } // RS256
          ],
          authenticatorSelection: {
            residentKey: 'required',
            userVerification: 'preferred',
          },
          timeout: 60000,
          attestation: 'none',
        };

        return new Response(JSON.stringify({ challengeId, options }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
      }
    }

    // Passkey Login Options (Conditional UI discoverable credentials)
    if (url.pathname === '/api/auth/login/options' && request.method === 'POST') {
      try {
        const challengeId = crypto.randomUUID();
        const challenge = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));

        const options = {
          challenge,
          rpId: env.RP_ID || url.hostname,
          userVerification: 'preferred',
          timeout: 60000,
        };

        return new Response(JSON.stringify({ challengeId, options }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
      }
    }

    // Passkey Verification (simulated edge token issuer)
    if ((url.pathname === '/api/auth/register/verify' || url.pathname === '/api/auth/login/verify') && request.method === 'POST') {
      try {
        const body = await request.json() as { challengeId: string; response: any };
        const userId = 'usr-' + crypto.randomUUID().slice(0, 8);
        const username = body.response?.id ? 'user-' + body.response.id.slice(0, 6) : 'practitioner';

        return new Response(
          JSON.stringify({
            success: true,
            user: { id: userId, username, displayName: username },
            token: 'jwt-edge-' + crypto.randomUUID(),
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 400, headers: corsHeaders });
      }
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: corsHeaders,
    });
  },
};
