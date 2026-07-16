import { describe, it, expect } from 'vitest';
import { escapeHtml, hashPassword, validate, schemas } from '../src/core/security.js';

describe('escapeHtml', () => {
  it('escapes HTML special characters', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
  });

  it('escapes ampersand', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b');
  });

  it('escapes single quotes', () => {
    expect(escapeHtml("it's")).toBe("it&#039;s");
  });

  it('escapes forward slash', () => {
    expect(escapeHtml('a/b')).toBe('a&#x2F;b');
  });

  it('returns empty string for null/undefined', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
  });

  it('converts numbers to string', () => {
    expect(escapeHtml(42)).toBe('42');
  });

  it('passes through clean strings unchanged', () => {
    expect(escapeHtml('Hello World')).toBe('Hello World');
  });
});

describe('hashPassword', () => {
  it('returns a SHA-256 hex hash', async () => {
    const hash = await hashPassword('admin123');
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('produces consistent hashes', async () => {
    const h1 = await hashPassword('test');
    const h2 = await hashPassword('test');
    expect(h1).toBe(h2);
  });

  it('produces different hashes for different inputs', async () => {
    const h1 = await hashPassword('password1');
    const h2 = await hashPassword('password2');
    expect(h1).not.toBe(h2);
  });
});

describe('validate', () => {
  it('returns valid for correct data', () => {
    const result = validate({ nome: 'Maria', telefone: '22998765432' }, schemas.paciente);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('returns error for missing required field', () => {
    const result = validate({ nome: '', telefone: '22998765432' }, schemas.paciente);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('Nome');
  });

  it('returns error for invalid pattern', () => {
    const result = validate({ nome: 'Maria', telefone: 'abc' }, schemas.paciente);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('Telefone');
  });

  it('validates user schema', () => {
    const result = validate({ nome: 'Admin', email: 'admin@test.com' }, schemas.usuario);
    expect(result.valid).toBe(true);
  });

  it('validates payment schema', () => {
    const result = validate({ tipo: 'receita', descricao: 'Mensalidade', valor: 320 }, schemas.pagamento);
    expect(result.valid).toBe(true);
  });

  it('validates invoice schema', () => {
    const result = validate({ clienteId: 'pac001', descricaoServico: 'Pilates', valorTotal: 320 }, schemas.nota);
    expect(result.valid).toBe(true);
  });

  it('validates appointment schema', () => {
    const result = validate({ pacienteId: 'pac001', data: '2025-07-15', hora: '09:00' }, schemas.agendamento);
    expect(result.valid).toBe(true);
  });

  it('rejects invalid enum value', () => {
    const result = validate({ tipo: 'invalido', descricao: 'Teste', valor: 100 }, schemas.pagamento);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('Tipo');
  });

  it('rejects value below minimum', () => {
    const result = validate({ tipo: 'receita', descricao: 'Teste', valor: 0 }, schemas.pagamento);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('Valor');
  });
});
