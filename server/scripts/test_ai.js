const path = require('path');
require('dotenv').config({ path: 'Z:/Tailieu/DoAnCSNganh/tdmu-congdoan-web/.env' });
const { GoogleGenAI } = require('@google/genai');

const key = process.env.GEMINI_API_KEY;
console.log('Gemini API key present:', !!key, 'Length:', key?.length);

const ai = new GoogleGenAI({ apiKey: key });

async function testGemini() {
  const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-flash-latest'];
  for (const m of models) {
    try {
      console.log(`Testing model: ${m}...`);
      const res = await ai.models.generateContent({
        model: m,
        contents: 'Xin chào'
      });
      console.log(`SUCCESS with ${m}:`, res.text?.slice(0, 50));
      return m;
    } catch (e) {
      console.log(`FAILED with ${m}:`, e.message?.slice(0, 80));
    }
  }
}

testGemini().then(m => console.log('Working model:', m));
