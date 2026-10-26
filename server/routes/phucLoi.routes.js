/**
 * Welfare Routes - Định Tuyến Quản Lý Chế Độ Phúc Lợi & Quỹ Tương Trợ
 * Công Đoàn Trường Đại Học Thủ Dầu Một
 */

const express = require('express');
const router = express.Router();
const phucLoiController = require('../controllers/phucLoi.controller');

// Quỹ và Thu - Chi
router.get('/fund', phucLoiController.getFundSummary);
router.post('/fund/deposit', phucLoiController.depositFund);
router.post('/deposit', phucLoiController.depositFund);
router.post('/fund/disburse', phucLoiController.disburseFund);
router.post('/disburse', phucLoiController.disburseFund);

// Quản lý hồ sơ trợ cấp
router.get('/applications', phucLoiController.getApplications);
router.post('/applications', phucLoiController.createApplication);
router.put('/applications/:id', phucLoiController.updateApplication);
router.delete('/applications/:id', phucLoiController.deleteApplication);

// Danh mục chế độ phúc lợi
router.get('/', phucLoiController.getAllWelfarePrograms);

module.exports = router;
