const express = require('express');
const router = express.Router();
const { loadDB, saveDB } = require('../db');
const {
  getArticlesFromDb,
  insertArticleToDb,
  updateArticleInDb,
  deleteArticleFromDb
} = require('../mssql_db');

// =========================================================================
// 1. ARTICLES CRUD (MSSQL 3NF + JSON FALLBACK)
// =========================================================================
router.get('/', async (req, res) => {
  const { category, status, search } = req.query;
  let list = await getArticlesFromDb(category, status, search);
  list.sort((a, b) => (parseInt(b.id) || 0) - (parseInt(a.id) || 0));
  res.json({ success: true, count: list.length, data: list });
});

router.get('/:id', async (req, res) => {
  const list = await getArticlesFromDb('all', 'all');
  const art = list.find(a => a.id == req.params.id);
  if (!art) return res.status(404).json({ success: false, error: 'Không tìm thấy bài viết' });
  res.json({ success: true, data: art });
});

router.post('/', async (req, res) => {
  const { title, categoryName, categoryId, summary, content, image, author, status, isAiGenerated, aiPrompt, packageData } = req.body;
  if (!title) return res.json({ success: false, error: 'Tiêu đề là bắt buộc' });

  const articleData = {
    title,
    categoryId: categoryId || 1,
    categoryName: categoryName || 'Thông Báo Chỉ Đạo',
    summary: summary || title,
    content: content || title,
    image: image || 'images/banner.jpg',
    author: author || 'Cán Bộ Công Đoàn',
    authorId: 1,
    status: status || 'pending_review',
    isAiGenerated: !!isAiGenerated,
    aiPrompt: aiPrompt || '',
    packageData: packageData || null
  };

  const created = await insertArticleToDb(articleData);
  const statusMap = { published: 'Đã Xuất Bản', approved: 'Đã Duyệt', pending_review: 'Chờ Duyệt', pending: 'Chờ Duyệt', draft: 'Bản Nháp' };
  created.statusName = statusMap[created.status] || 'Chờ Duyệt';
  res.json({ success: true, message: 'Đã lưu bài viết vào CSDL hệ thống (Transactional)', data: created });
});

router.put('/:id', async (req, res) => {
  const id = req.params.id;
  const { title, categoryName, summary, content, status, scheduledAt, publish_mode, image, changeType, isAiGenerated, aiProvider, aiModel, aiPrompt, currentUserId } = req.body;

  const db = loadDB();
  const art = (db.articles || []).find(a => a.id == id);
  if (art && art.assignee_id && currentUserId && art.assignee_id !== currentUserId) {
    return res.status(403).json({ success: false, error: 'Package này đang được xử lý bởi người khác (Hard Lock).' });
  }

  let finalStatus = status;
  if (publish_mode === 'schedule' && scheduledAt) {
    finalStatus = 'scheduled';
  }

  const updateData = {};
  if (req.body.title !== undefined) updateData.title = req.body.title;
  if (req.body.categoryName !== undefined) updateData.categoryName = req.body.categoryName;
  if (req.body.summary !== undefined) updateData.summary = req.body.summary;
  if (req.body.content !== undefined) updateData.content = req.body.content;
  if (finalStatus !== undefined) updateData.status = finalStatus;
  if (req.body.scheduledAt !== undefined) updateData.scheduledAt = req.body.scheduledAt;
  if (req.body.image !== undefined) updateData.image = req.body.image;
  if (req.body.changeType !== undefined) updateData.changeType = req.body.changeType;
  if (req.body.isAiGenerated !== undefined) updateData.isAiGenerated = !!req.body.isAiGenerated;
  if (req.body.aiProvider !== undefined) updateData.aiProvider = req.body.aiProvider;
  if (req.body.aiModel !== undefined) updateData.aiModel = req.body.aiModel;
  if (req.body.aiPrompt !== undefined) updateData.aiPrompt = req.body.aiPrompt;
  if (req.body.packageData !== undefined) updateData.packageData = req.body.packageData;

  await updateArticleInDb(id, updateData);
  const statusMap = { published: 'Đã Xuất Bản', approved: 'Đã Duyệt', pending_review: 'Chờ Duyệt', pending: 'Chờ Duyệt', draft: 'Bản Nháp', scheduled: 'Đã Lên Lịch', publish_failed: 'Lỗi Đăng Bài' };
  res.json({ success: true, message: 'Đã cập nhật bài viết & lưu phiên bản mới vào CSDL', data: { id, status: updateData.status, statusName: statusMap[updateData.status] || 'Đã Lưu' } });
});

