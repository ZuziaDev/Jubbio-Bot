const { OpenAI } = require('openai');
require('dotenv').config();

const openai = new OpenAI({
    apiKey: process.env.API_KEY,
    baseURL: process.env.API_URL,
});

module.exports = openai;
