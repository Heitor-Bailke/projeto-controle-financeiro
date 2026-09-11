const express = require('express');
const authMiddleware = require('../middlewares/auth');
const { create, list, update, remove } = require('../controllers/transactionsController');

const router = express.Router();
router.post('/', authMiddleware, create);
router.get('/', authMiddleware, list);
router.patch('/:id', authMiddleware, update);
router.delete('/:id', authMiddleware, remove);

module.exports = router;
