const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { resetStore, getStore } = require('../database/connection');
const { registerUser, loginUser, refreshSession, revokeRefreshToken, resetPassword } = require('../services/authService');

test('register and login create a session', async () => {
  resetStore();
  const user = await registerUser({ name: 'Ana', email: 'ana@example.com', password: 'abc12345' });
  assert.equal(user.name, 'Ana');

  const session = await loginUser({ email: 'ana@example.com', password: 'abc12345' });
  assert.ok(session.accessToken);
  assert.equal(session.user.email, 'ana@example.com');
});

test('password reset token changes password once and revokes old password', async () => {
  resetStore();
  const user = await registerUser({ name: 'Bia', email: 'bia@example.com', password: 'abc12345' });
  const token = 'token-de-teste';
  getStore().passwordResetTokens.push({
    userId: user.id,
    tokenHash: crypto.createHash('sha256').update(token).digest('hex'),
    expiresAt: new Date(Date.now() + 60 * 60 * 1000)
  });

  await resetPassword(token, 'novaSenha123');
  await assert.rejects(() => loginUser({ email: user.email, password: 'abc12345' }), /Credenciais inválidas/);
  const session = await loginUser({ email: user.email, password: 'novaSenha123' });
  assert.equal(session.user.email, user.email);
  await assert.rejects(() => resetPassword(token, 'outraSenha123'), /inválido ou expirou/);
});

test('logout revokes the refresh token server-side', async () => {
  resetStore();
  await registerUser({ name: 'Caio', email: 'caio@example.com', password: 'abc12345' });
  const session = await loginUser({ email: 'caio@example.com', password: 'abc12345' });
  await revokeRefreshToken(session.refreshToken);
  await assert.rejects(() => refreshSession(session.refreshToken), /Refresh token inválido/);
});

test('blocks an identifier after repeated failed logins', async () => {
  resetStore();
  await registerUser({ name: 'Dani', email: 'dani@example.com', password: 'abc12345' });
  for (let attempt = 0; attempt < 5; attempt += 1) {
    await assert.rejects(() => loginUser({ email: 'dani@example.com', password: 'senha-errada' }), /Credenciais inválidas/);
  }
  await assert.rejects(() => loginUser({ email: 'dani@example.com', password: 'abc12345' }), /Muitas tentativas/);
});
