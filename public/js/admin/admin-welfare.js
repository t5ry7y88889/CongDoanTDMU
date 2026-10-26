// =============================================================================
// ADMIN WELFARE & FUND MANAGEMENT (QUẢN LÝ QUỸ CHĂM LO & TRỢ CẤP ĐOÀN VIÊN)
// =============================================================================

let adminWelfareList = [];
let currentWelfareFilter = 'all';
let reviewingAppId = null;

let currentFundData = null;
let currentFundTransactions = [];
let currentLedgerFilter = 'all';
let activeWelfareSubTab = 'apps'; // 'apps' | 'ledger'

// 1. Khởi tạo và tải dữ liệu toàn diện
async function loadAdminWelfare() {
  const tbodyApps = document.getElementById('admin_welfare_table_body');
  if (tbodyApps) {
    tbodyApps.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 24px; color: #64748B;"><i class="fa-solid fa-circle-notch fa-spin me-2"></i> Đang tải dữ liệu hồ sơ trợ cấp...</td></tr>';
  }

  try {
    // 1. Tải dữ liệu Quỹ và Sổ giao dịch Thu - Chi
    await loadAdminFund();

    // 2. Tải danh sách đơn trợ cấp
    const res = await fetch('/api/welfare/applications').then(r => r.json());
    if (res.success) {
      adminWelfareList = res.data || [];
      renderAdminWelfareTable();
      updateWelfareBadgeCount();
      renderWelfareSummaryStats();
    } else {
      if (tbodyApps) tbodyApps.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 24px; color: #EF4444;">Không thể tải danh sách đơn trợ cấp.</td></tr>';
    }
  } catch (e) {
    console.error('Lỗi loadAdminWelfare:', e);
    if (tbodyApps) tbodyApps.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 24px; color: #EF4444;">Lỗi kết nối máy chủ khi tải dữ liệu Chăm lo.</td></tr>';
  }
}

// 2. Tải thông tin Quỹ & Sổ thu chi
async function loadAdminFund() {
  try {
    const res = await fetch('/api/welfare/fund').then(r => r.json());
    if (res.success && res.fund) {
      currentFundData = res.fund;
      currentFundTransactions = res.transactions || [];

      // Hiển thị KPI Thống Kê Nguồn Tiền
      const balance = parseFloat(res.fund.current_balance) || 0;
      const totalDeposited = parseFloat(res.fund.total_deposited) || 0;
      const totalDisbursed = parseFloat(res.fund.total_disbursed) || 0;
      const pendingCount = res.fund.pending_count || 0;
      const pendingAmount = parseFloat(res.fund.pending_amount) || 0;
      const approvedCount = res.fund.approved_count || 0;

      safeSetText('welfare_stat_balance', balance.toLocaleString('vi-VN') + ' đ');
      safeSetText('welfare_stat_total_budget', totalDeposited.toLocaleString('vi-VN') + ' đ');
      safeSetText('welfare_stat_disbursed', totalDisbursed.toLocaleString('vi-VN') + ' đ');
      safeSetText('welfare_stat_beneficiaries', approvedCount);
      safeSetText('welfare_stat_pending_count', `${pendingCount} hồ sơ`);
      safeSetText('welfare_stat_pending_amount', pendingAmount.toLocaleString('vi-VN') + ' đ');

      // Cập nhật trạng thái hạn mức
      const balanceBadge = document.getElementById('welfare_balance_status_badge');
      if (balanceBadge) {
        if (balance > 20000000) {
          balanceBadge.className = 'badge bg-success';
          balanceBadge.innerHTML = '<i class="fa-solid fa-shield-check me-1"></i>Hạn Mức An Toàn';
        } else if (balance > 0) {
          balanceBadge.className = 'badge bg-warning text-dark';
          balanceBadge.innerHTML = '<i class="fa-solid fa-triangle-exclamation me-1"></i>Ngân Sách Thấp';
        } else {
          balanceBadge.className = 'badge bg-danger';
          balanceBadge.innerHTML = '<i class="fa-solid fa-circle-exclamation me-1"></i>Đã Cạn Quỹ';
        }
      }

      renderFundLedgerTable();
    }
  } catch (err) {
    console.error('Lỗi loadAdminFund:', err);
  }
}

