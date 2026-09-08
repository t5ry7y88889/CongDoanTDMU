const express = require('express');
const router = express.Router();
const {
  getOrgDataFromDb,
  getCategoriesFromDb,
  getUsersFromDb
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

module.exports = router;
