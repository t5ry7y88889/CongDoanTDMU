// =============================================================================
// ADMIN WELFARE (QUẢN LÝ ĐƠN ĐỀ NGHỊ TRỢ CẤP & CHĂM LO ĐOÀN VIÊN)
// =============================================================================

let adminWelfareList = [];
let currentWelfareFilter = 'all';
let reviewingAppId = null;

async function loadAdminWelfare() {
  const tbody = document.getElementById('admin_welfare_table_body');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 24px; color: #64748B;"><i class="fa-solid fa-circle-notch fa-spin me-2"></i> Đang tải danh sách đơn đề nghị trợ cấp...</td></tr>';

  try {
    const res = await fetch('/api/welfare/applications').then(r => r.json());
    if (res.success) {
      adminWelfareList = res.data || [];
      renderAdminWelfareTable();
      updateWelfareBadgeCount();
      renderWelfareSummaryStats();
    } else {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 24px; color: #EF4444;">Không thể tải danh sách đơn trợ cấp.</td></tr>';
    }
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 24px; color: #EF4444;">Lỗi kết nối máy chủ.</td></tr>';
  }
}

function updateWelfareBadgeCount() {
  const pendingCount = adminWelfareList.filter(d => d.status === 'pending').length;
  const badgeEl = document.getElementById('sidebar_welfare_count');
  if (badgeEl) {
    badgeEl.innerText = pendingCount;
    badgeEl.style.display = pendingCount > 0 ? 'inline-block' : 'none';
  }
}

function renderWelfareSummaryStats() {
  const total = adminWelfareList.length;
  const pending = adminWelfareList.filter(d => d.status === 'pending').length;
  const approved = adminWelfareList.filter(d => d.status === 'approved' || d.status === 'disbursed').length;
  const totalAmount = adminWelfareList
    .filter(d => d.status === 'approved' || d.status === 'disbursed')
    .reduce((sum, d) => sum + (d.amount_approved || d.amount_requested || 0), 0);

  safeSetText('welfare_stat_total', total);
  safeSetText('welfare_stat_pending', pending);
  safeSetText('welfare_stat_approved', approved);
  safeSetText('welfare_stat_amount', totalAmount.toLocaleString('vi-VN') + ' đ');
}

function filterWelfareStatus(status) {
  currentWelfareFilter = status;
  document.querySelectorAll('.btn-welf-filter').forEach(b => {
    if (b.dataset.status === status) {
      b.style.background = '#D97706';
      b.style.color = 'white';
    } else {
      b.style.background = '#F1F5F9';
      b.style.color = '#475569';
    }
  });
  renderAdminWelfareTable();
}

function searchAdminWelfare(q) {
  renderAdminWelfareTable(q);
}

