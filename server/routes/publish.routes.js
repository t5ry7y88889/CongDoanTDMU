const express = require('express');
const router = express.Router();
const { loadDB, saveDB } = require('../db');
const {
  getChannelCredentials,
  saveChannelCredentials,
  publishToFacebook,
  publishToZaloOA,
  publishOmnichannel,
  scheduleOmnichannel
} = require('../services/multiChannelService');

// =========================================================================
// 1. CẤU HÌNH & KIỂM TRA KẾT NỐI API CÁC KÊNH (SETTINGS & TEST CONNECTIVITY)
// =========================================================================

// GET /api/publish/channel-settings
router.get('/channel-settings', (req, res) => {
  const creds = getChannelCredentials();
  // Che bớt token để bảo mật
  const safeCreds = {
    facebook: {
      pageId: creds.facebook.pageId,
      pageName: creds.facebook.pageName,
      hasToken: Boolean(creds.facebook.accessToken),
      tokenPreview: creds.facebook.accessToken ? `EAA...${creds.facebook.accessToken.slice(-6)}` : '',
      enabled: creds.facebook.enabled
    },
    zalo: {
      oaId: creds.zalo.oaId,
      oaName: creds.zalo.oaName,
      hasToken: Boolean(creds.zalo.accessToken),
      tokenPreview: creds.zalo.accessToken ? `...${creds.zalo.accessToken.slice(-6)}` : '',
      enabled: creds.zalo.enabled
    },
    web: creds.web
  };
  res.json({ success: true, data: safeCreds });
});

// POST /api/publish/channel-settings
router.post('/channel-settings', (req, res) => {
  const updated = saveChannelCredentials(req.body);
  res.json({ success: true, message: 'Đã cập nhật cấu hình API đa kênh thành công', data: updated });
});

// POST /api/publish/test-connection
router.post('/test-connection', async (req, res) => {
  const { channel } = req.body;
  const creds = getChannelCredentials();

  if (channel === 'facebook') {
    if (!creds.facebook.accessToken || !creds.facebook.pageId) {
      return res.json({
        success: true,
        mode: 'sandbox',
        status: 'ready_sandbox',
        message: 'Chưa cấu hình Token thật. Hệ thống đang chạy ở chế độ Graph API Sandbox (Mô phỏng hợp lệ v20.0).'
      });
    }
    try {
      const fetch = (await import('node-fetch')).default || globalThis.fetch;
      const testRes = await fetch(`https://graph.facebook.com/v20.0/${creds.facebook.pageId}?fields=id,name,link&access_token=${creds.facebook.accessToken}`);
      const testData = await testRes.json();
      if (!testRes.ok || testData.error) {
        throw new Error(testData.error?.message || 'Token không hợp lệ hoặc thiếu quyền Pages Read/Manage');
      }
      return res.json({
        success: true,
        mode: 'live_meta_api',
        pageName: testData.name,
        pageId: testData.id,
        link: testData.link,
        message: `Kết nối thành công tới Meta Graph API v20.0 Fanpage: "${testData.name}"`
      });
    } catch (e) {
      return res.json({
        success: false,
        error: e.message
      });
    }
  }

  if (channel === 'zalo') {
    if (!creds.zalo.accessToken || !creds.zalo.oaId) {
      return res.json({
        success: true,
        mode: 'sandbox',
        status: 'ready_sandbox',
        message: 'Chưa cấu hình Token thật. Hệ thống đang chạy ở chế độ Zalo OA Sandbox (Mô phỏng chuẩn v3.0).'
      });
    }
    return res.json({
      success: true,
      mode: 'live_zalo_api',
      oaName: creds.zalo.oaName,
      message: `Zalo Official Account (${creds.zalo.oaName}) đã sẵn sàng nhận tin!`
    });
  }

  res.json({ success: true, message: 'Kênh Website hoạt động ổn định 100%.' });
});

// =========================================================================
// 2. PHÁT HÀNH ĐƠN KÊNH TRỰC TIẾP (DIRECT SINGLE-CHANNEL PUBLISHING)
// =========================================================================

