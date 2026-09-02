const { loadDB, saveDB } = require('./db');

const serverName = process.env.DB_SERVER || 'RTX-ON\\MSSQLVESE';

const sqlConfig = {
  server: serverName.split('\\')[0] || 'localhost',
  database: process.env.DB_DATABASE || 'TDMU_TradeUnion_DB',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    instanceName: serverName.includes('\\') ? serverName.split('\\')[1] : undefined
  }
};

if (process.env.DB_USER && process.env.DB_PASSWORD) {
  sqlConfig.user = process.env.DB_USER;
  sqlConfig.password = process.env.DB_PASSWORD;
}

let mssqlPool = null;
let isMssqlConnected = false;

async function initMssqlConnection() {
  try {
    const sql = require('mssql');
    mssqlPool = await sql.connect(sqlConfig);
    isMssqlConnected = true;
    console.log(`====================================================`);
    console.log(`🟢 MICROSOFT SQL SERVER V2 LIVE CONNECTED!`);
    console.log(`🗄️ Database: ${sqlConfig.database} @ ${serverName}`);
    console.log(`====================================================`);
  } catch (err) {
    isMssqlConnected = false;
    console.log(`🟡 Operating in JSON DB Fallback mode: ${err.message}`);
  }
}

initMssqlConnection();

// 1. GET ARTICLES (WITH PROPER 3NF JOINS)
async function getArticlesFromDb(category = 'all', status = 'all', search = '') {
  if (isMssqlConnected && mssqlPool) {
    try {
      const sql = require('mssql');
      let query = `
        SELECT 
          a.id, a.title, a.slug, a.categoryId, c.name AS categoryName,
          a.authorId, u.name AS author, a.summary, a.content, a.image,
          a.status,
          CASE 
            WHEN a.status = 'published' THEN N'Đã Xuất Bản'
            WHEN a.status = 'approved' THEN N'Đã Duyệt'
            WHEN a.status = 'pending_review' THEN N'Chờ Duyệt'
            WHEN a.status = 'draft' THEN N'Bản Nháp'
            ELSE a.status
          END AS statusName,
          a.isAiGenerated, a.viewsCount, a.likesCount, a.sharesCount,
          CONVERT(VARCHAR(19), a.createdAt, 120) AS createdAt
        FROM dbo.Articles a
        INNER JOIN dbo.Categories c ON a.categoryId = c.id
        INNER JOIN dbo.Users u ON a.authorId = u.id
        WHERE 1=1
      `;
      const request = mssqlPool.request();

      if (category && category !== 'all') {
        query += " AND (c.name = @category OR c.slug = @category)";
        request.input('category', sql.NVarChar, category);
      }
      if (status && status !== 'all') {
        query += " AND a.status = @status";
        request.input('status', sql.NVarChar, status);
      }
      if (search) {
        query += " AND (a.title LIKE @search OR a.summary LIKE @search)";
        request.input('search', sql.NVarChar, `%${search}%`);
      }

      query += " ORDER BY a.id DESC";
      const result = await request.query(query);
      return result.recordset;
    } catch (err) {
      console.error("MSSQL Get Error, using JSON fallback:", err.message);
    }
  }

  const db = loadDB();
  let list = db.articles || db.tin_tuc || [];
  if (category && category !== 'all') list = list.filter(a => (a.categoryName === category || a.categoryId == category || a.ChuyenMuc === category));
  if (status && status !== 'all') {
    const sLower = status.toLowerCase();
    list = list.filter(a => {
      const artStatus = (a.status || a.TrangThai || '').toLowerCase();
      if (sLower === 'pending' || sLower === 'pending_review') {
        return artStatus.includes('pending') || artStatus.includes('cho') || artStatus.includes('chờ');
      }
      if (sLower === 'published') {
        return artStatus.includes('publish') || artStatus.includes('xuat') || artStatus.includes('xuất');
      }
      if (sLower === 'draft') {
        return artStatus.includes('draft') || artStatus.includes('nhap') || artStatus.includes('nháp');
      }
      if (sLower === 'approved') {
        return artStatus.includes('approved') || artStatus.includes('duyet') || artStatus.includes('duyệt');
      }
      return artStatus === sLower;
    });
  }
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(a => {
      const titleText = (a.title || a.TieuDe || '').toLowerCase();
      const summaryText = (a.summary || a.TomTat || '').toLowerCase();
      return titleText.includes(q) || summaryText.includes(q);
    });
  }
  return list;
}

