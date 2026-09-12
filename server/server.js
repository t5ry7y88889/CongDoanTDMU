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
const publishRoutes = require('./routes/publish.routes');
const templatesRoutes = require('./routes/templates.routes');

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
// Static Assets Priority:
// 1. Uploads directory (user-uploaded documents, templates, images)
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// 2. React Production SPA (Primary client-facing bundle)
app.use(express.static(path.join(__dirname, '../frontend/dist'), {
  etag: false,
  maxAge: 0
}));

// 3. Fallback static directory for Admin CMS & legacy assets
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

// Publish & Scheduling
app.use('/api/publish', publishRoutes);
app.use('/api/templates', templatesRoutes);

// Backward Compatibility Route Aliases
app.post('/api/generate-article', (req, res, next) => {
  req.url = '/package-stream';
  aiRoutes(req, res, next);
});

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


// SPA Fallback Handler for React Router
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.includes('.')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// Server Bootstrap
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Website Truyền Thông Công Đoàn TDMU Real SaaS Engine`);
  console.log(`🌐 Public Portal: http://localhost:${PORT}`);
  console.log(`⚙️  Admin CMS Portal: http://localhost:${PORT}/admin.html`);
  console.log(`====================================================`);
});

module.exports = app;
