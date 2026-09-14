const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { loadDB, saveDB } = require('../db');
const { getDocumentsFromDb } = require('../mssql_db');

function stripVietnamese(str) {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLowerCase();
}

const categoryNames = {
  'tuyentruyen': 'Công văn tuyên truyền',
  'kehoach': 'Kế hoạch hoạt động',
  'luat': 'Văn bản luật',
  'quyetdinh': 'Quyết định',
  'huongdan': 'Hướng dẫn nghiệp vụ',
  'thongbao': 'Thông báo kết luận'
};

router.get('/', async (req, res) => {
  try {
    const { category, search, hieu_luc } = req.query;
    let list = [];
    
    // First try MSSQL
    try {
      list = await getDocumentsFromDb(category, search, hieu_luc);
    } catch (e) {
      list = [];
    }

    // Fallback or merge with JSON database
    if (!list || list.length === 0) {
      const db = loadDB();
      list = db.documents || [];

      if (category && category !== 'all') {
        list = list.filter(d => (d.loai_van_ban === category || d.LoaiVanBan === category));
      }

      if (search) {
        const q = stripVietnamese(search.trim());
        list = list.filter(d =>
          stripVietnamese(d.so_hieu || d.SoHieuVanBan).includes(q) ||
          stripVietnamese(d.tieu_de || d.TenVanBan).includes(q) ||
          stripVietnamese(d.co_quan_ban_hanh || d.CoQuanBanHanh).includes(q) ||
          stripVietnamese(d.nguoi_ky || d.NguoiKy).includes(q)
        );
      }
    }

    if (hieu_luc && hieu_luc !== 'all') {
      list = list.filter(d => (d.hieu_luc || 'con_hieu_luc') === hieu_luc);
    }

    res.json({ success: true, count: list.length, data: list });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:id', (req, res) => {
  const db = loadDB();
  const id = parseInt(req.params.id);
  const doc = (db.documents || []).find(d => d.id === id || d.MaVanBan === id);
  if (!doc) {
    return res.status(404).json({ success: false, error: 'Không tìm thấy văn bản!' });
  }
  res.json({ success: true, data: doc });
});

router.post('/', (req, res) => {
  const {
    so_hieu,
    tieu_de,
    loai_van_ban,
    co_quan_ban_hanh,
    ngay_ban_hanh,
    nguoi_ky,
    hieu_luc,
    dung_luong,
    file_url,
    fileBase64,
    fileName
  } = req.body;

  if (!so_hieu || !tieu_de) {
    return res.status(400).json({ success: false, error: 'Số hiệu và Trích yếu văn bản là bắt buộc!' });
  }

  const db = loadDB();
  db.documents = db.documents || [];
  const nextId = db.documents.length > 0 ? Math.max(...db.documents.map(d => parseInt(d.id) || 0)) + 1 : 1;

  let savedFileUrl = file_url || `uploads/documents/van_ban_${nextId}.pdf`;
  let calculatedSize = dung_luong || '1.5 MB';

  // Handle real file upload if provided
  if (fileBase64 && fileName) {
    try {
      const cleanBase64 = fileBase64.replace(/^data:.*?;base64,/, '');
      const buffer = Buffer.from(cleanBase64, 'base64');
      const safeName = `VB_${nextId}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      
      const uploadDir1 = path.join(__dirname, '../../public/uploads/documents');
      if (!fs.existsSync(uploadDir1)) fs.mkdirSync(uploadDir1, { recursive: true });
      fs.writeFileSync(path.join(uploadDir1, safeName), buffer);

      const uploadDir2 = path.join(__dirname, '../../frontend/public/uploads/documents');
      if (!fs.existsSync(uploadDir2)) fs.mkdirSync(uploadDir2, { recursive: true });
      fs.writeFileSync(path.join(uploadDir2, safeName), buffer);

      savedFileUrl = `uploads/documents/${safeName}`;
      calculatedSize = (buffer.length / 1024 > 1024)
        ? (buffer.length / (1024 * 1024)).toFixed(1) + ' MB'
        : (buffer.length / 1024).toFixed(1) + ' KB';
    } catch (e) {
      console.error('Error saving document file:', e);
    }
  }

  const newDoc = {
    id: nextId,
    MaVanBan: nextId,
    so_hieu: so_hieu.trim(),
    SoHieuVanBan: so_hieu.trim(),
    tieu_de: tieu_de.trim(),
    TenVanBan: tieu_de.trim(),
    loai_van_ban: loai_van_ban || 'tuyentruyen',
    LoaiVanBan: loai_van_ban || 'tuyentruyen',
    loai_van_ban_ten: categoryNames[loai_van_ban] || 'Công văn tuyên truyền',
    co_quan_ban_hanh: (co_quan_ban_hanh || 'Ban Thường Vụ Công Đoàn TDMU').trim(),
    CoQuanBanHanh: (co_quan_ban_hanh || 'Ban Thường Vụ Công Đoàn TDMU').trim(),
    ngay_ban_hanh: ngay_ban_hanh || new Date().toISOString().split('T')[0],
    NgayBanHanh: ngay_ban_hanh || new Date().toISOString().split('T')[0],
    nguoi_ky: (nguoi_ky || 'TS. Lê Thị Kim Út').trim(),
    NguoiKy: (nguoi_ky || 'TS. Lê Thị Kim Út').trim(),
    hieu_luc: hieu_luc || 'con_hieu_luc', // con_hieu_luc | het_hieu_luc
    file_url: savedFileUrl,
    FileUrl: savedFileUrl,
    dung_luong: calculatedSize,
    DungLuong: calculatedSize,
    luot_tai: 0,
    LuotTai: 0,
    created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
  };

  db.documents.unshift(newDoc);
  saveDB(db);

  res.json({ success: true, message: 'Đã đăng tải văn bản chỉ đạo thành công!', data: newDoc });
});

router.put('/:id', (req, res) => {
  const db = loadDB();
  db.documents = db.documents || [];
  const id = parseInt(req.params.id);
  const idx = db.documents.findIndex(d => d.id === id || d.MaVanBan === id);

  if (idx === -1) {
    return res.status(404).json({ success: false, error: 'Không tìm thấy văn bản cần chỉnh sửa!' });
  }

  const {
    so_hieu,
    tieu_de,
    loai_van_ban,
    co_quan_ban_hanh,
    ngay_ban_hanh,
    nguoi_ky,
    hieu_luc,
    dung_luong,
    file_url
  } = req.body;

  if (so_hieu) {
    db.documents[idx].so_hieu = so_hieu.trim();
    db.documents[idx].SoHieuVanBan = so_hieu.trim();
  }
  if (tieu_de) {
    db.documents[idx].tieu_de = tieu_de.trim();
    db.documents[idx].TenVanBan = tieu_de.trim();
  }
  if (loai_van_ban) {
    db.documents[idx].loai_van_ban = loai_van_ban;
    db.documents[idx].LoaiVanBan = loai_van_ban;
    db.documents[idx].loai_van_ban_ten = categoryNames[loai_van_ban] || loai_van_ban;
  }
  if (co_quan_ban_hanh) {
    db.documents[idx].co_quan_ban_hanh = co_quan_ban_hanh.trim();
    db.documents[idx].CoQuanBanHanh = co_quan_ban_hanh.trim();
  }
  if (ngay_ban_hanh) {
    db.documents[idx].ngay_ban_hanh = ngay_ban_hanh;
    db.documents[idx].NgayBanHanh = ngay_ban_hanh;
  }
  if (nguoi_ky) {
    db.documents[idx].nguoi_ky = nguoi_ky.trim();
    db.documents[idx].NguoiKy = nguoi_ky.trim();
  }
  if (hieu_luc) {
    db.documents[idx].hieu_luc = hieu_luc;
  }
  if (dung_luong) {
    db.documents[idx].dung_luong = dung_luong;
    db.documents[idx].DungLuong = dung_luong;
  }
  if (file_url) {
    db.documents[idx].file_url = file_url;
    db.documents[idx].FileUrl = file_url;
  }

  saveDB(db);
  res.json({ success: true, message: 'Đã cập nhật văn bản thành công!', data: db.documents[idx] });
});

router.delete('/:id', (req, res) => {
  const db = loadDB();
  db.documents = db.documents || [];
  const id = parseInt(req.params.id);
  const idx = db.documents.findIndex(d => d.id === id || d.MaVanBan === id);
  if (idx === -1) {
    return res.status(404).json({ success: false, error: 'Không tìm thấy văn bản!' });
  }

  const deleted = db.documents.splice(idx, 1)[0];
  saveDB(db);
  res.json({ success: true, message: 'Đã xóa văn bản thành công!', data: deleted });
});

// Download endpoint with download counter increment
router.get('/download/:id', (req, res) => {
  const db = loadDB();
  db.documents = db.documents || [];
  const id = parseInt(req.params.id);
  const doc = db.documents.find(d => d.id === id || d.MaVanBan === id);

  if (!doc) {
    return res.status(404).send('Không tìm thấy văn bản.');
  }

  // Increment download counter
  doc.luot_tai = (doc.luot_tai || 0) + 1;
  doc.LuotTai = doc.luot_tai;
  saveDB(db);

  let rawFile = (doc.file_url || doc.FileUrl || '').replace(/^\/+/, '');
  let filePath = path.join(__dirname, '../../public', rawFile);

  // Fallback check
  if (!fs.existsSync(filePath)) {
    filePath = path.join(__dirname, '../../public/uploads/documents/99_TB_CD_HoiThao2011.pdf');
  }

  if (fs.existsSync(filePath)) {
    const downloadName = path.basename(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const mimeMap = {
      '.pdf': 'application/pdf',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.doc': 'application/msword',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.xls': 'application/vnd.ms-excel',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.ppt': 'application/vnd.ms-powerpoint',
      '.txt': 'text/plain; charset=utf-8'
    };
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(downloadName)}"`);
    res.setHeader('Content-Type', mimeMap[ext] || 'application/octet-stream');
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  } else {
    res.status(404).send('File văn bản không tồn tại trên hệ thống lưu trữ.');
  }
});


// =========================================================================
// =========================================================================
// UNIVERSAL MULTI-FORMAT DOCUMENT PARSER ENGINE (PDF, DOCX, XLSX, PPTX, CSV, TXT)
// =========================================================================
const { parseDocumentBuffer } = require('../services/documentParser');

router.post('/parse-document', async (req, res) => {
  const { fileBase64, fileName } = req.body;
  if (!fileBase64) {
    return res.status(400).json({ success: false, error: 'Dữ liệu fileBase64 là bắt buộc!' });
  }

  try {
    const cleanBase64 = fileBase64.replace(/^data:.*?;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    const safeName = fileName || 'document.txt';

    const parsed = await parseDocumentBuffer(buffer, safeName);

    res.json({
      success: true,
      fileName: parsed.fileName,
      fileType: parsed.fileType,
      fileSizeKB: parsed.fileSizeKB,
      charCount: parsed.charCount,
      pagesCount: parsed.pagesCount,
      sheetsCount: parsed.sheetsCount,
      slidesCount: parsed.slidesCount,
      isScannedDoc: !!parsed.isScannedDoc,
      text: parsed.markdown || parsed.rawText || '',
      markdown: parsed.markdown || '',
      metadata: parsed.metadata || {},
      images: parsed.images || [],
      scannedPages: parsed.scannedPages || []
    });
  } catch (err) {
    console.error('Error parsing document:', err);
    res.status(500).json({ success: false, error: 'Lỗi bóc tách tài liệu: ' + err.message });
  }
});

// Backward compatible docx endpoint
router.post('/parse-docx', async (req, res) => {
  const { fileBase64, fileName } = req.body;
  if (!fileBase64) {
    return res.status(400).json({ success: false, error: 'Dữ liệu fileBase64 là bắt buộc!' });
  }

  try {
    const cleanBase64 = fileBase64.replace(/^data:.*?;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    const safeName = fileName || 'document.docx';

    const parsed = await parseDocumentBuffer(buffer, safeName);
    res.json({
      success: true,
      fileName: parsed.fileName,
      html: parsed.markdown,
      text: parsed.markdown,
      images: []
    });
  } catch (err) {
    console.error('Error parsing docx:', err);
    res.status(500).json({ success: false, error: 'Lỗi bóc tách tài liệu Word: ' + err.message });
  }
});

module.exports = router;

