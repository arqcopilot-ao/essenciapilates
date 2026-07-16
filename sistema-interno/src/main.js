import { cache } from './core/cache.js';
import { auth } from './core/auth.js';
import { hashPassword } from './core/security.js';
import { showToast, openModal, closeModal } from './core/ui.js';
import { seedData } from './seed.js';
import { Dashboard } from './modules/dashboard.js';
import { Pacientes } from './modules/pacientes.js';
import { Financeiro } from './modules/financeiro.js';
import { Notas } from './modules/notas.js';
import { Agenda } from './modules/agenda.js';
import { Presenca } from './modules/presenca.js';
import { Usuarios } from './modules/usuarios.js';
import { initShortcuts } from './features/shortcuts.js';
import { DataManager } from './features/data-manager.js';
import { Theme } from './features/theme.js';
import './styles/main.css';

/* ============================================
   UTILS - Shared utilities (exposed as window.utils)
   ============================================ */
window.utils = {
  currency(val) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  },
  date(d) {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('pt-BR');
  },
  datetime(d) {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('pt-BR') + ' ' + new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  },
  phone(p) {
    if (!p) return '-';
    const n = p.replace(/\D/g, '');
    if (n.length === 11) return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
    if (n.length === 10) return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`;
    return p;
  },
  cpf(c) {
    if (!c) return '-';
    const n = c.replace(/\D/g, '');
    return n.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  },
  escapeHtml(str) {
    if (str === null || str === undefined) return '';
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;', '/': '&#x2F;' };
    return String(str).replace(/[&<>"'/]/g, char => map[char]);
  },
  today() {
    return new Date().toISOString().split('T')[0];
  },
  id() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }
};

// Expose for inline onclick handlers in HTML
window.showToast = showToast;
window.openModal = openModal;
window.closeModal = closeModal;

// Close modal on overlay click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay') && e.target.classList.contains('active')) {
    e.target.classList.remove('active');
  }
});

/* ============================================
   APP
   ============================================ */
const App = {
  currentPage: 'dashboard',

  async init() {
    // Seed data if needed
    seedData();

    // Seed default admin user if no users exist
    const users = cache.getOr('usuarios', []);
    if (users.length === 0) {
      const hashed = await hashPassword('admin123');
      cache.set('usuarios', [{
        id: window.utils.id(),
        nome: 'Administrador',
        email: 'admin@essencia.com',
        senha: hashed,
        cargo: 'admin',
        ativo: true,
        criadoEm: new Date().toISOString()
      }]);
    }

    // Init auth
    auth.init();

    if (!auth.isLoggedIn()) {
      this.showLogin();
    } else {
      this.showApp();
    }

    // Init features
    Theme.init();
    initShortcuts();
    DataManager.bindExportButton();
    DataManager.bindImportButton();
  },

  showLogin() {
    document.getElementById('login-page').style.display = 'flex';
    document.getElementById('app-layout').style.display = 'none';
    this.bindLogin();
  },

  async showApp() {
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('app-layout').style.display = 'flex';
    this.updateUserInfo();
    this.navigate('dashboard');
    this.bindSidebar();
    this.updateDate();
  },

  bindLogin() {
    const form = document.getElementById('login-form');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const pass = document.getElementById('login-password').value;
      const result = await auth.login(email, pass);
      if (result.success) {
        this.showApp();
      } else {
        const err = document.getElementById('login-error');
        err.textContent = result.error;
        err.style.display = 'block';
      }
    });
  },

  bindSidebar() {
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
      item.addEventListener('click', () => {
        this.navigate(item.dataset.page);
      });
    });

    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        auth.logout();
        location.reload();
      });
    }
  },

  navigate(page) {
    this.currentPage = page;

    // Update active nav
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const activeNav = document.querySelector(`.nav-item[data-page="${page}"]`);
    if (activeNav) activeNav.classList.add('active');

    // Show page
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const activePage = document.getElementById('page-' + page);
    if (activePage) activePage.classList.add('active');

    // Update header title
    const titles = {
      dashboard: 'Dashboard',
      pacientes: 'Pacientes',
      financeiro: 'Controle Financeiro',
      notas: 'Emissão de Notas Fiscais',
      agenda: 'Agenda',
      presenca: 'Controle de Presença',
      usuarios: 'Usuários do Sistema'
    };
    document.getElementById('header-title').textContent = titles[page] || page;

    // Init page
    if (page === 'dashboard') Dashboard.init();
    else if (page === 'pacientes') Pacientes.init();
    else if (page === 'financeiro') Financeiro.init();
    else if (page === 'notas') Notas.init();
    else if (page === 'agenda') Agenda.init();
    else if (page === 'presenca') Presenca.init();
    else if (page === 'usuarios') Usuarios.init();
  },

  updateUserInfo() {
    const user = auth.getUser();
    const nameEl = document.querySelector('.sidebar-user .name');
    const roleEl = document.querySelector('.sidebar-user .role');
    const avatarEl = document.querySelector('.sidebar-user .avatar');
    if (user && nameEl) {
      nameEl.textContent = user.nome;
      roleEl.textContent = user.cargo === 'admin' ? 'Administrador' : 'Operador';
      avatarEl.textContent = user.nome.charAt(0).toUpperCase();
    }
  },

  updateDate() {
    const dateEl = document.getElementById('header-date');
    if (dateEl) {
      dateEl.textContent = new Date().toLocaleDateString('pt-BR', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });
    }
  }
};

// Init on DOM ready
document.addEventListener('DOMContentLoaded', () => App.init());
