const test = require('node:test');
const assert = require('node:assert/strict');
const { resetStore } = require('../database/connection');
const { createTransaction } = require('../services/expenseService');
const { getDashboard } = require('../controllers/dashboardController');

test('dashboard totals use numeric amounts when transactions are saved with string values', async () => {
  resetStore();

  await createTransaction({
    userId: 'user-1',
    type: 'expense',
    name: 'Mercado',
    description: '',
    category: 'Mercado',
    amount: '125.50',
    date: '2026-08-03',
    paymentMethod: 'Cartão',
    account: 'Nubank',
    recurring: false,
    installments: 1,
    notes: ''
  });

  let payload;
  const req = { user: { id: 'user-1' } };
  const res = {
    json(result) {
      payload = result;
    }
  };

  await getDashboard(req, res, (error) => { throw error; });

  assert.equal(typeof payload.totalExpense, 'number');
  assert.equal(payload.totalExpense, 125.5);
  assert.equal(payload.balance, -125.5);
});
