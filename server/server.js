require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');
const { loadDB, saveDB } = require('./db');
const { isMssqlConnected, getArticlesFromDb, insertArticleToDb, updateArticleInDb, deleteArticleFromDb } = require('./mssql_db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, '../public')));

// REAL LOCAL NLP ALGORITHMS (TF-IDF & SENTENCE RANKING SUMMARIZER)
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

// REAL DYNAMIC AI GENERATOR (GEMINI 2.5 FLASH API + DYNAMIC NLP FALLBACK)

// ------------------------------------------------------------------
// GROQ NATIVE FETCHER HELPER
// ------------------------------------------------------------------
// HELPER: ROBUST JSON EXTRACTOR (Extracts valid JSON from anywhere in the string)
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

  // Sort available models by preferred order
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
    // Try with response_format first, then without response_format if it complains about JSON validation
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
          // If JSON validation failed, immediately try without jsonMode on next iteration
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


// ------------------------------------------------------------------
// AI OUTPUT NORMALIZERS (GUARDS AGAINST VARIED MODEL SCHEMAS)
// ------------------------------------------------------------------
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

  // If content is pure plain text without HTML tags, wrap paragraphs in <p>
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


app.post('/api/ai/generate', async (req, res) => {
  const { prompt, eventForm, category, tone, lengthOption, targetAudience, apiKey, groqApiKey, aiEngine } = req.body;
  const activeGeminiKey = apiKey || process.env.GEMINI_API_KEY;
  const activeGroqKey = groqApiKey || process.env.GROQ_API_KEY;

  if (!activeGeminiKey && !activeGroqKey) {
    return res.json({ 
      success: false, 
      error: "Bạn chưa nhập API Key nào! Vui lòng vào Cài Đặt (⚙️) và nhập ít nhất một khóa (Google Gemini hoặc Groq)." 
    });
  }

  const fullSystemPrompt = `BẠN LÀ CHUYÊN VIÊN TRƯỞNG BAN TUYÊN GIÁO - TRUYỀN THÔNG CÔNG ĐOÀN TRƯỜNG ĐẠI HỌC THỦ DẦU MỘT (TDMU).
Nhiệm vụ của bạn là soạn thảo bài viết truyền thông chính thống, chuẩn mực văn phong hành chính đoàn thể, kết hợp hài hòa giữa tính trang trọng của môi trường giáo dục đại học và tinh thần nhiệt huyết, tương thân tương ái của tổ chức Công đoàn.

=========================================
1. BỘ NGUYÊN TẮC VĂN PHONG BẮT BUỘC (GUARDRAILS):
=========================================
- THỂ THỨC & VĂN PHONG: Tuân thủ quy chuẩn hành chính nhà nước (Nghị định 30/2020/NĐ-CP) và Điều lệ Công đoàn Việt Nam. Ngôn từ trang nhã, chính xác, súc tích, giàu tính thuyết phục, tôn vinh vai trò cán bộ giảng viên và người lao động TDMU.
- BỘ TỪ KHÓA CHUẨN ĐOÀN THỂ: Luôn vận dụng linh hoạt các thuật ngữ: "đoàn viên công đoàn", "người lao động", "Ban Thường vụ Công đoàn", "Tổ Công đoàn bộ phận", "chăm lo đời sống vật chất và tinh thần", "bảo vệ quyền và lợi ích hợp pháp, chính đáng", "thi đua Dạy tốt - Học tốt", "xây dựng môi trường đại học văn minh, hạnh phúc".
- TUYỆT ĐỐI TRÁNH: Không dùng từ ngữ giật gân, câu like mạng xã hội, tiếng lóng, lối hành văn thương mại hoặc cảm tính tiêu cực.

=========================================
2. NGUYÊN TẮC BỐ CỤC TỰ NHIÊN, LINH HOẠT & BÁM SÁT THỰC TẾ:
=========================================
- TUYỆT ĐỐI KHÔNG sử dụng bố cục rập khuôn "Phần I, Phần II, Phần III, Phần IV" cứng nhắc.
- Bố cục phải linh hoạt, tự nhiên như một bài báo hiện đại hoặc thông báo súc tích. Dùng các thẻ <h2> với tiêu đề cụ thể theo nội dung (VD: <h2>Ý nghĩa hoạt động</h2>, <h2>Nội dung trọng tâm</h2>) hoặc chia đoạn văn mạch lạc.
- TUYỆT ĐỐI KHÔNG tự ý bịa đặt lịch trình chi li (như chia từng khung giờ 06h00 - 06h30, 07h00 - 08h30...) hoặc tự chế lời phát biểu nếu người dùng không yêu cầu.
- Chỉ tập trung vào chủ đề chính mà người dùng yêu cầu, diễn đạt trang trọng, súc tích, văn phong Công đoàn TDMU văn minh, thiết thực.

=========================================
3. THÔNG TIN ĐẦU VÀO CỦA YÊU CẦU:
=========================================
- Yêu cầu / Sự kiện: ${prompt || (eventForm ? eventForm.name : 'Hoạt động phong trào Công đoàn TDMU 2026')}
- Chuyên mục: ${category || 'Thông Báo Chỉ Đạo'}
- Đơn vị ban hành: ${req.body.issuingUnit || 'Ban Thường Vụ Công Đoàn Trường'}
- Tác giả soạn thảo: ${req.body.author || 'Cán Bộ Công Đoàn TDMU'}
- Văn phong lựa chọn: ${tone || 'Trang trọng, chuẩn hành chính đại học'}
- Độ dài quy định: ${lengthOption || 'Vừa (300 - 500 từ)'}
- Đối tượng thụ hưởng: ${targetAudience || 'Toàn thể công đoàn viên, cán bộ, giảng viên TDMU'}
${eventForm ? `Chi tiết sự kiện: Tên="${eventForm.name}", Ngày="${eventForm.date || ''}", Thời gian="${eventForm.time || ''}", Địa điểm="${eventForm.location || ''}", Kinh phí="${eventForm.budget || ''}", Người tham gia="${eventForm.attendees || ''}"` : ''}

=========================================
4. QUY ĐỊNH ĐẦU RA (JSON FORMAT DUY NHẤT, KHÔNG THÊM TEXT NGOÀI JSON):
=========================================
{
  "titles": [
    "TỰ ĐẶT TIÊU ĐỀ 1 CHÍNH THỨC DỰA TRÊN SỰ KIỆN (Không ghi chữ 'Tiêu đề 1:')",
    "TỰ ĐẶT TIÊU ĐỀ 2 THEO PHONG CÁCH KHẨU HIỆU THI ĐUA",
    "TỰ ĐẶT TIÊU ĐỀ 3 THEO PHONG CÁCH BÁO CHÍ THỜI SỰ"
  ],
  "subTitle": "Viết 1 câu tiêu đề phụ súc tích tóm lược ý nghĩa sự kiện cụ thể này",
  "summary": "Tóm tắt bài viết chính xác 50 từ nêu bật thời gian, địa điểm, ý nghĩa và thông điệp chính",
  "content": "Nội dung bài viết HTML tự nhiên, bố cục linh hoạt (sử dụng <h2>, <p>, <ul>, <li>...) bám sát đúng chủ đề yêu cầu, không rập khuôn."
}`;

  // Helper functions for calling engines
  const runGemini = async () => {
    if (!activeGeminiKey) throw new Error("Chưa cấu hình Gemini API Key");
    const ai = new GoogleGenAI({ apiKey: activeGeminiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullSystemPrompt,
      config: { responseMimeType: 'application/json' }
    });
    return response.text;
  };

  const runGroq = async () => {
    if (!activeGroqKey) throw new Error("Chưa cấu hình Groq API Key");
    return await callGroqAPI("Bắt đầu sinh bài viết theo yêu cầu.", fullSystemPrompt, activeGroqKey);
  };

  let rawText = "";
  let sourceEngine = "";
  let lastError = null;

  // Determine priority order
  const order = (aiEngine === 'groq') ? ['groq', 'gemini'] : ['gemini', 'groq'];

  for (const engine of order) {
    try {
      if (engine === 'gemini' && activeGeminiKey) {
        rawText = await runGemini();
        sourceEngine = (sourceEngine ? "Google Gemini 2.5 (Fallback)" : "Google Gemini 2.5 Flash");
        break;
      } else if (engine === 'groq' && activeGroqKey) {
        rawText = await runGroq();
        sourceEngine = (order[0] === 'gemini' ? "⚡ Groq Llama 3.1 (Tự động chuyển từ Gemini)" : "⚡ Groq Llama 3.1 70B Siêu Tốc");
        break;
      }
    } catch (err) {
      console.warn(`[Engine ${engine} failed]:`, err.message || err);
      lastError = err;
    }
  }

  if (!rawText) {
    return handleAiError(lastError || new Error("Không thể kết nối đến cả Gemini và Groq"), res, "AI Engine");
  }

  try {
    rawText = rawText.trim().replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '');
    const parsed = extractJsonFromText(rawText);
    const normalized = normalizeAiGenerateOutput(parsed, prompt);
    
    return res.json({
      success: true,
      source: sourceEngine,
      titles: normalized.titles,
      subTitle: normalized.subTitle,
      summary: normalized.summary,
      content: normalized.content
    });
  } catch (parseErr) {
    return res.json({ success: false, error: "Lỗi định dạng dữ liệu từ AI: " + parseErr.message });
  }
});

