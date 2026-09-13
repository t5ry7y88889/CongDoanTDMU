const express = require('express');
const router = express.Router();
const { loadDB, saveDB } = require('../db');
const { getWelfareFromDb, insertWelfareApplicationToDb } = require('../mssql_db');
const { validate, z } = require('../middleware/validate');

// =========================================================================
// WELFARE & ASSISTANCE APPLICATIONS API (MSSQL 3NF + FALLBACK)
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
  res.json({ success: true, data: db.assistance_applications || [] });
});

router.get('/don-tro-cap', (req, res) => {
  const db = loadDB();
  res.json({ success: true, count: (db.assistance_applications || []).length, data: db.assistance_applications || [] });
});

const applySchema = z.object({
  full_name: z.string().trim().min(2, 'Họ tên ít nhất 2 ký tự'),
  unit: z.string().trim().optional().default('Đoàn viên TDMU'),
  phone: z.string().trim().optional().default(''),
  email: z.string().trim().email('Email không hợp lệ').optional().default(''),
  type: z.string().trim().min(2, 'Loại trợ cấp là bắt buộc'),
  amount_requested: z.coerce.number().positive().optional(),
  welfareId: z.coerce.number().int().positive().optional(),
  reason: z.string().trim().min(5, 'Lý do ít nhất 5 ký tự')
});

router.post('/apply', validate(applySchema), async (req, res) => {
  const newApp = await insertWelfareApplicationToDb(req.body);
  res.json({ success: true, data: newApp, message: 'Đã gửi hồ sơ đề nghị trợ cấp thành công tới Ban Thường Vụ!' });
});

module.exports = router;
