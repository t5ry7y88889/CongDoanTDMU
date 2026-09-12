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


// =========================================================================
// INDUSTRIAL WORD PARSER (MAMMOTH.JS NATIVE ENGINE)
// =========================================================================
router.post('/parse-docx', async (req, res) => {
  const { fileBase64, fileName } = req.body;
  if (!fileBase64) {
    return res.status(400).json({ success: false, error: 'Dữ liệu fileBase64 là bắt buộc!' });
  }

  try {
    const cleanBase64 = fileBase64.replace(/^data:.*?;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    const mammoth = require('mammoth');
    const fs = require('fs');
    const path = require('path');

    const uploadsDir = path.join(__dirname, '../../public/uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const extractedImages = [];
    const options = {
      convertImage: mammoth.images.imgElement(async (image) => {
        const imageBuffer = await image.read('base64');
        const ext = (image.contentType || 'image/png').split('/')[1] || 'png';
        const imgName = `docx_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`;
        const targetPath = path.join(uploadsDir, imgName);
        fs.writeFileSync(targetPath, Buffer.from(imageBuffer, 'base64'));

        const feUploadsDir = path.join(__dirname, '../../frontend/public/uploads');
        if (fs.existsSync(feUploadsDir)) {
          fs.writeFileSync(path.join(feUploadsDir, imgName), Buffer.from(imageBuffer, 'base64'));
        }

        const imgUrl = `/uploads/${imgName}`;
        extractedImages.push({
          url: imgUrl,
          caption: `Ảnh trích xuất từ tài liệu Word: ${fileName || 'Tài liệu'}`,
          fileName: imgName
        });

        return { src: imgUrl };
      })
    };

    const [htmlResult, textResult] = await Promise.all([
      mammoth.convertToHtml({ buffer }, options),
      mammoth.extractRawText({ buffer })
    ]);

    res.json({
      success: true,
      fileName: fileName || 'document.docx',
      html: htmlResult.value,
      text: textResult.value,
      images: extractedImages,
      warnings: htmlResult.messages
    });
  } catch (err) {
    console.error('Error parsing docx with mammoth:', err);
    res.status(500).json({ success: false, error: 'Lỗi bóc tách tài liệu Word: ' + err.message });
  }
});

module.exports = router;
