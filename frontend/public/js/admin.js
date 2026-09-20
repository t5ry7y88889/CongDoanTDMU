// =========================================================================
// TÒA SOẠN QUẢN TRỊ TRUYỀN THÔNG ĐA KÊNH & CMS TDMU - MAIN COORDINATOR
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

  const rawHash = window.location.hash.replace('#', '');
  if (typeof showAdminTab === 'function') showAdminTab(rawHash || 'ai-creator');
});

window.addEventListener('hashchange', () => {
  const hash = window.location.hash.replace('#', '');
  if (typeof showAdminTab === 'function') showAdminTab(hash || 'ai-creator');
});
