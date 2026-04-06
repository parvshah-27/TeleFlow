const axios = require('axios');
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

async function listModels() {
    try {
        const response = await axios.get(url);
        console.log('Available Models:');
        response.data.models.forEach(m => {
            console.log(`- ${m.name} (Supported: ${m.supportedGenerationMethods.join(', ')})`);
        });
    } catch (error) {
        console.error('Error listing models:', error.response?.data || error.message);
    }
}

listModels();
