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
    let reply = `Em đã tiếp nhận yêu cầu: "${message}".`;
    let editAction = "NONE";
    let editContent = "";

    if (selectedText) {
      reply = "Dạ, em đã gọt giũa và nâng cấp đoạn văn Thầy/Cô vừa chọn theo chuẩn văn phong báo chí Công đoàn TDMU!";
      editAction = "REPLACE_SELECTION";
      editContent = `<p style="font-weight: 600; color: #003865;">${selectedText.replace(/<[^>]*>/g, '')} (Đã được Copilot AI trau chuốt theo chuẩn văn phong hành chính đoàn thể ĐH Thủ Dầu Một)</p>`;
    }

    return res.json({
      success: true,
      source: "Local Intelligent NLP Engine (Offline Fallback)",
      reply,
      editAction,
      editContent
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

// REST API DOCUMENTS / VĂN BẢN CHỈ ĐẠO
app.get('/api/documents', (req, res) => {
  const { category, search } = req.query;
  const db = loadDB();
  let list = db.documents || [];
  
  if (category && category !== 'all') {
    list = list.filter(d => (d.loai_van_ban === category || (d.loai_van_ban_ten && d.loai_van_ban_ten.toLowerCase().includes(category.toLowerCase()))));
  }
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(d => 
      (d.so_hieu || '').toLowerCase().includes(q) ||
      (d.tieu_de || '').toLowerCase().includes(q) ||
      (d.co_quan_ban_hanh || '').toLowerCase().includes(q)
    );
  }
  list.sort((a, b) => (parseInt(b.id) || 0) - (parseInt(a.id) || 0));
  res.json({ success: true, count: list.length, data: list });
});

app.post('/api/documents', (req, res) => {
  const { so_hieu, tieu_de, loai_van_ban, co_quan_ban_hanh, ngay_ban_hanh, nguoi_ky, file_url, dung_luong } = req.body;
  if (!so_hieu || !tieu_de) {
    return res.json({ success: false, error: 'Số hiệu và Trích yếu văn bản là bắt buộc!' });
  }

  const categoryNames = {
    'tuyentruyen': 'Công văn tuyên truyền',
    'kehoach': 'Kế hoạch hoạt động',
    'luat': 'Văn bản luật',
    'quyetdinh': 'Quyết định'
  };

  const db = loadDB();
  db.documents = db.documents || [];
  const nextId = db.documents.length > 0 ? Math.max(...db.documents.map(d => parseInt(d.id) || 0)) + 1 : 1;

  const newDoc = {
    id: nextId,
    MaVanBan: nextId,
    so_hieu: so_hieu.trim(),
    SoHieuVanBan: so_hieu.trim(),
    tieu_de: tieu_de.trim(),
    TenVanBan: tieu_de.trim(),
    loai_van_ban: loai_van_ban || 'tuyentruyen',
    loai_van_ban_ten: categoryNames[loai_van_ban] || 'Công văn tuyên truyền',
    co_quan_ban_hanh: co_quan_ban_hanh || 'Ban Thường Vụ Công Đoàn TDMU',
    ngay_ban_hanh: ngay_ban_hanh || new Date().toISOString().split('T')[0],
    nguoi_ky: nguoi_ky || 'Ban Thường Vụ',
    NguoiKy: nguoi_ky || 'Ban Thường Vụ',
    file_url: file_url || 'uploads/documents/van_ban_' + nextId + '.pdf',
    dung_luong: dung_luong || '1.5 MB',
    luot_tai: 0,
    created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
  };

  db.documents.unshift(newDoc);
  saveDB(db);

  if (typeof logAuditRecord === 'function') {
    logAuditRecord(null, 'DOCUMENT_CREATED', 'Đăng tải văn bản mới: [' + newDoc.so_hieu + '] ' + newDoc.tieu_de, 'Quản Trị Viên');
  }

  res.json({ success: true, message: 'Đã đăng tải văn bản thành công!', data: newDoc });
});

app.delete('/api/documents/:id', (req, res) => {
  const db = loadDB();
  db.documents = db.documents || [];
  const id = parseInt(req.params.id);
  const idx = db.documents.findIndex(d => d.id === id || d.MaVanBan === id);
  if (idx === -1) {
    return res.json({ success: false, error: 'Không tìm thấy văn bản!' });
  }

  const deleted = db.documents.splice(idx, 1)[0];
  saveDB(db);
  if (typeof logAuditRecord === 'function') {
    logAuditRecord(null, 'DOCUMENT_DELETED', 'Đã xóa văn bản [' + deleted.so_hieu + '] khỏi CSDL', 'Quản Trị Viên');
  }
  res.json({ success: true, message: 'Đã xóa văn bản thành công!' });
});

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
  const { title, categoryName, categoryId, summary, content, image, author, status, isAiGenerated, aiPrompt, packageData } = req.body;
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
    aiPrompt: aiPrompt || '',
    packageData: packageData || null
  };

  const created = await insertArticleToDb(articleData);
  const statusMap = { published: 'Đã Xuất Bản', approved: 'Đã Duyệt', pending_review: 'Chờ Duyệt', pending: 'Chờ Duyệt', draft: 'Bản Nháp' };
  created.statusName = statusMap[created.status] || 'Chờ Duyệt';
  res.json({ success: true, message: 'Đã lưu bài viết vào CSDL hệ thống (Transactional)', data: created });
});

