const express = require('express');
const router = express.Router();
const { loadDB, saveDB } = require('../db');
const { getMonthlyReportsFromDb } = require('../mssql_db');

// =========================================================================
// MONTHLY REPORTS & EMULATION RANKINGS
// =========================================================================
router.get('/', async (req, res) => {
  let reports = await getMonthlyReportsFromDb();
  const { month, year, union_id } = req.query;

  if (month) {
    reports = reports.filter(r => r.month == month);
  }
  if (year) {
    reports = reports.filter(r => r.year == year);
  }
  if (union_id) {
    reports = reports.filter(r => r.union_id === union_id || r.unit_id == union_id);
  }

  res.json({ success: true, count: reports.length, data: reports });
});

router.post('/', (req, res) => {
  try {
    const db = loadDB();
    if (!db.monthly_reports) db.monthly_reports = [];

    const newReport = {
      id: db.monthly_reports.length > 0 ? Math.max(...db.monthly_reports.map(r => r.id)) + 1 : 1,
      union_id: req.body.union_id || "TCD_01",
      union_name: req.body.union_name || "Công đoàn cơ sở",
      month: parseInt(req.body.month) || new Date().getMonth() + 1,
      year: parseInt(req.body.year) || new Date().getFullYear(),
      reporter_name: req.body.reporter_name || "",
      reporter_email: req.body.reporter_email || "",
      timestamp: new Date().toLocaleString('vi-VN'),
      total_staff: parseInt(req.body.total_staff) || 0,
      total_union_members: parseInt(req.body.total_union_members) || 0,
      female_union_members: parseInt(req.body.female_union_members) || 0,
      new_members_month: parseInt(req.body.new_members_month) || 0,
      resigned_members_month: parseInt(req.body.resigned_members_month) || 0,
      party_introduced_members: parseInt(req.body.party_introduced_members) || 0,
      party_admitted_members: parseInt(req.body.party_admitted_members) || 0,
      severe_illness_count: parseInt(req.body.severe_illness_count) || 0,
      cared_members_count: parseInt(req.body.cared_members_count) || 0,
      total_care_fund: parseFloat(req.body.total_care_fund) || 0,
      work_accidents_count: parseInt(req.body.work_accidents_count) || 0,
      fatal_accidents_count: parseInt(req.body.fatal_accidents_count) || 0,
      inspection_sessions_count: parseInt(req.body.inspection_sessions_count) || 0,
      inspection_content: req.body.inspection_content || "",
      inspection_result: req.body.inspection_result || "",
      propaganda_sessions_count: parseInt(req.body.propaganda_sessions_count) || 0,
      propaganda_attendees_count: parseInt(req.body.propaganda_attendees_count) || 0,
      propaganda_content: req.body.propaganda_content || "",
      other_activities: req.body.other_activities || "",
      proof_url: req.body.proof_url || "",
      next_month_plan: req.body.next_month_plan || "",
      recommendations: req.body.recommendations || "",
      status: "approved",
      evaluation_score: 95
    };

    db.monthly_reports.push(newReport);
    saveDB(db);

    res.json({ success: true, message: "Nộp báo cáo tháng thành công!", data: newReport });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/summary', (req, res) => {
  const db = loadDB();
  const tradeUnions = db.trade_unions || [];
  const reports = db.monthly_reports || [];
  const targetMonth = parseInt(req.query.month) || 8;
  const targetYear = parseInt(req.query.year) || 2026;

  const monthReports = reports.filter(r => r.month === targetMonth && r.year === targetYear);

  const summary = tradeUnions.map((tu, idx) => {
    const report = monthReports.find(r => r.union_id === tu.id);
    return {
      stt: idx + 1,
      union_id: tu.id,
      union_name: tu.name,
      category: tu.category,
      has_submitted: !!report,
      reporter_name: report ? report.reporter_name : "Chưa nộp",
      timestamp: report ? report.timestamp : "",
      total_members: report ? report.total_union_members : 0,
      female_members: report ? report.female_union_members : 0,
      care_fund: report ? report.total_care_fund : 0,
      propaganda_sessions: report ? report.propaganda_sessions_count : 0,
      party_introduced: report ? report.party_introduced_members : 0,
      proof_url: report ? report.proof_url : "",
      evaluation_score: report ? report.evaluation_score : 0,
      evaluation_rank: report ? (report.evaluation_score >= 95 ? "Tổ CĐ Xuất Sắc" : "Tổ CĐ Hoàn Thành Tốt") : "Chưa Đánh Giá"
    };
  });

  const totalSubmitted = summary.filter(s => s.has_submitted).length;
  const totalCareFund = summary.reduce((sum, s) => sum + s.care_fund, 0);
  const totalMembers = summary.reduce((sum, s) => sum + s.total_members, 0);

  res.json({
    success: true,
    month: targetMonth,
    year: targetYear,
    stats: {
      total_unions: tradeUnions.length,
      submitted_count: totalSubmitted,
      pending_count: tradeUnions.length - totalSubmitted,
      submission_rate: Math.round((totalSubmitted / (tradeUnions.length || 1)) * 100),
      total_care_fund: totalCareFund,
      total_members: totalMembers
    },
    data: summary
  });
});

module.exports = router;
