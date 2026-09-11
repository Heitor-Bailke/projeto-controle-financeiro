const test = require('node:test');
const assert = require('node:assert/strict');
const { buildTransactions, createTransaction, listTransactions } = require('../services/expenseService');
const { resetStore } = require('../database/connection');

const base = { userId: 'schedule-user', name: 'Compra', type: 'expense', amount: 100, date: '2026-01-31' };

test('parcelas preservam centavos, fim do mês e situação apenas da primeira', () => {
  const rows = buildTransactions({ ...base, installments: 3, status: 'settled' });
  assert.deepEqual(rows.map(row => row.amount), [33.34, 33.33, 33.33]);
  assert.deepEqual(rows.map(row => row.date), ['2026-01-31', '2026-02-28', '2026-03-31']);
  assert.deepEqual(rows.map(row => row.status), ['settled', 'pending', 'pending']);
  assert.equal(new Set(rows.map(row => row.id)).size, 3);
});

test('repetição mantém valor mensal e cruza anos', () => {
  const rows = buildTransactions({ ...base, date: '2027-12-31', recurring: true, repeatMonths: 3 });
  assert.deepEqual(rows.map(row => row.amount), [100, 100, 100]);
  assert.deepEqual(rows.map(row => row.date), ['2027-12-31', '2028-01-31', '2028-02-29']);
});

test('rejeita valores e combinações inválidas', () => {
  for (const values of [{ amount: 0 }, { amount: -1 }, { recurring: true, installments: 2 }, { installments: 2.5 }, { repeatMonths: 361 }, { status: 'invalid' }, { amount: 0.01, installments: 2 }]) {
    assert.throws(() => buildTransactions({ ...base, ...values }));
  }
});

test('salva a série e mantém forma de pagamento e situação na listagem', async () => {
  resetStore();
  await createTransaction({ ...base, installments: 2, paymentMethod: 'Pix', status: 'pending' });
  const rows = await listTransactions(base.userId);
  assert.equal(rows.length, 2);
  assert.ok(rows.every(row => row.status === 'pending' && row.paymentMethod === 'Pix'));
  assert.equal((await listTransactions('outro-usuario')).length, 0);
});
