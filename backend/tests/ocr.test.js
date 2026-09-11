const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeOcrResult } = require('../services/ocrService');

test('normaliza um resultado de OCR com campos financeiros', () => {
  const result = normalizeOcrResult({
    amount: '125.90',
    date: '2026-08-03',
    time: '14:30',
    merchant: 'Mercado Central',
    category: 'Mercado'
  });

  assert.equal(result.amount, '125.90');
  assert.equal(result.date, '2026-08-03');
  assert.equal(result.merchant, 'Mercado Central');
  assert.equal(result.category, 'Mercado');
});
