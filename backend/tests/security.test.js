const test = require('node:test');
const assert = require('node:assert/strict');
const { isOriginAllowed } = require('../middlewares/security');

test('allows localhost development origins for the Angular frontend', () => {
  assert.equal(isOriginAllowed('http://localhost:4200'), true);
  assert.equal(isOriginAllowed('http://localhost:53929'), true);
  assert.equal(isOriginAllowed('http://127.0.0.1:4200'), true);
  assert.equal(isOriginAllowed('https://example.com'), false);
});
