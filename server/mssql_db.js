const { loadDB, saveDB } = require('./db');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const serverName = process.env.DB_SERVER || process.env.DB_HOST || 'localhost';

const sqlConfig = {
  server: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '1433'),
  database: process.env.DB_DATABASE || 'TDMU_TradeUnion_DB',
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || 'StrongP@ssw0rd',
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

let mssqlPool = null;
let isMssqlConnected = false;

async function initMssqlConnection() {
  if (process.env.NODE_ENV === 'test') {
    isMssqlConnected = false;
    return;
  }
  try {
    const sql = require('mssql');
    mssqlPool = await sql.connect(sqlConfig);
    isMssqlConnected = true;
    console.log(`====================================================`);
    console.log(`🟢 MICROSOFT SQL SERVER V2 LIVE CONNECTED!`);
    console.log(`🗄️ Database: ${sqlConfig.database} @ ${serverName} (Port ${sqlConfig.port})`);
    console.log(`====================================================`);
  } catch (err) {
    isMssqlConnected = false;
    console.log(`🟡 Operating in JSON DB Fallback mode: ${err.message}`);
  }
}

initMssqlConnection();

// =========================================================================
// 1. ARTICLES (dbo.ARTICLES)
// =========================================================================
async function getArticlesFromDb(category = 'all', status = 'all', search = '') {
  if (isMssqlConnected && mssqlPool) {
    try {
      const sql = require('mssql');
      let query = `
        SELECT 
          a.ArticleId AS id,
          a.Title AS title,
          a.Slug AS slug,
          a.CategoryId AS categoryId,
          COALESCE(c.Name, N'Chung') AS categoryName,
          a.AuthorId AS authorId,
          COALESCE(s.FullName, u.FullName, N'Ban Thường Vụ') AS author,
          a.Summary AS summary,
          a.Content AS content,
          COALESCE(a.FeaturedImage, 'images/banner.jpg') AS image,
          a.Status AS status,
          CASE 
            WHEN a.Status = 'published' THEN N'Đã Xuất Bản'
            WHEN a.Status = 'approved' THEN N'Đã Duyệt'
            WHEN a.Status = 'pending_review' THEN N'Chờ Duyệt'
            WHEN a.Status = 'draft' THEN N'Bản Nháp'
            ELSE a.Status
          END AS statusName,
          a.IsAiGenerated AS isAiGenerated,
          a.ViewCount AS viewsCount,
          a.LikeCount AS likesCount,
          CONVERT(VARCHAR(19), a.CreatedDate, 120) AS createdAt
        FROM dbo.ARTICLES a
        LEFT JOIN dbo.CATEGORIES c ON a.CategoryId = c.CategoryId
        LEFT JOIN dbo.STAFF s ON a.AuthorId = s.StaffId
        LEFT JOIN dbo.USERS u ON u.StaffId = s.StaffId
        WHERE 1=1
      `;
      const request = mssqlPool.request();

      if (category && category !== 'all') {
        query += " AND (c.Name = @category OR c.Slug = @category OR a.CategoryId = TRY_CAST(@category AS INT))";
        request.input('category', sql.NVarChar, category);
      }
      if (status && status !== 'all') {
        query += " AND a.Status = @status";
        request.input('status', sql.NVarChar, status);
      }
      if (search) {
        query += " AND (a.Title LIKE @search OR a.Summary LIKE @search)";
        request.input('search', sql.NVarChar, `%${search}%`);
      }

      query += " ORDER BY a.ArticleId DESC";
      const result = await request.query(query);
      return result.recordset;
    } catch (err) {
      console.error("MSSQL Get Error, using JSON fallback:", err.message);
    }
  }

  const db = loadDB();
  let list = db.articles || [];
  if (category && category !== 'all') list = list.filter(a => (a.categoryName === category || a.categoryId == category));
  if (status && status !== 'all') {
    const sLower = status.toLowerCase();
    list = list.filter(a => {
      const artStatus = (a.status || '').toLowerCase();
      if (sLower === 'pending' || sLower === 'pending_review') return artStatus.includes('pending');
      if (sLower === 'published') return artStatus.includes('publish');
      if (sLower === 'draft') return artStatus.includes('draft');
      if (sLower === 'approved') return artStatus.includes('approved');
      return artStatus === sLower;
    });
  }
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(a => {
      const titleText = (a.title || '').toLowerCase();
      const summaryText = (a.summary || '').toLowerCase();
      return titleText.includes(q) || summaryText.includes(q);
    });
  }
  return list;
}

