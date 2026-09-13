require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const app = require('./app');
const { loadDB, saveDB } = require('./db');

const PORT = process.env.PORT || 3000;

// =========================================================================
// BACKGROUND CRON JOBS (AUTO-PUBLISH & AUTO-RELEASE IDLE LOCKS)
// =========================================================================
setInterval(() => {
  const db = loadDB();
  const now = new Date();
  let changed = false;

  (db.articles || []).forEach(art => {
    // 1. Auto Publish Worker
    if (art.status === 'scheduled' && art.scheduledAt) {
      const scheduledTime = new Date(art.scheduledAt);
      if (scheduledTime <= now) {
        console.log(`[Cron] Executing Auto-Publish for Package #${art.id}...`);
        const isSuccess = Math.random() > 0.1;
        if (isSuccess) {
          art.status = 'published';
          art.statusName = 'Đã Xuất Bản';
          console.log(`[Cron] Successfully published Package #${art.id}`);
        } else {
          art.status = 'publish_failed';
          art.statusName = 'Lỗi Đăng Bài';
          console.error(`[Cron] Failed to publish Package #${art.id}`);
        }
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

  if (changed) {
    saveDB(db);
  }
}, 60000);

// Server Bootstrap
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Website Truyền Thông Công Đoàn TDMU Real SaaS Engine`);
  console.log(`🛰️  Express API + Admin CMS: http://localhost:${PORT}`);
  console.log(`⚙️  Admin CMS Portal:        http://localhost:${PORT}/admin.html`);
  console.log(`🌐 React SPA (npm run dev):  http://localhost:5173`);
  console.log(`====================================================`);
});

module.exports = app;