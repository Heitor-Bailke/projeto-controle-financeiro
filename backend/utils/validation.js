const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function badRequest(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function requiredText(value, label, maxLength) {
  if (typeof value !== 'string' || !value.trim() || (maxLength && value.trim().length > maxLength)) {
    throw badRequest(`${label} é inválido.`);
  }
  return value.trim();
}

function validateCredentials({ name, email, password }, requireName = false) {
  if (requireName) requiredText(name, 'Nome', 120);
  if (typeof email !== 'string' || !EMAIL_PATTERN.test(email.trim()) || email.length > 255) throw badRequest('E-mail é inválido.');
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) throw badRequest('A senha deve ter entre 8 e 128 caracteres.');
}

function validateTransaction(payload) {
  if (payload.status !== undefined && !['pending', 'settled'].includes(payload.status)) throw badRequest('Situação inválida.');
  if (payload.recurring !== undefined && typeof payload.recurring !== 'boolean') throw badRequest('Repetição inválida.');
  if (payload.repeatMonths !== undefined && (!Number.isInteger(Number(payload.repeatMonths)) || Number(payload.repeatMonths) < 1 || Number(payload.repeatMonths) > 360)) throw badRequest('Quantidade de meses inválida.');
  if (payload.recurring && Number(payload.installments || 1) > 1) throw badRequest('Escolha parcelamento ou repetição mensal.');
  if (payload.type === 'income' && Number(payload.installments || 1) > 1) throw badRequest('Parcelamento disponível apenas para saídas.');
  requiredText(payload.name, 'Nome', 160);
  if (!['income', 'expense'].includes(payload.type)) throw badRequest('Tipo de lançamento é inválido.');
  if (!Number.isFinite(Number(payload.amount)) || Number(payload.amount) <= 0 || Number(payload.amount) > 9999999999) throw badRequest('Valor do lançamento é inválido.');
  if (typeof payload.date !== 'string' || !DATE_PATTERN.test(payload.date) || Number.isNaN(Date.parse(`${payload.date}T00:00:00Z`))) throw badRequest('Data do lançamento é inválida.');
  if (payload.installments !== undefined && (!Number.isInteger(Number(payload.installments)) || Number(payload.installments) < 1 || Number(payload.installments) > 360)) throw badRequest('Número de parcelas é inválido.');
}

function validateCategory({ name, type, color }) {
  requiredText(name, 'Nome da categoria', 120);
  if (!['income', 'expense'].includes(type)) throw badRequest('Tipo de categoria é inválido.');
  if (color && (typeof color !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(color))) throw badRequest('Cor da categoria é inválida.');
}

module.exports = { badRequest, validateCredentials, validateTransaction, validateCategory };
