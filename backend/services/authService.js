const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { getStore, isDatabaseConfigured, query } = require('../database/connection');
const { hashPassword, comparePassword } = require('../utils/crypto');
const { jwtSecret, jwtRefreshSecret, jwtExpiresIn, jwtRefreshExpiresIn } = require('../config/env');
const defaultAvatar = 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=80&q=80';
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
const mapUser = (row) => ({ id: row.id, name: row.name, email: row.email, password: row.password_hash ?? row.password, avatar: row.avatar });
const createError = (message, statusCode) => Object.assign(new Error(message), { statusCode });
function generateAccessToken(user) { return jwt.sign({ sub: user.id, email: user.email }, jwtSecret, { expiresIn: jwtExpiresIn }); }
function generateRefreshToken(user) { return jwt.sign({ sub: user.id, type: 'refresh', jti: crypto.randomUUID() }, jwtRefreshSecret, { expiresIn: jwtRefreshExpiresIn }); }
function verifyRefreshToken(token) { return jwt.verify(token, jwtRefreshSecret); }
function serializeUser(user) { return { id: user.id, name: user.name, email: user.email, avatar: user.avatar }; }

async function registerUser({ name, email, password }) {
  const normalizedEmail = email.trim().toLowerCase(); const hashedPassword = await hashPassword(password);
  if (isDatabaseConfigured()) {
    try {
      const id = crypto.randomUUID();
      const result = await query('INSERT INTO users (id,name,email,password_hash,avatar) VALUES ($1,$2,$3,$4,$5) RETURNING *', [id, name.trim(), normalizedEmail, hashedPassword, defaultAvatar]);
      await Promise.all([
        ['Mercado', 'expense', '#f59e0b'], ['Lazer', 'expense', '#ec4899'], ['Salário', 'income', '#10b981'], ['Transporte', 'expense', '#3b82f6']
      ].map(([categoryName, type, color]) => query('INSERT INTO categories (id,user_id,name,type,color) VALUES ($1,$2,$3,$4,$5)', [crypto.randomUUID(), id, categoryName, type, color])));
      return serializeUser(mapUser(result.rows[0]));
    } catch (error) { if (error.code === '23505') throw createError('E-mail já está em uso.', 409); throw error; }
  }
  const store = getStore(); if (store.users.some((user) => user.email === normalizedEmail)) throw createError('E-mail já está em uso.', 409);
  const user = { id: `user-${Date.now()}`, name: name.trim(), email: normalizedEmail, password: hashedPassword, avatar: defaultAvatar }; store.users.push(user); return serializeUser(user);
}

async function findUserByEmail(email) {
  if (isDatabaseConfigured()) { const result = await query('SELECT * FROM users WHERE email = $1', [email]); return result.rowCount ? mapUser(result.rows[0]) : null; }
  return getStore().users.find((user) => user.email === email) || null;
}
async function findUserById(id) {
  if (isDatabaseConfigured()) { const result = await query('SELECT * FROM users WHERE id = $1', [id]); return result.rowCount ? mapUser(result.rows[0]) : null; }
  return getStore().users.find((user) => user.id === id) || null;
}

async function loginUser({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase(); let user = await findUserByEmail(normalizedEmail);
  if (!user || !(await comparePassword(password, user.password))) throw createError('Credenciais inválidas.', 401);
  const accessToken = generateAccessToken(user); const refreshToken = generateRefreshToken(user); const expiresAt = new Date(Date.now() + 7 * 86400000);
  if (isDatabaseConfigured()) await query('INSERT INTO refresh_tokens (token_hash,user_id,expires_at) VALUES ($1,$2,$3)', [hashToken(refreshToken), user.id, expiresAt]);
  else getStore().refreshTokens.push({ userId: user.id, token: refreshToken });
  return { user: serializeUser(user), accessToken, refreshToken };
}

async function refreshSession(refreshToken) {
  const payload = verifyRefreshToken(refreshToken); let user;
  if (isDatabaseConfigured()) {
    const stored = await query('DELETE FROM refresh_tokens WHERE token_hash = $1 AND expires_at > NOW() RETURNING user_id', [hashToken(refreshToken)]);
    if (!stored.rowCount) throw createError('Refresh token inválido.', 401); user = await findUserById(payload.sub);
  } else { const store = getStore(); const index = store.refreshTokens.findIndex((entry) => entry.token === refreshToken); if (index < 0) throw createError('Refresh token inválido.', 401); store.refreshTokens.splice(index, 1); user = await findUserById(payload.sub); }
  if (!user) throw createError('Usuário não encontrado.', 404);
  const nextRefreshToken = generateRefreshToken(user); const expiresAt = new Date(Date.now() + 7 * 86400000);
  if (isDatabaseConfigured()) await query('INSERT INTO refresh_tokens (token_hash,user_id,expires_at) VALUES ($1,$2,$3)', [hashToken(nextRefreshToken), user.id, expiresAt]); else getStore().refreshTokens.push({ userId: user.id, token: nextRefreshToken });
  return { user: serializeUser(user), accessToken: generateAccessToken(user), refreshToken: nextRefreshToken };
}

async function changePassword(userId, currentPassword, newPassword) {
  const user = await findUserById(userId); if (!user) throw createError('Usuário não encontrado.', 404); if (!(await comparePassword(currentPassword, user.password))) throw createError('Senha atual incorreta.', 401);
  const password = await hashPassword(newPassword); if (isDatabaseConfigured()) { await query('UPDATE users SET password_hash = $1 WHERE id = $2', [password, userId]); await query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]); } else { user.password = password; getStore().refreshTokens = getStore().refreshTokens.filter((entry) => entry.userId !== userId); }
}
module.exports = { registerUser, loginUser, refreshSession, changePassword, serializeUser, generateAccessToken, generateRefreshToken, findUserById };
