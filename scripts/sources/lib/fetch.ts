/**
 * Plain server-side `fetch` helpers for the build scripts. No proxy: a build-time fetch is
 * unrestricted, unlike the app's runtime fetch (see sources/README.md). Each throws on a non-ok
 * response so a caller can catch and skip a single missing page.
 */

/** The response body as text. Throws on a non-ok response. */
export async function getText(url: string, init?: RequestInit): Promise<string> {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`GET ${url} → ${res.status} ${res.statusText}`);
  return res.text();
}

/** The response body parsed as JSON. Throws on a non-ok response. */
export async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`GET ${url} → ${res.status} ${res.statusText}`);
  return (await res.json()) as T;
}

/**
 * The raw response for a `HEAD` request, so a caller can read `Last-Modified`/`ETag` for provenance
 * without downloading the body. The status is not checked here: a caller that only wants the headers
 * can read them from a 404 just as well.
 */
export function head(url: string): Promise<Response> {
  return fetch(url, { method: 'HEAD' });
}
