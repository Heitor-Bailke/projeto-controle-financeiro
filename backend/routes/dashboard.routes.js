const express = require('express');
const authMiddleware = require('../middlewares/auth');
const { getDashboard } = require('../controllers/dashboardController');

const router = express.Router();
router.get('/', authMiddleware, getDashboard);

module.exports = router;
