const express = require('express');
const router = express.Router();
const { loadDB, saveDB } = require('../db');

// =========================================================================
// 1. INBOX FEEDBACK (Ý KIẾN ĐOÀN VIÊN)
// =========================================================================
router.get('/feedback', (req, res) => {
  const db = loadDB();
  res.json({ success: true, data: db.inbox_feedback || [] });
});

router.post('/feedback', (req, res) => {
  const db = loadDB();
  db.inbox_feedback = db.inbox_feedback || [];
  const { sender_name, email, phone, unit, category, title, content } = req.body;

  if (!sender_name || !title || !content) {
    return res.status(400).json({ success: false, error: 'Họ tên, tiêu đề và nội dung là bắt buộc' });
  }

  const newFeedback = {
    id: db.inbox_feedback.length ? Math.max(...db.inbox_feedback.map(f => f.id || 0)) + 1 : 1,
    sender_name,
    email: email || '',
    phone: phone || '',
    unit: unit || 'Đoàn viên TDMU',
    category: category || 'Góp ý chung',
    title,
    content,
    submitted_at: new Date().toISOString(),
    status: 'pending',
    response: null
  };

  db.inbox_feedback.push(newFeedback);
  saveDB(db);
  res.json({ success: true, data: newFeedback, message: 'Cảm ơn bạn! Ý kiến đã được chuyển trực tiếp đến Ban Chấp Hành Công đoàn.' });
});

router.get('/inbox-feedback', (req, res) => {
  const db = loadDB();
  res.json({ success: true, count: (db.inbox_feedback || []).length, data: db.inbox_feedback || [] });
});

// =========================================================================
// 2. BOOKMARKS (TỦ SÁCH ĐỌC SAU)
// =========================================================================
router.get('/bookmarks', (req, res) => {
  const db = loadDB();
  const userId = req.query.user_id || 'CB_001';
  const userBookmarks = (db.bookmarks || []).filter(b => !req.query.user_id || b.user_id === userId);
  res.json({ success: true, data: userBookmarks });
});

router.post('/bookmarks', (req, res) => {
  const db = loadDB();
  db.bookmarks = db.bookmarks || [];
  const { article_id, article_title, user_id, user_name } = req.body;
  if (!article_id) return res.status(400).json({ success: false, error: 'Thiếu article_id' });

  const existingIdx = db.bookmarks.findIndex(b => b.article_id == article_id && (!user_id || b.user_id === user_id));
  if (existingIdx >= 0) {
    db.bookmarks.splice(existingIdx, 1);
    saveDB(db);
    return res.json({ success: true, action: 'removed', message: 'Đã bỏ lưu bài viết' });
  }

  const newBookmark = {
    id: db.bookmarks.length ? Math.max(...db.bookmarks.map(b => b.id || 0)) + 1 : 1,
    user_id: user_id || 'CB_001',
    user_name: user_name || 'TS. Lê Thị Kim Út',
    article_id: parseInt(article_id),
    article_title: article_title || 'Bài viết Công đoàn',
    saved_at: new Date().toISOString()
  };
  db.bookmarks.push(newBookmark);
  saveDB(db);
  res.json({ success: true, action: 'added', data: newBookmark, message: 'Đã lưu bài viết vào Tủ sách đọc sau' });
});

// =========================================================================
// 3. COMMENTS, AUDITS, SCHEDULES, EVENTS & MEDIA
// =========================================================================
router.get('/comments', (req, res) => {
  const db = loadDB();
  res.json({ success: true, count: (db.comments || []).length, data: db.comments || [] });
});

router.get('/inbox/comments', (req, res) => res.json({ success: true, data: loadDB().comments || [] }));

router.get('/article-audits', (req, res) => {
  const db = loadDB();
  res.json({ success: true, count: (db.article_audits || []).length, data: db.article_audits || [] });
});

router.get('/audits', (req, res) => {
  const db = loadDB();
  res.json({ success: true, data: db.article_audits || [] });
});

