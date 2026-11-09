/**
 * Article Routes - Định Tuyến Quản Lý Bài Báo & Bản Thảo
 * Công Đoàn Trường Đại Học Thủ Dầu Một
 */

const express = require('express');
const router = express.Router();
const baiVietController = require('../controllers/baiViet.controller');

// Lấy danh sách bài viết & bản thảo
router.get('/', baiVietController.getAllArticles);
router.get('/drafts', baiVietController.getDrafts);

// Chi tiết, tạo mới, sửa, xóa
router.get('/:id', baiVietController.getArticleById);
router.post('/', baiVietController.createArticle);
router.put('/:id', baiVietController.updateArticle);
router.delete('/:id', baiVietController.deleteArticle);

// Thẩm định & Phê duyệt bài viết (Biên tập viên / Admin)
router.post('/:id/review', baiVietController.reviewArticle);
router.put('/:id/review', baiVietController.reviewArticle);

// Tương tác cảm xúc
router.post('/:id/react', baiVietController.reactArticle);

module.exports = router;
