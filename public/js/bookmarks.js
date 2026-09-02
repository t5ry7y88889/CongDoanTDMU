/**
 * 2-TIER BOOKMARKS ENGINE (LOCAL STORAGE + BACKEND API SYNC)
 */
const BookmarkEngine = {
  getUserId: function() {
    return localStorage.getItem('tdmu_user_id') || 'CB_001';
  },

  getUserName: function() {
    return localStorage.getItem('tdmu_user_name') || 'TS. Lê Thị Kim Út';
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

document.addEventListener('DOMContentLoaded', () => {
  BookmarkEngine.syncWithServer();
});