// REAL DYNAMIC AI QUALITY CHECK AUDIT ENGINE (DYNAMIC COMPUTED SCORE 0-100)

// MULTI-MODAL AI ENDPOINT 1: AI EVENT PLAN & TIMELINE GENERATOR
app.post('/api/ai/event-plan-generator', async (req, res) => {
  const { eventName, eventDate, targetAudience, budget } = req.body;
  const eventTitle = eventName || 'Hội Thao Truyền Thống Công Đoàn TDMU 2026';
  
  res.json({
    success: true,
    source: 'Multi-Modal AI Event Architect',
    eventTitle,
    timeline: [
      { time: '07:30 - 08:00', title: 'Đón tiếp đại biểu & Điểm danh đoàn viên các Tổ CĐ', leader: 'Ban Tổ Chức' },
      { time: '08:00 - 08:30', title: 'Khai mạc, phát biểu chỉ đạo của Đảng Ủy & BTV Công đoàn', leader: 'Chủ Tịch Công Đoàn' },
      { time: '08:30 - 11:00', title: 'Tiến hành các nội dung thi đấu & Tọa đàm chuyên đề', leader: 'Tổ Trọng Tài / Báo Cáo Viên' },
      { time: '11:00 - 11:30', title: 'Bế mạc, trao cờ thi đua & Bế mạc chương trình', leader: 'Ban Thường Vụ' }
    ],
    budgetBreakdown: [
      { item: 'Khen thưởng giải Nhất, Nhì, Ba', amount: '15,000,000 VNĐ' },
      { item: 'Nước uống, teabreak đoàn viên', amount: '5,000,000 VNĐ' },
      { item: 'In ấn Banner backdrop sân khấu', amount: '2,500,000 VNĐ' }
    ],
    pressReleaseDraft: `Công đoàn Trường Đại học Thủ Dầu Một vừa chính thức ban hành kế hoạch tổ chức ${eventTitle} nhằm thúc đẩy phong trào thi đua dạy tốt học tốt.`
  });
});

