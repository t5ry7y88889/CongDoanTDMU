const express = require('express');
const router = express.Router();
const {
  getWelfareFromDb,
  insertWelfareApplicationToDb,
  getWelfareApplicationsFromDb,
  updateWelfareApplicationInDb,
  deleteWelfareApplicationFromDb
} = require('../mssql_db');
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

const serveApplications = async (req, res) => {
  const list = await getWelfareApplicationsFromDb(req.query.status || 'all', req.query.search || '');
  res.json({ success: true, count: list.length, data: list });
};

router.get('/applications', serveApplications);
router.get('/don-tro-cap', serveApplications);

router.get('/applications/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const list = await getWelfareApplicationsFromDb('all');
  const item = list.find(d => Number(d.id) === id);
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

router.put('/applications/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { status, amount_approved, decision_note, approved_by } = req.body;

  const updated = await updateWelfareApplicationInDb(id, {
    status,
    amount_approved,
    decision_note,
    approved_by
  });

  if (!updated) {
    return res.status(404).json({ success: false, error: 'Không tìm thấy hồ sơ trợ cấp!' });
  }

  res.json({ success: true, data: updated, message: 'Đã cập nhật xét duyệt hồ sơ trợ cấp thành công!' });
});

router.delete('/applications/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const deleted = await deleteWelfareApplicationFromDb(id);
  if (!deleted) {
    return res.status(404).json({ success: false, error: 'Không tìm thấy hồ sơ trợ cấp!' });
  }
  res.json({ success: true, message: 'Đã xóa hồ sơ trợ cấp thành công!', data: { id } });
});

module.exports = router;
