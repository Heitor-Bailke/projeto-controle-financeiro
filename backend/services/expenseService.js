const { randomUUID } = require('crypto');
const { getStore, isDatabaseConfigured, query } = require('../database/connection');
const { validateTransaction } = require('../utils/validation');

function mapTransaction(row) {
  return { id: row.id, userId: row.user_id ?? row.userId, type: row.type, name: row.name, description: row.description, category: row.category, amount: Number(row.amount), date: typeof row.date === 'string' ? row.date : row.date.toISOString().slice(0, 10), paymentMethod: row.payment_method ?? row.paymentMethod, account: row.account_name ?? row.account, recurring: row.recurring, installments: Number(row.installments), notes: row.notes, createdAt: row.created_at ?? row.createdAt };
}

function buildTransactions(data) {
  validateTransaction(data);
  const count = data.recurring ? Number(data.repeatMonths || 1) : Number(data.installments || 1);
  const cents = Math.round(Number(data.amount) * 100);
  if (!data.recurring && cents < count) throw Object.assign(new Error('O valor deve permitir pelo menos R$ 0,01 por parcela.'), { statusCode: 400 });
  const [year, month, day] = data.date.split('-').map(Number);
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(Date.UTC(year, month - 1 + index, 1));
    const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
    date.setUTCDate(Math.min(day, lastDay));
    return { ...data, id: randomUUID(),
      name: !data.recurring && count > 1 ? `${data.name} (${index + 1}/${count})` : data.name,
      amount: (data.recurring ? cents : Math.floor(cents / count) + (index < cents % count ? 1 : 0)) / 100,
      date: date.toISOString().slice(0, 10), status: index === 0 ? (data.status || 'settled') : 'pending',
      recurring: Boolean(data.recurring), installments: Number(data.installments || 1), createdAt: new Date().toISOString() };
  });
}

async function createTransaction(data) {
  const transactions = buildTransactions(data);
  if (isDatabaseConfigured()) {
    const params = [];
    const values = transactions.map(item => {
      const row = [item.id, item.userId, item.type, item.name, item.description || null, item.category || null, item.amount, item.date, item.paymentMethod || null, item.account || null, item.recurring, item.installments, item.notes || null, item.status];
      return `(${row.map(value => { params.push(value); return `$${params.length}`; }).join(',')})`;
    });
    const result = await query(`INSERT INTO transactions (id, user_id, type, name, description, category, amount, date, payment_method, account_name, recurring, installments, notes, status) VALUES ${values.join(',')} RETURNING *`, params);
    return { ...mapTransaction(result.rows[0]), status: result.rows[0].status };
  }
  getStore().transactions.push(...transactions);
  return transactions[0];
}

async function listTransactions(userId, filters = {}) {
  if (isDatabaseConfigured()) {
    const clauses = ['user_id = $1']; const params = [userId];
    if (filters.type) { params.push(filters.type); clauses.push(`type = $${params.length}`); }
    if (filters.month) { params.push(Number(filters.month)); clauses.push(`EXTRACT(MONTH FROM date) = $${params.length}`); }
    if (filters.year) { params.push(Number(filters.year)); clauses.push(`EXTRACT(YEAR FROM date) = $${params.length}`); }
    const result = await query(`SELECT * FROM transactions WHERE ${clauses.join(' AND ')} ORDER BY date DESC, created_at DESC`, params);
    return result.rows.map(row => ({ ...mapTransaction(row), status: row.status || 'settled' }));
  }
  return getStore().transactions.filter((item) => item.userId === userId).filter((item) => !filters.type || item.type === filters.type).filter((item) => !filters.month || new Date(item.date).getMonth() + 1 === Number(filters.month)).filter((item) => !filters.year || new Date(item.date).getFullYear() === Number(filters.year)).sort((a, b) => new Date(b.date) - new Date(a.date));
}

module.exports = { createTransaction, listTransactions, buildTransactions };
