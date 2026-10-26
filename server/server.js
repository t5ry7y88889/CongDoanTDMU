/**
 * ============================================================================
 * ĐỒ ÁN CHUYÊN NGÀNH: XÂY DỰNG WEBSITE TRUYỀN THÔNG CÔNG ĐOÀN ĐH THỦ DẦU MỘT
 * TÍCH HỢP TRÍ TUỆ NHÂN TẠO (AI) HỖ TRỢ TẠO VÀ ĐĂNG TẢI NỘI DUNG ĐA KÊNH
 * ============================================================================
 * File: server/server.js
 * Chức năng: Khởi động máy chủ Express Backend, đăng ký các Middleware,
 *            kết nối Cơ sở dữ liệu và ánh xạ toàn bộ API của 11 phân hệ.
 * ============================================================================
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const express = require('express');
const path = require('path');
const cors = require('cors');
const { loadDB, saveDB } = require('./db');
const { isMssqlConnected } = require('./mssql_db');

// Khởi tạo các Route phân hệ chức năng (Đã chuẩn hóa danh xưng tiếng Việt)
const triTueNhanTaoRoutes = require('./routes/triTueNhanTao.routes');
const baiVietRoutes = require('./routes/baiViet.routes');
const vanBanRoutes = require('./routes/vanBan.routes');
const phucLoiRoutes = require('./routes/phucLoi.routes');
const baoCaoThongKeRoutes = require('./routes/baoCaoThongKe.routes');
const coCauToChucRoutes = require('./routes/coCauToChuc.routes');
const homThuGopYRoutes = require('./routes/homThuGopY.routes');
const phatHanhRoutes = require('./routes/phatHanh.routes');
const bieuMauMauRoutes = require('./routes/bieuMauMau.routes');
const xacThucRoutes = require('./routes/xacThuc.routes');

const app = express();
const PORT = process.env.PORT || 3001;

// 1. Cấu hình Middleware cơ bản
app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Chống lưu bộ nhớ đệm (Cache-Control) đảm bảo dữ liệu thời gian thực
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// 2. Điều hướng trang Quản trị Studio (Phục vụ trực tiếp Cổng Quản Trị Studio chuẩn)
app.get(['/admin', '/admin.html', '/admin-portal', '/admin-portal.html', '/admin/studio'], (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.join(__dirname, '../public/admin.html'));
});

// 3. Phục vụ tài nguyên tĩnh (Static Assets)
app.use('/assets', express.static(path.join(__dirname, '../frontend/dist/assets')));
app.use('/spa', express.static(path.join(__dirname, '../frontend/dist'), { etag: false, maxAge: 0 }));
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));
app.use(express.static(path.join(__dirname, '../public'), { etag: false, maxAge: 0 }));

// 4. Đăng ký các Endpoint API chính thức
app.use('/api/ai', triTueNhanTaoRoutes); app.use('/api/tri-tue-nhan-tao', triTueNhanTaoRoutes);
app.use('/api/articles', baiVietRoutes); app.use('/api/bai-viet', baiVietRoutes);
app.use('/api/documents', vanBanRoutes); app.use('/api/van-ban', vanBanRoutes);
app.use('/api/welfare', phucLoiRoutes);
app.use('/api/phuc-loi', phucLoiRoutes);
app.use('/api/monthly-reports', baoCaoThongKeRoutes);
app.use('/api/reports', baoCaoThongKeRoutes); app.use('/api/bao-cao', baoCaoThongKeRoutes);
app.use('/api/publish', phatHanhRoutes); app.use('/api/phat-hanh', phatHanhRoutes);
app.use('/api/templates', bieuMauMauRoutes); app.use('/api/bieu-mau', bieuMauMauRoutes);
app.use('/api/auth', xacThucRoutes); app.use('/api/xac-thuc', xacThucRoutes);

// Ánh xạ các phân hệ Tổ chức, Nhân sự, Góp ý, Phản hồi
app.use('/api', coCauToChucRoutes);
app.use('/api', homThuGopYRoutes);

// Tương thích ngược endpoint tạo bài viết
app.post('/api/generate-article', (req, res, next) => {
  req.url = '/package-stream';
  triTueNhanTaoRoutes(req, res, next);
});

// 5. Tác vụ ngầm: Tự động phát hành bài viết theo lịch hẹn
setInterval(() => {
  try {
    const db = loadDB();
    const now = new Date();
    let changed = false;

    (db.articles || []).forEach(art => {
      if (art.status === 'scheduled' && art.scheduledAt) {
        const scheduledTime = new Date(art.scheduledAt);
        if (scheduledTime <= now) {
          console.log(`[Lịch hẹn] Tự động xuất bản bài viết #${art.id}: "${art.title}"`);
          art.status = 'published';
          art.statusName = 'Đã Xuất Bản';
          art.publishedAt = now.toISOString();
          changed = true;
        }
      }

      if (art.assignee_id && art.updatedAt) {
        const lastUpdate = new Date(art.updatedAt);
        const diffHours = (now - lastUpdate) / (1000 * 60 * 60);
        if (diffHours >= 24) {
          art.assignee_id = null;
          changed = true;
        }
      }
    });

    if (changed) {
      saveDB(db);
    }
  } catch (err) {
    console.error('[Lịch hẹn] Lỗi quét tự động:', err.message);
  }
}, 30000);

// Khởi chạy bộ lập lịch phát hành đa kênh (Fanpage Facebook & Zalo OA)
const { startScheduleWorker } = require('./services/dichVuDaKenh.service');
startScheduleWorker();

// 6. Định tuyến URL thân thiện cho các trang cổng thông tin
const cleanRoutes = [
  'gioi-thieu', 'co-cau-to-chuc', 'tin-tuc', 'bai-viet',
  'phuc-loi-doan-vien', 'van-ban', 'bieu-mau', 'lien-he', 'bao-cao-thang'
];
cleanRoutes.forEach(slug => {
  app.get(`/${slug}`, (req, res) => {
    res.sendFile(path.join(__dirname, `../public/${slug}.html`));
  });
});

app.get('/spa/*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// 7. Khởi động lắng nghe máy chủ
app.listen(PORT, () => {
  console.log(`================================================================`);
  console.log(`  TRƯỜNG ĐẠI HỌC THỦ DẦU MỘT - CÔNG ĐOÀN CƠ SỞ`);
  console.log(`  HỆ THỐNG TRUYỀN THÔNG & PHÒNG BIÊN TẬP AI ĐA KÊNH`);
  console.log(`================================================================`);
  console.log(`🌐 Cổng thông tin công đoàn:   http://localhost:${PORT}`);
  console.log(`⚙️  Phòng biên tập Studio AI:    http://localhost:${PORT}/admin.html`);
  console.log(`📡 Chế độ CSDL:                 MSSQL Server & JSON Live Backup`);
  console.log(`🤖 Trợ lý AI tác nhân:          Groq Cloud (Qwen) + Google Gemini Flash`);
  console.log(`🚀 Hệ thống đã sẵn sàng cho buổi báo cáo / nghiệm thu đồ án!`);
  console.log(`================================================================`);
});

module.exports = app;
