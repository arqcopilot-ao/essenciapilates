import { cache } from '../core/cache.js';
import { validate, schemas } from '../core/security.js';
import { showToast, openModal, closeModal } from '../core/ui.js';

let filterTipo = 'todos';
let filterStatus = 'todos';

export const Financeiro = {
  init() { this.render(); this.bindEvents(); },
  getAll() { return cache.getOr('pagamentos', []); },
  save(data) { cache.set('pagamentos', data); },

  render() {
    const pagamentos = this.getAll();
    const filtered = pagamentos.filter(p => { if (filterTipo !== 'todos' && p.tipo !== filterTipo) return false; if (filterStatus !== 'todos' && p.status !== filterStatus) return false; return true; }).sort((a, b) => new Date(b.dataVencimento || 0) - new Date(a.dataVencimento || 0));
    const receitas = pagamentos.filter(p => p.tipo === 'receita' && p.status === 'pago').reduce((s, p) => s + (p.valor || 0), 0);
    const despesas = pagamentos.filter(p => p.tipo === 'despesa' && p.status === 'pago').reduce((s, p) => s + (p.valor || 0), 0);
    const pendentes = pagamentos.filter(p => p.status === 'pendente').reduce((s, p) => s + (p.valor || 0), 0);

    document.getElementById('fin-receitas').textContent = window.utils.currency(receitas);
    document.getElementById('fin-despesas').textContent = window.utils.currency(despesas);
    document.getElementById('fin-balance').textContent = window.utils.currency(receitas - despesas);
    document.getElementById('fin-pendentes').textContent = window.utils.currency(pendentes);

    const tbody = document.getElementById('financeiro-table-body');
    if (!tbody) return;
    if (filtered.length === 0) { tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><h4>Nenhum lançamento encontrado</h4></div></td></tr>`; return; }
    tbody.innerHTML = filtered.map(p => `<tr><td>${window.utils.date(p.data)}</td><td><span class="badge ${p.tipo === 'receita' ? 'badge-success' : 'badge-error'}">${p.tipo === 'receita' ? 'Receita' : 'Despesa'}</span></td><td>${window.utils.escapeHtml(p.descricao || '-')}</td><td>${window.utils.escapeHtml(p.categoria || '-')}</td><td><strong>${window.utils.currency(p.valor)}</strong></td><td><span class="badge ${p.status === 'pago' ? 'badge-success' : p.status === 'pendente' ? 'badge-warning' : 'badge-neutral'}">${p.status === 'pago' ? 'Pago' : p.status === 'pendente' ? 'Pendente' : 'Cancelado'}</span></td><td><button class="btn btn-sm btn-secondary" onclick="window.financeiroModule.edit('${p.id}')">Editar</button>${p.status === 'pendente' ? `<button class="btn btn-sm btn-primary" onclick="window.financeiroModule.markPaid('${p.id}')">Baixar</button>` : ''}<button class="btn btn-sm btn-danger" onclick="window.financeiroModule.remove('${p.id}')">Excluir</button></td></tr>`).join('');
  },

  bindEvents() { const form = document.getElementById('pagamento-form'); if (form) form.addEventListener('submit', (e) => { e.preventDefault(); this.saveForm(); }); },

  openModal(id = null) {
    const form = document.getElementById('pagamento-form'); form.reset(); document.getElementById('pagamento-id').value = '';
    if (id) { const p = this.getAll().find(x => x.id === id); if (p) { document.getElementById('pagamento-id').value = p.id; document.getElementById('pagamento-tipo').value = p.tipo; document.getElementById('pagamento-desc').value = p.descricao || ''; document.getElementById('pagamento-categoria').value = p.categoria || ''; document.getElementById('pagamento-valor').value = p.valor || ''; document.getElementById('pagamento-data').value = p.data || ''; document.getElementById('pagamento-vencimento').value = p.dataVencimento || ''; document.getElementById('pagamento-status').value = p.status; document.getElementById('pagamento-notas').value = p.notas || ''; } }
    else { document.getElementById('pagamento-data').value = new Date().toISOString().split('T')[0]; }
    openModal('modal-pagamento');
  },

  saveForm() {
    const id = document.getElementById('pagamento-id').value;
    const data = { tipo: document.getElementById('pagamento-tipo').value, descricao: document.getElementById('pagamento-desc').value.trim(), categoria: document.getElementById('pagamento-categoria').value, valor: parseFloat(document.getElementById('pagamento-valor').value) || 0, data: document.getElementById('pagamento-data').value, dataVencimento: document.getElementById('pagamento-vencimento').value, status: document.getElementById('pagamento-status').value, notas: document.getElementById('pagamento-notas').value.trim() };
    const { valid, errors } = validate(data, schemas.pagamento);
    if (!valid) { showToast(errors[0], 'error'); return; }
    const pagamento = { id: id || Date.now().toString(36) + Math.random().toString(36).substr(2, 5), ...data };
    let pagamentos = this.getAll();
    if (id) { const idx = pagamentos.findIndex(p => p.id === id); if (idx !== -1) pagamentos[idx] = pagamento; } else pagamentos.push(pagamento);
    this.save(pagamentos); closeModal('modal-pagamento'); this.render(); showToast(id ? 'Lançamento atualizado!' : 'Lançamento criado!');
  },

  edit(id) { this.openModal(id); },
  markPaid(id) { let pagamentos = this.getAll(); const idx = pagamentos.findIndex(p => p.id === id); if (idx !== -1) { pagamentos[idx].status = 'pago'; pagamentos[idx].dataPagamento = new Date().toISOString(); this.save(pagamentos); this.render(); showToast('Pagamento baixado!'); } },
  remove(id) { if (!window.confirm('Deseja excluir este lançamento?')) return; this.save(this.getAll().filter(p => p.id !== id)); this.render(); showToast('Lançamento excluído!', 'warning'); },
  filterTipoFn(tipo) { filterTipo = tipo; this.render(); },
  filterByStatus(status) { filterStatus = status; this.render(); }
};

window.financeiroModule = Financeiro;
