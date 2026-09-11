const { registerUser, loginUser, refreshSession, revokeRefreshToken, changePassword, requestPasswordReset, resetPassword } = require('../services/authService');
const { validateCredentials } = require('../utils/validation');
const { cookieSecure } = require('../config/env');

function setSessionCookies(res, session) {
  const options = { httpOnly: true, secure: cookieSecure, sameSite: 'strict', path: '/' };
  res.cookie('contas_access_token', session.accessToken, { ...options, maxAge: 15 * 60 * 1000 });
  res.cookie('contas_refresh_token', session.refreshToken, { ...options, maxAge: 7 * 24 * 60 * 60 * 1000 });
}

function clearSessionCookies(res) {
  const options = { httpOnly: true, secure: cookieSecure, sameSite: 'strict', path: '/' };
  res.clearCookie('contas_access_token', options);
  res.clearCookie('contas_refresh_token', options);
}

async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    validateCredentials({ name, email, password }, true);
    const user = await registerUser({ name, email, password });
    return res.status(201).json({ user });
  } catch (error) { next(error); }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    validateCredentials({ email, password });
    const session = await loginUser({ email, password });
    setSessionCookies(res, session);
    return res.json({ user: session.user });
  } catch (error) { next(error); }
}

async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (typeof email !== 'string' || !email.trim()) return res.status(400).json({ message: 'E-mail é obrigatório.' });
    await requestPasswordReset(email);
    return res.json({ message: 'Se o e-mail estiver cadastrado, você receberá as instruções para redefinir sua senha.' });
  } catch (error) { next(error); }
}

async function resetPasswordHandler(req, res, next) {
  try {
    const { token, newPassword } = req.body;
    if (typeof token !== 'string' || !token) return res.status(400).json({ message: 'Token de recuperação é obrigatório.' });
    validateCredentials({ email: 'reset@example.com', password: newPassword });
    await resetPassword(token, newPassword);
    return res.json({ message: 'Senha redefinida com sucesso.' });
  } catch (error) { next(error); }
}

function me(req, res) { return res.json({ user: req.user }); }

async function refresh(req, res, next) {
  try {
    const refreshToken = req.body.refreshToken || req.headers.cookie?.split(';').map((part) => part.trim()).find((part) => part.startsWith('contas_refresh_token='))?.slice('contas_refresh_token='.length);
    if (typeof refreshToken !== 'string' || !refreshToken) {
      return res.status(400).json({ message: 'Refresh token é obrigatório.' });
    }
    const session = await refreshSession(decodeURIComponent(refreshToken));
    setSessionCookies(res, session);
    return res.json({ user: session.user });
  } catch (error) { next(error); }
}

async function logout(req, res, next) {
  try {
    const cookie = req.headers.cookie?.split(';').map((part) => part.trim()).find((part) => part.startsWith('contas_refresh_token='));
    const refreshToken = cookie ? decodeURIComponent(cookie.slice('contas_refresh_token='.length)) : '';
    await revokeRefreshToken(refreshToken);
  } catch (error) {
    return next(error);
  }
  clearSessionCookies(res);
  return res.status(204).send();
}

async function changePasswordHandler(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    validateCredentials({ email: req.user.email, password: currentPassword });
    validateCredentials({ email: req.user.email, password: newPassword });
    await changePassword(req.user.id, currentPassword, newPassword);
    return res.json({ message: 'Senha alterada com sucesso.' });
  } catch (error) { next(error); }
}

module.exports = { register, login, forgotPassword, resetPasswordHandler, me, refresh, logout, changePasswordHandler };
