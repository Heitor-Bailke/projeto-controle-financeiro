const express = require('express');
const { register, login, me, refresh, changePasswordHandler } = require('../controllers/authController');
const authMiddleware = require('../middlewares/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authMiddleware, me);
router.post('/refresh', refresh);
router.post('/change-password', authMiddleware, changePasswordHandler);

module.exports = router;
