const express = require('express');
const router = express.Router();
const { loadDB, saveDB } = require('../db');
const { getDocumentsFromDb } = require('../mssql_db');
const { validate, z } = require('../middleware/validate');

const documentSchema = z.object({
  reference_number: z.string().trim().min(1, 'Số hiệu văn bản là bắt buộc'),
  title: z.string().trim().min(1, 'Trích yếu văn bản là bắt buộc'),
  category: z.enum(['tuyentruyen', 'kehoach', 'luat', 'quyetdinh']).optional(),
  issuer: z.string().trim().optional(),
  issued_date: z.string().trim().optional(),
  signer: z.string().trim().optional(),
  file_url: z.string().trim().optional(),
  file_size: z.string().trim().optional()
});

router.get('/', async (req, res) => {
  const { category, search } = req.query;
  const list = await getDocumentsFromDb(category, search);
  res.json({ success: true, count: list.length, data: list });
});

router.post('/', validate(documentSchema), (req, res) => {
  const { reference_number, title, category, issuer, issued_date, signer, file_url, file_size } = req.body;

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
    reference_number: reference_number.trim(),
    title: title.trim(),
    category: category || 'tuyentruyen',
    category_name: categoryNames[category] || 'Công văn tuyên truyền',
    issuer: issuer || 'Ban Thường Vụ Công Đoàn TDMU',
    issued_date: issued_date || new Date().toISOString().split('T')[0],
    signer: signer || 'Ban Thường Vụ',
    file_url: file_url || 'uploads/documents/van_ban_' + nextId + '.pdf',
    file_size: file_size || '1.5 MB',
    download_count: 0,
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
  const idx = db.documents.findIndex(d => d.id === id);
  if (idx === -1) {
    return res.json({ success: false, error: 'Không tìm thấy văn bản!' });
  }

  const deleted = db.documents.splice(idx, 1)[0];
  saveDB(db);
  res.json({ success: true, message: 'Đã xóa văn bản thành công!' });
});

module.exports = router;