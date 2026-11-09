/**
 * ============================================================================
 * ĐỒ ÁN CHUYÊN NGÀNH: CÔNG ĐOÀN ĐH THỦ DẦU MỘT
 * File: server/controllers/phucLoi.controller.js
 * Chức năng: Quản lý Bài Đăng Thông Báo & Chính Sách Phúc Lợi (Kèm Tệp PDF)
 *            Tinh giản hoàn toàn tiền nong, tập trung vào công bố quy chế & văn bản PDF.
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const { loadDB, saveDB } = require('../db');
const {
  getWelfareFromDb,
  insertWelfarePostToDb,
  updateWelfarePostInDb,
  deleteWelfarePostFromDb,
  incrementWelfarePdfDownloadInDb,
  getWelfareApplicationsFromDb,
  insertWelfareApplicationToDb,
  updateWelfareApplicationInDb,
  deleteWelfareApplicationInDb
} = require('../mssql_db');

/**
 * 1. LẤY DANH SÁCH BÀI ĐĂNG THÔNG BÁO PHÚC LỢI (KÈM PDF)
 */
async function getAllWelfarePrograms(req, res) {
  try {
    const { category, search } = req.query;
    const list = await getWelfareFromDb(category, search);
    res.json({
      success: true,
      count: list.length,
      data: list
    });
  } catch (err) {
    console.error('Lỗi getAllWelfarePrograms:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * 2. LẤY CHI TIẾT BÀI ĐĂNG PHÚC LỢI THEO ID
 */
async function getWelfarePostById(req, res) {
  try {
    const id = parseInt(req.params.id);
    const list = await getWelfareFromDb('all', '');
    const item = list.find(w => w.id === id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy thông báo phúc lợi!' });
    }
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * 3. ĐĂNG BÀI THÔNG BÁO CHÍNH SÁCH PHÚC LỢI MỚI (KÈM PDF/VĂN BẢN)
 */
async function createWelfarePost(req, res) {
  try {
    const {
      title,
      code,
      category,
      target,
      budget_range,
      description,
      content,
      file_url,
      file_size,
      fileName,
      fileBase64,
      image,
      issuer,
      date,
      status
    } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, error: 'Tiêu đề thông báo phúc lợi là bắt buộc!' });
    }

    let savedFileUrl = file_url ? file_url.trim() : '/uploads/welfare/Quy_Che_Phuc_Loi_Le_Tet_2026.pdf';
    let calculatedSize = file_size ? file_size.trim() : '1.8 MB';

    // Xử lý tệp đính kèm tải lên trực tiếp tương tự module Quản lý Văn bản
    if (fileBase64 && fileName) {
      try {
        const cleanBase64 = fileBase64.replace(/^data:.*?;base64,/, '');
        const buffer = Buffer.from(cleanBase64, 'base64');
        const safeName = `PL_${Date.now()}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

        const uploadDir1 = path.join(__dirname, '../../public/uploads/welfare');
        if (!fs.existsSync(uploadDir1)) fs.mkdirSync(uploadDir1, { recursive: true });
        fs.writeFileSync(path.join(uploadDir1, safeName), buffer);

        const uploadDir2 = path.join(__dirname, '../../frontend/public/uploads/welfare');
        if (!fs.existsSync(uploadDir2)) fs.mkdirSync(uploadDir2, { recursive: true });
        fs.writeFileSync(path.join(uploadDir2, safeName), buffer);

        savedFileUrl = `/uploads/welfare/${safeName}`;
        calculatedSize = (buffer.length / 1024 > 1024)
          ? (buffer.length / (1024 * 1024)).toFixed(1) + ' MB'
          : (buffer.length / 1024).toFixed(1) + ' KB';
      } catch (e) {
        console.error('Lỗi lưu tệp đính kèm phúc lợi:', e);
      }
    }

    const newPost = await insertWelfarePostToDb({
      title: title.trim(),
      code: code ? code.trim() : `TB-PL-${Date.now().toString().slice(-4)}`,
      category: category || 'tro_cap',
      target: target ? target.trim() : 'Toàn thể cán bộ, giảng viên, đoàn viên',
      budget_range: budget_range ? budget_range.trim() : '',
      description: description ? description.trim() : '',
      content: content ? content.trim() : description || '',
      file_url: savedFileUrl,
      file_size: calculatedSize,
      image: image || 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800',
      issuer: issuer ? issuer.trim() : 'Ban Thường Vụ Công Đoàn TDMU',
      date: date || new Date().toISOString().substring(0, 10),
      status: status || 'published'
    });

    res.json({
      success: true,
      message: 'Đăng tải thông báo chính sách phúc lợi kèm tệp đính kèm thành công!',
      data: newPost
    });
  } catch (err) {
    console.error('Lỗi createWelfarePost:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * 4. CHỈNH SỬA BÀI ĐĂNG PHÚC LỢI
 */
async function updateWelfarePost(req, res) {
  try {
    const id = parseInt(req.params.id);
    const data = { ...req.body };

    // Xử lý nếu có tải lên tệp đính kèm mới
    if (data.fileBase64 && data.fileName) {
      try {
        const cleanBase64 = data.fileBase64.replace(/^data:.*?;base64,/, '');
        const buffer = Buffer.from(cleanBase64, 'base64');
        const safeName = `PL_${id}_${data.fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

        const uploadDir1 = path.join(__dirname, '../../public/uploads/welfare');
        if (!fs.existsSync(uploadDir1)) fs.mkdirSync(uploadDir1, { recursive: true });
        fs.writeFileSync(path.join(uploadDir1, safeName), buffer);

        const uploadDir2 = path.join(__dirname, '../../frontend/public/uploads/welfare');
        if (!fs.existsSync(uploadDir2)) fs.mkdirSync(uploadDir2, { recursive: true });
        fs.writeFileSync(path.join(uploadDir2, safeName), buffer);

        data.file_url = `/uploads/welfare/${safeName}`;
        data.file_size = (buffer.length / 1024 > 1024)
          ? (buffer.length / (1024 * 1024)).toFixed(1) + ' MB'
          : (buffer.length / 1024).toFixed(1) + ' KB';
      } catch (e) {
        console.error('Lỗi cập nhật tệp đính kèm phúc lợi:', e);
      }
    }

    delete data.fileBase64;
    delete data.fileName;

    await updateWelfarePostInDb(id, data);

    res.json({
      success: true,
      message: 'Cập nhật bài viết thông báo phúc lợi thành công!'
    });
  } catch (err) {
    console.error('Lỗi updateWelfarePost:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * 5. XÓA BÀI ĐĂNG PHÚC LỢI
 */
async function deleteWelfarePost(req, res) {
  try {
    const id = parseInt(req.params.id);
    await deleteWelfarePostFromDb(id);

    res.json({
      success: true,
      message: 'Đã xóa bài viết thông báo phúc lợi thành công!'
    });
  } catch (err) {
    console.error('Lỗi deleteWelfarePost:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * 6. TĂNG LƯỢT TẢI TỆP PDF
 */
async function downloadWelfarePdf(req, res) {
  try {
    const id = parseInt(req.params.id);
    await incrementWelfarePdfDownloadInDb(id);
    res.json({ success: true, message: 'Đã cập nhật lượt tải tệp PDF' });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
}

/**
 * 6.1 TẢI VÀ XUẤT TỆP VĂN BẢN/PDF CHÍNH SÁCH PHÚC LỢI (TƯƠNG TỰ MODULE VĂN BẢN)
 */
async function downloadWelfareFile(req, res) {
  try {
    const id = parseInt(req.params.id);
    await incrementWelfarePdfDownloadInDb(id);

    const list = await getWelfareFromDb();
    const item = list.find(w => w.id === id);

    let rawFile = ((item && item.file_url) || '/uploads/welfare/Quy_Che_Phuc_Loi_Le_Tet_2026.pdf').replace(/^\/+/, '');
    let filePath = path.join(__dirname, '../../public', rawFile);

    if (!fs.existsSync(filePath)) {
      filePath = path.join(__dirname, '../../frontend/public', rawFile);
    }
    if (!fs.existsSync(filePath)) {
      const welfareDir = path.join(__dirname, '../../public/uploads/welfare');
      if (fs.existsSync(welfareDir)) {
        const files = fs.readdirSync(welfareDir);
        if (files.length > 0) filePath = path.join(welfareDir, files[0]);
      }
    }

    if (fs.existsSync(filePath)) {
      const downloadName = path.basename(filePath);
      const ext = path.extname(filePath).toLowerCase();
      const mimeMap = {
        '.pdf': 'application/pdf',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.doc': 'application/msword',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.xls': 'application/vnd.ms-excel'
      };
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(downloadName)}"`);
      res.setHeader('Content-Type', mimeMap[ext] || 'application/octet-stream');
      const stream = fs.createReadStream(filePath);
      return stream.pipe(res);
    } else {
      res.status(404).send('Tệp văn bản chính sách phúc lợi không tồn tại trên máy chủ.');
    }
  } catch (err) {
    console.error('Lỗi downloadWelfareFile:', err);
    res.status(500).send('Lỗi máy chủ khi tải tệp.');
  }
}

/**
 * 7. TỔNG QUAN PHÚC LỢI TINH GIẢN (KHÔNG KẾ TOÁN TIỀN NONG)
 */
async function getFundSummary(req, res) {
  try {
    const list = await getWelfareFromDb();
    const totalDownloads = list.reduce((sum, item) => sum + (parseInt(item.downloads_count) || 0), 0);
    const categoriesCount = new Set(list.map(i => i.category)).size;

    res.json({
      success: true,
      fund: {
        total_programs: list.length,
        total_downloads: totalDownloads,
        categories_count: categoriesCount,
        latest_program: list[0] ? list[0].title : 'Chưa có thông báo',
        current_balance: 0,
        total_deposited: 0,
        total_disbursed: 0
      },
      transactions: []
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// Dummy endpoints for backward compatibility
async function depositFund(req, res) {
  res.json({ success: true, message: 'Đã ghi nhận kế hoạch ngân sách thành công' });
}

async function disburseFund(req, res) {
  res.json({ success: true, message: 'Đã hoàn tất hỗ trợ chăm lo' });
}

/**
 * 8. QUẢN LÝ HỒ SƠ ĐỀ NGHỊ TRỢ CẤP (Dành cho trang cá nhân đoàn viên)
 */
async function getApplications(req, res) {
  try {
    const list = await getWelfareApplicationsFromDb();
    res.json({ success: true, count: list.length, data: list });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

async function createApplication(req, res) {
  try {
    const data = req.body;
    const result = await insertWelfareApplicationToDb(data);
    res.json({ success: true, message: 'Đã gửi hồ sơ đề nghị trợ cấp thành công', data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

async function updateApplication(req, res) {
  try {
    const id = parseInt(req.params.id);
    await updateWelfareApplicationInDb(id, req.body);
    res.json({ success: true, message: 'Cập nhật hồ sơ thành công' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

async function deleteApplication(req, res) {
  try {
    const id = parseInt(req.params.id);
    await deleteWelfareApplicationInDb(id);
    res.json({ success: true, message: 'Đã xóa hồ sơ trợ cấp thành công' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getAllWelfarePrograms,
  getWelfarePostById,
  createWelfarePost,
  updateWelfarePost,
  deleteWelfarePost,
  downloadWelfarePdf,
  downloadWelfareFile,
  getFundSummary,
  depositFund,
  disburseFund,
  getApplications,
  createApplication,
  updateApplication,
  deleteApplication
};
