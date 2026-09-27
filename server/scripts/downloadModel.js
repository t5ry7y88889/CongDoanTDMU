const fs = require('fs');
const path = require('path');
const https = require('https');

const MODEL_DIR = path.join(__dirname, '..', 'models');
const MODEL_NAME = 'qwen2.5-1.5b-instruct-q4_k_m.gguf';
const TARGET_FILE = path.join(MODEL_DIR, MODEL_NAME);
const TMP_FILE = TARGET_FILE + '.tmp';

const MODEL_URL = 'https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q4_k_m.gguf';
const EXPECTED_SIZE = 1117320736;

async function download() {
  if (!fs.existsSync(MODEL_DIR)) {
    fs.mkdirSync(MODEL_DIR, { recursive: true });
  }

  if (fs.existsSync(TARGET_FILE)) {
    const stat = fs.statSync(TARGET_FILE);
    if (stat.size >= EXPECTED_SIZE * 0.99) {
      console.log(`✅ Model ${MODEL_NAME} đã tồn tại sẵn sàng (${(stat.size / (1024 * 1024)).toFixed(1)} MB). Không cần tải lại!`);
      return;
    }
  }

  console.log(`🚀 Bắt đầu tải mô hình AI Local: ${MODEL_NAME}...`);
  console.log(`📡 Nguồn: ${MODEL_URL}`);
  console.log(`💾 Lưu vào: ${TARGET_FILE}`);

  let downloadedBytes = 0;
  if (fs.existsSync(TMP_FILE)) {
    downloadedBytes = fs.statSync(TMP_FILE).size;
    console.log(`🔄 Phát hiện tệp tạm, tiếp tục tải từ byte ${downloadedBytes} (${(downloadedBytes / (1024 * 1024)).toFixed(1)} MB)...`);
  }

  function doRequest(url, startByte = 0) {
    return new Promise((resolve, reject) => {
      const parsed = new URL(url);
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) TDMU-LocalAI-Downloader/1.0'
      };
      if (startByte > 0) {
        headers['Range'] = `bytes=${startByte}-`;
      }

      https.get(url, { headers }, (res) => {
        // Xử lý chuyển hướng HTTP (301, 302, 307)
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return resolve(doRequest(res.headers.location, startByte));
        }

        if (res.statusCode !== 200 && res.statusCode !== 206) {
          return reject(new Error(`Tải tệp thất bại với mã trạng thái HTTP: ${res.statusCode}`));
        }

        const totalBytes = parseInt(res.headers['content-length'] || '0', 10) + startByte;
        const fileStream = fs.createWriteStream(TMP_FILE, { flags: startByte > 0 ? 'a' : 'w' });

        let current = startByte;
        let lastLogged = Date.now();
        let lastBytes = current;

        res.on('data', (chunk) => {
          current += chunk.length;
          fileStream.write(chunk);

          const now = Date.now();
          if (now - lastLogged >= 3000) {
            const speed = ((current - lastBytes) / 1024 / 1024 / ((now - lastLogged) / 1000)).toFixed(1);
            const percent = totalBytes > 0 ? ((current / totalBytes) * 100).toFixed(1) : '?';
            console.log(`⏳ Tiến độ: ${percent}% [${(current / 1024 / 1024).toFixed(1)} MB / ${(totalBytes / 1024 / 1024).toFixed(1)} MB] - Tốc độ: ${speed} MB/s`);
            lastLogged = now;
            lastBytes = current;
          }
        });

        res.on('end', () => {
          fileStream.end(() => {
            if (fs.existsSync(TARGET_FILE)) {
              try { fs.unlinkSync(TARGET_FILE); } catch {}
            }
            fs.renameSync(TMP_FILE, TARGET_FILE);
            console.log(`\n🎉 TẢI HOÀN TẤT THÀNH CÔNG!`);
            console.log(`📁 Tệp mô hình: ${TARGET_FILE} (${(current / 1024 / 1024).toFixed(1)} MB)`);
            resolve();
          });
        });

        res.on('error', (err) => {
          fileStream.close();
          reject(err);
        });
      }).on('error', reject);
    });
  }

  await doRequest(MODEL_URL, downloadedBytes);
}

download().catch(err => {
  console.error('❌ Lỗi khi tải mô hình:', err);
  process.exit(1);
});
