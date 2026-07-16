import { cache } from '../core/cache.js';
import { escapeHtml } from '../core/security.js';

let calendarYear = new Date().getFullYear();
let calendarMonth = new Date().getMonth();

export const Dashboard = {
  chartPacientes: null,
  chartFinanceiro: null,

  init() {
    this.renderStats();
    this.renderAlerts();
    this.renderCharts();
    this.renderCalendar();
    this.renderDailySchedule();
  },

  renderStats() {
    const pacientes = cache.getOr('pacientes', []);
    const pagamentos = cache.getOr('pagamentos', []);
    const today = new Date().toISOString().split('T')[0];
    const ativos = pacientes.filter(p => p.status === 'ativo').length;
    const receitaMes = pagamentos.filter(p => p.data && p.data.startsWith(today.substring(0, 7)) && p.status === 'pago').reduce((sum, p) => sum + (p.valor || 0), 0);
    const sessoesHoje = (cache.getOr('agendamentos', [])).filter(a => a.data === today).length;
    const proximosPag = pagamentos.filter(p => p.status === 'pendente' && p.dataVencimento).filter(p => { const days = Math.ceil((new Date(p.dataVencimento) - new Date()) / (1000 * 60 * 60 * 24)); return days <= 7 && days >= 0; }).length;

    document.getElementById('stat-pacientes').textContent = ativos;
    document.getElementById('stat-receita').textContent = window.utils.currency(receitaMes);
    document.getElementById('stat-sessoes').textContent = sessoesHoje;
    document.getElementById('stat-pagamentos').textContent = proximosPag;
  },

  renderAlerts() {
    const pagamentos = cache.getOr('pagamentos', []);
    const container = document.getElementById('dashboard-alerts');
    if (!container) return;
    const pendentes = pagamentos.filter(p => p.status === 'pendente' && p.dataVencimento);
    const vencidos = pendentes.filter(p => Math.ceil((new Date(p.dataVencimento) - new Date()) / (1000 * 60 * 60 * 24)) < 0);
    const proximos = pendentes.filter(p => { const d = Math.ceil((new Date(p.dataVencimento) - new Date()) / (1000 * 60 * 60 * 24)); return d >= 0 && d <= 7; });
    let html = '';
    if (vencidos.length > 0) html += `<div class="alert alert-error"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>${escapeHtml(String(vencidos.length))} pagamento(s) vencido(s). Ação urgente necessária.</div>`;
    if (proximos.length > 0) html += `<div class="alert alert-warning"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>${escapeHtml(String(proximos.length))} pagamento(s) vencendo nos próximos 7 dias.</div>`;
    container.innerHTML = html;
  },

  /* ============================================
     MINI CALENDAR
     ============================================ */
  calendarPrev() {
    calendarMonth--;
    if (calendarMonth < 0) { calendarMonth = 11; calendarYear--; }
    this.renderCalendar();
  },

  calendarNext() {
    calendarMonth++;
    if (calendarMonth > 11) { calendarMonth = 0; calendarYear++; }
    this.renderCalendar();
  },

  calendarToday() {
    const now = new Date();
    calendarYear = now.getFullYear();
    calendarMonth = now.getMonth();
    this.renderCalendar();
  },

  renderCalendar() {
    const container = document.getElementById('dashboard-calendar');
    const titleEl = document.getElementById('dashboard-calendar-title');
    if (!container) return;

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    titleEl.textContent = `${monthNames[calendarMonth]} ${calendarYear}`;

    const agendamentos = cache.getOr('agendamentos', []);
    const firstDay = new Date(calendarYear, calendarMonth, 1);
    const lastDay = new Date(calendarYear, calendarMonth + 1, 0);
    const startDow = (firstDay.getDay() + 6) % 7; // Monday=0
    const daysInMonth = lastDay.getDate();

    const dayLabels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    let html = `<div class="cal-header">${dayLabels.map(d => `<div class="cal-day-label">${d}</div>`).join('')}</div><div class="cal-body">`;

    // Empty cells before first day
    for (let i = 0; i < startDow; i++) html += '<div class="cal-cell cal-empty"></div>';

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayCount = agendamentos.filter(a => a.data === dateStr && a.status !== 'cancelado').length;
      const isToday = dateStr === todayStr;
      const cls = ['cal-cell'];
      if (isToday) cls.push('cal-today');
      if (dayCount > 0) cls.push('cal-has-events');

      html += `<div class="${cls.join(' ')}" onclick="window.dashboardModule.calendarDayClick('${dateStr}')">
        <span class="cal-day-num">${day}</span>
        ${dayCount > 0 ? `<span class="cal-day-count">${dayCount}</span>` : ''}
      </div>`;
    }

    html += '</div>';
    container.innerHTML = html;
  },

  calendarDayClick(dateStr) {
    // Navigate to agenda page with this date
    window.location.hash = '';
    // Dispatch a custom event to navigate
    document.dispatchEvent(new CustomEvent('app-navigate', { detail: { page: 'agenda', date: dateStr } }));
  },

  /* ============================================
     DAILY SCHEDULE
     ============================================ */
  renderDailySchedule() {
    const container = document.getElementById('dashboard-schedule');
    const countEl = document.getElementById('dashboard-schedule-count');
    if (!container) return;

    const today = new Date().toISOString().split('T')[0];
    const agendamentos = cache.getOr('agendamentos', []);
    const pacientes = cache.getOr('pacientes', []);
    const todayApps = agendamentos
      .filter(a => a.data === today && a.status !== 'cancelado')
      .sort((a, b) => (a.hora || '').localeCompare(b.hora || ''));

    if (countEl) countEl.textContent = todayApps.length;

    if (todayApps.length === 0) {
      container.innerHTML = `<div class="empty-state" style="padding:32px 16px"><svg viewBox="0 0 24 24" fill="currentColor" style="width:40px;height:40px;opacity:0.3"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/></svg><p>Nenhum agendamento para hoje.</p></div>`;
      return;
    }

    const tipoIcons = {
      pilates: '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><circle cx="12" cy="5" r="2.5"/><path d="M19 13v-2c-1.54.02-3.09-.75-4.07-1.83l-1.29-1.43c-.17-.19-.38-.34-.61-.45-.01 0-.01-.01-.02-.01H13c-.35-.2-.75-.3-1.19-.26C10.76 7.11 10 8.04 10 9.09V15c0 1.1.9 2 2 2h5v5h2v-5.5c0-1.1-.9-2-2-2h-3v-3.45c1.29 1.07 3.25 1.94 5 1.95zm-6.17 5c-.41 1.16-1.52 2-2.83 2-1.66 0-3-1.34-3-3 0-1.31.84-2.41 2-2.83V12.1c-2.28.46-4 2.48-4 4.9 0 2.76 2.24 5 5 5 2.42 0 4.44-1.72 4.9-4h-2.07z"/></svg>',
      fisioterapia: '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M19 3H5c-1.1 0-1.99.9-1.99 2L3 19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z"/></svg>',
      avaliacao: '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>',
      reabilitacao: '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/></svg>'
    };
    const tipoLabels = { pilates: 'Pilates', fisioterapia: 'Fisioterapia', avaliacao: 'Avaliação', reabilitacao: 'Reabilitação' };
    const statusColors = { agendado: 'badge-info', confirmado: 'badge-success', cancelado: 'badge-error' };

    container.innerHTML = todayApps.map(a => {
      const paciente = pacientes.find(p => p.id === a.pacienteId);
      const nome = paciente ? paciente.nome : 'Paciente removido';
      const initials = nome.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
      const icon = tipoIcons[a.tipo] || tipoIcons.pilates;
      const tipoLabel = tipoLabels[a.tipo] || a.tipo;
      const statusCls = statusColors[a.status] || 'badge-info';
      const statusLabel = a.status === 'confirmado' ? 'Confirmado' : a.status === 'cancelado' ? 'Cancelado' : 'Agendado';

      return `<div class="schedule-item">
        <div class="schedule-time">${escapeHtml(a.hora || '--:--')}</div>
        <div class="schedule-avatar">${escapeHtml(initials)}</div>
        <div class="schedule-info">
          <div class="schedule-name">${escapeHtml(nome)}</div>
          <div class="schedule-type">${icon} ${tipoLabel}</div>
        </div>
        <span class="badge badge-sm ${statusCls}">${statusLabel}</span>
      </div>`;
    }).join('');
  },

  renderCharts() {
    if (!window.Chart) return;
    const pacientes = cache.getOr('pacientes', []);
    const now = new Date();
    const meses = [], counts = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toISOString().substring(0, 7);
      meses.push(d.toLocaleDateString('pt-BR', { month: 'short' }));
      counts.push(pacientes.filter(p => p.criadoEm && p.criadoEm.startsWith(key)).length);
    }
    const ctx1 = document.getElementById('chart-pacientes');
    if (ctx1) {
      if (this.chartPacientes) this.chartPacientes.destroy();
      this.chartPacientes = new window.Chart(ctx1, { type: 'bar', data: { labels: meses, datasets: [{ label: 'Novos Pacientes', data: counts, backgroundColor: 'rgba(112, 181, 186, 0.7)', borderColor: 'rgba(112, 181, 186, 1)', borderWidth: 1, borderRadius: 6 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } } });
    }
    const pagamentos = cache.getOr('pagamentos', []);
    const receitas = [], despesas = [], mesesFin = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toISOString().substring(0, 7);
      mesesFin.push(d.toLocaleDateString('pt-BR', { month: 'short' }));
      receitas.push(pagamentos.filter(p => p.tipo === 'receita' && p.data && p.data.startsWith(key) && p.status === 'pago').reduce((s, p) => s + (p.valor || 0), 0));
      despesas.push(pagamentos.filter(p => p.tipo === 'despesa' && p.data && p.data.startsWith(key) && p.status === 'pago').reduce((s, p) => s + (p.valor || 0), 0));
    }
    const ctx2 = document.getElementById('chart-financeiro');
    if (ctx2) {
      if (this.chartFinanceiro) this.chartFinanceiro.destroy();
      this.chartFinanceiro = new window.Chart(ctx2, { type: 'line', data: { labels: mesesFin, datasets: [{ label: 'Receitas', data: receitas, borderColor: 'rgba(52, 199, 89, 1)', backgroundColor: 'rgba(52, 199, 89, 0.1)', fill: true, tension: 0.4 }, { label: 'Despesas', data: despesas, borderColor: 'rgba(255, 59, 48, 1)', backgroundColor: 'rgba(255, 59, 48, 0.1)', fill: true, tension: 0.4 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true } } } });
    }
  }
};

window.dashboardModule = Dashboard;
