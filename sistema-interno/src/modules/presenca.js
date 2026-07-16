import { cache } from '../core/cache.js';
import { showToast } from '../core/ui.js';
import { auth } from '../core/auth.js';

let currentDate = new Date().toISOString().split('T')[0];

export const Presenca = {
  init() { this.render(); this.bindEvents(); },
  getAll() { return cache.getOr('presencas', []); },
  save(data) { cache.set('presencas', data); },

  render() {
    document.getElementById('presenca-data').value = currentDate;
    const presencas = this.getAll().filter(p => p.data === currentDate);
    const agendamentos = (cache.getOr('agendamentos', [])).filter(a => a.data === currentDate);
    const pacientes = cache.getOr('pacientes', []);
    const total = agendamentos.length; const presentes = presencas.filter(p => p.presente).length;
    document.getElementById('presenca-total').textContent = total;
    document.getElementById('presenca-presentes').textContent = presentes;
    document.getElementById('presenca-ausentes').textContent = total - presentes;
    const tbody = document.getElementById('presenca-table-body'); if (!tbody) return;
    if (agendamentos.length === 0) { tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state"><h4>Nenhum agendamento para esta data</h4></div></td></tr>`; return; }
    tbody.innerHTML = agendamentos.map(a => {
      const pac = pacientes.find(p => p.id === a.pacienteId);
      const presenca = presencas.find(p => p.agendamentoId === a.id);
      const presente = presenca ? presenca.presente : false;
      return `<tr><td>${a.hora || '-'}</td><td><strong>${window.utils.escapeHtml(pac?.nome || '-')}</strong></td><td>${a.tipo || '-'}</td><td><button class="btn btn-sm ${presente ? 'btn-primary' : 'btn-secondary'}" onclick="window.presencaModule.mark('${a.id}', true)">Presente</button> <button class="btn btn-sm ${!presente && presenca ? 'btn-danger' : 'btn-secondary'}" onclick="window.presencaModule.mark('${a.id}', false)">Ausente</button></td><td>${presenca ? (presenca.presente ? '<span class="badge badge-success">Presente</span>' : '<span class="badge badge-error">Ausente</span>') : '<span class="badge badge-neutral">Não registrado</span>'}</td></tr>`;
    }).join('');
  },

  bindEvents() { const dateInput = document.getElementById('presenca-data'); if (dateInput) dateInput.addEventListener('change', (e) => { currentDate = e.target.value; this.render(); }); },

  mark(agendamentoId, presente) {
    let presencas = this.getAll();
    const idx = presencas.findIndex(p => p.agendamentoId === agendamentoId && p.data === currentDate);
    if (idx !== -1) { presencas[idx].presente = presente; presencas[idx].registroEm = new Date().toISOString(); }
    else { presencas.push({ id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5), agendamentoId, data: currentDate, presente, registroEm: new Date().toISOString(), registradoPor: auth.getUser()?.nome || 'Sistema' }); }
    this.save(presencas); this.render(); showToast(presente ? 'Presença registrada!' : 'Ausência registrada!', presente ? 'success' : 'warning');
  },

  changeDate(dir) { const d = new Date(currentDate); d.setDate(d.getDate() + dir); currentDate = d.toISOString().split('T')[0]; this.render(); }
};

window.presencaModule = Presenca;
