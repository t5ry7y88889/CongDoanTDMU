import React from 'react';
import { Link } from 'react-router-dom';

const BookmarksDrawer = ({ isOpen, onClose, bookmarks = [], onRemoveBookmark }) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="offcanvas-backdrop fade show" style={{ zIndex: 1040 }} onClick={onClose}></div>
      <div
        className="offcanvas offcanvas-end show d-flex flex-column bg-white shadow-lg"
        tabIndex="-1"
        style={{ width: '380px', zIndex: 1045, visibility: 'visible' }}
      >
        {/* Header */}
        <div className="offcanvas-header text-white" style={{ background: '#002855' }}>
          <h5 className="offcanvas-title fw-bold fs-6">
            <i className="fa-solid fa-bookmark text-warning me-2"></i>
            Tủ Sách Đọc Sau ({bookmarks.length})
          </h5>
          <button type="button" className="btn-close btn-close-white" onClick={onClose} aria-label="Close"></button>
        </div>

        {/* Body */}
        <div className="offcanvas-body p-3 bg-light flex-grow-1 overflow-auto">
          {bookmarks.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="fa-solid fa-book-open fa-3x mb-3 text-secondary opacity-50"></i>
              <p className="mb-1 fw-semibold">Tủ sách hiện đang trống</p>
              <small>Bấm vào biểu tượng bookmark ở các bài viết để lưu lại đọc sau bất cứ lúc nào.</small>
            </div>
          ) : (
            <div className="d-flex flex-column gap-2">
              {bookmarks.map((item) => (
                <div key={item.id || item.article_id} className="card border-0 shadow-sm p-2 rounded-3 bg-white position-relative">
                  <div className="d-flex gap-2 align-items-start">
                    {item.thumbnail && (
                      <img
                        src={item.thumbnail}
                        alt=""
                        className="rounded"
                        style={{ width: '64px', height: '54px', objectFit: 'cover' }}
                      />
                    )}
                    <div className="flex-grow-1 pe-3">
                      <Link
                        to={`/bai-viet?id=${item.id || item.article_id}`}
                        className="fw-bold text-dark text-decoration-none text-truncate-2"
                        style={{ fontSize: '13px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                        onClick={onClose}
                      >
                        {item.title}
                      </Link>
                      <div className="text-muted small mt-1" style={{ fontSize: '11px' }}>
                        <i className="fa-regular fa-clock me-1"></i>
                        {item.date ? String(item.date).slice(0, 10) : 'Gần đây'}
                      </div>
                    </div>
                  </div>
                  {onRemoveBookmark && (
                    <button
                      type="button"
                      className="btn btn-sm btn-link text-danger position-absolute top-0 end-0 p-1"
                      onClick={() => onRemoveBookmark(item.id || item.article_id)}
                      title="Bỏ lưu"
                    >
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-white border-top text-center text-muted" style={{ fontSize: '11.5px' }}>
          <i className="fa-solid fa-shield-halved text-success me-1"></i>
          Danh sách lưu trữ an toàn trên thiết bị của bạn
        </div>
      </div>
    </>
  );
};

export default BookmarksDrawer;