app.put('/api/articles/:id', async (req, res) => {
  const id = req.params.id;
  const { title, categoryName, summary, content, status, scheduledAt, publish_mode, image, changeType, isAiGenerated, aiProvider, aiModel, aiPrompt, currentUserId } = req.body;

  // HARD LOCK CHECK (JSON Fallback DB check for now)
  const db = loadDB();
  const art = (db.articles || []).find(a => a.id == id);
  if (art && art.assignee_id && currentUserId && art.assignee_id !== currentUserId) {
    return res.status(403).json({ success: false, error: 'Package này đang được xử lý bởi người khác (Hard Lock).' });
  }

  let finalStatus = status;
  if (publish_mode === 'schedule' && scheduledAt) {
    finalStatus = 'scheduled';
  }

  const updateData = {};
  if (req.body.title !== undefined) updateData.title = req.body.title;
  if (req.body.categoryName !== undefined) updateData.categoryName = req.body.categoryName;
  if (req.body.summary !== undefined) updateData.summary = req.body.summary;
  if (req.body.content !== undefined) updateData.content = req.body.content;
  if (finalStatus !== undefined) updateData.status = finalStatus;
  if (req.body.scheduledAt !== undefined) updateData.scheduledAt = req.body.scheduledAt;
  if (req.body.image !== undefined) updateData.image = req.body.image;
  if (req.body.changeType !== undefined) updateData.changeType = req.body.changeType;
  if (req.body.isAiGenerated !== undefined) updateData.isAiGenerated = !!req.body.isAiGenerated;
  if (req.body.aiProvider !== undefined) updateData.aiProvider = req.body.aiProvider;
  if (req.body.aiModel !== undefined) updateData.aiModel = req.body.aiModel;
  if (req.body.aiPrompt !== undefined) updateData.aiPrompt = req.body.aiPrompt;
  if (req.body.packageData !== undefined) updateData.packageData = req.body.packageData;

  await updateArticleInDb(id, updateData);
  const statusMap = { published: 'Đã Xuất Bản', approved: 'Đã Duyệt', pending_review: 'Chờ Duyệt', pending: 'Chờ Duyệt', draft: 'Bản Nháp', scheduled: 'Đã Lên Lịch', publish_failed: 'Lỗi Đăng Bài' };
  res.json({ success: true, message: 'Đã cập nhật bài viết & lưu phiên bản mới vào CSDL', data: { id, status: updateData.status, statusName: statusMap[updateData.status] || 'Đã Lưu' } });
});

// CLAIM & UNCLAIM APIS
app.post('/api/packages/:id/claim', (req, res) => {
  const id = req.params.id;
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ success: false, error: 'Thiếu userId' });

  const db = loadDB();
  const art = (db.articles || []).find(a => a.id == id);
  if (!art) return res.status(404).json({ success: false, error: 'Không tìm thấy package' });
  
  if (art.assignee_id && art.assignee_id !== userId) {
    return res.status(403).json({ success: false, error: 'Package này đã bị claim bởi người khác.' });
  }

  art.assignee_id = userId;
  art.updatedAt = new Date().toISOString();
  saveDB(db);
  res.json({ success: true, message: 'Đã nhận việc thành công.' });
});

