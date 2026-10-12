import { Prakara } from '../types/mantra';

export async function encodePrakaraToUrlHash(prakara: Prakara): Promise<string> {
  const json = JSON.stringify(prakara);
  const stream = new Blob([json]).stream().pipeThrough(new CompressionStream('deflate-raw'));
  const response = new Response(stream);
  const buffer = await response.arrayBuffer();

  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export async function decodePrakaraFromUrlHash(encodedHash: string): Promise<Prakara | null> {
  try {
    let clean = encodedHash.replace(/^#p=/, '').replace(/^#/, '');
    clean = clean.replace(/-/g, '+').replace(/_/g, '/');
    while (clean.length % 4) {
      clean += '=';
    }

    const binary = atob(clean);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    const response = new Response(stream);
    const json = await response.text();
    return JSON.parse(json) as Prakara;
  } catch (err) {
    console.error('Failed to decode Prakara URL hash:', err);
    return null;
  }
}
