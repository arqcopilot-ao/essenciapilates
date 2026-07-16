class DataCache {
  constructor() {
    this._memCache = new Map();
  }

  get(key) {
    if (!this._memCache.has(key)) {
      const raw = localStorage.getItem('essencia_' + key);
      this._memCache.set(key, raw ? JSON.parse(raw) : null);
    }
    return this._memCache.get(key);
  }

  set(key, value) {
    this._memCache.set(key, value);
    localStorage.setItem('essencia_' + key, JSON.stringify(value));
  }

  remove(key) {
    this._memCache.delete(key);
    localStorage.removeItem('essencia_' + key);
  }

  invalidate(key) {
    this._memCache.delete(key);
  }

  invalidateAll() {
    this._memCache.clear();
  }

  getOr(key, defaultVal) {
    return this.get(key) ?? defaultVal;
  }
}

export const cache = new DataCache();