// 3. Cập nhật Badge số đơn chờ trên Sidebar
function updateWelfareBadgeCount() {
  const pendingCount = adminWelfareList.filter(d => d.status === 'pending').length;
  const badgeEl = document.getElementById('sidebar_welfare_count');
  if (badgeEl) {
    badgeEl.innerText = pendingCount;
    badgeEl.style.display = pendingCount > 0 ? 'inline-block' : 'none';
  }
}

// 4. Thống kê tổng hợp
function renderWelfareSummaryStats() {
  const total = adminWelfareList.length;
  const pending = adminWelfareList.filter(d => d.status === 'pending').length;
  const approved = adminWelfareList.filter(d => d.status === 'approved' || d.status === 'disbursed').length;

  safeSetText('welfare_stat_total_apps', total);
  safeSetText('welfare_stat_pending', pending);
  safeSetText('welfare_stat_approved', approved);
}

// 5. Chuyển đổi giữa 2 Sub-tab: Danh Sách Đơn vs Sổ Quỹ Thu Chi
function switchWelfareSubTab(tabName) {
  activeWelfareSubTab = tabName;
  const btnApps = document.getElementById('btn_welfare_subtab_apps');
  const btnLedger = document.getElementById('btn_welfare_subtab_ledger');
  const paneApps = document.getElementById('welfare_subtab_apps_pane');
  const paneLedger = document.getElementById('welfare_subtab_ledger_pane');

  if (tabName === 'apps') {
    if (btnApps) {
      btnApps.style.background = '#002855';
      btnApps.style.color = '#FFFFFF';
      btnApps.style.borderColor = '#002855';
    }
    if (btnLedger) {
      btnLedger.style.background = '#FFFFFF';
      btnLedger.style.color = '#475569';
      btnLedger.style.borderColor = '#CBD5E1';
    }
    if (paneApps) paneApps.style.display = 'block';
    if (paneLedger) paneLedger.style.display = 'none';
  } else {
    if (btnLedger) {
      btnLedger.style.background = '#002855';
      btnLedger.style.color = '#FFFFFF';
      btnLedger.style.borderColor = '#002855';
    }
    if (btnApps) {
      btnApps.style.background = '#FFFFFF';
      btnApps.style.color = '#475569';
      btnApps.style.borderColor = '#CBD5E1';
    }
    if (paneApps) paneApps.style.display = 'none';
    if (paneLedger) paneLedger.style.display = 'block';
  }
}

// 6. Lọc đơn trợ cấp
function filterWelfareStatus(status) {
  currentWelfareFilter = status;
  document.querySelectorAll('.btn-welf-filter').forEach(b => {
    if (b.dataset.status === status) {
      b.style.background = '#D97706';
      b.style.color = 'white';
      b.style.borderColor = '#D97706';
    } else {
      b.style.background = '#F1F5F9';
      b.style.color = '#475569';
      b.style.borderColor = '#E2E8F0';
    }
  });
  renderAdminWelfareTable();
}

function searchAdminWelfare(q) {
  renderAdminWelfareTable(q);
}