router.get('/schedules', (req, res) => {
  const db = loadDB();
  res.json({ success: true, data: db.schedules || db.lich_xuat_ban || [] });
});

router.get('/events', (req, res) => res.json({ success: true, data: loadDB().events || [] }));
router.get('/media', (req, res) => res.json({ success: true, data: loadDB().media || [] }));

// =========================================================================
// 4. STATS & ANALYTICS DASHBOARD
// =========================================================================
const getDashboardStats = (req, res) => {
  const db = loadDB();
  const arts = db.articles || [];
  res.json({
    success: true,
    totalArticles: arts.length,
    totalViews: arts.reduce((acc, a) => acc + (a.viewsCount || a.LuotXem || 0), 0),
    totalLikes: arts.reduce((acc, a) => acc + (a.likesCount || a.LuotThich || 0), 0),
    totalShares: arts.reduce((acc, a) => acc + (a.sharesCount || 0), 0),
    aiArticlesCount: arts.filter(a => a.isAiGenerated || a.is_ai_generated).length,
    publishedCount: arts.filter(a => a.status === 'published' || a.TrangThai === 'Published').length,
    data: {
      tong_bai: arts.length,
      da_xuat_ban: arts.filter(a => a.status === 'published' || a.TrangThai === 'Published').length,
      cho_duyet: arts.filter(a => a.status === 'pending' || a.TrangThai === 'Pending').length,
      ban_nhap: arts.filter(a => a.status === 'draft' || a.TrangThai === 'Draft').length,
      bai_gan_day: arts.slice(0, 5)
    }
  });
};

router.get('/analytics', getDashboardStats);
router.get('/dashboard', getDashboardStats);
router.get('/stats', getDashboardStats);

router.post('/facebook/publish', (req, res) => {
  const { articleId, title } = req.body;
  const db = loadDB();
  const art = (db.articles || []).find(a => a.id == articleId);
  if (art) {
    art.status = 'published';
    art.statusName = 'Đã Xuất Bản';
    saveDB(db);
  }
  res.json({
    success: true,
    facebookPostId: `simulated_fb_${articleId || Date.now()}`,
    message: `[MÔ PHỎNG XUẤT BẢN FANPAGE FACEBOOK OK] Đã chuyển bài viết "${title}" sang trạng thái xuất bản Fanpage TDMU!`
  });
});

// =========================================================================
// 5. PACKAGES CLAIM / UNCLAIM
// =========================================================================
router.post('/packages/:id/claim', (req, res) => {
  const id = req.params.id;
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ success: false, error: 'Thiếu userId' });

  const db = loadDB();
  const art = (db.articles || []).find(a => a.id == id);
  if (!art) return res.status(404).json({ success: false, error: 'Không tìm thấy package' });
  
  if (art.assignee_id && art.assignee_id !== userId) {
    return res.status(403).json({ success: false, error: 'Package này đã bị claim bởi người khác.' });
  }

  art.assignee_id = userId;
  art.updatedAt = new Date().toISOString();
  saveDB(db);
  res.json({ success: true, message: 'Đã nhận việc thành công.' });
});

router.post('/packages/:id/unclaim', (req, res) => {
  const id = req.params.id;
  const { userId } = req.body;
  const db = loadDB();
  const art = (db.articles || []).find(a => a.id == id);
  if (!art) return res.status(404).json({ success: false, error: 'Không tìm thấy package' });
  
  if (art.assignee_id && art.assignee_id !== userId) {
    return res.status(403).json({ success: false, error: 'Bạn không có quyền trả việc package của người khác.' });
  }

  art.assignee_id = null;
  art.updatedAt = new Date().toISOString();
  saveDB(db);
  res.json({ success: true, message: 'Đã hủy nhận việc thành công.' });
});

// =========================================================================
// 6. DOSSIERS & ASSETS
// =========================================================================
router.get('/dossiers', (req, res) => {
  const db = loadDB();
  const dossiers = db.dossiers || [];
  const assets = db.assets || [];
  const articles = db.articles || [];

  const enriched = dossiers.map(d => ({
    ...d,
    assetsCount: assets.filter(a => a.dossierId === d.id).length,
    contentCount: articles.filter(a => a.dossierId === d.id).length
  }));

  res.json({ success: true, count: enriched.length, data: enriched });
});