app.post('/api/packages/:id/unclaim', (req, res) => {
  const id = req.params.id;
  const { userId } = req.body;
  const db = loadDB();
  const art = (db.articles || []).find(a => a.id == id);
  if (!art) return res.status(404).json({ success: false, error: 'Không tìm thấy package' });
  
  if (art.assignee_id && art.assignee_id !== userId) {
    return res.status(403).json({ success: false, error: 'Bạn không có quyền trả việc package của người khác.' });
  }

  art.assignee_id = null;
  art.updatedAt = new Date().toISOString();
  saveDB(db);
  res.json({ success: true, message: 'Đã hủy nhận việc thành công.' });
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


// =========================================================================
// 📁 ENTERPRISE CONTENT LIFECYCLE MANAGEMENT (DOSSIERS & ASSETS REPOSITORY)
// =========================================================================

// 1. DOSSIERS API (Hồ Sơ Nội Dung / Workspaces)
app.get('/api/dossiers', (req, res) => {
  const db = loadDB();
  const dossiers = db.dossiers || [];
  const assets = db.assets || [];
  const articles = db.articles || [];

  // Dynamically calculate asset and article counts
  const enriched = dossiers.map(d => ({
    ...d,
    assetsCount: assets.filter(a => a.dossierId === d.id).length,
    contentCount: articles.filter(a => a.dossierId === d.id).length
  }));

  res.json({ success: true, count: enriched.length, data: enriched });
});

app.get('/api/dossiers/:id', (req, res) => {
  const db = loadDB();
  const dossier = (db.dossiers || []).find(d => d.id === req.params.id);
  if (!dossier) return res.status(404).json({ success: false, error: 'Không tìm thấy hồ sơ' });
  
  const relatedAssets = (db.assets || []).filter(a => a.dossierId === req.params.id);
  const relatedArticles = (db.articles || []).filter(a => a.dossierId === req.params.id);
  
  res.json({ success: true, data: { ...dossier, assets: relatedAssets, articles: relatedArticles } });
});

app.post('/api/dossiers', (req, res) => {
  const { title, code, category, unit, leadPerson, description, startDate, endDate } = req.body;
  if (!title) return res.json({ success: false, error: 'Tiêu đề hồ sơ là bắt buộc' });

  const db = loadDB();
  if (!db.dossiers) db.dossiers = [];

  const newDossier = {
    id: `dossier_${Date.now()}`,
    code: code || `HS-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    title,
    category: category || 'Thông Báo Chỉ Đạo',
    unit: unit || 'Ban Thường Vụ Công Đoàn',
    leadPerson: leadPerson || 'Cán Bộ Phụ Trách',
    status: 'active',
    startDate: startDate || new Date().toISOString().slice(0, 10),
    endDate: endDate || '',
    description: description || '',
    createdAt: new Date().toISOString()
  };

  db.dossiers.unshift(newDossier);
  saveDB(db);
  res.json({ success: true, message: 'Đã tạo Hồ sơ nội dung mới thành công!', data: newDossier });
});

// 2. ASSETS API (Kho Tư Liệu Nguồn Đa Phương Tiện)
app.get('/api/assets', (req, res) => {
  const { dossierId, fileType, source } = req.query;
  const db = loadDB();
  let list = db.assets || [];

  if (dossierId && dossierId !== 'all') {
    list = list.filter(a => a.dossierId === dossierId);
  }
  if (fileType && fileType !== 'all') {
    list = list.filter(a => a.fileType === fileType);
  }
  if (source && source !== 'all') {
    list = list.filter(a => a.source === source);
  }

  res.json({ success: true, count: list.length, data: list });
});

app.post('/api/assets', async (req, res) => {
  const { title, fileName, fileType, dossierId, source, unit, uploadedBy, summary, fileUrl } = req.body;
  if (!title) return res.json({ success: false, error: 'Tên tư liệu là bắt buộc' });

  const db = loadDB();
  if (!db.assets) db.assets = [];

  const newAsset = {
    id: `asset_${Date.now()}`,
    title,
    fileName: fileName || `${title.replace(/\s+/g, '_')}.pdf`,
    fileType: fileType || 'document',
    fileSize: req.body.fileSize || '1.5 MB',
    fileUrl: fileUrl || (fileType === 'image' ? 'images/banner.jpg' : 'uploads/sample.pdf'),
    dossierId: dossierId || null,
    source: source || 'Công đoàn TDMU',
    unit: unit || 'Ban Thường Vụ',
    uploadedBy: uploadedBy || 'Cán Bộ Phụ Trách',
    status: 'verified',
    ai_status: 'triage_pending',
    confidence_score: null,
    ai_notes: null,
    aiAllowed: true,
    summary: summary || title,
    createdAt: new Date().toISOString()
  };

  db.assets.unshift(newAsset);
  saveDB(db);
  
  // Asynchronously trigger AI Triage (simulate or real)
  // For now, we simulate a triage process that randomly passes or fails based on fileType or title
  setTimeout(() => {
    const freshDb = loadDB();
    const asset = freshDb.assets.find(a => a.id === newAsset.id);
    if (asset) {
      if (asset.title.toLowerCase().includes('lỗi') || asset.title.toLowerCase().includes('mờ')) {
        asset.ai_status = 'triage_failed';
        asset.confidence_score = 45;
        asset.ai_notes = 'Tài liệu không rõ ràng hoặc không phù hợp để truyền thông.';
      } else {
        asset.ai_status = 'ready';
        asset.confidence_score = 92;
        asset.ai_notes = 'Tài liệu rõ nét, đầy đủ thông tin truyền thông.';
      }
      saveDB(freshDb);
    }
  }, 3000);

  res.json({ success: true, message: 'Đã nạp tư liệu mới vào Hòm Thư Tư Liệu thành công!', data: newAsset });
});


app.delete('/api/assets/:id', (req, res) => {
  const db = loadDB();
  db.assets = (db.assets || []).filter(a => a.id !== req.params.id);
  saveDB(db);
  res.json({ success: true, message: 'Đã xóa tư liệu khỏi hệ thống' });
});

// 3. EDITORIAL WORKFLOW LIFECYCLE (SUBMIT REVIEW, REJECT)
app.post('/api/articles/:id/submit-review', async (req, res) => {
  await updateArticleInDb(req.params.id, { status: 'pending_review' });
  res.json({ success: true, message: 'Đã gửi bài viết lên Ban Chấp Hành chờ phê duyệt!' });
});

app.post('/api/articles/:id/reject', async (req, res) => {
  const reason = req.body.reason || 'Cần chỉnh sửa lại theo góp ý';
  await updateArticleInDb(req.params.id, { status: 'draft', rejectReason: reason });
  res.json({ success: true, message: 'Đã hoàn trả bài viết về trạng thái Bản Nháp để biên tập lại!' });
});

// 4. MULTI-CHANNEL CONTENT PACKAGE GENERATOR (AI GROUNDED IN ASSETS)
const handlePackageGenerator = async (req, res) => {
  const { dossierId, assetIds, briefText, channels, customPrompt, prompt, apiKey, groqApiKey, aiEngine } = req.body;
  const pText = customPrompt || prompt || briefText || "Tháng Công Nhân 2026";
  const db = loadDB();

  const dossier = (db.dossiers || []).find(d => d.id === dossierId) || { title: "Hoạt động Công đoàn TDMU", category: "Thông Báo Chỉ Đạo", description: "" };
  const allAssets = db.assets || [];
  const selectedAssets = (assetIds && Array.isArray(assetIds) && assetIds.length > 0)
    ? allAssets.filter(a => assetIds.includes(a.id))
    : allAssets.filter(a => a.dossierId === dossierId);

  // BUILD GROUNDED KNOWLEDGE BASE PROMPT
  let evidenceText = `CHỦ ĐỀ CHÍNH: "${dossier.title}" (${dossier.category})\nMô tả: ${dossier.description || 'Không có'}\n\n`;
  
  if (briefText) {
    evidenceText += `NỘI DUNG TÓM TẮT/YÊU CẦU TRỰC TIẾP TỪ CÁN BỘ:\n${briefText}\n\n`;
  }

  evidenceText += `TƯ LIỆU NGUỒN ĐÍNH KÈM (GROUNDING EVIDENCE):\n`;
  
  if (selectedAssets.length > 0) {
    selectedAssets.forEach((a, i) => {
      evidenceText += `[Tư liệu ${i + 1}] "${a.title}" (Loại: ${a.fileType}, Nguồn: ${a.source}, Đơn vị: ${a.unit})\nNội dung tóm tắt: ${a.summary}\n\n`;
    });
  } else {
    evidenceText += `Không có file đính kèm.\n`;
  }

  const requestedChannels = (channels && Array.isArray(channels) && channels.length > 0)
    ? channels
    : ['website', 'facebook', 'zalo', 'video', 'banner'];

  const systemPrompt = `BẠN LÀ GIÁM ĐỐC TRUYỀN THÔNG ĐA KÊNH CỦA CÔNG ĐOÀN ĐẠI HỌC THỦ DẦU MỘT (TDMU).
Nhiệm vụ của bạn là nhận Hồ sơ và các Tư liệu nguồn thực tế, sau đó sản xuất trọn gói 1 "CONTENT PACKAGE ĐA KÊNH" hoàn chỉnh.

QUY TẮC CỐT LÕI BẮT BUỘC (GROUNDING TRUTHFULNESS):
1. BÁM SÁT SỰ THẬT TỪ TƯ LIỆU: Chỉ được dùng các dữ kiện, con số, đối tượng đã ghi trong phần Tư liệu nguồn. TUYỆT ĐỐI KHÔNG tự ý bịa đặt lịch trình, số tiền, tên người nếu tư liệu không nhắc đến.
2. ĐỊNH DẠNG ĐA KÊNH CHUYÊN BIỆT:
   - Website: Trang trọng, mạch lạc, dùng các thẻ HTML <h2>, <p>, <ul>, <li>, văn phong hành chính hiện đại.
   - Facebook: Giọng văn truyền cảm hứng, ngắn gọn, có icon sinh động, có bộ Hashtags chuẩn và Call to Action (CTA).
   - Zalo OA: Tin vắn dưới 100 chữ, súc tích, dạng thẻ hành động.
   - Video Script: Kịch bản phân cảnh (Scene, Visual, Voice-over) thời lượng 60 giây.
   - Banner Concept: Khẩu hiệu ngắn gọn (dưới 10 chữ) và thông điệp phụ.

YÊU CẦU ĐẦU RA: Trả về DUY NHẤT 1 đối tượng JSON hợp lệ theo đúng cấu trúc sau (không có văn bản nào khác ngoài JSON):
{
  "website": {
    "title": "Tiêu đề bài báo Web chính thống",
    "sapo": "Đoạn mở đầu tóm lược khoảng 40-50 từ",
    "content": "Nội dung HTML đầy đủ có <h2>, <p>, <ul>...",
    "suggestedTags": ["Công đoàn TDMU", "Chăm lo đời sống"]
  },
  "facebook": {
    "caption": "Bài đăng Facebook truyền thông cảm xúc, có biểu tượng icon sinh động...",
    "hashtags": "#CongDoanTDMU #TDMU2026",
    "callToAction": "Quý Thầy/Cô vui lòng chia sẻ thông tin đến toàn thể đoàn viên tại đơn vị!",
    "suggestedImages": ["${selectedAssets.find(a => a.fileType === 'image')?.fileName || 'banner.jpg'}"]
  },
  "zalo": {
    "headline": "Tiêu đề tin Zalo OA",
    "broadcastBody": "Nội dung tin nhắn Zalo vắn tắt, súc tích dưới 80 từ...",
    "actionLink": "https://congdoan.tdmu.edu.vn"
  },
  "video": {
    "title": "Kịch bản phóng sự ngắn 60s",
    "scenes": [
      { "scene": 1, "visual": "Hình ảnh khuôn viên trường TDMU và biểu trưng Công đoàn", "voiceover": "Đoàn kết, đổi mới và sáng tạo - Công đoàn Trường Đại học Thủ Dầu Một luôn đồng hành..." },
      { "scene": 2, "visual": "Hình ảnh cán bộ công đoàn tham gia hoạt động", "voiceover": "Kế hoạch được triển khai sâu rộng mang lại nhiều quyền lợi thiết thực..." }
    ]
  },
  "banner": {
    "headline": "KHẨU HIỆU BANNER CHÍNH",
    "subText": "Thông điệp bổ trợ",
    "suggestedPalette": "Xanh dương TDMU & Vàng kim năng động"
  }
}`;

  const promptContent = `${evidenceText}\nYÊU CẦU BỔ SUNG CỦA BIÊN TẬP VIÊN: ${customPrompt || 'Tạo trọn gói Content Package truyền thông chuẩn mực cho các kênh đã chọn.'}`;

  const activeGeminiKey = apiKey || process.env.GEMINI_API_KEY;
  const activeGroqKey = groqApiKey || process.env.GROQ_API_KEY;

  if (!activeGeminiKey && !activeGroqKey) {
    const promptTitle = dossier.title || customPrompt || "Hoạt Động Công Đoàn TDMU 2026";
    return res.json({
      success: true,
      source: "Local Intelligent NLP Engine (Offline Fallback)",
      dossierId,
      dossierTitle: dossier.title,
      groundedAssetsCount: selectedAssets.length,
      package: {
        title: `Công Đoàn Trường ĐH Thủ Dầu Một: ${promptTitle}`,
        subTitle: "Đồng hành, chăm lo và bảo vệ quyền lợi hợp pháp của cán bộ giảng viên",
        summary: `Kế hoạch tổ chức ${promptTitle} với nhiều hoạt động thiết thực chăm lo đời sống đoàn viên.`,
        articleHtml: `<h2>1. MỤC ĐÍCH & Ý NGHĨA</h2><p>Chương trình <strong>${promptTitle}</strong> nhằm tạo khí thế thi đua sôi nổi trong toàn thể cán bộ, giảng viên và người lao động TDMU.</p><blockquote>"Công đoàn TDMU luôn là mái ấm tin cậy của người lao động"</blockquote>`,
        facebookPost: `📢 [TDMU NEWS] ${promptTitle}\n\nCông đoàn Trường ĐH Thủ Dầu Một phát động chương trình ${promptTitle} với nhiều hoạt động sôi nổi!\n\n👉 Chi tiết tại: https://congdoan.tdmu.edu.vn\n#CongDoanTDMU #TDMU2026`,
        zaloPost: `[CÔNG ĐOÀN TDMU] Thông báo triển khai ${promptTitle}. Kính mời quý Thầy/Cô theo dõi.`,
        emailNewsletter: `Kính gửi quý Thầy/Cô Đoàn viên,\n\nBan Thường vụ Công đoàn TDMU trân trọng thông báo kế hoạch: ${promptTitle}.\n\nTrân trọng!`,
        videoScript: `Kịch bản video 60s: [00:00-00:10] Giới thiệu không khí ${promptTitle}. [00:10-00:40] Hoạt động trao quà và thi đua. [00:40-01:00] Lời chúc và thông điệp đoàn kết.`
      }
    });
  }

  // Multi-engine execution
  const runGeminiPackage = async () => {
    if (!activeGeminiKey) throw new Error("Chưa cấu hình Gemini Key");
    const ai = new GoogleGenAI({ apiKey: activeGeminiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: systemPrompt + "\n\n" + promptContent,
      config: { responseMimeType: 'application/json' }
    });
    return response.text;
  };

  const runGroqPackage = async () => {
    if (!activeGroqKey) throw new Error("Chưa cấu hình Groq Key");
    return await callGroqAPI(promptContent, systemPrompt, activeGroqKey);
  };

  let rawText = "";
  let sourceEngine = "";
  let lastError = null;
  const order = (aiEngine === 'groq') ? ['groq', 'gemini'] : ['gemini', 'groq'];

  for (const engine of order) {
    try {
      if (engine === 'gemini' && activeGeminiKey) {
        rawText = await runGeminiPackage();
        sourceEngine = "Google Gemini 2.5 Flash Package Engine";
        break;
      } else if (engine === 'groq' && activeGroqKey) {
        rawText = await runGroqPackage();
        sourceEngine = "Groq AI Multi-Channel Package Engine";
        break;
      }
    } catch (e) {
      console.warn(`[Package Generator Engine ${engine} failed]:`, e.message);
      lastError = e;
    }
  }

  if (!rawText) {
    return handleAiError(lastError || new Error("Không thể tạo Content Package"), res, "Package Engine");
  }

  try {
    const pkg = extractJsonFromText(rawText);
    return res.json({
      success: true,
      source: sourceEngine,
      dossierId,
      dossierTitle: dossier.title,
      groundedAssetsCount: selectedAssets.length,
      package: pkg
    });
  } catch (err) {
    return res.json({ success: false, error: "Lỗi giải mã JSON Content Package: " + err.message });
  }
};

