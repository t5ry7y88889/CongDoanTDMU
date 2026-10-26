/**
 * Welfare Controller - Nghiệp Vụ Quỹ Phúc Lợi & Chăm Lo Đoàn Viên
 * Công Đoàn Trường Đại Học Thủ Dầu Một
 */

const { loadDB, saveDB } = require('../db');
const {
  getWelfareFromDb,
  getWelfareApplicationsFromDb,
  insertWelfareApplicationToDb,
  updateWelfareApplicationInDb,
  deleteWelfareApplicationInDb,
  getWelfareFundFromDb,
  getWelfareTransactionsFromDb,
  depositWelfareFundInDb,
  disburseWelfareFundInDb
} = require('../mssql_db');

/**
 * Lấy tình trạng quỹ và sổ cái thu chi
 */
async function getFundSummary(req, res) {
  try {
    const fund = await getWelfareFundFromDb();
    const transactions = await getWelfareTransactionsFromDb();
    
    // Lấy danh sách hồ sơ để đếm số lượng và kinh phí chờ duyệt / đã duyệt
    let apps = await getWelfareApplicationsFromDb();
    if (!apps || !apps.length) {
      const db = loadDB();
      apps = db.don_tro_cap || db.aid_requests || [];
    }

    const pendingApps = apps.filter(d => d.status === 'pending');
    const pendingAmount = pendingApps.reduce((sum, d) => sum + (parseFloat(d.amount_requested) || 0), 0);
    const approvedApps = apps.filter(d => d.status === 'approved' || d.status === 'disbursed');
    const approvedAmount = approvedApps.reduce((sum, d) => sum + (parseFloat(d.amount_approved) || parseFloat(d.amount_requested) || 0), 0);

    const currentBalance = Number(fund.current_balance !== undefined ? fund.current_balance : (fund.total_balance || 185000000));
    const totalDeposited = Number(fund.total_deposited !== undefined ? fund.total_deposited : (fund.total_inflow || 250000000));
    const totalDisbursed = Number(fund.total_disbursed !== undefined ? fund.total_disbursed : (fund.total_outflow || 65000000));

    res.json({
      success: true,
      fund: {
        fund_id: fund.fund_id || 1,
        fund_name: fund.fund_name || 'Quỹ Chăm Lo & Tương Trợ Đoàn Viên TDMU',
        current_balance: currentBalance,
        total_deposited: totalDeposited,
        total_disbursed: totalDisbursed,
        pending_count: pendingApps.length,
        pending_amount: pendingAmount,
        approved_count: approvedApps.length,
        approved_amount: approvedAmount,
        // Backward-compatibility aliases
        total_balance: currentBalance,
        total_inflow: totalDeposited,
        total_outflow: totalDisbursed,
        pending_requests: pendingApps.length,
        approved_requests: approvedApps.length
      },
      transactions: transactions || []
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Nạp tiền / Ghi nhận khoản thu vào quỹ
 */
async function depositFund(req, res) {
  try {
    const { amount, source, source_name, decision_no, note, actor, created_by } = req.body;
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      return res.status(400).json({ success: false, error: 'Số tiền nạp không hợp lệ' });
    }

    const result = await depositWelfareFundInDb({
      amount: parsedAmount,
      source_name: (source_name || source || 'Kinh phí Công đoàn cấp trên').trim(),
      decision_no: (decision_no || '').trim(),
      note: (note || 'Cấp bổ sung ngân sách Quỹ Chăm lo và Tương trợ đoàn viên').trim(),
      created_by: (created_by || actor || 'Ban Thường Vụ Công Đoàn').trim()
    });
    res.json({ success: true, message: 'Nạp quỹ thành công', data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Chi trả trợ cấp / Chi quỹ chăm lo
 */
async function disburseFund(req, res) {
  try {
    const { amount, recipient, recipient_name, applicationId, related_don_id, reason, note, actor, created_by, decision_no } = req.body;
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      return res.status(400).json({ success: false, error: 'Số tiền chi không hợp lệ' });
    }

    const result = await disburseWelfareFundInDb({
      amount: parsedAmount,
      recipient_name: (recipient_name || recipient || 'Đoàn viên công đoàn').trim(),
      decision_no: (decision_no || '').trim(),
      note: (note || reason || 'Chi trợ cấp khó khăn').trim(),
      created_by: (created_by || actor || 'Ban Thường Vụ Công Đoàn').trim(),
      related_don_id: applicationId || related_don_id || null
    });
    res.json({ success: true, message: 'Giải ngân trợ cấp thành công', data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Lấy danh sách hồ sơ xin trợ cấp
 */
async function getApplications(req, res) {
  try {
    const { status, search } = req.query;
    let list = await getWelfareApplicationsFromDb(status, search);
    if (!list) {
      const db = loadDB();
      list = db.don_tro_cap || db.aid_requests || [];
      if (status && status !== 'all') {
        list = list.filter(d => d.status === status);
      }
      if (search) {
        const s = search.toLowerCase();
        list = list.filter(d =>
          (d.full_name || '').toLowerCase().includes(s) ||
          (d.unit || '').toLowerCase().includes(s) ||
          (d.type || '').toLowerCase().includes(s) ||
          (d.reason || '').toLowerCase().includes(s)
        );
      }
    }
    res.json({ success: true, count: list.length, data: list });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Nộp hồ sơ xin trợ cấp mới
 */
async function createApplication(req, res) {
  try {
    const data = req.body;
    let result = await insertWelfareApplicationToDb(data);
    if (!result) {
      const db = loadDB();
      db.don_tro_cap = db.don_tro_cap || [];
      data.id = db.don_tro_cap.length ? Math.max(...db.don_tro_cap.map(d => parseInt(d.id) || 0)) + 1 : 1;
      data.submitted_at = new Date().toISOString();
      data.status = data.status || 'pending';
      db.don_tro_cap.unshift(data);
      db.aid_requests = db.don_tro_cap;
      saveDB(db);
      result = data;
    }
    res.json({ success: true, message: 'Đã gửi hồ sơ đề nghị trợ cấp thành công', data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Cập nhật hồ sơ xin trợ cấp (phê duyệt / từ chối / chi trả)
 */
async function updateApplication(req, res) {
  try {
    const id = parseInt(req.params.id);
    const data = req.body;
    await updateWelfareApplicationInDb(id, data);

    // Sync vào JSON DB
    const db = loadDB();
    const list = db.don_tro_cap || db.aid_requests || [];
    const item = list.find(d => d.id === id);
    if (item) {
      Object.assign(item, data);
      db.don_tro_cap = list;
      db.aid_requests = list;
      saveDB(db);
    }

    // Nếu trạng thái duyệt là disbursed, tự động ghi nhận vào sổ chi quỹ nếu chưa chi
    if (data.status === 'disbursed' && data.amount_approved) {
      await disburseWelfareFundInDb({
        amount: parseFloat(data.amount_approved),
        recipient_name: (item ? item.full_name : '') || 'Đoàn viên công đoàn',
        decision_no: data.decision_no || `QĐ-TC-${id}`,
        note: `Chi trợ cấp mã hồ sơ #TC-${id}`,
        created_by: data.approved_by || 'Ban Thường Vụ Công Đoàn',
        related_don_id: id
      });
    }

    res.json({ success: true, message: 'Cập nhật hồ sơ thành công' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Xóa hồ sơ trợ cấp
 */
async function deleteApplication(req, res) {
  try {
    const id = parseInt(req.params.id);
    await deleteWelfareApplicationInDb(id);

    // Xóa trong JSON DB
    const db = loadDB();
    if (db.don_tro_cap) db.don_tro_cap = db.don_tro_cap.filter(d => d.id !== id);
    if (db.aid_requests) db.aid_requests = db.aid_requests.filter(d => d.id !== id);
    saveDB(db);

    res.json({ success: true, message: 'Đã xóa hồ sơ trợ cấp thành công' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Lấy danh mục chế độ phúc lợi chung
 */
async function getAllWelfarePrograms(req, res) {
  try {
    const list = await getWelfareFromDb();
    res.json({ success: true, count: list.length, data: list });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getFundSummary,
  depositFund,
  disburseFund,
  getApplications,
  createApplication,
  updateApplication,
  deleteApplication,
  getAllWelfarePrograms
};
