const STORAGE_KEY = 'essencia_theme';

export const Theme = {
  init() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'dark') {
      document.documentElement.classList.add('dark');
    }
    this.bindToggle();
  },

  toggle() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light');
  },

  isDark() {
    return document.documentElement.classList.contains('dark');
  },

  bindToggle() {
    const btn = document.getElementById('btn-theme-toggle');
    if (btn) {
      btn.addEventListener('click', () => this.toggle());
    }
  }
};
