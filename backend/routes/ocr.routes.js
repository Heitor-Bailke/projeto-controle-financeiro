const express = require('express');
const authMiddleware = require('../middlewares/auth');
const { processImage } = require('../controllers/ocrController');

const router = express.Router();
router.post('/parse', authMiddleware, processImage);

module.exports = router;
