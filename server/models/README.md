# THƯ MỤC CHỨA MÔ HÌNH AI CỤC BỘ (OFFLINE GGUF MODEL)

Thư mục này được sử dụng khi hệ thống chạy ở chế độ **AI Cục Bộ (Local AI)** không cần kết nối mạng Internet.

### 1. Chế độ Mặc định (Khuyên dùng)
Hệ thống mặc định sử dụng các mô hình đám mây tốc độ cao qua API:
- **Groq Cloud API** (Qwen 2.5 32B / Llama 3.3 70B Versatile)
- **Google Gemini API** (Gemini 2.5 Flash)

Không cần tải thêm tệp mô hình nào trong thư mục này nếu chạy bằng Cloud API.

### 2. Tải mô hình Offline (Tùy chọn)
Nếu muốn chạy hoàn toàn offline không cần Internet, bạn có thể tải mô hình Qwen 2.5 1.5B GGUF bằng lệnh:
```bash
node server/scripts/downloadModel.js
```
Tệp mô hình tải về sẽ được đặt tại:
`server/models/qwen2.5-1.5b-instruct-q4_k_m.gguf`
