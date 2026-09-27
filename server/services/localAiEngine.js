const fs = require('fs');
const path = require('path');

const MODEL_PATH = path.join(__dirname, '..', 'models', 'qwen2.5-1.5b-instruct-q4_k_m.gguf');

let llamaInstance = null;
let modelInstance = null;
let contextInstance = null;
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

/**
 * Chỉnh sửa và viết lại đoạn văn bám sát chỉ thị của người dùng (100% Offline trên máy)
 */
async function rewriteSelectionLocally({ targetText, instruction }) {
  if (!targetText || !targetText.trim()) return '';
  const cleanTarget = targetText.trim();
  const cleanInstruction = (instruction || 'Hãy trau chuốt và viết lại đoạn văn này cho trang trọng, chuẩn văn phong báo chí chính luận.').trim();

  const { context } = await initLocalAiEngine();
  const { LlamaChatSession } = await import('node-llama-cpp');

  // Khởi tạo sequence riêng biệt và giải phóng ngay sau khi sinh để tránh ô nhiễm KV Cache
  const seq = context.getSequence();
  try {
    await seq.clearHistory();

    const session = new LlamaChatSession({
      contextSequence: seq,
      systemPrompt: `Bạn là công cụ biên tập và biến đổi văn bản tự động chính xác cao.
Nhiệm vụ: Chỉ xuất ra duy nhất đoạn văn bản kết quả sau khi chỉnh sửa theo chỉ thị.
Quy tắc bắt buộc:
- TUYỆT ĐỐI KHÔNG bao giờ chào hỏi, KHÔNG xin lỗi, KHÔNG giải thích lý do hay bình luận.
- TUYỆT ĐỐI KHÔNG lặp lại đề bài, không in lại tiền tố như "Kết quả:", "Đoạn văn:".
- Trả về đúng nội dung văn bản thuần túy đã được chỉnh sửa.`
    });

    const prompt = `[Ví dụ mẫu 1]
Văn bản: đại học thủ dầu một
Yêu cầu: viết hoa toàn bộ
Kết quả: ĐẠI HỌC THỦ DẦU MỘT

[Ví dụ mẫu 2]
Văn bản: ngày mai chúng ta đi làm
Yêu cầu: sửa ngày mai thành hôm nay
Kết quả: hôm nay chúng ta đi làm

[Văn bản cần sửa]
Văn bản: ${cleanTarget}
Yêu cầu: ${cleanInstruction}
Kết quả:`;

    const startTime = Date.now();
    const response = await session.prompt(prompt, {
      temperature: 0.1,
      maxTokens: 300,
      stop: ['\n\n', '\n[', 'Văn bản:', 'Yêu cầu:', '[Ví dụ']
    });

    const elapsed = Date.now() - startTime;
    let revised = response.trim()
      .replace(/^```[a-z]*\n?/gi, '')
      .replace(/```$/gi, '')
      .replace(/^["'`“”«»]{1,3}\s*/g, '')
      .replace(/\s*["'`“”«»]{1,3}$/g, '')
      .trim();

    // Cắt bỏ bất kỳ nội dung dư thừa sau ngắt dòng mô phỏng đề bài
    revised = revised.split(/\n\s*\[/)[0].trim();
    revised = revised.split(/\n\s*Văn bản:/i)[0].trim();
    revised = revised.split(/\n\s*Yêu cầu:/i)[0].trim();

    // Lọc sạch các tiền tố meta-prompt nếu mô hình sinh ra
    revised = revised.replace(/^\[?(?:kết quả|nội dung mới|văn bản mới|đã sửa)\]?:?\s*/i, '');
    revised = revised.replace(/^.*?(?:đoạn văn mới(?: đã sửa)?|dưới đây là phiên bản(?: đã sửa)?):?\s*/is, '');
    revised = revised.replace(/^(?:tôi xin lỗi|xin lỗi).*?\n+/is, '');
    revised = revised.replace(/^["'`“”«»]{1,3}\s*/g, '').replace(/\s*["'`“”«»]{1,3}$/g, '').trim();

    // Bắt và trích xuất chuỗi trong ngoặc kép nếu mô hình vô tình bọc kết quả
    if (/^(tôi xin lỗi|xin lỗi|dưới đây là)/i.test(revised) || revised.includes('YÊU CẦU CHỈNH SỬA')) {
      const match = revised.match(/["'“]([^"'“”]{2,})["'”]$/);
      if (match && match[1]) {
        revised = match[1].trim();
      }
    }

    console.log(`[Local AI Rewrite] Hoàn tất sau ${elapsed}ms | Input: ${cleanTarget.length} ký tự -> Output: ${revised.length} ký tự`);
    return revised;
  } finally {
    try {
      seq.dispose();
    } catch {}
  }
}

module.exports = {
  isLocalModelAvailable,
  initLocalAiEngine,
  rewriteSelectionLocally,
  MODEL_PATH
};
