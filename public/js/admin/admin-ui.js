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
  loadUsersTable();
  loadScheduleTable();
  loadAuditLogs();
  loadFacebookPublishSelect();

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
    if (role === 'admin') nameEl.innerText = "Thầy Nguyễn Văn A (Admin)";
    else if (role === 'editor') nameEl.innerText = "Cô Trần Thị B (Editor)";
    else nameEl.innerText = "Thầy Lê Văn C (Contributor)";
  }
  loadAdminArticles();
}

function showAdminTab(tabName, subFilter = null) {
  const tabs = ['dashboard', 'articles', 'ai-creator', 'reports', 'documents', 'schedule', 'users', 'audits'];
  tabs.forEach(t => {
    const elContent = document.getElementById(`tab_${t}_content`);
    const elMenu = document.getElementById(`menu_${t}`);

    if (elContent) elContent.style.display = (t === tabName) ? 'block' : 'none';
    if (elMenu) {
      if (t === tabName) {
        elMenu.classList.add('active');
        elMenu.style.background = '#0284C7';
        elMenu.style.color = '#FFFFFF';
      } else {
        elMenu.classList.remove('active');
        elMenu.style.background = 'transparent';
        elMenu.style.color = '#E2E8F0';
      }
    }
  });

  if (tabName === 'dashboard') loadAdminDashboard();
  if (tabName === 'articles') loadAdminArticles(subFilter || 'all');
  if (tabName === 'reports') loadAdminMonthlyReports();
  if (tabName === 'documents') loadAdminDocuments();
  if (tabName === 'schedule') loadScheduleTable();
  if (tabName === 'users') loadUsersTable();
  if (tabName === 'audits') loadAuditLogs();
}

// 1. User Management Page

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
  alert('✅ Đã lưu cấu hình AI Key vào hệ thống thành công!');
}


// =========================================================================
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
