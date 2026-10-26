/**
 * Các hằng số cấu hình & hàm tiện ích cho phân hệ Admin Studio
 * Công Đoàn Trường Đại Học Thủ Dầu Một
 */

export function escHtml(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

export async function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function isMachineGeneratedCaption(cap) {
  if (!cap) return true;
  const c = String(cap).trim().toLowerCase();
  if (c.startsWith('hình ảnh chụp')) return true;
  if (c.startsWith('bức ảnh hiển thị')) return true;
  if (c.startsWith('ảnh chụp cho thấy')) return true;
  if (c.startsWith('hình chụp')) return true;
  if (c.includes('trong nhà với nhiều người') || c.includes('đang đứng hoặc ngồi')) return true;
  if (/^h[iì]nh\s*\d+/i.test(c)) return true;
  if (/^dsc[0-9_-]+/i.test(c)) return true;
  return false;
}

export function resolveJournalisticPhotoCaption(photo, index = 0, eventTitle = '', genre = '') {
  if (photo && photo.caption && !isMachineGeneratedCaption(photo.caption)) {
    return photo.caption;
  }
  const cleanContext = (eventTitle || '').trim();
  if (cleanContext) {
    return `Hình ảnh hoạt động ghi nhận tại ${cleanContext.slice(0, 80)}`;
  }
  return 'Hình ảnh hoạt động Công đoàn Trường Đại học Thủ Dầu Một';
}

export async function getFilesFromDataTransferItems(items) {
  const fileList = [];
  const queue = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.webkitGetAsEntry) {
      const entry = item.webkitGetAsEntry();
      if (entry) queue.push(entry);
    } else if (item.kind === 'file') {
      const f = item.getAsFile();
      if (f) fileList.push(f);
    }
  }

  async function traverse(entry) {
    if (!entry) return;
    if (entry.isFile) {
      await new Promise((res) => {
        entry.file((f) => {
          fileList.push(f);
          res();
        }, () => res());
      });
    } else if (entry.isDirectory) {
      const reader = entry.createReader();
      const readEntries = () => new Promise((res, rej) => reader.readEntries(res, rej));
      try {
        let entries = await readEntries();
        while (entries.length > 0) {
          for (const child of entries) {
            await traverse(child);
          }
          entries = await readEntries();
        }
      } catch {}
    }
  }

  for (const e of queue) await traverse(e);
  return fileList;
}

export const navSections = [
  { label: 'TỔNG QUAN', items: [
    { id: 'dashboard', label: 'Bảng Điều Hành', icon: 'fa-solid fa-gauge-high', color: '#38BDF8' }
  ]},
  { label: 'TRUYỀN THÔNG ĐA KÊNH', items: [
    { id: 'articles', label: 'Quản Lý Tin Tức', icon: 'fa-solid fa-newspaper', color: '#60A5FA' },
    { id: 'ai-creator', label: 'Soạn Thảo & Biên Tập', icon: 'fa-solid fa-wand-magic-sparkles', color: '#F59E0B', badge: 'CMS' },
    { id: 'schedule', label: 'Lịch Xuất Bản', icon: 'fa-solid fa-calendar-check', color: '#C084FC' },
    { id: 'documents', label: 'Kho Văn Bản', icon: 'fa-solid fa-folder-open', color: '#34D399' },
    { id: 'templates', label: 'Kho Biểu Mẫu', icon: 'fa-solid fa-file-word', color: '#0284C7', count: '5' }
  ]},
  { label: 'NGHIỆP VỤ CÔNG ĐOÀN', items: [
    { id: 'feedback', label: 'Hòm Thư Góp Ý', icon: 'fa-solid fa-envelope-open-text', color: '#EC4899' },
    { id: 'welfare', label: 'Quỹ Chăm Lo & Trợ Cấp', icon: 'fa-solid fa-hand-holding-heart', color: '#F59E0B' },
    { id: 'users', label: 'Cán Bộ & Phân Quyền', icon: 'fa-solid fa-users-gear', color: '#F87171' },
    { id: 'audits', label: 'Nhật Ký Tác Nghiệp', icon: 'fa-solid fa-clock-rotate-left', color: '#A78BFA' }
  ]}
];

export const navTitles = {
  'dashboard': 'Bảng Điều Hành & Thống Kê',
  'articles': 'Quản Lý Tin Tức & Bài Viết',
  'ai-creator': 'Soạn Thảo & Biên Tập',
  'schedule': 'Lịch Xuất Bản Đa Kênh',
  'documents': 'Kho Văn Bản Chỉ Đạo & Điều Hành',
  'templates': 'Kho Biểu Mẫu Nghiệp Vụ Công Đoàn',
  'feedback': 'Hòm Thư Góp Ý & Nguyện Vọng',
  'welfare': 'Quản Lý Quỹ Chăm Lo & Trợ Cấp Đoàn Viên',
  'users': 'Cán Bộ & Phân Quyền',
  'audits': 'Nhật Ký Tác Nghiệp Hệ Thống'
};

export const FB_EMOJIS = ['📢','🎓','✨','🏆','🔥','❤️','📌','🤝','⚽','🎉','👏','💪','🌟','📸','🎯'];
export const FB_HASHTAGS = ['#CongDoanTDMU','#HoatDongDoanVien','#TDMU2026','#GiaoVienTDMU','#DoanVienCongDoan','#TruongThuDauMot'];

export const ZALO_TEMPLATES = [
  { label: 'Thông báo hoạt động', text: '*THÔNG BÁO CÔNG ĐOÀN TDMU*\n\nKính gửi Quý Thầy/Cô Đoàn viên,\n\n[Nội dung thông báo]\n\nTrân trọng kính thông báo!\n— Ban Thường Vụ Công Đoàn Trường' },
  { label: 'Thư mời tham dự', text: '*THƯ MỜI THAM DỰ*\n\nBan Chấp Hành Công Đoàn trân trọng kính mời Quý Thầy/Cô tham dự:\n\n🗓 Thời gian: [Ngày giờ]\n📍 Địa điểm: [Địa điểm]\n📌 Nội dung: [Nội dung]\n\nKính mong Quý Thầy/Cô thu xếp tham dự đầy đủ!' },
  { label: 'Chúc mừng & Khen thưởng', text: '*CHÚC MỪNG & KHEN THƯỞNG*\n\nBan Chấp Hành Công Đoàn Trường ĐHTDM trân trọng chúc mừng:\n\n🏆 [Tên tập thể/cá nhân] đã đạt thành tích xuất sắc trong [lĩnh vực].\n\nĐây là nguồn cảm hứng cho toàn thể Đoàn viên trong năm học mới! 💪' }
];