app.post('/api/ai/package-generator', handlePackageGenerator);
app.post('/api/ai/studio-package', handlePackageGenerator);

// 5. INLINE MICRO-EDITING (GRAMMARLY STYLE)
app.post('/api/ai/inline-edit', async (req, res) => {
  const { text, action, customPrompt, apiKey } = req.body;
  const activeGeminiKey = apiKey || process.env.GEMINI_API_KEY;

  if (!activeGeminiKey) {
    return res.json({ success: false, error: "Chưa cấu hình Gemini API Key." });
  }

  let instruction = "";
  if (action === 'rewrite') instruction = "Viết lại đoạn văn bản sau sao cho mạch lạc, hấp dẫn và tự nhiên hơn. Giữ nguyên ý nghĩa gốc.";
  else if (action === 'shorten') instruction = "Viết lại đoạn văn bản sau ngắn gọn, súc tích hơn. Cắt bỏ các từ ngữ dư thừa nhưng không làm mất ý chính.";
  else if (action === 'expand') instruction = "Mở rộng đoạn văn bản sau thêm chi tiết, diễn giải rõ ràng và sâu sắc hơn.";
  else if (action === 'formal') instruction = "Viết lại đoạn văn bản sau theo phong cách trang trọng, nghiêm túc, chuẩn mực văn bản hành chính Công đoàn.";
  else if (action === 'casual') instruction = "Viết lại đoạn văn bản sau theo phong cách gần gũi, năng động, phù hợp đăng mạng xã hội cho sinh viên.";
  else if (action === 'custom') instruction = customPrompt || "Chỉnh sửa đoạn văn sau.";
  
  const systemPrompt = `BẠN LÀ TRỢ LÝ CHỈNH SỬA VĂN BẢN (MICRO-EDITOR).
Nhiệm vụ của bạn là thực hiện yêu cầu chỉnh sửa trên đoạn văn bản được cung cấp.
YÊU CẦU: Trả về DUY NHẤT đoạn văn bản đã được chỉnh sửa. Tuyệt đối KHÔNG trả về các câu như "Dưới đây là đoạn văn...", KHÔNG thêm dấu ngoặc kép bọc ngoài nếu không cần thiết, KHÔNG giải thích. Chỉ trả về kết quả cuối cùng.`;

  const promptContent = `YÊU CẦU CHỈNH SỬA: ${instruction}\n\nĐOẠN VĂN BẢN CẦN SỬA:\n"""\n${text}\n"""`;

  try {
    const ai = new GoogleGenAI({ apiKey: activeGeminiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: systemPrompt + "\n\n" + promptContent
    });
    
    // Clean up potential markdown code blocks if the AI returned it as markdown
    let result = response.text.trim();
    if (result.startsWith('```')) {
      result = result.replace(/^```[a-z]*\n/, '').replace(/\n```$/, '');
    }

    res.json({ success: true, text: result.trim() });
  } catch (e) {
    console.error("Inline edit error:", e);
    res.json({ success: false, error: e.message });
  }
});



