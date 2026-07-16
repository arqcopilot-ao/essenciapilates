import { cache } from '../core/cache.js';
import { escapeHtml, validate, schemas } from '../core/security.js';
import { showToast, openModal, closeModal } from '../core/ui.js';

let currentDate = new Date();
let viewMode = 'week';

export const Agenda = {
  init() { this.render(); this.bindEvents(); },
  getAll() { return cache.getOr('agendamentos', []); },
  save(data) { cache.set('agendamentos', data); },

  render() { this.renderHeader(); this.renderCalendar(); },

  renderHeader() {
    if (viewMode === 'week') {
      const start = this.getWeekStart(currentDate); const end = new Date(start); end.setDate(end.getDate() + 6);
      document.getElementById('agenda-periodo').textContent = `${window.utils.date(start.toISOString().split('T')[0])} — ${window.utils.date(end.toISOString().split('T')[0])}`;
    }
  },

  getWeekStart(d) { const date = new Date(d); const day = date.getDay(); date.setDate(date.getDate() - (day === 0 ? 6 : day - 1)); date.setHours(0, 0, 0, 0); return date; },

  renderCalendar() {
    const container = document.getElementById('agenda-grid'); if (!container) return;
    const agendamentos = this.getAll(); const start = this.getWeekStart(currentDate);
    const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']; const hours = []; for (let h = 7; h <= 19; h++) hours.push(h);
    const pacientes = cache.getOr('pacientes', []); const today = new Date().toISOString().split('T')[0];

    let html = '<div class="agenda-week"><div class="agenda-header-row"><div class="agenda-time-col"></div>';
    for (let i = 0; i < 7; i++) { const d = new Date(start); d.setDate(d.getDate() + i); const dateStr = d.toISOString().split('T')[0]; html += `<div class="agenda-day-col ${dateStr === today ? 'today' : ''}"><span class="day-name">${days[i]}</span><span class="day-num">${d.getDate()}</span></div>`; }
    html += '</div>';

    for (const hour of hours) {
      html += `<div class="agenda-row"><div class="agenda-time">${String(hour).padStart(2, '0')}:00</div>`;
      for (let i = 0; i < 7; i++) {
        const d = new Date(start); d.setDate(d.getDate() + i); const dateStr = d.toISOString().split('T')[0];
        const slotAg = agendamentos.filter(a => a.data === dateStr && parseInt(a.hora) === hour);
        html += `<div class="agenda-cell" onclick="window.agendaModule.openModal('${dateStr}', ${hour})">`;
        slotAg.forEach(a => { const pac = pacientes.find(p => p.id === a.pacienteId); html += `<div class="agenda-event ${a.status === 'confirmado' ? 'confirmed' : a.status === 'cancelado' ? 'cancelled' : ''}" onclick="event.stopPropagation(); window.agendaModule.viewDetail('${a.id}')"><span class="event-time">${a.hora}:00</span><span class="event-name">${escapeHtml(pac ? pac.nome : 'Livre')}</span></div>`; });
        html += '</div>';
      }
      html += '</div>';
    }
    html += '</div>'; container.innerHTML = html;
  },

  bindEvents() { const form = document.getElementById('agendamento-form'); if (form) form.addEventListener('submit', (e) => { e.preventDefault(); this.saveForm(); }); },

  navigate(dir) { if (viewMode === 'week') currentDate.setDate(currentDate.getDate() + (dir * 7)); else currentDate.setMonth(currentDate.getMonth() + dir); this.render(); },

  openModal(date = null, hora = null) {
    const form = document.getElementById('agendamento-form'); form.reset(); document.getElementById('agendamento-id').value = '';
    const pacientes = cache.getOr('pacientes', []);
    document.getElementById('agendamento-paciente').innerHTML = '<option value="">Selecione o paciente</option>' + pacientes.filter(p => p.status === 'ativo').map(p => `<option value="${p.id}">${escapeHtml(p.nome)}</option>`).join('');
    if (date) document.getElementById('agendamento-data').value = date;
    if (hora !== null) document.getElementById('agendamento-hora').value = String(hora).padStart(2, '0') + ':00';
    openModal('modal-agendamento');
  },

  saveForm() {
    const id = document.getElementById('agendamento-id').value;
    const data = { pacienteId: document.getElementById('agendamento-paciente').value, data: document.getElementById('agendamento-data').value, hora: document.getElementById('agendamento-hora').value };
    const { valid, errors } = validate(data, schemas.agendamento);
    if (!valid) { showToast(errors[0], 'error'); return; }
    const agendamento = { id: id || Date.now().toString(36) + Math.random().toString(36).substr(2, 5), ...data, tipo: document.getElementById('agendamento-tipo').value, observacoes: document.getElementById('agendamento-obs').value.trim(), status: document.getElementById('agendamento-status').value, googleEventId: '' };
    let agendamentos = this.getAll();
    if (id) { const idx = agendamentos.findIndex(a => a.id === id); if (idx !== -1) agendamentos[idx] = agendamento; } else agendamentos.push(agendamento);
    this.save(agendamentos); closeModal('modal-agendamento'); this.render(); showToast(id ? 'Agendamento atualizado!' : 'Agendamento criado!');
  },

  viewDetail(id) {
    const a = this.getAll().find(x => x.id === id); if (!a) return;
    const pac = cache.getOr('pacientes', []).find(p => p.id === a.pacienteId);
    document.getElementById('ag-det-paciente').textContent = pac?.nome || '-'; document.getElementById('ag-det-data').textContent = window.utils.date(a.data);
    document.getElementById('ag-det-hora').textContent = a.hora; document.getElementById('ag-det-tipo').textContent = a.tipo || '-';
    document.getElementById('ag-det-obs').textContent = a.observacoes || '-'; document.getElementById('ag-det-status').textContent = a.status;
    document.getElementById('btn-ag-confirmar').onclick = () => this.updateStatus(id, 'confirmado');
    document.getElementById('btn-ag-cancelar').onclick = () => this.updateStatus(id, 'cancelado');
    openModal('modal-agendamento-detalhe');
  },

  updateStatus(id, status) { let agendamentos = this.getAll(); const idx = agendamentos.findIndex(a => a.id === id); if (idx !== -1) { agendamentos[idx].status = status; this.save(agendamentos); closeModal('modal-agendamento-detalhe'); this.render(); showToast(`Agendamento ${status === 'confirmado' ? 'confirmado' : 'cancelado'}!`); } }
};

window.agendaModule = Agenda;
