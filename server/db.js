const fs = require('fs');
const path = require('path');

const dbFilePath = path.join(__dirname, 'database.json');

// Real-Time Persistent Database Schema (Cleaned of fake junk)
const defaultData = {
  roles: [
    { id: 1, name: 'admin', displayName: 'Quản Trị Viên (Admin)', description: 'Toàn quyền kiểm soát và quản lý hệ thống' },
    { id: 2, name: 'editor', displayName: 'Biên Tập Viên (Editor)', description: 'Biên tập, phê duyệt bài viết và đặt lịch xuất bản' },
    { id: 3, name: 'contributor', displayName: 'Cộng Tác Viên (Contributor)', description: 'Soạn thảo bài viết, sử dụng AI sáng tạo nội dung' }
  ],
  users: [
    { id: 1, name: 'Thầy Nguyễn Văn A', email: 'admin@tdmu.edu.vn', roleId: 1, roleName: 'Quản Trị Viên (Admin)', department: 'Ban Chấp Hành Công Đoàn' },
    { id: 2, name: 'Cô Trần Thị B', email: 'editor@tdmu.edu.vn', roleId: 2, roleName: 'Biên Tập Viên (Editor)', department: 'Ban Truyền Thông' },
    { id: 3, name: 'Thầy Lê Văn C', email: 'contributor@tdmu.edu.vn', roleId: 3, roleName: 'Cộng Tác Viên (Contributor)', department: 'Công Đoàn Khoa CNTT' }
  ],
  categories: [
    { id: 1, name: 'Phong Trào Thể Thao', slug: 'phong-trao-the-thao', description: 'Hoạt động thể thao, bóng đá, bóng chuyền cán bộ' },
    { id: 2, name: 'Thông Báo Chỉ Đạo', slug: 'thong-bao-chi-dao', description: 'Văn bản, thông báo từ Ban Thường vụ Công đoàn' },
    { id: 3, name: 'Quỹ Công Đoàn', slug: 'quy-cong-doan', description: 'Công tác trợ cấp, chăm lo đời sống đoàn viên' },
    { id: 4, name: 'Khen Thưởng & Chăm Lo', slug: 'khen-thuong-cham-lo', description: 'Tuyên dương tấm gương nhà giáo xuất sắc' }
  ],
  articles: [
    {
      id: 101,
      title: "Công Đoàn TDMU Đẩy Mạnh Ứng Dụng Trí Tuệ Nhân Tạo (AI) Trong Sáng Tạo Nội Dung Truyền Thông 2026",
      slug: "cong-doan-tdmu-day-manh-ung-dung-ai-2026",
      categoryId: 2,
      categoryName: "Thông Báo Chỉ Đạo",
      summary: "Công đoàn Trường Đại học Thủ Dầu Một chính thức triển khai trợ lý AI hỗ trợ biên soạn tin tức và đăng tải đa nền tảng.",
      content: "<h2>Chuyển Đổi Số Công Tác Truyền Thông TDMU 2026</h2><p>Nhằm nâng cao hiệu quả công tác truyền thông và giảm bớt thời gian biên soạn cho đội ngũ cán bộ kiêm nhiệm, Ban Thường vụ Công đoàn Trường Đại học Thủ Dầu Một (TDMU) đã triển khai đề tài chuyển đổi số tích hợp AI trong công tác quản trị nội dung (CMS).</p><p>Hệ thống tích hợp Google Gemini API giúp tự động hóa khâu tạo bài viết, đề xuất tiêu đề và xuất bản bài đăng lên Fanpage Facebook thời gian thực.</p>",
      image: "images/banner.jpg",
      author: "Thầy Nguyễn Văn A (Admin)",
      authorId: 1,
      status: "published",
      statusName: "Đã Xuất Bản",
      isAiGenerated: true,
      aiPrompt: "Viết bài thông báo chuyển đổi số AI Công đoàn TDMU",
      viewsCount: 1250,
      likesCount: 340,
      sharesCount: 95,
      createdAt: "2026-08-17 08:30",
      scheduledAt: "2026-08-17 08:30"
    }
  ],
  events: [],
  media: [
    { id: 1, fileName: "banner.jpg", filePath: "images/banner.jpg", mimeType: "image/jpeg", fileSize: "185 KB", category: "Hội Nghị", uploadedAt: "2026-08-17" },
    { id: 2, fileName: "sports.jpg", filePath: "images/sports.jpg", mimeType: "image/jpeg", fileSize: "240 KB", category: "Thể Thao", uploadedAt: "2026-08-17" },
    { id: 3, fileName: "tdmu_logo.png", filePath: "images/tdmu_logo.png", mimeType: "image/png", fileSize: "86 KB", category: "Logo", uploadedAt: "2026-08-17" }
  ],
  comments: [],
  audits: [
    { id: 1, articleId: 101, userId: 1, userName: "Thầy Nguyễn Văn A (Admin)", action: "Khởi Tạo Hệ Thống", details: "Khởi tạo thành công hệ thống CSDL vĩnh viễn", timestamp: "2026-08-17 08:30" }
  ],
  schedules: [],
  publish_logs: []
};

function initDB() {
  if (!fs.existsSync(dbFilePath)) {
    saveDB(defaultData);
  }
}

function loadDB() {
  initDB();
  try {
    const raw = fs.readFileSync(dbFilePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return defaultData;
  }
}

function saveDB(data) {
  fs.writeFileSync(dbFilePath, JSON.stringify(data, null, 2), 'utf8');
}

module.exports = { loadDB, saveDB };
