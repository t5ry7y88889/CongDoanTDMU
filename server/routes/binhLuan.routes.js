/**
 * Binh Luan Routes - Quản Lý Ý Kiến & Bình Luận Bài Viết (dbo.COMMENTS)
 * Công Đoàn Trường Đại Học Thủ Dầu Một
 */

const express = require('express');
const router = express.Router();
const {
  getCommentsFromDb,
  insertCommentToDb,
  deleteCommentFromDb
} = require('../mssql_db');

// 1. Lấy danh sách bình luận (theo bài viết hoặc tất cả)
router.get('/', async (req, res) => {
  try {
    const articleId = req.query.article_id || req.query.articleId;
    const comments = await getCommentsFromDb(articleId);
    res.json({
      success: true,
      count: (comments || []).length,
      data: comments || []
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Gửi bình luận mới
router.post('/', async (req, res) => {
  try {
    const { articleId, article_id, author, author_name, content, email, unit } = req.body;
    const targetArticleId = articleId || article_id;

    if (!targetArticleId) {
      return res.status(400).json({ success: false, error: 'Thiếu mã bài viết (articleId)' });
    }
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, error: 'Nội dung bình luận không được để trống' });
    }

    const newComment = await insertCommentToDb({
      articleId: parseInt(targetArticleId),
      author: (author || author_name || 'Đoàn viên Công đoàn').trim(),
      unit: (unit || 'Trường ĐH Thủ Dầu Một').trim(),
      content: content.trim(),
      email: email ? email.trim() : null,
      status: 'approved'
    });

    res.json({
      success: true,
      message: 'Đã gửi ý kiến bình luận thành công!',
      data: newComment
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Xóa bình luận (Quản trị viên)
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await deleteCommentFromDb(id);
    res.json({
      success: true,
      message: 'Đã xóa bình luận thành công!'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
