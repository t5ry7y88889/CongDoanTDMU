import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const VanBan = () => {
  const location = useLocation();
  const initialCat = location.hash.replace('#', '').replace('-', '') || 'all';

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(initialCat);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const hash = location.hash.replace('#', '').replace('-', '');
    if (hash) {
      setSelectedCategory(hash);
    }
  }, [location.hash]);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/documents').then(r => r.json());
      if (res.success && Array.isArray(res.data)) {
        setDocuments(res.data);
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const strip = (str) =>
    (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLowerCase();

  const filteredDocs = documents.filter(d => {
    const cat = d.loai_van_ban || d.LoaiVanBan;
    const matchCat = selectedCategory === 'all' || cat === selectedCategory;
    const q = strip(searchQuery.trim());
    const matchSearch = !q ||
      strip(d.so_hieu || d.SoHieuVanBan).includes(q) ||
      strip(d.tieu_de || d.TenVanBan).includes(q) ||
      strip(d.co_quan_ban_hanh || d.CoQuanBanHanh).includes(q) ||
      strip(d.nguoi_ky || d.NguoiKy).includes(q);

    return matchCat && matchSearch;
  });

  const getCount = (cat) => {
    if (cat === 'all') return documents.length;
    return documents.filter(d => (d.loai_van_ban === cat || d.LoaiVanBan === cat)).length;
  };

  const catBadges = {
    tuyentruyen: <span className="badge bg-warning text-dark px-2 py-1">Tuyên truyền</span>,
    kehoach: <span className="badge bg-success px-2 py-1">Kế hoạch</span>,
    luat: <span className="badge bg-primary px-2 py-1">Văn bản luật</span>,
    quyetdinh: <span className="badge bg-danger px-2 py-1">Quyết định</span>,
    huongdan: <span className="badge bg-info text-dark px-2 py-1">Hướng dẫn</span>,
    thongbao: <span className="badge bg-secondary px-2 py-1">Thông báo</span>
  };

  return (
    <div className="container my-4">
      {/* Breadcrumb */}
      <div className="breadcrumb-box mb-3">
        <a href="/">Trang chủ</a> / <span className="text-muted">Văn bản chỉ đạo &amp; điều hành</span>
      </div>

      <div className="row g-4">
        {/* CỘT CHÍNH: KHO VĂN BẢN */}
        <div className="col-lg-9">
          <div className="content-box">
            {/* Header & Thanh Tìm Kiếm */}
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
              <div className="tieudelon m-0">
                <i className="fa-solid fa-folder-open me-2 text-danger"></i>
                VĂN BẢN CHỈ ĐẠO &amp; ĐIỀU HÀNH
              </div>
              <div className="input-group" style={{ maxWidth: '320px' }}>
                <span className="input-group-text bg-white border-end-0 text-muted">
                  <i className="fa-solid fa-magnifying-glass"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 ps-0"
                  placeholder="Tìm số hiệu, trích yếu, người ký..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Bộ Lọc Thẻ Chuyên Mục */}
            <div className="d-flex flex-wrap gap-2 mb-4">
              <button
                className={`btn btn-sm ${selectedCategory === 'all' ? 'btn-primary fw-bold' : 'btn-light border'}`}
                onClick={() => setSelectedCategory('all')}
              >
                <i className="fa-solid fa-list me-1"></i> Tất cả ({getCount('all')})
              </button>
              <button
                className={`btn btn-sm ${selectedCategory === 'tuyentruyen' ? 'btn-warning fw-bold text-dark' : 'btn-light border'}`}
                onClick={() => setSelectedCategory('tuyentruyen')}
              >
                <i className="fa-solid fa-bullhorn me-1 text-warning"></i> Tuyên truyền ({getCount('tuyentruyen')})
              </button>
              <button
                className={`btn btn-sm ${selectedCategory === 'kehoach' ? 'btn-success fw-bold' : 'btn-light border'}`}
                onClick={() => setSelectedCategory('kehoach')}
              >
                <i className="fa-solid fa-calendar-check me-1 text-success"></i> Kế hoạch ({getCount('kehoach')})
              </button>
              <button
                className={`btn btn-sm ${selectedCategory === 'luat' ? 'btn-info fw-bold text-dark' : 'btn-light border'}`}
                onClick={() => setSelectedCategory('luat')}
              >
                <i className="fa-solid fa-scale-balanced me-1 text-primary"></i> Văn bản luật ({getCount('luat')})
              </button>
              <button
                className={`btn btn-sm ${selectedCategory === 'quyetdinh' ? 'btn-danger fw-bold' : 'btn-light border'}`}
                onClick={() => setSelectedCategory('quyetdinh')}
              >
                <i className="fa-solid fa-stamp me-1 text-danger"></i> Quyết định ({getCount('quyetdinh')})
              </button>
            </div>

            {/* Danh Sách Văn Bản */}
            {loading ? (
              <div className="text-center py-5 text-muted">
                <i className="fa-solid fa-circle-notch fa-spin me-2 fs-4"></i>
                <div>Đang nạp kho văn bản chỉ đạo từ hệ thống...</div>
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="text-center py-5 text-muted" style={{ background: '#F8FAFC', borderRadius: '10px' }}>
                <i className="fa-regular fa-folder-open fs-1 text-secondary mb-2"></i>
                <div className="fw-semibold">Không tìm thấy văn bản nào phù hợp.</div>
                <small>Vui lòng thử tìm kiếm với từ khóa khác hoặc chuyển chuyên mục.</small>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-bordered table-hover align-middle" style={{ fontSize: '13px' }}>
                  <thead className="table-primary">
                    <tr>
                      <th style={{ width: '130px' }}>Số / Ký Hiệu</th>
                      <th>Trích Yếu Nội Dung</th>
                      <th style={{ width: '130px' }}>Phân Loại</th>
                      <th style={{ width: '105px' }}>Ban Hành</th>
                      <th style={{ width: '90px', textAlign: 'center' }}>Lượt Tải</th>
                      <th style={{ width: '95px', textAlign: 'center' }}>Tải Về</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDocs.map(d => {
                      const isConHieuLuc = (d.hieu_luc || 'con_hieu_luc') === 'con_hieu_luc';
                      return (
                        <tr key={d.id || d.MaVanBan}>
                          <td className="fw-bold text-primary">
                            <i className="fa-solid fa-file-pdf text-danger me-2"></i>
                            {d.so_hieu || d.SoHieuVanBan || 'N/A'}
                          </td>
                          <td>
                            <div className="fw-bold text-dark mb-1">
                              {d.tieu_de || d.TenVanBan || ''}
                            </div>
                            <div className="small text-muted">
                              Ban hành: <strong>{d.co_quan_ban_hanh || d.CoQuanBanHanh || 'CĐ TDMU'}</strong> | Ký bởi: <strong>{d.nguoi_ky || d.NguoiKy || 'Ban Thường Vụ'}</strong>
                              {' '}{!isConHieuLuc && <span className="badge bg-secondary ms-1">Hết hiệu lực</span>}
                            </div>
                          </td>
                          <td>
                            {catBadges[d.loai_van_ban || d.LoaiVanBan] || <span className="badge bg-secondary">Văn bản</span>}
                          </td>
                          <td className="text-secondary">
                            {d.ngay_ban_hanh || d.NgayBanHanh || ''}
                          </td>
                          <td className="text-center">
                            <span className="badge bg-light text-primary border">
                              <i className="fa-solid fa-download me-1"></i>
                              {d.luot_tai || d.LuotTai || 0}
                            </span>
                          </td>
                          <td className="text-center">
                            <a
                              href={`/api/documents/download/${d.id || d.MaVanBan}`}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-sm btn-outline-danger fw-bold"
                              style={{ fontSize: '11.5px', padding: '4px 8px' }}
                              title="Tải văn bản PDF"
                            >
                              <i className="fa-solid fa-download me-1"></i> PDF
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* CỘT PHẢI: LIÊN KẾT WEBSITE & THỐNG KÊ */}
        <div className="col-lg-3">
          <div className="panel-tdmu mb-4">
            <div className="panel-heading-tdmu">
              <i className="fa-solid fa-link me-2 text-primary"></i>Liên kết website
            </div>
            <div className="list-group-tdmu">
              <a href="http://tdmu.edu.vn/" target="_blank" rel="noreferrer" className="list-group-item">
                <i className="fa-solid fa-chevron-right me-1 text-muted small"></i> Đại học Thủ Dầu Một
              </a>
              <a href="http://danguy.tdmu.edu.vn/" target="_blank" rel="noreferrer" className="list-group-item">
                <i className="fa-solid fa-chevron-right me-1 text-muted small"></i> Đảng Bộ Đại học TDMU
              </a>
              <a href="http://www.congdoan.vn" target="_blank" rel="noreferrer" className="list-group-item">
                <i className="fa-solid fa-chevron-right me-1 text-muted small"></i> Tổng LĐLĐ Việt Nam
              </a>
              <a href="http://congdoanbinhduong.org.vn/" target="_blank" rel="noreferrer" className="list-group-item">
                <i className="fa-solid fa-chevron-right me-1 text-muted small"></i> LĐLĐ Tỉnh Bình Dương
              </a>
              <a href="http://lib.tdmu.edu.vn/" target="_blank" rel="noreferrer" className="list-group-item">
                <i className="fa-solid fa-chevron-right me-1 text-muted small"></i> TT Học Liệu ĐH TDMU
              </a>
            </div>
          </div>

          <div className="panel-tdmu">
            <div className="panel-heading-tdmu">
              <i className="fa-solid fa-chart-simple me-2 text-warning"></i>Thống kê văn bản
            </div>
            <div className="p-3" style={{ fontSize: '13px' }}>
              <p className="mb-2"><i className="fa-solid fa-file-lines text-primary me-2"></i> Tổng văn bản: <strong>{documents.length}</strong></p>
              <p className="mb-2"><i className="fa-solid fa-download text-success me-2"></i> Tổng lượt tải: <strong>{documents.reduce((acc, d) => acc + (d.luot_tai || d.LuotTai || 0), 0)}</strong></p>
              <p className="mb-0"><i className="fa-solid fa-shield-halved text-info me-2"></i> Còn hiệu lực: <strong>{documents.filter(d => (d.hieu_luc || 'con_hieu_luc') === 'con_hieu_luc').length}</strong></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VanBan;