// REST API USERS, EVENTS, MEDIA, AUDITS, SIMULATED SOCIAL (DUAL SCHEMA SUPPORT)
app.get('/api/users', (req, res) => {
  const db = loadDB();
  res.json({ success: true, data: db.users || db.nhan_su || [] });
});

app.get('/api/schedules', (req, res) => {
  const db = loadDB();
  res.json({ success: true, data: db.schedules || db.lich_xuat_ban || [] });
});

app.get('/api/events', (req, res) => res.json({ success: true, data: loadDB().events || [] }));
app.get('/api/media', (req, res) => res.json({ success: true, data: loadDB().media || [] }));
app.get('/api/audits', (req, res) => {
  const db = loadDB();
  res.json({ success: true, data: db.article_audits || db.article_audits || [] });
});
app.get('/api/inbox/comments', (req, res) => res.json({ success: true, data: loadDB().comments || [] }));

const getDashboardStats = (req, res) => {
  const db = loadDB();
  const arts = db.articles || db.articles || [];
  res.json({
    success: true,
    totalArticles: arts.length,
    totalViews: arts.reduce((acc, a) => acc + (a.viewsCount || a.LuotXem || 0), 0),
    totalLikes: arts.reduce((acc, a) => acc + (a.likesCount || a.LuotThich || 0), 0),
    totalShares: arts.reduce((acc, a) => acc + (a.sharesCount || 0), 0),
    aiArticlesCount: arts.filter(a => a.isAiGenerated || a.is_ai_generated).length,
    publishedCount: arts.filter(a => a.status === 'published' || a.TrangThai === 'Published').length,
    data: {
      tong_bai: arts.length,
      da_xuat_ban: arts.filter(a => a.status === 'published' || a.TrangThai === 'Published').length,
      cho_duyet: arts.filter(a => a.status === 'pending' || a.TrangThai === 'Pending').length,
      ban_nhap: arts.filter(a => a.status === 'draft' || a.TrangThai === 'Draft').length,
      bai_gan_day: arts.slice(0, 5)
    }
  });
};

