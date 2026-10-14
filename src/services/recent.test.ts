import { describe, expect, it } from 'bun:test';
import { MAX_RECENT, recordRecent } from './recent';

describe('recent articles reducer', () => {
  it('records an article, most recent first', () => {
    expect(recordRecent([], 'a')).toEqual(['a']);
    expect(recordRecent(['a'], 'b')).toEqual(['b', 'a']);
  });

  it('dedupes, moving an already-listed id to the front', () => {
    expect(recordRecent(['a', 'b', 'c'], 'b')).toEqual(['b', 'a', 'c']);
    expect(recordRecent(['a', 'b', 'c'], 'c')).toEqual(['c', 'a', 'b']);
  });

  it('caps the list, dropping the oldest', () => {
    const ids = Array.from({ length: MAX_RECENT }, (_, i) => `id-${i}`);
    const next = recordRecent(ids, 'new');
    expect(next).toHaveLength(MAX_RECENT);
    expect(next[0]).toBe('new');
    expect(next).not.toContain(`id-${MAX_RECENT - 1}`);
  });

  it('does not grow past the cap when re-recording a listed id', () => {
    const ids = Array.from({ length: MAX_RECENT }, (_, i) => `id-${i}`);
    expect(recordRecent(ids, 'id-0')).toHaveLength(MAX_RECENT);
  });

  it('ignores a blank id', () => {
    expect(recordRecent(['a'], '   ')).toEqual(['a']);
    expect(recordRecent(['a'], '')).toEqual(['a']);
  });
});
