const path = require('path');
require('dotenv').config({ path: 'Z:/Tailieu/DoAnCSNganh/tdmu-congdoan-web/.env' });
const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');

const key = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: key });

const imgPath = 'Z:/Tailieu/DoAnCSNganh/tdmu-congdoan-web/frontend/dist/images/sports.jpg';
console.log('Testing image exists:', fs.existsSync(imgPath));

if (fs.existsSync(imgPath)) {
  const base64 = fs.readFileSync(imgPath).toString('base64');
  ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64
        }
      },
      'Hãy viết một câu chú thích báo chí ngắn gọn mô tả bức ảnh này.'
    ]
  }).then(res => {
    console.log('VISION SUCCESS:', res.text);
    process.exit(0);
  }).catch(err => {
    console.error('VISION FAILED:', err.message);
    process.exit(1);
  });
}
