
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

    const corsHeaders = {
      // pi-lens-ignore: cors-wildcard
      'Access-Control-Allow-Origin': env.EXPECTED_ORIGIN || '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (url.pathname === '/api/health') {
      return new Response(JSON.stringify({ status: 'ok', time: Date.now() }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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

        const options = {
          challenge,
          rp: { name: env.RP_NAME || 'Prakaram', id: env.RP_ID || url.hostname },
          user: {
            id: btoa(userId),
            name: username,
            displayName: username,
          },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' },
            { alg: -257, type: 'public-key' }
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

    if ((url.pathname === '/api/auth/register/verify' || url.pathname === '/api/auth/login/verify') && request.method === 'POST') {
      return new Response(JSON.stringify({ error: 'Passkey verification is not implemented' }), {
        status: 501,
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: corsHeaders,
    });
  },
};
