const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const { databaseUrl } = require('../config/env');

const memoryStore = {
  users: [],
  transactions: [],
  categories: [
    { id: 'cat-1', name: 'Mercado', type: 'expense', color: '#f59e0b' },
    { id: 'cat-2', name: 'Lazer', type: 'expense', color: '#ec4899' },
    { id: 'cat-3', name: 'Salário', type: 'income', color: '#10b981' },
    { id: 'cat-4', name: 'Transporte', type: 'expense', color: '#3b82f6' }
  ],
  refreshTokens: [],
  passwordResetTokens: [],
  loginAttempts: []
};

let pool = null;
let ready = Promise.resolve();

function initDatabase() {
  if (databaseUrl) {
    pool = new Pool({ connectionString: databaseUrl, ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : undefined });
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    ready = pool.query(schema);
  }
  return pool;
}

async function query(text, params = []) {
  if (pool) {
    await ready;
    return pool.query(text, params);
  }

  throw new Error('PostgreSQL não está configurado para esta execução.');
}

function isDatabaseConfigured() {
  return Boolean(pool);
}

function getStore() {
  return memoryStore;
}

function resetStore() {
  memoryStore.users = [];
  memoryStore.transactions = [];
  memoryStore.categories = [
    { id: 'cat-1', name: 'Mercado', type: 'expense', color: '#f59e0b' },
    { id: 'cat-2', name: 'Lazer', type: 'expense', color: '#ec4899' },
    { id: 'cat-3', name: 'Salário', type: 'income', color: '#10b981' },
    { id: 'cat-4', name: 'Transporte', type: 'expense', color: '#3b82f6' }
  ];
  memoryStore.refreshTokens = [];
  memoryStore.passwordResetTokens = [];
  memoryStore.loginAttempts = [];
}

module.exports = { initDatabase, query, isDatabaseConfigured, getStore, resetStore };
