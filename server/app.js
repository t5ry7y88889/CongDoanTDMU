const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { pinoHttp } = require('pino-http');
const logger = require('./logger');

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

// Middleware Configuration
app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url.startsWith('/assets/') } }));
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// Admin CMS (static vanilla JS portal): admin.html + bao-cao-thang.html + assets
app.use(express.static(path.join(__dirname, '../public'), {
  etag: false,
  maxAge: 0
}));

// User-uploaded files (welfare proofs, documents, docx-extracted images, templates)
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

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

// Unmatched /api routes -> JSON 404
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, error: 'API endpoint không tồn tại' });
});

// =========================================================================
// REACT SPA (user-facing portal) - built output served in production
// =========================================================================
const distDir = path.join(__dirname, '../frontend/dist');
const distIndex = path.join(distDir, 'index.html');
const hasDist = fs.existsSync(distIndex);

if (hasDist) {
  app.use(express.static(distDir, { etag: false, maxAge: 0 }));
}

// SPA history fallback: any non-API GET serves the React index.html
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  if (hasDist) return res.sendFile(distIndex);
  res.status(404).json({
    success: false,
    error: 'Frontend chưa được build. Chạy "npm run build" hoặc dùng "npm run dev" (Vite :5173).'
  });
});

module.exports = app;