// 7. Render bảng đơn đề nghị trợ cấp
function renderAdminWelfareTable(searchQuery = '') {
  const tbody = document.getElementById('admin_welfare_table_body');
  if (!tbody) return;

  const strip = str => (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLowerCase();
  const q = strip(searchQuery || document.getElementById('admin_welfare_search')?.value || '');

  let filtered = adminWelfareList;
  if (currentWelfareFilter !== 'all') {
    filtered = filtered.filter(d => d.status === currentWelfareFilter);
  }
  if (q) {
    filtered = filtered.filter(d =>
      strip(d.full_name).includes(q) ||
      strip(d.unit).includes(q) ||
      strip(d.type).includes(q) ||
      strip(d.reason).includes(q)
    );
  }

  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 32px; color: #94A3B8; font-style: italic;"><i class="fa-solid fa-inbox fa-2x mb-2 d-block text-muted"></i>Không tìm thấy hồ sơ trợ cấp nào phù hợp.</td></tr>';
    return;
  }

  const statusBadges = {
    pending: '<span style="background: #FEF3C7; color: #D97706; padding: 4px 8px; border-radius: 4px; font-weight: 700; font-size: 11px; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-clock"></i>Chờ Xét Duyệt</span>',
    approved: '<span style="background: #EFF6FF; color: #1D4ED8; padding: 4px 8px; border-radius: 4px; font-weight: 700; font-size: 11px; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-check-circle"></i>Đã Duyệt Hỗ Trợ</span>',
    disbursed: '<span style="background: #ECFDF5; color: #059669; padding: 4px 8px; border-radius: 4px; font-weight: 700; font-size: 11px; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-money-bill-transfer"></i>Đã Chi Trả Tiền</span>',
    rejected: '<span style="background: #FEE2E2; color: #DC2626; padding: 4px 8px; border-radius: 4px; font-weight: 700; font-size: 11px; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-xmark"></i>Không Đủ ĐK</span>'
  };

  tbody.innerHTML = filtered.map(d => {
    const dateStr = d.submitted_at ? new Date(d.submitted_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/A';
    const reqAmount = (parseFloat(d.amount_requested) || 0).toLocaleString('vi-VN') + ' đ';
    const appAmount = d.amount_approved !== null && d.amount_approved !== undefined ? (parseFloat(d.amount_approved)).toLocaleString('vi-VN') + ' đ' : '<span style="color: #94A3B8;">Chưa duyệt</span>';

    return `
      <tr style="border-bottom: 1px solid #F1F5F9; transition: background 0.15s;" onmouseover="this.style.background='#F8FAFC'" onmouseout="this.style.background='white'">
        <td style="padding: 14px 16px; font-weight: 800; color: #002855; white-space: nowrap;">
          <span style="background: #F1F5F9; color: #002855; padding: 3px 8px; border-radius: 4px; font-size: 12px;">#TC-${d.id}</span>
          <div style="font-size: 11px; font-weight: 500; color: #94A3B8; margin-top: 4px;"><i class="fa-regular fa-calendar me-1"></i>${dateStr}</div>
        </td>
        <td style="padding: 14px 16px;">
          <div style="font-weight: 700; color: #1E293B; font-size: 13.5px;">${escapeHtml(d.full_name)}</div>
          <div style="font-size: 12px; color: #64748B;"><i class="fa-solid fa-building-columns me-1 text-muted"></i>${escapeHtml(d.unit)}</div>
          <div style="font-size: 11.5px; color: #0284C7; margin-top: 2px;"><i class="fa-solid fa-phone me-1"></i>${escapeHtml(d.phone || 'N/A')}</div>
        </td>
        <td style="padding: 14px 16px;">
          <div style="font-weight: 700; color: #003865; margin-bottom: 3px; font-size: 13px;">${escapeHtml(d.type)}</div>
          <div style="font-size: 12px; color: #475569; line-height: 1.45; max-width: 320px;">${escapeHtml(d.reason)}</div>
          ${d.proof_url ? `<div style="margin-top: 4px;"><a href="${d.proof_url}" target="_blank" style="font-size: 11.5px; color: #0284C7; text-decoration: none; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-paperclip"></i> Xem hồ sơ minh chứng đính kèm</a></div>` : ''}
        </td>
        <td style="padding: 14px 16px; white-space: nowrap; font-weight: 800; color: #B45309; font-size: 13.5px;">
          ${reqAmount}
        </td>
        <td style="padding: 14px 16px; white-space: nowrap;">
          ${statusBadges[d.status] || '<span class="badge bg-secondary">Khác</span>'}
        </td>
        <td style="padding: 14px 16px; white-space: nowrap;">
          <div style="font-weight: 800; color: #059669; font-size: 13.5px;">${appAmount}</div>
          <div style="font-size: 11px; color: #64748B; max-width: 200px; white-space: normal; line-height: 1.35; margin-top: 2px;">${escapeHtml(d.decision_note || '')}</div>
        </td>
        <td style="padding: 14px 16px; text-align: right; white-space: nowrap;">
          <button type="button" onclick="openReviewWelfareModal(${d.id})" style="background: #D97706; color: white; border: none; border-radius: 6px; padding: 6px 14px; font-size: 12px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; margin-right: 4px; box-shadow: 0 1px 3px rgba(217,119,6,0.25);">
            <i class="fa-solid fa-gavel"></i> Xét Duyệt
          </button>
          <button type="button" onclick="deleteAdminWelfare(${d.id})" style="background: #FEE2E2; border: 1px solid #FECACA; color: #DC2626; border-radius: 6px; padding: 6px 10px; font-size: 12px; cursor: pointer;" title="Xóa hồ sơ">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// 8. Render Bảng Sổ Quỹ Thu - Chi (Ledger)
function filterFundLedger(type) {
  currentLedgerFilter = type;
  document.querySelectorAll('.btn-ledger-filter').forEach(b => {
    if (b.dataset.type === type) {
      b.style.background = '#059669';
      b.style.color = 'white';
      b.style.borderColor = '#059669';
    } else {
      b.style.background = '#F1F5F9';
      b.style.color = '#475569';
      b.style.borderColor = '#E2E8F0';
    }
  });
  renderFundLedgerTable();
}

function searchFundLedger(q) {
  renderFundLedgerTable(q);
}

function renderFundLedgerTable(searchQuery = '') {
  const tbody = document.getElementById('admin_fund_ledger_table_body');
  if (!tbody) return;

  const strip = str => (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLowerCase();
  const q = strip(searchQuery || document.getElementById('admin_ledger_search')?.value || '');

  let list = currentFundTransactions || [];
  if (currentLedgerFilter !== 'all') {
    list = list.filter(d => d.type === currentLedgerFilter);
  }
  if (q) {
    list = list.filter(d =>
      strip(d.code).includes(q) ||
      strip(d.source_name).includes(q) ||
      strip(d.decision_no).includes(q) ||
      strip(d.note).includes(q) ||
      strip(d.created_by).includes(q)
    );
  }

  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 32px; color: #94A3B8; font-style: italic;"><i class="fa-solid fa-receipt fa-2x mb-2 d-block text-muted"></i>Chưa có giao dịch thu / chi nào trong sổ quỹ.</td></tr>';
    return;
  }

  tbody.innerHTML = list.map(t => {
    const isDeposit = (t.type === 'DEPOSIT');
    const typeBadge = isDeposit
      ? '<span style="background: #ECFDF5; color: #059669; padding: 4px 8px; border-radius: 4px; font-weight: 700; font-size: 11px; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-arrow-down-left"></i>+ NẠP QUỸ / CẤP KINH PHÍ</span>'
      : '<span style="background: #FEF2F2; color: #DC2626; padding: 4px 8px; border-radius: 4px; font-weight: 700; font-size: 11px; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-arrow-up-right"></i>- CHI TRỢ CẤP ĐOÀN VIÊN</span>';

    const amtDisplay = isDeposit
      ? `<span style="color: #059669; font-weight: 800; font-size: 14px;">+ ${(parseFloat(t.amount) || 0).toLocaleString('vi-VN')} đ</span>`
      : `<span style="color: #DC2626; font-weight: 800; font-size: 14px;">- ${(parseFloat(t.amount) || 0).toLocaleString('vi-VN')} đ</span>`;

    const dateStr = t.date ? new Date(t.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';

    return `
      <tr style="border-bottom: 1px solid #F1F5F9; transition: background 0.15s;" onmouseover="this.style.background='#F8FAFC'" onmouseout="this.style.background='white'">
        <td style="padding: 12px 16px; white-space: nowrap;">
          <div style="font-weight: 800; color: #002855; font-size: 12.5px;">${escapeHtml(t.code || 'GD-N/A')}</div>
          <div style="font-size: 11px; color: #94A3B8; margin-top: 3px;"><i class="fa-regular fa-clock me-1"></i>${dateStr}</div>
        </td>
        <td style="padding: 12px 16px; white-space: nowrap;">
          ${typeBadge}
        </td>
        <td style="padding: 12px 16px; white-space: nowrap;">
          ${amtDisplay}
        </td>
        <td style="padding: 12px 16px;">
          <div style="font-weight: 700; color: #1E293B; font-size: 13px;">${escapeHtml(t.source_name || 'Nguồn Công đoàn')}</div>
          ${t.related_don_id ? `<div style="font-size: 11.5px; color: #0284C7; margin-top: 2px;"><i class="fa-solid fa-link me-1"></i>Hồ sơ trợ cấp: #TC-${t.related_don_id}</div>` : ''}
        </td>
        <td style="padding: 12px 16px; white-space: nowrap;">
          <span style="font-size: 12px; font-weight: 600; color: #475569; background: #F8FAFC; border: 1px solid #E2E8F0; padding: 2px 8px; border-radius: 4px;">
            ${escapeHtml(t.decision_no || 'Không số')}
          </span>
        </td>
        <td style="padding: 12px 16px; font-size: 12.5px; color: #334155; white-space: nowrap;">
          <i class="fa-solid fa-user-check me-1 text-muted"></i>${escapeHtml(t.created_by || 'Ban Thường Vụ')}
        </td>
        <td style="padding: 12px 16px; font-size: 12px; color: #64748B; max-width: 280px; line-height: 1.4;">
          ${escapeHtml(t.note || '')}
        </td>
      </tr>
    `;
  }).join('');
}

// 9. Modal Nạp Tiền Vào Quỹ
function openDepositFundModal() {
  const modal = document.getElementById('modal_deposit_welfare_fund');
  if (!modal) return;

  // Reset form
  document.getElementById('deposit_fund_amount').value = '';
  document.getElementById('deposit_fund_decision_no').value = '';
  document.getElementById('deposit_fund_note').value = 'Cấp bổ sung ngân sách Quỹ Chăm lo và Tương trợ đoàn viên';
  
  // Hiển thị số dư hiện tại trong modal
  const curBal = currentFundData ? (parseFloat(currentFundData.current_balance) || 0).toLocaleString('vi-VN') + ' đ' : '---';
  safeSetText('modal_deposit_current_balance', curBal);

  modal.style.display = 'flex';
}

function closeDepositFundModal() {
  const modal = document.getElementById('modal_deposit_welfare_fund');
  if (modal) modal.style.display = 'none';
}

function setDepositQuickAmount(amt) {
  const input = document.getElementById('deposit_fund_amount');
  if (input) {
    input.value = amt;
    input.focus();
  }
}

async function submitDepositFund() {
  const amount = parseFloat(document.getElementById('deposit_fund_amount').value) || 0;
  const source_name = document.getElementById('deposit_fund_source').value.trim();
  const decision_no = document.getElementById('deposit_fund_decision_no').value.trim();
  const note = document.getElementById('deposit_fund_note').value.trim();
  const created_by = document.getElementById('deposit_fund_created_by')?.value.trim() || 'Ban Thường Vụ Công Đoàn';

  if (amount <= 0) {
    alert('⚠️ Vui lòng nhập số tiền nạp quỹ hợp lệ lớn hơn 0 đồng!');
    document.getElementById('deposit_fund_amount').focus();
    return;
  }

  if (!source_name) {
    alert('⚠️ Vui lòng chọn hoặc điền nguồn kinh phí cấp nạp!');
    return;
  }

  const btn = document.getElementById('btn_submit_deposit');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-2"></i>Đang ghi nhận...';
  }

  try {
    const res = await fetch('/api/welfare/fund/deposit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount,
        source_name,
        decision_no,
        note,
        created_by
      })
    }).then(r => r.json());

    if (res.success) {
      alert(`🎉 ${res.message}`);
      closeDepositFundModal();
      await loadAdminWelfare();
      // Chuyển sang xem Sổ quỹ để thấy ngay giao dịch
      switchWelfareSubTab('ledger');
    } else {
      alert('Lỗi nạp quỹ: ' + (res.error || res.message));
    }
  } catch (e) {
    alert('Lỗi kết nối khi nạp quỹ: ' + e.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-check me-1"></i> Xác Nhận Nạp Quỹ';
    }
  }
}

// 10. Modal Xét Duyệt Hồ Sơ Trợ Cấp
function openReviewWelfareModal(id) {
  const item = adminWelfareList.find(d => d.id === id);
  if (!item) return;

  reviewingAppId = id;
  document.getElementById('modal_welf_name').innerText = `${item.full_name} (${item.unit})`;
  document.getElementById('modal_welf_contact').innerText = `SĐT: ${item.phone || 'N/A'} | Email: ${item.email || 'N/A'}`;
  document.getElementById('modal_welf_type').innerText = item.type;
  document.getElementById('modal_welf_reason').innerText = item.reason;
  document.getElementById('modal_welf_req_amount').innerText = (item.amount_requested || 0).toLocaleString('vi-VN') + ' đ';

  // Hiển thị số dư quỹ khả dụng cho người xét duyệt xem
  const availBalance = currentFundData ? (parseFloat(currentFundData.current_balance) || 0) : 0;
  const availEl = document.getElementById('modal_welf_avail_fund');
  if (availEl) {
    availEl.innerText = availBalance.toLocaleString('vi-VN') + ' đ';
    if (availBalance <= 0) {
      availEl.style.color = '#DC2626';
    } else {
      availEl.style.color = '#059669';
    }
  }

  document.getElementById('modal_welf_app_amount').value = item.amount_approved !== null && item.amount_approved !== undefined ? item.amount_approved : item.amount_requested || 1000000;
  document.getElementById('modal_welf_status_select').value = item.status || 'approved';
  document.getElementById('modal_welf_note').value = item.decision_note || 'Ban Thường Vụ phê duyệt chi trợ cấp trích từ Quỹ Chăm lo Công đoàn.';

  document.getElementById('modal_review_welfare').style.display = 'flex';
}

function closeReviewWelfareModal() {
  document.getElementById('modal_review_welfare').style.display = 'none';
  reviewingAppId = null;
}

async function submitWelfareReview() {
  if (!reviewingAppId) return;

  const status = document.getElementById('modal_welf_status_select').value;
  const amount_approved = parseFloat(document.getElementById('modal_welf_app_amount').value) || 0;
  const decision_note = document.getElementById('modal_welf_note').value.trim();

  // Kiểm tra hạn mức quỹ nếu duyệt hoặc chi trả
  if ((status === 'approved' || status === 'disbursed') && currentFundData) {
    const availBalance = parseFloat(currentFundData.current_balance) || 0;
    if (amount_approved > availBalance) {
      const confirmOver = confirm(`⚠️ CẢNH BÁO QUỸ:\nSố tiền duyệt (${amount_approved.toLocaleString('vi-VN')} đ) lớn hơn Số Dư Khả Dụng hiện tại của Quỹ (${availBalance.toLocaleString('vi-VN')} đ)!\n\nBạn có muốn tiếp tục phê duyệt không? (Khuyến nghị: Hãy nạp bổ sung kinh phí vào Quỹ trước khi giải ngân).`);
      if (!confirmOver) return;
    }
  }

  try {
    const res = await fetch(`/api/welfare/applications/${reviewingAppId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status,
        amount_approved,
        decision_note,
        approved_by: 'Ban Thường Vụ Công Đoàn'
      })
    }).then(r => r.json());

    if (res.success) {
      alert('✅ Đã cập nhật kết quả xét duyệt hồ sơ trợ cấp thành công!');
      closeReviewWelfareModal();
      await loadAdminWelfare();
    } else {
      alert('Lỗi: ' + (res.error || res.message));
    }
  } catch (e) {
    alert('Lỗi kết nối: ' + e.message);
  }
}

