import React, { useEffect, useState } from 'react';

const BieuMau = () => {
  const [templates, setTemplates] = useState([]);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/templates')
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setTemplates(data.data || []);
        }
      })
      .catch(err => console.warn("Fetch templates error:", err))
      .finally(() => setLoading(false));
  }, []);

  const strip = str => (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLowerCase();
  const q = strip(search);

  const filtered = templates.filter(t => {
    const matchCat = category === 'all' || t.category === category;
    const matchSearch = !q || strip(t.title).includes(q) || strip(t.code).includes(q) || strip(t.description).includes(q);
    return matchCat && matchSearch;
  });

  return (
    <div className="container my-3">
      <div className="breadcrumb-box">
        <a href="/">Trang chủ</a> / <span className="text-muted">Kho biểu mẫu</span>
      </div>
      <div className="row g-4">
        <div className="col-lg-9">
          <div className="content-box">
            <div className="tieudelon">
              <i className="fa-solid fa-file-word me-2"></i>KHO BIỂU MẪU NGHIỆP VỤ CÔNG ĐOÀN TDMU
            </div>

            {/* Search & Filter Bar */}
            <div className="bg-light p-3 rounded mb-4 border">
              <div className="row g-2 align-items-center">
                <div className="col-md-7">
                  <div className="input-group">
                    <span className="input-group-text bg-white">
                      <i className="fa-solid fa-magnifying-glass text-muted"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Tìm kiếm tên biểu mẫu, mã hiệu..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-md-5">
                  <select
                    className="form-select"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                  >
                    <option value="all">-- Tất cả chuyên mục --</option>
                    <option value="doan_vien">Đoàn Viên &amp; Gia Nhập</option>
                    <option value="to_cong_doan">Tổ Công Đoàn Bộ Phận</option>
                    <option value="tro_cap">Chăm Lo &amp; Trợ Cấp</option>
                    <option value="thi_dua">Thi Đua Khen Thưởng</option>
                    <option value="tro_von">Quỹ Trợ Vốn</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Templates List */}
            {loading ? (
              <div className="text-center py-5 text-muted">
                <i className="fa-solid fa-circle-notch fa-spin fa-2x mb-2"></i>
                <div>Đang tải kho biểu mẫu trực tuyến...</div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-5 text-muted fst-italic">
                Không tìm thấy biểu mẫu nào phù hợp với yêu cầu tìm kiếm.
              </div>
            ) : (
              filtered.map(t => (
                <div key={t.id} className="p-3 border rounded mb-3 d-flex justify-content-between align-items-center bg-white shadow-sm flex-wrap gap-3">
                  <div className="d-flex align-items-center gap-3">
                    <i className="fa-regular fa-file-word text-primary fa-2x flex-shrink-0"></i>
                    <div>
                      <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                        <span className="badge bg-primary">{t.code}</span>
                        <h6 className="fw-bold mb-0 text-dark">{t.title}</h6>
                      </div>
                      <small className="text-muted d-block">{t.description}</small>
                      <div className="mt-1 small text-muted">
                        <span className="badge bg-light text-secondary me-2">
                          <i className="fa-solid fa-download me-1"></i>{t.downloads_count || 0} lượt tải
                        </span>
                        <span>Dung lượng: {t.file_size || '4 KB'}</span>
                      </div>
                    </div>
                  </div>
                  <a
                    href={`/api/templates/download/${t.id}`}
                    className="btn-portal-access flex-shrink-0 text-nowrap"
                  >
                    <i className="fa-solid fa-download me-1"></i> Tải về (.docx)
                  </a>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sidebar widgets */}
        <div className="col-lg-3">
          <div className="panel-tdmu">
            <div className="panel-heading-tdmu">
              <i className="fa-solid fa-link me-2 text-primary"></i>Liên kết website
            </div>
            <div className="list-group-tdmu">
              <a href="http://tdmu.edu.vn/" target="_blank" rel="noreferrer" className="list-group-item">
                <i className="fa-solid fa-chevron-right me-1 text-muted small"></i> Đại học Thủ Dầu Một
              </a>
              <a href="http://danguy.tdmu.edu.vn/" target="_blank" rel="noreferrer" className="list-group-item">
                <i className="fa-solid fa-chevron-right me-1 text-muted small"></i> Đảng Bộ Đại học Thủ Dầu Một
              </a>
              <a href="http://www.congdoan.vn" target="_blank" rel="noreferrer" className="list-group-item">
                <i className="fa-solid fa-chevron-right me-1 text-muted small"></i> Tổng LĐLĐ Việt Nam
              </a>
              <a href="http://congdoanbinhduong.org.vn/" target="_blank" rel="noreferrer" className="list-group-item">
                <i className="fa-solid fa-chevron-right me-1 text-muted small"></i> LĐLĐ Tỉnh Bình Dương
              </a>
              <a href="http://lib.tdmu.edu.vn/" target="_blank" rel="noreferrer" className="list-group-item">
                <i className="fa-solid fa-chevron-right me-1 text-muted small"></i> TT Học Liệu ĐH Thủ Dầu Một
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BieuMau;
