const { getCategoriesForUser, createCategoryForUser, deleteCategoryForUser } = require('../services/categoryService');
const { validateCategory } = require('../utils/validation');

async function list(req, res, next) {
  try { res.json(await getCategoriesForUser(req.user.id)); } catch (error) { next(error); }
}

async function create(req, res, next) {
  try {
    validateCategory(req.body);
    res.status(201).json(await createCategoryForUser({ ...req.body, userId: req.user.id }));
  } catch (error) { next(error); }
}

async function remove(req, res, next) {
  try {
    await deleteCategoryForUser({ userId: req.user.id, categoryId: req.params.id });
    res.json({ message: 'Categoria removida com sucesso.' });
  } catch (error) { next(error); }
}

module.exports = { list, create, remove };
