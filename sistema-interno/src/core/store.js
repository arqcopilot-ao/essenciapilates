class Store {
  constructor() {
    this._state = {};
    this._listeners = new Map();
  }

  get(key) {
    return this._state[key];
  }

  set(key, value) {
    this._state[key] = value;
    this._notify(key);
  }

  update(key, updaterFn) {
    const prev = this._state[key];
    const next = updaterFn(prev);
    this._state[key] = next;
    this._notify(key);
  }

  subscribe(key, callback) {
    if (!this._listeners.has(key)) {
      this._listeners.set(key, new Set());
    }
    this._listeners.get(key).add(callback);
    return () => this._listeners.get(key)?.delete(callback);
  }

  _notify(key) {
    const listeners = this._listeners.get(key);
    if (listeners) {
      listeners.forEach(cb => cb(this._state[key]));
    }
  }
}

export const store = new Store();
