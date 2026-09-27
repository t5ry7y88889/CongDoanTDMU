const path = require('path');
const { isLocalModelAvailable, rewriteSelectionLocally, MODEL_PATH } = require('../services/localAiEngine');

async function runDemo() {
  console.log('================================================================');
  console.log('   DEMO KIỂM THỬ ĐỘNG CƠ AI LOCAL NHÚNG TRONG DỰ ÁN TDMU');
  console.log('================================================================\n');

  console.log('1. Kiểm tra sự tồn tại của tệp mô hình GGUF:');
  console.log('   - Đường dẫn:', MODEL_PATH);
  console.log('   - Trạng thái khả dụng:', isLocalModelAvailable() ? '✅ ĐÃ CÓ MẶT SẴN SÀNG' : '❌ CHƯA CÓ');

  if (!isLocalModelAvailable()) {
    console.error('Không tìm thấy tệp mô hình!');
    process.exit(1);
  }

  // TEST CASE 1: Rút gọn văn bản
  console.log('\n----------------------------------------------------------------');
  console.log('TEST 1: YÊU CẦU RÚT GỌN CÂU VĂN BẢN BÔI ĐEN');
  const sample1 = 'Ban Chấp hành Công đoàn Trường Đại học Thủ Dầu Một đã tích cực triển khai nhiều chương trình hành động thiết thực, đồng thời tổ chức thăm hỏi, động viên và trao tặng các phần quà ý nghĩa cho toàn thể cán bộ, viên chức và người lao động nhân dịp chào đón năm học mới 2026.';
  const instruction1 = 'Hãy rút gọn câu này thật súc tích, giữ nguyên các ý chính quan trọng.';

  console.log('Đoạn văn gốc:');
  console.log(`> "${sample1}"\n`);
  console.log(`Yêu cầu lệnh: "${instruction1}"`);
  
  console.log('\nĐang gọi Local AI Model (Qwen2.5-1.5B GGUF)...');
  const t0 = Date.now();
  const result1 = await rewriteSelectionLocally({ targetText: sample1, instruction: instruction1 });
  const t1 = Date.now();

  console.log(`\n✅ Kết quả đã sửa bởi Local AI (Thời gian xử lý: ${t1 - t0}ms):`);
  console.log(`> "${result1}"`);

  // TEST CASE 2: Nâng cấp văn phong chính luận trang trọng
  console.log('\n----------------------------------------------------------------');
  console.log('TEST 2: NÂNG CẤP VĂN PHONG BÁO CHÍ TRANG TRỌNG');
  const sample2 = 'Hôm qua trường mình tổ chức hội thao vui lắm, thầy cô tham gia rất đông và ai cũng hào hứng.';
  const instruction2 = 'Biên tập lại theo phong cách báo chí chính luận công đoàn, trang trọng và truyền cảm hứng.';

  console.log('Đoạn văn gốc:');
  console.log(`> "${sample2}"\n`);
  console.log(`Yêu cầu lệnh: "${instruction2}"`);

  console.log('\nĐang gọi Local AI Model...');
  const t2 = Date.now();
  const result2 = await rewriteSelectionLocally({ targetText: sample2, instruction: instruction2 });
  const t3 = Date.now();

  console.log(`\n✅ Kết quả đã sửa bởi Local AI (Thời gian xử lý: ${t3 - t2}ms):`);
  console.log(`> "${result2}"`);

  console.log('\n================================================================');
  console.log('   🎉 DEMO THÀNH CÔNG RỰC RỠ - AI LOCAL HOẠT ĐỘNG HOÀN TOÀN TỰ TRỊ!');
  console.log('================================================================');
  process.exit(0);
}

runDemo().catch(err => {
  console.error('Lỗi khi chạy demo:', err);
  process.exit(1);
});
