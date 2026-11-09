/**
 * Hệ Thống Routes - Quản Trị Cấu Hình Hệ Thống, Banners, Thông Báo Nhanh & Lượt Xem Thực
 * Công Đoàn Trường Đại Học Thủ Dầu Một
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const {
  getBannersFromDb,
  insertBannerToDb,
  updateBannerInDb,
  deleteBannerFromDb,
  getSiteSettingsFromDb,
  updateSiteSettingsInDb,
  getQuickNoticesFromDb,
  insertQuickNoticeToDb,
  updateQuickNoticeInDb,
  deleteQuickNoticeFromDb,
  getExternalLinksFromDb,
  insertExternalLinkToDb,
  updateExternalLinkInDb,
  deleteExternalLinkFromDb,
  getCategoriesFromDb,
  insertCategoryToDb,
  updateCategoryInDb,
  deleteCategoryFromDb,
  getArticleStatsFromDb,
  getArticlesFromDb
} = require('../mssql_db');
const { loadDB } = require('../db');

// =========================================================================
// REAL-TIME ONLINE VISITOR TRACKER (SLIDING 5-MINUTE WINDOW)
// =========================================================================
const activeVisitors = new Map(); // sessionId / ip -> timestamp

function trackVisitor(req) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  const sessionId = req.headers['x-session-id'] || req.query.session_id || ip;
  activeVisitors.set(sessionId, Date.now());
}

function getLiveOnlineCount() {
  const now = Date.now();
  const fiveMinAgo = now - 5 * 60 * 1000;
  for (const [id, lastSeen] of activeVisitors.entries()) {
    if (lastSeen < fiveMinAgo) {
      activeVisitors.delete(id);
    }
  }
  return Math.max(1, activeVisitors.size);
}

// Middleware ghi nhận mọi truy cập vào API để cập nhật người online thật
router.use((req, res, next) => {
  trackVisitor(req);
  next();
});

// =========================================================================
// 1. STATS & HEARTBEAT PING (REAL-TIME VIEWS & ONLINE COUNT)
// =========================================================================
router.get(['/stats', '/stats/realtime', '/stats/live'], async (req, res) => {
  try {
    const liveOnline = getLiveOnlineCount();
    const settings = await getSiteSettingsFromDb();
    const offset = parseInt(settings.totalViewsOffset) || 0;

    let totalArticles = 0;
    let publishedCount = 0;
    let totalViews = 0;
    let totalLikes = 0;
    let totalClaps = 0;

    const mssqlStats = await getArticleStatsFromDb();
    if (mssqlStats && mssqlStats.totalArticles > 0) {
      totalArticles = parseInt(mssqlStats.totalArticles) || 0;
      publishedCount = parseInt(mssqlStats.publishedCount) || 0;
      totalViews = (parseInt(mssqlStats.totalViews) || 0) + offset;
      totalLikes = parseInt(mssqlStats.totalLikes) || 0;
      totalClaps = parseInt(mssqlStats.totalClaps) || 0;
    } else {
      const articles = await getArticlesFromDb('all', 'all');
      totalArticles = articles.length;
      publishedCount = articles.filter(a => a.status === 'published').length;
      const articleViewsSum = articles.reduce((acc, a) => acc + (parseInt(a.viewsCount || a.LuotXem || 0)), 0);
      totalViews = articleViewsSum + offset;
      totalLikes = articles.reduce((acc, a) => acc + (parseInt(a.likesCount || a.LuotThich || 0)), 0);
      totalClaps = articles.reduce((acc, a) => acc + (parseInt(a.clapsCount || a.LuotVoTay || 0)), 0);
    }

    res.json({
      success: true,
      online: liveOnline,
      totalViews,
      totalArticles,
      publishedCount,
      totalLikes,
      totalClaps,
      data: {
        tong_bai: totalArticles,
        da_xuat_ban: publishedCount,
        tong_luot_xem: totalViews,
        tong_luot_thich: totalLikes,
        dang_truc_tuyen: liveOnline
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/stats/ping', (req, res) => {
  trackVisitor(req);
  res.json({ success: true, online: getLiveOnlineCount() });
});

// =========================================================================
// 2. BANNERS CRUD
// =========================================================================
router.get('/banners', async (req, res) => {
  try {
    const onlyActive = req.query.all !== 'true';
    const list = await getBannersFromDb(onlyActive);
    res.json({ success: true, count: list.length, data: list });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/banners', async (req, res) => {
  try {
    const item = await insertBannerToDb(req.body);
    res.json({ success: true, message: 'Đã thêm banner thành công', data: item });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/banners/:id', async (req, res) => {
  try {
    const updated = await updateBannerInDb(req.params.id, req.body);
    res.json({ success: true, message: 'Đã cập nhật banner', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/banners/:id', async (req, res) => {
  try {
    await deleteBannerFromDb(req.params.id);
    res.json({ success: true, message: 'Đã xóa banner' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// =========================================================================
// 3. SITE SETTINGS (HEADER, FOOTER, CONTACT)
// =========================================================================
router.get('/settings', async (req, res) => {
  try {
    const settings = await getSiteSettingsFromDb();
    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/settings', async (req, res) => {
  try {
    const updated = await updateSiteSettingsInDb(req.body);
    res.json({ success: true, message: 'Đã lưu cấu hình hệ thống', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// =========================================================================
// 4. QUICK NOTICES (THÔNG BÁO NHANH TRANG CHỦ)
// =========================================================================
router.get('/quick-notices', async (req, res) => {
  try {
    const onlyActive = req.query.all !== 'true';
    const list = await getQuickNoticesFromDb(onlyActive);
    res.json({ success: true, count: list.length, data: list });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/quick-notices', async (req, res) => {
  try {
    const item = await insertQuickNoticeToDb(req.body);
    res.json({ success: true, message: 'Đã thêm thông báo nhanh', data: item });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/quick-notices/:id', async (req, res) => {
  try {
    const updated = await updateQuickNoticeInDb(req.params.id, req.body);
    res.json({ success: true, message: 'Đã cập nhật thông báo nhanh', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/quick-notices/:id', async (req, res) => {
  try {
    await deleteQuickNoticeFromDb(req.params.id);
    res.json({ success: true, message: 'Đã xóa thông báo nhanh' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// =========================================================================
// 5. EXTERNAL LINKS (LIÊN KẾT WEBSITE NGOÀI TRANG CHỦ)
// =========================================================================
router.get('/external-links', async (req, res) => {
  try {
    const onlyActive = req.query.all !== 'true';
    const list = await getExternalLinksFromDb(onlyActive);
    res.json({ success: true, count: list.length, data: list });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/external-links', async (req, res) => {
  try {
    const item = await insertExternalLinkToDb(req.body);
    res.json({ success: true, message: 'Đã thêm liên kết website', data: item });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/external-links/:id', async (req, res) => {
  try {
    const updated = await updateExternalLinkInDb(req.params.id, req.body);
    res.json({ success: true, message: 'Đã cập nhật liên kết', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/external-links/:id', async (req, res) => {
  try {
    await deleteExternalLinkFromDb(req.params.id);
    res.json({ success: true, message: 'Đã xóa liên kết' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// =========================================================================
// 6. CATEGORIES (CHUYÊN MỤC BÀI VIẾT)
// =========================================================================
router.get('/categories', async (req, res) => {
  try {
    const list = await getCategoriesFromDb();
    res.json({ success: true, count: list.length, data: list });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/categories', async (req, res) => {
  try {
    const item = await insertCategoryToDb(req.body);
    res.json({ success: true, message: 'Đã tạo chuyên mục mới', data: item });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/categories/:id', async (req, res) => {
  try {
    const updated = await updateCategoryInDb(req.params.id, req.body);
    res.json({ success: true, message: 'Đã cập nhật chuyên mục', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/categories/:id', async (req, res) => {
  try {
    await deleteCategoryFromDb(req.params.id);
    res.json({ success: true, message: 'Đã xóa chuyên mục' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


// =========================================================================
// UNIVERSAL IMAGE UPLOAD (FILE / BASE64) & REVERSE PROXY
// =========================================================================

router.post(['/upload/image', '/upload', '/upload-image'], (req, res) => {
  try {
    const { data, filename, name } = req.body;
    if (!data) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp dữ liệu hình ảnh (Base64 hoặc File)!' });
    }

    let ext = '.jpg';
    let base64Content = data;
    if (typeof data === 'string' && data.includes(';base64,')) {
      const parts = data.split(';base64,');
      base64Content = parts[1];
      if (parts[0].includes('png')) ext = '.png';
      else if (parts[0].includes('webp')) ext = '.webp';
      else if (parts[0].includes('gif')) ext = '.gif';
      else if (parts[0].includes('svg')) ext = '.svg';
    }

    const orig = (filename || name || 'upload').replace(/[^a-zA-Z0-9_\-\.]/g, '_');
    const safeBase = path.basename(orig, path.extname(orig)).slice(0, 30);
    const uniqueFileName = `${safeBase}_${Date.now()}${ext}`;

    const buffer = Buffer.from(base64Content, 'base64');

    const destDirs = [
      path.join(__dirname, '../../public/uploads'),
      path.join(__dirname, '../../frontend/public/uploads'),
      path.join(__dirname, '../../frontend/dist/uploads')
    ];

    destDirs.forEach(dir => {
      try {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, uniqueFileName), buffer);
      } catch (err) {
        console.error(`Lỗi lưu ảnh vào ${dir}:`, err.message);
      }
    });

    const fileUrl = `/uploads/${uniqueFileName}`;
    console.log(`📸 Uploaded image successfully: ${fileUrl} (${buffer.length} bytes)`);

    res.json({
      success: true,
      message: 'Tải hình ảnh lên máy chủ thành công!',
      url: fileUrl,
      filename: uniqueFileName
    });
  } catch (error) {
    console.error('Lỗi upload ảnh:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/proxy/image', (req, res) => {
  const imageUrl = req.query.url;
  if (!imageUrl) return res.status(400).send('Missing url parameter');
  const https = require('https');
  const http = require('http');
  const client = imageUrl.startsWith('https') ? https : http;

  const forwardReq = client.get(imageUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    rejectUnauthorized: false
  }, (remoteRes) => {
    res.writeHead(remoteRes.statusCode, remoteRes.headers);
    remoteRes.pipe(res);
  });
  forwardReq.on('error', () => {
    res.redirect('/images/banner.jpg');
  });
});

module.exports = router;

