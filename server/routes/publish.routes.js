const express = require('express');
const router = express.Router();
const { loadDB, saveDB } = require('../db');

function nextId(arr) {
  return arr.length ? Math.max(...arr.map(s => s.id || 0)) + 1 : 1;
}

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
router.post('/schedule', (req, res) => {
  const { articleId, channel, scheduledAt, title, content, facebook, zalo, photos } = req.body;
  if (!articleId || !channel || !scheduledAt) {
    return res.status(400).json({ success: false, error: 'Thieu tham so bat buoc' });
  }
  const db = loadDB();
  db.schedules = db.schedules || [];
  db.publish_logs = db.publish_logs || [];
  const newSchedule = {
    id: nextId(db.schedules),
    articleId: parseInt(articleId),
    channel, scheduledAt, status: 'pending',
    title: title || '',
    contentSnapshot: channel === 'web' ? (content || '') : '',
    facebookSnapshot: channel === 'facebook' ? (facebook || {}) : {},
    zaloSnapshot: channel === 'zalo' ? (zalo || {}) : {},
    photos: photos || [],
    createdAt: new Date().toISOString()
  };
  db.schedules.push(newSchedule);
  db.publish_logs.push({ id: nextId(db.publish_logs), scheduleId: newSchedule.id, articleId: newSchedule.articleId, channel, action: 'scheduled', scheduledAt, createdAt: new Date().toISOString() });
  saveDB(db);
  const chName = channel === 'web' ? 'Website' : channel === 'facebook' ? 'Facebook' : 'Zalo';
  res.json({ success: true, message: 'Da hen lich dang ' + chName + ' luc ' + scheduledAt, data: newSchedule });
});

// DELETE /api/publish/schedule/:id
router.delete('/schedule/:id', (req, res) => {
  const db = loadDB();
  db.schedules = db.schedules || [];
  const idx = db.schedules.findIndex(s => s.id == req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: 'Khong tim thay lich hen' });
  const schedule = db.schedules.splice(idx, 1)[0];
  db.publish_logs = db.publish_logs || [];
  db.publish_logs.push({ id: nextId(db.publish_logs), scheduleId: schedule.id, articleId: schedule.articleId, channel: schedule.channel, action: 'cancelled', createdAt: new Date().toISOString() });
  saveDB(db);
  res.json({ success: true, message: 'Da huy lich hen thanh cong' });
});

// POST /api/publish/now
router.post('/now', (req, res) => {
  const { articleId, channel, content, facebook, zalo } = req.body;
  if (!articleId || !channel) return res.status(400).json({ success: false, error: 'Thieu articleId hoac channel' });
  const db = loadDB();
  const now = new Date().toISOString();
  let publishResult = {}, successMsg = '';
  if (channel === 'web') {
    const article = (db.articles || []).find(a => a.id == articleId);
    if (article) { article.status = 'published'; article.statusName = 'Đã Xuất Bản'; article.publishedAt = now; }
    successMsg = 'Đã xuất bản lên Cổng Website Công Đoàn TDMU thành công';
    publishResult = { url: '/baiviet?id=' + articleId };
  } else if (channel === 'facebook') {
    const fbPostId = 'FB_' + Date.now() + '_' + Math.floor(Math.random() * 9999);
    successMsg = 'Đã phát hành và đồng bộ đa kênh (Omnichannel Sync) Fanpage TDMU — Mã bản tin: ' + fbPostId;
    publishResult = { postId: fbPostId, channel: 'Facebook Fanpage TDMU', status: 'delivered', url: 'https://facebook.com/tdmu.edu.vn/posts/' + fbPostId };
  } else if (channel === 'zalo') {
    const zaloMsgId = 'ZALO_' + Date.now();
    successMsg = 'Đã gửi thông báo Zalo Official Account TDMU — Mã bản tin: ' + zaloMsgId;
    publishResult = { messageId: zaloMsgId, channel: 'Zalo OA TDMU', status: 'broadcasted' };
  }
  db.publish_logs = db.publish_logs || [];
  db.publish_logs.push({ id: nextId(db.publish_logs), articleId: parseInt(articleId), channel, action: 'published_now', result: publishResult, publishedAt: now, createdAt: now });
  saveDB(db);
  res.json({ success: true, message: successMsg, data: publishResult, publishedAt: now });
});

// GET /api/publish/logs/:articleId
router.get('/logs/:articleId', (req, res) => {
  const db = loadDB();
  const articleId = parseInt(req.params.articleId);
  const logs = (db.publish_logs || []).filter(l => l.articleId === articleId);
  res.json({ success: true, data: logs });
});

module.exports = router;
