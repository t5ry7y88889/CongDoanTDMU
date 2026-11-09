const express = require('express');
const router = express.Router();
const {
  getOrgDataFromDb,
  getCategoriesFromDb,
  getUsersFromDb,
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
  deleteNavigationMenuFromDb
} = require('../mssql_db');

// =========================================================================
// DYNAMIC NAVIGATION MENU API (ÁNH XẠ TRỰC TIẾP TỪ CSDL MSSQL LÊN MENU)
// =========================================================================
router.get(['/navigation-menu', '/menu-tree', '/nav-menu'], async (req, res) => {
  try {
    const org = await getOrgDataFromDb();
    const categories = await getCategoriesFromDb();
    
    // 1. Ánh xạ dbo.ORGANIZATIONS -> Dropdown "Cơ Cấu Tổ Chức"
    const orgChildren = (org.boards || []).map(b => {
      let slug = 'ban-thuong-vu';
      const name = b.name || '';
      if (name.includes('Thường vụ')) slug = 'ban-thuong-vu';
      else if (name.includes('Chấp hành')) slug = 'ban-chap-hanh';
      else if (name.includes('Kiểm tra')) slug = 'uy-ban-kiem-tra';
      else if (name.includes('Nữ công')) slug = 'ban-nu-cong';
      else if (name.includes('Tuyên giáo')) slug = 'ban-tuyen-giao';
      return {
        id: b.id,
        title: b.name,
        slug: slug,
        url: `co-cau-to-chuc.html?tab=${slug}`,
        badge: b.tenure || 'Nhiệm kỳ 2023 - 2028',
        sourceTable: 'dbo.ORGANIZATIONS'
      };
    });

    // Bổ sung mục 16 Tổ công đoàn cơ sở (từ dbo.UNION_BRANCHES)
    const totalUnits = (org.units || []).length || 16;
    orgChildren.push({
      id: 'units',
      title: `${totalUnits} Tổ công đoàn cơ sở`,
      slug: '16-to-cong-doan',
      url: 'co-cau-to-chuc.html?tab=16-to-cong-doan',
      badge: `${totalUnits} Tổ`,
      sourceTable: 'dbo.UNION_BRANCHES'
    });

    // 2. Ánh xạ dbo.CATEGORIES -> Dropdown "Tin Tức"
    const newsChildren = [
      { id: 0, title: 'Tất cả tin tức', url: 'tin-tuc.html', slug: 'all', sourceTable: 'dbo.ARTICLES' },
      ...(categories || []).map(c => ({
        id: c.id,
        title: c.name,
        slug: c.slug,
        url: `tin-tuc.html?category=${encodeURIComponent(c.slug || c.name)}`,
        sourceTable: 'dbo.CATEGORIES'
      }))
    ];

    // 3. Toàn bộ cây menu phân cấp động
    const menuTree = [
      { id: 'home', title: 'Trang Chủ', url: 'index.html', hasChildren: false },
      { id: 'gioi-thieu', title: 'Giới Thiệu', url: 'gioi-thieu.html', hasChildren: false },
      { 
        id: 'co-cau-to-chuc', 
        title: 'Cơ Cấu Tổ Chức', 
        url: 'co-cau-to-chuc.html', 
        hasChildren: true,
        sourceTable: 'dbo.ORGANIZATIONS & dbo.UNION_BRANCHES',
        children: orgChildren
      },
      { 
        id: 'tin-tuc', 
        title: 'Tin Tức', 
        url: 'tin-tuc.html', 
        hasChildren: true,
        sourceTable: 'dbo.CATEGORIES',
        children: newsChildren
      },
      { id: 'phuc-loi', title: 'Phúc Lợi Đoàn Viên', url: 'phuc-loi-doan-vien.html', hasChildren: false, sourceTable: 'dbo.WELFARE_PROGRAMS' },
      { 
        id: 'van-ban', 
        title: 'Văn Bản', 
        url: 'van-ban.html', 
        hasChildren: true,
        sourceTable: 'dbo.DOCUMENTS',
        children: [
          { title: 'Công văn tuyên truyền', url: 'van-ban.html#tuyen-truyen' },
          { title: 'Kế hoạch hoạt động', url: 'van-ban.html#ke-hoach' },
          { title: 'Văn bản luật', url: 'van-ban.html#luat' },
          { title: 'Quyết định', url: 'van-ban.html#quyet-dinh' }
        ]
      },
      { id: 'bieu-mau', title: 'Biểu Mẫu', url: 'bieu-mau.html', hasChildren: false, sourceTable: 'dbo.TEMPLATES' },
      { id: 'lien-he', title: 'Liên Hệ', url: 'lien-he.html', hasChildren: false, sourceTable: 'dbo.INBOX_FEEDBACK' }
    ];

    res.json({
      success: true,
      message: 'Nạp danh mục Menu động từ CSDL MSSQL thành công',
      database: 'TDMU_TradeUnion_DB',
      data: menuTree
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Lỗi nạp menu động: ' + err.message });
  }
});

// =========================================================================
// ORGANIZATION, CADRES, CATEGORIES & USERS API (MSSQL 3NF + FALLBACK)
// =========================================================================
router.get('/org-full-tree', async (req, res) => {
  try {
    const orgData = await getOrgDataFromDb();
    const toChuc = orgData.boards || [];
    const toCongDoan = orgData.units || [];
    const nhanSu = orgData.cadres || [];

    const stats = {
      total_members: toCongDoan.reduce((acc, u) => acc + (parseInt(u.TongDoanVien || u.members) || 0), 0),
      total_units: toCongDoan.length,
      total_boards: toChuc.length,
      total_cadres: nhanSu.length
    };

    res.json({
      success: true,
      data: {
        boards: toChuc,
        units: toCongDoan,
        cadres: nhanSu,
        stats
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Lỗi nạp cây tổ chức: ' + err.message });
  }
});

router.get('/to-chuc', async (req, res) => {
  const org = await getOrgDataFromDb();
  res.json({ success: true, data: org.boards || [] });
});

router.get('/organizations', async (req, res) => {
  const org = await getOrgDataFromDb();
  res.json({ success: true, data: org.boards || [] });
});

router.get('/to-cong-doan', async (req, res) => {
  const org = await getOrgDataFromDb();
  res.json({ success: true, data: org.units || [] });
});

router.get('/union-branches', async (req, res) => {
  const org = await getOrgDataFromDb();
  res.json({ success: true, data: org.units || [] });
});

router.get('/nhan-su', async (req, res) => {
  const org = await getOrgDataFromDb();
  res.json({ success: true, data: org.cadres || [] });
});

router.get('/members', async (req, res) => {
  const org = await getOrgDataFromDb();
  res.json({ success: true, data: org.cadres || [] });
});

// CRUD CẬP NHẬT THÔNG TIN CƠ CẤU TỔ CHỨC & CÁN BỘ
router.post(['/members', '/cadres', '/nhan-su'], async (req, res) => {
  try {
    const saved = await insertCadreToDb(req.body);
    res.status(201).json({ success: true, message: 'Đã thêm nhân sự vào cơ cấu tổ chức thành công!', data: saved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put(['/members/:id', '/cadres/:id', '/nhan-su/:id'], async (req, res) => {
  try {
    const updated = await updateCadreInDb(req.params.id, req.body);
    res.json({ success: true, message: 'Đã cập nhật thông tin cán bộ thành công!', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete(['/members/:id', '/cadres/:id', '/nhan-su/:id'], async (req, res) => {
  try {
    await deleteCadreFromDb(req.params.id);
    res.json({ success: true, message: 'Đã xóa cán bộ khỏi cơ cấu tổ chức thành công!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put(['/to-cong-doan/:id', '/union-branches/:id'], async (req, res) => {
  try {
    const updated = await updateUnionBranchInDb(req.params.id, req.body);
    res.json({ success: true, message: 'Đã cập nhật thông tin Tổ Công đoàn thành công!', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/trade-unions', async (req, res) => {
  const org = await getOrgDataFromDb();
  res.json({ success: true, data: org.units || [] });
});

router.get('/categories', async (req, res) => {
  const list = await getCategoriesFromDb();
  res.json({ success: true, count: list.length, data: list });
});

router.get('/users', async (req, res) => {
  try {
    const list = await getUsersFromDb();
    res.json({ success: true, data: list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// CẬP NHẬT PHÂN QUYỀN VAI TRÒ CÁN BỘ (ADMIN / EDITOR / CONTRIBUTOR)
router.put('/users/:id/role', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { role } = req.body;
    if (!role) return res.status(400).json({ success: false, message: 'Vui lòng cung cấp vai trò cần cấp quyền!' });

    const normalizedRole = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();

    // 1. Cập nhật trực tiếp vào Microsoft SQL Server dbo.USERS
    const { getMssqlPool, isMssqlConnected } = require('../mssql_db');
    const pool = getMssqlPool ? getMssqlPool() : null;
    if (pool && pool.connected) {
      try {
        const sql = require('mssql');
        const reqSql = pool.request();
        reqSql.input('id', sql.Int, id);
        reqSql.input('role', sql.NVarChar, normalizedRole);
        await reqSql.query('UPDATE dbo.USERS SET VaiTro = @role WHERE UserId = @id');
      } catch (sqlErr) {
        console.error('Lỗi cập nhật vai trò MSSQL:', sqlErr.message);
      }
    }

    // 2. Cập nhật tệp JSON backup
    const { loadDB, saveDB } = require('../db');
    const db = loadDB();
    if (db.users) {
      const u = db.users.find(x => x.id === id);
      if (u) {
        u.role = normalizedRole;
        saveDB(db);
      }
    }

    res.json({
      success: true,
      message: `Cập nhật phân quyền thành công! Vai trò mới: ${normalizedRole}`,
      data: { id, role: normalizedRole }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// BẬT / TẮT (KÍCH HOẠT HOẶC KHÓA) TÀI KHOẢN CÁN BỘ (KHÔNG XÓA DỮ LIỆU)
router.put('/users/:id/status', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    let { active, is_active } = req.body;
    const newStatus = (active !== undefined ? active : (is_active !== undefined ? is_active : 1)) ? 1 : 0;

    // 1. Cập nhật Microsoft SQL Server
    const { getMssqlPool } = require('../mssql_db');
    const pool = getMssqlPool ? getMssqlPool() : null;
    if (pool && pool.connected) {
      try {
        const sql = require('mssql');
        const reqSql = pool.request();
        reqSql.input('id', sql.Int, id);
        reqSql.input('status', sql.Int, newStatus);
        await reqSql.query('UPDATE dbo.USERS SET TrangThai = @status WHERE UserId = @id');
      } catch (sqlErr) {
        console.error('Lỗi cập nhật trạng thái MSSQL:', sqlErr.message);
      }
    }

    // 2. Cập nhật tệp JSON backup
    const { loadDB, saveDB } = require('../db');
    const db = loadDB();
    if (db.users) {
      const u = db.users.find(x => x.id === id);
      if (u) {
        u.active = newStatus;
        u.is_active = newStatus;
        u.TrangThai = newStatus;
        saveDB(db);
      }
    }

    res.json({
      success: true,
      message: newStatus === 1 ? 'Đã kích hoạt mở lại tài khoản thành công!' : 'Đã tạm khóa vô hiệu hóa tài khoản thành công!',
      active: newStatus,
      is_active: newStatus
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// TẠO MỚI TÀI KHOẢN CÁN BỘ & GÁN VAI TRÒ VÀO CSDL
router.post('/users', async (req, res) => {
  try {
    const { name, ho_ten, email, department, unit, role, roleId, phone, avatar, position } = req.body;
    const fullName = (ho_ten || name || '').trim();
    const normEmail = (email || '').trim().toLowerCase();
    const userUnit = (unit || department || 'Đại học Thủ Dầu Một').trim();
    const userPos = (position || 'Cán bộ Công đoàn').trim();
    const userAvatar = avatar || '/images/default_avatar.png';
    const roleStr = role || (roleId === 1 ? 'Admin' : roleId === 2 ? 'Editor' : 'Contributor');
    const normalizedRole = roleStr.charAt(0).toUpperCase() + roleStr.slice(1).toLowerCase();

    if (!fullName || !normEmail) {
      return res.status(400).json({ success: false, message: 'Họ tên và email công vụ là bắt buộc!' });
    }

    let newId = Date.now();

    // 1. Thêm vào MSSQL dbo.USERS
    const { getMssqlPool } = require('../mssql_db');
    const pool = getMssqlPool ? getMssqlPool() : null;
    if (pool && pool.connected) {
      try {
        const sql = require('mssql');
        const reqSql = pool.request();
        reqSql.input('email', sql.VarChar, normEmail);
        reqSql.input('name', sql.NVarChar, fullName);
        reqSql.input('role', sql.NVarChar, normalizedRole);
        reqSql.input('unit', sql.NVarChar, userUnit);
        reqSql.input('pos', sql.NVarChar, userPos);
        reqSql.input('phone', sql.VarChar, phone || '0274.3815.184');
        reqSql.input('avatar', sql.NVarChar, userAvatar);

        const ins = await reqSql.query(`
          INSERT INTO dbo.USERS (Email, PasswordHash, HoTen, VaiTro, AvatarUrl, SoDienThoai, DonVi, ChucVu, TrangThai, NgayTao)
          OUTPUT INSERTED.UserId
          VALUES (@email, '$2a$10$samplepwd', @name, @role, @avatar, @phone, @unit, @pos, 1, SYSDATETIME())
        `);
        if (ins.recordset && ins.recordset[0]) {
          newId = ins.recordset[0].UserId;
        }
      } catch (sqlErr) {
        console.error('Lỗi thêm cán bộ vào MSSQL:', sqlErr.message);
      }
    }

    const newUser = {
      id: newId,
      name: fullName,
      ho_ten: fullName,
      email: normEmail,
      unit: userUnit,
      position: userPos,
      role: normalizedRole,
      avatar: userAvatar,
      phone: phone || '0274.3815.184',
      active: 1,
      is_active: 1,
      created_at: new Date().toISOString()
    };

    // 2. Thêm vào JSON backup
    const { loadDB, saveDB } = require('../db');
    const db = loadDB();
    db.users = db.users || [];
    db.users.push(newUser);
    saveDB(db);

    res.json({
      success: true,
      message: 'Tạo tài khoản và phân quyền cán bộ thành công!',
      data: newUser
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// XÓA TÀI KHOẢN (NGHIÊM CẤM HARD-DELETE -> CHUYỂN SANG KHÓA TÀI KHOẢN)
router.delete('/users/:id', async (req, res) => {
  // Thay vì xóa dữ liệu gốc làm mất tính toàn vẹn vết kiểm duyệt, ta khóa tài khoản (TrangThai = 0)
  const id = parseInt(req.params.id);
  const { getMssqlPool } = require('../mssql_db');
  const pool = getMssqlPool ? getMssqlPool() : null;
  if (pool && pool.connected) {
    try {
      const sql = require('mssql');
      const reqSql = pool.request();
      reqSql.input('id', sql.Int, id);
      await reqSql.query('UPDATE dbo.USERS SET TrangThai = 0 WHERE UserId = @id');
    } catch {}
  }
  const { loadDB, saveDB } = require('../db');
  const db = loadDB();
  if (db.users) {
    const u = db.users.find(x => x.id === id);
    if (u) { u.active = 0; u.is_active = 0; u.TrangThai = 0; saveDB(db); }
  }
  res.json({ success: true, message: 'Đã khóa vô hiệu hóa tài khoản cán bộ thành công (bảo toàn vết kiểm duyệt lịch sử)!' });
});


// =========================================================================
// CRUD TỔ CÔNG ĐOÀN (dbo.UNION_BRANCHES)
// =========================================================================
router.post(['/to-cong-doan', '/union-branches'], async (req, res) => {
  try {
    const item = await insertUnionBranchToDb(req.body);
    res.status(201).json({ success: true, message: 'Đã thêm Tổ công đoàn mới thành công!', data: item });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete(['/to-cong-doan/:id', '/union-branches/:id'], async (req, res) => {
  try {
    await deleteUnionBranchFromDb(req.params.id);
    res.json({ success: true, message: 'Đã xóa Tổ công đoàn thành công!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// =========================================================================
// CRUD CÁC BAN / CƠ CẤU TỔ CHỨC (dbo.ORGANIZATIONS)
// =========================================================================
router.post(['/to-chuc', '/organizations', '/boards'], async (req, res) => {
  try {
    const item = await insertBoardToDb(req.body);
    res.status(201).json({ success: true, message: 'Đã thêm Ban / Bộ phận mới thành công!', data: item });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put(['/to-chuc/:id', '/organizations/:id', '/boards/:id'], async (req, res) => {
  try {
    const item = await updateBoardInDb(req.params.id, req.body);
    res.json({ success: true, message: 'Đã cập nhật Ban thành công!', data: item });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete(['/to-chuc/:id', '/organizations/:id', '/boards/:id'], async (req, res) => {
  try {
    await deleteBoardFromDb(req.params.id);
    res.json({ success: true, message: 'Đã xóa Ban khỏi cơ cấu tổ chức thành công!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// =========================================================================
// CRUD MENU ĐIỀU HƯỚNG WEBSITE (dbo.NAVIGATION_MENUS)
// =========================================================================
router.get(['/navigation-menus', '/nav-menus', '/menu-items'], async (req, res) => {
  try {
    const isAll = req.query.all === 'true' || req.query.all === '1';
    const list = await getNavigationMenusFromDb(isAll);
    res.json({ success: true, count: list.length, data: list });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post(['/navigation-menus', '/nav-menus'], async (req, res) => {
  try {
    const item = await insertNavigationMenuToDb(req.body);
    res.status(201).json({ success: true, message: 'Đã thêm mục Menu mới thành công!', data: item });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put(['/navigation-menus/:id', '/nav-menus/:id'], async (req, res) => {
  try {
    const item = await updateNavigationMenuInDb(req.params.id, req.body);
    res.json({ success: true, message: 'Đã cập nhật mục Menu thành công!', data: item });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete(['/navigation-menus/:id', '/nav-menus/:id'], async (req, res) => {
  try {
    await deleteNavigationMenuFromDb(req.params.id);
    res.json({ success: true, message: 'Đã xóa mục Menu thành công!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
