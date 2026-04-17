const axios = require('axios');

const generateGeminiContent = async (req, res, next) => {
    const { prompt } = req.body;
    console.log("Gemini Request Prompt:", prompt?.substring(0, 50) + "...");
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;

    const payload = {
        system_instruction: {
            parts: [{ text: "You are a professional telecalling assistant. When asked to refine notes or generate messages, return ONLY the final refined text. Do not provide explanations, introductory remarks, or multiple options unless specifically asked. Be concise and professional." }]
        },
        contents: [{ parts: [{ text: prompt }] }]
    };

    try {
        const response = await axios.post(url, payload, {
            headers: { 'Content-Type': 'application/json' }
        });
        console.log("Gemini Response SUCCESS");
        res.json(response.data);
    } catch (error) {
        const errorMsg = error.response?.data?.error?.message || error.message;
        console.error("Gemini Controller ERROR:", errorMsg);
        res.status(error.response?.status || 500).json({ 
            msg: "Gemini API Error", 
            error: errorMsg 
        });
    }
};

module.exports = { generateGeminiContent };
