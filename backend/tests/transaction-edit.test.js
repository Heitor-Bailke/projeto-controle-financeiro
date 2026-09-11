const test = require('node:test');
const assert = require('node:assert/strict');
const { resetStore } = require('../database/connection');
const { createTransaction, listTransactions, updateTransaction, deleteTransaction } = require('../services/expenseService');

test('edita e exclui somente a ocorrência escolhida e preserva outros usuários', async () => {
  resetStore();
  const first = await createTransaction({ userId: 'owner', name: 'Compra', type: 'expense', amount: 300, date: '2026-09-11', installments: 3, category: 'Casa' });
  await assert.rejects(updateTransaction('other', first.id, { amount: 1 }), { statusCode: 404 });
  await assert.rejects(deleteTransaction('other', first.id), { statusCode: 404 });
  await assert.rejects(updateTransaction('owner', first.id, { amount: -10 }), { statusCode: 400 });
  const edited = await updateTransaction('owner', first.id, { name: 'Compra corrigida', amount: 110, status: 'pending', userId: 'other', installments: 20 });
  assert.equal(edited.amount, 110);
  assert.equal(edited.status, 'pending');
  assert.equal(edited.userId, 'owner');
  assert.equal(edited.installments, 3);
  const rows = await listTransactions('owner');
  assert.equal(rows.length, 3);
  assert.ok(rows.filter(row => row.id !== first.id).every(row => row.amount === 100));
  await deleteTransaction('owner', first.id);
  assert.equal((await listTransactions('owner')).length, 2);
  await assert.rejects(deleteTransaction('owner', first.id), { statusCode: 404 });
});