function renderAdminWelfareTable(searchQuery = '') {
  const tbody = document.getElementById('admin_welfare_table_body');
  if (!tbody) return;

  const strip = str => (str || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[đĐ]/g, 'd').toLowerCase();
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
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 28px; color: #94A3B8; font-style: italic;">Không tìm thấy hồ sơ trợ cấp nào phù hợp.</td></tr>';
    return;
  }

  const statusBadges = {
    pending: '<span style="background: #FEF3C7; color: #D97706; padding: 4px 8px; border-radius: 4px; font-weight: 700; font-size: 11px;"><i class="fa-solid fa-clock me-1"></i>Chờ Xét Duyệt</span>',
    approved: '<span style="background: #EFF6FF; color: #1D4ED8; padding: 4px 8px; border-radius: 4px; font-weight: 700; font-size: 11px;"><i class="fa-solid fa-check-circle me-1"></i>Đã Duyệt Hỗ Trợ</span>',
    disbursed: '<span style="background: #ECFDF5; color: #059669; padding: 4px 8px; border-radius: 4px; font-weight: 700; font-size: 11px;"><i class="fa-solid fa-money-bill-transfer me-1"></i>Đã Chi Trả</span>',
    rejected: '<span style="background: #FEE2E2; color: #DC2626; padding: 4px 8px; border-radius: 4px; font-weight: 700; font-size: 11px;"><i class="fa-solid fa-xmark me-1"></i>Không Đủ ĐK</span>'
  };

  tbody.innerHTML = filtered.map(d => {
    const dateStr = d.submitted_at ? new Date(d.submitted_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/A';
    const reqAmount = (d.amount_requested || 0).toLocaleString('vi-VN') + ' đ';
    const appAmount = d.amount_approved ? (d.amount_approved).toLocaleString('vi-VN') + ' đ' : '<span style="color: #94A3B8;">Chưa duyệt</span>';

    return `
      <tr style="border-bottom: 1px solid #F1F5F9; transition: background 0.15s;" onmouseover="this.style.background='#F8FAFC'" onmouseout="this.style.background='white'">
        <td style="padding: 12px; font-weight: 800; color: #002855; white-space: nowrap;">
          #TC-${d.id}<br>
          <span style="font-size: 11px; font-weight: 500; color: #94A3B8;">${dateStr}</span>
        </td>
        <td style="padding: 12px;">
          <div style="font-weight: 700; color: #1E293B;">${escapeHtml(d.full_name)}</div>
          <div style="font-size: 11.5px; color: #64748B;">${escapeHtml(d.unit)}</div>
          <div style="font-size: 11px; color: #0284C7;"><i class="fa-solid fa-phone me-1"></i>${escapeHtml(d.phone || 'N/A')}</div>
        </td>
        <td style="padding: 12px;">
          <div style="font-weight: 700; color: #003865; margin-bottom: 3px;">${escapeHtml(d.type)}</div>
          <div style="font-size: 12px; color: #475569; line-height: 1.4; max-width: 320px;">${escapeHtml(d.reason)}</div>
          ${d.proof_url ? `<a href="${d.proof_url}" target="_blank" style="font-size: 11px; color: #0284C7; text-decoration: none; font-weight: 600;"><i class="fa-solid fa-paperclip me-1"></i>Xem tệp minh chứng</a>` : ''}
        </td>
        <td style="padding: 12px; white-space: nowrap; font-weight: 700; color: #B45309;">
          ${reqAmount}
        </td>
        <td style="padding: 12px; white-space: nowrap;">
          ${statusBadges[d.status] || '<span class="badge bg-secondary">Khác</span>'}
        </td>
        <td style="padding: 12px; white-space: nowrap;">
          <div style="font-weight: 800; color: #059669;">${appAmount}</div>
          <div style="font-size: 11px; color: #64748B; max-width: 220px;">${escapeHtml(d.decision_note || '')}</div>
        </td>
        <td style="padding: 12px; text-align: right; white-space: nowrap;">
          <button type="button" onclick="openReviewWelfareModal(${d.id})" style="background: #D97706; color: white; border: none; border-radius: 6px; padding: 5px 12px; font-size: 11.5px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; margin-right: 4px;">
            <i class="fa-solid fa-gavel"></i> Xét duyệt
          </button>
          <button type="button" onclick="deleteAdminWelfare(${d.id})" style="background: transparent; border: 1px solid #CBD5E1; color: #EF4444; border-radius: 6px; padding: 4px 8px; font-size: 11.5px; cursor: pointer;" title="Xóa hồ sơ">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function openReviewWelfareModal(id) {
  const item = adminWelfareList.find(d => d.id === id);
  if (!item) return;

  reviewingAppId = id;
  document.getElementById('modal_welf_name').innerText = `${item.full_name} (${item.unit})`;
  document.getElementById('modal_welf_contact').innerText = `SĐT: ${item.phone || 'N/A'} | Email: ${item.email || 'N/A'}`;
  document.getElementById('modal_welf_type').innerText = item.type;
  document.getElementById('modal_welf_reason').innerText = item.reason;
  document.getElementById('modal_welf_req_amount').innerText = (item.amount_requested || 0).toLocaleString('vi-VN') + ' đ';

  document.getElementById('modal_welf_app_amount').value = item.amount_approved !== null ? item.amount_approved : item.amount_requested || 1000000;
  document.getElementById('modal_welf_status_select').value = item.status || 'approved';
  document.getElementById('modal_welf_note').value = item.decision_note || 'Ban Thường Vụ phê duyệt chi trợ cấp theo quy chế chăm lo Công đoàn.';

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

  try {
    const res = await fetch(`/api/welfare/applications/${reviewingAppId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status,
        amount_approved,
        decision_note,
        approved_by: 'TS. Lê Thị Kim Út (Ban Thường Vụ)'
      })
    }).then(r => r.json());

    if (res.success) {
      alert('✅ Đã cập nhật kết quả xét duyệt hồ sơ trợ cấp thành công!');
      closeReviewWelfareModal();
      loadAdminWelfare();
    } else {
      alert('Lỗi: ' + res.error);
    }
  } catch (e) {
    alert('Lỗi kết nối: ' + e.message);
  }
}

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