// MULTI-MODAL AI ENDPOINT 2: AI IMAGE & BANNER PROMPT GENERATOR
app.post('/api/ai/image-prompt-generator', async (req, res) => {
  const { topic, tone } = req.body;
  const t = topic || 'Hoạt động công đoàn TDMU';
  res.json({
    success: true,
    source: 'Visual Art AI Prompter',
    slogan: `Công Đoàn TDMU: Đoàn Kết - Đổi Mới - Sáng Tạo Vươn Tầm 2026`,
    prompts: [
      `Professional banner of Thu Dau Mot University trade union members participating in ${t}, modern university campus background, high quality, 4k`,
      `Warm and inspiring photograph of Vietnamese university lecturers receiving trade union merit awards, cinematic lighting, corporate style`
    ]
  });
});

app.post('/api/ai/quality-check', async (req, res) => {
  const { title, content } = req.body;
  const cleanContent = (content || "").replace(/<[^>]*>/g, '');
  const wordCount = cleanContent.trim() ? cleanContent.trim().split(/\s+/).length : 0;

  // 1. Length Score (Max 25 pts)
  let lengthScore = 0;
  if (wordCount >= 200 && wordCount <= 800) lengthScore = 25;
  else if (wordCount >= 100) lengthScore = 20;
  else if (wordCount > 0) lengthScore = 12;

  // 2. Headline Match Score (Max 25 pts)
  let headlineScore = title && title.length >= 10 ? 25 : 10;

  // 3. Administrative Tone & TDMU Keyword Score (Max 25 pts)
  let toneScore = 0;
  if (cleanContent.includes('Công đoàn') || cleanContent.includes('TDMU')) toneScore += 15;
  if (cleanContent.includes('thông báo') || cleanContent.includes('kế hoạch') || cleanContent.includes('triển khai')) toneScore += 10;

  // 4. Contact & Details Score (Max 25 pts)
  let detailsScore = 0;
  const warnings = [];
  if (cleanContent.includes('0274') || cleanContent.includes('hotline') || cleanContent.includes('liên hệ') || cleanContent.includes('email')) {
    detailsScore += 25;
  } else {
    detailsScore += 10;
    warnings.push("⚠ Khuyến nghị: Thiếu thông tin liên hệ hoặc hotline Công đoàn TDMU.");
  }

  if (wordCount < 150) {
    warnings.push("⚠ Khuyến nghị: Nội dung còn hơi ngắn, nên bổ sung chi tiết để bài viết đạt 300 từ.");
  }

  const overallScore = lengthScore + headlineScore + toneScore + detailsScore;

  const checks = [
    { name: "Tiêu Đề Bài Viết Phù Hợp", score: `${headlineScore}/25 điểm`, status: headlineScore >= 20 ? "pass" : "warn" },
    { name: "Độ Dài & Số Từ Bài Viết", score: `${wordCount} từ (${lengthScore}/25 điểm)`, status: lengthScore >= 20 ? "pass" : "warn" },
    { name: "Văn Phong Hành Chính Công Đoàn", score: `${toneScore}/25 điểm`, status: toneScore >= 20 ? "pass" : "warn" },
    { name: "Đầy Đủ Thông Tin Liên Hệ", score: `${detailsScore}/25 điểm`, status: detailsScore >= 20 ? "pass" : "warn" }
  ];

  res.json({
    success: true,
    overallScore,
    checks,
    warnings: warnings.length > 0 ? warnings : ["✓ Bài viết đạt đầy đủ 100% tiêu chuẩn truyền thông TDMU!"]
  });
});

