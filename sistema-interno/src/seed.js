import { cache } from './core/cache.js';

export function seedData() {
  if (cache.get('pacientes') && cache.get('pacientes').length > 0) return;

  const now = new Date();

  const pacientes = [
    { id: 'pac001', nome: 'Maria Clara Fernandes', cpf: '12345678901', rg: '1234567', nascimento: '1985-03-15', telefone: '22998765432', email: 'maria.clara@email.com', endereco: 'Rua das Flores, 123 - Centro', observacoes: 'Paciente com histórico de lombalgia. Faz pilates há 8 meses.', status: 'ativo', criadoEm: '2025-01-10T10:00:00.000Z' },
    { id: 'pac002', nome: 'Roberto Almeida Santos', cpf: '98765432100', rg: '9876543', nascimento: '1978-07-22', telefone: '22997654321', email: 'roberto.santos@email.com', endereco: 'Av. Brasil, 456 - Jardim Azul', observacoes: 'Reabilitação pós-cirurgia de joelho. Iniciou em fevereiro/2025.', status: 'ativo', criadoEm: '2025-02-05T14:30:00.000Z' },
    { id: 'pac003', nome: 'Ana Beatriz Lima', cpf: '45678912300', rg: '4567891', nascimento: '1992-11-08', telefone: '22996543210', email: 'ana.lima@email.com', endereco: 'Rua São José, 789 - Bela Vista', observacoes: 'Gestante de 7 meses. Aulas adaptadas de pilates.', status: 'ativo', criadoEm: '2025-03-01T09:15:00.000Z' },
    { id: 'pac004', nome: 'Carlos Eduardo Mendes', cpf: '32165498700', rg: '3216549', nascimento: '1965-05-30', telefone: '22995432109', email: 'carlos.mendes@email.com', endereco: 'Trav. dos Pinheiros, 321 - Vila Nova', observacoes: 'Paciente idoso com artrite. Fisioterapia semanal.', status: 'ativo', criadoEm: '2025-01-20T11:00:00.000Z' },
    { id: 'pac005', nome: 'Juliana Rocha Pereira', cpf: '78912345600', rg: '7891234', nascimento: '1990-09-12', telefone: '22994321098', email: 'juliana.pereira@email.com', endereco: 'Rua do Sol, 654 - Boa Vista', observacoes: 'Atleta amadora de corrida. Pilates para fortalecimento.', status: 'inativo', criadoEm: '2024-11-15T16:45:00.000Z' }
  ];

  const meses = ['2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06'];
  const pagamentos = [];
  const receitaPorMes = {
    '2025-01': [320, 280, 350, 300, 0], '2025-02': [320, 280, 350, 300, 0],
    '2025-03': [320, 280, 350, 300, 0], '2025-04': [320, 280, 350, 300, 0],
    '2025-05': [320, 280, 350, 300, 0], '2025-06': [320, 280, 350, 300, 0]
  };

  meses.forEach((mes, mi) => {
    pacientes.forEach((p, pi) => {
      const valor = receitaPorMes[mes][pi];
      if (valor > 0) {
        const dia = 5 + Math.floor(Math.random() * 5);
        pagamentos.push({ id: `fin_${mes}_${p.id}`, tipo: 'receita', descricao: `Mensalidade ${p.nome.split(' ')[0]}`, categoria: 'mensalidade', valor, data: `${mes}-${String(dia).padStart(2, '0')}`, dataVencimento: `${mes}-05`, status: mi < 4 ? 'pago' : (mi === 4 ? 'pago' : 'pendente'), notas: '' });
      }
    });
    if (mi % 2 === 0) {
      pagamentos.push({ id: `fin_${mes}_avulsa1`, tipo: 'receita', descricao: 'Sessão avulsa - Pilates', categoria: 'avulsa', valor: 80, data: `${mes}-15`, dataVencimento: `${mes}-15`, status: 'pago', notas: 'Sessão extra' });
    }
  });

  const despesasFixas = [
    { desc: 'Aluguel do espaço', cat: 'aluguel', valor: 2800 }, { desc: 'Equipamentos e manutenção', cat: 'equipamento', valor: 450 },
    { desc: 'Funcionário - recepcionista', cat: 'funcionario', valor: 1800 }, { desc: 'Material de limpeza', cat: 'outros', valor: 120 },
    { desc: 'Energia elétrica', cat: 'outros', valor: 380 }, { desc: 'Água', cat: 'outros', valor: 95 },
    { desc: 'Internet e telefone', cat: 'outros', valor: 150 }
  ];

  meses.forEach((mes) => {
    despesasFixas.forEach((d, i) => {
      const dia = 1 + Math.floor(Math.random() * 10);
      pagamentos.push({ id: `desp_${mes}_${i}`, tipo: 'despesa', descricao: d.desc, categoria: d.cat, valor: d.valor + Math.floor(Math.random() * 50 - 25), data: `${mes}-${String(dia).padStart(2, '0')}`, dataVencimento: `${mes}-${String(5 + i).padStart(2, '0')}`, status: Math.random() > 0.15 ? 'pago' : 'pendente', notas: '' });
    });
  });

  const agendamentos = [];
  const weekStart = new Date(now);
  const dayOfWeek = weekStart.getDay();
  weekStart.setDate(weekStart.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  weekStart.setHours(0, 0, 0, 0);
  const horarios = [
    { hora: '07:00', pacientes: ['pac001', 'pac003'] }, { hora: '08:00', pacientes: ['pac002'] },
    { hora: '09:00', pacientes: ['pac001', 'pac004'] }, { hora: '10:00', pacientes: ['pac003'] },
    { hora: '14:00', pacientes: ['pac002', 'pac004'] }, { hora: '15:00', pacientes: ['pac001'] },
    { hora: '16:00', pacientes: ['pac003'] }, { hora: '17:00', pacientes: ['pac004'] }
  ];

  for (let d = 0; d < 5; d++) {
    const data = new Date(weekStart); data.setDate(data.getDate() + d);
    const dataStr = data.toISOString().split('T')[0];
    horarios.forEach((h) => {
      if (Math.random() > 0.3 || d < 3) {
        agendamentos.push({ id: `ag_${dataStr}_${h.hora.replace(':', '')}`, pacienteId: h.pacientes[d % h.pacientes.length], data: dataStr, hora: h.hora, tipo: Math.random() > 0.5 ? 'pilates' : 'fisioterapia', observacoes: '', googleEventId: '', status: d < 2 ? (Math.random() > 0.2 ? 'confirmado' : 'agendado') : 'agendado' });
      }
    });
  }

  const presencas = [];
  const weekPrev = new Date(weekStart); weekPrev.setDate(weekPrev.getDate() - 7);
  for (let d = 0; d < 5; d++) {
    const data = new Date(weekPrev); data.setDate(data.getDate() + d);
    const dataStr = data.toISOString().split('T')[0];
    horarios.forEach((h) => {
      if (Math.random() > 0.25) {
        presencas.push({ id: `pres_${dataStr}_${h.hora.replace(':', '')}`, agendamentoId: `ag_${dataStr}_${h.hora.replace(':', '')}`, data: dataStr, presente: Math.random() > 0.15, registroEm: `${dataStr}T${h.hora}:00`, registradoPor: 'Administrador' });
      }
    });
  }

  const historicos = [];
  const historicoTemplates = [
    { titulo: 'Avaliação Inicial', descricao: 'Avaliação postural completa. Identificadas tensões na região lombar e cervical. Planejado programa de exercícios.' },
    { titulo: 'Sessão de Pilates', descricao: 'Exercícios de fortalecimento do core com reformer. Trabalho de mobilidade torácica. Paciente evoluindo bem.' },
    { titulo: 'Sessão de Fisioterapia', descricao: 'Terapia manual na coluna lombar. Exercícios de estabilização. Orientação postural.' },
    { titulo: 'Revisão de Programa', descricao: 'Reavaliação do programa de exercícios. Progressão dos movimentos. Inclusão de novos aparelhos.' },
    { titulo: 'Retorno Pós-Intercorrência', descricao: 'Paciente retornou após 1 semana sem treino. Retomada gradual. Foco em mobilidade antes de fortalecimento.' },
    { titulo: 'Avaliação de Evolução', descricao: 'Comparação com avaliação inicial. Melhora significativa na flexibilidade e força. Manter ritmo atual.' }
  ];
  pacientes.forEach(p => {
    const numRegistros = 2 + Math.floor(Math.random() * 4);
    for (let i = 0; i < numRegistros; i++) {
      const tpl = historicoTemplates[Math.floor(Math.random() * historicoTemplates.length)];
      const diasAtras = 90 - Math.floor(Math.random() * 90);
      const data = new Date(now); data.setDate(data.getDate() - diasAtras);
      historicos.push({ id: `hist_${p.id}_${i}`, pacienteId: p.id, titulo: tpl.titulo, descricao: tpl.descricao, data: data.toISOString(), profissional: 'Dra. Camila Ribeiro' });
    }
  });

  const notas = [
    { id: 'nf001', numero: '000001', serie: '1', emissao: '2025-06-02T10:00:00', clienteId: 'pac001', clienteNome: 'Maria Clara Fernandes', clienteCPF: '12345678901', descricaoServico: 'Mensalidade Pilates - Junho/2025', valorTotal: 320, notas: '', status: 'autorizada', chaveAcesso: '35250712345678901234567890123456789012345678', protocolo: '135250000012345' },
    { id: 'nf002', numero: '000002', serie: '1', emissao: '2025-06-05T14:30:00', clienteId: 'pac002', clienteNome: 'Roberto Almeida Santos', clienteCPF: '98765432100', descricaoServico: 'Sessão de Fisioterapia', valorTotal: 120, notas: 'Sessão avulsa', status: 'autorizada', chaveAcesso: '35250798765432109876543210987654321098765432', protocolo: '135250000012346' },
    { id: 'nf003', numero: '000003', serie: '1', emissao: '2025-06-10T09:00:00', clienteId: 'pac003', clienteNome: 'Ana Beatriz Lima', clienteCPF: '45678912300', descricaoServico: 'Mensalidade Pilates - Junho/2025', valorTotal: 350, notas: '', status: 'autorizada', chaveAcesso: '35250745678912304567891230456789123045678912', protocolo: '135250000012347' },
    { id: 'nf004', numero: '000004', serie: '1', emissao: '2025-06-15T11:00:00', clienteId: 'pac004', clienteNome: 'Carlos Eduardo Mendes', clienteCPF: '32165498700', descricaoServico: 'Mensalidade Fisioterapia - Junho/2025', valorTotal: 300, notas: '', status: 'pendente', chaveAcesso: '', protocolo: '' }
  ];

  cache.set('pacientes', pacientes);
  cache.set('pagamentos', pagamentos);
  cache.set('agendamentos', agendamentos);
  cache.set('presencas', presencas);
  cache.set('historicos', historicos);
  cache.set('notasFiscais', notas);
}
