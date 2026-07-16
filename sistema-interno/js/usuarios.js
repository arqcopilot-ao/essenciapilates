/* ============================================
   USUÁRIOS - User management
   ============================================ */
const Usuarios = {
    init() {
        this.render();
        this.bindEvents();
    },

    getAll() {
        return Utils.load('usuarios') || [];
    },

    save(data) {
        Utils.save('usuarios', data);
    },

    render() {
        const usuarios = this.getAll();
        const tbody = document.getElementById('usuarios-table-body');
        if (!tbody) return;

        tbody.innerHTML = usuarios.map(u => `
            <tr>
                <td><strong>${u.nome || '-'}</strong></td>
                <td>${u.email || '-'}</td>
                <td><span class="badge ${u.cargo === 'admin' ? 'badge-info' : 'badge-neutral'}">${u.cargo === 'admin' ? 'Administrador' : 'Operador'}</span></td>
                <td><span class="badge ${u.ativo ? 'badge-success' : 'badge-neutral'}">${u.ativo ? 'Ativo' : 'Inativo'}</span></td>
                <td>${Utils.date(u.criadoEm)}</td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="Usuarios.edit('${u.id}')">Editar</button>
                    <button class="btn btn-sm btn-danger" onclick="Usuarios.remove('${u.id}')">Excluir</button>
                </td>
            </tr>
        `).join('');
    },

    bindEvents() {
        const form = document.getElementById('usuario-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveForm();
            });
        }
    },

    openModal(id = null) {
        const modal = document.getElementById('modal-usuario');
        const form = document.getElementById('usuario-form');
        form.reset();
        document.getElementById('usuario-id').value = '';
        document.getElementById('usuario-senha').required = true;

        if (id) {
            const u = this.getAll().find(x => x.id === id);
            if (u) {
                document.getElementById('usuario-id').value = u.id;
                document.getElementById('usuario-nome').value = u.nome || '';
                document.getElementById('usuario-email').value = u.email || '';
                document.getElementById('usuario-cargo').value = u.cargo || 'operador';
                document.getElementById('usuario-ativo').value = u.ativo ? 'true' : 'false';
                document.getElementById('usuario-senha').required = false;
                document.getElementById('usuario-senha').placeholder = 'Deixe vazio para manter';
            }
        } else {
            document.getElementById('usuario-senha').placeholder = '';
        }

        modal.classList.add('active');
    },

    closeModal(id) {
        document.getElementById(id).classList.remove('active');
    },

    saveForm() {
        const id = document.getElementById('usuario-id').value;
        const senha = document.getElementById('usuario-senha').value;

        if (!id && !senha) {
            Utils.toast('Senha é obrigatória para novos usuários.', 'error');
            return;
        }

        const dados = {
            id: id || Utils.id(),
            nome: document.getElementById('usuario-nome').value,
            email: document.getElementById('usuario-email').value,
            cargo: document.getElementById('usuario-cargo').value,
            ativo: document.getElementById('usuario-ativo').value === 'true'
        };

        if (senha) dados.senha = senha;

        let usuarios = this.getAll();
        if (id) {
            const idx = usuarios.findIndex(u => u.id === id);
            if (idx !== -1) {
                dados.senha = senha || usuarios[idx].senha;
                dados.criadoEm = usuarios[idx].criadoEm;
                usuarios[idx] = dados;
            }
        } else {
            dados.criadoEm = new Date().toISOString();
            usuarios.push(dados);
        }

        this.save(usuarios);
        this.closeModal('modal-usuario');
        this.render();
        Utils.toast(id ? 'Usuário atualizado!' : 'Usuário criado!');
    },

    edit(id) { this.openModal(id); },

    remove(id) {
        const user = this.getAll().find(u => u.id === id);
        if (user && user.email === 'admin@essencia.com') {
            Utils.toast('Não é possível excluir o administrador padrão.', 'error');
            return;
        }
        if (!Utils.confirm('Deseja excluir este usuário?')) return;
        this.save(this.getAll().filter(u => u.id !== id));
        this.render();
        Utils.toast('Usuário excluído!', 'warning');
    }
};
