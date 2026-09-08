require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const express = require('express');
const path = require('path');
const cors = require('cors');
const { loadDB, saveDB } = require('./db');
const { isMssqlConnected } = require('./mssql_db');

// Modular Route Handlers
const aiRoutes = require('./routes/ai.routes');
const articlesRoutes = require('./routes/articles.routes');
const documentsRoutes = require('./routes/documents.routes');
const welfareRoutes = require('./routes/welfare.routes');
const reportsRoutes = require('./routes/reports.routes');
const orgRoutes = require('./routes/organization.routes');
const feedbackRoutes = require('./routes/feedback.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware Configuration
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});
app.use(express.static(path.join(__dirname, '../public'), {
  etag: false,
  maxAge: 0
}));

// =========================================================================
// API ROUTER MOUNTING
// =========================================================================
app.use('/api/ai', aiRoutes);
app.use('/api/articles', articlesRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/welfare', welfareRoutes);
app.use('/api/monthly-reports', reportsRoutes);

// Core Organization, Cadres & Categories
app.use('/api', orgRoutes);

// Welfare Aliases (/api/phuc-loi, /api/don-tro-cap)
app.use('/api', welfareRoutes);

// Feedback, Bookmarks, Dossiers, Assets & Analytics
app.use('/api', feedbackRoutes);

// Backward Compatibility Route Aliases
app.post('/api/generate-article', (req, res, next) => {
  req.url = '/package-stream';
  aiRoutes(req, res, next);
});

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
  console.log(`🌐 Public Portal: http://localhost:${PORT}`);
  console.log(`⚙️  Admin CMS Portal: http://localhost:${PORT}/admin.html`);
  console.log(`====================================================`);
});

module.exports = app;
