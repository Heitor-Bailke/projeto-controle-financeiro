const express = require('express');
const authMiddleware = require('../middlewares/auth');
const { create, list } = require('../controllers/transactionsController');

const router = express.Router();
router.post('/', authMiddleware, create);
router.get('/', authMiddleware, list);

module.exports = router;
