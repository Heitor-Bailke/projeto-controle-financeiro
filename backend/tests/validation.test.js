const test = require('node:test');
const assert = require('node:assert/strict');
const { validateTransaction, validateCredentials } = require('../utils/validation');

test('rejects invalid financial entries', () => {
  assert.throws(() => validateTransaction({ type: 'expense', name: 'Teste', amount: 0, date: '2026-08-01' }), /Valor/);
  assert.throws(() => validateTransaction({ type: 'other', name: 'Teste', amount: 10, date: '2026-08-01' }), /Tipo/);
});

test('requires strong authentication credentials', () => {
  assert.throws(() => validateCredentials({ email: 'invalid', password: '12345678' }), /E-mail/);
  assert.throws(() => validateCredentials({ email: 'ana@example.com', password: '123' }), /senha/);
});
