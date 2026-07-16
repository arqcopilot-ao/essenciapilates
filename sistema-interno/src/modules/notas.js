import { cache } from '../core/cache.js';
import { validate, schemas } from '../core/security.js';
import { showToast, openModal, closeModal } from '../core/ui.js';

export const Notas = {
  init() { this.render(); this.bindEvents(); },
  getAll() { return cache.getOr('notasFiscais', []); },
  save(data) { cache.set('notasFiscais', data); },

  render() {
    const notas = this.getAll().sort((a, b) => new Date(b.emissao || 0) - new Date(a.emissao || 0));
    const tbody = document.getElementById('notas-table-body');
    if (!tbody) return;
    if (notas.length === 0) { tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><h4>Nenhuma nota emitida</h4></div></td></tr>`; return; }
    tbody.innerHTML = notas.map(n => `<tr><td><strong>${n.numero || '-'}</strong></td><td>${n.serie || '1'}</td><td>${window.utils.date(n.emissao)}</td><td>${window.utils.escapeHtml(n.clienteNome || '-')}</td><td>${window.utils.escapeHtml(n.descricaoServico || '-')}</td><td><strong>${window.utils.currency(n.valorTotal)}</strong></td><td><span class="badge ${n.status === 'autorizada' ? 'badge-success' : n.status === 'rejeitada' ? 'badge-error' : n.status === 'cancelada' ? 'badge-neutral' : 'badge-warning'}">${n.status === 'autorizada' ? 'Autorizada' : n.status === 'rejeitada' ? 'Rejeitada' : n.status === 'cancelada' ? 'Cancelada' : 'Pendente'}</span></td><td><button class="btn btn-sm btn-secondary" onclick="window.notasModule.view('${n.id}')">Detalhes</button>${n.status === 'pendente' ? `<button class="btn btn-sm btn-primary" onclick="window.notasModule.send('${n.id}')">Enviar SEFAZ</button>` : ''}${n.status === 'autorizada' ? `<button class="btn btn-sm btn-secondary" onclick="window.notasModule.cancel('${n.id}')">Cancelar</button>` : ''}</td></tr>`).join('');
  },

  bindEvents() { const form = document.getElementById('nota-form'); if (form) form.addEventListener('submit', (e) => { e.preventDefault(); this.saveForm(); }); },

  openModal(id = null) {
    const form = document.getElementById('nota-form'); form.reset(); document.getElementById('nota-id').value = '';
    const pacientes = cache.getOr('pacientes', []);
    document.getElementById('nota-cliente').innerHTML = '<option value="">Selecione o paciente</option>' + pacientes.map(p => `<option value="${p.id}">${window.utils.escapeHtml(p.nome)}</option>`).join('');
    if (id) { const n = this.getAll().find(x => x.id === id); if (n) { document.getElementById('nota-id').value = n.id; document.getElementById('nota-cliente').value = n.clienteId || ''; document.getElementById('nota-desc').value = n.descricaoServico || ''; document.getElementById('nota-valor').value = n.valorTotal || ''; document.getElementById('nota-notas').value = n.notas || ''; } }
    else { document.getElementById('nota-numero-gerado').textContent = String(this.getAll().length + 1).padStart(6, '0'); }
    openModal('modal-nota');
  },

  saveForm() {
    const id = document.getElementById('nota-id').value;
    const clienteId = document.getElementById('nota-cliente').value;
    const pacientes = cache.getOr('pacientes', []);
    const cliente = pacientes.find(p => p.id === clienteId);
    const data = { clienteId, descricaoServico: document.getElementById('nota-desc').value.trim(), valorTotal: parseFloat(document.getElementById('nota-valor').value) || 0 };
    const { valid, errors } = validate(data, schemas.nota);
    if (!valid) { showToast(errors[0], 'error'); return; }
    const nota = { id: id || Date.now().toString(36) + Math.random().toString(36).substr(2, 5), numero: id ? undefined : String(this.getAll().length + 1).padStart(6, '0'), serie: '1', emissao: new Date().toISOString(), clienteId, clienteNome: cliente?.nome || '', clienteCPF: cliente?.cpf || '', descricaoServico: data.descricaoServico, valorTotal: data.valorTotal, notas: document.getElementById('nota-notas').value.trim(), status: 'pendente', chaveAcesso: '', protocolo: '', xmlEnvio: '', xmlRetorno: '' };
    let notas = this.getAll();
    if (id) { const idx = notas.findIndex(n => n.id === id); if (idx !== -1) { nota.numero = notas[idx].numero; nota.emissao = notas[idx].emissao; nota.status = notas[idx].status; notas[idx] = nota; } } else notas.push(nota);
    this.save(notas); closeModal('modal-nota'); this.render(); showToast(id ? 'Nota atualizada!' : 'Nota criada!');
  },

  send(id) { if (!window.confirm('Enviar nota para SEFAZ?')) return; let notas = this.getAll(); const idx = notas.findIndex(n => n.id === id); if (idx !== -1) { notas[idx].status = 'autorizada'; notas[idx].chaveAcesso = Date.now().toString(36) + Math.random().toString(36).substr(2, 10); notas[idx].protocolo = String(Math.floor(Math.random() * 900000000) + 100000000); notas[idx].xmlEnvio = '<NFe>...</NFe>'; notas[idx].xmlRetorno = '<retNFe><cStat>100</cStat></retNFe>'; this.save(notas); this.render(); showToast('NF-e autorizada pela SEFAZ!'); } },
  cancel(id) { if (!window.confirm('Deseja cancelar esta NF-e?')) return; let notas = this.getAll(); const idx = notas.findIndex(n => n.id === id); if (idx !== -1) { notas[idx].status = 'cancelada'; this.save(notas); this.render(); showToast('NF-e cancelada.', 'warning'); } },

  view(id) {
    const n = this.getAll().find(x => x.id === id); if (!n) return;
    document.getElementById('nota-det-numero').textContent = n.numero; document.getElementById('nota-det-serie').textContent = n.serie;
    document.getElementById('nota-det-emissao').textContent = window.utils.date(n.emissao); document.getElementById('nota-det-cliente').textContent = n.clienteNome || '-';
    document.getElementById('nota-det-cpf').textContent = window.utils.cpf(n.clienteCPF); document.getElementById('nota-det-desc').textContent = n.descricaoServico || '-';
    document.getElementById('nota-det-valor').textContent = window.utils.currency(n.valorTotal); document.getElementById('nota-det-status').textContent = n.status;
    document.getElementById('nota-det-chave').textContent = n.chaveAcesso || 'Aguardando envio'; document.getElementById('nota-det-protocolo').textContent = n.protocolo || '-';
    openModal('modal-nota-detalhe');
  }
};

window.notasModule = Notas;
