const express = require('express');
const authMiddleware = require('../middlewares/auth');
const { list, create, remove } = require('../controllers/categoriesController');

const router = express.Router();
router.get('/', authMiddleware, list);
router.post('/', authMiddleware, create);
router.delete('/:id', authMiddleware, remove);

module.exports = router;