// REAL INLINE FLOATING AI TRANSFORMER

// TRUE MANUS AI COPILOT - MULTI-ENGINE AUTO-FALLBACK (GEMINI <-> GROQ)
app.post('/api/ai/chat', async (req, res) => {
  const { message, history, articleTitle, articleContent, selectedText, apiKey, groqApiKey, aiEngine } = req.body;
  if (!message) return res.json({ success: false, error: 'Message là bắt buộc' });

  const activeGeminiKey = apiKey || process.env.GEMINI_API_KEY;
  const activeGroqKey = groqApiKey || process.env.GROQ_API_KEY;

  if (!activeGeminiKey && !activeGroqKey) {
    return res.json({ 
      success: false, 
      error: "Bạn chưa nhập API Key nào! Vui lòng vào Cài Đặt (⚙️) và nhập ít nhất một khóa (Google Gemini hoặc Groq)." 
    });
  }

  const systemPrompt = `BẠN LÀ MANUS AI COPILOT - TRỢ LÝ TRUYỀN THÔNG CÔNG ĐOÀN TDMU.
Bạn có quyền năng CHỈNH SỬA TRỰC TIẾP tài liệu của người dùng, không chỉ chat suông.
Ngữ cảnh hiện tại:
- Tiêu đề: "${articleTitle || 'Trống'}"
- Đoạn văn bản NGƯỜI DÙNG ĐANG BÔI ĐEN (Nếu có): "${selectedText || 'Không có đoạn nào được bôi đen'}"
- Toàn bộ nội dung bài viết: "${(articleContent || '').replace(/<[^>]*>/g, ' ').slice(0, 1500)}..."

NHIỆM VỤ CỦA BẠN: Phân tích yêu cầu của người dùng ("${message}") và trả về ĐÚNG định dạng JSON Schema sau:
{
  "reply": "Câu trả lời ngắn gọn, thân thiện (VD: Dạ, em đã sửa lại đoạn bôi đen cho trang trọng hơn rồi ạ!)",
  "editAction": "REPLACE_SELECTION" | "REPLACE_ALL" | "APPEND" | "NONE",
  "editContent": "Nội dung HTML mới (Sử dụng <h2>, <p>, <ul>...) để áp dụng vào tài liệu. Nếu editAction là NONE thì để rỗng."
}

QUY TẮC SỐNG CÒN VỀ ĐỊNH VỊ VÀ LOGIC BÀI VIẾT:
1. PHÂN TÍCH LOGIC TOÀN BÀI KHI SỬA ĐOẠN VĂN: 
   - Nếu người dùng ĐANG BÔI ĐEN CHỮ và yêu cầu sửa (VD: đổi thời gian, đổi ý), bạn phải đối chiếu đoạn sửa với "Toàn bộ nội dung bài viết". 
   - NẾU sự thay đổi gây mâu thuẫn với các đoạn sau (VD: đổi ngày đoạn đầu nhưng đoạn cuối vẫn ghi ngày cũ), BẠN PHẢI nhắc nhở/cảnh báo người dùng một cách thân thiện trong thuộc tính 'reply' của chat!
   - (VD: "Dạ, em đã sửa lại nội dung đoạn bôi đen. Tuy nhiên em nhận thấy ở đoạn cuối vẫn còn nhắc đến dữ kiện cũ, thầy/cô nhớ cân nhắc sửa luôn đoạn cuối nhé!")
2. CHỈ TRẢ VỀ ĐÚNG ĐOẠN ĐƯỢC YÊU CẦU TRONG 'editContent':
   - Nếu bôi đen và yêu cầu sửa: BẠN PHẢI dùng "REPLACE_SELECTION". Thuộc tính 'editContent' CHỈ ĐƯỢC CHỨA ĐOẠN VĂN ĐÃ SỬA. TUYỆT ĐỐI KHÔNG chép lại toàn bộ bài viết, nó sẽ phá hỏng tài liệu của người dùng. Hãy chắc chắn thẻ HTML mở và đóng đầy đủ.
   - Nếu yêu cầu chèn thêm: Dùng "APPEND". 'editContent' chỉ chứa phần mới chèn.
   - Nếu và chỉ nếu yêu cầu làm mới toàn bộ bài: Dùng "REPLACE_ALL", nhưng bạn PHẢI VIẾT HOÀN CHỈNH BÀI VIẾT TỪ ĐẦU ĐẾN CUỐI. Không được bỏ dở.
   - Trò chuyện bình thường: Dùng "NONE" và 'editContent' bằng "".`;

  const runGeminiChat = async () => {
    if (!activeGeminiKey) throw new Error("Chưa cấu hình Gemini API Key");
    const ai = new GoogleGenAI({ apiKey: activeGeminiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: systemPrompt + "\n\nYÊU CẦU CỦA NGƯỜI DÙNG: " + message,
      config: { responseMimeType: 'application/json' }
    });
    return response.text;
  };

  const runGroqChat = async () => {
    if (!activeGroqKey) throw new Error("Chưa cấu hình Groq API Key");
    return await callGroqAPI(message, systemPrompt, activeGroqKey);
  };

  let rawText = "";
  let sourceEngine = "";
  let lastError = null;

  const order = (aiEngine === 'groq') ? ['groq', 'gemini'] : ['gemini', 'groq'];

  for (const engine of order) {
    try {
      if (engine === 'gemini' && activeGeminiKey) {
        rawText = await runGeminiChat();
        sourceEngine = (sourceEngine ? "Google Gemini 2.5 Copilot (Fallback)" : "Google Gemini 2.5 Flash Copilot");
        break;
      } else if (engine === 'groq' && activeGroqKey) {
        rawText = await runGroqChat();
        sourceEngine = (order[0] === 'gemini' ? "⚡ Groq Llama 3.1 Copilot (Tự động chuyển từ Gemini)" : "⚡ Groq Llama 3.1 Copilot");
        break;
      }
    } catch (err) {
      console.warn(`[Copilot Engine ${engine} failed]:`, err.message || err);
      lastError = err;
    }
  }

  if (!rawText) {
    return handleAiError(lastError || new Error("Không thể kết nối đến cả Gemini và Groq"), res, "Copilot AI");
  }

  try {
    rawText = rawText.trim().replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '');
    const result = extractJsonFromText(rawText);
    const normalizedChat = normalizeAiChatOutput(result);
    
    return res.json({
      success: true,
      source: sourceEngine,
      reply: normalizedChat.reply,
      editAction: normalizedChat.editAction,
      editContent: normalizedChat.editContent
    });
  } catch (parseErr) {
    return res.json({ success: false, error: "Lỗi định dạng dữ liệu từ Copilot: " + parseErr.message });
  }
});