// 11. Xóa hồ sơ
async function deleteAdminWelfare(id) {
  if (!confirm(`Xác nhận xóa hồ sơ đề nghị trợ cấp #TC-${id}?`)) return;
  try {
    const res = await fetch(`/api/welfare/applications/${id}`, { method: 'DELETE' }).then(r => r.json());
    if (res.success) {
      alert('✅ Đã xóa hồ sơ trợ cấp thành công!');
      loadAdminWelfare();
    } else {
      alert('Lỗi: ' + res.error);
    }
  } catch (e) {
    alert('Lỗi kết nối: ' + e.message);
  }
}

// 12. Xuất Báo Cáo Sổ Quỹ Thu Chi (CSV UTF-8 BOM tải về trực tiếp)
function exportFundLedger() {
  if (!currentFundTransactions || !currentFundTransactions.length) {
    alert('Chưa có dữ liệu giao dịch trong sổ quỹ để xuất báo cáo.');
    return;
  }

  const headers = ['Mã Giao Dịch', 'Thời Gian', 'Loại Giao Dịch', 'Số Tiền (VNĐ)', 'Nguồn Cấp / Thụ Hưởng', 'Số Quyết Định / Chứng Từ', 'Người Thực Hiện', 'Ghi Chú'];
  const rows = currentFundTransactions.map(t => [
    `"${t.code || ''}"`,
    `"${t.date ? new Date(t.date).toLocaleString('vi-VN') : ''}"`,
    `"${t.type === 'DEPOSIT' ? 'Nạp Quỹ / Cấp Ngân Sách' : 'Xuất Chi Trợ Cấp'}"`,
    `"${t.amount || 0}"`,
    `"${(t.source_name || '').replace(/"/g, '""')}"`,
    `"${(t.decision_no || '').replace(/"/g, '""')}"`,
    `"${(t.created_by || '').replace(/"/g, '""')}"`,
    `"${(t.note || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `So_Quy_Cham_Lo_Cong_Doan_TDMU_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Helpers
function safeSetText(id, text) {
  const el = document.getElementById(id);
  if (el) el.innerText = text;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
