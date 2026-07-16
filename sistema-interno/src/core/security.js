const ESCAPE_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;', '/': '&#x2F;' };

export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/[&<>"'/]/g, char => ESCAPE_MAP[char]);
}

export async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const PATIENT_SCHEMA = {
  nome: { required: true, minLength: 2, maxLength: 100, label: 'Nome' },
  telefone: { required: true, pattern: /^\d{10,11}$/, label: 'Telefone' },
  email: { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, label: 'E-mail', optional: true },
  cpf: { pattern: /^\d{11}$/, label: 'CPF', optional: true },
};

const USER_SCHEMA = {
  nome: { required: true, minLength: 2, label: 'Nome' },
  email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, label: 'E-mail' },
};

const PAYMENT_SCHEMA = {
  tipo: { required: true, oneOf: ['receita', 'despesa'], label: 'Tipo' },
  descricao: { required: true, minLength: 2, label: 'Descrição' },
  valor: { required: true, min: 0.01, label: 'Valor' },
};

const INVOICE_SCHEMA = {
  clienteId: { required: true, label: 'Paciente' },
  descricaoServico: { required: true, minLength: 2, label: 'Descrição' },
  valorTotal: { required: true, min: 0.01, label: 'Valor' },
};

const APPOINTMENT_SCHEMA = {
  pacienteId: { required: true, label: 'Paciente' },
  data: { required: true, label: 'Data' },
  hora: { required: true, label: 'Hora' },
};

export const schemas = {
  paciente: PATIENT_SCHEMA,
  usuario: USER_SCHEMA,
  pagamento: PAYMENT_SCHEMA,
  nota: INVOICE_SCHEMA,
  agendamento: APPOINTMENT_SCHEMA,
};

export function validate(data, schema) {
  const errors = [];
  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];
    const label = rules.label || field;

    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`${label} é obrigatório`);
      continue;
    }

    if (value === undefined || value === null || value === '') continue;

    if (rules.minLength && String(value).length < rules.minLength) {
      errors.push(`${label} deve ter pelo menos ${rules.minLength} caracteres`);
    }
    if (rules.maxLength && String(value).length > rules.maxLength) {
      errors.push(`${label} deve ter no máximo ${rules.maxLength} caracteres`);
    }
    if (rules.pattern && !rules.pattern.test(String(value))) {
      errors.push(`${label} tem formato inválido`);
    }
    if (rules.oneOf && !rules.oneOf.includes(value)) {
      errors.push(`${label} deve ser um dos: ${rules.oneOf.join(', ')}`);
    }
    if (rules.min !== undefined && Number(value) < rules.min) {
      errors.push(`${label} deve ser pelo menos ${rules.min}`);
    }
  }
  return { valid: errors.length === 0, errors };
}
