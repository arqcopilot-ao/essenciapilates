/* ============================================
   AGENDA - Schedule management (Google Calendar ready)
   ============================================ */
const Agenda = {
    currentDate: new Date(),
    viewMode: 'week',

    init() {
        this.render();
        this.bindEvents();
    },

    getAll() {
        return Utils.load('agendamentos') || [];
    },

    save(data) {
        Utils.save('agendamentos', data);
    },

    render() {
        this.renderHeader();
        this.renderCalendar();
    },

    renderHeader() {
        const d = this.currentDate;
        const opts = { month: 'long', year: 'numeric' };
        if (this.viewMode === 'week') {
            const start = this.getWeekStart(d);
            const end = new Date(start);
            end.setDate(end.getDate() + 6);
            document.getElementById('agenda-periodo').textContent =
                `${Utils.date(start)} — ${Utils.date(end)}`;
        } else {
            document.getElementById('agenda-periodo').textContent =
                d.toLocaleDateString('pt-BR', opts);
        }
    },

    getWeekStart(d) {
        const date = new Date(d);
        const day = date.getDay();
        date.setDate(date.getDate() - (day === 0 ? 6 : day - 1));
        date.setHours(0, 0, 0, 0);
        return date;
    },

    renderCalendar() {
        const container = document.getElementById('agenda-grid');
        if (!container) return;

        const agendamentos = this.getAll();
        const start = this.getWeekStart(this.currentDate);
        const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
        const hours = [];
        for (let h = 7; h <= 19; h++) hours.push(h);

        let html = '<div class="agenda-week">';
        // Header
        html += '<div class="agenda-header-row"><div class="agenda-time-col"></div>';
        for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(d.getDate() + i);
            const isToday = d.toISOString().split('T')[0] === Utils.today();
            html += `<div class="agenda-day-col ${isToday ? 'today' : ''}">
                <span class="day-name">${days[i]}</span>
                <span class="day-num">${d.getDate()}</span>
            </div>`;
        }
        html += '</div>';

        // Time slots
        for (const hour of hours) {
            html += `<div class="agenda-row"><div class="agenda-time">${String(hour).padStart(2, '0')}:00</div>`;
            for (let i = 0; i < 7; i++) {
                const d = new Date(start);
                d.setDate(d.getDate() + i);
                const dateStr = d.toISOString().split('T')[0];
                const slotAgendamentos = agendamentos.filter(a =>
                    a.data === dateStr && parseInt(a.hora) === hour
                );
                html += `<div class="agenda-cell" onclick="Agenda.openModal('${dateStr}', ${hour})">`;
                slotAgendamentos.forEach(a => {
                    const paciente = (Utils.load('pacientes') || []).find(p => p.id === a.pacienteId);
                    html += `<div class="agenda-event ${a.status === 'confirmado' ? 'confirmed' : a.status === 'cancelado' ? 'cancelled' : ''}" onclick="event.stopPropagation(); Agenda.viewDetail('${a.id}')">
                        <span class="event-time">${a.hora}:00</span>
                        <span class="event-name">${paciente ? paciente.nome : a.pacienteNome || 'Livre'}</span>
                    </div>`;
                });
                html += '</div>';
            }
            html += '</div>';
        }

        html += '</div>';
        container.innerHTML = html;
    },

    bindEvents() {
        const form = document.getElementById('agendamento-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveForm();
            });
        }
    },

    navigate(dir) {
        if (this.viewMode === 'week') {
            this.currentDate.setDate(this.currentDate.getDate() + (dir * 7));
        } else {
            this.currentDate.setMonth(this.currentDate.getMonth() + dir);
        }
        this.render();
    },

    setView(mode) {
        this.viewMode = mode;
        this.render();
    },

    openModal(date = null, hora = null) {
        const modal = document.getElementById('modal-agendamento');
        const form = document.getElementById('agendamento-form');
        form.reset();
        document.getElementById('agendamento-id').value = '';

        // Populate patient dropdown
        const pacientes = Utils.load('pacientes') || [];
        document.getElementById('agendamento-paciente').innerHTML =
            '<option value="">Selecione o paciente</option>' +
            pacientes.filter(p => p.status === 'ativo').map(p =>
                `<option value="${p.id}">${p.nome}</option>`
            ).join('');

        if (date) document.getElementById('agendamento-data').value = date;
        if (hora !== null) document.getElementById('agendamento-hora').value = String(hora).padStart(2, '0') + ':00';

        modal.classList.add('active');
    },

    closeModal(id) {
        document.getElementById(id).classList.remove('active');
    },

    saveForm() {
        const id = document.getElementById('agendamento-id').value;
        const pacienteId = document.getElementById('agendamento-paciente').value;

        const dados = {
            id: id || Utils.id(),
            pacienteId: pacienteId,
            data: document.getElementById('agendamento-data').value,
            hora: document.getElementById('agendamento-hora').value,
            tipo: document.getElementById('agendamento-tipo').value,
            observacoes: document.getElementById('agendamento-obs').value,
            status: document.getElementById('agendamento-status').value,
            // Google Calendar integration fields
            googleEventId: ''
        };

        let agendamentos = this.getAll();
        if (id) {
            const idx = agendamentos.findIndex(a => a.id === id);
            if (idx !== -1) agendamentos[idx] = dados;
        } else {
            agendamentos.push(dados);
        }

        this.save(agendamentos);
        this.closeModal('modal-agendamento');
        this.render();
        Utils.toast(id ? 'Agendamento atualizado!' : 'Agendamento criado!');
    },

    viewDetail(id) {
        const a = this.getAll().find(x => x.id === id);
        if (!a) return;
        const paciente = (Utils.load('pacientes') || []).find(p => p.id === a.pacienteId);

        const modal = document.getElementById('modal-agendamento-detalhe');
        document.getElementById('ag-det-paciente').textContent = paciente ? paciente.nome : '-';
        document.getElementById('ag-det-data').textContent = Utils.date(a.data);
        document.getElementById('ag-det-hora').textContent = a.hora;
        document.getElementById('ag-det-tipo').textContent = a.tipo || '-';
        document.getElementById('ag-det-obs').textContent = a.observacoes || '-';
        document.getElementById('ag-det-status').textContent = a.status;

        document.getElementById('btn-ag-confirmar').onclick = () => this.updateStatus(id, 'confirmado');
        document.getElementById('btn-ag-cancelar').onclick = () => this.updateStatus(id, 'cancelado');

        modal.classList.add('active');
    },

    updateStatus(id, status) {
        let agendamentos = this.getAll();
        const idx = agendamentos.findIndex(a => a.id === id);
        if (idx !== -1) {
            agendamentos[idx].status = status;
            this.save(agendamentos);
            this.closeModal('modal-agendamento-detalhe');
            this.render();
            Utils.toast(`Agendamento ${status === 'confirmado' ? 'confirmado' : 'cancelado'}!`);
        }
    },

    remove(id) {
        if (!Utils.confirm('Deseja excluir este agendamento?')) return;
        this.save(this.getAll().filter(a => a.id !== id));
        this.render();
        Utils.toast('Agendamento excluído!', 'warning');
    }
};
