const { listTransactions } = require('../services/expenseService');

async function getDashboard(req, res, next) {
  try {
    const transactions = await listTransactions(req.user.id);
    const expenses = transactions.filter((item) => item.type === 'expense' && item.status !== 'pending');
    const incomes = transactions.filter((item) => item.type === 'income' && item.status !== 'pending');
    const totalExpense = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
    const totalIncome = incomes.reduce((sum, item) => sum + Number(item.amount), 0);
    const categories = expenses.reduce((acc, item) => { const name = item.category || 'Outros'; acc[name] = (acc[name] || 0) + Number(item.amount); return acc; }, {});
    res.json({ monthLabel: new Date().toLocaleString('pt-BR', { month: 'long' }), balance: totalIncome - totalExpense, totalExpense, totalIncome, totalSaved: totalIncome - totalExpense, expenseCount: expenses.length, incomeCount: incomes.length, goal: 5000, biggestExpense: [...expenses].sort((a, b) => b.amount - a.amount)[0] || null, recentTransactions: transactions.slice(0, 6), categories: Object.entries(categories).map(([name, value]) => ({ name, value })) });
  } catch (error) { next(error); }
}
module.exports = { getDashboard };
