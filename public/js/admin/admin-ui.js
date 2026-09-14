// =========================================================================
// 1. DOM HELPERS, ROLES, TABS & SYSTEM SETTINGS
// =========================================================================
// Universal Safe DOM Helpers to prevent any null reference errors
function safeSetText(id, val) {
  const el = document.getElementById(id);
  if (el) el.innerText = val;
}
function safeSetHtml(id, val) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = val;
}
function safeSetVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val;
}

// Admin CMS Portal Advanced SaaS Script - TinyMCE & Image Studio & User Management
let currentUserRole = 'admin';
let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
  initTinyMCEEditors();
  loadAdminDashboard();
  loadAdminArticles();
  loadAdminMonthlyReports();
  loadAdminDocuments();
  loadAdminTemplates();
  loadAdminFeedback();
  loadAdminWelfare();
  loadUsersTable();
  loadScheduleTable();
  loadAuditLogs();
  loadFacebookPublishSelect();
  updateAiStatusBadge();

  const initialHash = window.location.hash.replace('#', '');
  if (initialHash && ['dashboard', 'articles', 'ai-creator', 'schedule', 'social', 'events', 'media', 'roles', 'users', 'audits', 'inbox', 'image-studio'].includes(initialHash)) {
    showAdminTab(initialHash);
  } else {
    showAdminTab('ai-creator');
  }
});

window.addEventListener('hashchange', () => {
  const hash = window.location.hash.replace('#', '');
  if (hash && ['dashboard', 'articles', 'ai-creator', 'schedule', 'social', 'events', 'media', 'roles', 'users', 'audits', 'inbox', 'image-studio'].includes(hash)) {
    showAdminTab(hash);
  }
});

// Initialize TinyMCE Rich Text Editor
function initTinyMCEEditors() {
  if (typeof tinymce !== 'undefined') {
    tinymce.init({
      selector: '#edit_content_tinymce, #ai_final_content_tinymce',
      plugins: 'anchor autolink charmap codesample emoticons image link lists media searchreplace table visualblocks wordcount',
      toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table | align lineheight | numlist bullist indent outdent | emoticons charmap | removeformat',
      height: 350,
      content_style: 'body { font-family: "Plus Jakarta Sans", sans-serif; font-size: 14px; line-height: 1.6; }'
    });
  }
}

function getEditorContent(id) {
  if (typeof tinymce !== 'undefined' && tinymce.get(id)) {
    return tinymce.get(id).getContent();
  }
  const el = document.getElementById(id);
  return el ? el.value : "";
}

function setEditorContent(id, content) {
  if (typeof tinymce !== 'undefined' && tinymce.get(id)) {
    tinymce.get(id).setContent(content);
  }
  const el = document.getElementById(id);
  if (el) el.value = content;
}

function switchUserRole(role) {
  currentUserRole = role;
  const nameEl = document.getElementById('current_user_name');
  if (nameEl) {
    if (role === 'admin') nameEl.innerText = "TS. Lê Thị Kim Út";
    else if (role === 'editor') nameEl.innerText = "Đ/c Trần Thị B";
    else nameEl.innerText = "Đ/c Nguyễn Văn C";
  }
  loadAdminArticles();
}

function showAdminTab(tabName, subFilter = null) {
  const tabs = ['dashboard', 'articles', 'ai-creator', 'welfare', 'feedback', 'reports', 'templates', 'documents', 'schedule', 'users', 'audits'];
  const titles = {
    'dashboard': 'Bảng Điều Hành & Thống Kê',
    'articles': 'Quản Lý Tin Tức & Bài Viết',
    'ai-creator': 'Phòng Biên Tập & Sản Xuất Đa Kênh',
    'welfare': 'Quản Lý Đơn Đề Nghị Trợ Cấp & Chăm Lo',
    'feedback': 'Hòm Thư Góp Ý & Nguyện Vọng Đoàn Viên',
    'reports': 'Báo Cáo Định Kỳ 16 Tổ Công Đoàn',
    'templates': 'Kho Biểu Mẫu Nghiệp Vụ Công Đoàn',
    'documents': 'Kho Văn Bản Chỉ Đạo & Điều Hành',
    'schedule': 'Lịch Xuất Bản Đa Kênh',
    'users': 'Quản Lý Cán Bộ & Phân Quyền (3 Roles)',
    'audits': 'Nhật Ký Tác Nghiệp Hệ Thống'
  };

  const breadcrumbEl = document.getElementById('current_breadcrumb_title');
  if (breadcrumbEl && titles[tabName]) {
    breadcrumbEl.innerText = titles[tabName];
  }

  tabs.forEach(t => {
    const elContent = document.getElementById(`tab_${t}_content`);
    const elMenu = document.getElementById(`menu_${t}`);

    if (elContent) elContent.style.display = (t === tabName) ? 'block' : 'none';
    if (elMenu) {
      if (t === tabName) {
        elMenu.classList.add('active');
      } else {
        elMenu.classList.remove('active');
      }
    }
  });

  const refreshLoaders = {
    templates: loadAdminTemplates,
    dashboard: () => loadAdminDashboard(),
    articles: () => loadAdminArticles(subFilter || 'all'),
    welfare: loadAdminWelfare,
    feedback: loadAdminFeedback,
    reports: loadAdminMonthlyReports,
    documents: loadAdminDocuments,
    schedule: loadScheduleTable,
    users: loadUsersTable,
    audits: loadAuditLogs
  };
  if (refreshLoaders[tabName]) refreshLoaders[tabName]();
}

