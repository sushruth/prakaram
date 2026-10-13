import { describe, expect, it } from 'bun:test';
import { parseRoomInput, roomFromHash, roomLink } from './roomLink';

describe('roomLink', () => {
  it('builds and reads back', () => {
    const link = roomLink('https://x.dev/app/#/wiki', 'bhu-krittika-7k2');
    expect(link).toBe('https://x.dev/app/#room=bhu-krittika-7k2');
    expect(parseRoomInput(link)).toBe('bhu-krittika-7k2');
    expect(roomFromHash('#room=bhu-krittika-7k2')).toBe('bhu-krittika-7k2');
  });
  it('accepts a bare name, a pasted old ?room= link, and tidies typing', () => {
    expect(parseRoomInput('  Satsang Evening ')).toBe('satsang-evening');
    expect(parseRoomInput('https://x.dev/?room=satsang-123')).toBe('satsang-123');
  });
  it('refuses nothing usable', () => {
    expect(parseRoomInput('')).toBeNull();
    expect(parseRoomInput('a')).toBeNull();
    expect(roomFromHash('#/wiki')).toBeNull();
  });
});
