import React from 'react';
import { Link } from 'react-router-dom';

const ArticleQuickModal = ({ article, isOpen, onClose }) => {
  if (!isOpen || !article) return null;

  return (
    <>
      <div className="modal-backdrop fade show" style={{ zIndex: 1050 }}></div>
      <div
        className="modal fade show d-block"
        tabIndex="-1"
        role="dialog"
        style={{ zIndex: 1055 }}
        onClick={onClose}
      >
        <div
          className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-content shadow-lg" style={{ borderRadius: '8px', overflow: 'hidden' }}>
            {/* Header */}
            <div className="modal-header py-3 px-4 text-white" style={{ background: '#002855' }}>
              <h5 className="modal-title fs-6 fw-bold text-truncate" title={article.title}>
                <i className="fa-solid fa-newspaper me-2 text-warning"></i>
                {article.title}
              </h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={onClose}
                aria-label="Close"
              ></button>
            </div>

            {/* Body */}
            <div className="modal-body p-4 bg-white">
              {/* Meta */}
              <div className="d-flex flex-wrap align-items-center gap-3 text-muted small border-bottom pb-2 mb-3">
                <span>
                  <i className="fa-regular fa-calendar me-1 text-primary"></i>
                  {article.date || article.createdAt || '26/06/2026'}
                </span>
                <span>
                  <i className="fa-solid fa-user-pen me-1 text-primary"></i>
                  {article.author || 'Ban Thường Vụ'}
                </span>
                <span>
                  <i className="fa-regular fa-eye me-1 text-success"></i>
                  {article.views || article.viewsCount || 140} lượt xem
                </span>
                {article.categoryName && (
                  <span className="badge bg-light text-primary border ms-auto">
                    {article.categoryName}
                  </span>
                )}
              </div>

              {/* Image */}
              {article.image && (
                <img
                  src={article.image}
                  alt={article.title}
                  className="img-fluid rounded mb-3 w-100 shadow-sm"
                  style={{ maxHeight: '360px', objectFit: 'cover' }}
                />
              )}

              {/* Content */}
              <div
                style={{ fontSize: '14.5px', lineHeight: 1.8, color: '#2d3748', textAlign: 'justify' }}
                dangerouslySetInnerHTML={{
                  __html: article.content || `<p>${article.summary || ''}</p>`
                }}
              />
            </div>

            {/* Footer */}
            <div className="modal-footer bg-light py-2 px-4 d-flex justify-content-between">
              <Link
                to={`/bai-viet?id=${article.id}`}
                className="btn btn-primary btn-sm px-3"
                onClick={onClose}
              >
                <i className="fa-solid fa-up-right-from-square me-1"></i> Xem toàn văn trang riêng
              </Link>
              <button type="button" className="btn btn-secondary btn-sm px-3" onClick={onClose}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ArticleQuickModal;
