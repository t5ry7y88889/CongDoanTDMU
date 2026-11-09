import React, { useState, useEffect } from 'react';

const LienHe = () => {
  const [unionBranches, setUnionBranches] = useState([]);
  const [externalLinks, setExternalLinks] = useState([]);
  const [siteSettings, setSiteSettings] = useState({
    hotline: '(0274) 3.815.184',
    email: 'congdoan@tdmu.edu.vn',
    address: 'Lầu 1, Dãy A, Cổng 1, Số 06 Trần Văn Ơn, P. Phú Lợi, TP. Thủ Dầu Một, Bình Dương'
  });

  const [formData, setFormData] = useState(() => {
    try {
      const u = JSON.parse(localStorage.getItem('tdmu_user') || '{}');
      return {
        sender_name: u.ho_ten || u.name || '',
        unit: u.unit_name || u.don_vi || '',
        email: u.email || '',
        phone: u.phone || '',
        category: 'Góp ý chế độ chính sách',
        title: '',
        content: ''
      };
    } catch {
      return {
        sender_name: '',
        unit: '',
        email: '',
        phone: '',
        category: 'Góp ý chế độ chính sách',
        title: '',
        content: ''
      };
    }
  });

  const [loading, setLoading] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(null);
  const [feedbackError, setFeedbackError] = useState(null);
  const [publicFeedbacks, setPublicFeedbacks] = useState([]);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(true);
  const [filterFeedbackTab, setFilterFeedbackTab] = useState('all');

  const loadPublicFeedbacks = () => {
    setLoadingFeedbacks(true);
    fetch('/api/feedback')
      .then(r => r.json())
      .then(res => {
        if (res.success && Array.isArray(res.data)) {
          setPublicFeedbacks(res.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingFeedbacks(false));
  };

  useEffect(() => {
    // 1. Fetch 16 Tổ công đoàn từ DB
    fetch('/api/to-cong-doan')
      .then(r => r.json())
      .then(res => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setUnionBranches(res.data);
        }
      })
      .catch(() => {});

    // 2. Fetch external links từ DB
    fetch('/api/external-links')
      .then(r => r.json())
      .then(res => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setExternalLinks(res.data);
        }
      })
      .catch(() => {});

    // 3. Fetch site settings từ DB
    fetch('/api/settings')
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data) {
          setSiteSettings(prev => ({ ...prev, ...res.data }));
        }
      })
      .catch(() => {});

    // 4. Fetch danh sách ý kiến góp ý & phản hồi công khai
    loadPublicFeedbacks();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFeedbackSuccess(null);
    setFeedbackError(null);

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (data.success) {
        setFeedbackSuccess(`Ý kiến đã được gửi thành công đến Ban Thường Vụ! Mã tiếp nhận: #FB-${data.data?.id || 'NEW'}`);
        setFormData(prev => ({ ...prev, title: '', content: '' }));
        loadPublicFeedbacks();
      } else {
        setFeedbackError(data.error || 'Có lỗi xảy ra, vui lòng thử lại.');
      }
    } catch (err) {
      setFeedbackError('Lỗi kết nối tới máy chủ. Vui lòng kiểm tra lại mạng.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container my-4">
      <div className="breadcrumb-box mb-3">
        <a href="/">Trang chủ</a> / <span className="text-muted">Liên hệ &amp; 16 Tổ công đoàn</span>
      </div>

      <div className="row g-4">
        {/* CỘT CHÍNH: DANH BẠ 16 TỔ & HÒM THƯ GÓP Ý */}
        <div className="col-lg-9">
          <div className="content-box mb-4">
            <div className="tieudelon d-flex justify-content-between align-items-center">
              <div>
                <i className="fa-solid fa-address-book me-2 text-primary"></i>
                DANH BẠ 16 TỔ CÔNG ĐOÀN BỘ PHẬN TDMU
              </div>
              <span className="badge bg-success-subtle text-success border border-success-subtle" style={{ fontSize: '11px' }}>
                <i className="fa-solid fa-database me-1"></i> Dữ liệu CSDL Động
              </span>
            </div>
            
            <div className="table-responsive mt-3">
              <table className="table table-bordered table-hover align-middle" style={{ fontSize: '13px' }}>
                <thead className="table-primary">
                  <tr>
                    <th style={{ width: '50px', textAlign: 'center' }}>STT</th>
                    <th>Tên Tổ Công Đoàn</th>
                    <th>Đơn Vị Thành Phần</th>
                    <th>Tổ Trưởng / Đại Diện</th>
                    <th>Liên Hệ (Email / ĐT)</th>
                  </tr>
                </thead>
                <tbody>
                  {unionBranches.length > 0 ? (
                    unionBranches.map((b, idx) => (
                      <tr key={b.id || b.MaToCongDoan || idx}>
                        <td className="text-center fw-bold text-muted">{idx + 1}</td>
                        <td>
                          <strong className="text-primary">{b.name || b.TenToCongDoan}</strong>
                          {(b.code || b.MaDinhDanh) && (
                            <span className="badge bg-light text-secondary border ms-1" style={{ fontSize: '10px' }}>
                              {b.code || b.MaDinhDanh}
                            </span>
                          )}
                        </td>
                        <td>
                          <small className="text-muted">{b.units || b.DonViThanhPhan || b.KhoiTrucThuoc || 'Đơn vị trực thuộc trường'}</small>
                        </td>
                        <td>
                          <strong>{b.leader || b.ToTruong || 'Đang kiện toàn'}</strong>
                          {b.ChucVu && <div style={{ fontSize: '11px', color: '#64748B' }}>{b.ChucVu}</div>}
                        </td>
                        <td>
                          <div>
                            <i className="fa-regular fa-envelope me-1 text-danger"></i>
                            <a href={`mailto:${b.email || b.EmailLienHe || 'congdoan@tdmu.edu.vn'}`} style={{ textDecoration: 'none' }}>
                              {b.email || b.EmailLienHe || 'congdoan@tdmu.edu.vn'}
                            </a>
                          </div>
                          {(b.phone || b.SoDienThoai) && (
                            <div style={{ fontSize: '11.5px', color: '#475569', marginTop: '2px' }}>
                              <i className="fa-solid fa-phone me-1 text-primary"></i>
                              {b.phone || b.SoDienThoai}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center py-4 text-muted">
                        <i className="fa-solid fa-spinner fa-spin me-2"></i>Đang tải dữ liệu mạng lưới tổ công đoàn từ hệ thống...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* HỘP THƯ GÓP Ý ĐIỆN TỬ */}
            <div className="content-box mt-4" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '24px' }}>
              <div className="tieudelon mb-2">
                <span><i className="fa-solid fa-envelope-open-text text-danger me-2"></i>HỘP THƯ GÓP Ý &amp; PHẢN ÁNH NGUYỆN VỌNG ĐOÀN VIÊN</span>
              </div>
              <p className="text-muted small mb-4">
                Mọi ý kiến đóng góp, đề xuất cơ sở vật chất, chế độ chính sách sẽ được chuyển trực tiếp vào Cơ sở dữ liệu để Ban Thường Vụ và Ủy ban Kiểm tra Công đoàn tiếp nhận và phản hồi định kỳ.
              </p>

              {feedbackSuccess && (
                <div className="alert alert-success d-flex align-items-center gap-2 mb-4" role="alert">
                  <i className="fa-solid fa-circle-check fs-5"></i>
                  <div>{feedbackSuccess}</div>
                </div>
              )}

              {feedbackError && (
                <div className="alert alert-danger d-flex align-items-center gap-2 mb-4" role="alert">
                  <i className="fa-solid fa-triangle-exclamation fs-5"></i>
                  <div>{feedbackError}</div>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label small fw-bold">Họ và tên đoàn viên / viên chức (*):</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      name="sender_name"
                      value={formData.sender_name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-bold">Tổ công đoàn / Đơn vị công tác (*):</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      name="unit"
                      value={formData.unit}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-bold">Hộp thư điện tử (Email) (*):</label>
                    <input
                      type="email"
                      className="form-control form-control-sm"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-bold">Số điện thoại liên hệ:</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label small fw-bold">Lĩnh vực góp ý phản ánh:</label>
                    <select
                      className="form-select form-select-sm"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                    >
                      <option value="Góp ý chế độ chính sách">Góp ý chế độ chính sách, bảo hiểm &amp; phụ cấp</option>
                      <option value="Cơ sở vật chất & điều kiện làm việc">Cơ sở vật chất &amp; điều kiện làm việc</option>
                      <option value="Hoạt động phong trào & văn thể mỹ">Hoạt động phong trào văn thể mỹ, du lịch hè</option>
                      <option value="Xét duyệt hồ sơ chăm lo trợ cấp">Xét duyệt hồ sơ chăm lo, trợ cấp khó khăn</option>
                      <option value="Ý kiến khác">Ý kiến xây dựng tổ chức Công đoàn khác</option>
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label small fw-bold">Tiêu đề ý kiến phản ánh (*):</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="Nhập tiêu đề ngắn gọn phản ánh đúng trọng tâm vấn đề..."
                      required
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label small fw-bold">Nội dung trình bày chi tiết (*):</label>
                    <textarea
                      className="form-control form-control-sm"
                      rows="4"
                      name="content"
                      value={formData.content}
                      onChange={handleChange}
                      placeholder="Trình bày cụ thể nội dung phản ánh, nguyện vọng, đề xuất giải pháp nếu có..."
                      required
                    ></textarea>
                  </div>
                  <div className="col-12 text-end">
                    <button
                      type="submit"
                      className="btn btn-primary fw-bold px-4 py-2"
                      disabled={loading}
                      style={{ background: '#002855', borderColor: '#002855' }}
                    >
                      {loading ? (
                        <>
                          <i className="fa-solid fa-spinner fa-spin me-2"></i>Đang gửi dữ liệu...
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-paper-plane me-2 text-warning"></i>Gửi Ý Kiến Tới Ban Chấp Hành
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* DANH SÁCH Ý KIẾN & CÂU TRẢ LỜI CỦA CÔNG ĐOÀN */}
            <div className="content-box mt-4" style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '24px' }}>
              <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <div className="tieudelon mb-0" style={{ fontSize: '16px' }}>
                  <i className="fa-solid fa-comments text-primary me-2"></i>
                  HỎI ĐÁP &amp; DANH SÁCH Ý KIẾN ĐÃ ĐƯỢC BAN THƯỜNG VỤ TIẾP NHẬN &amp; TRẢ LỜI
                </div>
                <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-2" style={{ fontSize: '12px' }}>
                  <i className="fa-solid fa-list-check me-1"></i> {publicFeedbacks.length} ý kiến ghi nhận
                </span>
              </div>
              <p className="text-muted small mb-3">
                Tổng hợp các câu hỏi, phản ánh và văn bản giải đáp chính thức từ Ban Thường Vụ Công đoàn Trường Đại học Thủ Dầu Một để đoàn viên tiện theo dõi, tra cứu.
              </p>

              {/* Tabs Lọc */}
              <div className="d-flex gap-2 mb-3">
                <button
                  type="button"
                  className={`btn btn-sm ${filterFeedbackTab === 'all' ? 'btn-primary' : 'btn-light border'} fw-bold`}
                  onClick={() => setFilterFeedbackTab('all')}
                >
                  Tất Cả ({publicFeedbacks.length})
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${filterFeedbackTab === 'resolved' ? 'btn-success' : 'btn-light border'} fw-bold`}
                  onClick={() => setFilterFeedbackTab('resolved')}
                >
                  Đã Có Phản Hồi ({publicFeedbacks.filter(f => f.response || f.reply || f.TraLoi).length})
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${filterFeedbackTab === 'pending' ? 'btn-warning text-dark' : 'btn-light border'} fw-bold`}
                  onClick={() => setFilterFeedbackTab('pending')}
                >
                  Đang Thụ Lý ({publicFeedbacks.filter(f => !f.response && !f.reply && !f.TraLoi).length})
                </button>
              </div>

              {/* Danh sách items */}
              {loadingFeedbacks ? (
                <div className="text-center py-4 text-muted">
                  <div className="spinner-border spinner-border-sm text-primary mb-2" role="status"></div>
                  <div className="small">Đang đồng bộ dữ liệu ý kiến từ CSDL...</div>
                </div>
              ) : publicFeedbacks.length === 0 ? (
                <div className="text-center py-5 text-muted bg-white rounded-3 border">
                  <i className="fa-regular fa-comment-dots fs-2 mb-2 d-block text-secondary opacity-50"></i>
                  <div className="fw-bold text-dark mb-1">Chưa có ý kiến nào trong hệ thống</div>
                  <div className="small">Hộp thư hiện đang trống (không có dữ liệu ảo). Mọi ý kiến gửi từ biểu mẫu phía trên sẽ lập tức được lưu vào CSDL và cập nhật tại đây!</div>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {publicFeedbacks
                    .filter(item => {
                      const hasReply = Boolean(item.response || item.reply || item.TraLoi);
                      if (filterFeedbackTab === 'resolved') return hasReply;
                      if (filterFeedbackTab === 'pending') return !hasReply;
                      return true;
                    })
                    .map((item, idx) => {
                      const reply = item.response || item.reply || item.TraLoi;
                      const hasReply = Boolean(reply);
                      const sender = item.sender_name || item.fullname || item.HoTen || 'Cán bộ / Đoàn viên';
                      const unit = item.unit || item.DonVi || 'Đoàn viên TDMU';
                      const title = item.title || item.TieuDe || 'Ý kiến đóng góp';
                      const content = item.content || item.NoiDung || '';
                      const date = item.submitted_at || item.NgayGui;

                      return (
                        <div key={item.id || item.MaGopY || idx} className="p-3 border rounded-3 bg-white shadow-sm" style={{ borderLeft: hasReply ? '4px solid #16A34A' : '4px solid #F59E0B' }}>
                          <div className="d-flex justify-content-between align-items-start mb-2 flex-wrap gap-2">
                            <div>
                              <span className="badge bg-light text-primary border me-2">
                                <i className="fa-solid fa-tag me-1"></i>{item.category || item.ChuDe || 'Góp ý chung'}
                              </span>
                              <span className={`badge ${hasReply ? 'bg-success' : 'bg-warning text-dark'}`}>
                                {hasReply ? '✓ Đã có phản hồi chính thức' : '⏳ Ban Thường Vụ đang thụ lý'}
                              </span>
                            </div>
                            {date && (
                              <small className="text-muted">
                                <i className="fa-regular fa-clock me-1"></i>
                                {new Date(date).toLocaleString('vi-VN')}
                              </small>
                            )}
                          </div>

                          <div className="d-flex align-items-center gap-2 mb-2">
                            <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#EFF6FF', color: '#1D4ED8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800' }}>
                              {sender.charAt(0).toUpperCase()}
                            </div>
                            <span className="fw-bold text-dark" style={{ fontSize: '13.5px' }}>{sender}</span>
                            <span className="text-muted small">· {unit}</span>
                          </div>

                          <h6 className="fw-bold text-primary mb-1" style={{ fontSize: '14.5px' }}>
                            <i className="fa-solid fa-circle-question me-1 text-muted"></i>
                            {title}
                          </h6>
                          <div className="text-secondary small mb-2" style={{ whiteSpace: 'pre-line', lineHeight: '1.55', background: '#F8FAFC', padding: '10px 14px', borderRadius: '6px' }}>
                            {content}
                          </div>

                          {hasReply ? (
                            <div className="mt-2 p-3 rounded-3" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                              <div className="fw-bold text-success small mb-1 d-flex align-items-center gap-1">
                                <i className="fa-solid fa-reply-all"></i>
                                PHẢN HỒI CHÍNH THỨC TỪ BAN THƯỜNG VỤ CÔNG ĐOÀN TDMU:
                              </div>
                              <div className="small text-dark" style={{ whiteSpace: 'pre-line', lineHeight: '1.65' }}>
                                {reply}
                              </div>
                            </div>
                          ) : (
                            <div className="small text-warning-emphasis fst-italic mt-1">
                              <i className="fa-solid fa-spinner fa-spin me-1"></i> Ban Thường Vụ đang thẩm định hồ sơ và sẽ phản hồi trong thời gian sớm nhất.
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: LIÊN KẾT & THỐNG KÊ */}
        <div className="col-lg-3">
          <div className="panel-tdmu mb-4">
            <div className="panel-heading-tdmu">
              <i className="fa-solid fa-link me-2 text-primary"></i>Liên kết website
            </div>
            <div className="list-group-tdmu">
              {externalLinks.length > 0 ? (
                externalLinks.map(l => (
                  <a key={l.id} href={l.url} target="_blank" rel="noreferrer" className="list-group-item">
                    <i className="fa-solid fa-chevron-right me-1 text-muted small"></i> {l.title}
                  </a>
                ))
              ) : (
                <>
                  <a href="https://tdmu.edu.vn/" target="_blank" rel="noreferrer" className="list-group-item">
                    <i className="fa-solid fa-chevron-right me-1 text-muted small"></i> Đại học Thủ Dầu Một
                  </a>
                  <a href="https://danguy.tdmu.edu.vn/" target="_blank" rel="noreferrer" className="list-group-item">
                    <i className="fa-solid fa-chevron-right me-1 text-muted small"></i> Đảng Bộ ĐH Thủ Dầu Một
                  </a>
                  <a href="https://congdoanvietnam.vn" target="_blank" rel="noreferrer" className="list-group-item">
                    <i className="fa-solid fa-chevron-right me-1 text-muted small"></i> Tổng LĐLĐ Việt Nam
                  </a>
                </>
              )}
            </div>
          </div>

          <div className="panel-tdmu">
            <div className="panel-heading-tdmu">
              <i className="fa-solid fa-headset me-2 text-warning"></i>Đường dây nóng
            </div>
            <div className="p-3" style={{ fontSize: '13px' }}>
              <p className="mb-2"><i className="fa-solid fa-phone text-danger me-2"></i> Hotline: <strong>{siteSettings.hotline}</strong></p>
              <p className="mb-2"><i className="fa-solid fa-envelope text-primary me-2"></i> Email: <strong>{siteSettings.email}</strong></p>
              <p className="mb-0"><i className="fa-solid fa-location-dot text-success me-2"></i> VP: <strong>{siteSettings.address}</strong></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LienHe;
