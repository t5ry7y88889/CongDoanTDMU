const { GoogleGenAI } = require('@google/genai');

// =========================================================================
// 1. NLP ALGORITHMS (TF-IDF & SENTENCE RANKING SUMMARIZER)
// =========================================================================
function extractTfIdfKeywords(text, topN = 6) {
  if (!text) return [];
  const vietnameseStopWords = new Set([
    'và', 'của', 'các', 'cho', 'trong', 'với', 'là', 'được', 'có', 'để', 'một',
    'những', 'nhiều', 'về', 'như', 'từ', 'theo', 'tại', 'ra', 'khi', 'đến', 'này',
    'đó', 'thì', 'ở', 'lại', 'bởi', 'do', 'đã', 'sẽ', 'đang', 'phải', 'không'
  ]);
  const words = text.toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"“”'’+–]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !vietnameseStopWords.has(w));

  const freqMap = {};
  words.forEach(w => { freqMap[w] = (freqMap[w] || 0) + 1; });

  return Object.entries(freqMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(entry => entry[0]);
}

function summarizeTextNlp(text, targetWordLimit = 50) {
  if (!text) return "";
  const plainText = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const sentences = plainText.split(/(?<=[.!?])\s+/).filter(s => s.length > 15);
  if (sentences.length <= 2) return sentences.join(' ');

  const keywords = extractTfIdfKeywords(plainText, 10);
  const scoredSentences = sentences.map((sentence, idx) => {
    let score = 0;
    keywords.forEach(kw => {
      if (sentence.toLowerCase().includes(kw)) score += 2;
    });
    if (idx === 0) score += 5;
    if (idx === 1) score += 3;
    return { sentence, score, idx };
  });

  scoredSentences.sort((a, b) => b.score - a.score);
  const topSentences = scoredSentences.slice(0, 2).sort((a, b) => a.idx - b.idx);
  return topSentences.map(s => s.sentence).join(' ');
}

// =========================================================================
// 2. ROBUST JSON EXTRACTOR
// =========================================================================
function extractJsonFromText(text) {
  if (!text) throw new Error("Phản hồi rỗng từ AI");
  let cleaned = text.trim();
  // 1. Try stripping markdown blocks
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // 2. Try regex extraction of first outer JSON object {...}
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (e2) {
        throw new Error("Không thể trích xuất JSON hợp lệ từ AI: " + e2.message);
      }
    }
    throw new Error("AI không trả về đúng định dạng JSON: " + e.message);
  }
}

// =========================================================================
// 3. GROQ NATIVE API CALLER
// =========================================================================
async function callGroqAPI(promptContent, systemPrompt, groqApiKey) {
  const fetch = (await import('node-fetch')).default || globalThis.fetch;
  const cleanKey = (groqApiKey || "").trim();

  // 1. Dynamically query models
  let availableModels = [];
  try {
    const listRes = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { 'Authorization': `Bearer ${cleanKey}` }
    });
    if (listRes.ok) {
      const listData = await listRes.json();
      availableModels = (listData.data || []).map(m => m.id);
    }
  } catch (e) {
    console.warn("[Groq Model List Warning]:", e.message);
  }

  // 2. Priority order: Reliable compound/chat models first
  const preferredModels = [
    'groq/compound-mini',
    'groq/compound',
    'openai/gpt-oss-120b',
    'openai/gpt-oss-20b',
    'qwen/qwen3.6-27b',
    'allam-2-7b'
  ];

  let modelsToTry = [];
  for (const p of preferredModels) {
    if (availableModels.includes(p)) modelsToTry.push(p);
  }
  for (const a of availableModels) {
    if (!modelsToTry.includes(a) && !a.includes('whisper') && !a.includes('vision') && !a.includes('guard')) {
      modelsToTry.push(a);
    }
  }
  if (modelsToTry.length === 0) modelsToTry = preferredModels;

  let lastError = null;

  for (const model of modelsToTry) {
    for (const useJsonFormat of [true, false]) {
      try {
        console.log(`[Calling Groq]: Model=${model}, jsonMode=${useJsonFormat}...`);
        
        const payload = {
          model: model,
          messages: [
            { 
              role: 'system', 
              content: systemPrompt + "\n\nBẠN PHẢI TRẢ VỀ DUY NHẤT MỘT ĐỐI TƯỢNG JSON HỢP LỆ THEO ĐÚNG CẤU TRÚC ĐÃ CHO." 
            },
            { role: 'user', content: promptContent }
          ],
          temperature: 0.3
        };

        if (useJsonFormat) {
          payload.response_format = { type: "json_object" };
        }

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${cleanKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errData = await response.json();
          const msg = errData.error?.message || `HTTP ${response.status}`;
          if (useJsonFormat && msg.includes('Failed to validate JSON')) {
            console.warn(`[Groq ${model} JSON Mode rejected, retrying without strict json_object...]`);
            continue;
          }
          throw new Error(msg);
        }

        const data = await response.json();
        const content = data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : null;
        if (content) {
          console.log(`[Groq Success with model ${model}]`);
          return content;
        }
      } catch (err) {
        console.warn(`[Groq Model ${model} (json=${useJsonFormat}) failed]:`, err.message);
        lastError = err;
        if (err.message && (err.message.includes('Invalid API Key') || err.message.includes('invalid_api_key'))) {
          throw new Error("Khóa Groq API không hợp lệ hoặc đã bị thu hồi. Vui lòng kiểm tra lại trên console.groq.com!");
        }
      }
    }
  }

  throw lastError || new Error("Không thể kết nối đến máy chủ Groq AI");
}