function toggleSidebarCollapse() {
  const sidebar = document.getElementById('adminSidebar');
  if (sidebar) {
    sidebar.classList.toggle('collapsed');
  }
}

// ==================== TOPBAR & STUDIO SYNC FUNCTIONS ====================
function openSystemSettingsModal() {
  const modal = document.getElementById('system_settings_modal');
  if (!modal) return;
  modal.style.display = 'flex';
  try {
    safeSetVal('settings_api_key_input', localStorage.getItem('gemini_api_key') || '');
    safeSetVal('settings_groq_api_key_input', localStorage.getItem('groq_api_key') || '');
    updateAiStatusBadge();
  } catch (_) {
    /* storage may be blocked in some browser modes */
  }
}

function closeSystemSettingsModal() {
  const modal = document.getElementById('system_settings_modal');
  if (modal) modal.style.display = 'none';
}

function updateAiStatusBadge() {
  const gemini = (localStorage.getItem('gemini_api_key') || '').trim();
  const groq = (localStorage.getItem('groq_api_key') || '').trim();

  const gemEl = document.getElementById('settings_gemini_status');
  if (gemEl) {
    gemEl.style.background = gemini ? '#ECFDF5' : '#FEF3C7';
    gemEl.style.borderColor = gemini ? '#A7F3D0' : '#FDE68A';
    gemEl.style.color = gemini ? '#065F46' : '#92400E';
    gemEl.innerHTML = gemini
      ? '<i class="fa-solid fa-circle-check me-1"></i> Đã cấu hình'
      : '<i class="fa-solid fa-triangle-exclamation me-1"></i> Chưa cấu hình';
  }

  const groqEl = document.getElementById('settings_groq_status');
  if (groqEl) {
    groqEl.style.background = groq ? '#ECFDF5' : '#FEF3C7';
    groqEl.style.borderColor = groq ? '#A7F3D0' : '#FDE68A';
    groqEl.style.color = groq ? '#065F46' : '#92400E';
    groqEl.innerHTML = groq
      ? '<i class="fa-solid fa-circle-check me-1"></i> Đã cấu hình'
      : '<i class="fa-solid fa-triangle-exclamation me-1"></i> Chưa cấu hình';
  }

  const aiBadge = document.getElementById('settings_ai_status_badge');
  if (aiBadge) {
    aiBadge.style.background = '#EFF6FF';
    aiBadge.style.color = '#1E40AF';
    aiBadge.style.borderColor = '#BFDBFE';
    aiBadge.innerHTML = '<span style="width:7px;height:7px;border-radius:50%;background:#34D399;display:inline-block;"></span> Cổng Trực Tuyến';
  }

  const dot = document.getElementById('global_status_dot');
  if (dot) {
    dot.style.background = '#34D399';
    dot.style.boxShadow = '0 0 0 3px rgba(52,211,153,0.2)';
  }
}

function saveSystemSettings() {
  const gemini = document.getElementById('settings_api_key_input')?.value.trim();
  const groq = document.getElementById('settings_groq_api_key_input')?.value.trim();
  try {
    if (gemini) localStorage.setItem('gemini_api_key', gemini); else localStorage.removeItem('gemini_api_key');
    if (groq) localStorage.setItem('groq_api_key', groq); else localStorage.removeItem('groq_api_key');
  } catch (_) {
    /* storage may be blocked - keys only persist for this session */
  }
  closeSystemSettingsModal();
  updateAiStatusBadge();
  showToast('🛠️ Đã lưu cấu hình & cập nhật trạng thái dịch vụ tác nghiệp!', 'success');
}

let currentPendingDiff = null;

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// =========================================================================
// PHASE C: TOAST NOTIFICATION SYSTEM & UX HELPERS
// =========================================================================
let _toastContainer = null;

