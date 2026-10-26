/**
 * 2-TIER BOOKMARKS ENGINE (LOCAL STORAGE + BACKEND API SYNC)
 */
const BookmarkEngine = {
  getUserId: function() {
    return localStorage.getItem('tdmu_user_id') || 'CB_001';
  },

  getUserName: function() {
    return localStorage.getItem('tdmu_user_name') || 'Ban Thường Vụ Công Đoàn';
  },

  getLocalBookmarks: function() {
    try {
      return JSON.parse(localStorage.getItem('tdmu_read_later') || '[]');
    } catch (e) {
      return [];
    }
  },

  isSaved: function(articleId) {
    const list = this.getLocalBookmarks();
    return list.some(item => (item.id == articleId || item.article_id == articleId));
  },

  toggleBookmark: async function(article) {
    const articleId = parseInt(article.id || article.article_id);
    let list = this.getLocalBookmarks();
    const exists = list.some(item => (item.id == articleId || item.article_id == articleId));

    if (exists) {
      list = list.filter(item => (item.id != articleId && item.article_id != articleId));
      localStorage.setItem('tdmu_read_later', JSON.stringify(list));
      
      // Async sync to server
      try {
        await fetch('/api/bookmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            article_id: articleId,
            user_id: this.getUserId(),
            user_name: this.getUserName()
          })
        });
      } catch (err) {}

      return { saved: false, message: 'Đã bỏ lưu bài viết' };
    } else {
      const itemToSave = {
        id: articleId,
        article_id: articleId,
        title: article.title || article.tieu_de || 'Bài viết Công đoàn',
        author: article.author || article.tac_gia || 'Công đoàn TDMU',
        date: article.created_at || new Date().toISOString(),
        thumbnail: article.thumbnail || article.hinh_anh_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600',
        saved_at: new Date().toISOString()
      };
      list.unshift(itemToSave);
      localStorage.setItem('tdmu_read_later', JSON.stringify(list));

      // Async sync to server
      try {
        await fetch('/api/bookmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            article_id: articleId,
            article_title: itemToSave.title,
            user_id: this.getUserId(),
            user_name: this.getUserName()
          })
        });
      } catch (err) {}

      return { saved: true, message: 'Đã lưu vào Tủ sách đọc sau' };
    }
  },

  syncWithServer: async function() {
    try {
      const res = await fetch('/api/bookmarks?user_id=' + this.getUserId());
      const json = await res.json();
      if (json.success && json.data) {
        // Merge without duplicating
        const local = this.getLocalBookmarks();
        const localIds = new Set(local.map(l => l.id || l.article_id));
        json.data.forEach(item => {
          if (!localIds.has(item.article_id)) {
            local.push({
              id: item.article_id,
              article_id: item.article_id,
              title: item.article_title,
              saved_at: item.saved_at
            });
          }
        });
        localStorage.setItem('tdmu_read_later', JSON.stringify(local));
      }
    } catch (err) {}
  }
};

// =========================================================================
// DYNAMIC NAVIGATION MENU SYNCHRONIZER (ĐỒNG BỘ MENU TỰ ĐỘNG TỪ CSDL MSSQL)
// =========================================================================
async function syncDynamicNavbarFromDb() {
  const navContainer = document.querySelector('#tdmuNavbar .navbar-nav');
  if (!navContainer) return;

  try {
    const res = await fetch('/api/navigation-menu');
    const json = await res.json();
    if (!json.success || !Array.isArray(json.data) || json.data.length === 0) return;

    const currentPath = window.location.pathname.split('/').pop() || 'index.html';

    const html = json.data.map(item => {
      const isCurrent = currentPath === item.url || (item.url !== 'index.html' && currentPath.includes(item.url.replace('.html', '')));
      
      if (item.hasChildren && Array.isArray(item.children) && item.children.length > 0) {
        const subItems = item.children.map(sub => `
          <li>
            <a class="dropdown-item" href="${sub.url}">
              <i class="fa-solid fa-caret-right me-1 text-primary"></i> ${sub.title}
              ${sub.badge ? `<span class="badge bg-light text-secondary ms-1 small" style="font-size: 10px;">${sub.badge}</span>` : ''}
            </a>
          </li>
        `).join('');

        return `
          <li class="nav-item dropdown">
            <a class="nav-link dropdown-toggle ${isCurrent ? 'active' : ''}" href="${item.url}" data-bs-toggle="dropdown" role="button" aria-expanded="false">
              ${item.title}
            </a>
            <ul class="dropdown-menu shadow-sm">
              ${subItems}
            </ul>
          </li>
        `;
      } else {
        return `
          <li class="nav-item">
            <a class="nav-link ${isCurrent ? 'active' : ''}" href="${item.url}">
              ${item.title}
            </a>
          </li>
        `;
      }
    }).join('');

    navContainer.innerHTML = html;
  } catch (err) {
    console.warn('Navbar dynamic sync fallback:', err.message);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  BookmarkEngine.syncWithServer();
  syncDynamicNavbarFromDb();
});