async function insertArticleToDb(data) {
  if (isMssqlConnected && mssqlPool) {
    const sql = require('mssql');
    const transaction = new sql.Transaction(mssqlPool);
    try {
      await transaction.begin();
      const req = new sql.Request(transaction);
      const slug = (data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')) + '-' + Date.now();
      const insertArticleQuery = `
        INSERT INTO dbo.ARTICLES (Title, Slug, CategoryId, AuthorId, Summary, Content, FeaturedImage, Status, IsAiGenerated, AiPrompt, CreatedDate, UpdatedDate)
        OUTPUT INSERTED.ArticleId AS id
        VALUES (@title, @slug, @categoryId, @authorId, @summary, @content, @image, @status, @isAiGenerated, @aiPrompt, SYSDATETIME(), SYSDATETIME())
      `;
      req.input('title', sql.NVarChar, data.title);
      req.input('slug', sql.VarChar, slug);
      req.input('categoryId', sql.Int, data.categoryId || 1);
      req.input('authorId', sql.Int, data.authorId || 1);
      req.input('summary', sql.NVarChar, data.summary || data.title);
      req.input('content', sql.NVarChar, data.content || data.title);
      req.input('image', sql.VarChar, data.image || 'images/banner.jpg');
      req.input('status', sql.VarChar, data.status || 'pending_review');
      req.input('isAiGenerated', sql.Bit, data.isAiGenerated ? 1 : 0);
      req.input('aiPrompt', sql.NVarChar, data.aiPrompt || null);

      const artRes = await req.query(insertArticleQuery);
      const newId = artRes.recordset[0].id;

      const reqA = new sql.Request(transaction);
      reqA.input('articleId', sql.Int, newId);
      reqA.input('userId', sql.Int, data.authorId || 1);
      reqA.input('action', sql.VarChar, 'created');
      reqA.input('notes', sql.NVarChar, `Tạo bài viết: ${data.title}`);

      await reqA.query(`
        INSERT INTO dbo.ARTICLE_AUDITS (ArticleId, UserId, Action, Note, PerformedAt)
        VALUES (@articleId, @userId, @action, @notes, SYSDATETIME())
      `);

      await transaction.commit();
      data.id = newId;
      return data;
    } catch (err) {
      await transaction.rollback();
      console.error("MSSQL Insert Error:", err.message);
    }
  }

  const db = loadDB();
  const maxId = (db.articles || []).reduce((max, a) => Math.max(max, parseInt(a.id) || 0), 100);
  data.id = maxId + 1;
  data.createdAt = new Date().toISOString().replace('T', ' ').slice(0, 16);
  db.articles.unshift(data);
  saveDB(db);
  return data;
}

async function updateArticleInDb(id, data) {
  if (isMssqlConnected && mssqlPool) {
    const sql = require('mssql');
    const transaction = new sql.Transaction(mssqlPool);
    try {
      await transaction.begin();
      const req = new sql.Request(transaction);
      req.input('id', sql.Int, id);
      req.input('title', sql.NVarChar, data.title || null);
      req.input('summary', sql.NVarChar, data.summary || null);
      req.input('content', sql.NVarChar, data.content || null);
      req.input('image', sql.VarChar, data.image || null);
      req.input('status', sql.VarChar, data.status || null);

      await req.query(`
        UPDATE dbo.ARTICLES
        SET Title = COALESCE(@title, Title),
            Summary = COALESCE(@summary, Summary),
            Content = COALESCE(@content, Content),
            FeaturedImage = COALESCE(@image, FeaturedImage),
            Status = COALESCE(@status, Status),
            UpdatedDate = SYSDATETIME()
        WHERE ArticleId = @id
      `);

      const reqA = new sql.Request(transaction);
      reqA.input('articleId', sql.Int, id);
      reqA.input('userId', sql.Int, data.authorId || 1);
      reqA.input('action', sql.VarChar, data.status === 'published' ? 'published' : 'updated');
      reqA.input('notes', sql.NVarChar, `Cập nhật bài viết ID #${id}`);

      await reqA.query(`
        INSERT INTO dbo.ARTICLE_AUDITS (ArticleId, UserId, Action, Note, PerformedAt)
        VALUES (@articleId, @userId, @action, @notes, SYSDATETIME())
      `);

      await transaction.commit();
      return true;
    } catch (err) {
      await transaction.rollback();
      console.error("MSSQL Update Error:", err.message);
    }
  }

  const db = loadDB();
  const idx = db.articles.findIndex(a => a.id == id);
  if (idx !== -1) {
    Object.assign(db.articles[idx], data);
    saveDB(db);
  }
  return true;
}

async function deleteArticleFromDb(id) {
  if (isMssqlConnected && mssqlPool) {
    const sql = require('mssql');
    const transaction = new sql.Transaction(mssqlPool);
    try {
      await transaction.begin();
      const reqA = new sql.Request(transaction);
      reqA.input('id', sql.Int, id);
      await reqA.query(`DELETE FROM dbo.ARTICLE_AUDITS WHERE ArticleId = @id`);
      await reqA.query(`DELETE FROM dbo.SCHEDULES WHERE ArticleId = @id`);
      await reqA.query(`DELETE FROM dbo.COMMENTS WHERE ArticleId = @id`);
      await reqA.query(`DELETE FROM dbo.BOOKMARKS WHERE ArticleId = @id`);

      const reqD = new sql.Request(transaction);
      reqD.input('id', sql.Int, id);
      await reqD.query(`DELETE FROM dbo.ARTICLES WHERE ArticleId = @id`);

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

// =========================================================================
// 2. DOCUMENTS (dbo.DOCUMENTS)
// =========================================================================
async function getDocumentsFromDb(category = 'all', search = '') {
  if (isMssqlConnected && mssqlPool) {
    try {
      const sql = require('mssql');
      let query = `
        SELECT 
          DocumentId AS id,
          ReferenceNumber AS reference_number,
          Title AS title,
          DocumentType AS category,
          CASE 
            WHEN DocumentType = 'tuyentruyen' THEN N'Công văn tuyên truyền'
            WHEN DocumentType = 'kehoach' THEN N'Kế hoạch hoạt động'
            WHEN DocumentType = 'luat' THEN N'Văn bản luật'
            WHEN DocumentType = 'quyetdinh' THEN N'Quyết định'
            ELSE DocumentType
          END AS category_name,
          IssuingAgency AS issuer,
          CONVERT(VARCHAR(10), IssueDate, 120) AS issued_date,
          SignerName AS signer,
          Attachment AS file_url,
          FileSize AS file_size,
          DownloadCount AS download_count,
          N'con_hieu_luc' AS validity
        FROM dbo.DOCUMENTS
        WHERE 1=1
      `;
      const req = mssqlPool.request();
      if (category && category !== 'all') {
        query += " AND DocumentType = @category";
        req.input('category', sql.VarChar, category);
      }
      if (search) {
        query += " AND (ReferenceNumber LIKE @search OR Title LIKE @search OR IssuingAgency LIKE @search)";
        req.input('search', sql.NVarChar, `%${search}%`);
      }
      query += " ORDER BY DocumentId DESC";
      const result = await req.query(query);
      return result.recordset;
    } catch (err) {
      console.error("MSSQL Documents Error:", err.message);
    }
  }

  const db = loadDB();
  let list = db.documents || [];
  if (category && category !== 'all') list = list.filter(d => d.category === category);
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(d => (d.reference_number || '').toLowerCase().includes(q) || (d.title || '').toLowerCase().includes(q));
  }
  return list;
}

// =========================================================================
// 3. CATEGORIES (dbo.CATEGORIES)
// =========================================================================
async function getCategoriesFromDb() {
  if (isMssqlConnected && mssqlPool) {
    try {
      const result = await mssqlPool.request().query(`
        SELECT CategoryId AS id, Name AS name, Slug AS slug, Description AS description
        FROM dbo.CATEGORIES
        ORDER BY DisplayOrder ASC
      `);
      return result.recordset;
    } catch (err) {
      console.error("MSSQL Categories Error:", err.message);
    }
  }
  return loadDB().categories || [];
}

// =========================================================================
// 4. ORG STRUCTURE & STAFF (dbo.ORGANIZATIONS, dbo.UNION_GROUPS, dbo.STAFF)
// =========================================================================
async function getOrgDataFromDb() {
  if (isMssqlConnected && mssqlPool) {
    try {
      const boards = (await mssqlPool.request().query("SELECT OrganizationId AS id, Name AS name, Term AS tenure, Description AS description FROM dbo.ORGANIZATIONS ORDER BY DisplayOrder")).recordset;
      const units = (await mssqlPool.request().query("SELECT UnionGroupId AS id, Code AS code, Name AS name, LeaderName AS leader, Email AS email FROM dbo.UNION_GROUPS ORDER BY UnionGroupId")).recordset;
      const cadres = (await mssqlPool.request().query("SELECT StaffId AS id, StaffCode AS code, FullName AS name, Email AS email, UnionRole AS role, UnionGroupId AS unit_id, OrganizationId AS board_id FROM dbo.STAFF")).recordset;
      return { boards, units, cadres };
    } catch (err) {
      console.error("MSSQL Org Data Error:", err.message);
    }
  }
  const db = loadDB();
  const mapBoards = (b) => ({ id: b.id ?? b.OrganizationId, name: b.name ?? b.Name, tenure: b.tenure ?? b.Term, description: b.description ?? b.Description });
  const mapUnits = (u) => ({ id: u.id ?? u.UnionGroupId, code: u.code ?? u.Code, name: u.name ?? u.Name, leader: u.leader ?? u.LeaderName, email: u.email ?? u.Email });
  const mapCadres = (c) => ({ id: c.id ?? c.StaffId, code: c.code ?? c.StaffCode, name: c.name ?? c.FullName, email: c.email ?? c.Email, role: c.role ?? c.UnionRole, unit_id: c.unit_id ?? c.UnionGroupId, board_id: c.board_id ?? c.OrganizationId });
  return {
    boards: (db.governing_boards || []).map(mapBoards),
    units: (db.trade_unions || []).map(mapUnits),
    cadres: (db.staff || []).map(mapCadres)
  };
}

// =========================================================================
// 5. MONTHLY REPORTS (dbo.MONTHLY_REPORTS)
// =========================================================================
async function getMonthlyReportsFromDb() {
  if (isMssqlConnected && mssqlPool) {
    try {
      const result = await mssqlPool.request().query(`
        SELECT 
          r.ReportId AS id,
          r.UnionGroupId AS union_id,
          tc.Code AS unit_code,
          tc.Name AS unit_name,
          tc.LeaderName AS leader_name,
          r.Month AS month,
          r.Year AS year,
          r.TotalStaff AS total_staff,
          r.TotalMembers AS total_members,
          r.TotalFemaleMembers AS female_members,
          r.NewMembers AS new_members,
          r.MembersJoiningParty AS members_joining_party,
          r.MembersSupported AS members_supported,
          r.TotalSupportAmount AS total_support_amount,
          r.PropagandaContent AS propaganda_content,
          r.OtherActivities AS other_activities,
          r.NextMonthPlan AS next_month_plan,
          r.Recommendations AS recommendations,
          r.EvidenceLink AS evidence_link,
          r.SelfAssessment AS self_assessment,
          r.BoardRating AS board_rating,
          r.Status AS status,
          CASE WHEN r.Status IN ('Submitted', 'approved', 'Đã duyệt', 'Đã nộp') THEN N'Đã nộp' ELSE N'Chưa nộp' END AS status_label,
          CONVERT(VARCHAR(19), r.SubmittedDate, 120) AS submitted_at
        FROM dbo.MONTHLY_REPORTS r
        LEFT JOIN dbo.UNION_GROUPS tc ON r.UnionGroupId = tc.UnionGroupId
        ORDER BY r.ReportId DESC
      `);
      return result.recordset;
    } catch (err) {
      console.error("MSSQL Reports Error:", err.message);
    }
  }
  return loadDB().monthly_reports || [];
}

// =========================================================================
// 6. WELFARE (dbo.BENEFITS)
// =========================================================================
async function getWelfareFromDb() {
  if (isMssqlConnected && mssqlPool) {
    try {
      const result = await mssqlPool.request().query(`
        SELECT 
          BenefitId AS id, 
          Code AS code, 
          Title AS title, 
          Category AS category,
          EligibleSubjects AS target_audience,
          SupportAmount AS budget_range,
          SupportAmount AS amount,
          Description AS description, 
          Icon AS icon,
          CASE 
            WHEN Category = 'le_tet' THEN 'warning'
            WHEN Category = 'nu_cong' THEN 'danger'
            WHEN Category = 'tro_cap' THEN 'info'
            WHEN Category = 'vay_von' THEN 'success'
            ELSE 'primary'
          END AS color,
          Status AS status
        FROM dbo.BENEFITS
        ORDER BY BenefitId ASC
      `);
      return result.recordset;
    } catch (err) {
      console.error("MSSQL Welfare Error:", err.message);
    }
  }
  return loadDB().welfare_programs || [];
}

// =========================================================================
// 7. USERS (dbo.USERS)
// =========================================================================
async function getUsersFromDb() {
  if (isMssqlConnected && mssqlPool) {
    try {
      const result = await mssqlPool.request().query(`
        SELECT UserId AS id, UserId AS userId, FullName AS name, Email AS email, LOWER(Role) AS role, AvatarUrl AS avatar, NULL AS unit
        FROM dbo.USERS
        ORDER BY UserId ASC
      `);
      return result.recordset;
    } catch (err) {
      console.error("MSSQL Users Error:", err.message);
    }
  }
  return loadDB().users || [];
}

// =========================================================================
// 8. USER WRITES (dbo.COMMENTS, dbo.FEEDBACK, dbo.WELFARE_APPLICATIONS, dbo.BOOKMARKS)
// =========================================================================
async function getCommentsFromDb(articleId) {
  if (isMssqlConnected && mssqlPool) {
    try {
      const sql = require('mssql');
      const req = mssqlPool.request();
      req.input('articleId', sql.Int, articleId);
      const result = await req.query(`
        SELECT 
          c.CommentId AS id,
          c.ArticleId AS article_id,
          COALESCE(u.FullName, c.AuthorName) AS name,
          c.Email AS email,
          c.Title AS position,
          c.Content AS content,
          c.Status AS status,
          CONVERT(VARCHAR(19), c.CreatedDate, 120) AS createdAt
        FROM dbo.COMMENTS c
        LEFT JOIN dbo.USERS u ON c.UserId = u.UserId
        WHERE c.ArticleId = @articleId AND c.Status = 'approved'
        ORDER BY c.CommentId DESC
      `);
      return result.recordset;
    } catch (err) {
      console.error("MSSQL Comments Read Error:", err.message);
    }
  }
  const db = loadDB();
  return (db.comments || [])
    .filter(c => c.article_id == articleId)
    .map(c => ({
      id: c.id ?? c.CommentId,
      article_id: parseInt(articleId),
      name: c.name ?? c.AuthorName ?? 'Đoàn viên TDMU',
      email: c.email ?? c.Email ?? '',
      position: c.position ?? c.Title ?? '',
      content: c.content ?? c.text ?? c.Content ?? '',
      status: c.status ?? 'approved',
      createdAt: c.createdAt ?? c.time ?? c.CreatedDate ?? new Date().toISOString().replace('T', ' ').slice(0, 19)
    }));
}

async function insertCommentToDb(articleId, data) {
  if (isMssqlConnected && mssqlPool) {
    const sql = require('mssql');
    try {
      const req = mssqlPool.request();
      req.input('articleId', sql.Int, articleId);
      req.input('name', sql.NVarChar, data.name);
      req.input('email', sql.VarChar, data.email || null);
      req.input('position', sql.NVarChar, data.position || null);
      req.input('content', sql.NVarChar, data.content);
      const result = await req.query(`
        INSERT INTO dbo.COMMENTS (ArticleId, AuthorName, Email, Title, Content, Status, CreatedDate)
        OUTPUT INSERTED.CommentId AS id, INSERTED.AuthorName AS name, INSERTED.Email AS email, INSERTED.Title AS position, INSERTED.Content AS content, CONVERT(VARCHAR(19), INSERTED.CreatedDate, 120) AS createdAt
        VALUES (@articleId, @name, @email, @position, @content, 'approved', SYSDATETIME())
      `);
      const row = result.recordset[0];
      return {
        id: row.id,
        article_id: parseInt(articleId),
        name: row.name,
        email: row.email || '',
        position: row.position || '',
        content: row.content,
        status: 'approved',
        createdAt: row.createdAt
      };
    } catch (err) {
      console.error("MSSQL Comment Insert Error:", err.message);
    }
  }

  const db = loadDB();
  db.comments = db.comments || [];
  const newComment = {
    id: db.comments.length ? Math.max(...db.comments.map(c => c.id || 0)) + 1 : 1,
    article_id: parseInt(articleId),
    name: data.name,
    email: data.email || '',
    position: data.position || '',
    content: data.content,
    status: 'approved',
    createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19)
  };
  db.comments.push(newComment);
  saveDB(db);
  return newComment;
}

async function insertFeedbackToDb(data) {
  if (isMssqlConnected && mssqlPool) {
    const sql = require('mssql');
    try {
      const req = mssqlPool.request();
      req.input('name', sql.NVarChar, data.sender_name);
      req.input('email', sql.VarChar, data.email || '');
      req.input('phone', sql.VarChar, data.phone || null);
      req.input('unit', sql.NVarChar, data.unit || null);
      req.input('subject', sql.NVarChar, data.category || 'Góp ý chung');
      req.input('title', sql.NVarChar, data.title);
      req.input('content', sql.NVarChar, data.content);
      const result = await req.query(`
        INSERT INTO dbo.FEEDBACK (FullName, Email, Phone, Department, Topic, Subject, Content, Status, SubmittedDate)
        OUTPUT INSERTED.FeedbackId AS id, CONVERT(VARCHAR(19), INSERTED.SubmittedDate, 120) AS submitted_at
        VALUES (@name, @email, @phone, @unit, @subject, @title, @content, 'pending', SYSDATETIME())
      `);
      const row = result.recordset[0];
      return {
        id: row.id,
        sender_name: data.sender_name,
        email: data.email || '',
        phone: data.phone || '',
        unit: data.unit || 'Đoàn viên TDMU',
        category: data.category || 'Góp ý chung',
        title: data.title,
        content: data.content,
        submitted_at: row.submitted_at,
        status: 'pending',
        response: null
      };
    } catch (err) {
      console.error("MSSQL Feedback Insert Error:", err.message);
    }
  }

  const db = loadDB();
  db.inbox_feedback = db.inbox_feedback || [];
  const newFeedback = {
    id: db.inbox_feedback.length ? Math.max(...db.inbox_feedback.map(f => f.id || 0)) + 1 : 1,
    sender_name: data.sender_name,
    email: data.email || '',
    phone: data.phone || '',
    unit: data.unit || 'Đoàn viên TDMU',
    category: data.category || 'Góp ý chung',
    title: data.title,
    content: data.content,
    submitted_at: new Date().toISOString(),
    status: 'pending',
    response: null,
    resolved_by: null,
    resolved_at: null
  };
  db.inbox_feedback.unshift(newFeedback);
  saveDB(db);
  return newFeedback;
}

async function insertWelfareApplicationToDb(data) {
  if (isMssqlConnected && mssqlPool) {
    const sql = require('mssql');
    try {
      const req = mssqlPool.request();
      req.input('name', sql.NVarChar, data.full_name);
      req.input('unit', sql.NVarChar, data.unit || 'Đoàn viên TDMU');
      req.input('phone', sql.VarChar, data.phone || null);
      req.input('email', sql.VarChar, data.email || null);
      req.input('type', sql.NVarChar, data.type);
      req.input('amount', sql.Decimal(15, 2), parseFloat(data.amount_requested) || 0);
      req.input('reason', sql.NVarChar, data.reason);
      req.input('welfareId', sql.Int, data.welfareId || null);
      const result = await req.query(`
        INSERT INTO dbo.WELFARE_APPLICATIONS (ApplicantName, Department, Phone, Email, SupportType, RequestedAmount, Reason, Status, SubmittedDate, BenefitId)
        OUTPUT INSERTED.ApplicationId AS id, CONVERT(VARCHAR(19), INSERTED.SubmittedDate, 120) AS submitted_at
        VALUES (@name, @unit, @phone, @email, @type, @amount, @reason, 'pending', SYSDATETIME(), @welfareId)
      `);
      const row = result.recordset[0];
      return {
        id: row.id,
        full_name: data.full_name,
        unit: data.unit || 'Đoàn viên TDMU',
        phone: data.phone || '',
        email: data.email || '',
        type: data.type,
        amount_requested: parseFloat(data.amount_requested) || 0,
        reason: data.reason,
        submitted_at: row.submitted_at,
        status: 'pending',
        note: 'Chờ Ban Thường Vụ xét duyệt'
      };
    } catch (err) {
      console.error("MSSQL Welfare Apply Error:", err.message);
    }
  }

  const db = loadDB();
  db.don_tro_cap = db.don_tro_cap || [];
  const newApp = {
    id: db.don_tro_cap.length ? Math.max(...db.don_tro_cap.map(d => d.id || 0)) + 1 : 1,
    full_name: data.full_name,
    unit: data.unit || 'Đoàn viên TDMU',
    phone: data.phone || '',
    email: data.email || '',
    type: data.type,
    amount_requested: parseFloat(data.amount_requested) || 1000000,
    reason: data.reason,
    submitted_at: new Date().toISOString(),
    status: 'pending',
    note: 'Chờ Ban Thường Vụ xét duyệt'
  };
  db.don_tro_cap.unshift(newApp);
  saveDB(db);
  return newApp;
}

async function getBookmarksFromDb(userId) {
  if (isMssqlConnected && mssqlPool) {
    try {
      const sql = require('mssql');
      const req = mssqlPool.request();
      req.input('userKey', sql.NVarChar, userId || 'CB_001');
      const result = await req.query(`
        SELECT 
          b.BookmarkId AS id,
          b.ArticleId AS article_id,
          b.Title AS article_title,
          CONVERT(VARCHAR(19), b.SavedDate, 120) AS saved_at
        FROM dbo.BOOKMARKS b
        WHERE b.StaffCode = @userKey OR b.UserId = TRY_CAST(@userKey AS INT)
        ORDER BY b.SavedDate DESC
      `);
      return result.recordset;
    } catch (err) {
      console.error("MSSQL Bookmarks Read Error:", err.message);
    }
  }
  return null;
}

async function toggleBookmarkInDb(data) {
  if (isMssqlConnected && mssqlPool) {
    const sql = require('mssql');
    try {
      const userKey = data.user_id || 'CB_001';
      const checkReq = mssqlPool.request();
      checkReq.input('articleId', sql.Int, data.article_id);
      checkReq.input('userKey', sql.VarChar, userKey);
      const existing = await checkReq.query(`
        SELECT TOP 1 BookmarkId FROM dbo.BOOKMARKS
        WHERE ArticleId = @articleId AND (StaffCode = @userKey OR UserId = TRY_CAST(@userKey AS INT))
      `);

      if (existing.recordset.length > 0) {
        const del = mssqlPool.request();
        del.input('id', sql.Int, existing.recordset[0].BookmarkId);
        await del.query('DELETE FROM dbo.BOOKMARKS WHERE BookmarkId = @id');
        return { action: 'removed' };
      }

      const uidReq = mssqlPool.request();
      uidReq.input('userKey', sql.NVarChar, userKey);
      const userRes = await uidReq.query(`
        SELECT TOP 1 u.UserId
        FROM dbo.USERS u
        LEFT JOIN dbo.STAFF ns ON u.StaffId = ns.StaffId
        WHERE ns.StaffCode = @userKey OR u.Email = @userKey
      `);
      const userId = userRes.recordset.length ? userRes.recordset[0].UserId : null;

      const ins = mssqlPool.request();
      ins.input('userId', sql.Int, userId);
      ins.input('userKey', sql.VarChar, userKey);
      ins.input('articleId', sql.Int, data.article_id);
      ins.input('title', sql.NVarChar, data.article_title || null);
      const added = await ins.query(`
        INSERT INTO dbo.BOOKMARKS (UserId, StaffCode, ArticleId, Title, SavedDate)
        OUTPUT INSERTED.BookmarkId AS id, CONVERT(VARCHAR(19), INSERTED.SavedDate, 120) AS saved_at
        VALUES (@userId, @userKey, @articleId, @title, SYSDATETIME())
      `);
      const row = added.recordset[0];
      return {
        action: 'added',
        data: {
          id: row.id,
          user_id: userKey,
          user_name: data.user_name || 'TS. Lê Thị Kim Út',
          article_id: parseInt(data.article_id),
          article_title: data.article_title || 'Bài viết Công đoàn',
          saved_at: row.saved_at
        }
      };
    } catch (err) {
      console.error("MSSQL Bookmark Toggle Error:", err.message);
    }
  }
  return null;
}

// =========================================================================
// 9. ADMIN READ/WRITE HELPERS (SQL-FIRST, JSON FALLBACK)
// =========================================================================
async function getFeedbackFromDb() {
  if (isMssqlConnected && mssqlPool) {
    try {
      const result = await mssqlPool.request().query(`
        SELECT
          f.FeedbackId AS id,
          f.FullName AS sender_name,
          f.Email AS email,
          f.Phone AS phone,
          f.Department AS unit,
          f.Topic AS category,
          f.Subject AS title,
          f.Content AS content,
          f.Attachment AS attachment,
          f.Status AS status,
          f.Reply AS response,
          COALESCE(u.FullName, ns.FullName, N'Ban Thường Vụ') AS resolved_by,
          CONVERT(VARCHAR(19), f.SubmittedDate, 120) AS submitted_at
        FROM dbo.FEEDBACK f
        LEFT JOIN dbo.USERS u ON f.HandlerId = u.UserId
        LEFT JOIN dbo.STAFF ns ON u.StaffId = ns.StaffId
        ORDER BY f.FeedbackId DESC
      `);
      return result.recordset;
    } catch (err) {
      console.error("MSSQL Feedback Read Error:", err.message);
    }
  }
  const db = loadDB();
  const seen = new Set();
  return [...(db.inbox_feedback || []), ...(db.feedback_messages || [])].filter(f => {
    const key = f.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function updateFeedbackInDb(id, data) {
  if (isMssqlConnected && mssqlPool) {
    try {
      const sql = require('mssql');
      const req = mssqlPool.request();
      req.input('id', sql.Int, id);
      req.input('status', sql.VarChar, data.status || 'pending');
      req.input('response', sql.NVarChar, data.response || null);
      const res = await req.query(`
        UPDATE dbo.FEEDBACK
        SET Reply = @response,
            Status = @status,
            HandlerId = (SELECT TOP 1 UserId FROM dbo.USERS ORDER BY UserId)
        WHERE FeedbackId = @id;
        SELECT
          f.FeedbackId AS id,
          f.FullName AS sender_name,
          f.Email AS email,
          f.Phone AS phone,
          f.Department AS unit,
          f.Topic AS category,
          f.Subject AS title,
          f.Content AS content,
          f.Attachment AS attachment,
          f.Status AS status,
          f.Reply AS response,
          COALESCE(u.FullName, ns.FullName, N'Ban Thường Vụ') AS resolved_by,
          CONVERT(VARCHAR(19), f.SubmittedDate, 120) AS submitted_at
        FROM dbo.FEEDBACK f
        LEFT JOIN dbo.USERS u ON f.HandlerId = u.UserId
        LEFT JOIN dbo.STAFF ns ON u.StaffId = ns.StaffId
        WHERE f.FeedbackId = @id
      `);
      return res.recordset[0] || null;
    } catch (err) {
      console.error("MSSQL Feedback Update Error:", err.message);
    }
  }

  const db = loadDB();
  let target = (db.inbox_feedback || []).find(f => f.id === id);
  if (!target) target = (db.feedback_messages || []).find(f => f.id === id);
  if (!target) return null;
  if (data.status) target.status = data.status;
  if (data.response !== undefined) target.response = data.response;
  target.resolved_by = data.resolved_by || target.resolved_by;
  if (data.status === 'resolved') target.resolved_at = target.resolved_at || new Date().toISOString();
  saveDB(db);
  return target;
}

async function deleteFeedbackFromDb(id) {
  if (isMssqlConnected && mssqlPool) {
    try {
      const sql = require('mssql');
      const req = mssqlPool.request();
      req.input('id', sql.Int, id);
      const res = await req.query('DELETE FROM dbo.FEEDBACK WHERE FeedbackId = @id');
      return res.rowsAffected[0] > 0;
    } catch (err) {
      console.error("MSSQL Feedback Delete Error:", err.message);
    }
  }
  const db = loadDB();
  const idx = (db.inbox_feedback || []).findIndex(f => f.id === id);
  if (idx >= 0) {
    db.inbox_feedback.splice(idx, 1);
    saveDB(db);
    return true;
  }
  return false;
}

async function getWelfareApplicationsFromDb(status = 'all', search = '') {
  if (isMssqlConnected && mssqlPool) {
    try {
      const sql = require('mssql');
      let query = `
        SELECT
          d.ApplicationId AS id,
          d.ApplicantName AS full_name,
          d.Department AS unit,
          d.Phone AS phone,
          d.Email AS email,
          d.SupportType AS type,
          d.RequestedAmount AS amount_requested,
          d.ApprovedAmount AS amount_approved,
          d.Reason AS reason,
          d.SupportingDocument AS proof_url,
          d.Status AS status,
          d.ReviewerName AS approved_by,
          d.Note AS decision_note,
          CONVERT(VARCHAR(19), d.SubmittedDate, 120) AS submitted_at
        FROM dbo.WELFARE_APPLICATIONS d
        WHERE 1=1
      `;
      const req = mssqlPool.request();
      if (status && status !== 'all') {
        query += " AND d.Status = @status";
        req.input('status', sql.VarChar, status);
      }
      if (search) {
        query += " AND (d.ApplicantName LIKE @search OR d.Department LIKE @search OR d.SupportType LIKE @search OR d.Reason LIKE @search)";
        req.input('search', sql.NVarChar, `%${search}%`);
      }
      query += " ORDER BY d.ApplicationId DESC";
      const result = await req.query(query);
      return result.recordset;
    } catch (err) {
      console.error("MSSQL Welfare Applications Read Error:", err.message);
    }
  }
  return loadDB().don_tro_cap || [];
}

async function updateWelfareApplicationInDb(id, data) {
  if (isMssqlConnected && mssqlPool) {
    try {
      const sql = require('mssql');
      const req = mssqlPool.request();
      req.input('id', sql.Int, id);
      req.input('status', sql.VarChar, data.status || 'pending');
      req.input('amount', sql.Decimal(15, 2), data.amount_approved || null);
      req.input('note', sql.NVarChar, data.decision_note || null);
      req.input('approver', sql.NVarChar, data.approved_by || null);
      const res = await req.query(`
        UPDATE dbo.WELFARE_APPLICATIONS
        SET Status = @status,
            ApprovedAmount = @amount,
            Note = @note,
            ReviewerName = @approver
        WHERE ApplicationId = @id;
        SELECT
          ApplicationId AS id,
          ApplicantName AS full_name,
          Department AS unit,
          Phone AS phone,
          Email AS email,
          SupportType AS type,
          RequestedAmount AS amount_requested,
          ApprovedAmount AS amount_approved,
          Reason AS reason,
          SupportingDocument AS proof_url,
          Status AS status,
          ReviewerName AS approved_by,
          Note AS decision_note,
          CONVERT(VARCHAR(19), SubmittedDate, 120) AS submitted_at
        FROM dbo.WELFARE_APPLICATIONS
        WHERE ApplicationId = @id
      `);
      return res.recordset[0] || null;
    } catch (err) {
      console.error("MSSQL Welfare Application Update Error:", err.message);
    }
  }
  const db = loadDB();
  const idx = (db.don_tro_cap || []).findIndex(d => d.id === id);
  if (idx === -1) return null;
  const target = db.don_tro_cap[idx];
  if (data.status) target.status = data.status;
  if (data.amount_approved !== undefined) target.amount_approved = parseFloat(data.amount_approved);
  if (data.decision_note !== undefined) target.decision_note = data.decision_note;
  if (data.approved_by) target.approved_by = data.approved_by;
  const now = new Date().toISOString();
  if (data.status === 'approved') target.approved_at = target.approved_at || now;
  if (data.status === 'disbursed') target.disbursed_at = target.disbursed_at || now;
  saveDB(db);
  return target;
}

async function deleteWelfareApplicationFromDb(id) {
  if (isMssqlConnected && mssqlPool) {
    try {
      const sql = require('mssql');
      const req = mssqlPool.request();
      req.input('id', sql.Int, id);
      const res = await req.query('DELETE FROM dbo.WELFARE_APPLICATIONS WHERE ApplicationId = @id');
      return res.rowsAffected[0] > 0;
    } catch (err) {
      console.error("MSSQL Welfare Application Delete Error:", err.message);
    }
  }
  const db = loadDB();
  const idx = (db.don_tro_cap || []).findIndex(d => d.id === id);
  if (idx === -1) return false;
  db.don_tro_cap.splice(idx, 1);
  saveDB(db);
  return true;
}

async function getInboxCommentsFromDb() {
  if (isMssqlConnected && mssqlPool) {
    try {
      const result = await mssqlPool.request().query(`
        SELECT
          c.CommentId AS id,
          c.ArticleId AS article_id,
          a.Title AS article_title,
          COALESCE(u.FullName, c.AuthorName) AS name,
          c.Email AS email,
          c.Title AS position,
          c.Content AS content,
          c.Status AS status,
          CONVERT(VARCHAR(19), c.CreatedDate, 120) AS createdAt
        FROM dbo.COMMENTS c
        LEFT JOIN dbo.ARTICLES a ON c.ArticleId = a.ArticleId
        LEFT JOIN dbo.USERS u ON c.UserId = u.UserId
        ORDER BY c.CommentId DESC
      `);
      return result.recordset;
    } catch (err) {
      console.error("MSSQL Inbox Comments Read Error:", err.message);
    }
  }
  return loadDB().comments || [];
}

async function deleteCommentFromDb(id) {
  if (isMssqlConnected && mssqlPool) {
    try {
      const sql = require('mssql');
      const req = mssqlPool.request();
      req.input('id', sql.Int, id);
      const res = await req.query('DELETE FROM dbo.COMMENTS WHERE CommentId = @id');
      return res.rowsAffected[0] > 0;
    } catch (err) {
      console.error("MSSQL Comment Delete Error:", err.message);
    }
  }
  const db = loadDB();
  const idx = (db.comments || []).findIndex(c => c.id === id);
  if (idx === -1) return false;
  db.comments.splice(idx, 1);
  saveDB(db);
  return true;
}

const DOCUMENT_CATEGORY_LABELS = {
  'công văn tuyên truyền': 'tuyentruyen',
  'kế hoạch hoạt động': 'kehoach',
  'văn bản luật': 'luat',
  'quyết định': 'quyetdinh',
  'hướng dẫn nghiệp vụ': 'huongdan',
  'thông báo kết luận': 'thongbao'
};

function documentCategoryKey(raw) {
  if (!raw) return 'tuyentruyen';
  const val = String(raw).trim();
  const norm = val.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLowerCase();
  for (const [label, slug] of Object.entries(DOCUMENT_CATEGORY_LABELS)) {
    const ln = label.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLowerCase();
    if (ln === norm) return slug;
  }
  return val;
}

async function insertDocumentToDb(data) {
  let newDoc = null;
  if (isMssqlConnected && mssqlPool) {
    try {
      const sql = require('mssql');
      const req = mssqlPool.request();
      req.input('uploadedById', sql.Int, 1);
      req.input('referenceNumber', sql.NVarChar, data.reference_number || '');
      req.input('title', sql.NVarChar, data.title || '');
      req.input('docType', sql.NVarChar, documentCategoryKey(data.category));
      req.input('issuer', sql.NVarChar, data.issuer || 'Ban Thường Vụ Công Đoàn TDMU');
      req.input('issueDate', sql.Date, data.issued_date || new Date());
      req.input('signer', sql.NVarChar, data.signer || 'TS. Lê Thị Kim Út');
      req.input('attachment', sql.VarChar, data.file_url || data.savedFileUrl || 'uploads/documents/van_ban_default.pdf');
      req.input('fileSize', sql.VarChar, data.file_size || '1.5 MB');
      const result = await req.query(`
        INSERT INTO dbo.DOCUMENTS (UploadedById, ReferenceNumber, Title, DocumentType, IssuingAgency, IssueDate, SignerName, Attachment, FileSize)
        OUTPUT INSERTED.DocumentId AS id
        VALUES (@uploadedById, @referenceNumber, @title, @docType, @issuer, @issueDate, @signer, @attachment, @fileSize)
      `);
      const id = result.recordset[0].id;
      const rows = await getDocumentsFromDb('all', data.reference_number || '');
      newDoc = rows.find(d => d.id === id) || null;
    } catch (err) {
      console.error("MSSQL Document Insert Error:", err.message);
    }
  }
  if (newDoc) return newDoc;

  const db = loadDB();
  db.documents = db.documents || [];
  const nextId = db.documents.length > 0 ? Math.max(...db.documents.map(d => parseInt(d.id) || 0)) + 1 : 1;
  const base = {
    id: nextId,
    reference_number: data.reference_number || '',
    title: data.title || '',
    category: documentCategoryKey(data.category),
    category_name: data.category_name || '',
    issuer: data.issuer || 'Ban Thường Vụ Công Đoàn TDMU',
    issued_date: data.issued_date || new Date().toISOString().split('T')[0],
    signer: data.signer || 'TS. Lê Thị Kim Út',
    validity: data.validity || 'con_hieu_luc',
    file_url: data.savedFileUrl || data.file_url || `uploads/documents/van_ban_${nextId}.pdf`,
    file_size: data.file_size || '1.5 MB',
    download_count: 0
  };
  db.documents.unshift(base);
  saveDB(db);
  return base;
}

async function updateDocumentInDb(id, data) {
  if (isMssqlConnected && mssqlPool) {
    try {
      const sql = require('mssql');
      const req = mssqlPool.request();
      req.input('id', sql.Int, id);
      req.input('referenceNumber', sql.NVarChar, data.reference_number || null);
      req.input('title', sql.NVarChar, data.title || null);
      req.input('docType', sql.NVarChar, data.category ? documentCategoryKey(data.category) : null);
      req.input('issuer', sql.NVarChar, data.issuer || null);
      req.input('issueDate', sql.Date, data.issued_date || null);
      req.input('signer', sql.NVarChar, data.signer || null);
      req.input('attachment', sql.VarChar, data.file_url || null);
      req.input('fileSize', sql.VarChar, data.file_size || null);
      const res = await req.query(`
        UPDATE dbo.DOCUMENTS
        SET ReferenceNumber = COALESCE(@referenceNumber, ReferenceNumber),
            Title = COALESCE(@title, Title),
            DocumentType = COALESCE(@docType, DocumentType),
            IssuingAgency = COALESCE(@issuer, IssuingAgency),
            IssueDate = COALESCE(@issueDate, IssueDate),
            SignerName = COALESCE(@signer, SignerName),
            Attachment = COALESCE(@attachment, Attachment),
            FileSize = COALESCE(@fileSize, FileSize)
        WHERE DocumentId = @id
      `);
      if (res.rowsAffected[0] === 0) return null;
      const rows = await getDocumentsFromDb();
      return rows.find(d => d.id === id) || null;
    } catch (err) {
      console.error("MSSQL Document Update Error:", err.message);
    }
  }
  const db = loadDB();
  const idx = (db.documents || []).findIndex(d => d.id === id);
  if (idx === -1) return null;
  const target = db.documents[idx];
  if (data.reference_number) target.reference_number = data.reference_number.trim();
  if (data.title) target.title = data.title.trim();
  if (data.category) { target.category = documentCategoryKey(data.category); }
  if (data.issuer) target.issuer = data.issuer.trim();
  if (data.issued_date) target.issued_date = data.issued_date;
  if (data.signer) target.signer = data.signer.trim();
  if (data.validity) target.validity = data.validity;
  if (data.file_size) target.file_size = data.file_size;
  if (data.file_url) target.file_url = data.file_url;
  saveDB(db);
  return target;
}

async function deleteDocumentFromDb(id) {
  if (isMssqlConnected && mssqlPool) {
    try {
      const sql = require('mssql');
      const req = mssqlPool.request();
      req.input('id', sql.Int, id);
      const res = await req.query('DELETE FROM dbo.DOCUMENTS WHERE DocumentId = @id');
      return res.rowsAffected[0] > 0;
    } catch (err) {
      console.error("MSSQL Document Delete Error:", err.message);
    }
  }
  const db = loadDB();
  const idx = (db.documents || []).findIndex(d => d.id === id);
  if (idx === -1) return false;
  db.documents.splice(idx, 1);
  saveDB(db);
  return true;
}

async function insertMonthlyReportToDb(data) {
  let newReport = null;
  if (isMssqlConnected && mssqlPool) {
    try {
      const sql = require('mssql');
      const req = mssqlPool.request();
      const unionKey = String(data.union_id || 'TCD_01');
      req.input('unionGroupId', sql.Int, parseInt(unionKey.replace(/\D/g, '')) || 0);
      req.input('code', sql.NVarChar, unionKey);
      req.input('reporterId', sql.Int, 1);
      req.input('month', sql.Int, parseInt(data.month) || new Date().getMonth() + 1);
      req.input('year', sql.Int, parseInt(data.year) || new Date().getFullYear());
      req.input('totalStaff', sql.Int, parseInt(data.total_staff) || 0);
      req.input('totalMembers', sql.Int, parseInt(data.total_members) || 0);
      req.input('femaleMembers', sql.Int, parseInt(data.female_members) || 0);
      req.input('newMembers', sql.Int, parseInt(data.new_members) || 0);
      req.input('propagandaContent', sql.NVarChar, data.propaganda_content || null);
      req.input('otherActivities', sql.NVarChar, data.other_activities || null);
      req.input('nextMonthPlan', sql.NVarChar, data.next_month_plan || null);
      req.input('recommendations', sql.NVarChar, data.recommendations || null);
      req.input('evidenceLink', sql.VarChar, data.evidence_link || null);
      req.input('selfAssessment', sql.NVarChar, data.self_assessment || 'Hoàn thành tốt nhiệm vụ (Loại B)');
      req.input('status', sql.VarChar, data.status || 'Submitted');
      const result = await req.query(`
        INSERT INTO dbo.MONTHLY_REPORTS (UnionGroupId, ReporterId, Month, Year, TotalStaff, TotalMembers, TotalFemaleMembers, NewMembers, PropagandaContent, OtherActivities, NextMonthPlan, Recommendations, EvidenceLink, SelfAssessment, Status)
        SELECT
          COALESCE((SELECT TOP 1 UnionGroupId FROM dbo.UNION_GROUPS WHERE Code = @code OR UnionGroupId = @unionGroupId), @unionGroupId),
          @reporterId, @month, @year, @totalStaff, @totalMembers, @femaleMembers, @newMembers,
          @propagandaContent, @otherActivities, @nextMonthPlan, @recommendations, @evidenceLink, @selfAssessment, @status
      `);
      const fetchRes = await mssqlPool.request().query(`SELECT TOP 1 ReportId AS id FROM dbo.MONTHLY_REPORTS ORDER BY ReportId DESC`);
      const id = fetchRes.recordset[0]?.id;
      const rows = await getMonthlyReportsFromDb();
      newReport = rows.find(r => r.id === id) || null;
    } catch (err) {
      console.error("MSSQL Monthly Report Insert Error:", err.message);
    }
  }
  if (newReport) return newReport;

  const db = loadDB();
  db.monthly_reports = db.monthly_reports || [];
  const newId = db.monthly_reports.length > 0 ? Math.max(...db.monthly_reports.map(r => r.id || 0)) + 1 : 1;
  const base = {
    id: newId,
    union_id: data.union_id || 'TCD_01',
    unit_name: data.unit_name || 'Công đoàn cơ sở',
    month: parseInt(data.month) || new Date().getMonth() + 1,
    year: parseInt(data.year) || new Date().getFullYear(),
    total_staff: parseInt(data.total_staff) || 0,
    total_members: parseInt(data.total_members) || 0,
    female_members: parseInt(data.female_members) || 0,
    new_members: parseInt(data.new_members) || 0,
    propaganda_content: data.propaganda_content || '',
    other_activities: data.other_activities || '',
    next_month_plan: data.next_month_plan || '',
    recommendations: data.recommendations || '',
    evidence_link: data.evidence_link || '',
    self_assessment: data.self_assessment || 'Hoàn thành tốt nhiệm vụ (Loại B)',
    board_rating: data.board_rating || 'Chờ duyệt',
    status: data.status || 'Submitted',
    status_label: data.status_label || 'Đã nộp',
    submitted_at: new Date().toISOString()
  };
  db.monthly_reports.push(base);
  saveDB(db);
  return base;
}

async function insertUserToDb(data) {
  const roleMap = { 1: 'Admin', 2: 'Editor', 3: 'Contributor' };
  const role = data.role || roleMap[data.roleId] || 'Contributor';
  if (isMssqlConnected && mssqlPool) {
    const sql = require('mssql');
    try {
      const req = mssqlPool.request();
      req.input('name', sql.NVarChar, data.name || data.full_name || 'Cán bộ TDMU');
      req.input('email', sql.VarChar, (data.email || 'user@tdmu.edu.vn').toLowerCase());
      req.input('role', sql.VarChar, role);
      req.input('pass', sql.VarChar, 'TDMU@2026');
      const result = await req.query(`
        INSERT INTO dbo.USERS (FullName, Email, Role, PasswordHash, AvatarUrl)
        OUTPUT INSERTED.UserId AS id, INSERTED.FullName AS name, INSERTED.Email AS email
        VALUES (@name, @email, @role, @pass, NULL)
      `);
      const row = result.recordset[0];
      return { id: row.id, name: row.name, email: row.email, role: role.toLowerCase(), unit: data.department || 'ĐH Thủ Dầu Một' };
    } catch (err) {
      console.error("MSSQL User Insert Error:", err.message);
      return { error: 'Không thể tạo tài khoản (email có thể đã tồn tại): ' + err.message };
    }
  }
  const db = loadDB();
  db.users = db.users || [];
  const newId = db.users.length > 0 ? Math.max(...db.users.map(u => u.id || 0)) + 1 : 1;
  const newUser = { id: newId, name: data.name || 'Cán bộ TDMU', email: (data.email || 'user@tdmu.edu.vn').toLowerCase(), role: role.toLowerCase(), unit: data.department || 'ĐH Thủ Dầu Một' };
  db.users.push(newUser);
  saveDB(db);
  return newUser;
}

async function deleteUserFromDb(id) {
  if (isMssqlConnected && mssqlPool) {
    try {
      const sql = require('mssql');
      const req = mssqlPool.request();
      req.input('id', sql.Int, id);
      const res = await req.query('DELETE FROM dbo.USERS WHERE UserId = @id');
      if (res.rowsAffected[0] > 0) return true;
      return { error: 'Không tìm thấy tài khoản để xóa!' };
    } catch (err) {
      console.error("MSSQL User Delete Error (FK conflict):", err.message);
      return { error: 'Không thể xóa tài khoản do đang được sử dụng trong hệ thống.' };
    }
  }
  const db = loadDB();
  const idx = (db.users || []).findIndex(u => u.id === id);
  if (idx === -1) return false;
  db.users.splice(idx, 1);
  saveDB(db);
  return true;
}

async function getTemplatesFromDb(category = 'all', search = '') {
  if (isMssqlConnected && mssqlPool) {
    try {
      const sql = require('mssql');
      let query = `
        SELECT
          TemplateId AS id,
          Code AS code,
          Title AS title,
          Category AS category,
          COALESCE(CategoryName, N'Biểu Mẫu Nghiệp Vụ') AS categoryName,
          Description AS description,
          FileType AS file_type,
          FileSize AS file_size,
          FilePath AS file_url,
          DownloadCount AS downloads_count,
          CONVERT(VARCHAR(19), CreatedAt, 120) AS created_at
        FROM dbo.TEMPLATES
        WHERE IsActive = 1
      `;
      const req = mssqlPool.request();
      if (category && category !== 'all') {
        query += ' AND Category = @category';
        req.input('category', sql.VarChar, category);
      }
      if (search) {
        query += ' AND (Code LIKE @search OR Title LIKE @search OR Description LIKE @search)';
        req.input('search', sql.NVarChar, `%${search}%`);
      }
      query += ' ORDER BY TemplateId ASC';
      const res = await req.query(query);
      return res.recordset;
    } catch (err) {
      console.error("MSSQL Templates Error:", err.message);
    }
  }
  const db = loadDB();
  let list = db.templates || [];
  if (category && category !== 'all') list = list.filter(t => t.category === category);
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(t => (t.title || '').toLowerCase().includes(q) || (t.code || '').toLowerCase().includes(q));
  }
  return list;
}

async function insertTemplateToDb(data) {
  if (isMssqlConnected && mssqlPool) {
    try {
      const sql = require('mssql');
      const req = mssqlPool.request();
      req.input('code', sql.VarChar, data.code);
      req.input('title', sql.NVarChar, data.title);
      req.input('category', sql.VarChar, data.category || 'doan_vien');
      req.input('categoryName', sql.NVarChar, data.categoryName || 'Đoàn Viên & Gia Nhập');
      req.input('description', sql.NVarChar, data.description || '');
      req.input('fileType', sql.VarChar, data.file_type || 'docx');
      req.input('fileSize', sql.VarChar, data.file_size || '4.0 KB');
      req.input('fileUrl', sql.VarChar, data.file_url);

      const query = `
        INSERT INTO dbo.TEMPLATES (Code, Title, Category, CategoryName, Description, FileType, FileSize, FilePath, DownloadCount, IsActive, CreatedAt)
        OUTPUT INSERTED.TemplateId AS id
        VALUES (@code, @title, @category, @categoryName, @description, @fileType, @fileSize, @fileUrl, 0, 1, SYSDATETIME())
      `;
      const res = await req.query(query);
      data.id = res.recordset[0].id;
      return data;
    } catch (err) {
      console.error("MSSQL Insert Template Error:", err.message);
    }
  }
  return null;
}

async function deleteTemplateFromDb(id) {
  if (isMssqlConnected && mssqlPool) {
    try {
      const sql = require('mssql');
      const req = mssqlPool.request();
      req.input('id', sql.Int, id);
      const res = await req.query('DELETE FROM dbo.TEMPLATES WHERE TemplateId = @id');
      if (res.rowsAffected[0] > 0) return true;
      return { error: 'Không tìm thấy biểu mẫu để xóa!' };
    } catch (err) {
      console.error("MSSQL Delete Template Error:", err.message);
    }
  }
  return false;
}

async function incrementTemplateDownloadInDb(id) {
  if (isMssqlConnected && mssqlPool) {
    try {
      const sql = require('mssql');
      const req = mssqlPool.request();
      req.input('id', sql.Int, id);
      await req.query('UPDATE dbo.TEMPLATES SET DownloadCount = DownloadCount + 1 WHERE TemplateId = @id');
      return true;
    } catch (err) {
      console.error("MSSQL Increment Template Download Error:", err.message);
    }
  }
  return false;
}

module.exports = {
  sqlConfig,
  isMssqlConnected: () => isMssqlConnected,
  getArticlesFromDb,
  insertArticleToDb,
  updateArticleInDb,
  deleteArticleFromDb,
  getDocumentsFromDb,
  insertDocumentToDb,
  updateDocumentInDb,
  deleteDocumentFromDb,
  getCategoriesFromDb,
  getOrgDataFromDb,
  getMonthlyReportsFromDb,
  insertMonthlyReportToDb,
  getWelfareFromDb,
  getWelfareApplicationsFromDb,
  updateWelfareApplicationInDb,
  deleteWelfareApplicationFromDb,
  getUsersFromDb,
  insertUserToDb,
  deleteUserFromDb,
  getCommentsFromDb,
  insertCommentToDb,
  deleteCommentFromDb,
  getInboxCommentsFromDb,
  insertFeedbackToDb,
  getFeedbackFromDb,
  updateFeedbackInDb,
  deleteFeedbackFromDb,
  insertWelfareApplicationToDb,
  getBookmarksFromDb,
  toggleBookmarkInDb,
  getTemplatesFromDb,
  insertTemplateToDb,
  deleteTemplateFromDb,
  incrementTemplateDownloadInDb
};