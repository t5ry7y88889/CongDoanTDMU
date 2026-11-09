// =============================================================================
// ADMIN FEEDBACK (HÒM THƯ GÓP Ý & NGUYỆN VỌNG ĐOÀN VIÊN)
// Tự động gửi email phản hồi tới hòm thư cá nhân & Xem nhật ký Outbox
// =============================================================================

let adminFeedbackList = [];
let currentFeedbackFilter = 'all';
let currentFeedbackPage = 1;
const feedbackPageSize = 8;

function escapeHtmlFb(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

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
  currentFeedbackPage = 1;
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
  currentFeedbackPage = 1;
  renderAdminFeedbackTable(q);
}

function renderAdminFeedbackTable(searchQuery = '') {
  const tbody = document.getElementById('admin_feedback_table_body');
  if (!tbody) return;

  const strip = str => (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLowerCase();
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

  // Phân trang
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / feedbackPageSize) || 1;
  if (currentFeedbackPage > totalPages) currentFeedbackPage = totalPages;
  const startIndex = (currentFeedbackPage - 1) * feedbackPageSize;
  const pagedItems = filtered.slice(startIndex, startIndex + feedbackPageSize);

  renderFeedbackPaginationBar(totalItems, totalPages);

  tbody.innerHTML = pagedItems.map(f => {
    const dateStr = f.submitted_at ? new Date(f.submitted_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';
    const hasEmail = f.email && f.email.includes('@');

    return `
      <tr style="border-bottom: 1px solid #F1F5F9; transition: background 0.15s;" onmouseover="this.style.background='#F8FAFC'" onmouseout="this.style.background='white'">
        <td style="padding: 12px; font-weight: 800; color: #002855; white-space: nowrap;">
          #FB-${f.id}<br>
          <span style="font-size: 11px; font-weight: 500; color: #94A3B8;">${dateStr}</span>
        </td>
        <td style="padding: 12px;">
          <div style="font-weight: 700; color: #1E293B;">${escapeHtmlFb(f.sender_name)}</div>
          <div style="font-size: 11.5px; color: #64748B;">${escapeHtmlFb(f.unit)}</div>
          <div style="font-size: 11px; color: ${hasEmail ? '#0284C7' : '#94A3B8'};">
            <i class="fa-solid fa-envelope me-1"></i>${escapeHtmlFb(f.email || 'Không để lại')}
            ${hasEmail ? '<span title="Được hỗ trợ gửi email tự động" style="color: #059669; margin-left: 3px;">✔</span>' : ''}
            ${f.phone ? ' | 📞 ' + escapeHtmlFb(f.phone) : ''}
          </div>
        </td>
        <td style="padding: 12px;">
          <div style="font-weight: 700; color: #003865; margin-bottom: 4px;">
            <span style="background: #F1F5F9; color: #475569; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 600; margin-right: 4px;">${escapeHtmlFb(f.category || 'Góp ý')}</span>
            ${escapeHtmlFb(f.title)}
          </div>
          <div style="font-size: 12px; color: #334155; line-height: 1.4; max-width: 380px;">${escapeHtmlFb(f.content)}</div>
        </td>
        <td style="padding: 12px; white-space: nowrap;">
          ${statusBadges[f.status] || '<span class="badge bg-secondary">Khác</span>'}
        </td>
        <td style="padding: 12px; font-size: 12px; color: #475569; max-width: 260px;">
          ${f.response ? `<div style="background: #F8FAFC; border-left: 3px solid #0284C7; padding: 6px 10px; border-radius: 4px; font-size: 11.5px;">${escapeHtmlFb(f.response)}<div style="font-size: 10.5px; color: #94A3B8; margin-top: 2px;">— ${escapeHtmlFb(f.resolved_by || 'BTV')}</div></div>` : '<span style="color: #94A3B8; font-style: italic;">Chưa có phản hồi</span>'}
        </td>
        <td style="padding: 12px; text-align: right; white-space: nowrap;">
          <button type="button" onclick="openRespondFeedbackModal(${f.id})" style="background: #003865; color: white; border: none; border-radius: 6px; padding: 5px 12px; font-size: 11.5px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; margin-right: 6px;">
            <i class="fa-solid fa-reply"></i> Phản Hồi
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
  const hasEmail = item.email && item.email.includes('@');

  document.getElementById('modal_fb_sender').innerText = `${item.sender_name} (${item.unit})`;
  document.getElementById('modal_fb_contact').innerHTML = `
    Email: <strong>${item.email || 'Không để lại'}</strong> ${hasEmail ? '<span style="color: #059669; font-weight: 700;">(Hệ thống sẽ tự động gửi email phản hồi khi lưu)</span>' : '<span style="color: #D97706;">(Không có email)</span>'} | SĐT: ${item.phone || 'N/A'}
  `;
  document.getElementById('modal_fb_title').innerText = item.title;
  document.getElementById('modal_fb_content').innerText = item.content;
  document.getElementById('modal_fb_status_select').value = item.status || 'resolved';
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

  if (!response) {
    alert('Vui lòng nhập nội dung phản hồi ý kiến đoàn viên!');
    return;
  }

  try {
    const res = await fetch(`/api/feedback/${currentRespondingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status,
        response,
        resolved_by: 'Ban Thường Vụ Công Đoàn Trường'
      })
    }).then(r => r.json());

    if (res.success) {
      alert('✅ ' + (res.message || 'Đã lưu kết quả phản hồi và gửi email thông báo thành công!'));
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

// =============================================================================
// EMAIL OUTBOX (NHẬT KÝ EMAIL ĐÃ GỬI)
// =============================================================================
async function openEmailOutboxModal() {
  const modal = document.getElementById('modal_email_outbox');
  if (modal) modal.style.display = 'flex';
  await loadEmailOutbox();
}

function closeEmailOutboxModal() {
  const modal = document.getElementById('modal_email_outbox');
  if (modal) modal.style.display = 'none';
}

async function loadEmailOutbox() {
  const tbody = document.getElementById('email_outbox_table_body');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px; color: #64748B;"><i class="fa-solid fa-circle-notch fa-spin me-2"></i> Đang tải nhật ký email...</td></tr>';

  try {
    const res = await fetch('/api/feedback/outbox').then(r => r.json());
    if (res.success && Array.isArray(res.data) && res.data.length > 0) {
      tbody.innerHTML = res.data.map(item => {
        const timeStr = item.sentAt ? new Date(item.sentAt).toLocaleString('vi-VN') : 'Vừa xong';
        return `
          <tr style="border-bottom: 1px solid #F1F5F9;">
            <td style="padding: 10px 14px; color: #64748B; font-size: 11.5px; white-space: nowrap;">
              <i class="fa-regular fa-clock me-1 text-primary"></i>${timeStr}
            </td>
            <td style="padding: 10px 14px;">
              <strong style="color: #002855;">${escapeHtmlFb(item.recipientName || 'Đoàn viên')}</strong><br>
              <span style="color: #0284C7; font-size: 11.5px;"><i class="fa-solid fa-envelope me-1"></i>${escapeHtmlFb(item.recipientEmail)}</span>
            </td>
            <td style="padding: 10px 14px;">
              <div style="font-weight: 700; color: #1E293B; margin-bottom: 2px;">${escapeHtmlFb(item.subject)}</div>
              <div style="font-size: 11.5px; color: #475569; line-height: 1.4; background: #F8FAFC; padding: 6px 10px; border-radius: 4px; border-left: 2px solid #059669;">
                ${escapeHtmlFb(item.content)}
              </div>
            </td>
            <td style="padding: 10px 14px; text-align: center; white-space: nowrap;">
              <span style="background: #ECFDF5; color: #059669; font-weight: 700; font-size: 11px; padding: 3px 8px; border-radius: 4px;">
                <i class="fa-solid fa-check me-1"></i>Đã Gửi
              </span>
            </td>
          </tr>
        `;
      }).join('');
    } else {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 24px; color: #94A3B8; font-style: italic;">Chưa có email phản hồi nào được gửi trong nhật ký.</td></tr>';
    }
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px; color: #EF4444;">Lỗi kết nối nhật ký email.</td></tr>';
  }
}

// Window exports
window.loadAdminFeedback = loadAdminFeedback;
window.filterFeedbackStatus = filterFeedbackStatus;
window.searchAdminFeedback = searchAdminFeedback;
window.openRespondFeedbackModal = openRespondFeedbackModal;
window.closeRespondFeedbackModal = closeRespondFeedbackModal;
window.submitFeedbackResponse = submitFeedbackResponse;
window.deleteAdminFeedback = deleteAdminFeedback;
window.openEmailOutboxModal = openEmailOutboxModal;
window.closeEmailOutboxModal = closeEmailOutboxModal;
window.loadEmailOutbox = loadEmailOutbox;

// Hàm hiển thị thanh phân trang hòm thư góp ý
function renderFeedbackPaginationBar(totalItems, totalPages) {
  const container = document.getElementById('admin_feedback_pagination');
  if (!container) return;

  if (totalItems <= feedbackPageSize) {
    container.innerHTML = `<span style="font-size: 12.5px; color: #64748B;">Hiển thị <strong>${totalItems}</strong> ý kiến góp ý</span>`;
    return;
  }

  let html = `
    <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; flex-wrap: wrap; gap: 10px;">
      <span style="font-size: 12.5px; color: #64748B;">
        Hiển thị <strong>${(currentFeedbackPage - 1) * feedbackPageSize + 1} - ${Math.min(currentFeedbackPage * feedbackPageSize, totalItems)}</strong> / Tổng <strong>${totalItems}</strong> ý kiến
      </span>
      <div style="display: flex; gap: 5px; align-items: center;">
        <button type="button" onclick="changeFeedbackPage(${currentFeedbackPage - 1})" ${currentFeedbackPage <= 1 ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''} style="background: white; border: 1px solid #CBD5E1; border-radius: 6px; padding: 5px 10px; font-size: 12px; font-weight: 600; color: #334155; cursor: pointer;">
          <i class="fa-solid fa-chevron-left me-1"></i>Trước
        </button>
  `;

  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || (p >= currentFeedbackPage - 1 && p <= currentFeedbackPage + 1)) {
      html += `
        <button type="button" onclick="changeFeedbackPage(${p})" style="background: ${p === currentFeedbackPage ? '#002855' : 'white'}; color: ${p === currentFeedbackPage ? 'white' : '#334155'}; border: 1px solid ${p === currentFeedbackPage ? '#002855' : '#CBD5E1'}; border-radius: 6px; padding: 5px 11px; font-size: 12px; font-weight: 700; cursor: pointer;">
          ${p}
        </button>
      `;
    } else if (p === currentFeedbackPage - 2 || p === currentFeedbackPage + 2) {
      html += `<span style="padding: 0 4px; color: #94A3B8;">...</span>`;
    }
  }

  html += `
        <button type="button" onclick="changeFeedbackPage(${currentFeedbackPage + 1})" ${currentFeedbackPage >= totalPages ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''} style="background: white; border: 1px solid #CBD5E1; border-radius: 6px; padding: 5px 10px; font-size: 12px; font-weight: 600; color: #334155; cursor: pointer;">
          Sau<i class="fa-solid fa-chevron-right ms-1"></i>
        </button>
      </div>
    </div>
  `;

  container.innerHTML = html;
}

function changeFeedbackPage(newPage) {
  currentFeedbackPage = newPage;
  renderAdminFeedbackTable();
  const tableTop = document.getElementById('tab_feedback_content');
  if (tableTop) tableTop.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

window.renderFeedbackPaginationBar = renderFeedbackPaginationBar;
window.changeFeedbackPage = changeFeedbackPage;