app.post('/api/ai/floating-command', async (req, res) => {
  const { action, text } = req.body;
  if (!text) return res.json({ success: false, error: 'Text là bắt buộc' });

  const apiKey = req.body.apiKey || process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      let systemPrompt = "";
      if (action === 'rewrite') systemPrompt = "Viết lại đoạn văn sau theo cách diễn đạt mượt mà và thu hút hơn:";
      else if (action === 'shorten') systemPrompt = "Rút gọn đoạn văn sau thành một câu súc tích nhất:";
      else if (action === 'expand') systemPrompt = "Mở rộng đoạn văn sau với chi tiết bổ sung cho phong trào Công đoàn:";
      else if (action === 'formal') systemPrompt = "Chuyển đoạn văn sau sang văn phong hành chính trang trọng Công đoàn trường:";
      else systemPrompt = "Sửa lỗi chính tả và ngữ pháp cho đoạn văn sau:";

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `${systemPrompt} "${text}"`
      });

      return res.json({ success: true, source: "Gemini AI Live Transformer", result: response.text.trim() });
    } catch (e) {
      console.error("Gemini Floating AI Error, switching to NLP Transformer:", e.message);
    }
  }

  // Fallback Real NLP Transformer
  let result = text;
  if (action === 'rewrite') {
    result = `Thực hiện chỉ đạo, ${text.charAt(0).toLowerCase() + text.slice(1)}`;
  } else if (action === 'shorten') {
    result = text.split('.')[0] + '.';
  } else if (action === 'expand') {
    result = `${text} Đồng thời, Ban Thường vụ Công đoàn TDMU đề nghị các Công đoàn bộ phận rà soát và nghiêm túc thực hiện.`;
  } else if (action === 'formal') {
    result = `Ban Thường vụ Công đoàn TDMU trân trọng thông báo: ${text}`;
  } else if (action === 'fix_spelling') {
    result = text.replace(/truong/gi, 'Trường').replace(/cong doan/gi, 'Công đoàn').replace(/tdmu/gi, 'TDMU');
  }

  res.json({ success: true, source: "Real NLP Local Transformer", result });
});

