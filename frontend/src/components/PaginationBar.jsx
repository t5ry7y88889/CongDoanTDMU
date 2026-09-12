import React from 'react';

const PaginationBar = ({
  currentPage = 1,
  totalItems = 0,
  pageSize = 4,
  pageSizeOptions = [4, 8, 12],
  onPageChange = () => {},
  onPageSizeChange = () => {},
  itemLabel = 'bài viết'
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startRecord = totalItems > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endRecord = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers range (e.g. 1, 2, 3...)
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }

  return (
    <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3 py-3 border-top mt-3" style={{ fontSize: '13.5px' }}>
      {/* Record Summary */}
      <div className="text-muted">
        Hiển thị <strong>{startRecord}</strong> - <strong>{endRecord}</strong> / <strong>{totalItems}</strong> {itemLabel}
      </div>

      {/* Pagination Controls */}
      <div className="d-flex align-items-center gap-2">
        <ul className="pagination pagination-sm mb-0">
          {/* First page */}
          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
            <button className="page-link" onClick={() => onPageChange(1)} disabled={currentPage === 1}>
              <i className="fa-solid fa-angles-left"></i>
            </button>
          </li>
          {/* Prev page */}
          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
            <button className="page-link" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
              <i className="fa-solid fa-angle-left"></i>
            </button>
          </li>

          {/* Number pages */}
          {pages.map((p) => (
            <li key={p} className={`page-item ${p === currentPage ? 'active' : ''}`}>
              <button
                className="page-link fw-semibold"
                onClick={() => onPageChange(p)}
                style={p === currentPage ? { backgroundColor: '#002855', borderColor: '#002855' } : {}}
              >
                {p}
              </button>
            </li>
          ))}

          {/* Next page */}
          <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
            <button className="page-link" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>
              <i className="fa-solid fa-angle-right"></i>
            </button>
          </li>
          {/* Last page */}
          <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
            <button className="page-link" onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages}>
              <i className="fa-solid fa-angles-right"></i>
            </button>
          </li>
        </ul>

        {/* Page size selector */}
        {pageSizeOptions && pageSizeOptions.length > 1 && (
          <select
            className="form-select form-select-sm"
            style={{ width: 'auto', fontSize: '12.5px' }}
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt} / trang
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
};

export default PaginationBar;
