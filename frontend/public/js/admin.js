// =========================================================================
// TÒA SOẠN AI CONTENT STUDIO & CMS TDMU - MAIN COORDINATOR
// =========================================================================
console.log('🏛️ TDMU Trade Union CMS Modular Architecture Initialized.');

document.addEventListener('DOMContentLoaded', () => {
  if (typeof initTinyMCEEditors === 'function') initTinyMCEEditors();
  if (typeof loadAdminDashboard === 'function') loadAdminDashboard();
  if (typeof loadAdminArticles === 'function') loadAdminArticles();
  if (typeof loadUsersTable === 'function') loadUsersTable();
  if (typeof loadScheduleTable === 'function') loadScheduleTable();
  if (typeof loadAuditLogs === 'function') loadAuditLogs();
  if (typeof loadFacebookPublishSelect === 'function') loadFacebookPublishSelect();

  const initialHash = window.location.hash.replace('#', '');
  if (initialHash && ['dashboard', 'articles', 'ai-creator', 'reports', 'documents', 'schedule', 'social', 'events', 'media', 'roles', 'users', 'audits', 'inbox', 'image-studio'].includes(initialHash)) {
    if (typeof showAdminTab === 'function') showAdminTab(initialHash);
  } else {
    if (typeof showAdminTab === 'function') showAdminTab('ai-creator');
  }
});

window.addEventListener('hashchange', () => {
  const hash = window.location.hash.replace('#', '');
  if (hash && ['dashboard', 'articles', 'ai-creator', 'reports', 'documents', 'schedule', 'social', 'events', 'media', 'roles', 'users', 'audits', 'inbox', 'image-studio'].includes(hash)) {
    if (typeof showAdminTab === 'function') showAdminTab(hash);
  }
});