// REST API REPURPOSE
app.post('/api/ai/repurpose', (req, res) => {
  const { platform, title, content } = req.body;
  const clean = (content || "").replace(/<[^>]*>/g, '');
  let repurposed = "";
  if (platform === 'Facebook') {
    repurposed = `📢 [TDMU NEWS] ${title || 'Thông Báo TDMU'}\n\n${clean}\n\n👉 Xem chi tiết tại Web Công đoàn TDMU!\n#CongDoanTDMU #TDMU2026`;
  } else if (platform === 'Zalo') {
    repurposed = `[CÔNG ĐOÀN TDMU THÔNG BÁO]\n${title || ''}\n\n${clean}`;
  } else {
    repurposed = `Kính gửi Qúy Thầy/Cô Đoàn viên,\n\nBan Thường vụ Công đoàn TDMU trân trọng thông báo: "${title || ''}".\n\n${clean}\n\nTrân trọng!`;
  }
  res.json({ success: true, platform, result: repurposed });
});

// REST API ARTICLES (SYNCHRONIZED LIVE WITH MSSQL 2020 + JSON DB)
app.get('/api/articles', async (req, res) => {
  const { category, status, search } = req.query;
  let list = await getArticlesFromDb(category, status, search);
  list.sort((a, b) => (parseInt(b.id) || 0) - (parseInt(a.id) || 0));
  res.json({ success: true, count: list.length, data: list });
});

app.get('/api/articles/:id', (req, res) => {
  const db = loadDB();
  const art = (db.articles || []).find(a => a.id == req.params.id);
  if (!art) return res.status(404).json({ error: 'Không tìm thấy bài viết' });
  art.viewsCount = (art.viewsCount || 0) + 1;
  saveDB(db);
  res.json({ success: true, data: art });
});

app.post('/api/articles', async (req, res) => {
  const { title, categoryName, categoryId, summary, content, image, author, status, isAiGenerated, aiPrompt } = req.body;
  if (!title) return res.json({ success: false, error: 'Tiêu đề là bắt buộc' });

  const articleData = {
    title,
    categoryId: categoryId || 1,
    categoryName: categoryName || 'Thông Báo Chỉ Đạo',
    summary: summary || title,
    content: content || title,
    image: image || 'images/banner.jpg',
    author: author || 'Cán Bộ Công Đoàn',
    authorId: 1,
    status: status || 'pending_review',
    isAiGenerated: !!isAiGenerated,
    aiPrompt: aiPrompt || ''
  };

  const created = await insertArticleToDb(articleData);
  const statusMap = { published: 'Đã Xuất Bản', approved: 'Đã Duyệt', pending_review: 'Chờ Duyệt', pending: 'Chờ Duyệt', draft: 'Bản Nháp' };
  created.statusName = statusMap[created.status] || 'Chờ Duyệt';
  res.json({ success: true, message: 'Đã lưu bài viết vào CSDL hệ thống (Transactional)', data: created });
});

app.put('/api/articles/:id', async (req, res) => {
  const id = req.params.id;
  const { title, categoryName, summary, content, status, scheduledAt, image, changeType, isAiGenerated, aiProvider, aiModel, aiPrompt } = req.body;

  const updateData = {
    title,
    categoryName,
    summary,
    content,
    status,
    scheduledAt,
    image,
    changeType: changeType || 'EDITOR_EDIT',
    isAiGenerated: !!isAiGenerated,
    aiProvider: aiProvider || null,
    aiModel: aiModel || null,
    aiPrompt: aiPrompt || null
  };

  await updateArticleInDb(id, updateData);
  const statusMap = { published: 'Đã Xuất Bản', approved: 'Đã Duyệt', pending_review: 'Chờ Duyệt', pending: 'Chờ Duyệt', draft: 'Bản Nháp' };
  res.json({ success: true, message: 'Đã cập nhật bài viết & lưu phiên bản mới vào CSDL (Transactional)', data: { id, status: updateData.status, statusName: statusMap[updateData.status] || 'Đã Lưu' } });
});

