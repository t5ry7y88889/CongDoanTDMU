import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const PhucLoiDoanVien = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentCategory, setCurrentCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNotice, setSelectedNotice] = useState(null);

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/welfare').then(r => r.json());
      if (res.success && Array.isArray(res.data)) {
        setNotices(res.data);
      }
    } catch (err) {
      console.error('Error fetching welfare notices:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredNotices = notices.filter(n => {
    const matchesCategory = currentCategory === 'all' || n.category === currentCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery = !q ||
      (n.title && n.title.toLowerCase().includes(q)) ||
      (n.code && n.code.toLowerCase().includes(q)) ||
      (n.description && n.description.toLowerCase().includes(q)) ||
      (n.issuer && n.issuer.toLowerCase().includes(q));
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="container my-3">
      {/* Breadcrumb */}
      <div className="breadcrumb-box mb-3">
        <Link to="/" className="text-decoration-none">Trang chủ</Link> / <span className="text-muted">Thông báo chính sách chăm lo &amp; Phúc lợi đoàn viên</span>
      </div>

      <div className="row g-4">
        {/* CỘT CHÍNH: DANH SÁCH THÔNG BÁO CHĂM LO & PHÚC LỢI */}
        <div className="col-lg-9">
          <div className="content-box mb-4">
            <div className="mb-3">
              <div className="tieudelon mb-1">
                <i className="fa-solid fa-hand-holding-heart text-danger me-2"></i>
                THÔNG BÁO CHÍNH SÁCH CHĂM LO &amp; PHÚC LỢI ĐOÀN VIÊN
              </div>
              <p className="text-muted small mb-0">
                Chuyên trang tổng hợp các văn bản, thông báo chương trình phúc lợi, thỏa thuận hợp tác ưu đãi và chính sách chăm lo đời sống cho đoàn viên, người lao động Công đoàn Trường Đại học Thủ Dầu Một.
              </p>
            </div>

            {/* Filter Pills & Search */}
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4 pb-2 border-bottom">
              <div className="d-flex flex-wrap gap-2">
                {[
                  { id: 'all', label: 'Tất Cả Thông Báo' },
                  { id: 'phuc_loi', label: 'Chương Trình Phúc Lợi (LĐLĐ)' },
                  { id: 'uu_dai', label: 'Chính Sách Ưu Đãi' },
                  { id: 'le_tet', label: 'Chăm Lo Lễ Tết' },
                  { id: 'tro_cap', label: 'Hướng Dẫn Chế Độ & Trợ Cấp' }
                ].map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    className={`btn btn-sm ${currentCategory === cat.id ? 'btn-primary fw-bold' : 'btn-light border text-secondary'}`}
                    style={{
                      borderRadius: '20px',
                      padding: '5px 14px',
                      fontSize: '12px',
                      background: currentCategory === cat.id ? '#002855' : '#F1F5F9',
                      borderColor: currentCategory === cat.id ? '#002855' : '#CBD5E1',
                      color: currentCategory === cat.id ? '#FFFFFF' : '#475569'
                    }}
                    onClick={() => setCurrentCategory(cat.id)}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div style={{ minWidth: '220px' }}>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Tìm kiếm thông báo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Danh sách thông báo */}
            {loading ? (
              <div className="text-center py-5 text-muted">
                <i className="fa-solid fa-spinner fa-spin me-2"></i> Đang tải dữ liệu thông báo từ hệ thống...
              </div>
            ) : filteredNotices.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <i className="fa-solid fa-folder-open fa-2x mb-2 d-block text-secondary"></i>
                Không tìm thấy thông báo nào phù hợp.
              </div>
            ) : (
              <div className="row g-3">
                {filteredNotices.map(n => (
                  <div key={n.id} className="col-md-6">
                    <div
                      className="h-100 p-3 bg-white rounded border d-flex flex-column justify-content-between"
                      style={{ borderLeft: '4px solid #002855', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                    >
                      <div>
                        <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                          <span
                            style={{
                              background: '#EFF6FF',
                              color: '#002855',
                              fontWeight: '800',
                              fontSize: '11px',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              border: '1px solid #BFDBFE',
                              fontFamily: 'monospace'
                            }}
                          >
                            <i className="fa-solid fa-file-lines text-primary me-1"></i> Số: {n.code}
                          </span>
                          <span className="text-muted small" style={{ fontSize: '11.5px' }}>
                            <i className="fa-regular fa-calendar-check me-1"></i> {n.date}
                          </span>
                        </div>

                        <h6 className="fw-bold text-primary mb-2" style={{ fontSize: '14.5px', lineHeight: 1.45 }}>
                          <a
                            href="#view"
                            onClick={(e) => { e.preventDefault(); setSelectedNotice(n); }}
                            className="text-decoration-none text-primary"
                          >
                            {n.title}
                          </a>
                        </h6>

                        <div className="text-muted small mb-2" style={{ fontSize: '11.5px' }}>
                          <i className="fa-solid fa-building-flag text-secondary me-1"></i> Đơn vị ban hành: <strong>{n.issuer}</strong>
                        </div>

                        <p
                          className="small text-secondary mb-3"
                          style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            lineHeight: 1.55
                          }}
                        >
                          {n.description}
                        </p>
                      </div>

                      <div className="border-top pt-3 mt-auto">
                        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                          <span className="badge bg-light text-secondary border" style={{ fontSize: '11px' }}>
                            <i className="fa-solid fa-tag me-1 text-primary"></i> {n.category_name}
                          </span>
                          <div className="d-flex gap-2">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary py-1 px-2 fw-bold"
                              style={{ fontSize: '12px' }}
                              onClick={() => setSelectedNotice(n)}
                            >
                              <i className="fa-solid fa-eye me-1"></i> Xem Chi Tiết
                            </button>
                            {n.template_code ? (
                              <Link
                                to="/bieu-mau"
                                className="btn btn-sm btn-warning text-dark py-1 px-2 fw-bold"
                                style={{ fontSize: '12px' }}
                                title="Tải biểu mẫu đơn giấy nộp về văn phòng"
                              >
                                <i className="fa-solid fa-file-word me-1"></i> Tải {n.template_code}
                              </Link>
                            ) : (
                              <button
                                type="button"
                                className="btn btn-sm btn-light border py-1 px-2 text-secondary"
                                style={{ fontSize: '12px' }}
                                onClick={() => setSelectedNotice(n)}
                              >
                                <i className="fa-solid fa-download me-1 text-danger"></i> Tải PDF
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* CỘT PHẢI: QUY TRÌNH HÀNH CHÍNH & LIÊN HỆ VĂN PHÒNG */}
        <div className="col-lg-3">
          {/* Hướng dẫn thủ tục hành chính */}
          <div className="panel-tdmu mb-3">
            <div className="panel-heading-tdmu">
              <i className="fa-solid fa-file-circle-check me-2 text-primary"></i>Quy trình giải quyết chế độ
            </div>
            <div className="p-3" style={{ fontSize: '13px', lineHeight: '1.6', color: '#334155' }}>
              <p className="mb-2">Theo Quy chế hoạt động Công đoàn TDMU, mọi chế độ trợ cấp khó khăn, thăm hỏi ốm đau được thực hiện theo quy trình hành chính chuẩn:</p>
              <ol className="ps-3 mb-3 text-secondary">
                <li className="mb-1">Đoàn viên tải Mẫu đơn <strong>BM-03/CĐ</strong> tại mục <Link to="/bieu-mau" className="fw-bold text-decoration-none">Biểu Mẫu</Link>.</li>
                <li className="mb-1">Hoàn thiện nội dung và xin ý kiến xác nhận của <strong>Tổ trưởng Tổ Công đoàn cơ sở</strong>.</li>
                <li>Nộp hồ sơ giấy kèm minh chứng trực tiếp về <strong>Văn phòng Công đoàn Trường</strong> để Ban Thường Vụ xét duyệt.</li>
              </ol>
              <div className="alert alert-light border p-2 mb-0 text-muted" style={{ fontSize: '11.5px' }}>
                <i className="fa-solid fa-circle-info text-primary me-1"></i> Nhà trường không tiếp nhận hồ sơ xin trợ cấp trực tuyến qua mạng nhằm đảm bảo tính bảo mật và đúng thẩm quyền cơ sở.
              </div>
            </div>
          </div>

          {/* Thông tin Văn phòng Công đoàn */}
          <div className="panel-tdmu mb-3">
            <div className="panel-heading-tdmu">
              <i className="fa-solid fa-building-columns me-2 text-primary"></i>Văn phòng Công đoàn TDMU
            </div>
            <div className="p-3" style={{ fontSize: '13px', color: '#334155' }}>
              <p className="mb-2">
                <i className="fa-solid fa-location-dot text-danger me-2"></i> Lầu 1, Dãy A, Cổng 1, Số 06 Trần Văn Ơn, P. Phú Hòa, TP. Thủ Dầu Một, Bình Dương.
              </p>
              <p className="mb-2">
                <i className="fa-solid fa-phone text-success me-2"></i> <strong>(0274) 3.815.184</strong>
              </p>
              <p className="mb-0">
                <i className="fa-solid fa-envelope text-primary me-2"></i> congdoan@tdmu.edu.vn
              </p>
            </div>
          </div>

          {/* Liên kết tiện ích */}
          <div className="panel-tdmu">
            <div className="panel-heading-tdmu">
              <i className="fa-solid fa-link me-2 text-primary"></i>Liên kết tiện ích
            </div>
            <div className="list-group list-group-flush" style={{ fontSize: '13px' }}>
              <Link to="/bieu-mau" className="list-group-item list-group-item-action py-2">
                <i className="fa-solid fa-file-word me-2 text-primary"></i> Kho Biểu Mẫu Nghiệp Vụ
              </Link>
              <Link to="/van-ban" className="list-group-item list-group-item-action py-2">
                <i className="fa-solid fa-folder-open me-2 text-success"></i> Văn Bản Chỉ Đạo Điều Hành
              </Link>
              <a href="https://binhduong.congdoan.vn/" target="_blank" rel="noopener noreferrer" className="list-group-item list-group-item-action py-2">
                <i className="fa-solid fa-arrow-up-right-from-square me-2 text-muted small"></i> LĐLĐ Tỉnh Bình Dương
              </a>
              <a href="https://tdmu.edu.vn/" target="_blank" rel="noopener noreferrer" className="list-group-item list-group-item-action py-2">
                <i className="fa-solid fa-arrow-up-right-from-square me-2 text-muted small"></i> Cổng thông tin ĐH Thủ Dầu Một
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL XEM CHI TIẾT VĂN BẢN THÔNG BÁO CHÍNH THỨC */}
      {selectedNotice && (
        <div
          className="modal fade show"
          style={{ display: 'block', backgroundColor: 'rgba(15, 23, 42, 0.75)', zIndex: 1050 }}
          tabIndex="-1"
          onClick={() => setSelectedNotice(null)}
        >
          <div
            className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content" style={{ borderRadius: '12px', overflow: 'hidden' }}>
              <div className="modal-header text-white" style={{ background: '#002855' }}>
                <h5 className="modal-title fw-bold" style={{ fontSize: '15px' }}>
                  <i className="fa-solid fa-file-lines me-2 text-warning"></i> CHI TIẾT VĂN BẢN THÔNG BÁO CÔNG ĐOÀN TDMU
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setSelectedNotice(null)}
                />
              </div>

              <div className="modal-body p-4 bg-light">
                <div
                  className="shadow-sm bg-white p-4 rounded border"
                  style={{
                    fontFamily: "'Times New Roman', Times, serif",
                    lineHeight: 1.6,
                    color: '#0F172A',
                    fontSize: '15px'
                  }}
                >
                  {/* Quốc hiệu & Đơn vị ban hành */}
                  <div className="d-flex justify-content-between mb-4 text-center" style={{ fontSize: '13.5px' }}>
                    <div>
                      <strong>{(selectedNotice.issuer || 'CÔNG ĐOÀN TRƯỜNG ĐH THỦ DẦU MỘT').toUpperCase()}</strong><br />
                      <span>Số: <strong>{selectedNotice.code}</strong></span>
                    </div>
                    <div>
                      <strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br />
                      <span style={{ borderBottom: '1px solid #333', paddingBottom: '2px' }}>Độc lập - Tự do - Hạnh phúc</span><br />
                      <span style={{ fontStyle: 'italic', fontSize: '12px', display: 'inline-block', marginTop: '4px' }}>
                        Bình Dương, ngày {selectedNotice.date || '15/01/2026'}
                      </span>
                    </div>
                  </div>

                  {/* Tiêu đề thông báo */}
                  <div className="text-center my-3">
                    <h4 style={{ fontWeight: 800, textTransform: 'uppercase', color: '#002855', fontSize: '18px' }}>
                      {selectedNotice.title}
                    </h4>
                    <div style={{ fontSize: '13px', color: '#64748B', fontStyle: 'italic' }}>
                      (Về việc triển khai chính sách chăm lo và bảo vệ quyền lợi đoàn viên)
                    </div>
                  </div>

                  {/* Thân bài thông báo */}
                  <div className="my-3 text-justify" style={{ whiteSpace: 'pre-line' }}>
                    {selectedNotice.content_text || selectedNotice.description}
                  </div>

                  {/* Nơi nhận & Ký tên */}
                  <div className="mt-5 d-flex justify-content-between align-items-start" style={{ fontSize: '13px' }}>
                    <div className="text-muted">
                      <strong>Nơi nhận:</strong><br />
                      - Ban Giám hiệu Nhà trường (để b/c);<br />
                      - 16 Tổ Công đoàn trực thuộc (để t/h);<br />
                      - Toàn thể Đoàn viên CĐ;<br />
                      - Lưu: VT, VP Công đoàn.
                    </div>
                    <div className="text-center" style={{ minWidth: '220px' }}>
                      <strong>TM. BAN THƯỜNG VỤ</strong><br />
                      <strong>CHỦ TỊCH</strong><br />
                      <div style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontStyle: 'italic', color: '#DC2626' }}>
                        [Đã ký &amp; đóng dấu]
                      </div>
                      <strong>Ban Thường Vụ Công Đoàn Trường Đại học Thủ Dầu Một</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer bg-white border-top d-flex justify-content-between">
                <span className="text-muted small">Công đoàn Trường Đại học Thủ Dầu Một</span>
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => setSelectedNotice(null)}
                  >
                    Đóng
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    style={{ background: '#002855', borderColor: '#002855' }}
                    onClick={() => window.print()}
                  >
                    <i className="fa-solid fa-print me-1"></i> In Văn Bản
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhucLoiDoanVien;
