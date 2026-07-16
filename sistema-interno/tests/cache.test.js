import { describe, it, expect } from 'vitest';
import { cache } from '../src/core/cache.js';

describe('DataCache', () => {
  it('returns null for missing keys', () => {
    expect(cache.get('missing')).toBeNull();
  });

  it('returns default value with getOr', () => {
    expect(cache.getOr('missing', [])).toEqual([]);
    expect(cache.getOr('missing', 'default')).toBe('default');
  });

  it('sets and gets values', () => {
    cache.set('test', { a: 1 });
    expect(cache.get('test')).toEqual({ a: 1 });
  });

  it('caches in memory after first read', () => {
    cache.set('mem', [1, 2, 3]);
    // Read from memory cache
    expect(cache.get('mem')).toEqual([1, 2, 3]);
  });

  it('removes values', () => {
    cache.set('toRemove', 'data');
    cache.remove('toRemove');
    expect(cache.get('toRemove')).toBeNull();
  });

  it('invalidates memory cache', () => {
    cache.set('invalidate', 'data');
    cache.invalidate('invalidate');
    // Should re-read from localStorage
    expect(cache.get('invalidate')).toBe('data');
  });

  it('invalidates all memory cache', () => {
    cache.set('a', 1);
    cache.set('b', 2);
    cache.invalidateAll();
    // Should re-read from localStorage
    expect(cache.get('a')).toBe(1);
    expect(cache.get('b')).toBe(2);
  });
});