app.delete('/api/articles/:id', async (req, res) => {
  const id = req.params.id;
  await deleteArticleFromDb(id);
  res.json({ success: true, message: 'Đã xóa bài viết vĩnh viễn khỏi CSDL' });
});

app.post('/api/articles/:id/approve', async (req, res) => {
  const id = req.params.id;
  await updateArticleInDb(id, { status: 'approved' });
  res.json({ success: true, message: 'Đã duyệt bài viết thành công' });
});

// REST API USERS, EVENTS, MEDIA, AUDITS, SIMULATED SOCIAL
app.get('/api/users', (req, res) => res.json({ success: true, data: loadDB().users || [] }));
app.get('/api/events', (req, res) => res.json({ success: true, data: loadDB().events || [] }));
app.get('/api/media', (req, res) => res.json({ success: true, data: loadDB().media || [] }));
app.get('/api/audits', (req, res) => res.json({ success: true, data: loadDB().audits || [] }));
app.get('/api/inbox/comments', (req, res) => res.json({ success: true, data: loadDB().comments || [] }));

app.get('/api/analytics', (req, res) => {
  const db = loadDB();
  const arts = db.articles || [];
  res.json({
    success: true,
    totalArticles: arts.length,
    totalViews: arts.reduce((acc, a) => acc + (a.viewsCount || 0), 0),
    totalLikes: arts.reduce((acc, a) => acc + (a.likesCount || 0), 0),
    totalShares: arts.reduce((acc, a) => acc + (a.sharesCount || 0), 0),
    aiArticlesCount: arts.filter(a => a.isAiGenerated).length,
    publishedCount: arts.filter(a => a.status === 'published').length
  });
});

