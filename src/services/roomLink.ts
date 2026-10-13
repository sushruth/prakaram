// The shareable link of a parāyaṇam: `<app address>#room=<id>`. The id is the room name; anyone who has it can join.
const ID = /^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/;

export const roomLink = (base: string, id: string) => `${base.split('#')[0]}#room=${encodeURIComponent(id)}`;

/** The room id in a hash such as `#room=bhu-krittika-7k2`, or null. */
export function roomFromHash(hash: string): string | null {
  return hash.startsWith('#room=') ? parseRoomInput(hash) : null;
}

/** A pasted link (`#room=` or the old `?room=`) or a bare name, as a room id; null when nothing usable. */
export function parseRoomInput(text: string): string | null {
  let s = text.trim();
  const m = s.match(/[#?&]room=([^&#\s]*)/);
  if (m) {
    try {
      s = decodeURIComponent(m[1]);
    } catch {
      return null;
    }
  }
  s = s.toLowerCase().replace(/[\s_]+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');
  return ID.test(s) ? s : null;
}
