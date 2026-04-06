const axios = require('axios');
require('dotenv').config();

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    try {
        const response = await axios.get(url);
        console.log('Available models:', response.data.models.map(m => m.name));
    } catch (error) {
        console.error('Error:', error.response ? error.response.status + " " + JSON.stringify(error.response.data) : error.message);
    }
}

listModels();
