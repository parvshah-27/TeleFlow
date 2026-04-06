const axios = require('axios');

async function testGemini() {
    try {
        const response = await axios.post('http://localhost:5002/api/gemini/generate', {
            prompt: 'Refine this note: customer is angry'
        });
        console.log('Success:', response.data);
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

testGemini();