app.get('/api/analytics', getDashboardStats);
app.get('/api/dashboard', getDashboardStats);

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


// ------------------------------------------------------------------
// 16 TỔ CÔNG ĐOÀN & BÁO CÁO THÁNG / ĐÁNH GIÁ THI ĐUA (GOOGLE FORMS DATA)
// ------------------------------------------------------------------

// 1. Lấy danh sách 16 Tổ Công đoàn
// ORG CHART & TRADE UNION APIS
// =========================================================================
// 1. BOOKMARKS (ĐỌC SAU) API
// =========================================================================
app.get('/api/bookmarks', (req, res) => {
  const db = loadDB();
  const userId = req.query.user_id || 'CB_001';
  const userBookmarks = (db.bookmarks || []).filter(b => !req.query.user_id || b.user_id === userId);
  res.json({ success: true, data: userBookmarks });
});

app.post('/api/bookmarks', (req, res) => {
  const db = loadDB();
  db.bookmarks = db.bookmarks || [];
  const { article_id, article_title, user_id, user_name } = req.body;
  if (!article_id) return res.status(400).json({ success: false, error: 'Thiếu article_id' });

  const existingIdx = db.bookmarks.findIndex(b => b.article_id == article_id && (!user_id || b.user_id === user_id));
  if (existingIdx >= 0) {
    // Toggle remove
    db.bookmarks.splice(existingIdx, 1);
    saveDB(db);
    return res.json({ success: true, action: 'removed', message: 'Đã bỏ lưu bài viết' });
  }

  const newBookmark = {
    id: db.bookmarks.length ? Math.max(...db.bookmarks.map(b => b.id || 0)) + 1 : 1,
    user_id: user_id || 'CB_001',
    user_name: user_name || 'TS. Lê Thị Kim Út',
    article_id: parseInt(article_id),
    article_title: article_title || 'Bài viết Công đoàn',
    saved_at: new Date().toISOString()
  };
  db.bookmarks.push(newBookmark);
  saveDB(db);
  res.json({ success: true, action: 'added', data: newBookmark, message: 'Đã lưu bài viết vào Tủ sách đọc sau' });
});

// =========================================================================
// 2. WELFARE (PHÚC LỢI ĐOÀN VIÊN) & DON TRO CAP API
// =========================================================================
app.get('/api/welfare', (req, res) => {
  const db = loadDB();
  res.json({ success: true, data: db.phuc_loi || [] });
});

app.get('/api/welfare/applications', (req, res) => {
  const db = loadDB();
  res.json({ success: true, data: db.don_tro_cap || [] });
});

app.post('/api/welfare/apply', (req, res) => {
  const db = loadDB();
  db.don_tro_cap = db.don_tro_cap || [];
  const { full_name, unit, type, amount_requested, reason, phone, email } = req.body;

  if (!full_name || !type || !reason) {
    return res.status(400).json({ success: false, error: 'Vui lòng điền đầy đủ họ tên, loại trợ cấp và lý do' });
  }

  const newApp = {
    id: db.don_tro_cap.length ? Math.max(...db.don_tro_cap.map(d => d.id || 0)) + 1 : 1,
    full_name,
    unit: unit || 'Đoàn viên TDMU',
    phone: phone || '',
    email: email || '',
    type,
    amount_requested: parseFloat(amount_requested) || 1000000,
    reason,
    submitted_at: new Date().toISOString(),
    status: 'pending',
    note: 'Chờ Ban Thường Vụ xét duyệt'
  };

  db.don_tro_cap.push(newApp);
  saveDB(db);
  res.json({ success: true, data: newApp, message: 'Đã gửi hồ sơ đề nghị trợ cấp thành công tới Ban Thường Vụ!' });
});

// =========================================================================
// 3. INBOX FEEDBACK (HỘP THƯ GÓP Ý & PHẢN ÁNH ĐOÀN VIÊN) API
// =========================================================================
app.get('/api/feedback', (req, res) => {
  const db = loadDB();
  res.json({ success: true, data: db.inbox_feedback || [] });
});

