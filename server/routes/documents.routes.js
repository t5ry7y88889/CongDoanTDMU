const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { loadDB, saveDB } = require('../db');
const { getDocumentsFromDb, insertDocumentToDb, updateDocumentInDb, deleteDocumentFromDb } = require('../mssql_db');

function stripVietnamese(str) {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLowerCase();
}

router.get('/', async (req, res) => {
  try {
    const { category, search, validity } = req.query;
    let list = [];
    
    // First try MSSQL
    try {
      list = await getDocumentsFromDb(category, search);
    } catch (e) {
      list = [];
    }

    // Fallback or merge with JSON database
    if (!list || list.length === 0) {
      const db = loadDB();
      list = db.documents || [];

      if (category && category !== 'all') {
        list = list.filter(d => d.category === category);
      }

      if (search) {
        const q = stripVietnamese(search.trim());
        list = list.filter(d =>
          stripVietnamese(d.reference_number).includes(q) ||
          stripVietnamese(d.title).includes(q) ||
          stripVietnamese(d.issuer).includes(q) ||
          stripVietnamese(d.signer).includes(q)
        );
      }
    }

    if (validity && validity !== 'all') {
      list = list.filter(d => (d.validity || 'con_hieu_luc') === validity);
    }

    res.json({ success: true, count: list.length, data: list });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const list = await getDocumentsFromDb('all');
  const doc = list.find(d => Number(d.id) === id);
  if (!doc) {
    return res.status(404).json({ success: false, error: 'Không tìm thấy văn bản!' });
  }
  res.json({ success: true, data: doc });
});

router.post('/', async (req, res) => {
  const {
    reference_number,
    title,
    category,
    issuer,
    issued_date,
    signer,
    validity,
    file_size,
    file_url,
    fileBase64,
    fileName
  } = req.body;

  if (!reference_number || !title) {
    return res.status(400).json({ success: false, error: 'Số hiệu và Trích yếu văn bản là bắt buộc!' });
  }

  let savedFileUrl = file_url || `uploads/documents/van_ban_${Date.now()}.pdf`;
  let calculatedSize = file_size || '1.5 MB';

  // Handle real file upload if provided
  if (fileBase64 && fileName) {
    try {
      const cleanBase64 = fileBase64.replace(/^data:.*?;base64,/, '');
      const buffer = Buffer.from(cleanBase64, 'base64');
      const safeName = `VB_${Date.now()}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

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

  const newDoc = await insertDocumentToDb({
    reference_number: (reference_number || '').trim(),
    title: (title || '').trim(),
    category: category || 'tuyentruyen',
    issuer: (issuer || 'Ban Thường Vụ Công Đoàn TDMU').trim(),
    issued_date: issued_date || new Date().toISOString().split('T')[0],
    signer: (signer || 'TS. Lê Thị Kim Út').trim(),
    validity: validity || 'con_hieu_luc',
    file_size: calculatedSize,
    file_url: savedFileUrl,
    savedFileUrl
  });

  res.json({ success: true, message: 'Đã đăng tải văn bản chỉ đạo thành công!', data: newDoc });
});

router.put('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const {
    reference_number,
    title,
    category,
    issuer,
    issued_date,
    signer,
    validity,
    file_size,
    file_url,
    fileBase64,
    fileName
  } = req.body;

  let updatedFileUrl = file_url;
  let updatedSize = file_size;

  if (fileBase64 && fileName) {
    try {
      const cleanBase64 = fileBase64.replace(/^data:.*?;base64,/, '');
      const buffer = Buffer.from(cleanBase64, 'base64');
      const safeName = `VB_${Date.now()}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const uploadDir = path.join(__dirname, '../../public/uploads/documents');
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
      fs.writeFileSync(path.join(uploadDir, safeName), buffer);
      updatedFileUrl = `uploads/documents/${safeName}`;
      updatedSize = (buffer.length / 1024 > 1024)
        ? (buffer.length / (1024 * 1024)).toFixed(1) + ' MB'
        : (buffer.length / 1024).toFixed(1) + ' KB';
    } catch (e) {
      console.error('Error saving document file:', e);
    }
  }

  const updated = await updateDocumentInDb(id, {
    reference_number: (reference_number || '').trim(),
    title: (title || '').trim(),
    category,
    issuer: (issuer || '').trim(),
    issued_date,
    signer: (signer || '').trim(),
    validity,
    file_size: updatedSize,
    file_url: updatedFileUrl
  });

  if (!updated) {
    return res.status(404).json({ success: false, error: 'Không tìm thấy văn bản cần chỉnh sửa!' });
  }

  res.json({ success: true, message: 'Đã cập nhật văn bản thành công!', data: updated });
});

router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const deleted = await deleteDocumentFromDb(id);
  if (!deleted) {
    return res.status(404).json({ success: false, error: 'Không tìm thấy văn bản!' });
  }
  res.json({ success: true, message: 'Đã xóa văn bản thành công!', data: { id } });
});

// Download endpoint with download counter increment
router.get('/download/:id', (req, res) => {
  const db = loadDB();
  db.documents = db.documents || [];
  const id = parseInt(req.params.id);
  const doc = db.documents.find(d => d.id === id);

  if (!doc) {
    return res.status(404).send('Không tìm thấy văn bản.');
  }

  // Increment download counter
  doc.download_count = (doc.download_count || 0) + 1;
  saveDB(db);

  let rawFile = (doc.file_url || '').replace(/^\/+/, '');
  let filePath = path.join(__dirname, '../../public', rawFile);

  // Fallback check
  if (!fs.existsSync(filePath)) {
    filePath = path.join(__dirname, '../../public/uploads/documents/99_TB_CD_HoiThao2011.pdf');
  }

  if (fs.existsSync(filePath)) {
    const downloadName = path.basename(filePath);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(downloadName)}"`);
    res.setHeader('Content-Type', 'application/pdf');
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  } else {
    res.status(404).send('File văn bản không tồn tại trên hệ thống lưu trữ.');
  }
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