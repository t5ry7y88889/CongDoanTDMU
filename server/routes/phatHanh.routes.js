/**
 * Publish Routes - Định Tuyến Quản Lý Phát Hành Đa Kênh & Lập Lịch
 * Công Đoàn Trường Đại Học Thủ Dầu Một
 */

const express = require('express');
const router = express.Router();
const kenhTruyenThongController = require('../controllers/kenhTruyenThong.controller');
const zaloBotService = require('../services/dichVuZaloBot.service');

// 1. Cấu hình & Quản lý danh sách tài khoản gửi
router.get('/channel-settings', kenhTruyenThongController.getChannelSettings);
router.post('/channel-settings', kenhTruyenThongController.updateChannelSettings);
router.get('/accounts', kenhTruyenThongController.getAccounts);
router.post('/accounts', kenhTruyenThongController.saveAccount);
router.delete('/accounts/:channel/:id', kenhTruyenThongController.deleteAccount);
router.post('/test-connection', kenhTruyenThongController.testConnection);
router.get('/test-connection', kenhTruyenThongController.testConnection);

// 2. Xuất bản trực tiếp từng kênh (Facebook Fanpage, Zalo OA / P2P / Bot)
router.post('/facebook', kenhTruyenThongController.publishFacebookDirect);
router.post('/facebook-direct', kenhTruyenThongController.publishFacebookDirect);
router.post('/zalo', kenhTruyenThongController.publishZaloDirect);
router.post('/zalo-direct', kenhTruyenThongController.publishZaloDirect);
router.post('/zalo-bot/send-group', kenhTruyenThongController.publishZaloGroup);
router.post('/zalo/send-group', kenhTruyenThongController.publishZaloGroup);

// 3. Zalo Bot Endpoints (Đăng nhập QR, Trạng thái, Quản lý Nhóm)
router.get('/zalo/bot-status', (req, res) => {
  try {
    const status = zaloBotService.getStatus();
    res.json({ success: true, data: status });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/zalo/bot-login-qr', async (req, res) => {
  try {
    const qrData = await zaloBotService.startQrLogin();
    res.json({ success: true, data: qrData });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/zalo/bot-logout', (req, res) => {
  try {
    const result = zaloBotService.logout();
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/zalo/bot-groups', async (req, res) => {
  try {
    const groups = await zaloBotService.getGroups();
    res.json({ success: true, data: groups });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Phát hành đồng thời đa kênh (Omnichannel)
router.post('/now', kenhTruyenThongController.publishOmnichannelNow);

// 5. Quản lý lập lịch xuất bản
router.get('/schedules', kenhTruyenThongController.getSchedules);
router.post('/schedule', kenhTruyenThongController.createSchedule);
router.delete('/schedule/:id', kenhTruyenThongController.cancelSchedule);

module.exports = router;
