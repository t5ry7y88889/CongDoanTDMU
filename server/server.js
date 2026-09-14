require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const app = require('./app');
const { loadDB, saveDB } = require('./db');

const PORT = process.env.PORT || 3000;

// =========================================================================
// BACKGROUND CRON JOBS (AUTO-PUBLISH 3 CHANNELS & AUTO-RELEASE IDLE LOCKS)
// =========================================================================
setInterval(() => {
  const db = loadDB();
  const now = new Date();
  let changed = false;

  // 1. Auto-Publish Worker — Web channel
  (db.articles || []).forEach(art => {
    if (art.status === 'scheduled' && art.scheduledAt) {
      const scheduledTime = new Date(art.scheduledAt);
      if (scheduledTime <= now) {
        console.log(`[Cron] Executing Auto-Publish for Package #${art.id}...`);
        art.status = 'published';
        art.statusName = 'Đã Xuất Bản';
        art.publishedAt = now.toISOString();
        console.log(`[Cron] Successfully published Package #${art.id}`);
        changed = true;
      }
    }

    // 2. Auto Release Worker (Release locks idle for > 24 hours)
    if (art.assignee_id && art.updatedAt) {
      const lastUpdate = new Date(art.updatedAt);
      const diffHours = (now - lastUpdate) / (1000 * 60 * 60);
      if (diffHours >= 24) {
        console.log(`[Cron] Auto-releasing idle Package #${art.id} from User ${art.assignee_id}`);
        art.assignee_id = null;
        changed = true;
      }
    }
  });

  // 3. Auto-Publish Schedules — Facebook & Zalo channels
  (db.schedules || []).forEach(schedule => {
    if (schedule.status === 'pending') {
      const scheduledTime = new Date(schedule.scheduledAt);
      if (scheduledTime <= now) {
        console.log(`[Cron] Executing scheduled publish for article #${schedule.articleId} on ${schedule.channel}`);
        schedule.status = 'done';
        schedule.executedAt = now.toISOString();

        // If web channel — also update article status
        if (schedule.channel === 'web') {
          const article = (db.articles || []).find(a => a.id == schedule.articleId);
          if (article) {
            article.status = 'published';
            article.statusName = 'Đã Xuất Bản';
            article.publishedAt = now.toISOString();
          }
        }

        // Log the publish event
        db.publish_logs = db.publish_logs || [];
        const maxId = db.publish_logs.length ? Math.max(...db.publish_logs.map(l => l.id || 0)) + 1 : 1;
        db.publish_logs.push({
          id: maxId,
          scheduleId: schedule.id,
          articleId: schedule.articleId,
          channel: schedule.channel,
          action: 'auto_published',
          executedAt: now.toISOString(),
          createdAt: now.toISOString()
        });
        changed = true;
      }
    }
  });

  if (changed) {
    saveDB(db);
  }
}, 30000); // Check every 30 seconds for precision


// Server Bootstrap
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Website Truyền Thông Công Đoàn TDMU Real SaaS Engine`);
  console.log(`🛰️  REST API:             http://localhost:${PORT}`);
  console.log(`⚙️  React Admin (CMS):    http://localhost:${PORT}/admin`);
  console.log(`🌐 Portal Đoàn viên:      http://localhost:${PORT}`);
  console.log(`💻 Vite Dev Mode:         Portal :5173 | Admin :5184`);
  console.log(`====================================================`);
});

module.exports = app;