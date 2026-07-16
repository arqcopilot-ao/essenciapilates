/* ============================================
   FINANCEIRO - Financial control
   ============================================ */
const Financeiro = {
    filterTipo: 'todos',
    filterStatus: 'todos',

    init() {
        this.render();
        this.bindEvents();
    },

    getAll() {
        return Utils.load('pagamentos') || [];
    },

    save(data) {
        Utils.save('pagamentos', data);
    },

    render() {
        const pagamentos = this.getAll();
        const filtered = pagamentos.filter(p => {
            if (this.filterTipo !== 'todos' && p.tipo !== this.filterTipo) return false;
            if (this.filterStatus !== 'todos' && p.status !== this.filterStatus) return false;
            return true;
        }).sort((a, b) => new Date(b.dataVencimento || 0) - new Date(a.dataVencimento || 0));

        // Stats
        const receitas = pagamentos.filter(p => p.tipo === 'receita' && p.status === 'pago').reduce((s, p) => s + (p.valor || 0), 0);
        const despesas = pagamentos.filter(p => p.tipo === 'despesa' && p.status === 'pago').reduce((s, p) => s + (p.valor || 0), 0);
        const pendentes = pagamentos.filter(p => p.status === 'pendente').reduce((s, p) => s + (p.valor || 0), 0);

        document.getElementById('fin-receitas').textContent = Utils.currency(receitas);
        document.getElementById('fin-despesas').textContent = Utils.currency(despesas);
        document.getElementById('fin-balance').textContent = Utils.currency(receitas - despesas);
        document.getElementById('fin-pendentes').textContent = Utils.currency(pendentes);

        const tbody = document.getElementById('financeiro-table-body');
        if (!tbody) return;

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state">
                <h4>Nenhum lançamento encontrado</h4>
                <p>Clique em "Novo Lançamento" para adicionar.</p>
            </div></td></tr>`;
            return;
        }

        tbody.innerHTML = filtered.map(p => `
            <tr>
                <td>${Utils.date(p.data)}</td>
                <td><span class="badge ${p.tipo === 'receita' ? 'badge-success' : 'badge-error'}">${p.tipo === 'receita' ? 'Receita' : 'Despesa'}</span></td>
                <td>${p.descricao || '-'}</td>
                <td>${p.categoria || '-'}</td>
                <td><strong>${Utils.currency(p.valor)}</strong></td>
                <td><span class="badge ${p.status === 'pago' ? 'badge-success' : p.status === 'pendente' ? 'badge-warning' : 'badge-neutral'}">${p.status === 'pago' ? 'Pago' : p.status === 'pendente' ? 'Pendente' : 'Cancelado'}</span></td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="Financeiro.edit('${p.id}')">Editar</button>
                    ${p.status === 'pendente' ? `<button class="btn btn-sm btn-primary" onclick="Financeiro.markPaid('${p.id}')">Baixar</button>` : ''}
                    <button class="btn btn-sm btn-danger" onclick="Financeiro.remove('${p.id}')">Excluir</button>
                </td>
            </tr>
        `).join('');
    },

    bindEvents() {
        const form = document.getElementById('pagamento-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveForm();
            });
        }
    },

    openModal(id = null) {
        const modal = document.getElementById('modal-pagamento');
        const form = document.getElementById('pagamento-form');
        form.reset();
        document.getElementById('pagamento-id').value = '';

        if (id) {
            const p = this.getAll().find(x => x.id === id);
            if (p) {
                document.getElementById('pagamento-id').value = p.id;
                document.getElementById('pagamento-tipo').value = p.tipo;
                document.getElementById('pagamento-desc').value = p.descricao || '';
                document.getElementById('pagamento-categoria').value = p.categoria || '';
                document.getElementById('pagamento-valor').value = p.valor || '';
                document.getElementById('pagamento-data').value = p.data || '';
                document.getElementById('pagamento-vencimento').value = p.dataVencimento || '';
                document.getElementById('pagamento-status').value = p.status;
                document.getElementById('pagamento-notas').value = p.notas || '';
            }
        } else {
            document.getElementById('pagamento-data').value = Utils.today();
        }

        modal.classList.add('active');
    },

    closeModal(id) {
        document.getElementById(id).classList.remove('active');
    },

    saveForm() {
        const id = document.getElementById('pagamento-id').value;
        const dados = {
            id: id || Utils.id(),
            tipo: document.getElementById('pagamento-tipo').value,
            descricao: document.getElementById('pagamento-desc').value,
            categoria: document.getElementById('pagamento-categoria').value,
            valor: parseFloat(document.getElementById('pagamento-valor').value) || 0,
            data: document.getElementById('pagamento-data').value,
            dataVencimento: document.getElementById('pagamento-vencimento').value,
            status: document.getElementById('pagamento-status').value,
            notas: document.getElementById('pagamento-notas').value
        };

        let pagamentos = this.getAll();
        if (id) {
            const idx = pagamentos.findIndex(p => p.id === id);
            if (idx !== -1) pagamentos[idx] = dados;
        } else {
            pagamentos.push(dados);
        }

        this.save(pagamentos);
        this.closeModal('modal-pagamento');
        this.render();
        Utils.toast(id ? 'Lançamento atualizado!' : 'Lançamento criado!');
    },

    edit(id) { this.openModal(id); },

    markPaid(id) {
        let pagamentos = this.getAll();
        const idx = pagamentos.findIndex(p => p.id === id);
        if (idx !== -1) {
            pagamentos[idx].status = 'pago';
            pagamentos[idx].dataPagamento = new Date().toISOString();
            this.save(pagamentos);
            this.render();
            Utils.toast('Pagamento baixado!');
        }
    },

    remove(id) {
        if (!Utils.confirm('Deseja excluir este lançamento?')) return;
        this.save(this.getAll().filter(p => p.id !== id));
        this.render();
        Utils.toast('Lançamento excluído!', 'warning');
    },

    filter(tipo) {
        this.filterTipo = tipo;
        document.querySelectorAll('.fin-filter-tipo').forEach(b => b.classList.remove('active'));
        event.target.classList.add('active');
        this.render();
    },

    filterByStatus(status) {
        this.filterStatus = status;
        this.render();
    }
};
