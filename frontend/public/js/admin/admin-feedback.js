// =============================================================================
// ADMIN FEEDBACK (HÒM THƯ GÓP Ý & NGUYỆN VỌNG ĐOÀN VIÊN)
// =============================================================================

let adminFeedbackList = [];
let currentFeedbackFilter = 'all';

async function loadAdminFeedback() {
  const tbody = document.getElementById('admin_feedback_table_body');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 24px; color: #64748B;"><i class="fa-solid fa-circle-notch fa-spin me-2"></i> Đang tải hòm thư góp ý...</td></tr>';

  try {
    const res = await fetch('/api/feedback').then(r => r.json());
    if (res.success) {
      adminFeedbackList = res.data || [];
      renderAdminFeedbackTable();
      updateFeedbackBadgeCount();
    } else {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 24px; color: #EF4444;">Không thể tải danh sách ý kiến.</td></tr>';
    }
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 24px; color: #EF4444;">Lỗi kết nối máy chủ.</td></tr>';
  }
}

function updateFeedbackBadgeCount() {
  const pendingCount = adminFeedbackList.filter(f => f.status === 'pending').length;
  const badgeEl = document.getElementById('sidebar_feedback_count');
  if (badgeEl) {
    badgeEl.innerText = pendingCount;
    badgeEl.style.display = pendingCount > 0 ? 'inline-block' : 'none';
  }
}

function filterFeedbackStatus(status) {
  currentFeedbackFilter = status;
  document.querySelectorAll('.btn-fb-filter').forEach(b => {
    if (b.dataset.status === status) {
      b.style.background = '#003865';
      b.style.color = 'white';
    } else {
      b.style.background = '#F1F5F9';
      b.style.color = '#475569';
    }
  });
  renderAdminFeedbackTable();
}

function searchAdminFeedback(q) {
  renderAdminFeedbackTable(q);
}

