const express = require('express');
console.log("DEBUG: Gemini Routes file loading...");
const router = express.Router();
const { generateGeminiContent } = require('../controllers/gemini.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.post('/generate', authMiddleware, generateGeminiContent);

module.exports = router;
