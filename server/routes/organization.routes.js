const express = require('express');
const router = express.Router();
const {
  getOrgDataFromDb,
  getCategoriesFromDb,
  getUsersFromDb,
  insertUserToDb,
  deleteUserFromDb
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

router.get('/units', async (req, res) => {
  const org = await getOrgDataFromDb();
  res.json({ success: true, data: org.units || [] });
});

router.get('/to-cong-doan', async (req, res) => {
  const org = await getOrgDataFromDb();
  res.json({ success: true, data: org.units || [] });
});

router.get('/nhan-su', async (req, res) => {
  const org = await getOrgDataFromDb();
  res.json({ success: true, data: org.cadres || [] });
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

router.post('/users', async (req, res) => {
  const { name, email, department, roleId, role } = req.body;
  if (!name || !email) {
    return res.status(400).json({ success: false, error: 'Họ tên và Email là bắt buộc!' });
  }
  const created = await insertUserToDb({ name, email, department, roleId, role });
  if (created && created.error) {
    return res.status(500).json({ success: false, error: created.error });
  }
  res.json({ success: true, message: 'Đã tạo tài khoản cán bộ mới thành công!', data: created });
});

router.delete('/users/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const result = await deleteUserFromDb(id);
  if (result && result.error) {
    return res.status(400).json({ success: false, error: result.error });
  }
  if (!result) {
    return res.status(404).json({ success: false, error: 'Không tìm thấy tài khoản!' });
  }
  res.json({ success: true, message: 'Đã xóa tài khoản thành công!', data: { id } });
});

module.exports = router;
