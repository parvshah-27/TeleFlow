const axios = require('axios');

const generateGeminiContent = async (req, res, next) => {
    const { prompt } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
        return res.status(500).json({ success: false, msg: "Gemini API key is missing on the server." });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;

    const payload = {
        contents: [{ parts: [{ text: prompt }] }]
    };

    try {
        const response = await axios.post(url, payload, {
            headers: { 'Content-Type': 'application/json' }
        });
        res.json(response.data);
    } catch (error) {
        if (error.response?.status === 429) {
            console.error("Gemini API Rate Limit Exceeded");
            return res.status(429).json({ 
                success: false, 
                msg: "AI Rate limit reached. Please wait a few seconds and try again." 
            });
        }
        console.error("Gemini API Error Detail:", error.response?.data || error.message);
        next(error);
    }
};

module.exports = { generateGeminiContent };
