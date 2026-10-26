const express = require('express');
const router = express.Router();
const {
  getOrgDataFromDb,
  getCategoriesFromDb,
  getUsersFromDb,
  insertCadreToDb,
  updateCadreInDb,
  deleteCadreFromDb,
  updateUnionBranchInDb
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
      total_members: toCongDoan.reduce((acc, u) => acc + (u.TongDoanVien || u.members || 45), 0) || 760,
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
  const list = await getUsersFromDb();
  res.json({ success: true, data: list });
});

router.post('/users', (req, res) => {
  const { name, ho_ten, email, department, unit, role, roleId } = req.body;
  const roleStr = role || (roleId === 1 ? 'admin' : roleId === 2 ? 'editor' : 'contributor');
  const { loadDB, saveDB } = require('../db');
  const db = loadDB();
  db.users = db.users || [];
  const newUser = {
    id: Date.now(),
    ho_ten: (ho_ten || name || '').trim(),
    email: (email || '').trim().toLowerCase(),
    unit: (unit || department || 'Đại học Thủ Dầu Một').trim(),
    role: roleStr,
    password: '123'
  };
  db.users.push(newUser);
  saveDB(db);
  res.json({ success: true, message: 'Tạo tài khoản cán bộ thành công', data: newUser });
});

router.delete('/users/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { loadDB, saveDB } = require('../db');
  const db = loadDB();
  db.users = (db.users || []).filter(u => u.id !== id);
  saveDB(db);
  res.json({ success: true, message: 'Đã xóa tài khoản cán bộ' });
});

module.exports = router;
