const test = require('node:test');
const assert = require('node:assert/strict');
const { isOriginAllowed } = require('../middlewares/security');

test('allows localhost development origins for the Angular frontend', () => {
  assert.equal(isOriginAllowed('http://localhost:4200'), true);
  assert.equal(isOriginAllowed('http://localhost:53929'), true);
  assert.equal(isOriginAllowed('http://127.0.0.1:4200'), true);
  assert.equal(isOriginAllowed('https://example.com'), false);
});

test('does not allow arbitrary localhost origins in production', () => {
  assert.equal(isOriginAllowed('http://localhost:53929', 'production'), false);
  assert.equal(isOriginAllowed('http://127.0.0.1:4200', 'production'), false);
});
