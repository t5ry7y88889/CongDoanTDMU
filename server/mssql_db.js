const sql = require('mssql');
const { loadDB, saveDB } = require('./db');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const serverName = process.env.DB_SERVER || 'RTX-ON\\MSSQLVESE';

const sqlConfig = {
  server: (process.env.DB_HOST || '127.0.0.1').trim(),
  port: parseInt(String(process.env.DB_PORT || '56205').trim()),
  database: (process.env.DB_DATABASE || 'TDMU_TradeUnion_DB').trim(),
  user: (process.env.DB_USER || 'node_app').trim(),
  password: (process.env.DB_PASSWORD || 'TDMUNode@2026').trim(),
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
          a.FbPostId AS fbPostId,
          a.ZaloMsgId AS zaloMsgId,
          a.NoiDungFB AS noi_dung_fb,
          a.NoiDungZalo AS noi_dung_zalo,
          COALESCE(a.LuotXem, 0) AS viewsCount,
          COALESCE(a.LuotThich, 0) AS likesCount,
          COALESCE(a.LuotVoTay, 0) AS clapsCount,
          CONVERT(VARCHAR(19), a.NgayXuatBan, 120) AS publishedAt,
          CONVERT(VARCHAR(19), a.NgayTao, 120) AS createdAt,
          CONVERT(VARCHAR(19), COALESCE(a.NgayCapNhat, a.NgayTao), 120) AS updatedAt
        FROM dbo.ARTICLES a
        LEFT JOIN dbo.CATEGORIES c ON a.CategoryId = c.CategoryId
        LEFT JOIN dbo.MEMBERS ns ON a.MaTacGia = ns.MaNhanSu
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

      query += " ORDER BY COALESCE(a.NgayXuatBan, a.NgayTao) DESC, a.ArticleId DESC";
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
      const cleanTitle = (data.title || 'Tin tức Công đoàn').trim().slice(0, 250);
      const slugPrefix = (data.slug || cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')).slice(0, 200);
      const slug = slugPrefix + '-' + Date.now();
      let catId = parseInt(data.categoryId) || 1;
      if (![1, 2, 3].includes(catId)) catId = 1;
      let authId = parseInt(data.authorId) || 1;
      if (authId < 1 || authId > 17) authId = 1;
      const isPublished = data.status === 'published';
      const insertArticleQuery = `
        INSERT INTO dbo.ARTICLES (TieuDe, Slug, CategoryId, MaTacGia, TomTat, NoiDung, HinhAnhDaiDien, TrangThai, IsAiGenerated, AiPrompt, NgayXuatBan, NgayTao, NgayCapNhat)
        OUTPUT INSERTED.ArticleId AS id
        VALUES (@title, @slug, @categoryId, @authorId, @summary, @content, @image, @status, @isAiGenerated, @aiPrompt, @publishedAt, SYSDATETIME(), SYSDATETIME())
      `;
      req.input('title', sql.NVarChar, cleanTitle);
      req.input('slug', sql.VarChar, slug);
      req.input('categoryId', sql.Int, catId);
      req.input('authorId', sql.Int, authId);
      req.input('summary', sql.NVarChar, (data.summary || cleanTitle).trim());
      req.input('content', sql.NVarChar, data.content || cleanTitle);
      let safeImage = data.image || 'images/banner.jpg';
      if (typeof safeImage === 'string' && (safeImage.startsWith('data:image/') || safeImage.length > 490)) {
        safeImage = safeImage.startsWith('data:image/') ? 'images/banner.jpg' : safeImage.slice(0, 490);
      }
      req.input('image', sql.VarChar, safeImage);
      req.input('status', sql.VarChar, data.status || 'draft');
      req.input('isAiGenerated', sql.Bit, data.isAiGenerated ? 1 : 0);
      req.input('aiPrompt', sql.NVarChar, data.aiPrompt || null);
      req.input('publishedAt', sql.DateTime2, isPublished ? new Date() : null);

      const artRes = await req.query(insertArticleQuery);
      const newId = artRes.recordset[0].id;

      const reqA = new sql.Request(transaction);
      reqA.input('articleId', sql.Int, newId);
      reqA.input('userId', sql.Int, authId);
      reqA.input('hanhDong', sql.VarChar, 'created');
      reqA.input('ghiChu', sql.NVarChar, `Tạo bài viết: ${cleanTitle}`);
      await reqA.query(`
        INSERT INTO dbo.ARTICLE_AUDITS (ArticleId, UserId, HanhDong, GhiChu, NgayThucHien)
        VALUES (@articleId, @userId, @hanhDong, @ghiChu, SYSDATETIME())
      `);
      await transaction.commit();
      data.id = newId;
      data.image = safeImage;
      data.categoryId = catId;
      data.authorId = authId;
      if (isPublished) data.publishedAt = new Date().toISOString();
      return data;
    } catch (err) {
      await transaction.rollback();
      console.error('MSSQL Insert Error:', err.message);
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
      const numericId = parseInt(id);
      if (!numericId || isNaN(numericId)) {
        await transaction.rollback();
        return false;
      }

      let safeUpdateImage = data.image || null;
      if (typeof safeUpdateImage === 'string' && (safeUpdateImage.startsWith('data:image/') || safeUpdateImage.length > 490)) {
        safeUpdateImage = safeUpdateImage.startsWith('data:image/') ? 'images/banner.jpg' : safeUpdateImage.slice(0, 490);
      }

      const req = new sql.Request(transaction);
      req.input('id', sql.Int, numericId);
      req.input('title', sql.NVarChar, data.title || null);
      req.input('summary', sql.NVarChar, data.summary || null);
      req.input('content', sql.NVarChar, data.content || null);
      req.input('image', sql.VarChar, safeUpdateImage);
      req.input('status', sql.VarChar, data.status || null);
      req.input('fbPostId', sql.VarChar, data.fbPostId || null);
      req.input('zaloMsgId', sql.VarChar, data.zaloMsgId || null);
      req.input('noiDungFb', sql.NVarChar, data.noi_dung_fb || null);
      req.input('noiDungZalo', sql.NVarChar, data.noi_dung_zalo || null);

      const updateRes = await req.query(`
        UPDATE dbo.ARTICLES
        SET TieuDe = COALESCE(@title, TieuDe),
            TomTat = COALESCE(@summary, TomTat),
            NoiDung = COALESCE(@content, NoiDung),
            HinhAnhDaiDien = COALESCE(@image, HinhAnhDaiDien),
            TrangThai = COALESCE(@status, TrangThai),
            FbPostId = COALESCE(@fbPostId, FbPostId),
            ZaloMsgId = COALESCE(@zaloMsgId, ZaloMsgId),
            NoiDungFB = COALESCE(@noiDungFb, NoiDungFB),
            NoiDungZalo = COALESCE(@noiDungZalo, NoiDungZalo),
            NgayXuatBan = CASE WHEN @status = 'published' AND NgayXuatBan IS NULL THEN SYSDATETIME() ELSE NgayXuatBan END,
            NgayCapNhat = SYSDATETIME()
        WHERE ArticleId = @id
      `);

      // Nếu bài viết chưa có trong MSSQL (do tạo từ JSON DB trước đó), tự động UPSERT vào dbo.ARTICLES
      if (updateRes.rowsAffected[0] === 0) {
        const insertReq = new sql.Request(transaction);
        const slug = ((data.title || 'bai-viet').toLowerCase().replace(/[^a-z0-9]+/g, '-')) + '-' + numericId;
        insertReq.input('id', sql.Int, numericId);
        insertReq.input('title', sql.NVarChar, data.title || ('Bản thảo #' + numericId));
        insertReq.input('slug', sql.VarChar, slug.slice(0, 100));
        insertReq.input('categoryId', sql.Int, data.categoryId || 1);
        insertReq.input('authorId', sql.Int, data.authorId || 1);
        insertReq.input('summary', sql.NVarChar, data.summary || data.title || '');
        insertReq.input('content', sql.NVarChar, data.content || '');
        insertReq.input('image', sql.VarChar, safeUpdateImage || 'images/banner.jpg');
        insertReq.input('status', sql.VarChar, data.status || 'draft');
        insertReq.input('isAiGenerated', sql.Bit, data.isAiGenerated ? 1 : 0);
        insertReq.input('aiPrompt', sql.NVarChar, data.aiPrompt || null);

        await insertReq.query(`
          SET IDENTITY_INSERT dbo.ARTICLES ON;
          INSERT INTO dbo.ARTICLES (ArticleId, TieuDe, Slug, CategoryId, MaTacGia, TomTat, NoiDung, HinhAnhDaiDien, TrangThai, IsAiGenerated, AiPrompt, NgayTao, NgayCapNhat)
          VALUES (@id, @title, @slug, @categoryId, @authorId, @summary, @content, @image, @status, @isAiGenerated, @aiPrompt, SYSDATETIME(), SYSDATETIME());
          SET IDENTITY_INSERT dbo.ARTICLES OFF;
        `);
      }

      // Đảm bảo ArticleId đã tồn tại an toàn trong dbo.ARTICLES, tránh lỗi FK_Audits_Articles
      const reqA = new sql.Request(transaction);
      reqA.input('articleId', sql.Int, numericId);
      reqA.input('userId', sql.Int, data.authorId || 1);
      reqA.input('hanhDong', sql.VarChar, data.status === 'published' ? 'published' : 'updated');
      reqA.input('ghiChu', sql.NVarChar, `Cập nhật bài viết ID #${numericId}`);

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
async function getDocumentsFromDb(category = 'all', search = '', hieu_luc = 'all') {
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
          LuotTai AS luot_tai,
          COALESCE(HieuLuc, 'con_hieu_luc') AS hieu_luc
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
      if (hieu_luc && hieu_luc !== 'all') {
        query += " AND HieuLuc = @hieu_luc";
        req.input('hieu_luc', sql.VarChar, hieu_luc);
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
// 4. ORG STRUCTURE & MEMBERS (dbo.ORGANIZATIONS, dbo.UNION_BRANCHES, dbo.MEMBERS)
// =========================================================================
async function getOrgDataFromDb() {
  if (isMssqlConnected && mssqlPool) {
    try {
      const boards = (await mssqlPool.request().query("SELECT MaToChuc AS id, TenToChuc AS name, NhiemKy AS tenure, MoTaChucNang AS description FROM dbo.ORGANIZATIONS ORDER BY ThuTuHienThi")).recordset;
      const units = (await mssqlPool.request().query("SELECT MaToCongDoan AS id, MaDinhDanh AS code, TenToCongDoan AS name, ToTruong AS leader, EmailLienHe AS email, SoDienThoai AS phone FROM dbo.UNION_BRANCHES ORDER BY MaToCongDoan")).recordset;
      const cadres = (await mssqlPool.request().query(`
        SELECT 
          m.MaNhanSu AS id,
          m.MaCanBo AS code,
          m.HoVaTen AS name,
          m.Email AS email,
          m.SoDienThoai AS phone,
          COALESCE(m.HocHamHocVi, N'Cử nhân') AS degree,
          COALESCE(m.ChucVuCongDoan, N'Ủy viên') AS role,
          COALESCE(m.ChucVuChuyenMon, N'Cán bộ') AS unit,
          m.MaToCongDoan AS unit_id,
          tb.TenToCongDoan AS unit_name,
          m.MaToChuc AS board_id,
          o.TenToChuc AS board_name,
          COALESCE(u.AvatarUrl, 'https://congdoan.tdmu.edu.vn/img/ckeditor/Images/Danh.jpg') AS photo,
          N'Tham gia công tác phong trào và thực hiện các nhiệm vụ do Ban Thường vụ phân công.' AS duties
        FROM dbo.MEMBERS m
        LEFT JOIN dbo.UNION_BRANCHES tb ON m.MaToCongDoan = tb.MaToCongDoan
        LEFT JOIN dbo.ORGANIZATIONS o ON m.MaToChuc = o.MaToChuc
        LEFT JOIN dbo.USERS u ON u.MaNhanSu = m.MaNhanSu
        ORDER BY m.MaNhanSu ASC
      `)).recordset;
      return { boards, units, cadres };
    } catch (err) {
      console.error("MSSQL Org Data Error:", err.message);
    }
  }
  const db = loadDB();
  return { 
    boards: db.organizations || db.to_chuc || [], 
    units: db.union_branches || db.to_cong_doan || [], 
    cadres: db.members || db.nhan_su || [] 
  };
}

async function insertCadreToDb(data) {
  if (isMssqlConnected && mssqlPool) {
    try {
      const sql = require('mssql');
      const req = mssqlPool.request();
      const code = data.code || ('CB_' + Date.now().toString().slice(-4));
      req.input('code', sql.VarChar, code);
      req.input('name', sql.NVarChar, data.name || data.ho_ten || 'Cán bộ mới');
      req.input('email', sql.VarChar, data.email || '');
      req.input('phone', sql.VarChar, data.phone || data.so_dien_thoai || '');
      req.input('degree', sql.NVarChar, data.degree || data.hoc_vi || 'Cử nhân');
      req.input('role', sql.NVarChar, data.role || data.chuc_vu || 'Ủy viên');
      req.input('unit', sql.NVarChar, data.unit || data.don_vi || 'Công đoàn TDMU');
      req.input('unitId', sql.Int, parseInt(data.unit_id) || 1);
      req.input('boardId', sql.Int, parseInt(data.board_id) || 1);

      const query = `
        INSERT INTO dbo.MEMBERS (MaCanBo, HoVaTen, Email, SoDienThoai, HocHamHocVi, ChucVuCongDoan, ChucVuChuyenMon, MaToCongDoan, MaToChuc, TrangThai, NgayTao)
        OUTPUT INSERTED.MaNhanSu AS id
        VALUES (@code, @name, @email, @phone, @degree, @role, @unit, @unitId, @boardId, 1, SYSDATETIME())
      `;
      const res = await req.query(query);
      data.id = res.recordset[0].id;
      data.code = code;
      return data;
    } catch (err) {
      console.error("MSSQL Insert Cadre Error:", err.message);
    }
  }
  const db = loadDB();
  db.members = db.members || [];
  data.id = data.id || (db.members.length ? Math.max(...db.members.map(m => m.id || 0)) + 1 : 1);
  data.code = data.code || ('CB_' + String(data.id).padStart(3, '0'));
  db.members.push(data);
  saveDB(db);
  return data;
}

async function updateCadreInDb(id, data) {
  const numericId = parseInt(id);
  if (isMssqlConnected && mssqlPool) {
    try {
      const sql = require('mssql');
      const req = mssqlPool.request();
      req.input('id', sql.Int, numericId);
      req.input('name', sql.NVarChar, data.name || data.ho_ten || null);
      req.input('email', sql.VarChar, data.email || null);
      req.input('phone', sql.VarChar, data.phone || data.so_dien_thoai || null);
      req.input('degree', sql.NVarChar, data.degree || data.hoc_vi || null);
      req.input('role', sql.NVarChar, data.role || data.chuc_vu || null);
      req.input('unit', sql.NVarChar, data.unit || data.don_vi || null);
      req.input('unitId', sql.Int, data.unit_id ? parseInt(data.unit_id) : null);
      req.input('boardId', sql.Int, data.board_id ? parseInt(data.board_id) : null);

      await req.query(`
        UPDATE dbo.MEMBERS
        SET HoVaTen = COALESCE(@name, HoVaTen),
            Email = COALESCE(@email, Email),
            SoDienThoai = COALESCE(@phone, SoDienThoai),
            HocHamHocVi = COALESCE(@degree, HocHamHocVi),
            ChucVuCongDoan = COALESCE(@role, ChucVuCongDoan),
            ChucVuChuyenMon = COALESCE(@unit, ChucVuChuyenMon),
            MaToCongDoan = COALESCE(@unitId, MaToCongDoan),
            MaToChuc = COALESCE(@boardId, MaToChuc)
        WHERE MaNhanSu = @id
      `);
    } catch (err) {
      console.error("MSSQL Update Cadre Error:", err.message);
    }
  }
  const db = loadDB();
  db.members = db.members || [];
  const idx = db.members.findIndex(m => m.id == numericId || m.MaNhanSu == numericId);
  if (idx !== -1) {
    db.members[idx] = { ...db.members[idx], ...data, id: numericId };
    saveDB(db);
    return db.members[idx];
  }
  return { id: numericId, ...data };
}

async function deleteCadreFromDb(id) {
  const numericId = parseInt(id);
  if (isMssqlConnected && mssqlPool) {
    try {
      const sql = require('mssql');
      const req = mssqlPool.request();
      req.input('id', sql.Int, numericId);
      await req.query("DELETE FROM dbo.MEMBERS WHERE MaNhanSu = @id");
    } catch (err) {
      console.error("MSSQL Delete Cadre Error:", err.message);
    }
  }
  const db = loadDB();
  db.members = db.members || [];
  const idx = db.members.findIndex(m => m.id == numericId || m.MaNhanSu == numericId);
  if (idx !== -1) {
    const removed = db.members.splice(idx, 1)[0];
    saveDB(db);
    return removed;
  }
  return true;
}

async function updateUnionBranchInDb(id, data) {
  const numericId = parseInt(id);
  if (isMssqlConnected && mssqlPool) {
    try {
      const sql = require('mssql');
      const req = mssqlPool.request();
      req.input('id', sql.Int, numericId);
      req.input('name', sql.NVarChar, data.name || data.TenToCongDoan || null);
      req.input('leader', sql.NVarChar, data.leader || data.ToTruong || null);
      req.input('email', sql.VarChar, data.email || data.EmailLienHe || null);
      req.input('phone', sql.VarChar, data.phone || data.SoDienThoai || null);

      await req.query(`
        UPDATE dbo.UNION_BRANCHES
        SET TenToCongDoan = COALESCE(@name, TenToCongDoan),
            ToTruong = COALESCE(@leader, ToTruong),
            EmailLienHe = COALESCE(@email, EmailLienHe),
            SoDienThoai = COALESCE(@phone, SoDienThoai)
        WHERE MaToCongDoan = @id
      `);
    } catch (err) {
      console.error("MSSQL Update Union Branch Error:", err.message);
    }
  }
  const db = loadDB();
  db.union_branches = db.union_branches || [];
  const idx = db.union_branches.findIndex(u => u.id == numericId || u.MaToCongDoan == numericId);
  if (idx !== -1) {
    db.union_branches[idx] = { ...db.union_branches[idx], ...data, id: numericId };
    saveDB(db);
    return db.union_branches[idx];
  }
  return { id: numericId, ...data };
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
          COALESCE(r.SoDoanVienOmDau, 0) AS severe_illness_count,
          COALESCE(r.SoVuTaiNanLaoDong, 0) AS work_accidents_count,
          COALESCE(r.SoCuocKiemTra, 0) AS inspection_sessions_count,
          COALESCE(r.SoBuoiTuyenTruyen, 0) AS propaganda_sessions_count,
          r.TuDanhGia AS self_rank,
          r.BtvXepLoai AS btv_rank,
          r.TrangThai AS status,
          r.LinkMinhChung AS proof_link,
          CONVERT(VARCHAR(19), r.NgayNop, 120) AS submitted_at
        FROM dbo.MONTHLY_REPORTS r
        LEFT JOIN dbo.UNION_BRANCHES tc ON r.MaToCongDoan = tc.MaToCongDoan
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
// 6. WELFARE (dbo.WELFARE_PROGRAMS)
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
          'active' AS status
        FROM dbo.WELFARE_PROGRAMS
        ORDER BY PhucLoiId ASC
      `);
      return result.recordset;
    } catch (err) {
      console.error("MSSQL Welfare Error:", err.message);
    }
  }
  return loadDB().welfare_programs || loadDB().phuc_loi || [];
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
// 8. TEMPLATES (dbo.TEMPLATES)
// =========================================================================
async function getTemplatesFromDb(category = 'all', search = '') {
  if (isMssqlConnected && mssqlPool) {
    try {
      const sql = require('mssql');
      let query = `
        SELECT 
          TemplateId AS id,
          MaHieu AS code,
          TenBieuMau AS title,
          ChuyenMuc AS category,
          COALESCE(TenChuyenMuc, N'Biểu Mẫu Nghiệp Vụ') AS categoryName,
          MoTa AS description,
          DinhDang AS file_type,
          DungLuong AS file_size,
          DuongDanFile AS file_url,
          LuotTai AS downloads_count,
          CONVERT(VARCHAR(19), NgayTao, 120) AS created_at
        FROM dbo.TEMPLATES
        WHERE TrangThai = 1
      `;
      const req = mssqlPool.request();
      if (category && category !== 'all') {
        query += " AND ChuyenMuc = @category";
        req.input('category', sql.VarChar, category);
      }
      if (search) {
        query += " AND (MaHieu LIKE @search OR TenBieuMau LIKE @search OR MoTa LIKE @search)";
        req.input('search', sql.NVarChar, `%${search}%`);
      }
      query += " ORDER BY TemplateId ASC";
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
      req.input('file_type', sql.VarChar, data.file_type || 'docx');
      req.input('file_size', sql.VarChar, data.file_size || '4.0 KB');
      req.input('file_url', sql.VarChar, data.file_url);

      const query = `
        INSERT INTO dbo.TEMPLATES (MaHieu, TenBieuMau, ChuyenMuc, TenChuyenMuc, MoTa, DinhDang, DungLuong, DuongDanFile, LuotTai, TrangThai, NgayTao)
        OUTPUT INSERTED.TemplateId AS id
        VALUES (@code, @title, @category, @categoryName, @description, @file_type, @file_size, @file_url, 0, 1, SYSDATETIME())
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
      await req.query("DELETE FROM dbo.TEMPLATES WHERE TemplateId = @id");
      return true;
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
      await req.query("UPDATE dbo.TEMPLATES SET LuotTai = LuotTai + 1 WHERE TemplateId = @id");
      return true;
    } catch (err) {
      console.error("MSSQL Increment Download Error:", err.message);
    }
  }
  return false;
}

// =========================================================================
// 9. AID_REQUESTS (dbo.AID_REQUESTS - Cũ: DON_TRO_CAP)
// =========================================================================
async function getWelfareApplicationsFromDb(status = 'all', search = '') {
  if (isMssqlConnected && mssqlPool) {
    try {
      const sql = require('mssql');
      let query = `
        SELECT 
          DonId AS id,
          HoTen AS full_name,
          DonVi AS unit,
          COALESCE(SoDienThoai, '') AS phone,
          COALESCE(Email, '') AS email,
          LoaiTroCap AS type,
          SoTienDeXuat AS amount_requested,
          SoTienDuocDuyet AS amount_approved,
          LyDo AS reason,
          TepMinhChung AS proof_url,
          TrangThai AS status,
          NguoiDuyet AS approved_by,
          GhiChu AS decision_note,
          CONVERT(VARCHAR(19), NgayNop, 120) AS submitted_at
        FROM dbo.AID_REQUESTS
        WHERE 1=1
      `;
      const req = mssqlPool.request();
      if (status && status !== 'all') {
        query += " AND TrangThai = @status";
        req.input('status', sql.VarChar, status);
      }
      if (search) {
        query += " AND (HoTen LIKE @search OR DonVi LIKE @search OR LoaiTroCap LIKE @search OR LyDo LIKE @search)";
        req.input('search', sql.NVarChar, `%${search}%`);
      }
      query += " ORDER BY DonId DESC";
      const res = await req.query(query);
      return res.recordset;
    } catch (err) {
      console.error("MSSQL Welfare Applications Error:", err.message);
    }
  }
  return null;
}

async function insertWelfareApplicationToDb(data) {
  if (isMssqlConnected && mssqlPool) {
    try {
      const sql = require('mssql');
      const req = mssqlPool.request();
      req.input('fullName', sql.NVarChar, data.full_name);
      req.input('unit', sql.NVarChar, data.unit || 'Đoàn viên TDMU');
      req.input('phone', sql.VarChar, data.phone || '');
      req.input('email', sql.VarChar, data.email || '');
      req.input('type', sql.NVarChar, data.type);
      req.input('amountRequested', sql.Decimal(15, 2), data.amount_requested || 1000000);
      req.input('reason', sql.NVarChar, data.reason);
      req.input('proofUrl', sql.VarChar, data.proof_url || null);
      req.input('status', sql.VarChar, data.status || 'pending');
      req.input('decisionNote', sql.NVarChar, data.decision_note || 'Chờ Ban Thường Vụ xét duyệt');

      const query = `
        INSERT INTO dbo.AID_REQUESTS (HoTen, DonVi, SoDienThoai, Email, LoaiTroCap, SoTienDeXuat, LyDo, TepMinhChung, TrangThai, GhiChu, NgayNop)
        OUTPUT INSERTED.DonId AS id
        VALUES (@fullName, @unit, @phone, @email, @type, @amountRequested, @reason, @proofUrl, @status, @decisionNote, SYSDATETIME())
      `;
      const res = await req.query(query);
      data.id = res.recordset[0].id;
      return data;
    } catch (err) {
      console.error("MSSQL Insert Welfare App Error:", err.message);
    }
  }
  return null;
}

async function updateWelfareApplicationInDb(id, data) {
  if (isMssqlConnected && mssqlPool) {
    try {
      const sql = require('mssql');
      const req = mssqlPool.request();
      req.input('id', sql.Int, id);
      req.input('status', sql.VarChar, data.status || null);
      req.input('amountApproved', sql.Decimal(15, 2), data.amount_approved !== undefined ? data.amount_approved : null);
      req.input('decisionNote', sql.NVarChar, data.decision_note || null);
      req.input('approvedBy', sql.NVarChar, data.approved_by || null);

      await req.query(`
        UPDATE dbo.AID_REQUESTS
        SET TrangThai = COALESCE(@status, TrangThai),
            SoTienDuocDuyet = COALESCE(@amountApproved, SoTienDuocDuyet),
            GhiChu = COALESCE(@decisionNote, GhiChu),
            NguoiDuyet = COALESCE(@approvedBy, NguoiDuyet)
        WHERE DonId = @id
      `);
      return true;
    } catch (err) {
      console.error("MSSQL Update Welfare App Error:", err.message);
    }
  }
  return false;
}

async function deleteWelfareApplicationInDb(id) {
  if (isMssqlConnected && mssqlPool) {
    try {
      const sql = require('mssql');
      const req = mssqlPool.request();
      req.input('id', sql.Int, id);
      await req.query('DELETE FROM dbo.AID_REQUESTS WHERE DonId = @id');
      return true;
    } catch (err) {
      console.error("MSSQL Delete Welfare App Error:", err.message);
    }
  }
  return false;
}

// =========================================================================
// 10. INBOX_FEEDBACK (dbo.INBOX_FEEDBACK)
// =========================================================================
async function getFeedbackFromDb(status = 'all', search = '') {
  if (isMssqlConnected && mssqlPool) {
    try {
      const sql = require('mssql');
      let query = `
        SELECT 
          FeedbackId AS id,
          HoTen AS sender_name,
          Email AS email,
          COALESCE(SoDienThoai, '') AS phone,
          DonVi AS unit,
          ChuDe AS category,
          TieuDe AS title,
          NoiDung AS content,
          TepDinhKem AS attachment,
          TrangThai AS status,
          TraLoi AS response,
          CONVERT(VARCHAR(19), NgayGui, 120) AS submitted_at
        FROM dbo.INBOX_FEEDBACK
        WHERE 1=1
      `;
      const req = mssqlPool.request();
      if (status && status !== 'all') {
        query += " AND TrangThai = @status";
        req.input('status', sql.VarChar, status);
      }
      if (search) {
        query += " AND (HoTen LIKE @search OR DonVi LIKE @search OR TieuDe LIKE @search OR NoiDung LIKE @search)";
        req.input('search', sql.NVarChar, `%${search}%`);
      }
      query += " ORDER BY FeedbackId DESC";
      const res = await req.query(query);
      return res.recordset;
    } catch (err) {
      console.error("MSSQL Feedback Error:", err.message);
    }
  }
  return null;
}

async function insertFeedbackToDb(data) {
  if (isMssqlConnected && mssqlPool) {
    try {
      const sql = require('mssql');
      const req = mssqlPool.request();
      req.input('senderName', sql.NVarChar, data.sender_name);
      req.input('email', sql.VarChar, data.email || '');
      req.input('phone', sql.VarChar, data.phone || '');
      req.input('unit', sql.NVarChar, data.unit || 'Đoàn viên TDMU');
      req.input('category', sql.NVarChar, data.category || 'Góp ý chung');
      req.input('title', sql.NVarChar, data.title);
      req.input('content', sql.NVarChar, data.content);
      req.input('status', sql.VarChar, data.status || 'pending');

      const query = `
        INSERT INTO dbo.INBOX_FEEDBACK (HoTen, Email, SoDienThoai, DonVi, ChuDe, TieuDe, NoiDung, TrangThai, NgayGui)
        OUTPUT INSERTED.FeedbackId AS id
        VALUES (@senderName, @email, @phone, @unit, @category, @title, @content, @status, SYSDATETIME())
      `;
      const res = await req.query(query);
      data.id = res.recordset[0].id;
      return data;
    } catch (err) {
      console.error("MSSQL Insert Feedback Error:", err.message);
    }
  }
  return null;
}

async function updateFeedbackInDb(id, data) {
  if (isMssqlConnected && mssqlPool) {
    try {
      const sql = require('mssql');
      const req = mssqlPool.request();
      req.input('id', sql.Int, id);
      req.input('status', sql.VarChar, data.status || null);
      req.input('response', sql.NVarChar, data.response !== undefined ? data.response : null);

      await req.query(`
        UPDATE dbo.INBOX_FEEDBACK
        SET TrangThai = COALESCE(@status, TrangThai),
            TraLoi = COALESCE(@response, TraLoi)
        WHERE FeedbackId = @id
      `);
      return true;
    } catch (err) {
      console.error("MSSQL Update Feedback Error:", err.message);
    }
  }
  return false;
}

async function deleteFeedbackFromDb(id) {
  if (isMssqlConnected && mssqlPool) {
    try {
      const sql = require('mssql');
      const req = mssqlPool.request();
      req.input('id', sql.Int, id);
      await req.query("DELETE FROM dbo.INBOX_FEEDBACK WHERE FeedbackId = @id");
      return true;
    } catch (err) {
      console.error("MSSQL Delete Feedback Error:", err.message);
    }
  }
  return false;
}

// =========================================================================
// 11. ARTICLE REACTIONS (dbo.ARTICLES LuotThich, LuotVoTay)
// =========================================================================
async function incrementArticleReactionInDb(id, type) {
  if (isMssqlConnected && mssqlPool) {
    try {
      const sql = require('mssql');
      const req = mssqlPool.request();
      req.input('id', sql.Int, id);
      if (type === 'clap') {
        await req.query("UPDATE dbo.ARTICLES SET LuotVoTay = COALESCE(LuotVoTay, 0) + 1 WHERE ArticleId = @id");
      } else if (type === 'like') {
        await req.query("UPDATE dbo.ARTICLES SET LuotThich = COALESCE(LuotThich, 0) + 1 WHERE ArticleId = @id");
      } else if (type === 'view') {
        await req.query("UPDATE dbo.ARTICLES SET LuotXem = COALESCE(LuotXem, 0) + 1 WHERE ArticleId = @id");
      }
      return true;
    } catch (err) {
      console.error("MSSQL Increment Reaction Error:", err.message);
    }
  }
  return false;
}

// =========================================================================
// 12. COMMENTS (dbo.COMMENTS)
// =========================================================================
async function getCommentsFromDb(articleId) {
  if (isMssqlConnected && mssqlPool) {
    try {
      const sql = require('mssql');
      const req = mssqlPool.request();
      let query = `
        SELECT 
          CommentId as id, 
          ArticleId as articleId, 
          ArticleId as article_id, 
          UserId as userId, 
          HoTen as author, 
          HoTen as author_name, 
          Email as email, 
          ChucVu as unit, 
          NoiDung as content, 
          TrangThai as status, 
          NgayTao as createdAt 
        FROM dbo.COMMENTS
      `;
      if (articleId) {
        query += " WHERE ArticleId = @articleId";
        req.input('articleId', sql.Int, parseInt(articleId));
      }
      query += " ORDER BY NgayTao DESC";
      const result = await req.query(query);
      return result.recordset;
    } catch (err) {
      console.error("MSSQL Get Comments Error:", err.message);
    }
  }
  const db = loadDB();
  let comments = db.comments || [];
  if (articleId) {
    comments = comments.filter(c => String(c.articleId || c.article_id) === String(articleId));
  }
  return comments;
}

async function insertCommentToDb(data) {
  const artId = parseInt(data.articleId || data.article_id || data.ArticleId);
  const hoTen = data.author || data.author_name || data.hoTen || data.HoTen || 'Đoàn viên Công đoàn';
  const unit = data.unit || data.chucVu || data.ChucVu || 'Trường ĐH Thủ Dầu Một';
  const content = data.content || data.noiDung || data.NoiDung;
  const email = data.email || null;
  const userId = data.userId || null;
  const status = data.status || 'approved';

  if (isMssqlConnected && mssqlPool) {
    try {
      const sql = require('mssql');
      const req = mssqlPool.request();
      req.input('articleId', sql.Int, artId);
      req.input('userId', sql.Int, userId);
      req.input('hoTen', sql.NVarChar, hoTen);
      req.input('email', sql.VarChar, email);
      req.input('chucVu', sql.NVarChar, unit);
      req.input('noiDung', sql.NVarChar, content);
      req.input('trangThai', sql.VarChar, status);
      const result = await req.query(`
        INSERT INTO dbo.COMMENTS (ArticleId, UserId, HoTen, Email, ChucVu, NoiDung, TrangThai, NgayTao)
        OUTPUT 
          INSERTED.CommentId as id, 
          INSERTED.ArticleId as articleId, 
          INSERTED.ArticleId as article_id, 
          INSERTED.HoTen as author, 
          INSERTED.HoTen as author_name, 
          INSERTED.ChucVu as unit, 
          INSERTED.NoiDung as content, 
          INSERTED.TrangThai as status, 
          INSERTED.NgayTao as createdAt
        VALUES (@articleId, @userId, @hoTen, @email, @chucVu, @noiDung, @trangThai, SYSDATETIME())
      `);
      return result.recordset[0];
    } catch (err) {
      console.error("MSSQL Insert Comment Error:", err.message);
    }
  }
  const db = loadDB();
  if (!db.comments) db.comments = [];
  const newComment = {
    id: Date.now(),
    articleId: artId,
    article_id: artId,
    author: hoTen,
    author_name: hoTen,
    unit: unit,
    content: content,
    status: status,
    createdAt: new Date().toISOString()
  };
  db.comments.unshift(newComment);
  saveDB(db);
  return newComment;
}

// =========================================================================
// 10. WELFARE FUND & TRANSACTIONS (dbo.WELFARE_FUND, dbo.WELFARE_TRANSACTIONS)
// =========================================================================
async function getWelfareFundFromDb() {
  if (isMssqlConnected && mssqlPool) {
    try {
      const res = await mssqlPool.request().query(`
        SELECT TOP 1 
          FundId as fund_id,
          FundName as fund_name,
          CurrentBalance as current_balance,
          TotalDeposited as total_deposited,
          TotalDisbursed as total_disbursed,
          UpdatedAt as updated_at
        FROM dbo.WELFARE_FUND
        ORDER BY FundId DESC
      `);
      if (res.recordset.length > 0) return res.recordset[0];
    } catch (err) {
      console.error("MSSQL Get Welfare Fund Error:", err.message);
    }
  }
  const db = loadDB();
  return db.welfare_fund || {
    fund_id: 1,
    fund_name: 'Quỹ Chăm Lo & Tương Trợ Đoàn Viên TDMU',
    current_balance: 185000000,
    total_deposited: 250000000,
    total_disbursed: 65000000,
    updated_at: new Date().toISOString()
  };
}

async function getWelfareTransactionsFromDb() {
  if (isMssqlConnected && mssqlPool) {
    try {
      const res = await mssqlPool.request().query(`
        SELECT 
          TransId as id,
          TransCode as code,
          TransType as type,
          Amount as amount,
          SourceName as source_name,
          DecisionNo as decision_no,
          TransDate as date,
          CreatedBy as created_by,
          Note as note,
          RelatedDonId as related_don_id
        FROM dbo.WELFARE_TRANSACTIONS
        ORDER BY TransDate DESC, TransId DESC
      `);
      return res.recordset;
    } catch (err) {
      console.error("MSSQL Get Welfare Transactions Error:", err.message);
    }
  }
  const db = loadDB();
  return db.welfare_transactions || [];
}

async function depositWelfareFundInDb({ amount, source_name, decision_no, note, created_by }) {
  const transCode = `NT-${Date.now().toString().slice(-6)}`;
  if (isMssqlConnected && mssqlPool) {
    try {
      const pool = mssqlPool;
      const transRes = await pool.request()
        .input('transCode', sql.VarChar(50), transCode)
        .input('transType', sql.VarChar(20), 'DEPOSIT')
        .input('amount', sql.Decimal(18, 2), amount)
        .input('sourceName', sql.NVarChar(255), source_name || 'Nguồn ngân sách bổ sung')
        .input('decisionNo', sql.NVarChar(100), decision_no || '')
        .input('createdBy', sql.NVarChar(150), created_by || 'Ban Thường Vụ')
        .input('note', sql.NVarChar(1000), note || '')
        .query(`
          INSERT INTO dbo.WELFARE_TRANSACTIONS (TransCode, TransType, Amount, SourceName, DecisionNo, CreatedBy, Note, TransDate)
          OUTPUT INSERTED.TransId as id, INSERTED.TransCode as code, INSERTED.TransType as type, INSERTED.Amount as amount,
                 INSERTED.SourceName as source_name, INSERTED.DecisionNo as decision_no, INSERTED.TransDate as date,
                 INSERTED.CreatedBy as created_by, INSERTED.Note as note
          VALUES (@transCode, @transType, @amount, @sourceName, @decisionNo, @createdBy, @note, SYSDATETIME());
        `);

      await pool.request()
        .input('amount', sql.Decimal(18, 2), amount)
        .query(`
          UPDATE dbo.WELFARE_FUND
          SET CurrentBalance = CurrentBalance + @amount,
              TotalDeposited = TotalDeposited + @amount,
              UpdatedAt = SYSDATETIME();
        `);

      return transRes.recordset[0];
    } catch (err) {
      console.error("MSSQL Deposit Welfare Fund Error:", err.message);
    }
  }

  const db = loadDB();
  db.welfare_fund = db.welfare_fund || {
    fund_id: 1,
    fund_name: 'Quỹ Chăm Lo & Tương Trợ Đoàn Viên TDMU',
    current_balance: 185000000,
    total_deposited: 250000000,
    total_disbursed: 65000000,
    updated_at: new Date().toISOString()
  };
  db.welfare_fund.current_balance = Number(db.welfare_fund.current_balance || 0) + Number(amount);
  db.welfare_fund.total_deposited = Number(db.welfare_fund.total_deposited || 0) + Number(amount);
  db.welfare_fund.updated_at = new Date().toISOString();

  db.welfare_transactions = db.welfare_transactions || [];
  const newTrans = {
    id: db.welfare_transactions.length + 1,
    code: transCode,
    type: 'DEPOSIT',
    amount: Number(amount),
    source_name: source_name,
    decision_no: decision_no,
    date: new Date().toISOString(),
    created_by: created_by || 'Ban Thường Vụ',
    note: note
  };
  db.welfare_transactions.unshift(newTrans);
  saveDB(db);
  return newTrans;
}

async function disburseWelfareFundInDb({ amount, recipient_name, decision_no, note, created_by, related_don_id }) {
  const transCode = `CT-${Date.now().toString().slice(-6)}`;
  if (isMssqlConnected && mssqlPool) {
    try {
      const pool = mssqlPool;
      const transRes = await pool.request()
        .input('transCode', sql.VarChar(50), transCode)
        .input('transType', sql.VarChar(20), 'DISBURSEMENT')
        .input('amount', sql.Decimal(18, 2), amount)
        .input('sourceName', sql.NVarChar(255), recipient_name || 'Đoàn viên thụ hưởng')
        .input('decisionNo', sql.NVarChar(100), decision_no || '')
        .input('createdBy', sql.NVarChar(150), created_by || 'Ban Thường Vụ')
        .input('note', sql.NVarChar(1000), note || '')
        .input('relatedDonId', sql.Int, related_don_id || null)
        .query(`
          INSERT INTO dbo.WELFARE_TRANSACTIONS (TransCode, TransType, Amount, SourceName, DecisionNo, CreatedBy, Note, RelatedDonId, TransDate)
          OUTPUT INSERTED.TransId as id, INSERTED.TransCode as code, INSERTED.TransType as type, INSERTED.Amount as amount,
                 INSERTED.SourceName as source_name, INSERTED.DecisionNo as decision_no, INSERTED.TransDate as date,
                 INSERTED.CreatedBy as created_by, INSERTED.Note as note, INSERTED.RelatedDonId as related_don_id
          VALUES (@transCode, @transType, @amount, @sourceName, @decisionNo, @createdBy, @note, @relatedDonId, SYSDATETIME());
        `);

      await pool.request()
        .input('amount', sql.Decimal(18, 2), amount)
        .query(`
          UPDATE dbo.WELFARE_FUND
          SET CurrentBalance = CurrentBalance - @amount,
              TotalDisbursed = TotalDisbursed + @amount,
              UpdatedAt = SYSDATETIME();
        `);

      return transRes.recordset[0];
    } catch (err) {
      console.error("MSSQL Disburse Welfare Fund Error:", err.message);
    }
  }

  const db = loadDB();
  db.welfare_fund = db.welfare_fund || {
    fund_id: 1,
    fund_name: 'Quỹ Chăm Lo & Tương Trợ Đoàn Viên TDMU',
    current_balance: 185000000,
    total_deposited: 250000000,
    total_disbursed: 65000000,
    updated_at: new Date().toISOString()
  };
  db.welfare_fund.current_balance = Number(db.welfare_fund.current_balance || 0) - Number(amount);
  db.welfare_fund.total_disbursed = Number(db.welfare_fund.total_disbursed || 0) + Number(amount);
  db.welfare_fund.updated_at = new Date().toISOString();

  db.welfare_transactions = db.welfare_transactions || [];
  const newTrans = {
    id: db.welfare_transactions.length + 1,
    code: transCode,
    type: 'DISBURSEMENT',
    amount: Number(amount),
    source_name: recipient_name,
    decision_no: decision_no,
    date: new Date().toISOString(),
    created_by: created_by || 'Ban Thường Vụ',
    note: note,
    related_don_id: related_don_id
  };
  db.welfare_transactions.unshift(newTrans);
  saveDB(db);
  return newTrans;
}


async function getArticleStatsFromDb() {
  if (isMssqlConnected && mssqlPool) {
    try {
      const res = await mssqlPool.request().query(`
        SELECT 
          COUNT(*) AS totalArticles,
          COALESCE(SUM(CAST(COALESCE(LuotXem, 0) AS BIGINT)), 0) AS totalViews,
          COALESCE(SUM(CAST(COALESCE(LuotThich, 0) AS BIGINT)), 0) AS totalLikes,
          COALESCE(SUM(CAST(COALESCE(LuotVoTay, 0) AS BIGINT)), 0) AS totalClaps,
          COUNT(CASE WHEN TrangThai = 'published' THEN 1 END) AS publishedCount,
          COUNT(CASE WHEN TrangThai = 'draft' THEN 1 END) AS draftCount,
          COUNT(CASE WHEN TrangThai = 'pending' THEN 1 END) AS pendingCount
        FROM dbo.ARTICLES
      `);
      return res.recordset[0];
    } catch (err) {
      console.error('MSSQL Stats Query Error:', err.message);
    }
  }
  return null;
}

module.exports = {
  getArticleStatsFromDb,
  sqlConfig,
  isMssqlConnected: () => isMssqlConnected,
  getArticlesFromDb,
  insertArticleToDb,
  updateArticleInDb,
  deleteArticleFromDb,
  incrementArticleReactionInDb,
  getCommentsFromDb,
  insertCommentToDb,
  getDocumentsFromDb,
  getCategoriesFromDb,
  getOrgDataFromDb,
  insertCadreToDb,
  updateCadreInDb,
  deleteCadreFromDb,
  updateUnionBranchInDb,
  getMonthlyReportsFromDb,
  getWelfareFromDb,
  getUsersFromDb,
  getTemplatesFromDb,
  insertTemplateToDb,
  deleteTemplateFromDb,
  incrementTemplateDownloadInDb,
  getWelfareApplicationsFromDb,
  insertWelfareApplicationToDb,
  updateWelfareApplicationInDb,
  deleteWelfareApplicationInDb,
  getWelfareFundFromDb,
  getWelfareTransactionsFromDb,
  depositWelfareFundInDb,
  disburseWelfareFundInDb,
  getFeedbackFromDb,
  insertFeedbackToDb,
  updateFeedbackInDb,
  deleteFeedbackFromDb
};
