const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { randomBytes } = require('node:crypto');
const path = require('node:path');
const secret = () => randomBytes(32).toString('hex');
const load = (access, refresh) => spawnSync(process.execPath, ['-e', "require('./config/env')"], {
  cwd: path.resolve(__dirname, '..'),
  env: { ...process.env, NODE_ENV: 'development', JWT_SECRET: access, JWT_REFRESH_SECRET: refresh },
  encoding: 'utf8'
});
test('rejects missing, short or repeated JWT secrets even in development', () => {
  const value = secret();
  for (const pair of [['', ''], ['short', value], [value, 'short'], [value, value]]) {
    assert.notEqual(load(...pair).status, 0);
  }
});
test('accepts distinct configured JWT secrets', () => {
  assert.equal(load(secret(), secret()).status, 0);
});