function showToast(message, type = 'info') {
  if (!_toastContainer) {
    _toastContainer = document.createElement('div');
    _toastContainer.id = 'tdmu_toast_container';
    _toastContainer.setAttribute('aria-live', 'polite');
    _toastContainer.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999999;display:flex;flex-direction:column;gap:8px;max-width:400px;pointer-events:none;';
    document.body.appendChild(_toastContainer);
  }

  const colorMap = {
    success: { bg: '#ECFDF5', border: '#059669', icon: 'fa-solid fa-circle-check', color: '#065F46' },
    error:   { bg: '#FEE2E2', border: '#DC2626', icon: 'fa-solid fa-circle-exclamation', color: '#991B1B' },
    warning: { bg: '#FEF3C7', border: '#D97706', icon: 'fa-solid fa-triangle-exclamation', color: '#92400E' },
    info:    { bg: '#EFF6FF', border: '#2563EB', icon: 'fa-solid fa-circle-info', color: '#1E40AF' }
  };

  if (type === 'info') {
    if (/(❌|error|Lỗi|không|thất bại)/i.test(message)) type = 'error';
    else if (/(✅|thành công|Đã|xuất bản|lưu|cập nhật|xóa|tạo|nộp|đăng)/i.test(message)) type = 'success';
    else if (/(⚠️|vui lòng|chưa|thiếu|cảnh báo|không thể|vui lòng)/i.test(message)) type = 'warning';
  }
  const theme = colorMap[type] || colorMap.info;
  const toast = document.createElement('div');
  toast.style.cssText = `background:${theme.bg};border-left:4px solid ${theme.border};color:${theme.color};padding:12px 16px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,.12);font-size:13px;font-weight:700;display:flex;align-items:flex-start;gap:10px;opacity:0;transform:translateX(20px);transition:all .25s ease;pointer-events:auto;word-break:break-word;`;
  const cleanMsg = escapeHtml(message).replace(/\n/g, '<br>');
  toast.innerHTML = `<i class="${theme.icon}" style="margin-top:1px;flex-shrink:0;font-size:16px;"></i><span style="flex:1;line-height:1.45;">${cleanMsg}</span><button onclick="this.parentElement.remove()" style="background:none;border:none;color:inherit;font-size:18px;cursor:pointer;padding:0;margin-left:4px;line-height:1;" title="Đóng">&times;</button>`;
  _toastContainer.appendChild(toast);
  requestAnimationFrame(() => { toast.style.opacity = '1'; toast.style.transform = 'none'; });
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    setTimeout(() => toast.remove(), 300);
  }, 5500);
}

window.alert = (msg) => showToast(msg);

function confirmModal(message) {
  return new Promise(resolve => {
    const existing = document.getElementById('tdmu_confirm_overlay');
    if (existing) existing.remove();
    const overlay = document.createElement('div');
    overlay.id = 'tdmu_confirm_overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,.45);z-index:9999998;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(2px);';
    overlay.innerHTML = `
      <div style="background:white;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,.25);max-width:380px;width:90%;padding:24px;text-align:center;">
        <i class="fa-solid fa-circle-question" style="font-size:32px;color:#D97706;margin-bottom:12px;"></i>
        <div style="font-size:14px;font-weight:700;color:#1E293B;margin-bottom:18px;line-height:1.55;word-break:break-word;max-height:160px;overflow-y:auto;">${escapeHtml(message).replace(/\n/g, '<br>')}</div>
        <div style="display:flex;justify-content:center;gap:10px;">
          <button id="tdmu_confirm_no" style="background:#F1F5F9;color:#475569;border:1px solid #E2E8F0;padding:8px 20px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;">Hủy bỏ</button>
          <button id="tdmu_confirm_yes" style="background:#DC2626;color:white;border:none;padding:8px 20px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;">Xác nhận</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    document.getElementById('tdmu_confirm_no').onclick = () => { overlay.remove(); resolve(false); };
    document.getElementById('tdmu_confirm_yes').onclick = () => { overlay.remove(); resolve(true); };
    overlay.onclick = (e) => { if (e.target === overlay) { overlay.remove(); resolve(false); } };
    document.onkeydown = (e) => { if (e.key === 'Escape') { overlay.remove(); document.onkeydown = null; resolve(false); } };
  });
}

function markInvalid(el, msg) {
  if (!el) return;
  el.style.border = '2px solid #DC2626';
  el.style.boxShadow = '0 0 0 2px rgba(220,38,38,.18)';
  el.title = msg || '';
  showToast(msg || 'Vui lòng kiểm tra trường này!', 'warning');
}
function clearInvalid(el) {
  if (!el) return;
  el.style.border = '';
  el.style.boxShadow = '';
  el.title = '';
}

function renderLoadingRows(cols, msg) {
  return `<tr><td colspan="${cols}" style="text-align:center; padding:28px; color:#64748B;"><div style="display:flex;flex-direction:column;align-items:center;gap:8px;"><div style="width:36px;height:36px;border:3px solid #E2E8F0;border-top-color:#0284C7;border-radius:50%;animation:spin .7s linear infinite;"></div><span style="font-size:13px;font-weight:600;">${escapeHtml(msg || 'Đang tải dữ liệu...')}</span></div></td></tr>`;
}
function renderEmptyRows(cols, msg) {
  return `<tr><td colspan="${cols}" style="text-align:center; padding:28px; color:#94A3B8; font-style:italic;"><i class="fa-solid fa-inbox" style="font-size:24px;margin-bottom:8px;display:block;opacity:.45;"></i>${escapeHtml(msg || 'Không có dữ liệu')}</td></tr>`;
}
