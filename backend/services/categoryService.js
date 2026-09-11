const { randomUUID } = require('crypto');
const { getStore, isDatabaseConfigured, query } = require('../database/connection');
const mapCategory = (row) => ({ id: row.id, userId: row.user_id ?? row.userId, name: row.name, type: row.type, color: row.color });

async function getCategoriesForUser(userId) {
  if (isDatabaseConfigured()) return (await query('SELECT * FROM categories WHERE user_id IS NULL OR user_id = $1 ORDER BY name', [userId])).rows.map(mapCategory);
  return getStore().categories.filter((category) => !category.userId || category.userId === userId);
}
async function createCategoryForUser({ userId, name, type, color }) {
  if (isDatabaseConfigured()) return mapCategory((await query('INSERT INTO categories (id,user_id,name,type,color) VALUES ($1,$2,$3,$4,$5) RETURNING *', [randomUUID(), userId, name, type, color || '#6366f1'])).rows[0]);
  const category = { id: `category-${Date.now()}`, userId, name, type, color: color || '#6366f1' }; getStore().categories.push(category); return category;
}
async function deleteCategoryForUser({ userId, categoryId }) {
  if (isDatabaseConfigured()) {
    const deleted = await query('DELETE FROM categories WHERE id = $1 AND user_id = $2 RETURNING name', [categoryId, userId]);
    if (!deleted.rowCount) { const error = new Error('Categoria não encontrada.'); error.statusCode = 404; throw error; }
    return true;
  }
  const store = getStore(); const index = store.categories.findIndex((category) => category.id === categoryId && category.userId === userId);
  if (index === -1) { const error = new Error('Categoria não encontrada.'); error.statusCode = 404; throw error; }
  store.categories.splice(index, 1); return true;
}
module.exports = { getCategoriesForUser, createCategoryForUser, deleteCategoryForUser };