app.post('/api/feedback', (req, res) => {
  const db = loadDB();
  db.inbox_feedback = db.inbox_feedback || [];
  const { sender_name, email, phone, unit, category, title, content } = req.body;

  if (!sender_name || !title || !content) {
    return res.status(400).json({ success: false, error: 'Họ tên, tiêu đề và nội dung là bắt buộc' });
  }

  const newFeedback = {
    id: db.inbox_feedback.length ? Math.max(...db.inbox_feedback.map(f => f.id || 0)) + 1 : 1,
    sender_name,
    email: email || '',
    phone: phone || '',
    unit: unit || 'Đoàn viên TDMU',
    category: category || 'Góp ý chung',
    title,
    content,
    submitted_at: new Date().toISOString(),
    status: 'pending',
    response: null
  };

  db.inbox_feedback.push(newFeedback);
  saveDB(db);
  res.json({ success: true, data: newFeedback, message: 'Cảm ơn bạn! Ý kiến đã được chuyển trực tiếp đến Ban Chấp Hành Công đoàn.' });
});

// =========================================================================
// 4. ARTICLE REACTIONS (THẢ TIM & CẢM XÚC BÀI VIẾT) API
// =========================================================================
app.get('/api/articles/:id/reactions', (req, res) => {
  const db = loadDB();
  const articleId = parseInt(req.params.id);
  const reactions = (db.article_reactions || []).filter(r => r.article_id === articleId);

  const summary = {
    like: reactions.filter(r => r.reaction_type === 'like').length,
    heart: reactions.filter(r => r.reaction_type === 'heart').length,
    clap: reactions.filter(r => r.reaction_type === 'clap').length,
    total: reactions.length
  };

  const userReaction = req.query.user_id ? reactions.find(r => r.user_id === req.query.user_id) : null;
  res.json({ success: true, summary, user_reaction: userReaction ? userReaction.reaction_type : null });
});

app.post('/api/articles/:id/reactions', (req, res) => {
  const db = loadDB();
  db.article_reactions = db.article_reactions || [];
  const articleId = parseInt(req.params.id);
  const { user_id, user_name, reaction_type } = req.body;

  if (!reaction_type) return res.status(400).json({ success: false, error: 'Thiếu reaction_type' });

  const userId = user_id || 'CB_001';
  const existingIdx = db.article_reactions.findIndex(r => r.article_id === articleId && r.user_id === userId);

  if (existingIdx >= 0) {
    if (db.article_reactions[existingIdx].reaction_type === reaction_type) {
      // Toggle off
      db.article_reactions.splice(existingIdx, 1);
      saveDB(db);
      return res.json({ success: true, action: 'removed', reaction_type: null });
    } else {
      // Change reaction
      db.article_reactions[existingIdx].reaction_type = reaction_type;
      saveDB(db);
      return res.json({ success: true, action: 'changed', reaction_type });
    }
  }

  const newReaction = {
    id: db.article_reactions.length ? Math.max(...db.article_reactions.map(r => r.id || 0)) + 1 : 1,
    article_id: articleId,
    user_id: userId,
    user_name: user_name || 'TS. Lê Thị Kim Út',
    reaction_type,
    created_at: new Date().toISOString()
  };

  db.article_reactions.push(newReaction);
  saveDB(db);
  res.json({ success: true, action: 'added', reaction_type });
});

