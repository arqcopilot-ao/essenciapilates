/* ============================================
   PACIENTES - Patient management
   ============================================ */
const Pacientes = {
    searchQuery: '',

    init() {
        this.render();
        this.bindEvents();
    },

    getAll() {
        return Utils.load('pacientes') || [];
    },

    save(pacientes) {
        Utils.save('pacientes', pacientes);
    },

    render() {
        const pacientes = this.getAll();
        const filtered = pacientes.filter(p => Utils.matchSearch(p, this.searchQuery));
        const container = document.getElementById('pacientes-cards');
        if (!container) return;

        if (filtered.length === 0) {
            container.innerHTML = `<div class="empty-state">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                <h4>Nenhum paciente encontrado</h4>
                <p>Clique em "Novo Paciente" para cadastrar.</p>
            </div>`;
            return;
        }

        container.innerHTML = filtered.map(p => {
            const initials = p.nome.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
            const nascimento = p.nascimento ? this.calcIdade(p.nascimento) : '-';
            const historicos = Utils.load('historicos') || [];
            const histCount = historicos.filter(h => h.pacienteId === p.id).length;
            const agendamentos = Utils.load('agendamentos') || [];
            const proximoAgendamento = agendamentos.filter(a => a.pacienteId === p.id && a.data >= Utils.today()).sort((a, b) => a.data.localeCompare(b.data))[0];

            return `
            <div class="patient-card">
                <div class="patient-card-header">
                    <div class="patient-avatar">${initials}</div>
                    <div class="patient-card-status">
                        <span class="badge ${p.status === 'ativo' ? 'badge-success' : 'badge-neutral'}">${p.status === 'ativo' ? 'Ativo' : 'Inativo'}</span>
                    </div>
                </div>
                <div class="patient-card-body">
                    <h4 class="patient-name">${p.nome || '-'}</h4>
                    <div class="patient-details">
                        <div class="patient-detail">
                            <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                            <span>${nascimento}</span>
                        </div>
                        <div class="patient-detail">
                            <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
                            <span>${Utils.phone(p.telefone)}</span>
                        </div>
                        <div class="patient-detail">
                            <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                            <span>${p.email || 'Sem e-mail'}</span>
                        </div>
                        <div class="patient-detail">
                            <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                            <span>${p.endereco || 'Sem endereço'}</span>
                        </div>
                    </div>
                    ${p.observacoes ? `<div class="patient-notes"><svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg> <span>${p.observacoes}</span></div>` : ''}
                </div>
                <div class="patient-card-footer">
                    <div class="patient-stats">
                        <div class="patient-stat">
                            <span class="stat-val">${histCount}</span>
                            <span class="stat-lbl">Registros</span>
                        </div>
                        <div class="patient-stat">
                            <span class="stat-val">${proximoAgendamento ? Utils.date(proximoAgendamento.data) : '-'}</span>
                            <span class="stat-lbl">Próxima aula</span>
                        </div>
                    </div>
                    <div class="patient-actions">
                        <button class="btn btn-sm btn-secondary" onclick="Pacientes.edit('${p.id}')">Editar</button>
                        <button class="btn btn-sm btn-secondary" onclick="Pacientes.history('${p.id}')">Histórico</button>
                        <button class="btn btn-sm btn-danger" onclick="Pacientes.remove('${p.id}')">Excluir</button>
                    </div>
                </div>
            </div>`;
        }).join('');

        document.getElementById('pacientes-count').textContent = `${pacientes.filter(p => p.status === 'ativo').length} ativos / ${pacientes.length} total`;
    },

    calcIdade(nascimento) {
        const hoje = new Date();
        const nasc = new Date(nascimento);
        let idade = hoje.getFullYear() - nasc.getFullYear();
        const m = hoje.getMonth() - nasc.getMonth();
        if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
        return `${idade} anos`;
    },

    bindEvents() {
        const search = document.getElementById('pacientes-search');
        if (search) {
            search.addEventListener('input', (e) => {
                this.searchQuery = e.target.value;
                this.render();
            });
        }

        const form = document.getElementById('paciente-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveForm();
            });
        }
    },

    openModal(id = null) {
        const modal = document.getElementById('modal-paciente');
        const form = document.getElementById('paciente-form');
        form.reset();
        document.getElementById('paciente-id').value = '';

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
                document.getElementById('paciente-endereco').value = p.endereco || '';
                document.getElementById('paciente-obs').value = p.observacoes || '';
                document.getElementById('paciente-status').value = p.status || 'ativo';
            }
        }

        modal.classList.add('active');
    },

    closeModal(id) {
        document.getElementById(id).classList.remove('active');
    },

    saveForm() {
        const id = document.getElementById('paciente-id').value;
        const dados = {
            id: id || Utils.id(),
            nome: document.getElementById('paciente-nome').value,
            cpf: document.getElementById('paciente-cpf').value,
            rg: document.getElementById('paciente-rg').value,
            nascimento: document.getElementById('paciente-nascimento').value,
            telefone: document.getElementById('paciente-telefone').value,
            email: document.getElementById('paciente-email').value,
            endereco: document.getElementById('paciente-endereco').value,
            observacoes: document.getElementById('paciente-obs').value,
            status: document.getElementById('paciente-status').value,
            criadoEm: id ? undefined : new Date().toISOString()
        };

        let pacientes = this.getAll();
        if (id) {
            const idx = pacientes.findIndex(p => p.id === id);
            if (idx !== -1) {
                dados.criadoEm = pacientes[idx].criadoEm;
                pacientes[idx] = dados;
            }
        } else {
            dados.criadoEm = new Date().toISOString();
            pacientes.push(dados);
        }

        this.save(pacientes);
        this.closeModal('modal-paciente');
        this.render();
        Utils.toast(id ? 'Paciente atualizado!' : 'Paciente cadastrado!');
    },

    edit(id) {
        this.openModal(id);
    },

    remove(id) {
        if (!Utils.confirm('Deseja realmente excluir este paciente?')) return;
        let pacientes = this.getAll().filter(p => p.id !== id);
        this.save(pacientes);
        this.render();
        Utils.toast('Paciente excluído!', 'warning');
    },

    history(id) {
        const paciente = this.getAll().find(p => p.id === id);
        if (!paciente) return;

        const historicos = Utils.load('historicos') || [];
        const hist = historicos.filter(h => h.pacienteId === id);

        const modal = document.getElementById('modal-historico');
        document.getElementById('historico-paciente-nome').textContent = paciente.nome;

        const timeline = document.getElementById('historico-timeline');
        if (hist.length === 0) {
            timeline.innerHTML = '<div class="empty-state"><p>Nenhum registro encontrado.</p></div>';
        } else {
            timeline.innerHTML = hist.sort((a, b) => new Date(b.data) - new Date(a.data)).map(h => `
                <div class="timeline-item">
                    <div class="date">${Utils.datetime(h.data)}</div>
                    <div class="title">${h.titulo}</div>
                    <div class="description">${h.descricao}</div>
                </div>
            `).join('');
        }

        // Bind add history button
        document.getElementById('btn-add-historico').onclick = () => {
            const titulo = prompt('Título do registro:');
            if (!titulo) return;
            const descricao = prompt('Descrição:');
            const novos = Utils.load('historicos') || [];
            novos.push({
                id: Utils.id(),
                pacienteId: id,
                titulo: titulo,
                descricao: descricao || '',
                data: new Date().toISOString(),
                profissional: App.currentUser ? App.currentUser.nome : 'Sistema'
            });
            Utils.save('historicos', novos);
            this.history(id);
            Utils.toast('Registro adicionado!');
        };

        modal.classList.add('active');
    }
};
