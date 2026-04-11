const express = require('express');
const router = express.Router();
const { generateGeminiContent } = require('../controllers/gemini.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.post('/generate', authMiddleware, generateGeminiContent);

module.exports = router;
