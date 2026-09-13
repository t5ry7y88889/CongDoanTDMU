import React, { useEffect, useState } from 'react';
import { getBookmarks, toggleBookmark } from '../lib/bookmarks';

const BookmarksDrawer = () => {
  const [items, setItems] = useState(() => getBookmarks());

  useEffect(() => {
    const refresh = () => setItems(getBookmarks());
    refresh();
    window.addEventListener('bookmarks:changed', refresh);
    return () => window.removeEventListener('bookmarks:changed', refresh);
  }, []);

  const removeBookmark = async (e, item) => {
    e.stopPropagation();
    await toggleBookmark({ id: item.article_id ?? item.id });
    setItems(getBookmarks());
  };

  return (
    <div className="offcanvas offcanvas-end" tabIndex="-1" id="bookmarksOffcanvas" style={{ width: '380px' }} aria-hidden="true">
      <div className="offcanvas-header" style={{ background: '#002855', color: 'white' }}>
        <h5 className="offcanvas-title fw-bold" style={{ fontSize: '16px' }}>
          <i className="fa-solid fa-bookmark text-warning me-2"></i> Tủ Sách Đọc Sau ({items.length})
        </h5>
        <button type="button" className="btn-close btn-close-white" data-bs-dismiss="offcanvas"></button>
      </div>
      <div className="offcanvas-body p-3 bg-light">
        {items.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="fa-regular fa-bookmark fa-3x mb-3 text-secondary opacity-50 d-block"></i>
            <small>Chưa có bài viết nào được lưu.</small>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.article_id ?? item.id} className="d-flex align-items-center gap-2 bg-white border rounded shadow-sm p-2 mb-2">
              {item.thumbnail ? (
                <img src={item.thumbnail} alt={item.title} style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px' }} />
              ) : (
                <div className="bg-primary bg-opacity-10 rounded d-flex align-items-center justify-content-center text-primary" style={{ width: '48px', height: '48px' }}>
                  <i className="fa-solid fa-newspaper"></i>
                </div>
              )}
              <div className="flex-grow-1" style={{ minWidth: 0 }}>
                <div className="fw-bold small text-truncate" style={{ color: '#002855' }} title={item.title}>{item.title}</div>
                <small className="text-muted text-truncate d-block">{(item.saved_at || '').replace('T', ' ').slice(0, 16) || item.author}</small>
              </div>
              <button className="btn btn-sm btn-outline-danger" title="Xóa khỏi tủ sách" onClick={(e) => removeBookmark(e, item)}>
                <i className="fa-solid fa-trash-can"></i>
              </button>
            </div>
          ))
        )}
      </div>
      <div className="p-3 bg-white border-top text-center">
        <small className="text-muted"><i className="fa-solid fa-shield-halved text-success me-1"></i> Danh sách lưu trữ an toàn trên thiết bị của bạn</small>
      </div>
    </div>
  );
};

export default BookmarksDrawer;