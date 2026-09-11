const test = require('node:test');
const assert = require('node:assert/strict');
const { resetStore } = require('../database/connection');
const { registerUser, loginUser } = require('../services/authService');

test('register and login create a session', async () => {
  resetStore();
  const user = await registerUser({ name: 'Ana', email: 'ana@example.com', password: 'abc12345' });
  assert.equal(user.name, 'Ana');

  const session = await loginUser({ email: 'ana@example.com', password: 'abc12345' });
  assert.ok(session.accessToken);
  assert.equal(session.user.email, 'ana@example.com');
});
