const express = require('express');
const router = express.Router();
const { loadDB, saveDB } = require('../db');
const {
  insertFeedbackToDb,
  getFeedbackFromDb,
  updateFeedbackInDb,
  deleteFeedbackFromDb,
  getBookmarksFromDb,
  toggleBookmarkInDb,
  getCommentsFromDb,
  insertCommentToDb,
  deleteCommentFromDb,
  getInboxCommentsFromDb,
  getArticlesFromDb,
  getWelfareApplicationsFromDb
} = require('../mssql_db');
const { validate, z } = require('../middleware/validate');

// =========================================================================
// 1. INBOX FEEDBACK (Ý KIẾN ĐOÀN VIÊN)
// =========================================================================
function stripVietnamese(str) {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLowerCase();
}

// =========================================================================
// 1. INBOX FEEDBACK (Ý KIẾN & HÒM THƯ GÓP Ý ĐOÀN VIÊN)
// =========================================================================
const allFeedback = (db) => {
  const seen = new Set();
  return [...(db.inbox_feedback || []), ...(db.feedback_messages || [])].filter(f => {
    const key = f.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

router.get('/feedback', async (req, res) => {
  let list = await getFeedbackFromDb();
  const { status, search } = req.query;

  if (status && status !== 'all') {
    list = list.filter(f => f.status === status);
  }

  if (search) {
    const q = stripVietnamese(search.trim());
    list = list.filter(f =>
      stripVietnamese(f.title).includes(q) ||
      stripVietnamese(f.content).includes(q) ||
      stripVietnamese(f.sender_name).includes(q) ||
      stripVietnamese(f.unit).includes(q) ||
      stripVietnamese(f.category).includes(q)
    );
  }

  res.json({ success: true, count: list.length, data: list });
});

router.get('/feedback/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const list = await getFeedbackFromDb();
  const item = list.find(f => f.id === id || Number(f.id) === id);
  if (!item) return res.status(404).json({ success: false, error: 'Không tìm thấy ý kiến góp ý!' });
  res.json({ success: true, data: item });
});

const feedbackSchema = z.object({
  sender_name: z.string().trim().min(2, 'Họ tên ít nhất 2 ký tự'),
  email: z.string().trim().email('Email không hợp lệ').optional().default(''),
  phone: z.string().trim().optional().default(''),
  unit: z.string().trim().optional().default('Đoàn viên TDMU'),
  category: z.string().trim().optional().default('Góp ý chung'),
  title: z.string().trim().min(5, 'Tiêu đề ít nhất 5 ký tự'),
  content: z.string().trim().min(5, 'Nội dung ít nhất 5 ký tự')
});

router.post('/feedback', validate(feedbackSchema), async (req, res) => {
  const newFeedback = await insertFeedbackToDb(req.body);
  res.json({ success: true, data: newFeedback, message: 'Cảm ơn bạn! Ý kiến đã được chuyển trực tiếp đến Ban Chấp Hành Công đoàn.' });
});

router.put('/feedback/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { status, response, resolved_by } = req.body;

  const updated = await updateFeedbackInDb(id, { status, response, resolved_by });
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Không tìm thấy ý kiến góp ý cần cập nhật!' });
  }

  res.json({ success: true, data: updated, message: 'Đã cập nhật xử lý ý kiến thành công!' });
});

router.delete('/feedback/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const removed = await deleteFeedbackFromDb(id);
  if (!removed) {
    return res.status(404).json({ success: false, error: 'Không tìm thấy ý kiến góp ý!' });
  }
  res.json({ success: true, message: 'Đã xóa ý kiến góp ý thành công!', data: { id } });
});

// =========================================================================
// 1b. INBOX FEEDBACK BACKWARD-COMPAT ALIAS (admin modules)
// =========================================================================
router.get('/inbox-feedback', (req, res) => {
  const db = loadDB();
  const list = allFeedback(db);
  res.json({ success: true, count: list.length, data: list });
});

// =========================================================================
// 2. BOOKMARKS (TỦ SÁCH ĐỌC SAU)
// =========================================================================
router.get('/bookmarks', async (req, res) => {
  const userId = req.query.user_id || 'CB_001';
  const sqlBookmarks = await getBookmarksFromDb(userId);
  if (sqlBookmarks) return res.json({ success: true, data: sqlBookmarks });

  const db = loadDB();
  const userBookmarks = (db.bookmarks || []).filter(b => !req.query.user_id || b.user_id === userId);
  res.json({ success: true, data: userBookmarks });
});