// 2. INSERT ARTICLE (TRANSACTIONAL: ARTICLE + VERSION 1 + AUDIT)
async function insertArticleToDb(data) {
  if (isMssqlConnected && mssqlPool) {
    const sql = require('mssql');
    const transaction = new sql.Transaction(mssqlPool);
    try {
      await transaction.begin();
      const req = new sql.Request(transaction);

      const slug = (data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')) + '-' + Date.now();
      const insertArticleQuery = `
        INSERT INTO dbo.Articles (title, slug, categoryId, authorId, summary, content, image, status, isAiGenerated, createdAt, updatedAt)
        OUTPUT INSERTED.id
        VALUES (@title, @slug, @categoryId, @authorId, @summary, @content, @image, @status, @isAiGenerated, SYSDATETIME(), SYSDATETIME())
      `;
      req.input('title', sql.NVarChar, data.title);
      req.input('slug', sql.VarChar, slug);
      req.input('categoryId', sql.Int, data.categoryId || 1);
      req.input('authorId', sql.Int, data.authorId || 1);
      req.input('summary', sql.NVarChar, data.summary || data.title);
      req.input('content', sql.NVarChar, data.content || data.title);
      req.input('image', sql.NVarChar, data.image || 'images/banner.jpg');
      req.input('status', sql.NVarChar, data.status || 'pending_review');
      req.input('isAiGenerated', sql.Bit, data.isAiGenerated ? 1 : 0);

      const artRes = await req.query(insertArticleQuery);
      const newId = artRes.recordset[0].id;

      // Insert Version 1
      const reqV = new sql.Request(transaction);
      reqV.input('articleId', sql.Int, newId);
      reqV.input('versionNumber', sql.Int, 1);
      reqV.input('title', sql.NVarChar, data.title);
      reqV.input('content', sql.NVarChar, data.content || data.title);
      reqV.input('createdBy', sql.Int, data.authorId || 1);
      reqV.input('changeType', sql.NVarChar, data.isAiGenerated ? 'AI_GENERATED' : 'EDITOR_EDIT');
      reqV.input('isAiGenerated', sql.Bit, data.isAiGenerated ? 1 : 0);
      reqV.input('aiProvider', sql.NVarChar, data.isAiGenerated ? 'Google Gemini' : null);
      reqV.input('aiModel', sql.NVarChar, data.isAiGenerated ? 'gemini-2.5-flash' : null);
      reqV.input('aiPrompt', sql.NVarChar, data.aiPrompt || null);

      await reqV.query(`
        INSERT INTO dbo.ArticleVersions (articleId, versionNumber, title, content, createdBy, changeType, isAiGenerated, aiProvider, aiModel, aiPrompt)
        VALUES (@articleId, @versionNumber, @title, @content, @createdBy, @changeType, @isAiGenerated, @aiProvider, @aiModel, @aiPrompt)
      `);

      // Insert Audit Trail
      const reqA = new sql.Request(transaction);
      reqA.input('articleId', sql.Int, newId);
      reqA.input('userId', sql.Int, data.authorId || 1);
      reqA.input('action', sql.NVarChar, 'CREATE_ARTICLE');
      reqA.input('details', sql.NVarChar, JSON.stringify({ title: data.title, status: data.status }));

      await reqA.query(`
        INSERT INTO dbo.Audits (articleId, userId, action, details)
        VALUES (@articleId, @userId, @action, @details)
      `);

      await transaction.commit();
      data.id = newId;
      return data;
    } catch (err) {
      await transaction.rollback();
      console.error("MSSQL Insert Transaction Failed, falling back to JSON:", err.message);
    }
  }

  // JSON fallback
  const db = loadDB();
  const maxId = (db.articles || []).reduce((max, a) => Math.max(max, parseInt(a.id) || 0), 100);
  const newId = maxId + 1;
  data.id = newId;
  data.createdAt = new Date().toISOString().replace('T', ' ').slice(0, 16);
  data.versions = [{
    versionNumber: 1,
    timestamp: data.createdAt,
    title: data.title,
    content: data.content,
    changeType: data.isAiGenerated ? 'AI_GENERATED' : 'EDITOR_EDIT',
    isAiGenerated: !!data.isAiGenerated,
    aiProvider: data.isAiGenerated ? 'Google Gemini' : null,
    aiModel: data.isAiGenerated ? 'gemini-2.5-flash' : null,
    aiPrompt: data.aiPrompt || null
  }];
  db.articles.unshift(data);
  saveDB(db);
  return data;
}

// 3. UPDATE ARTICLE (TRANSACTIONAL: ARTICLE + NEXT VERSION + AUDIT)
async function updateArticleInDb(id, data) {
  if (isMssqlConnected && mssqlPool) {
    const sql = require('mssql');
    const transaction = new sql.Transaction(mssqlPool);
    try {
      await transaction.begin();
      const req = new sql.Request(transaction);
      req.input('id', sql.Int, id);
      req.input('title', sql.NVarChar, data.title);
      req.input('summary', sql.NVarChar, data.summary);
      req.input('content', sql.NVarChar, data.content);
      req.input('image', sql.NVarChar, data.image || 'images/banner.jpg');
      req.input('status', sql.NVarChar, data.status || 'published');

      await req.query(`
        UPDATE dbo.Articles
        SET title = COALESCE(@title, title),
            summary = COALESCE(@summary, summary),
            content = COALESCE(@content, content),
            image = COALESCE(@image, image),
            status = COALESCE(@status, status),
            updatedAt = SYSDATETIME()
        WHERE id = @id
      `);

      // Get current version count
      const reqCount = new sql.Request(transaction);
      reqCount.input('articleId', sql.Int, id);
      const countRes = await reqCount.query(`SELECT COUNT(*) AS total FROM dbo.ArticleVersions WHERE articleId = @articleId`);
      const nextVer = (countRes.recordset[0].total || 0) + 1;

      // Insert Next Version
      const reqV = new sql.Request(transaction);
      reqV.input('articleId', sql.Int, id);
      reqV.input('versionNumber', sql.Int, nextVer);
      reqV.input('title', sql.NVarChar, data.title);
      reqV.input('content', sql.NVarChar, data.content);
      reqV.input('createdBy', sql.Int, data.authorId || 1);
      reqV.input('changeType', sql.NVarChar, data.changeType || 'EDITOR_EDIT');
      reqV.input('isAiGenerated', sql.Bit, data.isAiGenerated ? 1 : 0);
      reqV.input('aiProvider', sql.NVarChar, data.aiProvider || null);
      reqV.input('aiModel', sql.NVarChar, data.aiModel || null);
      reqV.input('aiPrompt', sql.NVarChar, data.aiPrompt || null);

      await reqV.query(`
        INSERT INTO dbo.ArticleVersions (articleId, versionNumber, title, content, createdBy, changeType, isAiGenerated, aiProvider, aiModel, aiPrompt)
        VALUES (@articleId, @versionNumber, @title, @content, @createdBy, @changeType, @isAiGenerated, @aiProvider, @aiModel, @aiPrompt)
      `);

      // Insert Audit
      const reqA = new sql.Request(transaction);
      reqA.input('articleId', sql.Int, id);
      reqA.input('userId', sql.Int, data.authorId || 1);
      reqA.input('action', sql.NVarChar, 'UPDATE_ARTICLE');
      reqA.input('details', sql.NVarChar, JSON.stringify({ version: nextVer, title: data.title, status: data.status }));

      await reqA.query(`
        INSERT INTO dbo.Audits (articleId, userId, action, details)
        VALUES (@articleId, @userId, @action, @details)
      `);

      await transaction.commit();
      return true;
    } catch (err) {
      await transaction.rollback();
      console.error("MSSQL Update Transaction Failed:", err.message);
    }
  }

  // JSON fallback
  const db = loadDB();
  const idx = db.articles.findIndex(a => a.id == id);
  if (idx !== -1) {
    const art = db.articles[idx];
    if (data.title) art.title = data.title;
    if (data.summary) art.summary = data.summary;
    if (data.content) art.content = data.content;
    if (data.image) art.image = data.image;
    if (data.status) {
      art.status = data.status;
      art.statusName = data.status === 'published' ? 'Đã Xuất Bản' : (data.status === 'approved' ? 'Đã Duyệt' : 'Chờ Duyệt');
    }
    if (!art.versions) art.versions = [];
    art.versions.unshift({
      versionNumber: art.versions.length + 1,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      title: art.title,
      content: art.content,
      changeType: data.changeType || 'EDITOR_EDIT',
      isAiGenerated: !!data.isAiGenerated,
      aiProvider: data.aiProvider || null,
      aiModel: data.aiModel || null,
      aiPrompt: data.aiPrompt || null
    });
    db.articles[idx] = art;
    saveDB(db);
  }
  return true;
}

// 4. DELETE ARTICLE (TRANSACTIONAL: ARTICLE CASCADE + AUDIT)
async function deleteArticleFromDb(id) {
  if (isMssqlConnected && mssqlPool) {
    const sql = require('mssql');
    const transaction = new sql.Transaction(mssqlPool);
    try {
      await transaction.begin();
      const reqA = new sql.Request(transaction);
      reqA.input('userId', sql.Int, 1);
      reqA.input('action', sql.NVarChar, 'DELETE_ARTICLE');
      reqA.input('details', sql.NVarChar, `Đã xóa bài viết ID #${id}`);

      await reqA.query(`
        INSERT INTO dbo.Audits (articleId, userId, action, details)
        VALUES (NULL, @userId, @action, @details)
      `);

      const reqD = new sql.Request(transaction);
      reqD.input('id', sql.Int, id);
      await reqD.query(`DELETE FROM dbo.Articles WHERE id = @id`);

      await transaction.commit();
      return true;
    } catch (err) {
      await transaction.rollback();
      console.error("MSSQL Delete Failed:", err.message);
    }
  }

  const db = loadDB();
  db.articles = db.articles.filter(a => a.id != id);
  saveDB(db);
  return true;
}

module.exports = {
  sqlConfig,
  isMssqlConnected: () => isMssqlConnected,
  getArticlesFromDb,
  insertArticleToDb,
  updateArticleInDb,
  deleteArticleFromDb
};
