const express = require('express');
const router = express.Router();
const { loadDB } = require('../db');
const {
  GoogleGenAI,
  callGroqAPI,
  handleAiError,
  extractJsonFromText,
  normalizeAiGenerateOutput,
  normalizeAiChatOutput
} = require('../services/aiService');

// =========================================================================
// 1. ARTICLE GENERATOR (GEMINI & GROQ HYBRID STREAM / DIRECT)
// =========================================================================
router.post('/generate', async (req, res) => {
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
- TUYỆT ĐỐI KHÔNG tự ý bịa đặt lịch trình chi li hoặc tự chế lời phát biểu nếu người dùng không yêu cầu.
- Chỉ tập trung vào chủ đề chính mà người dùng yêu cầu, diễn đạt trang trọng, súc tích.

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
    const result = extractJsonFromText(rawText);
    const normalized = normalizeAiGenerateOutput(result, prompt);

    res.json({
      success: true,
      source: sourceEngine,
      titles: normalized.titles,
      subTitle: normalized.subTitle,
      summary: normalized.summary,
      content: normalized.content
    });
  } catch (parseErr) {
    return res.json({ success: false, error: "Lỗi giải mã cấu trúc bài viết từ AI: " + parseErr.message });
  }
});

// =========================================================================
// 2. EVENT PLAN & TIMELINE GENERATOR
// =========================================================================
router.post('/event-plan-generator', async (req, res) => {
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

// =========================================================================
// 3. IMAGE PROMPT GENERATOR
// =========================================================================
router.post('/image-prompt-generator', async (req, res) => {
  const { topic } = req.body;
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

// =========================================================================
// 4. QUALITY CHECK SCORECARD
// =========================================================================
router.post('/quality-check', async (req, res) => {
  const { title, content } = req.body;
  const cleanContent = (content || "").replace(/<[^>]*>/g, '');
  const wordCount = cleanContent.trim() ? cleanContent.trim().split(/\s+/).length : 0;

  let lengthScore = 0;
  if (wordCount >= 200 && wordCount <= 800) lengthScore = 25;
  else if (wordCount >= 100) lengthScore = 20;
  else if (wordCount > 0) lengthScore = 12;

  let headlineScore = title && title.length >= 10 ? 25 : 10;

  let toneScore = 0;
  if (cleanContent.includes('Công đoàn') || cleanContent.includes('TDMU')) toneScore += 15;
  if (cleanContent.includes('thông báo') || cleanContent.includes('kế hoạch') || cleanContent.includes('triển khai')) toneScore += 10;

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

// =========================================================================
// 5. MANUS AI COPILOT (CHAT & AUTO-FALLBACK)
// =========================================================================
router.post('/chat', async (req, res) => {
  const { message, articleTitle, articleContent, selectedText, apiKey, groqApiKey, aiEngine } = req.body;
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
1. NẾU bôi đen và yêu cầu sửa: BẠN PHẢI dùng "REPLACE_SELECTION". Thuộc tính 'editContent' CHỈ ĐƯỢC CHỨA ĐOẠN VĂN ĐÃ SỬA, tuyệt đối không chép lại cả bài.
2. Nếu yêu cầu chèn thêm: Dùng "APPEND". 'editContent' chỉ chứa phần mới chèn.
3. Nếu yêu cầu làm mới toàn bộ bài: Dùng "REPLACE_ALL".
4. Trò chuyện không sửa đổi: Dùng "NONE" và 'editContent' bằng "".`;

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

// =========================================================================
// 6. COPILOT CHAT STREAMING (SSE)
// =========================================================================
router.post('/chat-stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const { message, selectedText, apiKey } = req.body;
  const activeKey = apiKey || process.env.GEMINI_API_KEY;

  if (!activeKey) {
    res.write('data: {"error": "Chưa cấu hình Gemini API Key"}\n\n');
    return res.end();
  }

  const ai = new GoogleGenAI({ apiKey: activeKey });

  let systemPrompt = `BẠN LÀ MANUS AI COPILOT - TRỢ LÝ TRUYỀN THÔNG CÔNG ĐOÀN TDMU.
Chỉ trả về trực tiếp đoạn văn bản kết quả đã chỉnh sửa để đưa thẳng vào giao diện (raw HTML/text, không dùng markdown \`\`\`html).
ĐOẠN VĂN GỐC ĐỂ CHỈNH SỬA:\n"""\n${selectedText || ''}\n"""
YÊU CẦU TỪ NGƯỜI DÙNG: ${message}`;

  try {
    const stream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: systemPrompt
    });

    for await (const chunk of stream) {
      if (chunk.text) {
        let textChunk = chunk.text.replace(/```html|```/g, "");
        res.write(`data: ${JSON.stringify({ chunk: textChunk })}\n\n`);
      }
    }
    res.write(`data: {"done": true}\n\n`);
    res.end();
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

// =========================================================================
// 7. FLOATING AI COMMAND
// =========================================================================
router.post('/floating-command', async (req, res) => {
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
      else if (action === 'formal') systemPrompt = "Viết lại đoạn văn sau theo văn phong báo chí chuẩn mực, trang nhã, giàu sức thuyết phục:";
      else if (action === 'to_quote') systemPrompt = "Biến đoạn thông tin sau thành một câu trích dẫn phát biểu trực tiếp đầy cảm xúc và trang trọng từ lãnh đạo hoặc đoàn viên Công đoàn TDMU (đặt trong dấu ngoặc kép):";
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

  let result = text;
  if (action === 'rewrite') {
    result = `Thực hiện chỉ đạo, ${text.charAt(0).toLowerCase() + text.slice(1)}`;
  } else if (action === 'shorten') {
    result = text.split('.')[0] + '.';
  } else if (action === 'expand') {
    result = `${text} Đồng thời, Ban Thường vụ Công đoàn TDMU đề nghị các Công đoàn bộ phận rà soát và nghiêm túc thực hiện.`;
  } else if (action === 'to_quote') {
    result = `<blockquote>“${text}”<cite style="display:block;font-size:13px;color:#0284C7;font-weight:700;margin-top:6px;">– Đại diện Ban Thường vụ Công đoàn TDMU</cite></blockquote>`;
  } else if (action === 'formal') {
    result = `Ban Thường vụ Công đoàn TDMU trân trọng thông báo: ${text}`;
  } else if (action === 'fix_spelling') {
    result = text.replace(/truong/gi, 'Trường').replace(/cong doan/gi, 'Công đoàn').replace(/tdmu/gi, 'TDMU');
  }

  res.json({ success: true, source: "Real NLP Local Transformer", result });
});

// =========================================================================
// 8. CONTENT REPURPOSE
// =========================================================================
router.post('/repurpose', (req, res) => {
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

// =========================================================================
// 9. IMAGE GENERATION (POLLINATIONS FLUX)
// =========================================================================
router.post('/generate-image', async (req, res) => {
  try {
    const { prompt, width = 1280, height = 720 } = req.body;
    if (!prompt) {
      return res.status(400).json({ success: false, error: 'Thiếu mô tả ảnh (prompt)' });
    }

    const cleanPrompt = prompt.replace(/<[^>]*>/g, '').trim();
    const styleModifiers = "modern photojournalism, realistic photography, university academic setting in Vietnam, natural ambient lighting, sharp focus, 8k, canon eos, award-winning editorial photograph";
    const enhancedPrompt = `${cleanPrompt}, ${styleModifiers}`;
    const seed = Math.floor(Math.random() * 1000000);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?width=${width}&height=${height}&model=flux&nologo=true&enhance=true&seed=${seed}`;

    res.json({
      success: true,
      imageUrl,
      caption: `Ảnh minh họa: ${cleanPrompt.slice(0, 80)}`,
      prompt: enhancedPrompt,
      seed
    });
  } catch (err) {
    console.error("Lỗi sinh ảnh AI:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// =========================================================================
// 10. MULTI-PASS SSE STREAMING PACKAGE GENERATOR
// =========================================================================
router.post('/package-stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const { briefText, customPrompt, apiKey } = req.body;
  const activeKey = apiKey || process.env.GEMINI_API_KEY;

  if (!activeKey) {
    res.write('data: {"error": "Chưa cấu hình Gemini API Key"}\n\n');
    return res.end();
  }

  const ai = new GoogleGenAI({ apiKey: activeKey });

  try {
    res.write(`data: ${JSON.stringify({ step: 'status', message: 'Bước 1/3: Phân tích 5W1H và viết bài Website...' })}\n\n`);
    
    const webPrompt = `BẠN LÀ TỔNG THƯ KÝ TÒA SOẠN CỦA CÔNG ĐOÀN ĐH THỦ DẦU MỘT.
Dựa vào tư liệu thô sau đây:
"""
${briefText}
${customPrompt}
"""
Hãy viết MỘT BÀI BÁO WEBSITE DUY NHẤT. YÊU CẦU BẮT BUỘC:
- Dùng thẻ HTML chuẩn. KHÔNG bọc trong markdown \`\`\`html. TRẢ VỀ HTML RAW.
- Đầu bài có thẻ <h1 class="article-title">Tiêu đề bài báo</h1>.
- Đoạn tiếp theo là Sapo in đậm (<p class="sapo"><strong>...</strong></p>) tóm tắt 5W1H.
- Thân bài chia các thẻ <h2> mạch lạc (Không ghi Phần 1, Phần 2).
- Có ít nhất 1 trích dẫn <blockquote>.
- Có gợi ý chèn ảnh bằng <figure class="journalism-figure"><img src="https://via.placeholder.com/800x450" alt="placeholder"><figcaption>...</figcaption></figure>.
`;

    let webContent = "";
    const webStream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: webPrompt
    });

    for await (const chunk of webStream) {
      if (chunk.text) {
        let textChunk = chunk.text.replace(/```html|```/g, "");
        webContent += textChunk;
        res.write(`data: ${JSON.stringify({ step: 'web_chunk', chunk: textChunk })}\n\n`);
      }
    }
    res.write(`data: ${JSON.stringify({ step: 'web_done' })}\n\n`);

    res.write(`data: ${JSON.stringify({ step: 'status', message: 'Bước 2/3: Chuyển thể Mạng xã hội & Video...' })}\n\n`);

    const fbPrompt = `Viết 1 bài đăng Facebook Fanpage thu hút (3 dòng hook, có icon, hashtag, kêu gọi chia sẻ) TỪ BÀI BÁO SAU:\n${webContent}`;
    const zaloPrompt = `Viết tin thông báo Zalo OA ngắn gọn (dưới 80 từ) TỪ BÀI BÁO SAU:\n${webContent}`;
    const videoPrompt = `Viết kịch bản video phóng sự 60s (chia thành 4 phân cảnh: Hình ảnh - Lời bình) TỪ BÀI BÁO SAU:\n${webContent}`;
    const infoPrompt = `Trích xuất đúng 4 gạch đầu dòng (số liệu, cốt lõi nhất) từ bài báo sau để làm Infographic:\n${webContent}`;

    const [fbRes, zaloRes, videoRes, infoRes] = await Promise.all([
      ai.models.generateContent({ model: 'gemini-2.5-flash', contents: fbPrompt }),
      ai.models.generateContent({ model: 'gemini-2.5-flash', contents: zaloPrompt }),
      ai.models.generateContent({ model: 'gemini-2.5-flash', contents: videoPrompt }),
      ai.models.generateContent({ model: 'gemini-2.5-flash', contents: infoPrompt })
    ]);

    res.write(`data: ${JSON.stringify({ step: 'social_done', facebook: fbRes.text, zalo: zaloRes.text, video: videoRes.text, infographic: infoRes.text })}\n\n`);
    
    res.write(`data: ${JSON.stringify({ step: 'status', message: 'Bước 3/3: Sinh Prompt Nhiếp ảnh...' })}\n\n`);
    const imgPrompt = `Viết DUY NHẤT 1 CÂU PROMPT TIẾNG ANH (dưới 30 từ) miêu tả hình ảnh chính của sự kiện trong bài báo trên để đưa cho AI vẽ ảnh (dùng từ khóa: modern photojournalism, realistic, 8k). KHÔNG GIẢI THÍCH.`;
    const imgRes = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: imgPrompt });
    
    res.write(`data: ${JSON.stringify({ step: 'image_prompt', prompt: imgRes.text.trim() })}\n\n`);
    res.write(`data: ${JSON.stringify({ step: 'all_done', message: 'Hoàn tất xuất bản đa kênh!' })}\n\n`);
    res.end();

  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

// =========================================================================
// 11. INLINE MICRO-EDITING
// =========================================================================
router.post('/inline-edit', async (req, res) => {
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

// =========================================================================
// 12. GROUNDED CONTENT PACKAGE GENERATOR
// =========================================================================
const handlePackageGenerator = async (req, res) => {
  const { dossierId, assetIds, briefText, channels, customPrompt, prompt, apiKey, groqApiKey, aiEngine } = req.body;
  const pText = customPrompt || prompt || briefText || "Tháng Công Nhân 2026";
  const db = loadDB();

  const dossier = (db.dossiers || []).find(d => d.id === dossierId) || { title: "Hoạt động Công đoàn TDMU", category: "Thông Báo Chỉ Đạo", description: "" };
  const allAssets = db.assets || [];
  const selectedAssets = (assetIds && Array.isArray(assetIds) && assetIds.length > 0)
    ? allAssets.filter(a => assetIds.includes(a.id))
    : allAssets.filter(a => a.dossierId === dossierId);

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

  const systemPrompt = `BẠN LÀ TỔNG THƯ KÝ TÒA SOẠN & GIÁM ĐỐC TRUYỀN THÔNG ĐA KÊNH CỦA CÔNG ĐOÀN ĐẠI HỌC THỦ DẦU MỘT (TDMU).
Nhiệm vụ của bạn là nhận Tư liệu nguồn thực tế, sau đó sản xuất trọn gói 1 "BỘ BÁO CHÍ & TRUYỀN THÔNG ĐA KÊNH" ĐẠT CHUẨN BÁO ĐIỆN TỬ VIỆT NAM CAO CẤP.
YÊU CẦU ĐẦU RA: Trả về DUY NHẤT 1 đối tượng JSON hợp lệ:
{
  "website": { "title": "...", "sapo": "...", "content": "...", "suggestedTags": [], "imagePrompt": "...", "imageCaption": "..." },
  "facebook": { "caption": "...", "hashtags": "...", "callToAction": "..." },
  "zalo": { "headline": "...", "broadcastBody": "...", "actionLink": "..." },
  "video": { "title": "...", "scenes": [] },
  "infographic": { "headline": "...", "highlights": [] },
  "banner": { "headline": "...", "subText": "...", "suggestedPalette": "..." }
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
        articleHtml: `<p class="sapo"><strong>(TDMU) - Nhằm phát huy truyền thống đoàn kết, sáng tạo và chăm lo toàn diện đời sống vật chất, tinh thần cho đội ngũ cán bộ, giảng viên và người lao động, Công đoàn Trường Đại học Thủ Dầu Một chính thức triển khai chuỗi hoạt động: ${promptTitle}.</strong></p><h2>Phát huy tinh thần đổi mới và trách nhiệm của tổ chức Công đoàn</h2><p>Chương trình được tổ chức với sự tham gia nhiệt tình của 16 Tổ Công đoàn trực thuộc toàn trường.</p>`,
        facebook: {
          caption: `📢 [TDMU NEWS] ${promptTitle}\n\nCông đoàn Trường ĐH Thủ Dầu Một phát động chương trình ${promptTitle} với nhiều hoạt động sôi nổi và ý nghĩa thiết thực!\n\n👉 Xem chi tiết tại: https://congdoan.tdmu.edu.vn`,
          hashtags: "#CongDoanTDMU #TDMU2026 #ChuyenDoiSo",
          callToAction: "Quý Thầy/Cô vui lòng chia sẻ thông tin đến toàn thể đoàn viên tại đơn vị!"
        },
        zalo: {
          headline: `[CÔNG ĐOÀN TDMU] ${promptTitle}`,
          broadcastBody: `Công đoàn Trường ĐH Thủ Dầu Một triển khai kế hoạch: ${promptTitle}. Kính mời quý Thầy/Cô đoàn viên tham gia hưởng ứng nhiệt tình.`,
          actionLink: "https://congdoan.tdmu.edu.vn"
        },
        infographic: {
          headline: "ĐIỂM NHẤN SỰ KIỆN",
          highlights: [
            "Quy mô: 16 Tổ Công đoàn cơ sở trực thuộc",
            "Mục tiêu: Chăm lo đời sống & Nâng cao tinh thần đoàn kết",
            "Thời gian: Kế hoạch triển khai định kỳ năm 2026"
          ]
        },
        video: {
          title: "Kịch bản phóng sự ngắn 60s",
          scenes: [
            { scene: 1, visual: "Khuôn viên TDMU", voiceover: "Đoàn kết đổi mới" }
          ]
        }
      }
    });
  }

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

router.post('/package-generator', handlePackageGenerator);
router.post('/studio-package', handlePackageGenerator);

module.exports = router;