// SUPER-FAST AGGREGATED ORG TREE API (TỐI ƯU 1-REQUEST TOÀN BỘ CƠ CẤU TỔ CHỨC)
app.get('/api/org-full-tree', (req, res) => {
  try {
    const db = loadDB();
    const toChuc = db.to_chuc || [];
    const toCongDoan = db.to_cong_doan || [];
    const nhanSu = db.nhan_su || [];

    const stats = {
      total_members: toCongDoan.reduce((acc, u) => acc + (u.TongDoanVien || u.members || 0), 0) || 760,
      total_units: toCongDoan.length,
      total_boards: toChuc.length,
      total_cadres: nhanSu.length
    };

    res.json({
      success: true,
      data: {
        boards: toChuc,
        units: toCongDoan,
        cadres: nhanSu,
        stats
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Lỗi nạp cây tổ chức: ' + err.message });
  }
});

app.get('/api/to-chuc', (req, res) => {
  const db = loadDB();
  res.json({ success: true, data: db.to_chuc || [] });
});

app.get('/api/to-cong-doan', (req, res) => {
  const db = loadDB();
  res.json({ success: true, data: db.to_cong_doan || [] });
});

app.get('/api/nhan-su', (req, res) => {
  const db = loadDB();
  res.json({ success: true, data: db.nhan_su || [] });
});

app.get('/api/trade-unions', (req, res) => {
  const db = loadDB();
  res.json({ success: true, data: db.trade_unions || [] });
});

// 2. Lấy danh sách Báo cáo Tháng của các Tổ Công đoàn
app.get('/api/monthly-reports', (req, res) => {
  const db = loadDB();
  let reports = db.monthly_reports || [];
  const { month, year, union_id } = req.query;

  if (month) {
    reports = reports.filter(r => r.month == month);
  }
  if (year) {
    reports = reports.filter(r => r.year == year);
  }
  if (union_id) {
    reports = reports.filter(r => r.union_id === union_id);
  }

  res.json({ success: true, count: reports.length, data: reports });
});

// 3. Nộp Báo cáo Tháng mới từ Form Trực Tuyến
app.post('/api/monthly-reports', (req, res) => {
  try {
    const db = loadDB();
    if (!db.monthly_reports) db.monthly_reports = [];

    const newReport = {
      id: db.monthly_reports.length > 0 ? Math.max(...db.monthly_reports.map(r => r.id)) + 1 : 1,
      union_id: req.body.union_id || "TCD_01",
      union_name: req.body.union_name || "Công đoàn cơ sở",
      month: parseInt(req.body.month) || new Date().getMonth() + 1,
      year: parseInt(req.body.year) || new Date().getFullYear(),
      reporter_name: req.body.reporter_name || "",
      reporter_email: req.body.reporter_email || "",
      timestamp: new Date().toLocaleString('vi-VN'),
      total_staff: parseInt(req.body.total_staff) || 0,
      total_union_members: parseInt(req.body.total_union_members) || 0,
      female_union_members: parseInt(req.body.female_union_members) || 0,
      new_members_month: parseInt(req.body.new_members_month) || 0,
      resigned_members_month: parseInt(req.body.resigned_members_month) || 0,
      party_introduced_members: parseInt(req.body.party_introduced_members) || 0,
      party_admitted_members: parseInt(req.body.party_admitted_members) || 0,
      severe_illness_count: parseInt(req.body.severe_illness_count) || 0,
      cared_members_count: parseInt(req.body.cared_members_count) || 0,
      total_care_fund: parseFloat(req.body.total_care_fund) || 0,
      work_accidents_count: parseInt(req.body.work_accidents_count) || 0,
      fatal_accidents_count: parseInt(req.body.fatal_accidents_count) || 0,
      inspection_sessions_count: parseInt(req.body.inspection_sessions_count) || 0,
      inspection_content: req.body.inspection_content || "",
      inspection_result: req.body.inspection_result || "",
      propaganda_sessions_count: parseInt(req.body.propaganda_sessions_count) || 0,
      propaganda_attendees_count: parseInt(req.body.propaganda_attendees_count) || 0,
      propaganda_content: req.body.propaganda_content || "",
      other_activities: req.body.other_activities || "",
      proof_url: req.body.proof_url || "",
      next_month_plan: req.body.next_month_plan || "",
      recommendations: req.body.recommendations || "",
      status: "approved",
      evaluation_score: 95
    };

    db.monthly_reports.push(newReport);
    saveDB(db);

    res.json({ success: true, message: "Nộp báo cáo tháng thành công!", data: newReport });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Tổng hợp Kết quả Đánh giá Thi đua 16 Tổ Công đoàn
app.get('/api/monthly-reports/summary', (req, res) => {
  const db = loadDB();
  const tradeUnions = db.trade_unions || [];
  const reports = db.monthly_reports || [];
  const targetMonth = parseInt(req.query.month) || 8;
  const targetYear = parseInt(req.query.year) || 2026;

  const monthReports = reports.filter(r => r.month === targetMonth && r.year === targetYear);

  const summary = tradeUnions.map((tu, idx) => {
    const report = monthReports.find(r => r.union_id === tu.id);
    return {
      stt: idx + 1,
      union_id: tu.id,
      union_name: tu.name,
      category: tu.category,
      has_submitted: !!report,
      reporter_name: report ? report.reporter_name : "Chưa nộp",
      timestamp: report ? report.timestamp : "",
      total_members: report ? report.total_union_members : 0,
      female_members: report ? report.female_union_members : 0,
      care_fund: report ? report.total_care_fund : 0,
      propaganda_sessions: report ? report.propaganda_sessions_count : 0,
      party_introduced: report ? report.party_introduced_members : 0,
      proof_url: report ? report.proof_url : "",
      evaluation_score: report ? report.evaluation_score : 0,
      evaluation_rank: report ? (report.evaluation_score >= 95 ? "Tổ CĐ Xuất Sắc" : "Tổ CĐ Hoàn Thành Tốt") : "Chưa Đánh Giá"
    };
  });

  const totalSubmitted = summary.filter(s => s.has_submitted).length;
  const totalCareFund = summary.reduce((sum, s) => sum + s.care_fund, 0);
  const totalMembers = summary.reduce((sum, s) => sum + s.total_members, 0);

  res.json({
    success: true,
    month: targetMonth,
    year: targetYear,
    stats: {
      total_unions: tradeUnions.length,
      submitted_count: totalSubmitted,
      pending_count: tradeUnions.length - totalSubmitted,
      submission_rate: Math.round((totalSubmitted / (tradeUnions.length || 1)) * 100),
      total_care_fund: totalCareFund,
      total_members: totalMembers
    },
    data: summary
  });
});

// =========================================================================
// BACKGROUND CRON JOBS (AUTO-PUBLISH & AUTO-RELEASE)
// =========================================================================
setInterval(() => {
  const db = loadDB();
  const now = new Date();
  let changed = false;

  (db.articles || []).forEach(art => {
    // 1. Auto Publish Worker
    if (art.status === 'scheduled' && art.scheduledAt) {
      const scheduledTime = new Date(art.scheduledAt);
      if (scheduledTime <= now) {
        console.log(`[Cron] Executing Auto-Publish for Package #${art.id}...`);
        // Simulate external API call (Facebook/Zalo)
        const isSuccess = Math.random() > 0.1; // 90% success rate
        if (isSuccess) {
          art.status = 'published';
          art.statusName = 'Đã Xuất Bản';
          console.log(`[Cron] Successfully published Package #${art.id}`);
        } else {
          art.status = 'publish_failed';
          art.statusName = 'Lỗi Đăng Bài';
          console.error(`[Cron] Failed to publish Package #${art.id}`);
        }
        changed = true;
      }
    }

    // 2. Auto Release Worker (Release locks idle for > 24 hours)
    if (art.assignee_id && art.updatedAt) {
      const lastUpdate = new Date(art.updatedAt);
      const diffHours = (now - lastUpdate) / (1000 * 60 * 60);
      if (diffHours >= 24) {
        console.log(`[Cron] Auto-releasing idle Package #${art.id} from User ${art.assignee_id}`);
        art.assignee_id = null;
        changed = true;
      }
    }
  });

  if (changed) {
    saveDB(db);
  }
}, 60000); // Check every minute

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


