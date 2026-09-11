const express = require('express');
const { register, login, forgotPassword, resetPasswordHandler, me, refresh, logout, changePasswordHandler } = require('../controllers/authController');
const rateLimit = require('express-rate-limit');
const authMiddleware = require('../middlewares/auth');

const router = express.Router();
const credentialLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false });
const recoveryLimit = rateLimit({ windowMs: 60 * 60 * 1000, max: 5, standardHeaders: true, legacyHeaders: false });

router.post('/register', register);
router.post('/login', credentialLimit, login);
router.post('/forgot-password', recoveryLimit, forgotPassword);
router.post('/reset-password', recoveryLimit, resetPasswordHandler);
router.get('/me', authMiddleware, me);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.post('/change-password', authMiddleware, changePasswordHandler);

module.exports = router;