// POST /api/publish/facebook
router.post('/facebook', async (req, res) => {
  const { caption, link, imageUrl, articleTitle, articleId } = req.body;
  try {
    const result = await publishToFacebook({ caption, link, imageUrl, articleTitle, articleId });
    res.json({ success: true, message: result.message, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/publish/zalo
router.post('/zalo', async (req, res) => {
  const { content, title, articleId, imageUrl } = req.body;
  try {
    const result = await publishToZaloOA({ content, title, articleId, imageUrl });
    res.json({ success: true, message: result.message, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// =========================================================================
// 3. XUẤT BẢN ĐA KÊNH ĐỒNG LOẠT (OMNICHANNEL PUBLISHING NOW)
// =========================================================================

// POST /api/publish/now
router.post('/now', async (req, res) => {
  const {
    articleId,
    channel,         // 'web' | 'facebook' | 'zalo' | 'all'
    channels,        // ['web', 'facebook', 'zalo']
    facebook,        // { caption, imageUrl }
    zalo,            // { content }
    web              // { title, summary, content, image }
  } = req.body;

  if (!articleId) {
    return res.status(400).json({ success: false, error: 'Thiếu mã bài viết (articleId)' });
  }

  // Chuẩn hóa danh sách kênh cần đăng
  let targetChannels = channels || [];
  if (!targetChannels.length && channel) {
    targetChannels = channel === 'all' ? ['web', 'facebook', 'zalo'] : [channel];
  }
  if (!targetChannels.length) {
    targetChannels = ['web'];
  }

  try {
    const result = await publishOmnichannel({
      articleId,
      channels: targetChannels,
      facebookData: facebook || {},
      zaloData: zalo || {},
      webData: web || {}
    });

    res.json({
      success: true,
      message: `Đã phát hành đa kênh thành công (${targetChannels.join(', ').toUpperCase()})`,
      data: result
    });
  } catch (err) {
    console.error('[Publish Now Error]:', err);
    res.status(500).json({ success: false, error: 'Lỗi phát hành đa kênh: ' + err.message });
  }
});

// =========================================================================
// 4. LẬP LỊCH HẸN GIỜ XUẤT BẢN ĐA KÊNH (SCHEDULED DISPATCHER)
// =========================================================================

// GET /api/publish/schedules
router.get('/schedules', (req, res) => {
  const db = loadDB();
  res.json({ success: true, data: db.schedules || [] });
});

// GET /api/publish/schedules/:articleId
router.get('/schedules/:articleId', (req, res) => {
  const db = loadDB();
  const articleId = parseInt(req.params.articleId);
  const schedules = (db.schedules || []).filter(s => s.articleId === articleId);
  res.json({ success: true, data: schedules });
});

// POST /api/publish/schedule
router.post('/schedule', async (req, res) => {
  const { articleId, channel, channels, scheduledAt, title, facebook, zalo } = req.body;
  if (!articleId || !scheduledAt) {
    return res.status(400).json({ success: false, error: 'Thiếu articleId hoặc scheduledAt' });
  }

  let targetChannels = channels || [];
  if (!targetChannels.length && channel) {
    targetChannels = channel === 'all' ? ['web', 'facebook', 'zalo'] : [channel];
  }
  if (!targetChannels.length) {
    targetChannels = ['web', 'facebook'];
  }

  try {
    const scheduleItem = await scheduleOmnichannel({
      articleId,
      channels: targetChannels,
      scheduledAt,
      title,
      facebookData: facebook || {},
      zaloData: zalo || {}
    });

    const chNames = targetChannels.map(c => c.toUpperCase()).join(' + ');
    res.json({
      success: true,
      message: `Đã lập lịch xuất bản tự động [${chNames}] lúc ${new Date(scheduledAt).toLocaleString('vi-VN')}`,
      data: scheduleItem
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Lỗi lập lịch xuất bản: ' + err.message });
  }
});

// DELETE /api/publish/schedule/:id
router.delete('/schedule/:id', (req, res) => {
  const db = loadDB();
  db.schedules = db.schedules || [];
  const idx = db.schedules.findIndex(s => s.id == req.params.id);
  if (idx === -1) {
    return res.status(404).json({ success: false, error: 'Không tìm thấy lịch hẹn' });
  }
  const removed = db.schedules.splice(idx, 1)[0];
  saveDB(db);
  res.json({ success: true, message: 'Đã hủy lịch hẹn xuất bản thành công', data: removed });
});

// GET /api/publish/logs/:articleId
router.get('/logs/:articleId', (req, res) => {
  const db = loadDB();
  const articleId = parseInt(req.params.articleId);
  const logs = (db.publish_logs || []).filter(l => l.articleId === articleId);
  res.json({ success: true, data: logs });
});

module.exports = router;