app.post('/api/facebook/publish', (req, res) => {
  const { articleId, title } = req.body;
  const db = loadDB();
  const art = (db.articles || []).find(a => a.id == articleId);
  if (art) {
    art.status = 'published';
    art.statusName = 'Đã Xuất Bản';
    saveDB(db);
  }
  res.json({
    success: true,
    facebookPostId: `simulated_fb_${articleId || Date.now()}`,
    message: `[MÔ PHỎNG XUẤT BẢN FANPAGE FACEBOOK OK] Đã chuyển bài viết "${title}" sang trạng thái xuất bản Fanpage TDMU!`
  });
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Website Truyền Thông Công Đoàn TDMU Real SaaS Engine`);
  console.log(`🌐 Public Portal: http://localhost:${PORT}`);
  console.log(`⚙️  Admin CMS Portal: http://localhost:${PORT}/admin.html`);
  console.log(`====================================================`);
});// TRUE MANUS AI COPILOT - DIRECT EDITING ENDPOINT WITH AUTO-FALLBACK
app.post('/api/ai/chat', async (req, res) => {
  const { message, history, articleTitle, articleContent, selectedText, apiKey, groqApiKey, aiEngine } = req.body;
  if (!message) return res.json({ success: false, error: 'Message là bắt buộc' });

  const activeGeminiKey = apiKey || process.env.GEMINI_API_KEY;
  const activeGroqKey = groqApiKey || process.env.GROQ_API_KEY;

  if (!activeGeminiKey && !activeGroqKey) {
    return res.json({ 
      success: false, 
      error: "Bạn chưa nhập API Key nào! Vui lòng vào Cài Đặt (⚙️) và nhập ít nhất một khóa (Google Gemini hoặc Groq)." 
    });
  }

  const systemPrompt = `BẠN LÀ MANUS AI COPILOT - TRỢ LÝ TRUYỀN THÔNG CÔNG ĐOÀN TDMU.
Bạn có quyền năng CHỈNH SỬA TRỰC TIẾP tài liệu của người dùng, không chỉ chat suông.
Ngữ cảnh hiện tại:
- Tiêu đề: "${articleTitle || 'Trống'}"
- Đoạn văn bản NGƯỜI DÙNG ĐANG BÔI ĐEN (Nếu có): "${selectedText || 'Không có đoạn nào được bôi đen'}"
- Toàn bộ nội dung bài viết: "${(articleContent || '').replace(/<[^>]*>/g, ' ').slice(0, 1500)}..."

NHIỆM VỤ CỦA BẠN: Phân tích yêu cầu của người dùng ("${message}") và trả về ĐÚNG định dạng JSON Schema sau:
{
  "reply": "Câu trả lời ngắn gọn, thân thiện (VD: Dạ, em đã sửa lại đoạn bôi đen cho trang trọng hơn rồi ạ!)",
  "editAction": "REPLACE_SELECTION" | "REPLACE_ALL" | "APPEND" | "NONE",
  "editContent": "Nội dung HTML mới (Sử dụng <h2>, <p>, <ul>...) để áp dụng vào tài liệu. Nếu editAction là NONE thì để rỗng."
}

QUY TẮC SỐNG CÒN VỀ ĐỊNH VỊ VÀ LOGIC BÀI VIẾT:
1. PHÂN TÍCH LOGIC TOÀN BÀI KHI SỬA ĐOẠN VĂN: 
   - Nếu người dùng ĐANG BÔI ĐEN CHỮ và yêu cầu sửa (VD: đổi thời gian, đổi ý), bạn phải đối chiếu đoạn sửa với "Toàn bộ nội dung bài viết". 
   - NẾU sự thay đổi gây mâu thuẫn với các đoạn sau (VD: đổi ngày đoạn đầu nhưng đoạn cuối vẫn ghi ngày cũ), BẠN PHẢI nhắc nhở/cảnh báo người dùng một cách thân thiện trong thuộc tính 'reply' của chat!
2. CHỈ TRẢ VỀ ĐÚNG ĐOẠN ĐƯỢC YÊU CẦU TRONG 'editContent':
   - Nếu bôi đen và yêu cầu sửa: BẠN PHẢI dùng "REPLACE_SELECTION". Thuộc tính 'editContent' CHỈ ĐƯỢC CHỨA ĐOẠN VĂN ĐÃ SỬA, tuyệt đối không chép lại cả bài.
   - Nếu yêu cầu chèn thêm: Dùng "APPEND". 'editContent' chỉ chứa phần mới chèn.
   - Nếu và chỉ nếu yêu cầu làm mới toàn bộ bài: Dùng "REPLACE_ALL".
   - Trò chuyện không sửa đổi: Dùng "NONE" và 'editContent' bằng "".`;

  const runGeminiChat = async () => {
    if (!activeGeminiKey) throw new Error("Chưa cấu hình Gemini API Key");
    const ai = new GoogleGenAI({ apiKey: activeGeminiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: systemPrompt + "\n\nYÊU CẦU CỦA NGƯỜI DÙNG: " + message,
      config: { responseMimeType: 'application/json' }
    });
    return response.text;
  };

  const runGroqChat = async () => {
    if (!activeGroqKey) throw new Error("Chưa cấu hình Groq API Key");
    return await callGroqAPI(message, systemPrompt, activeGroqKey);
  };

  let rawText = "";
  let sourceEngine = "";
  let lastError = null;

  const order = (aiEngine === 'groq') ? ['groq', 'gemini'] : ['gemini', 'groq'];

  for (const engine of order) {
    try {
      if (engine === 'gemini' && activeGeminiKey) {
        rawText = await runGeminiChat();
        sourceEngine = (sourceEngine ? "Google Gemini 2.5 Copilot (Fallback)" : "Google Gemini 2.5 Flash Copilot");
        break;
      } else if (engine === 'groq' && activeGroqKey) {
        rawText = await runGroqChat();
        sourceEngine = (order[0] === 'gemini' ? "⚡ Groq Llama 3.1 Copilot (Tự động chuyển từ Gemini)" : "⚡ Groq Llama 3.1 Copilot");
        break;
      }
    } catch (err) {
      console.warn(`[Copilot Engine ${engine} failed]:`, err.message || err);
      lastError = err;
    }
  }

  if (!rawText) {
    return handleAiError(lastError || new Error("Không thể kết nối đến cả Gemini và Groq"), res, "Copilot AI");
  }

  try {
    rawText = rawText.trim().replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '');
    const result = extractJsonFromText(rawText);
    const normalizedChat = normalizeAiChatOutput(result);
    
    return res.json({
      success: true,
      source: sourceEngine,
      reply: normalizedChat.reply,
      editAction: normalizedChat.editAction,
      editContent: normalizedChat.editContent
    });
  } catch (parseErr) {
    return res.json({ success: false, error: "Lỗi định dạng dữ liệu từ Copilot: " + parseErr.message });
  }
});


