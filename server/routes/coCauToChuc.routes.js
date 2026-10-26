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
