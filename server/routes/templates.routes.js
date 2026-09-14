const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { loadDB, saveDB } = require('../db');
const {
  getTemplatesFromDb,
  insertTemplateToDb,
  deleteTemplateFromDb,
  incrementTemplateDownloadInDb
} = require('../mssql_db');

function nextId(arr) {
  return arr.length ? Math.max(...arr.map(t => parseInt(t.id) || 0)) + 1 : 1;
}

// 1. GET /api/templates
router.get('/', async (req, res) => {
  const { category, search } = req.query;
  try {
    const list = await getTemplatesFromDb(category, search);
    res.json({ success: true, count: list.length, data: list });
  } catch (err) {
    const db = loadDB();
    let list = db.templates || [];
    if (category && category !== 'all') list = list.filter(t => t.category === category);
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(t => (t.title || '').toLowerCase().includes(s) || (t.code || '').toLowerCase().includes(s));
    }
    res.json({ success: true, count: list.length, data: list });
  }
});

// 2. GET /api/templates/:id
router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const list = await getTemplatesFromDb('all', '');
  const template = list.find(t => t.id === id);
  if (!template) {
    return res.status(404).json({ success: false, error: 'Không tìm thấy biểu mẫu' });
  }
  res.json({ success: true, data: template });
});

// 3. POST /api/templates (Add template or upload .docx)
router.post('/', (req, res) => {
  const { code, title, description, category, categoryName, fileBase64, fileName, file_size } = req.body;

  if (!code || !title) {
    return res.status(400).json({ success: false, error: 'Mã hiệu và Tên biểu mẫu là bắt buộc!' });
  }

  const db = loadDB();
  db.templates = db.templates || [];
  const id = nextId(db.templates);

  let fileUrl = 'uploads/templates/' + (fileName || `BM_${id}.docx`);
  let sizeStr = file_size || '4.0 KB';

  // If base64 file uploaded, write to disk
  if (fileBase64) {
    try {
      const cleanBase64 = fileBase64.replace(/^data:.*?;base64,/, '');
      const buffer = Buffer.from(cleanBase64, 'base64');
      const safeFileName = `BM_${id}_${(fileName || 'Mau.docx').replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const targetPath1 = path.join(__dirname, '../../public/uploads/templates', safeFileName);
      const targetPath2 = path.join(__dirname, '../../frontend/public/uploads/templates', safeFileName);

      fs.writeFileSync(targetPath1, buffer);
      if (fs.existsSync(path.dirname(targetPath2))) {
        fs.writeFileSync(targetPath2, buffer);
      }

      fileUrl = `uploads/templates/${safeFileName}`;
      sizeStr = (buffer.length / 1024).toFixed(1) + ' KB';
    } catch (e) {
      console.warn('Error saving template file:', e.message);
    }
  }

  const categoryMap = {
    doan_vien: 'Đoàn Viên & Gia Nhập',
    to_cong_doan: 'Tổ Công Đoàn Bộ Phận',
    tro_cap: 'Chăm Lo & Trợ Cấp',
    thi_dua: 'Thi Đua Khen Thưởng',
    tro_von: 'Quỹ Trợ Vốn'
  };

  const newTemplate = {
    id,
    code: code.trim(),
    title: title.trim(),
    description: (description || '').trim(),
    category: category || 'doan_vien',
    categoryName: categoryName || categoryMap[category] || 'Biểu Mẫu Nghiệp Vụ',
    file_url: fileUrl,
    file_type: 'docx',
    file_size: sizeStr,
    downloads_count: 0,
    created_at: new Date().toISOString()
  };

  // Sync to MSSQL
  try {
    const inserted = await insertTemplateToDb(newTemplate);
    if (inserted && inserted.id) {
      newTemplate.id = inserted.id;
    }
  } catch (e) {
    console.error('Error inserting template into MSSQL:', e.message);
  }

  db.templates.push(newTemplate);
  saveDB(db);

  res.json({ success: true, message: 'Đã thêm biểu mẫu mới thành công!', data: newTemplate });
});

// 4. DELETE /api/templates/:id
router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    await deleteTemplateFromDb(id);
  } catch (e) {
    console.error('Error deleting template from MSSQL:', e.message);
  }

  const db = loadDB();
  db.templates = db.templates || [];
  const idx = db.templates.findIndex(t => t.id === id);

  if (idx !== -1) {
    db.templates.splice(idx, 1);
    saveDB(db);
  }

  res.json({ success: true, message: 'Đã xóa biểu mẫu thành công!' });
});

// 5. GET /api/templates/download/:id (Increments count and sends file)
router.get('/download/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    await incrementTemplateDownloadInDb(id);
  } catch (e) {
    console.error('Error incrementing download in MSSQL:', e.message);
  }

  const db = loadDB();
  db.templates = db.templates || [];
  const template = db.templates.find(t => t.id === id);

  if (template) {
    template.downloads_count = (template.downloads_count || 0) + 1;
    saveDB(db);
  }

  const localPath = template ? path.join(__dirname, '../../public', template.file_url) : '';
  if (localPath && fs.existsSync(localPath)) {
    return res.download(localPath, path.basename(template.file_url));
  } else {
    return res.json({ success: true, message: 'Đã ghi nhận lượt tải', downloads_count: (template?.downloads_count || 1) });
  }
});

module.exports = router;
