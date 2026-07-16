/* ============================================
   PRESENÇA - Attendance tracking
   ============================================ */
const Presenca = {
    currentDate: Utils.today(),

    init() {
        this.render();
        this.bindEvents();
    },

    getAll() {
        return Utils.load('presencas') || [];
    },

    save(data) {
        Utils.save('presencas', data);
    },

    render() {
        document.getElementById('presenca-data').value = this.currentDate;

        const presencas = this.getAll().filter(p => p.data === this.currentDate);
        const agendamentos = (Utils.load('agendamentos') || []).filter(a => a.data === this.currentDate);
        const pacientes = Utils.load('pacientes') || [];

        // Stats
        const total = agendamentos.length;
        const presentes = presencas.filter(p => p.presente).length;
        const ausentes = total - presentes;

        document.getElementById('presenca-total').textContent = total;
        document.getElementById('presenca-presentes').textContent = presentes;
        document.getElementById('presenca-ausentes').textContent = ausentes;

        const tbody = document.getElementById('presenca-table-body');
        if (!tbody) return;

        if (agendamentos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state">
                <h4>Nenhum agendamento para esta data</h4>
                <p>Agende aulas na Agenda para controlar presença.</p>
            </div></td></tr>`;
            return;
        }

        tbody.innerHTML = agendamentos.map(a => {
            const paciente = pacientes.find(p => p.id === a.pacienteId);
            const presenca = presencas.find(p => p.agendamentoId === a.id);
            const presente = presenca ? presenca.presente : false;

            return `<tr>
                <td>${a.hora || '-'}</td>
                <td><strong>${paciente ? paciente.nome : '-'}</strong></td>
                <td>${a.tipo || '-'}</td>
                <td>
                    <button class="btn btn-sm ${presente ? 'btn-primary' : 'btn-secondary'}" onclick="Presenca.mark('${a.id}', true)">
                        Presente
                    </button>
                    <button class="btn btn-sm ${!presente && presenca ? 'btn-danger' : 'btn-secondary'}" onclick="Presenca.mark('${a.id}', false)">
                        Ausente
                    </button>
                </td>
                <td>${presenca ? (presenca.presente ? '<span class="badge badge-success">Presente</span>' : '<span class="badge badge-error">Ausente</span>') : '<span class="badge badge-neutral">Não registrado</span>'}</td>
            </tr>`;
        }).join('');
    },

    bindEvents() {
        const dateInput = document.getElementById('presenca-data');
        if (dateInput) {
            dateInput.addEventListener('change', (e) => {
                this.currentDate = e.target.value;
                this.render();
            });
        }
    },

    mark(agendamentoId, presente) {
        let presencas = this.getAll();
        const idx = presencas.findIndex(p => p.agendamentoId === agendamentoId && p.data === this.currentDate);

        if (idx !== -1) {
            presencas[idx].presente = presente;
            presencas[idx].registroEm = new Date().toISOString();
        } else {
            presencas.push({
                id: Utils.id(),
                agendamentoId: agendamentoId,
                data: this.currentDate,
                presente: presente,
                registroEm: new Date().toISOString(),
                registradoPor: App.currentUser ? App.currentUser.nome : 'Sistema'
            });
        }

        this.save(presencas);
        this.render();
        Utils.toast(presente ? 'Presença registrada!' : 'Ausência registrada!', presente ? 'success' : 'warning');
    },

    changeDate(dir) {
        const d = new Date(this.currentDate);
        d.setDate(d.getDate() + dir);
        this.currentDate = d.toISOString().split('T')[0];
        this.render();
    }
};
