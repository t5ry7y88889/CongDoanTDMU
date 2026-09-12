const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { loadDB, saveDB } = require('../db');
const { getWelfareFromDb } = require('../mssql_db');

function stripVietnamese(str) {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLowerCase();
}

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

router.post('/apply', (req, res) => {
  const db = loadDB();
  db.don_tro_cap = db.don_tro_cap || [];
  const { full_name, unit, type, amount_requested, reason, phone, email, proofBase64, proofName } = req.body;

  if (!full_name || !type || !reason) {
    return res.status(400).json({ success: false, error: 'Vui lòng điền đầy đủ họ tên, loại trợ cấp và lý do' });
  }

  const nextId = db.don_tro_cap.length ? Math.max(...db.don_tro_cap.map(d => d.id || 0)) + 1 : 1;
  let proofUrl = null;

  if (proofBase64 && proofName) {
    try {
      const cleanBase64 = proofBase64.replace(/^data:.*?;base64,/, '');
      const buffer = Buffer.from(cleanBase64, 'base64');
      const safeName = `minhchung_${nextId}_${proofName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      
      const uploadDir1 = path.join(__dirname, '../../public/uploads/welfare');
      if (!fs.existsSync(uploadDir1)) fs.mkdirSync(uploadDir1, { recursive: true });
      fs.writeFileSync(path.join(uploadDir1, safeName), buffer);

      const uploadDir2 = path.join(__dirname, '../../frontend/public/uploads/welfare');
      if (!fs.existsSync(uploadDir2)) fs.mkdirSync(uploadDir2, { recursive: true });
      fs.writeFileSync(path.join(uploadDir2, safeName), buffer);

      proofUrl = `/uploads/welfare/${safeName}`;
    } catch (e) {
      console.error('Error saving proof file:', e);
    }
  }

  const newApp = {
    id: nextId,
    full_name: full_name.trim(),
    unit: (unit || 'Đoàn viên TDMU').trim(),
    phone: (phone || '').trim(),
    email: (email || '').trim(),
    type: type.trim(),
    amount_requested: parseFloat(amount_requested) || 1000000,
    amount_approved: null,
    reason: reason.trim(),
    proof_url: proofUrl,
    submitted_at: new Date().toISOString(),
    status: 'pending', // pending | approved | rejected | disbursed
    decision_note: 'Chờ Ban Thường Vụ xét duyệt',
    approved_by: null,
    approved_at: null,
    disbursed_at: null
  };

  db.don_tro_cap.unshift(newApp);
  saveDB(db);
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
