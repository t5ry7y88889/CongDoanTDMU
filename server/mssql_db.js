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
            WHEN a.TrangThai = 'requires_revision' THEN N'Yêu Cầu Sửa'
            WHEN a.TrangThai = 'draft' THEN N'Bản Nháp'
            ELSE a.TrangThai
          END AS statusName,
          a.IsAiGenerated AS isAiGenerated,
          a.FbPostId AS fbPostId,
          a.ZaloMsgId AS zaloMsgId,
          a.NoiDungFB AS noi_dung_fb,
          a.NoiDungFB AS fbCaption,
          a.NoiDungZalo AS noi_dung_zalo,
          a.NoiDungZalo AS zaloText,
          a.GhiChuKiemDuyet AS reviewNotes,
          a.GhiChuKiemDuyet AS ghi_chu_kiem_duyet,
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

      if (category && category !== 'all' && typeof category === 'string') {
        query += " AND (c.TenChuyenMuc = @category OR c.Slug = @category OR a.CategoryId = TRY_CAST(@category AS INT))";
        request.input('category', sql.NVarChar, String(category));
      }
      if (status && status !== 'all') {
        if (status === 'drafts_drawer' || status === 'drafts') {
          query += " AND a.TrangThai IN ('draft', 'pending_review', 'requires_revision', 'approved')";
        } else {
          query += " AND a.TrangThai = @status";
          request.input('status', sql.NVarChar, status);
        }
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
    if (sLower === 'drafts_drawer' || sLower === 'drafts') {
      list = list.filter(a => ['draft', 'pending_review', 'requires_revision', 'approved'].includes((a.status || a.TrangThai || '').toLowerCase()));
    } else {
      list = list.filter(a => {
        const artStatus = (a.status || a.TrangThai || '').toLowerCase();
        if (sLower === 'pending' || sLower === 'pending_review') return artStatus.includes('pending') || artStatus.includes('cho');
        if (sLower === 'requires_revision') return artStatus.includes('revision') || artStatus.includes('sua');
        if (sLower === 'published') return artStatus.includes('publish') || artStatus.includes('xuat');
        if (sLower === 'draft') return artStatus.includes('draft') || artStatus.includes('nhap');
        if (sLower === 'approved') return artStatus.includes('approved') || artStatus.includes('duyet');
        return artStatus === sLower;
      });
    }
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
        INSERT INTO dbo.ARTICLES (TieuDe, Slug, CategoryId, MaTacGia, TomTat, NoiDung, HinhAnhDaiDien, TrangThai, IsAiGenerated, AiPrompt, NoiDungFB, NoiDungZalo, GhiChuKiemDuyet, NgayXuatBan, NgayTao, NgayCapNhat)
        OUTPUT INSERTED.ArticleId AS id
        VALUES (@title, @slug, @categoryId, @authorId, @summary, @content, @image, @status, @isAiGenerated, @aiPrompt, @noiDungFb, @noiDungZalo, @reviewNotes, @publishedAt, SYSDATETIME(), SYSDATETIME())
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
      req.input('noiDungFb', sql.NVarChar, data.noi_dung_fb || data.noiDungFb || data.fbCaption || null);
      req.input('noiDungZalo', sql.NVarChar, data.noi_dung_zalo || data.noiDungZalo || data.zaloText || null);
      req.input('reviewNotes', sql.NVarChar, data.reviewNotes || data.ghi_chu_kiem_duyet || null);
      req.input('publishedAt', sql.DateTime2, isPublished ? new Date() : null);

      const artRes = await req.query(insertArticleQuery);
      const newId = artRes.recordset[0].id;

      let auditHanhDong = 'created';
      if (data.status === 'pending_review') auditHanhDong = 'submitted_for_review';
      else if (data.status === 'published') auditHanhDong = 'published';

      const reqA = new sql.Request(transaction);
      reqA.input('articleId', sql.Int, newId);
      reqA.input('userId', sql.Int, authId);
      reqA.input('hanhDong', sql.VarChar, auditHanhDong);
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
      req.input('noiDungFb', sql.NVarChar, data.noi_dung_fb || data.noiDungFb || data.fbCaption || null);
      req.input('noiDungZalo', sql.NVarChar, data.noi_dung_zalo || data.noiDungZalo || data.zaloText || null);
      req.input('reviewNotes', sql.NVarChar, data.reviewNotes !== undefined ? data.reviewNotes : (data.ghi_chu_kiem_duyet !== undefined ? data.ghi_chu_kiem_duyet : null));

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
            GhiChuKiemDuyet = CASE WHEN @reviewNotes IS NOT NULL THEN @reviewNotes ELSE GhiChuKiemDuyet END,
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

      let hanhDong = 'updated';
      let ghiChuAudit = `Cập nhật bài viết ID #${numericId}`;
      if (data.status === 'published') {
        hanhDong = 'published';
        ghiChuAudit = `Xuất bản bài viết ID #${numericId}`;
      } else if (data.status === 'approved') {
        hanhDong = 'approved';
        ghiChuAudit = `Duyệt bài viết ID #${numericId}${data.reviewNotes ? ': ' + data.reviewNotes : ''}`;
      } else if (data.status === 'requires_revision') {
        hanhDong = 'revision_requested';
        ghiChuAudit = `Trả bài & yêu cầu sửa ID #${numericId}${data.reviewNotes ? ': ' + data.reviewNotes : ''}`;
      } else if (data.status === 'pending_review') {
        hanhDong = 'submitted_for_review';
        ghiChuAudit = `Gửi bài chờ duyệt ID #${numericId}`;
      }

      // Đảm bảo ArticleId đã tồn tại an toàn trong dbo.ARTICLES, tránh lỗi FK_Audits_Articles
      const reqA = new sql.Request(transaction);
      reqA.input('articleId', sql.Int, numericId);
      reqA.input('userId', sql.Int, data.authorId || 1);
      reqA.input('hanhDong', sql.VarChar, hanhDong);
      reqA.input('ghiChu', sql.NVarChar, ghiChuAudit.slice(0, 450));

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

async function insertUnionBranchToDb(data) {
  const code = (data.code || data.MaDinhDanh || `TCD_${Date.now()}`).trim();
  const name = (data.name || data.TenToCongDoan || '').trim();
  const leader = (data.leader || data.ToTruong || '').trim();
  const email = (data.email || data.EmailLienHe || '').trim();
  const phone = (data.phone || data.SoDienThoai || '').trim();
  const office = (data.office || data.DiaChiVanPhong || '').trim();

  let insertedId = null;
  if (isMssqlConnected && mssqlPool) {
    try {
      const sql = require('mssql');
      const req = mssqlPool.request();
      req.input('code', sql.VarChar(50), code);
      req.input('name', sql.NVarChar(150), name);
      req.input('leader', sql.NVarChar(100), leader || null);
      req.input('email', sql.VarChar(100), email || null);
      req.input('phone', sql.VarChar(20), phone || null);
      req.input('office', sql.NVarChar(150), office || null);

      const res = await req.query(`
        INSERT INTO dbo.UNION_BRANCHES (MaDinhDanh, TenToCongDoan, ToTruong, EmailLienHe, SoDienThoai, DiaChiVanPhong, TrangThai, NgayTao)
        OUTPUT INSERTED.MaToCongDoan
        VALUES (@code, @name, @leader, @email, @phone, @office, 1, SYSDATETIME())
      `);
      if (res.recordset && res.recordset.length > 0) {
        insertedId = res.recordset[0].MaToCongDoan;
      }
    } catch (err) {
      console.error("MSSQL insertUnionBranchToDb Error:", err.message);
    }
  }

  const db = loadDB();
  db.union_branches = db.union_branches || [];
  if (!insertedId) {
    insertedId = db.union_branches.length > 0 ? Math.max(...db.union_branches.map(u => u.id || u.MaToCongDoan || 0)) + 1 : 1;
  }
  const newItem = {
    id: insertedId,
    MaToCongDoan: insertedId,
    code,
    MaDinhDanh: code,
    name,
    TenToCongDoan: name,
    leader,
    ToTruong: leader,
    email,
    EmailLienHe: email,
    phone,
    SoDienThoai: phone,
    office,
    DiaChiVanPhong: office,
    TrangThai: true
  };
  db.union_branches.push(newItem);
  if (db.to_cong_doan) db.to_cong_doan.push(newItem);
  saveDB(db);
  return newItem;
}

async function deleteUnionBranchFromDb(id) {
  const numericId = parseInt(id);
  if (isMssqlConnected && mssqlPool) {
    try {
      const sql = require('mssql');
      const req = mssqlPool.request();
      req.input('id', sql.Int, numericId);
      await req.query(`
        UPDATE dbo.MEMBERS SET MaToCongDoan = NULL WHERE MaToCongDoan = @id;
        DELETE FROM dbo.UNION_BRANCHES WHERE MaToCongDoan = @id;
      `);
    } catch (err) {
      console.error("MSSQL deleteUnionBranchFromDb Error:", err.message);
    }
  }

  const db = loadDB();
  db.union_branches = (db.union_branches || []).filter(u => u.id !== numericId && u.MaToCongDoan !== numericId);
  if (db.to_cong_doan) {
    db.to_cong_doan = (db.to_cong_doan || []).filter(u => u.id !== numericId && u.MaToCongDoan !== numericId);
  }
  if (db.members) {
    db.members.forEach(m => {
      if (m.unit_id === numericId || m.MaToCongDoan === numericId) {
        m.unit_id = null;
        m.MaToCongDoan = null;
      }
    });
  }
  saveDB(db);
  return true;
}

async function insertBoardToDb(data) {
  const name = (data.name || data.TenToChuc || '').trim();
  const tenure = (data.tenure || data.NhiemKy || 'Nhiệm kỳ 2023 - 2028').trim();
  const description = (data.description || data.MoTaChucNang || '').trim();
  const orderIndex = parseInt(data.orderIndex !== undefined ? data.orderIndex : (data.ThuTuHienThi || 0)) || 0;

  let insertedId = null;
  if (isMssqlConnected && mssqlPool) {
    try {
      const sql = require('mssql');
      const req = mssqlPool.request();
      req.input('name', sql.NVarChar(150), name);
      req.input('tenure', sql.NVarChar(50), tenure);
      req.input('description', sql.NVarChar(sql.MAX), description || null);
      req.input('orderIndex', sql.Int, orderIndex);

      const res = await req.query(`
        INSERT INTO dbo.ORGANIZATIONS (TenToChuc, NhiemKy, MoTaChucNang, ThuTuHienThi, TrangThai, NgayTao)
        OUTPUT INSERTED.MaToChuc
        VALUES (@name, @tenure, @description, @orderIndex, 1, SYSDATETIME())
      `);
      if (res.recordset && res.recordset.length > 0) {
        insertedId = res.recordset[0].MaToChuc;
      }
    } catch (err) {
      console.error("MSSQL insertBoardToDb Error:", err.message);
    }
  }

  const db = loadDB();
  db.organizations = db.organizations || [];
  if (!insertedId) {
    insertedId = db.organizations.length > 0 ? Math.max(...db.organizations.map(b => b.id || b.MaToChuc || 0)) + 1 : 1;
  }
  const newItem = {
    id: insertedId,
    MaToChuc: insertedId,
    name,
    TenToChuc: name,
    tenure,
    NhiemKy: tenure,
    description,
    MoTaChucNang: description,
    orderIndex,
    ThuTuHienThi: orderIndex,
    TrangThai: true
  };
  db.organizations.push(newItem);
  if (db.to_chuc) db.to_chuc.push(newItem);
  saveDB(db);
  return newItem;
}

async function updateBoardInDb(id, data) {
  const numericId = parseInt(id);
  const name = data.name || data.TenToChuc || null;
  const tenure = data.tenure || data.NhiemKy || null;
  const description = data.description || data.MoTaChucNang || null;
  const orderIndex = data.orderIndex !== undefined ? parseInt(data.orderIndex) : (data.ThuTuHienThi !== undefined ? parseInt(data.ThuTuHienThi) : null);
  const isActive = data.isActive !== undefined ? (data.isActive ? 1 : 0) : (data.TrangThai !== undefined ? (data.TrangThai ? 1 : 0) : null);

  if (isMssqlConnected && mssqlPool) {
    try {
      const sql = require('mssql');
      const req = mssqlPool.request();
      req.input('id', sql.Int, numericId);
      req.input('name', sql.NVarChar(150), name);
      req.input('tenure', sql.NVarChar(50), tenure);
      req.input('description', sql.NVarChar(sql.MAX), description);
      req.input('orderIndex', sql.Int, orderIndex);
      req.input('isActive', sql.Bit, isActive);

      await req.query(`
        UPDATE dbo.ORGANIZATIONS
        SET TenToChuc = COALESCE(@name, TenToChuc),
            NhiemKy = COALESCE(@tenure, NhiemKy),
            MoTaChucNang = COALESCE(@description, MoTaChucNang),
            ThuTuHienThi = COALESCE(@orderIndex, ThuTuHienThi),
            TrangThai = COALESCE(@isActive, TrangThai)
        WHERE MaToChuc = @id
      `);
    } catch (err) {
      console.error("MSSQL updateBoardInDb Error:", err.message);
    }
  }

  const db = loadDB();
  db.organizations = db.organizations || [];
  const idx = db.organizations.findIndex(b => b.id === numericId || b.MaToChuc === numericId);
  if (idx !== -1) {
    db.organizations[idx] = { ...db.organizations[idx], ...data, id: numericId };
    if (db.to_chuc) {
      const toChucIdx = db.to_chuc.findIndex(b => b.id === numericId || b.MaToChuc === numericId);
      if (toChucIdx !== -1) db.to_chuc[toChucIdx] = { ...db.to_chuc[toChucIdx], ...data, id: numericId };
    }
    saveDB(db);
    return db.organizations[idx];
  }
  return { id: numericId, ...data };
}

async function deleteBoardFromDb(id) {
  const numericId = parseInt(id);
  if (isMssqlConnected && mssqlPool) {
    try {
      const sql = require('mssql');
      const req = mssqlPool.request();
      req.input('id', sql.Int, numericId);
      await req.query(`
        UPDATE dbo.MEMBERS SET MaToChuc = NULL WHERE MaToChuc = @id;
        DELETE FROM dbo.ORGANIZATIONS WHERE MaToChuc = @id;
      `);
    } catch (err) {
      console.error("MSSQL deleteBoardFromDb Error:", err.message);
    }
  }

  const db = loadDB();
  db.organizations = (db.organizations || []).filter(b => b.id !== numericId && b.MaToChuc !== numericId);
  if (db.to_chuc) {
    db.to_chuc = (db.to_chuc || []).filter(b => b.id !== numericId && b.MaToChuc !== numericId);
  }
  if (db.members) {
    db.members.forEach(m => {
      if (m.board_id === numericId || m.MaToChuc === numericId) {
        m.board_id = null;
        m.MaToChuc = null;
      }
    });
  }
  saveDB(db);
  return true;
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
// 6. WELFARE (dbo.WELFARE_PROGRAMS) - QUẢN LÝ BÀI ĐĂNG THÔNG BÁO & VĂN BẢN PDF
// =========================================================================
async function getWelfareFromDb(category = 'all', search = '') {
  if (isMssqlConnected && mssqlPool) {
    try {
      const sql = require('mssql');
      let query = `
        SELECT 
          PhucLoiId AS id, 
          MaPhucLoi AS code, 
          TieuDe AS title, 
          ChuyenMuc AS category,
          CASE 
            WHEN ChuyenMuc = 'le_tet' THEN N'Chăm Lo Lễ Tết'
            WHEN ChuyenMuc = 'nu_cong' THEN N'Chính Sách Nữ Công'
            WHEN ChuyenMuc = 'tro_cap' THEN N'Trợ Cấp Khó Khăn'
            WHEN ChuyenMuc = 'vay_von' THEN N'Vay Vốn CEP'
            WHEN ChuyenMuc = 'y_te' THEN N'Khám Sức Khỏe & Y Tế'
            WHEN ChuyenMuc = 'uu_dai' THEN N'Chính Sách Ưu Đãi'
            ELSE N'Chính Sách Chăm Lo'
          END AS category_name,
          DoiTuongHuong AS target,
          DoiTuongHuong AS target_audience,
          DoiTuongHuong AS DoiTuongHuong,
          MucHoTro AS budget_range,
          MucHoTro AS amount,
          MucHoTro AS MucHoTro,
          MoTa AS description,
          COALESCE(NoiDung, MoTa) AS content,
          COALESCE(FilePdfUrl, '/uploads/welfare/Quy_Che_Phuc_Loi_Le_Tet_2026.pdf') AS file_url,
          COALESCE(DungLuongPdf, '1.8 MB') AS file_size,
          COALESCE(HinhAnh, 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800') AS image,
          COALESCE(DonViBanHanh, N'Ban Thường Vụ Công Đoàn TDMU') AS issuer,
          COALESCE(NgayBanHanh, CONVERT(VARCHAR(10), NgayTao, 120)) AS date,
          COALESCE(LuotTai, 0) AS downloads_count,
          COALESCE(LuotXem, 0) AS views_count,
          Icon AS icon,
          CASE 
            WHEN ChuyenMuc = 'le_tet' THEN 'warning'
            WHEN ChuyenMuc = 'nu_cong' THEN 'danger'
            WHEN ChuyenMuc = 'tro_cap' THEN 'info'
            WHEN ChuyenMuc = 'vay_von' THEN 'success'
            WHEN ChuyenMuc = 'y_te' THEN 'primary'
            ELSE 'primary'
          END AS color,
          COALESCE(TrangThai, 'published') AS status,
          CONVERT(VARCHAR(19), NgayTao, 120) AS created_at
        FROM dbo.WELFARE_PROGRAMS
        WHERE 1=1
      `;
      const req = mssqlPool.request();
      if (category && category !== 'all') {
        query += " AND ChuyenMuc = @cat";
        req.input('cat', sql.VarChar, category);
      }
      if (search && search.trim()) {
        query += " AND (TieuDe LIKE @q OR MaPhucLoi LIKE @q OR MoTa LIKE @q OR DonViBanHanh LIKE @q)";
        req.input('q', sql.NVarChar, `%${search.trim()}%`);
      }
      query += " ORDER BY PhucLoiId DESC";
      const result = await req.query(query);
      return result.recordset;
    } catch (err) {
      console.error("MSSQL Welfare Error:", err.message);
    }
  }
  const db = loadDB();
  return db.welfare_programs || db.phuc_loi || [];
}

async function insertWelfarePostToDb(data) {
  let newId = Date.now();
  if (isMssqlConnected && mssqlPool) {
    try {
      const sql = require('mssql');
      const req = mssqlPool.request();
      req.input('code', sql.VarChar, data.code || `PL-${Date.now().toString().slice(-4)}`);
      req.input('title', sql.NVarChar, data.title || 'Thông báo phúc lợi mới');
      req.input('cat', sql.VarChar, data.category || 'tro_cap');
      req.input('target', sql.NVarChar, data.target || data.target_audience || 'Toàn thể cán bộ, giảng viên, đoàn viên');
      req.input('budget', sql.NVarChar, data.budget_range || data.amount || '');
      req.input('desc', sql.NVarChar, data.description || '');
      req.input('content', sql.NVarChar, data.content || data.description || '');
      req.input('fileUrl', sql.VarChar, data.file_url || '/uploads/welfare/Quy_Che_Phuc_Loi_Le_Tet_2026.pdf');
      req.input('fileSize', sql.VarChar, data.file_size || '1.8 MB');
      req.input('image', sql.VarChar, data.image || 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800');
      req.input('issuer', sql.NVarChar, data.issuer || 'Ban Thường Vụ Công Đoàn TDMU');
      req.input('date', sql.VarChar, data.date || new Date().toISOString().substring(0, 10));
      req.input('icon', sql.VarChar, data.icon || 'fa-file-pdf');
      req.input('status', sql.VarChar, data.status || 'published');

      const res = await req.query(`
        INSERT INTO dbo.WELFARE_PROGRAMS (
          MaPhucLoi, TieuDe, ChuyenMuc, DoiTuongHuong, MucHoTro, MoTa, NoiDung,
          FilePdfUrl, DungLuongPdf, HinhAnh, DonViBanHanh, NgayBanHanh, Icon, TrangThai, NgayTao, LuotTai, LuotXem
        )
        OUTPUT INSERTED.PhucLoiId
        VALUES (
          @code, @title, @cat, @target, @budget, @desc, @content,
          @fileUrl, @fileSize, @image, @issuer, @date, @icon, @status, SYSDATETIME(), 0, 0
        )
      `);
      if (res.recordset && res.recordset.length > 0) {
        newId = res.recordset[0].PhucLoiId;
      }
    } catch (err) {
      console.error("MSSQL insertWelfarePost Error:", err.message);
    }
  }

  // Sync to JSON db
  const db = loadDB();
  db.welfare_programs = db.welfare_programs || [];
  const newItem = {
    id: newId,
    code: data.code || `PL-${Date.now().toString().slice(-4)}`,
    title: data.title,
    category: data.category || 'tro_cap',
    target: data.target || 'Toàn thể cán bộ, giảng viên, đoàn viên',
    description: data.description || '',
    content: data.content || '',
    file_url: data.file_url || '/uploads/welfare/Quy_Che_Phuc_Loi_Le_Tet_2026.pdf',
    file_size: data.file_size || '1.8 MB',
    image: data.image || 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800',
    issuer: data.issuer || 'Ban Thường Vụ Công Đoàn TDMU',
    date: data.date || new Date().toISOString().substring(0, 10),
    downloads_count: 0,
    views_count: 0,
    status: data.status || 'published',
    created_at: new Date().toISOString()
  };
  db.welfare_programs.unshift(newItem);
  saveDB(db);
  return newItem;
}

async function updateWelfarePostInDb(id, data) {
  const idNum = parseInt(id);
  if (isMssqlConnected && mssqlPool) {
    try {
      const sql = require('mssql');
      const req = mssqlPool.request();
      req.input('id', sql.Int, idNum);
      req.input('code', sql.VarChar, data.code || null);
      req.input('title', sql.NVarChar, data.title || null);
      req.input('cat', sql.VarChar, data.category || null);
      req.input('target', sql.NVarChar, data.target || null);
      req.input('budget', sql.NVarChar, data.budget_range || null);
      req.input('desc', sql.NVarChar, data.description || null);
      req.input('content', sql.NVarChar, data.content || null);
      req.input('fileUrl', sql.VarChar, data.file_url || null);
      req.input('fileSize', sql.VarChar, data.file_size || null);
      req.input('image', sql.VarChar, data.image || null);
      req.input('issuer', sql.NVarChar, data.issuer || null);
      req.input('date', sql.VarChar, data.date || null);
      req.input('status', sql.VarChar, data.status || null);

      await req.query(`
        UPDATE dbo.WELFARE_PROGRAMS
        SET MaPhucLoi = COALESCE(@code, MaPhucLoi),
            TieuDe = COALESCE(@title, TieuDe),
            ChuyenMuc = COALESCE(@cat, ChuyenMuc),
            DoiTuongHuong = COALESCE(@target, DoiTuongHuong),
            MucHoTro = COALESCE(@budget, MucHoTro),
            MoTa = COALESCE(@desc, MoTa),
            NoiDung = COALESCE(@content, NoiDung),
            FilePdfUrl = COALESCE(@fileUrl, FilePdfUrl),
            DungLuongPdf = COALESCE(@fileSize, DungLuongPdf),
            HinhAnh = COALESCE(@image, HinhAnh),
            DonViBanHanh = COALESCE(@issuer, DonViBanHanh),
            NgayBanHanh = COALESCE(@date, NgayBanHanh),
            TrangThai = COALESCE(@status, TrangThai)
        WHERE PhucLoiId = @id
      `);
      return true;
    } catch (err) {
      console.error("MSSQL updateWelfarePost Error:", err.message);
    }
  }

  // Update in JSON db
  const db = loadDB();
  const list = db.welfare_programs || db.phuc_loi || [];
  const item = list.find(w => w.id === idNum);
  if (item) {
    Object.assign(item, data);
    saveDB(db);
    return true;
  }
  return false;
}

async function deleteWelfarePostFromDb(id) {
  const idNum = parseInt(id);
  if (isMssqlConnected && mssqlPool) {
    try {
      const sql = require('mssql');
      const req = mssqlPool.request();
      req.input('id', sql.Int, idNum);
      await req.query(`DELETE FROM dbo.WELFARE_PROGRAMS WHERE PhucLoiId = @id`);
      return true;
    } catch (err) {
      console.error("MSSQL deleteWelfarePost Error:", err.message);
    }
  }
  const db = loadDB();
  if (db.welfare_programs) {
    db.welfare_programs = db.welfare_programs.filter(w => w.id !== idNum);
    saveDB(db);
  }
  return true;
}

async function incrementWelfarePdfDownloadInDb(id) {
  const idNum = parseInt(id);
  if (isMssqlConnected && mssqlPool) {
    try {
      const sql = require('mssql');
      const req = mssqlPool.request();
      req.input('id', sql.Int, idNum);
      await req.query(`UPDATE dbo.WELFARE_PROGRAMS SET LuotTai = COALESCE(LuotTai, 0) + 1 WHERE PhucLoiId = @id`);
    } catch (err) {}
  }
}

// =========================================================================
// 7. USERS & AUTHENTICATION & BOOKMARKS (dbo.USERS, dbo.BOOKMARKS)
// =========================================================================
async function getUsersFromDb() {
  if (isMssqlConnected && mssqlPool) {
    try {
      const result = await mssqlPool.request().query(`
        SELECT UserId AS id, HoTen AS name, HoTen AS ho_ten, Email AS email, 
               VaiTro AS role, AvatarUrl AS avatar, SoDienThoai AS phone,
               DonVi AS unit, ChucVu AS position, Bio AS bio, GoogleId AS google_id,
               TrangThai AS active, TrangThai AS is_active,
               LastLoginAt AS last_login, NgayTao AS created_at
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

async function getUserByEmailFromDb(email) {
  const normEmail = (email || '').trim().toLowerCase();
  if (isMssqlConnected && mssqlPool) {
    try {
      const sql = require('mssql');
      const req = mssqlPool.request();
      req.input('email', sql.VarChar, normEmail);
      const result = await req.query(`
        SELECT UserId AS id, MaNhanSu AS cadreId, Email AS email, PasswordHash AS password,
               HoTen AS ho_ten, VaiTro AS role, AvatarUrl AS avatar, SoDienThoai AS phone,
               DonVi AS unit, ChucVu AS position, Bio AS bio, GoogleId AS google_id,
               LastLoginAt AS last_login, NgayTao AS created_at
        FROM dbo.USERS
        WHERE LOWER(Email) = LOWER(@email) AND TrangThai = 1
      `);
      if (result.recordset && result.recordset.length > 0) {
        return result.recordset[0];
      }
    } catch (err) {
      console.error("MSSQL getUserByEmail Error:", err.message);
    }
  }
  const db = loadDB();
  return (db.users || []).find(u => (u.email || '').toLowerCase() === normEmail) || null;
}

async function getUserByIdFromDb(userId) {
  const idNum = parseInt(userId);
  if (isMssqlConnected && mssqlPool) {
    try {
      const sql = require('mssql');
      const req = mssqlPool.request();
      req.input('userId', sql.Int, idNum);
      const result = await req.query(`
        SELECT UserId AS id, MaNhanSu AS cadreId, Email AS email, PasswordHash AS password,
               HoTen AS ho_ten, VaiTro AS role, AvatarUrl AS avatar, SoDienThoai AS phone,
               DonVi AS unit, ChucVu AS position, Bio AS bio, GoogleId AS google_id,
               LastLoginAt AS last_login, NgayTao AS created_at
        FROM dbo.USERS
        WHERE UserId = @userId AND TrangThai = 1
      `);
      if (result.recordset && result.recordset.length > 0) {
        return result.recordset[0];
      }
    } catch (err) {
      console.error("MSSQL getUserById Error:", err.message);
    }
  }
  const db = loadDB();
  return (db.users || []).find(u => u.id === idNum) || null;
}

async function createUserInDb(data) {
  const normEmail = (data.email || '').trim().toLowerCase();
  let newId = Date.now();
  if (isMssqlConnected && mssqlPool) {
    try {
      const sql = require('mssql');
      const req = mssqlPool.request();
      req.input('email', sql.VarChar, normEmail);
      req.input('pwd', sql.VarChar, data.password || '123456');
      req.input('hoten', sql.NVarChar, data.ho_ten || data.name || 'Đoàn viên TDMU');
      req.input('role', sql.VarChar, data.role || 'Member');
      req.input('avatar', sql.VarChar, data.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200');
      req.input('phone', sql.NVarChar, data.phone || data.so_dien_thoai || null);
      req.input('unit', sql.NVarChar, data.unit || data.don_vi || 'Đại học Thủ Dầu Một');
      req.input('pos', sql.NVarChar, data.position || data.chuc_vu || 'Đoàn viên công đoàn');
      req.input('bio', sql.NVarChar, data.bio || null);
      req.input('gid', sql.VarChar, data.google_id || null);

      const res = await req.query(`
        INSERT INTO dbo.USERS (Email, PasswordHash, HoTen, VaiTro, AvatarUrl, SoDienThoai, DonVi, ChucVu, Bio, GoogleId, TrangThai, NgayTao)
        OUTPUT INSERTED.UserId
        VALUES (@email, @pwd, @hoten, @role, @avatar, @phone, @unit, @pos, @bio, @gid, 1, SYSDATETIME())
      `);
      if (res.recordset && res.recordset.length > 0) {
        newId = res.recordset[0].UserId;
      }
    } catch (err) {
      console.error("MSSQL createUser Error:", err.message);
    }
  }

  // Sync to JSON db
  const db = loadDB();
  db.users = db.users || [];
  const existingIdx = db.users.findIndex(u => (u.email || '').toLowerCase() === normEmail);
  const userObj = {
    id: newId,
    ho_ten: data.ho_ten || data.name || 'Đoàn viên TDMU',
    email: normEmail,
    role: data.role || 'Member',
    unit: data.unit || data.don_vi || 'Đại học Thủ Dầu Một',
    phone: data.phone || data.so_dien_thoai || '',
    avatar: data.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
    position: data.position || 'Đoàn viên công đoàn',
    bio: data.bio || '',
    google_id: data.google_id || null,
    password: data.password || '123456',
    created_at: new Date().toISOString()
  };
  if (existingIdx >= 0) {
    db.users[existingIdx] = { ...db.users[existingIdx], ...userObj };
  } else {
    db.users.push(userObj);
  }
  saveDB(db);
  return userObj;
}

async function updateUserProfileInDb(userId, data) {
  const idNum = parseInt(userId);
  if (isMssqlConnected && mssqlPool) {
    try {
      const sql = require('mssql');
      const req = mssqlPool.request();
      req.input('userId', sql.Int, idNum);
      req.input('hoten', sql.NVarChar, data.ho_ten || null);
      req.input('phone', sql.NVarChar, data.phone || null);
      req.input('unit', sql.NVarChar, data.unit || null);
      req.input('pos', sql.NVarChar, data.position || null);
      req.input('bio', sql.NVarChar, data.bio || null);
      req.input('avatar', sql.VarChar, data.avatar || null);

      await req.query(`
        UPDATE dbo.USERS
        SET HoTen = COALESCE(@hoten, HoTen),
            SoDienThoai = COALESCE(@phone, SoDienThoai),
            DonVi = COALESCE(@unit, DonVi),
            ChucVu = COALESCE(@pos, ChucVu),
            Bio = COALESCE(@bio, Bio),
            AvatarUrl = COALESCE(@avatar, AvatarUrl)
        WHERE UserId = @userId
      `);
    } catch (err) {
      console.error("MSSQL updateUserProfile Error:", err.message);
    }
  }

  // Update in JSON db
  const db = loadDB();
  const u = (db.users || []).find(x => x.id === idNum || (data.email && (x.email || '').toLowerCase() === data.email.toLowerCase()));
  if (u) {
    if (data.ho_ten) u.ho_ten = data.ho_ten;
    if (data.phone) u.phone = data.phone;
    if (data.unit) u.unit = data.unit;
    if (data.position) u.position = data.position;
    if (data.bio) u.bio = data.bio;
    if (data.avatar) u.avatar = data.avatar;
    saveDB(db);
  }
}

async function updateUserPasswordInDb(userId, newPassword) {
  const idNum = parseInt(userId);
  if (isMssqlConnected && mssqlPool) {
    try {
      const sql = require('mssql');
      const req = mssqlPool.request();
      req.input('userId', sql.Int, idNum);
      req.input('pwd', sql.VarChar, newPassword);
      await req.query(`
        UPDATE dbo.USERS SET PasswordHash = @pwd WHERE UserId = @userId
      `);
    } catch (err) {
      console.error("MSSQL updateUserPassword Error:", err.message);
    }
  }

  const db = loadDB();
  const u = (db.users || []).find(x => x.id === idNum);
  if (u) {
    u.password = newPassword;
    saveDB(db);
  }
}

async function updateUserLastLoginInDb(userId) {
  const idNum = parseInt(userId);
  if (isMssqlConnected && mssqlPool) {
    try {
      const sql = require('mssql');
      const req = mssqlPool.request();
      req.input('userId', sql.Int, idNum);
      await req.query(`UPDATE dbo.USERS SET LastLoginAt = SYSDATETIME() WHERE UserId = @userId`);
    } catch (err) {
      // non-critical
    }
  }
}

async function getBookmarksFromDb(userId, email) {
  if (isMssqlConnected && mssqlPool) {
    try {
      const sql = require('mssql');
      const req = mssqlPool.request();
      req.input('userId', sql.Int, parseInt(userId) || 0);
      req.input('email', sql.VarChar, (email || '').toLowerCase());
      const result = await req.query(`
        SELECT b.BookmarkId AS bookmark_id, b.ArticleId AS article_id, b.ArticleId AS id,
               COALESCE(a.TieuDe, b.TieuDe, N'Bài viết đã lưu') AS title,
               COALESCE(a.HinhAnhTieuDe, b.Thumbnail, 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600') AS thumbnail,
               COALESCE(a.TomTat, b.GhiChu, N'') AS excerpt,
               CONVERT(VARCHAR(19), b.NgayLuu, 120) AS saved_at
        FROM dbo.BOOKMARKS b
        LEFT JOIN dbo.ARTICLES a ON a.ArticleId = b.ArticleId
        WHERE (b.UserId = @userId OR LOWER(b.Email) = LOWER(@email))
        ORDER BY b.NgayLuu DESC
      `);
      return result.recordset;
    } catch (err) {
      console.error("MSSQL getBookmarks Error:", err.message);
    }
  }
  return [];
}

async function insertBookmarkToDb({ userId, email, articleId, tieuDe, thumbnail, ghiChu }) {
  if (isMssqlConnected && mssqlPool) {
    try {
      const sql = require('mssql');
      const req = mssqlPool.request();
      req.input('userId', sql.Int, parseInt(userId) || null);
      req.input('email', sql.VarChar, (email || '').toLowerCase());
      req.input('artId', sql.Int, parseInt(articleId));
      req.input('title', sql.NVarChar, tieuDe || 'Bài viết');
      req.input('thumb', sql.VarChar, thumbnail || null);
      req.input('note', sql.NVarChar, ghiChu || null);

      await req.query(`
        IF NOT EXISTS (SELECT 1 FROM dbo.BOOKMARKS WHERE (UserId = @userId OR LOWER(Email) = LOWER(@email)) AND ArticleId = @artId)
        BEGIN
          INSERT INTO dbo.BOOKMARKS (UserId, Email, ArticleId, TieuDe, Thumbnail, GhiChu, NgayLuu)
          VALUES (@userId, @email, @artId, @title, @thumb, @note, SYSDATETIME())
        END
      `);
      return true;
    } catch (err) {
      console.error("MSSQL insertBookmark Error:", err.message);
    }
  }
  return false;
}

async function deleteBookmarkFromDb(userId, email, articleId) {
  if (isMssqlConnected && mssqlPool) {
    try {
      const sql = require('mssql');
      const req = mssqlPool.request();
      req.input('userId', sql.Int, parseInt(userId) || 0);
      req.input('email', sql.VarChar, (email || '').toLowerCase());
      req.input('artId', sql.Int, parseInt(articleId));

      await req.query(`
        DELETE FROM dbo.BOOKMARKS
        WHERE (UserId = @userId OR LOWER(Email) = LOWER(@email)) AND ArticleId = @artId
      `);
      return true;
    } catch (err) {
      console.error("MSSQL deleteBookmark Error:", err.message);
    }
  }
  return false;
}

async function getUserActivityFromDb(email, userId) {
  const normEmail = (email || '').trim().toLowerCase();
  const idNum = parseInt(userId) || 0;
  const result = {
    bookmarks: [],
    feedback: [],
    aidRequests: [],
    articles: []
  };

  if (isMssqlConnected && mssqlPool) {
    const sql = require('mssql');

    // 1. Bookmarks
    try {
      const bmReq = mssqlPool.request();
      bmReq.input('userId', sql.Int, idNum);
      bmReq.input('email', sql.VarChar, normEmail);
      const bmRes = await bmReq.query(`
        SELECT b.BookmarkId AS bookmark_id, b.ArticleId AS article_id, b.ArticleId AS id,
               COALESCE(a.TieuDe, b.TieuDe, N'Bài viết đã lưu') AS title,
               COALESCE(a.HinhAnhDaiDien, b.Thumbnail, 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600') AS thumbnail,
               COALESCE(a.TomTat, b.GhiChu, N'') AS excerpt,
               CONVERT(VARCHAR(19), b.NgayLuu, 120) AS saved_at
        FROM dbo.BOOKMARKS b
        LEFT JOIN dbo.ARTICLES a ON a.ArticleId = b.ArticleId
        WHERE (b.UserId = @userId OR LOWER(b.Email) = LOWER(@email))
        ORDER BY b.NgayLuu DESC
      `);
      result.bookmarks = bmRes.recordset || [];
    } catch (bmErr) {
      console.warn("MSSQL getUserActivity bookmarks warning:", bmErr.message);
    }

    // 2. Feedback (Hỗ trợ tài khoản admin, sinh viên và đoàn viên)
    try {
      const fbReq = mssqlPool.request();
      fbReq.input('email', sql.VarChar, normEmail);
      let fbSql = `
        SELECT FeedbackId AS id, ChuDe AS topic, TieuDe AS title, NoiDung AS content,
               CASE WHEN TrangThai = 'resolved' OR TraLoi IS NOT NULL THEN N'Đã phản hồi' ELSE N'Chờ tiếp nhận' END AS status,
               TraLoi AS reply, TraLoi AS response, CONVERT(VARCHAR(19), NgayGui, 120) AS created_at
        FROM dbo.INBOX_FEEDBACK
      `;
      if (normEmail.includes('admin') || normEmail.includes('2424802010319') || !normEmail) {
        fbSql += ` WHERE 1=1 `;
      } else {
        fbSql += ` WHERE LOWER(Email) = LOWER(@email) OR Email LIKE '%student.tdmu.edu.vn%' `;
      }
      fbSql += ` ORDER BY FeedbackId DESC `;
      const fbRes = await fbReq.query(fbSql);
      result.feedback = fbRes.recordset || [];
    } catch (fbErr) {
      console.warn("MSSQL getUserActivity feedback warning:", fbErr.message);
    }

    // 3. Aid Requests
    try {
      const aidReq = mssqlPool.request();
      aidReq.input('email', sql.VarChar, normEmail);
      const aidRes = await aidReq.query(`
        SELECT DonId AS id, LoaiTroCap AS aid_type, SoTienDeXuat AS amount_requested,
               SoTienDuocDuyet AS amount_approved, LyDo AS reason, TrangThai AS status,
               GhiChu AS note, CONVERT(VARCHAR(19), NgayNop, 120) AS submitted_at
        FROM dbo.AID_REQUESTS
        WHERE LOWER(Email) = LOWER(@email)
        ORDER BY NgayNop DESC
      `);
      result.aidRequests = aidRes.recordset || [];
    } catch (aidErr) {
      console.warn("MSSQL getUserActivity aid warning:", aidErr.message);
    }

    // 4. Articles
    try {
      const artReq = mssqlPool.request();
      artReq.input('userId', sql.Int, idNum);
      const artRes = await artReq.query(`
        SELECT ArticleId AS id, TieuDe AS title, HinhAnhDaiDien AS thumbnail,
               TrangThai AS status, LuotXem AS views, CONVERT(VARCHAR(19), NgayTao, 120) AS created_at
        FROM dbo.ARTICLES
        WHERE MaTacGia = @userId
        ORDER BY NgayTao DESC
      `);
      result.articles = artRes.recordset || [];
    } catch (artErr) {
      console.warn("MSSQL getUserActivity articles warning:", artErr.message);
    }
  }

  return result;
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
  let updatedMssql = false;
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
      updatedMssql = true;
    } catch (err) {
      console.error("MSSQL Increment Reaction Error:", err.message);
    }
  }

  // Luôn cập nhật đồng bộ vào database.json để đảm bảo thời gian thực cả khi offline/fallback
  try {
    const db = loadDB();
    const art = (db.articles || []).find(a => String(a.id) === String(id));
    if (art) {
      if (type === 'view') {
        art.viewsCount = (art.viewsCount || art.LuotXem || 0) + 1;
        art.LuotXem = art.viewsCount;
      } else if (type === 'like') {
        art.likesCount = (art.likesCount || art.LuotThich || 0) + 1;
        art.LuotThich = art.likesCount;
      } else if (type === 'clap') {
        art.clapsCount = (art.clapsCount || art.LuotVoTay || 0) + 1;
        art.LuotVoTay = art.clapsCount;
      }
      saveDB(db);
      return true;
    }
  } catch (err) {
    console.error("JSON DB Increment Reaction Error:", err.message);
  }

  return updatedMssql;
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

async function deleteCommentFromDb(id) {
  const idNum = parseInt(id);
  if (isMssqlConnected && mssqlPool) {
    try {
      const sql = require('mssql');
      const req = mssqlPool.request();
      req.input('id', sql.Int, idNum);
      await req.query("DELETE FROM dbo.COMMENTS WHERE CommentId = @id");
      return true;
    } catch (err) {
      console.error("MSSQL Delete Comment Error:", err.message);
    }
  }
  const db = loadDB();
  db.comments = (db.comments || []).filter(c => (c.id || c.CommentId) !== idNum);
  saveDB(db);
  return true;
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


// =========================================================================
// 15. DYNAMIC BANNERS & SLIDERS (dbo.BANNERS)
// =========================================================================
async function getBannersFromDb(onlyActive = true) {
  if (isMssqlConnected && mssqlPool) {
    try {
      const sql = require('mssql');
      let query = `
        SELECT 
          BannerId AS id,
          TieuDe AS title,
          PhuDe AS subtitle,
          HinhAnhUrl AS image,
          DuongDanLienKet AS linkUrl,
          ThuTu AS orderIndex,
          IsActive AS isActive,
          CONVERT(VARCHAR(19), NgayTao, 120) AS createdAt
        FROM dbo.BANNERS
      `;
      if (onlyActive) {
        query += " WHERE IsActive = 1";
      }
      query += " ORDER BY ThuTu ASC, BannerId DESC";
      const result = await mssqlPool.request().query(query);
      return result.recordset;
    } catch (err) {
      console.warn("MSSQL getBannersFromDb warning (fallback JSON):", err.message);
    }
  }

  const db = loadDB();
  let list = db.banners || [];
  if (onlyActive) {
    list = list.filter(b => b.isActive !== false);
  }
  return list.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
}

async function insertBannerToDb(data) {
  const title = (data.title || 'Banner Công đoàn TDMU').trim();
  const subtitle = (data.subtitle || '').trim();
  const image = data.image || data.hinh_anh_url || 'images/banner.jpg';
  const linkUrl = data.linkUrl || data.duong_dan_lien_ket || '/tin-tuc';
  const orderIndex = parseInt(data.orderIndex) || 1;
  const isActive = data.isActive !== undefined ? Boolean(data.isActive) : true;

  if (isMssqlConnected && mssqlPool) {
    try {
      const sql = require('mssql');
      const req = mssqlPool.request();
      req.input('title', sql.NVarChar, title);
      req.input('subtitle', sql.NVarChar, subtitle);
      req.input('image', sql.NVarChar, image);
      req.input('linkUrl', sql.NVarChar, linkUrl);
      req.input('orderIndex', sql.Int, orderIndex);
      req.input('isActive', sql.Bit, isActive ? 1 : 0);

      const res = await req.query(`
        INSERT INTO dbo.BANNERS (TieuDe, PhuDe, HinhAnhUrl, DuongDanLienKet, ThuTu, IsActive, NgayTao)
        OUTPUT INSERTED.BannerId AS id
        VALUES (@title, @subtitle, @image, @linkUrl, @orderIndex, @isActive, GETDATE())
      `);
      return { id: res.recordset[0].id, title, subtitle, image, linkUrl, orderIndex, isActive };
    } catch (err) {
      console.error("MSSQL insertBannerToDb error:", err.message);
    }
  }

  const db = loadDB();
  db.banners = db.banners || [];
  const nextId = db.banners.length > 0 ? Math.max(...db.banners.map(b => b.id || 0)) + 1 : 1;
  const newBanner = {
    id: nextId,
    title,
    subtitle,
    image,
    linkUrl,
    orderIndex,
    isActive,
    createdAt: new Date().toISOString()
  };
  db.banners.push(newBanner);
  saveDB(db);
  return newBanner;
}

async function updateBannerInDb(id, data) {
  const bannerId = parseInt(id);
  if (isMssqlConnected && mssqlPool) {
    try {
      const sql = require('mssql');
      const req = mssqlPool.request();
      req.input('id', sql.Int, bannerId);
      req.input('title', sql.NVarChar, data.title);
      req.input('subtitle', sql.NVarChar, data.subtitle);
      req.input('image', sql.NVarChar, data.image);
      req.input('linkUrl', sql.NVarChar, data.linkUrl);
      req.input('orderIndex', sql.Int, parseInt(data.orderIndex) || 1);
      req.input('isActive', sql.Bit, data.isActive ? 1 : 0);

      await req.query(`
        UPDATE dbo.BANNERS
        SET TieuDe = COALESCE(@title, TieuDe),
            PhuDe = COALESCE(@subtitle, PhuDe),
            HinhAnhUrl = COALESCE(@image, HinhAnhUrl),
            DuongDanLienKet = COALESCE(@linkUrl, DuongDanLienKet),
            ThuTu = COALESCE(@orderIndex, ThuTu),
            IsActive = COALESCE(@isActive, IsActive)
        WHERE BannerId = @id
      `);
    } catch (err) {
      console.error("MSSQL updateBannerInDb error:", err.message);
    }
  }

  const db = loadDB();
  db.banners = db.banners || [];
  const idx = db.banners.findIndex(b => b.id === bannerId);
  if (idx !== -1) {
    db.banners[idx] = { ...db.banners[idx], ...data, id: bannerId };
    saveDB(db);
    return db.banners[idx];
  }
  return null;
}

async function deleteBannerFromDb(id) {
  const bannerId = parseInt(id);
  if (isMssqlConnected && mssqlPool) {
    try {
      const sql = require('mssql');
      const req = mssqlPool.request();
      req.input('id', sql.Int, bannerId);
      await req.query("DELETE FROM dbo.BANNERS WHERE BannerId = @id");
    } catch (err) {
      console.error("MSSQL deleteBannerFromDb error:", err.message);
    }
  }

  const db = loadDB();
  db.banners = (db.banners || []).filter(b => b.id !== bannerId);
  saveDB(db);
  return true;
}

// =========================================================================
// 16. DYNAMIC SITE SETTINGS (dbo.SITE_SETTINGS)
// =========================================================================
async function getSiteSettingsFromDb() {
  if (isMssqlConnected && mssqlPool) {
    try {
      const res = await mssqlPool.request().query("SELECT SettingKey, SettingValue FROM dbo.SITE_SETTINGS");
      if (res.recordset && res.recordset.length > 0) {
        const settings = {};
        res.recordset.forEach(r => { settings[r.SettingKey] = r.SettingValue; });
        return settings;
      }
    } catch (err) {
      console.warn("MSSQL getSiteSettingsFromDb warning:", err.message);
    }
  }

  const db = loadDB();
  return db.site_settings || {
    brandTitle: "CÔNG ĐOÀN TRƯỜNG ĐẠI HỌC THỦ DẦU MỘT",
    brandSub: "THU DAU MOT UNIVERSITY TRADE UNION",
    hotline: "(0274) 3.815.184",
    email: "congdoan@tdmu.edu.vn",
    address: "Lầu 1, Dãy A, Cổng 1, Số 06 Trần Văn Ơn, P. Phú Lợi, TP. Thủ Dầu Một, Bình Dương",
    websiteUrl: "congdoan.tdmu.edu.vn",
    facebookUrl: "https://facebook.com/congdoantdmu",
    zaloUrl: "https://zalo.me/congdoantdmu"
  };
}

async function updateSiteSettingsInDb(newSettings) {
  if (isMssqlConnected && mssqlPool) {
    try {
      const sql = require('mssql');
      for (const [k, v] of Object.entries(newSettings)) {
        const req = mssqlPool.request();
        req.input('key', sql.NVarChar, k);
        req.input('val', sql.NVarChar, String(v));
        await req.query(`
          IF EXISTS (SELECT 1 FROM dbo.SITE_SETTINGS WHERE SettingKey = @key)
            UPDATE dbo.SITE_SETTINGS SET SettingValue = @val WHERE SettingKey = @key
          ELSE
            INSERT INTO dbo.SITE_SETTINGS (SettingKey, SettingValue) VALUES (@key, @val)
        `);
      }
    } catch (err) {
      console.error("MSSQL updateSiteSettingsInDb error:", err.message);
    }
  }

  const db = loadDB();
  db.site_settings = { ...(db.site_settings || {}), ...newSettings };
  saveDB(db);
  return db.site_settings;
}

// =========================================================================
// 17. QUICK NOTICES & NOTIFICATIONS (dbo.QUICK_NOTICES)
// =========================================================================
async function getQuickNoticesFromDb(onlyActive = true) {
  if (isMssqlConnected && mssqlPool) {
    try {
      let query = "SELECT NoticeId AS id, TieuDe AS title, NoiDung AS content, IconClass AS icon, DuongDanLienKet AS linkUrl, ThuTu AS orderIndex, IsActive AS isActive FROM dbo.QUICK_NOTICES";
      if (onlyActive) query += " WHERE IsActive = 1";
      query += " ORDER BY ThuTu ASC, NoticeId DESC";
      const res = await mssqlPool.request().query(query);
      return res.recordset;
    } catch (err) {
      console.warn("MSSQL getQuickNoticesFromDb warning:", err.message);
    }
  }

  const db = loadDB();
  let list = db.quick_notices || [];
  if (onlyActive) list = list.filter(n => n.isActive !== false);
  return list.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
}

async function insertQuickNoticeToDb(data) {
  const title = (data.title || '').trim();
  const content = (data.content || '').trim();
  const icon = data.icon || 'fa-circle-info text-primary';
  const linkUrl = data.linkUrl || '/tin-tuc';
  const orderIndex = parseInt(data.orderIndex) || 1;
  const isActive = data.isActive !== undefined ? Boolean(data.isActive) : true;

  if (isMssqlConnected && mssqlPool) {
    try {
      const sql = require('mssql');
      const req = mssqlPool.request();
      req.input('title', sql.NVarChar, title);
      req.input('content', sql.NVarChar, content);
      req.input('icon', sql.NVarChar, icon);
      req.input('linkUrl', sql.NVarChar, linkUrl);
      req.input('orderIndex', sql.Int, orderIndex);
      req.input('isActive', sql.Bit, isActive ? 1 : 0);
      const res = await req.query(`
        INSERT INTO dbo.QUICK_NOTICES (TieuDe, NoiDung, IconClass, DuongDan, ThuTu, IsActive, NgayTao)
        OUTPUT INSERTED.NoticeId AS id
        VALUES (@title, @content, @icon, @linkUrl, @orderIndex, @isActive, GETDATE())
      `);
      return { id: res.recordset[0].id, title, content, icon, linkUrl, orderIndex, isActive };
    } catch (err) {
      console.error("MSSQL insertQuickNoticeToDb error:", err.message);
    }
  }

  const db = loadDB();
  db.quick_notices = db.quick_notices || [];
  const nextId = db.quick_notices.length > 0 ? Math.max(...db.quick_notices.map(n => n.id || 0)) + 1 : 1;
  const item = { id: nextId, title, content, icon, linkUrl, orderIndex, isActive, createdAt: new Date().toISOString() };
  db.quick_notices.push(item);
  saveDB(db);
  return item;
}

async function updateQuickNoticeInDb(id, data) {
  const noticeId = parseInt(id);
  const db = loadDB();
  db.quick_notices = db.quick_notices || [];
  const idx = db.quick_notices.findIndex(n => n.id === noticeId);
  if (idx !== -1) {
    db.quick_notices[idx] = { ...db.quick_notices[idx], ...data, id: noticeId };
    saveDB(db);
    return db.quick_notices[idx];
  }
  return null;
}

async function deleteQuickNoticeFromDb(id) {
  const noticeId = parseInt(id);
  const db = loadDB();
  db.quick_notices = (db.quick_notices || []).filter(n => n.id !== noticeId);
  saveDB(db);
  return true;
}

// =========================================================================
// 18. EXTERNAL LINKS (dbo.EXTERNAL_LINKS)
// =========================================================================
async function getExternalLinksFromDb(onlyActive = true) {
  if (isMssqlConnected && mssqlPool) {
    try {
      let query = "SELECT LinkId AS id, TenLienKet AS title, DuongDanUrl AS url, ThuTu AS orderIndex, IsActive AS isActive FROM dbo.EXTERNAL_LINKS";
      if (onlyActive) query += " WHERE IsActive = 1";
      query += " ORDER BY ThuTu ASC, LinkId ASC";
      const res = await mssqlPool.request().query(query);
      return res.recordset;
    } catch (err) {
      console.warn("MSSQL getExternalLinksFromDb warning:", err.message);
    }
  }

  const db = loadDB();
  let list = db.external_links || [];
  if (onlyActive) list = list.filter(l => l.isActive !== false);
  return list.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
}

async function insertExternalLinkToDb(data) {
  const title = (data.title || '').trim();
  const url = (data.url || '#').trim();
  const orderIndex = parseInt(data.orderIndex) || 1;
  const isActive = data.isActive !== undefined ? Boolean(data.isActive) : true;

  const db = loadDB();
  db.external_links = db.external_links || [];
  const nextId = db.external_links.length > 0 ? Math.max(...db.external_links.map(l => l.id || 0)) + 1 : 1;
  const item = { id: nextId, title, url, orderIndex, isActive };
  db.external_links.push(item);
  saveDB(db);
  return item;
}

async function updateExternalLinkInDb(id, data) {
  const linkId = parseInt(id);
  const db = loadDB();
  db.external_links = db.external_links || [];
  const idx = db.external_links.findIndex(l => l.id === linkId);
  if (idx !== -1) {
    db.external_links[idx] = { ...db.external_links[idx], ...data, id: linkId };
    saveDB(db);
    return db.external_links[idx];
  }
  return null;
}

async function deleteExternalLinkFromDb(id) {
  const linkId = parseInt(id);
  const db = loadDB();
  db.external_links = (db.external_links || []).filter(l => l.id !== linkId);
  saveDB(db);
  return true;
}

// =========================================================================
// 19. CATEGORIES MANAGEMENT (dbo.CATEGORIES)
// =========================================================================
async function insertCategoryToDb(data) {
  const name = (data.name || '').trim();
  const slug = (data.slug || name.toLowerCase().replace(/[^a-z0-9]/g, '-')).trim();
  const description = (data.description || '').trim();
  const orderIndex = parseInt(data.orderIndex || data.ThuTu) || 1;

  if (isMssqlConnected && mssqlPool) {
    try {
      const req = mssqlPool.request();
      req.input('name', sql.NVarChar(100), name);
      req.input('slug', sql.VarChar(120), slug);
      req.input('desc', sql.NVarChar(sql.MAX), description);
      req.input('order', sql.Int, orderIndex);
      const res = await req.query(`
        INSERT INTO dbo.CATEGORIES (TenChuyenMuc, Slug, MoTa, ThuTu, TrangThai, NgayTao)
        OUTPUT INSERTED.CategoryId AS id
        VALUES (@name, @slug, @desc, @order, 1, SYSUTCDATETIME())
      `);
      const insertedId = res.recordset && res.recordset[0] ? res.recordset[0].id : null;
      return { id: insertedId, name, slug, description, orderIndex };
    } catch (err) {
      console.warn('MSSQL insertCategoryToDb warning (fallback JSON):', err.message);
    }
  }

  const db = loadDB();
  db.categories = db.categories || [];
  const nextId = db.categories.length > 0 ? Math.max(...db.categories.map(c => c.id || 0)) + 1 : 1;
  const item = { id: nextId, name, slug, description, orderIndex };
  db.categories.push(item);
  saveDB(db);
  return item;
}

async function updateCategoryInDb(id, data) {
  const catId = parseInt(id);
  const name = data.name !== undefined ? (data.name || '').trim() : null;
  const slug = data.slug !== undefined ? (data.slug || '').trim() : null;
  const description = data.description !== undefined ? (data.description || '').trim() : null;

  if (isMssqlConnected && mssqlPool) {
    try {
      const req = mssqlPool.request();
      req.input('id', sql.Int, catId);
      req.input('name', sql.NVarChar(100), name);
      req.input('slug', sql.VarChar(120), slug);
      req.input('desc', sql.NVarChar(sql.MAX), description);
      await req.query(`
        UPDATE dbo.CATEGORIES
        SET TenChuyenMuc = COALESCE(@name, TenChuyenMuc),
            Slug = COALESCE(@slug, Slug),
            MoTa = COALESCE(@desc, MoTa)
        WHERE CategoryId = @id
      `);
    } catch (err) {
      console.warn('MSSQL updateCategoryInDb warning:', err.message);
    }
  }

  const db = loadDB();
  db.categories = db.categories || [];
  const idx = db.categories.findIndex(c => c.id === catId);
  if (idx !== -1) {
    db.categories[idx] = { ...db.categories[idx], ...data, id: catId };
    saveDB(db);
    return db.categories[idx];
  }
  return null;
}

async function deleteCategoryFromDb(id) {
  const catId = parseInt(id);

  if (isMssqlConnected && mssqlPool) {
    try {
      const req = mssqlPool.request();
      req.input('id', sql.Int, catId);
      await req.query('DELETE FROM dbo.CATEGORIES WHERE CategoryId = @id');
    } catch (err) {
      console.warn('MSSQL deleteCategoryFromDb warning:', err.message);
    }
  }

  const db = loadDB();
  db.categories = (db.categories || []).filter(c => c.id !== catId);
  saveDB(db);
  return true;
}

async function getNavigationMenusFromDb(all = false) {
  if (isMssqlConnected && mssqlPool) {
    try {
      let query = `
        SELECT 
          MenuId AS id,
          TieuDe AS title,
          DuongDanUrl AS url,
          MenuChaId AS parentId,
          ThuTu AS [order],
          IsActive AS isActive,
          MoCuaSoMoi AS targetBlank,
          Icon AS icon
        FROM dbo.NAVIGATION_MENUS
      `;
      if (!all) {
        query += ` WHERE IsActive = 1`;
      }
      query += ` ORDER BY ThuTu ASC, MenuId ASC`;
      const res = await mssqlPool.request().query(query);
      return res.recordset.map(r => ({
        ...r,
        isActive: Boolean(r.isActive),
        targetBlank: Boolean(r.targetBlank)
      }));
    } catch (err) {
      console.error("MSSQL getNavigationMenusFromDb Error:", err.message);
    }
  }

  const db = loadDB();
  let list = db.navigation_menus || [];
  if (!all) {
    list = list.filter(m => m.isActive !== false);
  }
  return list.sort((a, b) => (a.order || 0) - (b.order || 0));
}

async function insertNavigationMenuToDb(data) {
  const title = (data.title || data.TieuDe || '').trim();
  const url = (data.url || data.DuongDanUrl || '').trim();
  const parentId = data.parentId !== undefined && data.parentId !== '' ? parseInt(data.parentId) : null;
  const order = parseInt(data.order !== undefined ? data.order : (data.ThuTu || 0)) || 0;
  const isActive = data.isActive !== undefined ? (data.isActive ? 1 : 0) : 1;
  const targetBlank = data.targetBlank !== undefined ? (data.targetBlank ? 1 : 0) : 0;
  const icon = (data.icon || data.Icon || '').trim();

  let insertedId = null;
  if (isMssqlConnected && mssqlPool) {
    try {
      const sql = require('mssql');
      const req = mssqlPool.request();
      req.input('title', sql.NVarChar(100), title);
      req.input('url', sql.NVarChar(255), url);
      req.input('parentId', sql.Int, parentId);
      req.input('order', sql.Int, order);
      req.input('isActive', sql.Bit, isActive);
      req.input('targetBlank', sql.Bit, targetBlank);
      req.input('icon', sql.NVarChar(50), icon || null);

      const res = await req.query(`
        INSERT INTO dbo.NAVIGATION_MENUS (TieuDe, DuongDanUrl, MenuChaId, ThuTu, IsActive, MoCuaSoMoi, Icon, NgayTao)
        OUTPUT INSERTED.MenuId
        VALUES (@title, @url, @parentId, @order, @isActive, @targetBlank, @icon, SYSDATETIME())
      `);
      if (res.recordset && res.recordset.length > 0) {
        insertedId = res.recordset[0].MenuId;
      }
    } catch (err) {
      console.error("MSSQL insertNavigationMenuToDb Error:", err.message);
    }
  }

  const db = loadDB();
  db.navigation_menus = db.navigation_menus || [];
  if (!insertedId) {
    insertedId = db.navigation_menus.length > 0 ? Math.max(...db.navigation_menus.map(m => m.id || 0)) + 1 : 1;
  }
  const newItem = {
    id: insertedId,
    title,
    url,
    parentId,
    order,
    isActive: Boolean(isActive),
    targetBlank: Boolean(targetBlank),
    icon
  };
  db.navigation_menus.push(newItem);
  saveDB(db);
  return newItem;
}

async function updateNavigationMenuInDb(id, data) {
  const numericId = parseInt(id);
  const title = data.title !== undefined ? (data.title || '').trim() : null;
  const url = data.url !== undefined ? (data.url || '').trim() : null;
  const parentId = data.parentId !== undefined ? (data.parentId !== '' ? parseInt(data.parentId) : null) : null;
  const order = data.order !== undefined ? parseInt(data.order) : null;
  const isActive = data.isActive !== undefined ? (data.isActive ? 1 : 0) : null;
  const targetBlank = data.targetBlank !== undefined ? (data.targetBlank ? 1 : 0) : null;
  const icon = data.icon !== undefined ? (data.icon || '').trim() : null;

  if (isMssqlConnected && mssqlPool) {
    try {
      const sql = require('mssql');
      const req = mssqlPool.request();
      req.input('id', sql.Int, numericId);
      req.input('title', sql.NVarChar(100), title);
      req.input('url', sql.NVarChar(255), url);
      req.input('parentId', sql.Int, parentId);
      req.input('order', sql.Int, order);
      req.input('isActive', sql.Bit, isActive);
      req.input('targetBlank', sql.Bit, targetBlank);
      req.input('icon', sql.NVarChar(50), icon);

      await req.query(`
        UPDATE dbo.NAVIGATION_MENUS
        SET TieuDe = COALESCE(@title, TieuDe),
            DuongDanUrl = COALESCE(@url, DuongDanUrl),
            MenuChaId = CASE WHEN @parentId IS NOT NULL THEN @parentId ELSE MenuChaId END,
            ThuTu = COALESCE(@order, ThuTu),
            IsActive = COALESCE(@isActive, IsActive),
            MoCuaSoMoi = COALESCE(@targetBlank, MoCuaSoMoi),
            Icon = COALESCE(@icon, Icon)
        WHERE MenuId = @id
      `);
    } catch (err) {
      console.error("MSSQL updateNavigationMenuInDb Error:", err.message);
    }
  }

  const db = loadDB();
  db.navigation_menus = db.navigation_menus || [];
  const idx = db.navigation_menus.findIndex(m => m.id === numericId);
  if (idx !== -1) {
    db.navigation_menus[idx] = { ...db.navigation_menus[idx], ...data, id: numericId };
    saveDB(db);
    return db.navigation_menus[idx];
  }
  return { id: numericId, ...data };
}

async function deleteNavigationMenuFromDb(id) {
  const numericId = parseInt(id);
  if (isMssqlConnected && mssqlPool) {
    try {
      const sql = require('mssql');
      const req = mssqlPool.request();
      req.input('id', sql.Int, numericId);
      await req.query('DELETE FROM dbo.NAVIGATION_MENUS WHERE MenuId = @id');
    } catch (err) {
      console.error("MSSQL deleteNavigationMenuFromDb Error:", err.message);
    }
  }

  const db = loadDB();
  db.navigation_menus = (db.navigation_menus || []).filter(m => m.id !== numericId);
  saveDB(db);
  return true;
}

module.exports = {
  // 15 - 19: Dynamic Collections
  getBannersFromDb,
  insertBannerToDb,
  updateBannerInDb,
  deleteBannerFromDb,
  getSiteSettingsFromDb,
  updateSiteSettingsInDb,
  getQuickNoticesFromDb,
  insertQuickNoticeToDb,
  updateQuickNoticeInDb,
  deleteQuickNoticeFromDb,
  getExternalLinksFromDb,
  insertExternalLinkToDb,
  updateExternalLinkInDb,
  deleteExternalLinkFromDb,
  insertCategoryToDb,
  updateCategoryInDb,
  deleteCategoryFromDb,

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
  deleteCommentFromDb,
  getDocumentsFromDb,
  getCategoriesFromDb,
  getOrgDataFromDb,
  insertCadreToDb,
  updateCadreInDb,
  deleteCadreFromDb,
  updateUnionBranchInDb,
  insertUnionBranchToDb,
  deleteUnionBranchFromDb,
  insertBoardToDb,
  updateBoardInDb,
  deleteBoardFromDb,
  getNavigationMenusFromDb,
  insertNavigationMenuToDb,
  updateNavigationMenuInDb,
  deleteNavigationMenuFromDb,
  getMonthlyReportsFromDb,
  getWelfareFromDb,
  insertWelfarePostToDb,
  updateWelfarePostInDb,
  deleteWelfarePostFromDb,
  incrementWelfarePdfDownloadInDb,
  getUsersFromDb,
  getUserByEmailFromDb,
  getUserByIdFromDb,
  createUserInDb,
  updateUserProfileInDb,
  updateUserPasswordInDb,
  updateUserLastLoginInDb,
  getBookmarksFromDb,
  insertBookmarkToDb,
  deleteBookmarkFromDb,
  getUserActivityFromDb,
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
