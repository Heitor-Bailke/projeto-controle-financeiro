const { createTransaction, listTransactions } = require('../services/expenseService');
const { validateTransaction } = require('../utils/validation');

async function create(req, res, next) {
  try {
    validateTransaction(req.body);
    const transaction = await createTransaction({ ...req.body, userId: req.user.id });
    res.status(201).json(transaction);
  } catch (error) { next(error); }
}

async function list(req, res, next) {
  try { res.json(await listTransactions(req.user.id, req.query)); } catch (error) { next(error); }
}

module.exports = { create, list };