router.get('/dossiers/:id', (req, res) => {
  const db = loadDB();
  const dossier = (db.dossiers || []).find(d => d.id === req.params.id);
  if (!dossier) return res.status(404).json({ success: false, error: 'Không tìm thấy hồ sơ' });
  
  const relatedAssets = (db.assets || []).filter(a => a.dossierId === req.params.id);
  const relatedArticles = (db.articles || []).filter(a => a.dossierId === req.params.id);
  
  res.json({ success: true, data: { ...dossier, assets: relatedAssets, articles: relatedArticles } });
});

router.post('/dossiers', (req, res) => {
  const { title, code, category, unit, leadPerson, description, startDate, endDate } = req.body;
  if (!title) return res.json({ success: false, error: 'Tiêu đề hồ sơ là bắt buộc' });

  const db = loadDB();
  if (!db.dossiers) db.dossiers = [];

  const newDossier = {
    id: `dossier_${Date.now()}`,
    code: code || `HS-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    title,
    category: category || 'Thông Báo Chỉ Đạo',
    unit: unit || 'Ban Thường Vụ Công Đoàn',
    leadPerson: leadPerson || 'Cán Bộ Phụ Trách',
    status: 'active',
    startDate: startDate || new Date().toISOString().slice(0, 10),
    endDate: endDate || '',
    description: description || '',
    createdAt: new Date().toISOString()
  };

  db.dossiers.unshift(newDossier);
  saveDB(db);
  res.json({ success: true, message: 'Đã tạo Hồ sơ nội dung mới thành công!', data: newDossier });
});

router.get('/assets', (req, res) => {
  const { dossierId, fileType, source } = req.query;
  const db = loadDB();
  let list = db.assets || [];

  if (dossierId && dossierId !== 'all') {
    list = list.filter(a => a.dossierId === dossierId);
  }
  if (fileType && fileType !== 'all') {
    list = list.filter(a => a.fileType === fileType);
  }
  if (source && source !== 'all') {
    list = list.filter(a => a.source === source);
  }

  res.json({ success: true, count: list.length, data: list });
});

router.post('/assets', async (req, res) => {
  const { title, fileName, fileType, dossierId, source, unit, uploadedBy, summary, fileUrl } = req.body;
  if (!title) return res.json({ success: false, error: 'Tên tư liệu là bắt buộc' });

  const db = loadDB();
  if (!db.assets) db.assets = [];

  const newAsset = {
    id: `asset_${Date.now()}`,
    title,
    fileName: fileName || `${title.replace(/\s+/g, '_')}.pdf`,
    fileType: fileType || 'document',
    fileSize: req.body.fileSize || '1.5 MB',
    fileUrl: fileUrl || (fileType === 'image' ? 'images/banner.jpg' : 'uploads/sample.pdf'),
    dossierId: dossierId || null,
    source: source || 'Công đoàn TDMU',
    unit: unit || 'Ban Thường Vụ',
    uploadedBy: uploadedBy || 'Cán Bộ Phụ Trách',
    status: 'verified',
    ai_status: 'ready',
    confidence_score: 95,
    ai_notes: 'Tài liệu rõ nét, đầy đủ thông tin truyền thông.',
    aiAllowed: true,
    summary: summary || title,
    createdAt: new Date().toISOString()
  };

  db.assets.unshift(newAsset);
  saveDB(db);
  res.json({ success: true, message: 'Đã nạp tư liệu mới vào Hòm Thư Tư Liệu thành công!', data: newAsset });
});

router.delete('/assets/:id', (req, res) => {
  const db = loadDB();
  db.assets = (db.assets || []).filter(a => a.id !== req.params.id);
  saveDB(db);
  res.json({ success: true, message: 'Đã xóa tư liệu khỏi hệ thống' });
});

module.exports = router;
