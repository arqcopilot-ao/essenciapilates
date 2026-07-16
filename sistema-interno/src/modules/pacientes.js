import { cache } from '../core/cache.js';
import { escapeHtml, validate, schemas } from '../core/security.js';
import { undoManager } from '../core/undo.js';
import { showToast, openModal, closeModal } from '../core/ui.js';
import { auth } from '../core/auth.js';

const PER_PAGE = 9;
let currentPage = 1;
let searchQuery = '';
let searchTimeout = null;

export const Pacientes = {
  init() { this.render(); this.bindEvents(); },
  getAll() { return cache.getOr('pacientes', []); },
  save(data) { cache.set('pacientes', data); },

  render() {
    const pacientes = this.getAll();
    const filtered = pacientes.filter(p => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return Object.values(p).some(v => String(v).toLowerCase().includes(q));
    });
    const totalPages = Math.ceil(filtered.length / PER_PAGE);
    if (currentPage > totalPages) currentPage = Math.max(1, totalPages);
    const start = (currentPage - 1) * PER_PAGE;
    const pageData = filtered.slice(start, start + PER_PAGE);

    const container = document.getElementById('pacientes-cards') || document.getElementById('pacientes-table-body');
    if (!container) return;

    if (filtered.length === 0) {
      container.innerHTML = `<div class="empty-state"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg><h4>Nenhum paciente encontrado</h4><p>Clique em "Novo Paciente" para cadastrar.</p></div>`;
    } else {
      container.innerHTML = pageData.map(p => {
        const initials = p.nome.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
        const idade = this.calcIdade(p.nascimento);
        const historicos = cache.getOr('historicos', []);
        const histCount = historicos.filter(h => h.pacienteId === p.id).length;
        const agendamentos = cache.getOr('agendamentos', []);
        const proximoAg = agendamentos.filter(a => a.pacienteId === p.id && a.data >= new Date().toISOString().split('T')[0]).sort((a, b) => a.data.localeCompare(b.data))[0];

        // Resolve professional name
        let profissionalNome = '';
        if (p.profissionalId) {
          const usuarios = cache.getOr('usuarios', []);
          const prof = usuarios.find(u => u.id === p.profissionalId);
          profissionalNome = prof ? prof.nome : '';
        }

        // Anamnese indicator
        const anamneses = cache.getOr('anamneses', []);
        const hasAnamnese = anamneses.some(a => a.pacienteId === p.id);

        return `<div class="patient-card">
          <div class="patient-card-header"><div class="patient-avatar">${escapeHtml(initials)}</div><span class="badge ${p.status === 'ativo' ? 'badge-success' : 'badge-neutral'}">${p.status === 'ativo' ? 'Ativo' : 'Inativo'}</span></div>
          <div class="patient-card-body">
            <h4 class="patient-name">${escapeHtml(p.nome || '-')}</h4>
            <div class="patient-details">
              <div class="patient-detail"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg><span>${escapeHtml(idade)}</span></div>
              <div class="patient-detail"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg><span>${escapeHtml(window.utils.phone(p.telefone))}</span></div>
              <div class="patient-detail"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg><span>${escapeHtml(p.email || 'Sem e-mail')}</span></div>
              <div class="patient-detail"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg><span>${escapeHtml(p.endereco || 'Sem endereço')}</span></div>
              ${profissionalNome ? `<div class="patient-detail patient-professional"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/></svg><span>${escapeHtml(profissionalNome)}</span></div>` : ''}
            </div>
            ${p.observacoes ? `<div class="patient-notes"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg><span>${escapeHtml(p.observacoes)}</span></div>` : ''}
          </div>
          <div class="patient-card-footer">
            <div class="patient-stats">
              <div class="patient-stat"><span class="stat-val">${histCount}</span><span class="stat-lbl">Registros</span></div>
              <div class="patient-stat"><span class="stat-val">${proximoAg ? window.utils.date(proximoAg.data) : '-'}</span><span class="stat-lbl">Próxima aula</span></div>
              ${hasAnamnese ? `<div class="patient-stat"><span class="stat-val anamnese-ok">✓</span><span class="stat-lbl">Anamnese</span></div>` : ''}
            </div>
            <div class="patient-actions">
              <button class="btn btn-sm btn-secondary" onclick="window.pacientesModule.edit('${p.id}')">Editar</button>
              <button class="btn btn-sm btn-secondary" onclick="window.pacientesModule.history('${p.id}')">Histórico</button>
              <button class="btn btn-sm btn-primary" onclick="window.pacientesModule.anamnese('${p.id}')" title="Anamnese">Anamnese</button>
              <button class="btn btn-sm btn-danger" onclick="window.pacientesModule.remove('${p.id}')">Excluir</button>
            </div>
          </div>
        </div>`;
      }).join('');
    }

    const countEl = document.getElementById('pacientes-count');
    if (countEl) countEl.textContent = `${pacientes.filter(p => p.status === 'ativo').length} ativos / ${pacientes.length} total`;
    this.renderPagination(totalPages);
  },

  renderPagination(totalPages) {
    const container = document.getElementById('pacientes-pagination');
    if (!container) return;
    if (totalPages <= 1) { container.innerHTML = ''; return; }
    let html = `<button ${currentPage === 1 ? 'disabled' : ''} onclick="window.pacientesModule.goToPage(${currentPage - 1})">←</button>`;
    for (let i = 1; i <= totalPages; i++) html += `<button class="${i === currentPage ? 'active' : ''}" onclick="window.pacientesModule.goToPage(${i})">${i}</button>`;
    html += `<button ${currentPage === totalPages ? 'disabled' : ''} onclick="window.pacientesModule.goToPage(${currentPage + 1})">→</button>`;
    container.innerHTML = html;
  },

  goToPage(page) { currentPage = page; this.render(); },

  calcIdade(nascimento) {
    if (!nascimento) return '-';
    const hoje = new Date(); const nasc = new Date(nascimento);
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
    return `${idade} anos`;
  },

  populateProfissionais() {
    const select = document.getElementById('paciente-profissional');
    if (!select) return;
    const usuarios = cache.getOr('usuarios', []);
    const current = select.value;
    select.innerHTML = '<option value="">Selecione</option>' + usuarios.filter(u => u.ativo !== false).map(u => `<option value="${escapeHtml(u.id)}">${escapeHtml(u.nome)}</option>`).join('');
    select.value = current;
  },

  bindEvents() {
    const search = document.getElementById('pacientes-search');
    if (search) search.addEventListener('input', (e) => { clearTimeout(searchTimeout); searchTimeout = setTimeout(() => { searchQuery = e.target.value; currentPage = 1; this.render(); }, 300); });
    const form = document.getElementById('paciente-form');
    if (form) form.addEventListener('submit', (e) => { e.preventDefault(); this.saveForm(); });
    const anamneseForm = document.getElementById('anamnese-form');
    if (anamneseForm) anamneseForm.addEventListener('submit', (e) => { e.preventDefault(); this.saveAnamnese(); });
  },

  openModal(id = null) {
    const form = document.getElementById('paciente-form');
    form.reset();
    document.getElementById('paciente-id').value = '';
    this.populateProfissionais();
    if (id) {
      const p = this.getAll().find(x => x.id === id);
      if (p) {
        document.getElementById('paciente-id').value = p.id;
        document.getElementById('paciente-nome').value = p.nome || '';
        document.getElementById('paciente-cpf').value = p.cpf || '';
        document.getElementById('paciente-rg').value = p.rg || '';
        document.getElementById('paciente-nascimento').value = p.nascimento || '';
        document.getElementById('paciente-telefone').value = p.telefone || '';
        document.getElementById('paciente-email').value = p.email || '';
        document.getElementById('paciente-profissional').value = p.profissionalId || '';
        document.getElementById('paciente-endereco').value = p.endereco || '';
        document.getElementById('paciente-obs').value = p.observacoes || '';
        document.getElementById('paciente-status').value = p.status || 'ativo';
      }
    }
    openModal('modal-paciente');
  },

  saveForm() {
    const id = document.getElementById('paciente-id').value;
    const data = {
      nome: document.getElementById('paciente-nome').value.trim(),
      cpf: document.getElementById('paciente-cpf').value.trim(),
      rg: document.getElementById('paciente-rg').value.trim(),
      nascimento: document.getElementById('paciente-nascimento').value,
      telefone: document.getElementById('paciente-telefone').value.trim(),
      email: document.getElementById('paciente-email').value.trim(),
      profissionalId: document.getElementById('paciente-profissional').value,
      endereco: document.getElementById('paciente-endereco').value.trim(),
      observacoes: document.getElementById('paciente-obs').value.trim(),
      status: document.getElementById('paciente-status').value
    };
    const { valid, errors } = validate(data, schemas.paciente);
    if (!valid) { showToast(errors[0], 'error'); return; }

    const paciente = { id: id || Date.now().toString(36) + Math.random().toString(36).substr(2, 5), ...data, criadoEm: id ? this.getAll().find(p => p.id === id)?.criadoEm : new Date().toISOString() };

    if (id) {
      const prev = { ...this.getAll().find(p => p.id === id) };
      undoManager.execute({ execute: () => { let list = this.getAll(); const idx = list.findIndex(p => p.id === id); if (idx !== -1) { paciente.criadoEm = prev.criadoEm; list[idx] = paciente; } this.save(list); this.render(); }, undo: () => { let list = this.getAll(); const idx = list.findIndex(p => p.id === id); if (idx !== -1) list[idx] = prev; this.save(list); this.render(); }, description: 'Editar paciente' });
    } else {
      let list = this.getAll(); list.push(paciente); this.save(list);
    }
    closeModal('modal-paciente');
    this.render();
    showToast(id ? 'Paciente atualizado!' : 'Paciente cadastrado!');
  },

  edit(id) { this.openModal(id); },

  remove(id) {
    if (!window.confirm('Deseja realmente excluir este paciente?')) return;
    const paciente = this.getAll().find(p => p.id === id);
    undoManager.execute({ execute: () => { this.save(this.getAll().filter(p => p.id !== id)); this.render(); }, undo: () => { const list = this.getAll(); list.push(paciente); this.save(list); this.render(); }, description: 'Excluir paciente' });
    showToast('Paciente excluído!', 'warning');
  },

  history(id) {
    const paciente = this.getAll().find(p => p.id === id);
    if (!paciente) return;
    const historicos = cache.getOr('historicos', []).filter(h => h.pacienteId === id);
    document.getElementById('historico-paciente-nome').textContent = paciente.nome;
    const timeline = document.getElementById('historico-timeline');
    if (historicos.length === 0) { timeline.innerHTML = '<div class="empty-state"><p>Nenhum registro encontrado.</p></div>'; }
    else { timeline.innerHTML = historicos.sort((a, b) => new Date(b.data) - new Date(a.data)).map(h => `<div class="timeline-item"><div class="date">${window.utils.datetime(h.data)}</div><div class="title">${escapeHtml(h.titulo)}</div><div class="description">${escapeHtml(h.descricao)}</div></div>`).join(''); }
    document.getElementById('btn-add-historico').onclick = () => {
      const titulo = prompt('Título do registro:'); if (!titulo) return;
      const descricao = prompt('Descrição:');
      const historicos = cache.getOr('historicos', []);
      historicos.push({ id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5), pacienteId: id, titulo, descricao: descricao || '', data: new Date().toISOString(), profissional: auth.getUser()?.nome || 'Sistema' });
      cache.set('historicos', historicos); this.history(id); showToast('Registro adicionado!');
    };
    openModal('modal-historico');
  },

  anamnese(id) {
    const paciente = this.getAll().find(p => p.id === id);
    if (!paciente) return;
    const anamneses = cache.getOr('anamneses', []);
    const existing = anamneses.find(a => a.pacienteId === id);

    document.getElementById('anamnese-paciente-nome').textContent = paciente.nome;
    document.getElementById('anamnese-paciente-id').value = id;

    // Load existing or reset
    const fields = ['peso', 'altura', 'atividade', 'doencas', 'cirurgias', 'medicamentos', 'alergias', 'praticas', 'objetivos', 'limitacoes', 'postura', 'postura-obs', 'dor-intensidade', 'dor-local', 'amplitude', 'forca', 'obs-gerais'];
    fields.forEach(f => {
      const el = document.getElementById('anamnese-' + f);
      if (el) el.value = existing ? (existing[f] || '') : '';
    });

    openModal('modal-anamnese');
  },

  saveAnamnese() {
    const pacienteId = document.getElementById('anamnese-paciente-id').value;
    if (!pacienteId) return;

    const data = {};
    const fields = ['peso', 'altura', 'atividade', 'doencas', 'cirurgias', 'medicamentos', 'alergias', 'praticas', 'objetivos', 'limitacoes', 'postura', 'postura-obs', 'dor-intensidade', 'dor-local', 'amplitude', 'forca', 'obs-gerais'];
    fields.forEach(f => {
      const el = document.getElementById('anamnese-' + f);
      data[f] = el ? el.value.trim() : '';
    });

    const anamneses = cache.getOr('anamneses', []);
    const idx = anamneses.findIndex(a => a.pacienteId === pacienteId);
    const record = { pacienteId, ...data, atualizadoEm: new Date().toISOString(), profissional: auth.getUser()?.nome || 'Sistema' };

    if (idx !== -1) {
      anamneses[idx] = { ...anamneses[idx], ...record };
    } else {
      record.criadoEm = new Date().toISOString();
      anamneses.push(record);
    }

    cache.set('anamneses', anamneses);
    closeModal('modal-anamnese');
    this.render();
    showToast(idx !== -1 ? 'Anamnese atualizada!' : 'Anamnese salva com sucesso!');
  }
};

window.pacientesModule = Pacientes;
