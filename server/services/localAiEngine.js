const fs = require('fs');
const path = require('path');

const MODEL_PATH = path.join(__dirname, '..', 'models', 'qwen2.5-1.5b-instruct-q4_k_m.gguf');

let llamaInstance = null;
let modelInstance = null;
let contextInstance = null;
let sessionInstance = null;
let isInitializing = false;
let initPromise = null;

/**
 * Kiểm tra xem tệp mô hình cục bộ GGUF đã có trong thư mục server/models chưa
 */
function isLocalModelAvailable() {
  if (!fs.existsSync(MODEL_PATH)) return false;
  try {
    const stat = fs.statSync(MODEL_PATH);
    return stat.size > 500 * 1024 * 1024; // Lớn hơn 500MB
  } catch {
    return false;
  }
}

/**
 * Khởi tạo động cơ node-llama-cpp nhúng cục bộ (In-Process)
 */
async function initLocalAiEngine() {
  if (modelInstance && contextInstance) return { llama: llamaInstance, model: modelInstance, context: contextInstance };
  if (isInitializing && initPromise) return initPromise;

  isInitializing = true;
  initPromise = (async () => {
    try {
      if (!isLocalModelAvailable()) {
        throw new Error(`Chưa tìm thấy tệp mô hình tại ${MODEL_PATH}. Hãy chạy "npm run download-model" trước.`);
      }

      console.log(`[Local AI Engine] Đang khởi động node-llama-cpp và nạp mô hình: ${path.basename(MODEL_PATH)}...`);
      const { getLlama } = await import('node-llama-cpp');
      
      llamaInstance = await getLlama();
      modelInstance = await llamaInstance.loadModel({
        modelPath: MODEL_PATH
      });

      contextInstance = await modelInstance.createContext({
        contextSize: 2048 // 2k token là cực kỳ dư dả cho tác vụ sửa đoạn văn bản
      });

      console.log(`[Local AI Engine] ✅ Nạp mô hình Qwen2.5-1.5B thành công! Động cơ sẵn sàng phản hồi siêu tốc.`);
      isInitializing = false;
      return { llama: llamaInstance, model: modelInstance, context: contextInstance };
    } catch (err) {
      isInitializing = false;
      console.error(`[Local AI Engine Error]:`, err.message);
      throw err;
    }
  })();

  return initPromise;
}

async function getOrCreateSession() {
  if (sessionInstance) {
    try {
      sessionInstance.setChatHistory([]);
    } catch {}
    return sessionInstance;
  }

  const { context } = await initLocalAiEngine();
  const { LlamaChatSession } = await import('node-llama-cpp');

  sessionInstance = new LlamaChatSession({
    contextSequence: context.getSequence(),
    systemPrompt: `BẠN LÀ TỔNG BIÊN TẬP BÁO CHÍ CỦA CÔNG ĐOÀN TRƯỜNG ĐẠI HỌC THỦ DẦU MỘT (TDMU).
Nhiệm vụ của bạn là chỉnh sửa và trau chuốt đoạn văn bản được chọn theo đúng yêu cầu của người dùng.
QUY TẮC BẮT BUỘC:
1. Sửa và viết lại đoạn văn bản theo đúng yêu cầu.
2. Tuyệt đối không bịa đặt thêm số liệu, sự kiện hoặc con số không có trong đoạn gốc.
3. CHỈ TRẢ VỀ DUY NHẤT ĐOẠN VĂN BẢN MỚI ĐÃ SỬA, KHÔNG BỌC NGOẶC KÉP, KHÔNG KÈM LỜI GIẢI THÍCH HAY DẪN DẮT.`
  });

  return sessionInstance;
}

/**
 * Chỉnh sửa và viết lại đoạn văn bám sát chỉ thị của người dùng (100% Offline trên máy)
 */
async function rewriteSelectionLocally({ targetText, instruction }) {
  if (!targetText || !targetText.trim()) return '';
  const cleanTarget = targetText.trim();
  const cleanInstruction = (instruction || 'Hãy trau chuốt và viết lại đoạn văn này cho trang trọng, chuẩn văn phong báo chí chính luận.').trim();

  const session = await getOrCreateSession();

  const prompt = `ĐOẠN VĂN GỐC CẦN SỬA:
"""
${cleanTarget}
"""

YÊU CẦU CHỈNH SỬA CỦA NGƯỜI DÙNG:
"${cleanInstruction}"

ĐOẠN VĂN MỚI ĐÃ SỬA (CHỈ GHI NỘI DUNG VĂN BẢN):`;

  const startTime = Date.now();
  const response = await session.prompt(prompt, {
    temperature: 0.3,
    maxTokens: 500
  });

  const elapsed = Date.now() - startTime;
  let revised = response.trim()
    .replace(/^```[a-z]*\n?/gi, '')
    .replace(/```$/gi, '')
    .replace(/^["'`“”«»]{1,3}\s*/g, '')
    .replace(/\s*["'`“”«»]{1,3}$/g, '')
    .trim();

  console.log(`[Local AI Rewrite] Hoàn tất sau ${elapsed}ms | Input: ${cleanTarget.length} ký tự -> Output: ${revised.length} ký tự`);
  return revised;
}

module.exports = {
  isLocalModelAvailable,
  initLocalAiEngine,
  rewriteSelectionLocally,
  MODEL_PATH
};