router.post('/bookmarks', async (req, res) => {
  const { article_id, article_title, user_id, user_name } = req.body;
  if (!article_id) return res.status(400).json({ success: false, error: 'Thiếu article_id' });

  const sqlResult = await toggleBookmarkInDb({ article_id, article_title, user_id, user_name });
  if (sqlResult) {
    if (sqlResult.action === 'removed') {
      return res.json({ success: true, action: 'removed', message: 'Đã bỏ lưu bài viết' });
    }
    return res.json({ success: true, action: 'added', data: sqlResult.data, message: 'Đã lưu bài viết vào Tủ sách đọc sau' });
  }

  const db = loadDB();
  db.bookmarks = db.bookmarks || [];
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
router.get('/comments', async (req, res) => {
  const { article_id } = req.query;
  if (article_id) {
    const list = await getCommentsFromDb(article_id);
    return res.json({ success: true, count: list.length, data: list });
  }
  const db = loadDB();
  res.json({ success: true, count: (db.comments || []).length, data: db.comments || [] });
});

const localCommentSchema = z.object({
  article_id: z.coerce.number().int().positive(),
  author_name: z.string().trim().min(2, 'Họ tên ít nhất 2 ký tự'),
  content: z.string().trim().min(2, 'Nội dung bình luận ít nhất 2 ký tự')
});

router.post('/comments', validate(localCommentSchema), async (req, res) => {
  const { article_id, author_name, content } = req.body;
  const created = await insertCommentToDb(article_id, { name: author_name, email: '', position: '', content });
  res.json({ success: true, data: created, message: 'Đã gửi bình luận thành công!' });
});

router.get('/inbox/comments', async (req, res) => {
  const list = await getInboxCommentsFromDb();
  const mapped = list.map(c => ({
    id: c.id,
    article_id: c.article_id,
    article_title: c.article_title || '',
    authorName: c.name || 'Đoàn viên TDMU',
    commentText: c.content || '',
    platform: c.platform || 'Website',
    status: c.status,
    createdAt: c.createdAt || ''
  }));
  res.json({ success: true, count: mapped.length, data: mapped });
});

router.delete('/comments/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const removed = await deleteCommentFromDb(id);
  if (!removed) return res.status(404).json({ success: false, error: 'Không tìm thấy bình luận!' });
  res.json({ success: true, message: 'Đã xóa bình luận thành công!' });
});

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

// =========================================================================
// 4. STATS & ANALYTICS DASHBOARD (SQL-FIRST)
// =========================================================================
const getDashboardStats = async (req, res) => {
  try {
    const arts = await getArticlesFromDb('all', 'all');
    const feedbackList = await getFeedbackFromDb();
    const welfareList = await getWelfareApplicationsFromDb('all');
    const commentList = await getInboxCommentsFromDb();

    const published = arts.filter(a => (a.status || '').includes('publish') || (a.status || '').includes('approve'));
    const pending = arts.filter(a => (a.status || '').includes('pending'));
    const drafts = arts.filter(a => (a.status || '').includes('draft'));

    res.json({
      success: true,
      totalArticles: arts.length,
      totalViews: arts.reduce((acc, a) => acc + (a.viewsCount || a.LuotXem || 0), 0),
      totalLikes: arts.reduce((acc, a) => acc + (a.likesCount || a.LuotThich || 0), 0),
      totalShares: arts.reduce((acc, a) => acc + (a.sharesCount || 0), 0),
      totalComments: commentList.length,
      totalFeedback: feedbackList.length,
      totalWelfareApplications: welfareList.length,
      aiArticlesCount: arts.filter(a => a.isAiGenerated || a.is_ai_generated).length,
      publishedCount: published.length,
      data: {
        tong_bai: arts.length,
        da_xuat_ban: published.length,
        cho_duyet: pending.length,
        ban_nhap: drafts.length,
        tong_gop_y: feedbackList.length,
        tong_don_tro_cap: welfareList.length,
        tong_binh_luan: commentList.length,
        bai_gan_day: arts.slice(0, 5)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Lỗi thống kê: ' + err.message });
  }
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
    facebookPostId: `fb_sync_${articleId || Date.now()}`,
    message: `Đã đồng bộ và xuất bản thành công bài viết "${title}" lên kênh Fanpage Công Đoàn TDMU!`
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
