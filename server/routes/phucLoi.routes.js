/**
 * ============================================================================
 * ĐỒ ÁN CHUYÊN NGÀNH: CÔNG ĐOÀN ĐH THỦ DẦU MỘT
 * File: server/routes/phucLoi.routes.js
 * Chức năng: Định Tuyến Phân Hệ Phúc Lợi & Chính Sách Chăm Lo Đoàn Viên (Kèm PDF)
 * ============================================================================
 */

const express = require('express');
const router = express.Router();
const phucLoiController = require('../controllers/phucLoi.controller');

// 1. Quản lý Quỹ & Tổng quan tinh giản (Không kế toán tiền nong)
router.get('/fund', phucLoiController.getFundSummary);
router.post('/fund/deposit', phucLoiController.depositFund);
router.post('/deposit', phucLoiController.depositFund);
router.post('/fund/disburse', phucLoiController.disburseFund);
router.post('/disburse', phucLoiController.disburseFund);

// 2. Quản lý Hồ sơ trợ cấp đoàn viên
router.get('/applications', phucLoiController.getApplications);
router.post('/applications', phucLoiController.createApplication);
router.put('/applications/:id', phucLoiController.updateApplication);
router.delete('/applications/:id', phucLoiController.deleteApplication);

// 3. Tải tệp PDF/Văn bản chính sách phúc lợi
router.get('/download/:id', phucLoiController.downloadWelfareFile);
router.get('/:id/download', phucLoiController.downloadWelfareFile);
router.post('/:id/download', phucLoiController.downloadWelfarePdf);

// 4. CRUD Bài đăng thông báo chính sách phúc lợi kèm PDF
router.get('/:id', phucLoiController.getWelfarePostById);
router.post('/', phucLoiController.createWelfarePost);
router.put('/:id', phucLoiController.updateWelfarePost);
router.delete('/:id', phucLoiController.deleteWelfarePost);

// 5. Danh sách toàn bộ chính sách phúc lợi
router.get('/', phucLoiController.getAllWelfarePrograms);

module.exports = router;
