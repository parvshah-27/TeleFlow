const axios = require('axios');
require('dotenv').config();

async function testDirectGemini() {
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro:generateContent?key=${apiKey}`;

    const payload = {
        contents: [{ parts: [{ text: "Hello" }] }]
    };

    try {
        const response = await axios.post(url, payload, {
            headers: { 'Content-Type': 'application/json' }
        });
        console.log('Success:', response.data);
    } catch (error) {
        console.error('Error:', error.response ? error.response.status + " " + JSON.stringify(error.response.data) : error.message);
    }
}

testDirectGemini();
