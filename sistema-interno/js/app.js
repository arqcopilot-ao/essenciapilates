/* ============================================
   APP - Main application logic, routing, auth
   ============================================ */
const App = {
    currentUser: null,
    currentPage: 'dashboard',

    init() {
        this.currentUser = Utils.load('currentUser');
        if (!this.currentUser) {
            this.showLogin();
        } else {
            this.showApp();
        }
    },

    showLogin() {
        document.getElementById('login-page').style.display = 'flex';
        document.getElementById('app-layout').style.display = 'none';
        this.bindLogin();
    },

    showApp() {
        document.getElementById('login-page').style.display = 'none';
        document.getElementById('app-layout').style.display = 'flex';
        this.updateUserInfo();
        this.navigate('dashboard');
        this.bindSidebar();
    },

    bindLogin() {
        const form = document.getElementById('login-form');
        if (!form) return;
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const pass = document.getElementById('login-password').value;
            const users = Utils.load('usuarios') || [];
            const user = users.find(u => u.email === email && u.senha === pass);
            if (user) {
                Utils.save('currentUser', user);
                this.currentUser = user;
                this.showApp();
            } else {
                const err = document.getElementById('login-error');
                err.textContent = 'E-mail ou senha incorretos';
                err.style.display = 'block';
            }
        });

        // Seed default admin if no users exist
        const users = Utils.load('usuarios') || [];
        if (users.length === 0) {
            Utils.save('usuarios', [{
                id: Utils.id(),
                nome: 'Administrador',
                email: 'admin@essencia.com',
                senha: 'admin123',
                cargo: 'admin',
                ativo: true,
                criadoEm: new Date().toISOString()
            }]);
        }
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
                Utils.remove('currentUser');
                this.currentUser = null;
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
        const nameEl = document.querySelector('.sidebar-user .name');
        const roleEl = document.querySelector('.sidebar-user .role');
        const avatarEl = document.querySelector('.sidebar-user .avatar');
        if (this.currentUser && nameEl) {
            nameEl.textContent = this.currentUser.nome;
            roleEl.textContent = this.currentUser.cargo === 'admin' ? 'Administrador' : 'Operador';
            avatarEl.textContent = this.currentUser.nome.charAt(0).toUpperCase();
        }
    }
};

// Init on DOM ready
document.addEventListener('DOMContentLoaded', () => App.init());
