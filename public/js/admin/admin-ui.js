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
  if (typeof loadAdminWelfare === "function") loadAdminWelfare();
  loadAdminDocuments();
  loadAdminTemplates();
  loadAdminFeedback();
  loadUsersTable();
  loadScheduleTable();
  loadAuditLogs();
  loadFacebookPublishSelect();

  // Khởi tạo phân quyền người dùng thực tế
  const savedRole = localStorage.getItem('tdmu_admin_active_role') || 'admin';
  const roleSwitcher = document.getElementById('role_switcher');
  if (roleSwitcher) roleSwitcher.value = savedRole;
  switchUserRole(savedRole);

  const rawHash = window.location.hash.replace('#', '');
  showAdminTab(rawHash || 'ai-creator');
});

window.addEventListener('hashchange', () => {
  const hash = window.location.hash.replace('#', '');
  showAdminTab(hash || 'ai-creator');
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

// =============================================================================
// ROLE-BASED ACCESS CONTROL (RBAC) - PHÂN QUYỀN CHÍNH XÁC THEO VAI TRÒ
// =============================================================================
function switchUserRole(role) {
  currentUserRole = (role || 'admin').toLowerCase();
  localStorage.setItem('tdmu_admin_active_role', currentUserRole);

  const nameEl = document.getElementById('current_user_name');
  const avatarEl = document.getElementById('current_user_avatar');

  // Kiểm tra nếu có tài khoản thực tế trong localStorage
  let savedUser = null;
  try {
    savedUser = JSON.parse(localStorage.getItem('tdmu_user') || 'null');
  } catch(e) {}

  if (nameEl) {
    if (currentUserRole === 'admin') {
      nameEl.innerText = savedUser?.ho_ten || "Ban Thường Vụ Công Đoàn";
      if (avatarEl) avatarEl.innerText = "BTV";
    } else if (currentUserRole === 'editor') {
      nameEl.innerText = (savedUser?.role === 'editor' && savedUser?.ho_ten) ? savedUser.ho_ten : "Ban Biên Tập & Tuyên Giáo";
      if (avatarEl) avatarEl.innerText = "BBT";
    } else if (currentUserRole === 'contributor') {
      nameEl.innerText = (savedUser?.role === 'contributor' && savedUser?.ho_ten) ? savedUser.ho_ten : "Tổ Trưởng CĐ & CTV";
      if (avatarEl) avatarEl.innerText = "CTV";
    } else {
      nameEl.innerText = (savedUser?.ho_ten) ? savedUser.ho_ten : "Đoàn Viên Công Đoàn";
      if (avatarEl) avatarEl.innerText = "ĐV";
    }
  }

  // Áp dụng bộ quyền thực tế lên giao diện
  applyRbacPermissions(currentUserRole);

  if (typeof loadAdminArticles === 'function') loadAdminArticles();
}

function applyRbacPermissions(role) {
  const r = (role || 'admin').toLowerCase();

  // Danh sách các menu sidebar cần phân quyền
  const menuUsers = document.getElementById('menu_users');
  const menuSettings = document.getElementById('menu_settings');
  const menuAudits = document.getElementById('menu_audits');
  const menuWelfare = document.getElementById('menu_welfare');
  const menuFeedback = document.getElementById('menu_feedback');

  // Đặt lại hiển thị mặc định
  if (menuUsers) menuUsers.style.display = 'flex';
  if (menuSettings) menuSettings.style.display = 'flex';
  if (menuAudits) menuAudits.style.display = 'flex';
  if (menuWelfare) menuWelfare.style.display = 'flex';
  if (menuFeedback) menuFeedback.style.display = 'flex';

  if (r === 'admin') {
    // Super Admin / Ban Thường Vụ: Toàn quyền
    console.log('[RBAC] Áp dụng quyền Ban Thường Vụ (Super Admin)');
  } else if (r === 'editor') {
    // Biên Tập Viên / Ban Tuyên Giáo: Quản lý tin tức, văn bản, biểu mẫu, phúc lợi, banners, hòm thư
    // KHÔNG được cấu hình bảo mật hoặc quản lý tài khoản người dùng
    console.log('[RBAC] Áp dụng quyền Ban Biên Tập (Editor)');
    if (menuUsers) {
      menuUsers.title = 'Chỉ Ban Thường Vụ mới có quyền quản lý tài khoản';
      menuUsers.style.opacity = '0.5';
    }
    if (menuSettings) {
      menuSettings.title = 'Chỉ Ban Thường Vụ mới có quyền cấu hình hệ thống gốc';
      menuSettings.style.opacity = '0.5';
    }
  } else if (r === 'contributor') {
    // Cộng Tác Viên: Chỉ soạn bài gửi duyệt, tra cứu văn bản
    console.log('[RBAC] Áp dụng quyền Cộng Tác Viên (Contributor)');
    if (menuUsers) menuUsers.style.display = 'none';
    if (menuSettings) menuSettings.style.display = 'none';
    if (menuAudits) menuAudits.style.display = 'none';
  } else if (r === 'member') {
    // Đoàn viên thường: Cảnh báo không có quyền quản trị
    console.warn('[RBAC] Tài khoản Đoàn viên không có quyền quản trị!');
    alert('Thông báo phân quyền (RBAC):\n\nTài khoản Đoàn viên chỉ có quyền tra cứu, nộp hồ sơ và gửi ý kiến tại Cổng thông tin công khai, không có quyền quản trị hệ thống CMS.');
  }
}

function showAdminTab(rawTabName, subFilter = null) {
  let tabName = (rawTabName || '').replace(/^tab_/, '').trim();
  if (['writer', 'studio', 'composer', 'editor', 'tinbaiviet', 'tab_writer'].includes(rawTabName) || ['writer', 'studio', 'composer', 'editor', 'tinbaiviet'].includes(tabName)) {
    tabName = 'ai-creator';
  }
  const tabs = ['dashboard', 'articles', 'ai-creator', 'organization', 'welfare', 'feedback', 'templates', 'documents', 'schedule', 'users', 'audits', 'settings', 'banners', 'menus'];
  if (!tabs.includes(tabName)) {
    tabName = 'ai-creator';
  }

  if (tabName === 'ai-creator') {
    if (window.self !== window.top) {
      window.parent.postMessage({ type: 'NAVIGATE_TAB', tab: 'ai-creator' }, '*');
      return;
    } else if (window.location.pathname.includes('admin-portal')) {
      window.location.href = '/admin#ai-creator';
      return;
    }
  }
  const titles = {
    'dashboard': 'Bảng Điều Hành & Thống Kê',
    'articles': 'Quản Lý Tin Tức & Bài Viết',
    'ai-creator': 'Soạn Thảo & Biên Tập Tin Bài',
    'feedback': 'Hòm Thư Góp Ý & Nguyện Vọng Đoàn Viên',
    'organization': 'Quản Lý Cơ Cấu Tổ Chức & Cán Bộ',
    'welfare': 'Quản Lý Văn Bản & Chính Sách Phúc Lợi',
    'templates': 'Kho Biểu Mẫu Nghiệp Vụ Công Đoàn',
    'documents': 'Kho Văn Bản Chỉ Đạo & Điều Hành',
    'schedule': 'Lịch Xuất Bản Đa Kênh',
    'users': 'Quản Lý Cán Bộ & Phân Quyền (3 Roles)',
    'audits': 'Nhật Ký Tác Nghiệp Hệ Thống',
    'banners': 'Quản Trị Banners & Slider Trình Chiếu Trang Chủ',
    'menus': 'Quản Trị Menu Điều Hướng Website (Portal Navigation)',
    'settings': 'Cấu Hình Hệ Thống, Banners & Truyền Thông'
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

  if (tabName === 'dashboard') loadAdminDashboard();
  if (tabName === 'articles') loadAdminArticles(subFilter || 'all');
  if (tabName === 'documents') loadAdminDocuments();
  if (tabName === 'templates') loadAdminTemplates();
  if (tabName === 'menus' && typeof loadAdminMenus === 'function') loadAdminMenus();
  if (tabName === 'banners') {
    // Bật giao diện quản trị Banners chuyên dụng
    const secSettings = document.getElementById('tab_settings_content');
    if (secSettings) secSettings.style.display = 'block';
    if (typeof switchSettingsSubTab === 'function') switchSettingsSubTab('banners');
  }
  if (tabName === 'organization' && typeof loadAdminOrganization === 'function') loadAdminOrganization();
  if (tabName === 'welfare' && typeof loadAdminWelfare === 'function') loadAdminWelfare();
  if (tabName === 'feedback') loadAdminFeedback();
  if (tabName === 'schedule') loadScheduleTable();
  if (tabName === 'users') loadUsersTable();
  if (tabName === 'audits') loadAuditLogs();
  if (tabName === 'settings' && typeof loadAdminSettings === 'function') loadAdminSettings();
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
  if (modal) modal.style.display = 'flex';
}

function closeSystemSettingsModal() {
  const modal = document.getElementById('system_settings_modal');
  if (modal) modal.style.display = 'none';
}

function saveSystemSettings() {
  const gemini = document.getElementById('settings_api_key_input')?.value.trim();
  const groq = document.getElementById('settings_groq_api_key_input')?.value.trim();
  if (gemini) localStorage.setItem('gemini_api_key', gemini);
  if (groq) localStorage.setItem('groq_api_key', groq);
  closeSystemSettingsModal();
  updateAiStatusBadge();
  alert('Đã lưu cấu hình dịch vụ tác nghiệp vào hệ thống thành công!');
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

window.applyRbacPermissions = applyRbacPermissions;
window.switchUserRole = switchUserRole;
