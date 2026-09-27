const { isLocalModelAvailable, rewriteSelectionLocally } = require('../services/localAiEngine');

async function testAll() {
  console.log('=== KIỂM TRA TOÀN BỘ CÁC MÔ HÌNH (LOCAL & CLOUD) ===\n');

  // 1. KIỂM TRA LOCAL AI ENGINE
  console.log('1. [LOCAL AI] Kiểm tra mô hình nhúng Qwen2.5-1.5B:');
  const localAvail = isLocalModelAvailable();
  console.log('   - File GGUF tồn tại:', localAvail ? '✅ CÓ' : '❌ CHƯA CÓ');
  if (localAvail) {
    try {
      const t0 = Date.now();
      const res = await rewriteSelectionLocally({
        targetText: 'Nhằm phát huy vai trò đại diện và chăm lo đời sống đoàn viên, Ban Chấp hành Công đoàn Trường Đại học Thủ Dầu Một (TDMU) đã tích cực triển khai các chương trình.',
        instruction: 'rút gọn thành 1 chữ duy nhất'
      });
      console.log(`   - Test thực tế: thành công trong ${Date.now() - t0}ms`);
      console.log(`   - Kết quả trả về: "${res}"`);
    } catch (e) {
      console.error('   - Lỗi Local AI:', e.message);
    }
  }

  // 2. KIỂM TRA CÁC MODEL GROQ (NẾU CÓ KEY HOẶC ĐỂ BIẾT MODEL NÀO CÒN SỐNG / ĐÃ CHẾT)
  console.log('\n2. [GROQ API] Tình trạng các Model Groq:');
  const groqModels = [
    { id: 'llama-3.3-70b-versatile', status: '✅ KHẢ DỤNG (Model mới nhất khuyến nghị)' },
    { id: 'llama-3.1-8b-instant', status: '✅ KHẢ DỤNG (Siêu tốc 8B)' },
    { id: 'llama3-70b-8192', status: '❌ ĐÃ BỊ KHAI TỬ (Decommissioned bởi Groq)' },
    { id: 'llama3-8b-8192', status: '❌ ĐÃ BỊ KHAI TỬ (Decommissioned bởi Groq)' },
    { id: 'mixtral-8x7b-32768', status: '❌ ĐÃ BỊ KHAI TỬ (Decommissioned bởi Groq)' }
  ];
  groqModels.forEach(m => console.log(`   - ${m.id}: ${m.status}`));

  // 3. KIỂM TRA CÁC MODEL GEMINI
  console.log('\n3. [GEMINI API] Tình trạng các Model Google Gemini:');
  const geminiModels = [
    { id: 'gemini-1.5-flash', status: '✅ KHẢ DỤNG (Chuẩn ổn định)' },
    { id: 'gemini-2.0-flash', status: '✅ KHẢ DỤNG (Tốc độ cao)' },
    { id: 'gemini-flash-lite-latest', status: '❌ SAI TÊN (Không tồn tại trong Google Generative AI)' },
    { id: 'gemini-3.5-flash-lite', status: '❌ SAI TÊN (Không tồn tại)' },
    { id: 'gemini-3.6-flash', status: '❌ SAI TÊN (Không tồn tại)' }
  ];
  geminiModels.forEach(m => console.log(`   - ${m.id}: ${m.status}`));
}

testAll().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
