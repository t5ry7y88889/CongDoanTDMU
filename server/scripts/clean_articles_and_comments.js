const fs = require('fs');
const path = require('path');
const sql = require('mssql');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const dbPath = path.join(__dirname, '../database.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

console.log('--- 1. Cleaning database.json ---');
console.log('Old articles count:', db.articles ? db.articles.length : 0);
console.log('Old comments count:', db.comments ? db.comments.length : 0);

// Keep ONLY the real news articles from the beginning (IDs 1 to 90 with rich content > 150 chars)
const cleanedArticles = (db.articles || [])
  .filter(a => a.id <= 90 && a.content && a.content.trim().length > 150)
  .map(a => {
    // Reset any comment counts and author fallback
    a.commentsCount = 0;
    a.comments = [];
    if (!a.author || a.author === 'Cán Bộ Công Đoàn') {
      a.author = 'Ban Thường Vụ Công Đoàn';
    }
    return a;
  });

// Sort by publishedAt DESC, then by id ASC (newest first)
cleanedArticles.sort((a, b) => {
  const dateA = new Date(a.publishedAt || a.createdAt || 0);
  const dateB = new Date(b.publishedAt || b.createdAt || 0);
  if (dateB - dateA !== 0) return dateB - dateA;
  return a.id - b.id;
});

db.articles = cleanedArticles;
db.comments = []; // Xóa hết bình luận

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
console.log(`✅ Saved database.json: ${db.articles.length} real news articles, 0 comments.`);

// --- 2. Clean MSSQL ---
const sqlConfig = {
  server: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '56205'),
  database: process.env.DB_DATABASE || 'TDMU_TradeUnion_DB',
  user: process.env.DB_USER || 'node_app',
  password: process.env.DB_PASSWORD || 'TDMUNode@2026',
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

async function cleanMssql() {
  console.log('\n--- 2. Cleaning Microsoft SQL Server ---');
  try {
    const pool = await sql.connect(sqlConfig);
    console.log('Connected to MSSQL.');

    // 1. Delete all comments
    try {
      await pool.request().query('DELETE FROM dbo.COMMENTS');
      console.log('✅ Cleared all rows in dbo.COMMENTS.');
    } catch (e) {
      console.log('Note on COMMENTS table:', e.message);
    }

    // 2. Delete non-news or empty articles (ArticleId > 90 or NoiDung < 150 chars)
    try {
      await pool.request().query('DELETE FROM dbo.ARTICLE_AUDITS WHERE ArticleId > 90');
      await pool.request().query('DELETE FROM dbo.SCHEDULES WHERE ArticleId > 90');
      await pool.request().query('DELETE FROM dbo.BOOKMARKS WHERE ArticleId > 90');
      const delRes = await pool.request().query(`
        DELETE FROM dbo.ARTICLES 
        WHERE ArticleId > 90 OR NoiDung IS NULL OR LEN(NoiDung) < 150
      `);
      console.log(`✅ Deleted meaningless articles from dbo.ARTICLES (rows affected: ${delRes.rowsAffected}).`);

      const countRes = await pool.request().query('SELECT COUNT(*) as cnt FROM dbo.ARTICLES');
      console.log(`Total remaining real articles in MSSQL: ${countRes.recordset[0].cnt}`);
    } catch (e) {
      console.error('Error cleaning dbo.ARTICLES:', e.message);
    }

    await pool.close();
  } catch (err) {
    console.error('MSSQL connection failed:', err.message);
  }
}

cleanMssql().then(() => {
  console.log('\n--- FIRST 5 REMAINING ARTICLES ---');
  cleanedArticles.slice(0, 5).forEach((a, i) => {
    console.log(`${i + 1}. [ID ${a.id}] ${a.title} | ${a.publishedAt} | ${a.image.slice(0, 45)}`);
  });
});
