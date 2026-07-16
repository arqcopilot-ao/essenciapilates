/* ============================================
   DASHBOARD - Charts and summary stats
   ============================================ */
const Dashboard = {
    chartPacientes: null,
    chartFinanceiro: null,

    init() {
        this.renderStats();
        this.renderAlerts();
        this.renderCharts();
    },

    renderStats() {
        const pacientes = Utils.load('pacientes') || [];
        const pagamentos = Utils.load('pagamentos') || [];
        const sessoes = Utils.load('sessoes') || [];
        const today = Utils.today();

        const ativos = pacientes.filter(p => p.status === 'ativo').length;
        const receitaMes = pagamentos
            .filter(p => p.data && p.data.startsWith(today.substring(0, 7)) && p.status === 'pago')
            .reduce((sum, p) => sum + (p.valor || 0), 0);
        const sessoesHoje = sessoes.filter(s => s.data === today).length;
        const proximosPag = pagamentos
            .filter(p => p.status === 'pendente' && p.dataVencimento)
            .filter(p => Utils.daysUntil(p.dataVencimento) <= 7 && Utils.daysUntil(p.dataVencimento) >= 0)
            .length;

        document.getElementById('stat-pacientes').textContent = ativos;
        document.getElementById('stat-receita').textContent = Utils.currency(receitaMes);
        document.getElementById('stat-sessoes').textContent = sessoesHoje;
        document.getElementById('stat-pagamentos').textContent = proximosPag;
    },

    renderAlerts() {
        const pagamentos = Utils.load('pagamentos') || [];
        const alertContainer = document.getElementById('dashboard-alerts');
        if (!alertContainer) return;

        const pendentes = pagamentos.filter(p => p.status === 'pendente' && p.dataVencimento);
        const vencidos = pendentes.filter(p => Utils.daysUntil(p.dataVencimento) < 0);
        const proximos = pendentes.filter(p => {
            const d = Utils.daysUntil(p.dataVencimento);
            return d >= 0 && d <= 7;
        });

        let html = '';
        if (vencidos.length > 0) {
            html += `<div class="alert alert-error">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                ${vencidos.length} pagamento(s) vencido(s). Ação urgente necessária.
            </div>`;
        }
        if (proximos.length > 0) {
            html += `<div class="alert alert-warning">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
                ${proximos.length} pagamento(s) vencendo nos próximos 7 dias.
            </div>`;
        }
        if (html) {
            alertContainer.innerHTML = html;
        } else {
            alertContainer.innerHTML = '';
        }
    },

    renderCharts() {
        // Pacientes por mês (últimos 6 meses)
        const pacientes = Utils.load('pacientes') || [];
        const meses = [];
        const counts = [];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = d.toISOString().substring(0, 7);
            meses.push(d.toLocaleDateString('pt-BR', { month: 'short' }));
            counts.push(pacientes.filter(p => p.criadoEm && p.criadoEm.startsWith(key)).length);
        }

        const ctx1 = document.getElementById('chart-pacientes');
        if (ctx1) {
            if (this.chartPacientes) this.chartPacientes.destroy();
            this.chartPacientes = new Chart(ctx1, {
                type: 'bar',
                data: {
                    labels: meses,
                    datasets: [{
                        label: 'Novos Pacientes',
                        data: counts,
                        backgroundColor: 'rgba(112, 181, 186, 0.7)',
                        borderColor: 'rgba(112, 181, 186, 1)',
                        borderWidth: 1,
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { beginAtZero: true, ticks: { stepSize: 1 } }
                    }
                }
            });
        }

        // Financeiro - receitas vs despesas
        const pagamentos = Utils.load('pagamentos') || [];
        const receitas = [];
        const despesas = [];
        const mesesFin = [];
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
            this.chartFinanceiro = new Chart(ctx2, {
                type: 'line',
                data: {
                    labels: mesesFin,
                    datasets: [
                        {
                            label: 'Receitas',
                            data: receitas,
                            borderColor: 'rgba(52, 199, 89, 1)',
                            backgroundColor: 'rgba(52, 199, 89, 0.1)',
                            fill: true, tension: 0.4
                        },
                        {
                            label: 'Despesas',
                            data: despesas,
                            borderColor: 'rgba(255, 59, 48, 1)',
                            backgroundColor: 'rgba(255, 59, 48, 0.1)',
                            fill: true, tension: 0.4
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'top' } },
                    scales: { y: { beginAtZero: true } }
                }
            });
        }
    }
};
