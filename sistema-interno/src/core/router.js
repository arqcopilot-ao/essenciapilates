class Router {
  constructor() {
    this._routes = new Map();
    this._current = null;
    this._beforeEach = null;
  }

  register(path, handler) {
    this._routes.set(path, handler);
    return this;
  }

  beforeEach(fn) {
    this._beforeEach = fn;
    return this;
  }

  navigate(path) {
    window.location.hash = path;
  }

  start() {
    window.addEventListener('hashchange', () => this._resolve());
    this._resolve();
  }

  getCurrentPath() {
    return window.location.hash.slice(1) || '/dashboard';
  }

  _resolve() {
    const path = this.getCurrentPath();
    const handler = this._routes.get(path);
    if (!handler) {
      this.navigate('/dashboard');
      return;
    }
    if (this._beforeEach) {
      const proceed = this._beforeEach(path, this._current);
      if (!proceed) return;
    }
    this._current = path;
    handler();
  }
}

export const router = new Router();
