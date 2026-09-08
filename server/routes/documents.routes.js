const express = require('express');
const router = express.Router();
const { loadDB, saveDB } = require('../db');
const { getDocumentsFromDb } = require('../mssql_db');

router.get('/', async (req, res) => {
  const { category, search } = req.query;
  const list = await getDocumentsFromDb(category, search);
  res.json({ success: true, count: list.length, data: list });
});

router.post('/', (req, res) => {
  const { so_hieu, tieu_de, loai_van_ban, co_quan_ban_hanh, ngay_ban_hanh, nguoi_ky, file_url, dung_luong } = req.body;
  if (!so_hieu || !tieu_de) {
    return res.json({ success: false, error: 'Số hiệu và Trích yếu văn bản là bắt buộc!' });
  }

  const categoryNames = {
    'tuyentruyen': 'Công văn tuyên truyền',
    'kehoach': 'Kế hoạch hoạt động',
    'luat': 'Văn bản luật',
    'quyetdinh': 'Quyết định'
  };

  const db = loadDB();
  db.documents = db.documents || [];
  const nextId = db.documents.length > 0 ? Math.max(...db.documents.map(d => parseInt(d.id) || 0)) + 1 : 1;

  const newDoc = {
    id: nextId,
    MaVanBan: nextId,
    so_hieu: so_hieu.trim(),
    SoHieuVanBan: so_hieu.trim(),
    tieu_de: tieu_de.trim(),
    TenVanBan: tieu_de.trim(),
    loai_van_ban: loai_van_ban || 'tuyentruyen',
    loai_van_ban_ten: categoryNames[loai_van_ban] || 'Công văn tuyên truyền',
    co_quan_ban_hanh: co_quan_ban_hanh || 'Ban Thường Vụ Công Đoàn TDMU',
    ngay_ban_hanh: ngay_ban_hanh || new Date().toISOString().split('T')[0],
    nguoi_ky: nguoi_ky || 'Ban Thường Vụ',
    NguoiKy: nguoi_ky || 'Ban Thường Vụ',
    file_url: file_url || 'uploads/documents/van_ban_' + nextId + '.pdf',
    dung_luong: dung_luong || '1.5 MB',
    luot_tai: 0,
    created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
  };

  db.documents.unshift(newDoc);
  saveDB(db);

  res.json({ success: true, message: 'Đã đăng tải văn bản thành công!', data: newDoc });
});

router.delete('/:id', (req, res) => {
  const db = loadDB();
  db.documents = db.documents || [];
  const id = parseInt(req.params.id);
  const idx = db.documents.findIndex(d => d.id === id || d.MaVanBan === id);
  if (idx === -1) {
    return res.json({ success: false, error: 'Không tìm thấy văn bản!' });
  }

  const deleted = db.documents.splice(idx, 1)[0];
  saveDB(db);
  res.json({ success: true, message: 'Đã xóa văn bản thành công!' });
});

module.exports = router;