router.delete('/:id', async (req, res) => {
  const id = req.params.id;
  await deleteArticleFromDb(id);
  res.json({ success: true, message: 'Đã xóa bài viết vĩnh viễn khỏi CSDL' });
});

router.post('/:id/approve', async (req, res) => {
  const id = req.params.id;
  await updateArticleInDb(id, { status: 'approved' });
  res.json({ success: true, message: 'Đã duyệt bài viết thành công' });
});

router.post('/:id/submit-review', async (req, res) => {
  await updateArticleInDb(req.params.id, { status: 'pending_review' });
  res.json({ success: true, message: 'Đã gửi bài viết lên Ban Chấp Hành chờ phê duyệt!' });
});

router.post('/:id/reject', async (req, res) => {
  const reason = req.body.reason || 'Cần chỉnh sửa lại theo góp ý';
  await updateArticleInDb(req.params.id, { status: 'draft', rejectReason: reason });
  res.json({ success: true, message: 'Đã hoàn trả bài viết về trạng thái Bản Nháp để biên tập lại!' });
});

// =========================================================================
// 2. ARTICLE REACTIONS
// =========================================================================
router.get('/:id/reactions', (req, res) => {
  const db = loadDB();
  const articleId = parseInt(req.params.id);
  const reactions = (db.article_reactions || []).filter(r => r.article_id === articleId);

  const summary = {
    like: reactions.filter(r => r.reaction_type === 'like').length,
    heart: reactions.filter(r => r.reaction_type === 'heart').length,
    clap: reactions.filter(r => r.reaction_type === 'clap').length,
    total: reactions.length
  };

  const userReaction = req.query.user_id ? reactions.find(r => r.user_id === req.query.user_id) : null;
  res.json({ success: true, summary, user_reaction: userReaction ? userReaction.reaction_type : null });
});

router.post('/:id/reactions', (req, res) => {
  const db = loadDB();
  db.article_reactions = db.article_reactions || [];
  const articleId = parseInt(req.params.id);
  const { user_id, user_name, reaction_type } = req.body;

  if (!reaction_type) return res.status(400).json({ success: false, error: 'Thiếu reaction_type' });

  const userId = user_id || 'CB_001';
  const existingIdx = db.article_reactions.findIndex(r => r.article_id === articleId && r.user_id === userId);

  if (existingIdx >= 0) {
    if (db.article_reactions[existingIdx].reaction_type === reaction_type) {
      db.article_reactions.splice(existingIdx, 1);
      saveDB(db);
      return res.json({ success: true, action: 'removed', reaction_type: null });
    } else {
      db.article_reactions[existingIdx].reaction_type = reaction_type;
      saveDB(db);
      return res.json({ success: true, action: 'changed', reaction_type });
    }
  }

  const newReaction = {
    id: db.article_reactions.length ? Math.max(...db.article_reactions.map(r => r.id || 0)) + 1 : 1,
    article_id: articleId,
    user_id: userId,
    user_name: user_name || 'TS. Lê Thị Kim Út',
    reaction_type,
    created_at: new Date().toISOString()
  };

  db.article_reactions.push(newReaction);
  saveDB(db);
  res.json({ success: true, action: 'added', reaction_type });
});

module.exports = router;