// =========================================================================
// 4. ERROR HANDLER & NORMALIZERS
// =========================================================================
function handleAiError(err, res, engineName) {
  console.error(engineName + " Error:", err.message || err);
  let errorMsg = err.message || "Lỗi không xác định";
  if (err.status === 429 || errorMsg.includes('quota') || errorMsg.includes('429')) {
    errorMsg = "Khóa API của bạn đã hết lượt dùng miễn phí (Rate Limit). Vui lòng đợi khoảng 1 phút rồi thử lại!";
  } else if (err.status === 400 || errorMsg.includes('API key not valid')) {
    errorMsg = "Khóa API không hợp lệ. Vui lòng kiểm tra lại trong phần Cài đặt!";
  } else {
    errorMsg = `Lỗi kết nối ${engineName}: ` + errorMsg;
  }
  return res.json({ success: false, error: errorMsg });
}

function normalizeAiGenerateOutput(parsed, defaultPrompt) {
  let target = parsed;
  if (target && typeof target === 'object') {
    if (target.article && typeof target.article === 'object') target = target.article;
    else if (target.data && typeof target.data === 'object') target = target.data;
    else if (target.response && typeof target.response === 'object') target = target.response;
  } else {
    target = {};
  }

  let titles = [];
  if (Array.isArray(target.titles) && target.titles.length > 0) {
    titles = target.titles;
  } else if (typeof target.titles === 'string') {
    titles = [target.titles];
  } else if (target.title) {
    titles = Array.isArray(target.title) ? target.title : [target.title];
  } else {
    titles = [defaultPrompt || "Thông Báo Hoạt Động Công Đoàn TDMU"];
  }

  titles = titles.map(t => typeof t === 'string' ? t.replace(/^Tiêu đề \d+:\s*/i, '').replace(/^Tiêu đề chính:\s*/i, '').replace(/^Title:\s*/i, '').replace(/^"|"$/g, '').trim() : String(t));

  const subTitle = target.subTitle || target.subtitle || target.sub_title || "";
  const summary = target.summary || target.tom_tat || target.description || "";
  let content = target.content || target.body || target.html || target.text || target.noi_dung || target.article || "";

  if (typeof content === 'string' && content.length > 0 && !content.includes('<p>') && !content.includes('<h2>')) {
    content = content.split(/\n\n+/).map(p => `<p>${p.trim()}</p>`).join('\n');
  }

  return { titles, subTitle, summary, content };
}

function normalizeAiChatOutput(parsed) {
  let target = parsed;
  if (target && typeof target === 'object') {
    if (target.data && typeof target.data === 'object') target = target.data;
    else if (target.response && typeof target.response === 'object') target = target.response;
  } else {
    target = {};
  }

  const reply = target.reply || target.message || target.answer || target.text || "Dạ, em đã xử lý xong yêu cầu của thầy/cô rồi ạ!";
  let editAction = target.editAction || target.action || target.edit_action || "NONE";
  let editContent = target.editContent || target.content || target.edit_content || target.html || "";

  if (typeof editContent === 'string' && editContent.length > 0 && !editContent.includes('<p>') && !editContent.includes('<h2>') && !editContent.includes('<ul>')) {
    editContent = editContent.split(/\n\n+/).map(p => `<p>${p.trim()}</p>`).join('\n');
  }

  return { reply, editAction, editContent };
}

module.exports = {
  GoogleGenAI,
  extractTfIdfKeywords,
  summarizeTextNlp,
  extractJsonFromText,
  callGroqAPI,
  handleAiError,
  normalizeAiGenerateOutput,
  normalizeAiChatOutput
};
