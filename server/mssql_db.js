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
          a.TieuDe AS title,
          a.Slug AS slug,
          a.CategoryId AS categoryId,
          COALESCE(c.TenChuyenMuc, N'Chung') AS categoryName,
          a.MaTacGia AS authorId,
          COALESCE(s.HoVaTen, u.HoTen, N'Ban Thường Vụ') AS author,
          a.TomTat AS summary,
          a.NoiDung AS content,
          COALESCE(a.HinhAnhDaiDien, 'images/banner.jpg') AS image,
          a.TrangThai AS status,
          CASE 
            WHEN a.TrangThai = 'published' THEN N'Đã Xuất Bản'
            WHEN a.TrangThai = 'approved' THEN N'Đã Duyệt'
            WHEN a.TrangThai = 'pending_review' THEN N'Chờ Duyệt'
            WHEN a.TrangThai = 'draft' THEN N'Bản Nháp'
            ELSE a.TrangThai
          END AS statusName,
          a.IsAiGenerated AS isAiGenerated,
          a.LuotXem AS viewsCount,
          a.LuotThich AS likesCount,
          CONVERT(VARCHAR(19), a.NgayTao, 120) AS createdAt
        FROM dbo.ARTICLES a
        LEFT JOIN dbo.CATEGORIES c ON a.CategoryId = c.CategoryId
        LEFT JOIN dbo.NHAN_SU s ON a.MaTacGia = s.MaNhanSu
        LEFT JOIN dbo.USERS u ON u.MaNhanSu = s.MaNhanSu
        WHERE 1=1
      `;
      const request = mssqlPool.request();

      if (category && category !== 'all') {
        query += " AND (c.TenChuyenMuc = @category OR c.Slug = @category OR a.CategoryId = TRY_CAST(@category AS INT))";
        request.input('category', sql.NVarChar, category);
      }
      if (status && status !== 'all') {
        query += " AND a.TrangThai = @status";
        request.input('status', sql.NVarChar, status);
      }
      if (search) {
        query += " AND (a.TieuDe LIKE @search OR a.TomTat LIKE @search)";
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
        INSERT INTO dbo.ARTICLES (TieuDe, Slug, CategoryId, MaTacGia, TomTat, NoiDung, HinhAnhDaiDien, TrangThai, IsAiGenerated, AiPrompt, NgayTao, NgayCapNhat)
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
        INSERT INTO dbo.ARTICLE_AUDITS (ArticleId, UserId, HanhDong, GhiChu, NgayThucHien)
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
        SET TieuDe = COALESCE(@title, TieuDe),
            TomTat = COALESCE(@summary, TomTat),
            NoiDung = COALESCE(@content, NoiDung),
            HinhAnhDaiDien = COALESCE(@image, HinhAnhDaiDien),
            TrangThai = COALESCE(@status, TrangThai),
            NgayCapNhat = SYSDATETIME()
        WHERE ArticleId = @id
      `);

      const reqA = new sql.Request(transaction);
      reqA.input('articleId', sql.Int, id);
      reqA.input('userId', sql.Int, data.authorId || 1);
      reqA.input('action', sql.VarChar, data.status === 'published' ? 'published' : 'updated');
      reqA.input('notes', sql.NVarChar, `Cập nhật bài viết ID #${id}`);

      await reqA.query(`
        INSERT INTO dbo.ARTICLE_AUDITS (ArticleId, UserId, HanhDong, GhiChu, NgayThucHien)
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
          SoHieuVanBan AS reference_number,
          TenVanBan AS title,
          LoaiVanBan AS category,
          CASE 
            WHEN LoaiVanBan = 'tuyentruyen' THEN N'Công văn tuyên truyền'
            WHEN LoaiVanBan = 'kehoach' THEN N'Kế hoạch hoạt động'
            WHEN LoaiVanBan = 'luat' THEN N'Văn bản luật'
            WHEN LoaiVanBan = 'quyetdinh' THEN N'Quyết định'
            ELSE LoaiVanBan
          END AS category_name,
          CoQuanBanHanh AS issuer,
          CONVERT(VARCHAR(10), NgayBanHanh, 120) AS issued_date,
          NguoiKy AS signer,
          TepDinhKem AS file_url,
          DungLuong AS file_size,
          LuotTai AS download_count
        FROM dbo.DOCUMENTS
        WHERE 1=1
      `;
      const req = mssqlPool.request();
      if (category && category !== 'all') {
        query += " AND LoaiVanBan = @category";
        req.input('category', sql.VarChar, category);
      }
      if (search) {
        query += " AND (SoHieuVanBan LIKE @search OR TenVanBan LIKE @search OR CoQuanBanHanh LIKE @search)";
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
        SELECT CategoryId AS id, TenChuyenMuc AS name, Slug AS slug, MoTa AS description
        FROM dbo.CATEGORIES
        ORDER BY ThuTu ASC
      `);
      return result.recordset;
    } catch (err) {
      console.error("MSSQL Categories Error:", err.message);
    }
  }
  return loadDB().categories || [];
}

// =========================================================================
// 4. ORG STRUCTURE & STAFF (dbo.TO_CHUC, dbo.TO_CONG_DOAN, dbo.NHAN_SU)
// =========================================================================
async function getOrgDataFromDb() {
  if (isMssqlConnected && mssqlPool) {
    try {
      const boards = (await mssqlPool.request().query("SELECT MaToChuc AS id, TenToChuc AS name, NhiemKy AS tenure, MoTaChucNang AS description FROM dbo.TO_CHUC ORDER BY ThuTuHienThi")).recordset;
      const units = (await mssqlPool.request().query("SELECT MaToCongDoan AS id, MaDinhDanh AS code, TenToCongDoan AS name, ToTruong AS leader, EmailLienHe AS email FROM dbo.TO_CONG_DOAN ORDER BY MaToCongDoan")).recordset;
      const cadres = (await mssqlPool.request().query("SELECT MaNhanSu AS id, MaCanBo AS code, HoVaTen AS name, Email AS email, ChucVuCongDoan AS role, MaToCongDoan AS unit_id, MaToChuc AS board_id FROM dbo.NHAN_SU")).recordset;
      return { boards, units, cadres };
    } catch (err) {
      console.error("MSSQL Org Data Error:", err.message);
    }
  }
  const db = loadDB();
  return { boards: db.governing_boards || [], units: db.trade_unions || [], cadres: db.staff || [] };
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
          r.MaToCongDoan AS union_id,
          tc.TenToCongDoan AS unit_name,
          r.ThangBaoCao AS month,
          r.NamBaoCao AS year,
          r.TongSoCBNV AS total_staff,
          r.TongSoDoanVien AS total_members,
          r.TongSoNuDoanVien AS female_members,
          r.TuDanhGia AS self_rank,
          r.BtvXepLoai AS btv_rank,
          r.TrangThai AS status,
          r.LinkMinhChung AS proof_link,
          CONVERT(VARCHAR(19), r.NgayNop, 120) AS submitted_at
        FROM dbo.MONTHLY_REPORTS r
        LEFT JOIN dbo.TO_CONG_DOAN tc ON r.MaToCongDoan = tc.MaToCongDoan
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
// 6. WELFARE (dbo.PHUC_LOI)
// =========================================================================
async function getWelfareFromDb() {
  if (isMssqlConnected && mssqlPool) {
    try {
      const result = await mssqlPool.request().query(`
        SELECT 
          PhucLoiId AS id, 
          MaPhucLoi AS code, 
          TieuDe AS title, 
          ChuyenMuc AS category,
          DoiTuongHuong AS target,
          DoiTuongHuong AS target_audience,
          DoiTuongHuong AS DoiTuongHuong,
          MucHoTro AS budget_range,
          MucHoTro AS amount,
          MucHoTro AS MucHoTro,
          MoTa AS description, 
          Icon AS icon,
          CASE 
            WHEN ChuyenMuc = 'le_tet' THEN 'warning'
            WHEN ChuyenMuc = 'nu_cong' THEN 'danger'
            WHEN ChuyenMuc = 'tro_cap' THEN 'info'
            WHEN ChuyenMuc = 'vay_von' THEN 'success'
            ELSE 'primary'
          END AS color,
          TrangThai AS status
        FROM dbo.PHUC_LOI
        ORDER BY PhucLoiId ASC
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
        SELECT UserId AS id, HoTen AS name, Email AS email, VaiTro AS role, AvatarUrl AS avatar
        FROM dbo.USERS
      `);
      return result.recordset;
    } catch (err) {
      console.error("MSSQL Users Error:", err.message);
    }
  }
  return loadDB().users || [];
}

// =========================================================================
// 8. USER WRITES (dbo.COMMENTS, dbo.INBOX_FEEDBACK, dbo.DON_TRO_CAP, dbo.BOOKMARKS)
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
          COALESCE(u.HoTen, c.HoTen) AS name,
          c.Email AS email,
          c.ChucVu AS position,
          c.NoiDung AS content,
          c.TrangThai AS status,
          CONVERT(VARCHAR(19), c.NgayTao, 120) AS createdAt
        FROM dbo.COMMENTS c
        LEFT JOIN dbo.USERS u ON c.UserId = u.UserId
        WHERE c.ArticleId = @articleId AND c.TrangThai = 'approved'
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
      name: c.name ?? c.HoTen ?? 'Đoàn viên TDMU',
      email: c.email ?? c.Email ?? '',
      position: c.position ?? c.ChucVu ?? '',
      content: c.content ?? c.text ?? c.NoiDung ?? '',
      status: c.status ?? 'approved',
      createdAt: c.createdAt ?? c.time ?? c.NgayTao ?? new Date().toISOString().replace('T', ' ').slice(0, 19)
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
        INSERT INTO dbo.COMMENTS (ArticleId, HoTen, Email, ChucVu, NoiDung, TrangThai, NgayTao)
        OUTPUT INSERTED.CommentId AS id, INSERTED.HoTen AS name, INSERTED.Email AS email, INSERTED.ChucVu AS position, INSERTED.NoiDung AS content, CONVERT(VARCHAR(19), INSERTED.NgayTao, 120) AS createdAt
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
        INSERT INTO dbo.INBOX_FEEDBACK (HoTen, Email, SoDienThoai, DonVi, ChuDe, TieuDe, NoiDung, TrangThai, NgayGui)
        OUTPUT INSERTED.FeedbackId AS id, CONVERT(VARCHAR(19), INSERTED.NgayGui, 120) AS submitted_at
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
  db.feedback_messages = db.feedback_messages || [];
  const newFeedback = {
    id: db.feedback_messages.length ? Math.max(...db.feedback_messages.map(f => f.id || 0)) + 1 : 1,
    sender_name: data.sender_name,
    email: data.email || '',
    phone: data.phone || '',
    unit: data.unit || 'Đoàn viên TDMU',
    category: data.category || 'Góp ý chung',
    title: data.title,
    content: data.content,
    submitted_at: new Date().toISOString(),
    status: 'pending',
    response: null
  };
  db.feedback_messages.push(newFeedback);
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
      req.input('type', sql.NVarChar, data.type);
      req.input('amount', sql.Decimal(15, 2), parseFloat(data.amount_requested) || 0);
      req.input('reason', sql.NVarChar, data.reason);
      req.input('welfareId', sql.Int, data.welfareId || null);
      const result = await req.query(`
        INSERT INTO dbo.DON_TRO_CAP (HoTen, DonVi, LoaiTroCap, SoTienDeXuat, LyDo, TrangThai, NgayNop, PhucLoiId)
        OUTPUT INSERTED.DonId AS id, CONVERT(VARCHAR(19), INSERTED.NgayNop, 120) AS submitted_at
        VALUES (@name, @unit, @type, @amount, @reason, 'pending', SYSDATETIME(), @welfareId)
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
  db.assistance_applications = db.assistance_applications || [];
  const newApp = {
    id: db.assistance_applications.length ? Math.max(...db.assistance_applications.map(d => d.id || 0)) + 1 : 1,
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
  db.assistance_applications.push(newApp);
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
          b.TieuDe AS article_title,
          CONVERT(VARCHAR(19), b.NgayLuu, 120) AS saved_at
        FROM dbo.BOOKMARKS b
        WHERE b.MaCanBo = @userKey OR b.UserId = TRY_CAST(@userKey AS INT)
        ORDER BY b.NgayLuu DESC
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
        WHERE ArticleId = @articleId AND (MaCanBo = @userKey OR UserId = TRY_CAST(@userKey AS INT))
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
        LEFT JOIN dbo.NHAN_SU ns ON u.MaNhanSu = ns.MaNhanSu
        WHERE ns.MaCanBo = @userKey OR u.Email = @userKey
      `);
      const userId = userRes.recordset.length ? userRes.recordset[0].UserId : null;

      const ins = mssqlPool.request();
      ins.input('userId', sql.Int, userId);
      ins.input('userKey', sql.VarChar, userKey);
      ins.input('articleId', sql.Int, data.article_id);
      ins.input('title', sql.NVarChar, data.article_title || null);
      const added = await ins.query(`
        INSERT INTO dbo.BOOKMARKS (UserId, MaCanBo, ArticleId, TieuDe, NgayLuu)
        OUTPUT INSERTED.BookmarkId AS id, CONVERT(VARCHAR(19), INSERTED.NgayLuu, 120) AS saved_at
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

module.exports = {
  sqlConfig,
  isMssqlConnected: () => isMssqlConnected,
  getArticlesFromDb,
  insertArticleToDb,
  updateArticleInDb,
  deleteArticleFromDb,
  getDocumentsFromDb,
  getCategoriesFromDb,
  getOrgDataFromDb,
  getMonthlyReportsFromDb,
  getWelfareFromDb,
  getUsersFromDb,
  getCommentsFromDb,
  insertCommentToDb,
  insertFeedbackToDb,
  insertWelfareApplicationToDb,
  getBookmarksFromDb,
  toggleBookmarkInDb
};