const express = require('express');
const router = express.Router();
const { loadDB, saveDB } = require('../db');
const { getWelfareFromDb, insertWelfareApplicationToDb } = require('../mssql_db');
const { validate, z } = require('../middleware/validate');

function stripVietnamese(str) {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLowerCase();
}

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
  let list = db.don_tro_cap || [];
  const { status, search } = req.query;

  if (status && status !== 'all') {
    list = list.filter(d => d.status === status);
  }

  if (search) {
    const q = stripVietnamese(search.trim());
    list = list.filter(d =>
      stripVietnamese(d.full_name).includes(q) ||
      stripVietnamese(d.unit).includes(q) ||
      stripVietnamese(d.type).includes(q) ||
      stripVietnamese(d.reason).includes(q)
    );
  }

  res.json({ success: true, count: list.length, data: list });
});

router.get('/don-tro-cap', (req, res) => {
  const db = loadDB();
  let list = db.don_tro_cap || [];
  const { status, search } = req.query;

  if (status && status !== 'all') {
    list = list.filter(d => d.status === status);
  }

  if (search) {
    const q = stripVietnamese(search.trim());
    list = list.filter(d =>
      stripVietnamese(d.full_name).includes(q) ||
      stripVietnamese(d.unit).includes(q) ||
      stripVietnamese(d.type).includes(q) ||
      stripVietnamese(d.reason).includes(q)
    );
  }

  res.json({ success: true, count: list.length, data: list });
});

router.get('/applications/:id', (req, res) => {
  const db = loadDB();
  const id = parseInt(req.params.id);
  const item = (db.don_tro_cap || []).find(d => d.id === id);
  if (!item) return res.status(404).json({ success: false, error: 'Không tìm thấy hồ sơ đề nghị trợ cấp!' });
  res.json({ success: true, data: item });
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

router.put('/applications/:id', (req, res) => {
  const db = loadDB();
  db.don_tro_cap = db.don_tro_cap || [];
  const id = parseInt(req.params.id);
  const idx = db.don_tro_cap.findIndex(d => d.id === id);

  if (idx === -1) {
    return res.status(404).json({ success: false, error: 'Không tìm thấy hồ sơ trợ cấp!' });
  }

  const { status, amount_approved, decision_note, approved_by } = req.body;

  if (status) db.don_tro_cap[idx].status = status;
  if (amount_approved !== undefined) db.don_tro_cap[idx].amount_approved = parseFloat(amount_approved);
  if (decision_note !== undefined) db.don_tro_cap[idx].decision_note = decision_note;
  if (approved_by) db.don_tro_cap[idx].approved_by = approved_by;

  const now = new Date().toISOString();
  if (status === 'approved' && !db.don_tro_cap[idx].approved_at) {
    db.don_tro_cap[idx].approved_at = now;
  }
  if (status === 'disbursed' && !db.don_tro_cap[idx].disbursed_at) {
    db.don_tro_cap[idx].disbursed_at = now;
  }

  saveDB(db);
  res.json({ success: true, data: db.don_tro_cap[idx], message: 'Đã cập nhật xét duyệt hồ sơ trợ cấp thành công!' });
});

router.delete('/applications/:id', (req, res) => {
  const db = loadDB();
  db.don_tro_cap = db.don_tro_cap || [];
  const id = parseInt(req.params.id);
  const idx = db.don_tro_cap.findIndex(d => d.id === id);

  if (idx === -1) {
    return res.status(404).json({ success: false, error: 'Không tìm thấy hồ sơ trợ cấp!' });
  }

  const deleted = db.don_tro_cap.splice(idx, 1)[0];
  saveDB(db);
  res.json({ success: true, message: 'Đã xóa hồ sơ trợ cấp thành công!', data: deleted });
});

module.exports = router;
