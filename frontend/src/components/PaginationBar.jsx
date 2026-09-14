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

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }

  return (
    <div className="tdmu-pagination-wrapper">
      <div className="tdmu-pagination-left">
        <span className="tdmu-pagination-info">
          Hiển thị <strong>{startRecord}</strong> - <strong>{endRecord}</strong> / <strong>{totalItems}</strong> {itemLabel}
        </span>
        {pageSizeOptions && pageSizeOptions.length > 1 && (
          <span className="tdmu-pagination-size-wrap">
            <label className="tdmu-size-label" htmlFor={`pgsz-${currentPage}`}>
              Hiển thị mỗi trang
            </label>
            <select
              id={`pgsz-${currentPage}`}
              className="tdmu-page-size-select"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </span>
        )}
      </div>

      <div className="tdmu-pagination-controls">
        <button
          type="button"
          className={`tdmu-page-btn ${currentPage === 1 ? 'disabled' : ''}`}
          onClick={currentPage === 1 ? undefined : () => onPageChange(1)}
          disabled={currentPage === 1}
          aria-label="Trang đầu"
        >
          <i className="fa-solid fa-angles-left"></i>
        </button>
        <button
          type="button"
          className={`tdmu-page-btn ${currentPage === 1 ? 'disabled' : ''}`}
          onClick={currentPage === 1 ? undefined : () => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Trang trước"
        >
          <i className="fa-solid fa-angle-left"></i>
        </button>

        {pages.map((p) => (
          <button
            key={p}
            type="button"
            className={`tdmu-page-btn ${p === currentPage ? 'active' : ''}`}
            onClick={p === currentPage ? undefined : () => onPageChange(p)}
            aria-label={`Trang ${p}`}
          >
            {p}
          </button>
        ))}

        <button
          type="button"
          className={`tdmu-page-btn ${currentPage === totalPages ? 'disabled' : ''}`}
          onClick={currentPage === totalPages ? undefined : () => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Trang sau"
        >
          <i className="fa-solid fa-angle-right"></i>
        </button>
        <button
          type="button"
          className={`tdmu-page-btn ${currentPage === totalPages ? 'disabled' : ''}`}
          onClick={currentPage === totalPages ? undefined : () => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          aria-label="Trang cuối"
        >
          <i className="fa-solid fa-angles-right"></i>
        </button>
      </div>
    </div>
  );
};

export default PaginationBar;