function renderAdminFeedbackTable(searchQuery = '') {
  const tbody = document.getElementById('admin_feedback_table_body');
  if (!tbody) return;

  const strip = str => (str || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[đĐ]/g, 'd').toLowerCase();
  const q = strip(searchQuery || document.getElementById('admin_feedback_search')?.value || '');

  let filtered = adminFeedbackList;
  if (currentFeedbackFilter !== 'all') {
    filtered = filtered.filter(f => f.status === currentFeedbackFilter);
  }
  if (q) {
    filtered = filtered.filter(f =>
      strip(f.title).includes(q) ||
      strip(f.content).includes(q) ||
      strip(f.sender_name).includes(q) ||
      strip(f.unit).includes(q) ||
      strip(f.category).includes(q)
    );
  }

  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 28px; color: #94A3B8; font-style: italic;">Không tìm thấy ý kiến góp ý nào phù hợp.</td></tr>';
    return;
  }

  const statusBadges = {
    pending: '<span style="background: #FEF3C7; color: #D97706; padding: 4px 8px; border-radius: 4px; font-weight: 700; font-size: 11.5px;"><i class="fa-solid fa-clock me-1"></i>Chờ Xử Lý</span>',
    processing: '<span style="background: #EFF6FF; color: #1D4ED8; padding: 4px 8px; border-radius: 4px; font-weight: 700; font-size: 11.5px;"><i class="fa-solid fa-arrows-rotate fa-spin me-1"></i>Đang Giải Quyết</span>',
    resolved: '<span style="background: #ECFDF5; color: #059669; padding: 4px 8px; border-radius: 4px; font-weight: 700; font-size: 11.5px;"><i class="fa-solid fa-check-circle me-1"></i>Đã Trả Lời</span>'
  };

  tbody.innerHTML = filtered.map(f => {
    const dateStr = f.submitted_at ? new Date(f.submitted_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';
    return `
      <tr style="border-bottom: 1px solid #F1F5F9; transition: background 0.15s;" onmouseover="this.style.background='#F8FAFC'" onmouseout="this.style.background='white'">
        <td style="padding: 12px; font-weight: 800; color: #002855; white-space: nowrap;">
          #FB-${f.id}<br>
          <span style="font-size: 11px; font-weight: 500; color: #94A3B8;">${dateStr}</span>
        </td>
        <td style="padding: 12px;">
          <div style="font-weight: 700; color: #1E293B;">${escapeHtml(f.sender_name)}</div>
          <div style="font-size: 11.5px; color: #64748B;">${escapeHtml(f.unit)}</div>
          <div style="font-size: 11px; color: #0284C7;"><i class="fa-solid fa-envelope me-1"></i>${escapeHtml(f.email || 'Không để lại')} ${f.phone ? '| 📞 ' + escapeHtml(f.phone) : ''}</div>
        </td>
        <td style="padding: 12px;">
          <div style="font-weight: 700; color: #003865; margin-bottom: 4px;">
            <span style="background: #F1F5F9; color: #475569; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 600; margin-right: 4px;">${escapeHtml(f.category || 'Góp ý')}</span>
            ${escapeHtml(f.title)}
          </div>
          <div style="font-size: 12px; color: #334155; line-height: 1.4; max-width: 380px;">${escapeHtml(f.content)}</div>
        </td>
        <td style="padding: 12px; white-space: nowrap;">
          ${statusBadges[f.status] || '<span class="badge bg-secondary">Khác</span>'}
        </td>
        <td style="padding: 12px; font-size: 12px; color: #475569; max-width: 260px;">
          ${f.response ? `<div style="background: #F8FAFC; border-left: 3px solid #0284C7; padding: 6px 10px; border-radius: 4px; font-size: 11.5px;">${escapeHtml(f.response)}<div style="font-size: 10.5px; color: #94A3B8; margin-top: 2px;">— ${escapeHtml(f.resolved_by || 'BTV')}</div></div>` : '<span style="color: #94A3B8; font-style: italic;">Chưa có phản hồi</span>'}
        </td>
        <td style="padding: 12px; text-align: right; white-space: nowrap;">
          <button type="button" onclick="openRespondFeedbackModal(${f.id})" style="background: #003865; color: white; border: none; border-radius: 6px; padding: 5px 12px; font-size: 11.5px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; margin-right: 6px;">
            <i class="fa-solid fa-reply"></i> Xử lý
          </button>
          <button type="button" onclick="deleteAdminFeedback(${f.id})" style="background: transparent; border: 1px solid #CBD5E1; color: #EF4444; border-radius: 6px; padding: 4px 8px; font-size: 11.5px; cursor: pointer;" title="Xóa thư">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

let currentRespondingId = null;

function openRespondFeedbackModal(id) {
  const item = adminFeedbackList.find(f => f.id === id);
  if (!item) return;

  currentRespondingId = id;
  document.getElementById('modal_fb_sender').innerText = `${item.sender_name} (${item.unit})`;
  document.getElementById('modal_fb_contact').innerText = `Email: ${item.email || 'N/A'} | SĐT: ${item.phone || 'N/A'}`;
  document.getElementById('modal_fb_title').innerText = item.title;
  document.getElementById('modal_fb_content').innerText = item.content;
  document.getElementById('modal_fb_status_select').value = item.status || 'processing';
  document.getElementById('modal_fb_response_text').value = item.response || '';

  document.getElementById('modal_respond_feedback').style.display = 'flex';
}

function closeRespondFeedbackModal() {
  document.getElementById('modal_respond_feedback').style.display = 'none';
  currentRespondingId = null;
}

async function submitFeedbackResponse() {
  if (!currentRespondingId) return;

  const status = document.getElementById('modal_fb_status_select').value;
  const response = document.getElementById('modal_fb_response_text').value.trim();

  try {
    const res = await fetch(`/api/feedback/${currentRespondingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status,
        response,
        resolved_by: 'TS. Lê Thị Kim Út (Ban Thường Vụ)'
      })
    }).then(r => r.json());

    if (res.success) {
      alert('✅ Đã cập nhật kết quả xử lý ý kiến thành công!');
      closeRespondFeedbackModal();
      loadAdminFeedback();
    } else {
      alert('Lỗi: ' + res.error);
    }
  } catch (e) {
    alert('Lỗi kết nối: ' + e.message);
  }
}

async function deleteAdminFeedback(id) {
  if (!confirm(`Xác nhận xóa ý kiến góp ý #FB-${id}?`)) return;
  try {
    const res = await fetch(`/api/feedback/${id}`, { method: 'DELETE' }).then(r => r.json());
    if (res.success) {
      alert('✅ Đã xóa ý kiến góp ý thành công!');
      loadAdminFeedback();
    } else {
      alert('Lỗi: ' + res.error);
    }
  } catch (e) {
    alert('Lỗi kết nối: ' + e.message);
  }
}
