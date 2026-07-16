/* ============================================
   NOTAS - NF-e emission (SEFAZ integration ready)
   ============================================ */
const Notas = {
    init() {
        this.render();
        this.bindEvents();
    },

    getAll() {
        return Utils.load('notasFiscais') || [];
    },

    save(data) {
        Utils.save('notasFiscais', data);
    },

    render() {
        const notas = this.getAll().sort((a, b) => new Date(b.emissao || 0) - new Date(a.emissao || 0));
        const tbody = document.getElementById('notas-table-body');
        if (!tbody) return;

        if (notas.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
                <h4>Nenhuma nota emitida</h4>
                <p>Clique em "Emitir NF-e" para gerar uma nova nota.</p>
            </div></td></tr>`;
            return;
        }

        tbody.innerHTML = notas.map(n => `
            <tr>
                <td><strong>${n.numero || '-'}</strong></td>
                <td>${n.serie || '1'}</td>
                <td>${Utils.date(n.emissao)}</td>
                <td>${n.clienteNome || '-'}</td>
                <td>${n.descricaoServico || '-'}</td>
                <td><strong>${Utils.currency(n.valorTotal)}</strong></td>
                <td><span class="badge ${n.status === 'autorizada' ? 'badge-success' : n.status === 'rejeitada' ? 'badge-error' : n.status === 'cancelada' ? 'badge-neutral' : 'badge-warning'}">${n.status === 'autorizada' ? 'Autorizada' : n.status === 'rejeitada' ? 'Rejeitada' : n.status === 'cancelada' ? 'Cancelada' : 'Pendente'}</span></td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="Notas.view('${n.id}')">Detalhes</button>
                    ${n.status === 'pendente' ? `<button class="btn btn-sm btn-primary" onclick="Notas.send('${n.id}')">Enviar SEFAZ</button>` : ''}
                    ${n.status === 'autorizada' ? `<button class="btn btn-sm btn-secondary" onclick="Notas.cancel('${n.id}')">Cancelar</button>` : ''}
                </td>
            </tr>
        `).join('');
    },

    bindEvents() {
        const form = document.getElementById('nota-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveForm();
            });
        }
    },

    openModal(id = null) {
        const modal = document.getElementById('modal-nota');
        const form = document.getElementById('nota-form');
        form.reset();
        document.getElementById('nota-id').value = '';

        // Populate patient dropdown
        const pacientes = Utils.load('pacientes') || [];
        const select = document.getElementById('nota-cliente');
        select.innerHTML = '<option value="">Selecione o paciente</option>' +
            pacientes.map(p => `<option value="${p.id}">${p.nome}</option>`).join('');

        if (id) {
            const n = this.getAll().find(x => x.id === id);
            if (n) {
                document.getElementById('nota-id').value = n.id;
                document.getElementById('nota-cliente').value = n.clienteId || '';
                document.getElementById('nota-desc').value = n.descricaoServico || '';
                document.getElementById('nota-valor').value = n.valorTotal || '';
                document.getElementById('nota-notas').value = n.notas || '';
            }
        } else {
            // Auto-generate number
            const notas = this.getAll();
            document.getElementById('nota-numero-gerado').textContent = String(notas.length + 1).padStart(6, '0');
        }

        modal.classList.add('active');
    },

    closeModal(id) {
        document.getElementById(id).classList.remove('active');
    },

    saveForm() {
        const id = document.getElementById('nota-id').value;
        const clienteId = document.getElementById('nota-cliente').value;
        const pacientes = Utils.load('pacientes') || [];
        const cliente = pacientes.find(p => p.id === clienteId);

        const dados = {
            id: id || Utils.id(),
            numero: id ? undefined : String((this.getAll().length + 1)).padStart(6, '0'),
            serie: '1',
            emissao: new Date().toISOString(),
            clienteId: clienteId,
            clienteNome: cliente ? cliente.nome : '',
            clienteCPF: cliente ? cliente.cpf : '',
            descricaoServico: document.getElementById('nota-desc').value,
            valorTotal: parseFloat(document.getElementById('nota-valor').value) || 0,
            notas: document.getElementById('nota-notas').value,
            status: 'pendente',
            // SEFAZ integration fields (ready for API)
            chaveAcesso: '',
            protocolo: '',
            xmlEnvio: '',
            xmlRetorno: ''
        };

        let notas = this.getAll();
        if (id) {
            const idx = notas.findIndex(n => n.id === id);
            if (idx !== -1) {
                dados.numero = notas[idx].numero;
                dados.emissao = notas[idx].emissao;
                dados.status = notas[idx].status;
                notas[idx] = dados;
            }
        } else {
            notas.push(dados);
        }

        this.save(notas);
        this.closeModal('modal-nota');
        this.render();
        Utils.toast(id ? 'Nota atualizada!' : 'Nota criada!');
    },

    send(id) {
        // Simulate SEFAZ submission
        if (!Utils.confirm('Enviar nota para SEFAZ?')) return;

        let notas = this.getAll();
        const idx = notas.findIndex(n => n.id === id);
        if (idx !== -1) {
            notas[idx].status = 'autorizada';
            notas[idx].chaveAcesso = Utils.id() + Utils.id();
            notas[idx].protocolo = String(Math.floor(Math.random() * 900000000) + 100000000);
            notas[idx].xmlEnvio = '<NFe>...</NFe>';
            notas[idx].xmlRetorno = '<retNFe><cStat>100</cStat></retNFe>';
            this.save(notas);
            this.render();
            Utils.toast('NF-e autorizada pela SEFAZ!');
        }
    },

    cancel(id) {
        if (!Utils.confirm('Deseja cancelar esta NF-e?')) return;
        let notas = this.getAll();
        const idx = notas.findIndex(n => n.id === id);
        if (idx !== -1) {
            notas[idx].status = 'cancelada';
            this.save(notas);
            this.render();
            Utils.toast('NF-e cancelada.', 'warning');
        }
    },

    view(id) {
        const n = this.getAll().find(x => x.id === id);
        if (!n) return;

        const modal = document.getElementById('modal-nota-detalhe');
        document.getElementById('nota-det-numero').textContent = n.numero;
        document.getElementById('nota-det-serie').textContent = n.serie;
        document.getElementById('nota-det-emissao').textContent = Utils.date(n.emissao);
        document.getElementById('nota-det-cliente').textContent = n.clienteNome || '-';
        document.getElementById('nota-det-cpf').textContent = Utils.cpf(n.clienteCPF);
        document.getElementById('nota-det-desc').textContent = n.descricaoServico || '-';
        document.getElementById('nota-det-valor').textContent = Utils.currency(n.valorTotal);
        document.getElementById('nota-det-status').textContent = n.status;
        document.getElementById('nota-det-chave').textContent = n.chaveAcesso || 'Aguardando envio';
        document.getElementById('nota-det-protocolo').textContent = n.protocolo || '-';
        modal.classList.add('active');
    }
};
