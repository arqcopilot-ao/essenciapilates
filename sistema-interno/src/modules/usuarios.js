import { cache } from '../core/cache.js';
import { validate, schemas, hashPassword } from '../core/security.js';
import { showToast, openModal, closeModal } from '../core/ui.js';

export const Usuarios = {
  init() { this.render(); this.bindEvents(); },
  getAll() { return cache.getOr('usuarios', []); },
  save(data) { cache.set('usuarios', data); },

  render() {
    const usuarios = this.getAll();
    const tbody = document.getElementById('usuarios-table-body'); if (!tbody) return;
    tbody.innerHTML = usuarios.map(u => `<tr><td><strong>${window.utils.escapeHtml(u.nome || '-')}</strong></td><td>${window.utils.escapeHtml(u.email || '-')}</td><td><span class="badge ${u.cargo === 'admin' ? 'badge-info' : 'badge-neutral'}">${u.cargo === 'admin' ? 'Administrador' : 'Operador'}</span></td><td><span class="badge ${u.ativo ? 'badge-success' : 'badge-neutral'}">${u.ativo ? 'Ativo' : 'Inativo'}</span></td><td>${window.utils.date(u.criadoEm)}</td><td><button class="btn btn-sm btn-secondary" onclick="window.usuariosModule.edit('${u.id}')">Editar</button> <button class="btn btn-sm btn-danger" onclick="window.usuariosModule.remove('${u.id}')">Excluir</button></td></tr>`).join('');
  },

  bindEvents() { const form = document.getElementById('usuario-form'); if (form) form.addEventListener('submit', async (e) => { e.preventDefault(); await this.saveForm(); }); },

  openModal(id = null) {
    const form = document.getElementById('usuario-form'); form.reset(); document.getElementById('usuario-id').value = '';
    document.getElementById('usuario-senha').required = true; document.getElementById('usuario-senha').placeholder = '';
    if (id) { const u = this.getAll().find(x => x.id === id); if (u) { document.getElementById('usuario-id').value = u.id; document.getElementById('usuario-nome').value = u.nome || ''; document.getElementById('usuario-email').value = u.email || ''; document.getElementById('usuario-cargo').value = u.cargo || 'operador'; document.getElementById('usuario-ativo').value = u.ativo ? 'true' : 'false'; document.getElementById('usuario-senha').required = false; document.getElementById('usuario-senha').placeholder = 'Deixe vazio para manter'; } }
    openModal('modal-usuario');
  },

  async saveForm() {
    const id = document.getElementById('usuario-id').value;
    const senha = document.getElementById('usuario-senha').value;
    if (!id && !senha) { showToast('Senha é obrigatória para novos usuários.', 'error'); return; }
    const data = { nome: document.getElementById('usuario-nome').value.trim(), email: document.getElementById('usuario-email').value.trim(), cargo: document.getElementById('usuario-cargo').value, ativo: document.getElementById('usuario-ativo').value === 'true' };
    const { valid, errors } = validate(data, schemas.usuario);
    if (!valid) { showToast(errors[0], 'error'); return; }
    const usuario = { id: id || Date.now().toString(36) + Math.random().toString(36).substr(2, 5), ...data };
    if (senha) usuario.senha = await hashPassword(senha);
    let usuarios = this.getAll();
    if (id) { const idx = usuarios.findIndex(u => u.id === id); if (idx !== -1) { if (!senha) usuario.senha = usuarios[idx].senha; usuario.criadoEm = usuarios[idx].criadoEm; usuarios[idx] = usuario; } }
    else { usuario.criadoEm = new Date().toISOString(); usuarios.push(usuario); }
    this.save(usuarios); closeModal('modal-usuario'); this.render(); showToast(id ? 'Usuário atualizado!' : 'Usuário criado!');
  },

  edit(id) { this.openModal(id); },
  remove(id) { const user = this.getAll().find(u => u.id === id); if (user?.email === 'admin@essencia.com') { showToast('Não é possível excluir o administrador padrão.', 'error'); return; } if (!window.confirm('Deseja excluir este usuário?')) return; this.save(this.getAll().filter(u => u.id !== id)); this.render(); showToast('Usuário excluído!', 'warning'); }
};

window.usuariosModule = Usuarios;
