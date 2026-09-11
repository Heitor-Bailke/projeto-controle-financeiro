const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');
const { findUserById } = require('../services/authService');
function readCookie(header, name) {
  const value = header?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  if (!value) return '';
  try { return decodeURIComponent(value.slice(name.length + 1)); } catch (_) { return ''; }
}
async function authMiddleware(req, res, next) {
  const header = req.headers.authorization || ''; const token = header.startsWith('Bearer ') ? header.slice(7) : readCookie(req.headers.cookie, 'contas_access_token');
  if (!token) return res.status(401).json({ message: 'Token de acesso ausente.' });
  try { const payload = jwt.verify(token, jwtSecret); const user = await findUserById(payload.sub); if (!user) return res.status(401).json({ message: 'Usuário não encontrado.' }); req.user = { id: user.id, email: user.email, name: user.name }; return next(); } catch (_) { return res.status(401).json({ message: 'Token inválido.' }); }
}
module.exports = authMiddleware;
