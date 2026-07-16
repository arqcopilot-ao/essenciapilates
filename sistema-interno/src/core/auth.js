import { cache } from './cache.js';
import { hashPassword } from './security.js';

const STORAGE_KEY = 'essencia_currentUser';

export const auth = {
  currentUser: null,

  init() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        this.currentUser = JSON.parse(saved);
      } catch {
        this.currentUser = null;
      }
    }
    return this.currentUser;
  },

  isLoggedIn() {
    return this.currentUser !== null;
  },

  async login(email, password) {
    const users = cache.getOr('usuarios', []);
    const hashedPassword = await hashPassword(password);
    const user = users.find(u => u.email === email && u.senha === hashedPassword);
    if (user) {
      this.currentUser = { ...user };
      delete this.currentUser.senha;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.currentUser));
      return { success: true };
    }
    return { success: false, error: 'E-mail ou senha incorretos' };
  },

  logout() {
    this.currentUser = null;
    localStorage.removeItem(STORAGE_KEY);
  },

  getUser() {
    return this.currentUser;
  },

  isAdmin() {
    return this.currentUser?.cargo === 'admin';
  }
};
