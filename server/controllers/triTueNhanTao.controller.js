/**
 * AI Controller - Điều Phối Trí Tuệ Nhân Tạo (Tổng Biên Tập AI Newsroom)
 * Công Đoàn Trường Đại Học Thủ Dầu Một
 *
 * Tích hợp:
 *  - Google Gemini Flash (Vision & Trích xuất Fact)
 *  - Groq Cloud (Qwen / LLaMA tốc độ cao < 1s)
 *  - Local LLaMA Engine (Dự phòng khi offline)
 */

const { parseDocumentBuffer } = require('../services/dichVuDocTaiLieu.service');
const {
  GoogleGenAI,
  callGroqAPI,
  normalizeAiGenerateOutput,
  normalizeAiChatOutput,
  inspectPhotoWithAiVision
} = require('../services/dichVuAI.service');
const { isLocalModelAvailable, MODEL_PATH } = require('../services/dongCoAiCucBo.service');

/**
 * Trạng thái AI Engine cục bộ
 */
function getLocalEngineStatus(req, res) {
  res.json({
    success: true,
    available: isLocalModelAvailable(),
    modelName: 'Qwen2.5-1.5B-Instruct-Q4_K_M',
    modelPath: MODEL_PATH,
    engine: 'node-llama-cpp (Vulkan/GPU Embedded)'
  });
}

/**
 * Nạp & phân tích tài liệu đa định dạng (PDF, DOCX, XLSX, PPTX)
 */
async function uploadAndParseDocument(req, res) {
  const { fileBase64, fileName, extractFactSheet, apiKey } = req.body;
  if (!fileBase64) return res.status(400).json({ success: false, error: 'Thiếu dữ liệu file' });

  try {
    const cleanBase64 = fileBase64.replace(/^data:.*?;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    const safeName = fileName || 'tailieu.txt';

    const parsed = await parseDocumentBuffer(buffer, safeName);
    let factSheet = null;

    const activeKey = apiKey || process.env.GEMINI_API_KEY;
    if (extractFactSheet && activeKey && (parsed.markdown || parsed.rawText)) {
      try {
        const ai = new GoogleGenAI({ apiKey: activeKey });
        const factPrompt = `BẠN LÀ CHUYÊN VIÊN TRÍCH XUẤT DỮ LIỆU CỦA CÔNG ĐOÀN ĐẠI HỌC THỦ DẦU MỘT. Trích xuất thời gian, địa điểm, chủ trì, con số nổi bật dưới dạng bullet points:\n\n${(parsed.markdown || parsed.rawText).slice(0, 4000)}`;
        const r = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: factPrompt
        });
        factSheet = r.text();
      } catch {}
    }

    res.json({
      success: true,
      fileName: safeName,
      parsedLength: (parsed.markdown || parsed.rawText).length,
      markdown: parsed.markdown,
      rawText: parsed.rawText,
      factSheet
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Nhận diện & Sinh chú thích báo chí cho ảnh sự kiện (AI Vision)
 */
async function inspectPhoto(req, res) {
  const { imageBase64, eventContext, apiKey } = req.body;
  if (!imageBase64) return res.status(400).json({ success: false, error: 'Thiếu dữ liệu ảnh' });

  try {
    const caption = await inspectPhotoWithAiVision({
      imageBase64,
      eventContext: eventContext || 'Sự kiện Công Đoàn Trường ĐH Thủ Dầu Một',
      apiKey: apiKey || process.env.GEMINI_API_KEY
    });
    res.json({ success: true, caption });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getLocalEngineStatus,
  uploadAndParseDocument,
  inspectPhoto
};
