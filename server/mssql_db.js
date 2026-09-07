const { loadDB, saveDB } = require('./db');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const serverName = process.env.DB_SERVER || 'RTX-ON\\MSSQLVESE';

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

let mssqlPool = null;
let isMssqlConnected = false;

async function initMssqlConnection() {
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
          COALESCE(ns.HoVaTen, u.HoTen, N'Ban Thường Vụ') AS author,
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
        LEFT JOIN dbo.NHAN_SU ns ON a.MaTacGia = ns.MaNhanSu
        LEFT JOIN dbo.USERS u ON u.MaNhanSu = ns.MaNhanSu
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
  let list = db.articles || db.tin_tuc || [];
  if (category && category !== 'all') list = list.filter(a => (a.categoryName === category || a.categoryId == category || a.ChuyenMuc === category));
  if (status && status !== 'all') {
    const sLower = status.toLowerCase();
    list = list.filter(a => {
      const artStatus = (a.status || a.TrangThai || '').toLowerCase();
      if (sLower === 'pending' || sLower === 'pending_review') return artStatus.includes('pending') || artStatus.includes('cho');
      if (sLower === 'published') return artStatus.includes('publish') || artStatus.includes('xuat');
      if (sLower === 'draft') return artStatus.includes('draft') || artStatus.includes('nhap');
      if (sLower === 'approved') return artStatus.includes('approved') || artStatus.includes('duyet');
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
      reqA.input('hanhDong', sql.VarChar, 'created');
      reqA.input('ghiChu', sql.NVarChar, `Tạo bài viết: ${data.title}`);

      await reqA.query(`
        INSERT INTO dbo.ARTICLE_AUDITS (ArticleId, UserId, HanhDong, GhiChu, NgayThucHien)
        VALUES (@articleId, @userId, @hanhDong, @ghiChu, SYSDATETIME())
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
      reqA.input('hanhDong', sql.VarChar, data.status === 'published' ? 'published' : 'updated');
      reqA.input('ghiChu', sql.NVarChar, `Cập nhật bài viết ID #${id}`);

      await reqA.query(`
        INSERT INTO dbo.ARTICLE_AUDITS (ArticleId, UserId, HanhDong, GhiChu, NgayThucHien)
        VALUES (@articleId, @userId, @hanhDong, @ghiChu, SYSDATETIME())
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
          SoHieuVanBan AS so_hieu,
          TenVanBan AS tieu_de,
          LoaiVanBan AS loai_van_ban,
          CASE 
            WHEN LoaiVanBan = 'tuyentruyen' THEN N'Công văn tuyên truyền'
            WHEN LoaiVanBan = 'kehoach' THEN N'Kế hoạch hoạt động'
            WHEN LoaiVanBan = 'luat' THEN N'Văn bản luật'
            WHEN LoaiVanBan = 'quyetdinh' THEN N'Quyết định'
            ELSE LoaiVanBan
          END AS loai_van_ban_ten,
          CoQuanBanHanh AS co_quan_ban_hanh,
          CONVERT(VARCHAR(10), NgayBanHanh, 120) AS ngay_ban_hanh,
          NguoiKy AS nguoi_ky,
          TepDinhKem AS file_url,
          DungLuong AS dung_luong,
          LuotTai AS luot_tai
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
  if (category && category !== 'all') list = list.filter(d => d.loai_van_ban === category);
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(d => (d.so_hieu || '').toLowerCase().includes(q) || (d.tieu_de || '').toLowerCase().includes(q));
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
// 4. ORG STRUCTURE & NHAN SU (dbo.TO_CHUC, dbo.TO_CONG_DOAN, dbo.NHAN_SU)
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
  return { boards: db.to_chuc || [], units: db.to_cong_doan || [], cadres: db.nhan_su || [] };
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
          r.MaToCongDoan AS unit_id,
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
        SELECT PhucLoiId AS id, MaPhucLoi AS code, TieuDe AS title, ChuyenMuc AS category,
               DoiTuongHuong AS target, MucHoTro AS amount, MoTa AS description, Icon AS icon
        FROM dbo.PHUC_LOI
        ORDER BY PhucLoiId ASC
      `);
      return result.recordset;
    } catch (err) {
      console.error("MSSQL Welfare Error:", err.message);
    }
  }
  return loadDB().phuc_loi || [];
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
  getUsersFromDb
};
