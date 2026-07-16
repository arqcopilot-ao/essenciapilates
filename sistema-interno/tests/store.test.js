import { describe, it, expect } from 'vitest';
import { store } from '../src/core/store.js';

describe('Store', () => {
  it('starts with empty state', () => {
    expect(store.get('nonexistent')).toBeUndefined();
  });

  it('sets and gets values', () => {
    store.set('test', 'hello');
    expect(store.get('test')).toBe('hello');
  });

  it('updates values with updater function', () => {
    store.set('counter', 0);
    store.update('counter', (prev) => prev + 1);
    expect(store.get('counter')).toBe(1);
  });

  it('notifies subscribers on change', () => {
    let received = null;
    const unsub = store.subscribe('watched', (val) => { received = val; });
    store.set('watched', 'new value');
    expect(received).toBe('new value');
    unsub();
  });

  it('unsubscribes correctly', () => {
    let count = 0;
    const unsub = store.subscribe('count', () => { count++; });
    store.set('count', 1);
    unsub();
    store.set('count', 2);
    expect(count).toBe(1);
  });

  it('handles multiple subscribers', () => {
    const results = [];
    const unsub1 = store.subscribe('multi', (v) => results.push('a:' + v));
    const unsub2 = store.subscribe('multi', (v) => results.push('b:' + v));
    store.set('multi', 'x');
    expect(results).toEqual(['a:x', 'b:x']);
    unsub1();
    unsub2();
  });
});
