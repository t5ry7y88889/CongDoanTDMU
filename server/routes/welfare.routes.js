const express = require('express');
const router = express.Router();
const { loadDB, saveDB } = require('../db');
const { getWelfareFromDb } = require('../mssql_db');

// =========================================================================
// WELFARE & DON TRO CAP API (MSSQL 3NF + FALLBACK)
// =========================================================================
router.get('/', async (req, res) => {
  const list = await getWelfareFromDb();
  res.json({ success: true, data: list });
});

router.get('/phuc-loi', async (req, res) => {
  const list = await getWelfareFromDb();
  res.json({ success: true, count: list.length, data: list });
});

router.get('/applications', (req, res) => {
  const db = loadDB();
  res.json({ success: true, data: db.don_tro_cap || [] });
});

router.get('/don-tro-cap', (req, res) => {
  const db = loadDB();
  res.json({ success: true, count: (db.don_tro_cap || []).length, data: db.don_tro_cap || [] });
});

router.post('/apply', (req, res) => {
  const db = loadDB();
  db.don_tro_cap = db.don_tro_cap || [];
  const { full_name, unit, type, amount_requested, reason, phone, email } = req.body;

  if (!full_name || !type || !reason) {
    return res.status(400).json({ success: false, error: 'Vui lòng điền đầy đủ họ tên, loại trợ cấp và lý do' });
  }

  const newApp = {
    id: db.don_tro_cap.length ? Math.max(...db.don_tro_cap.map(d => d.id || 0)) + 1 : 1,
    full_name,
    unit: unit || 'Đoàn viên TDMU',
    phone: phone || '',
    email: email || '',
    type,
    amount_requested: parseFloat(amount_requested) || 1000000,
    reason,
    submitted_at: new Date().toISOString(),
    status: 'pending',
    note: 'Chờ Ban Thường Vụ xét duyệt'
  };

  db.don_tro_cap.push(newApp);
  saveDB(db);
  res.json({ success: true, data: newApp, message: 'Đã gửi hồ sơ đề nghị trợ cấp thành công tới Ban Thường Vụ!' });
});

module.exports = router;
