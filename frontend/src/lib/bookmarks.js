export const STORAGE_KEY = 'tdmu_read_later';

export const getBookmarks = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch (err) {
    return [];
  }
};

export const getSavedIds = () => getBookmarks().map(b => parseInt(b.id ?? b.article_id, 10)).filter(Boolean);

export const isSaved = (articleId) => getSavedIds().includes(parseInt(articleId, 10));

export const getUserId = () => localStorage.getItem('tdmu_user_id') || 'CB_001';

export const getUserName = () => localStorage.getItem('tdmu_user_name') || 'TS. Lê Thị Kim Út';

export const toggleBookmark = async (article) => {
  const articleId = parseInt(article.id ?? article.article_id, 10);
  let list = getBookmarks();
  const exists = list.some(item => parseInt(item.id ?? item.article_id, 10) === articleId);

  if (exists) {
    list = list.filter(item => parseInt(item.id ?? item.article_id, 10) !== articleId);
  } else {
    list.unshift({
      id: articleId,
      article_id: articleId,
      title: article.title || article.tieu_de || 'Bài viết Công đoàn',
      author: article.author || article.tac_gia || 'Công đoàn TDMU',
      date: article.created_at || new Date().toISOString(),
      thumbnail: article.thumbnail || article.hinh_anh_url || article.image || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600',
      saved_at: new Date().toISOString()
    });
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event('bookmarks:changed'));

  try {
    await fetch('/api/bookmarks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(exists
        ? { article_id: articleId, user_id: getUserId(), user_name: getUserName() }
        : { article_id: articleId, article_title: list[0].title, user_id: getUserId(), user_name: getUserName() })
    });
  } catch (err) {
    // Offline is fine; localStorage remains the source of truth.
  }

  return exists ? 'Đã bỏ lưu bài viết' : 'Đã lưu vào Tủ sách đọc sau';
};

export const syncBookmarks = async () => {
  try {
    const res = await fetch('/api/bookmarks?user_id=' + getUserId());
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      const local = getBookmarks();
      const localIds = new Set(local.map(l => parseInt(l.id ?? l.article_id, 10)));
      json.data.forEach(item => {
        if (!localIds.has(parseInt(item.article_id, 10))) {
          local.push({
            id: item.article_id,
            article_id: item.article_id,
            title: item.article_title,
            saved_at: item.saved_at
          });
        }
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(local));
      window.dispatchEvent(new Event('bookmarks:changed'));
    }
  } catch (err) {
    // Ignore offline sync failures.
  }
};