import React, { useState, useEffect } from 'react';

const PhucLoiDoanVien = () => {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);

  const [formData, setFormData] = useState({
    full_name: 'TS. Lê Thị Kim Út',
    unit: 'Phòng Quản lý Khoa học',
    phone: '0918.370.363',
    email: 'utltk@tdmu.edu.vn',
    type: 'Trợ cấp ốm đau nằm viện dài ngày',
    amount_requested: 2000000,
    reason: ''
  });

  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/welfare').then(r => r.json());
      if (res.success && Array.isArray(res.data)) {
        setPolicies(res.data);
      }
    } catch (err) {
      console.error('Error fetching welfare policies:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitApply = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setSubmitSuccess(null);
    setSubmitError(null);

    try {
      const res = await fetch('/api/welfare/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (data.success) {
        setSubmitSuccess(`Đã nộp đơn đề nghị trợ cấp thành công! Mã hồ sơ: #TC-${data.data?.id || 'NEW'}. Ban Thường Vụ sẽ thẩm định trong thời gian sớm nhất.`);
        setFormData(prev => ({ ...prev, reason: '', amount_requested: 2000000 }));
      } else {
        setSubmitError(data.error || 'Có lỗi xảy ra, vui lòng kiểm tra lại thông tin.');
      }
    } catch (err) {
      setSubmitError('Lỗi kết nối tới máy chủ.');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="container my-4">
      {/* Breadcrumb */}
      <div className="breadcrumb-box mb-3">
        <a href="/">Trang chủ</a> / <span className="text-muted">Chính sách chăm lo &amp; Phúc lợi đoàn viên</span>
      </div>

      <div className="row g-4">
        {/* CỘT CHÍNH: CHÍNH SÁCH PHÚC LỢI */}
        <div className="col-lg-9">
          <div className="content-box mb-4">
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
              <div className="tieudelon mb-0">
                <i className="fa-solid fa-hand-holding-heart text-danger me-2"></i>
                CHÍNH SÁCH CHĂM LO &amp; PHÚC LỢI ĐOÀN VIÊN TDMU
              </div>
              <button
                type="button"
                className="btn btn-primary fw-bold"
                onClick={() => { setShowApplyModal(true); setSubmitSuccess(null); setSubmitError(null); }}
                style={{ background: '#002855', borderColor: '#002855' }}
              >
                <i className="fa-solid fa-file-pen me-2 text-warning"></i>
                Gửi Đơn Đề Nghị Trợ Cấp
              </button>
            </div>

            <p className="text-muted small mb-4">
              Toàn bộ các chương trình phúc lợi, trợ cấp khó khăn, thăm hỏi ốm đau và học bổng khuyến học được lưu trữ, thẩm định và phê duyệt trực tiếp trên Cơ sở dữ liệu Công đoàn Trường ĐH Thủ Dầu Một.
            </p>

            {/* Grid Chính Sách */}
            {loading ? (
              <div className="text-center py-5 text-muted">
                <i className="fa-solid fa-circle-notch fa-spin me-2 fs-4"></i>
                <div>Đang nạp danh sách chính sách phúc lợi...</div>
              </div>
            ) : policies.length === 0 ? (
              <div className="text-center py-5 text-muted" style={{ background: '#F8FAFC', borderRadius: '10px' }}>
                <i className="fa-regular fa-folder-open fs-1 text-secondary mb-2"></i>
                <div>Hiện chưa có chính sách phúc lợi nào hiển thị.</div>
              </div>
            ) : (
              <div className="row g-3">
                {policies.map(p => (
                  <div className="col-md-6" key={p.id || p.MaPhucLoi}>
                    <div className="card h-100 border shadow-sm" style={{ borderRadius: '10px', overflow: 'hidden' }}>
                      <div className="card-header bg-light d-flex justify-content-between align-items-center py-2">
                        <span className="badge bg-primary px-2 py-1">{p.doi_tuong || p.DoiTuong || 'Toàn thể đoàn viên'}</span>
                        <small className="text-muted"><i className="fa-solid fa-clock me-1"></i>Thường niên</small>
                      </div>
                      <div className="card-body">
                        <h6 className="card-title fw-bold text-dark mb-2">
                          <i className="fa-solid fa-shield-heart text-danger me-2"></i>
                          {p.ten_phuc_loi || p.TenPhucLoi || 'Chương trình phúc lợi'}
                        </h6>
                        <p className="card-text text-secondary small" style={{ lineHeight: '1.5' }}>
                          {p.mo_ta || p.MoTa || 'Hỗ trợ kinh phí, quà tặng hoặc dịch vụ theo chế độ công đoàn cơ sở.'}
                        </p>
                      </div>
                      <div className="card-footer bg-white border-top-0 pt-0 pb-3 d-flex justify-content-between align-items-center">
                        <span className="fw-bold text-danger fs-6">
                          {p.muc_ho_tro || p.MucHoTro || 'Theo quy chế'}
                        </span>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary fw-semibold"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              type: p.ten_phuc_loi || p.TenPhucLoi || prev.type
                            }));
                            setShowApplyModal(true);
                            setSubmitSuccess(null);
                          }}
                        >
                          Đăng ký hỗ trợ
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* CỘT PHẢI: QUỸ TƯƠNG TRỢ & LIÊN KẾT */}
        <div className="col-lg-3">
          <div className="panel-tdmu mb-4">
            <div className="panel-heading-tdmu">
              <i className="fa-solid fa-shield-heart me-2 text-danger"></i>Quỹ tương trợ CĐ
            </div>
            <div className="p-3" style={{ fontSize: '13px' }}>
              <p className="mb-2"><i className="fa-solid fa-check text-success me-2"></i> Trợ cấp ốm đau: <strong>100% hồ sơ</strong></p>
              <p className="mb-2"><i className="fa-solid fa-check text-success me-2"></i> Thăm hỏi thai sản: <strong>Kịp thời</strong></p>
              <p className="mb-2"><i className="fa-solid fa-check text-success me-2"></i> Học bổng khuyến học: <strong>Hàng năm</strong></p>
              <p className="mb-0"><i className="fa-solid fa-check text-success me-2"></i> Khám sức khỏe: <strong>Định kỳ</strong></p>
            </div>
          </div>

          <div className="panel-tdmu">
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
            </div>
          </div>
        </div>
      </div>

      {/* MODAL NỘP ĐƠN TRỢ CẤP ONLINE */}
      {showApplyModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,0.7)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(4px)',
            padding: '16px'
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '14px',
              width: '560px',
              maxWidth: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
              boxShadow: '0 25px 50px rgba(0,0,0,0.35)'
            }}
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="m-0 fw-bold" style={{ color: '#002855' }}>
                <i className="fa-solid fa-file-pen text-primary me-2"></i>
                Nộp Đơn Đề Nghị Trợ Cấp Trực Tuyến
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowApplyModal(false)}
              ></button>
            </div>

            <p className="text-muted small mb-3">
              Hồ sơ sau khi gửi sẽ được chuyển trực tiếp đến Ban Thường Vụ Công đoàn Trường để thẩm định và phê duyệt chi từ Quỹ Tương trợ.
            </p>

            {submitSuccess && (
              <div className="alert alert-success d-flex align-items-center gap-2 mb-3" role="alert">
                <i className="fa-solid fa-circle-check fs-5"></i>
                <div style={{ fontSize: '13px' }}>{submitSuccess}</div>
              </div>
            )}

            {submitError && (
              <div className="alert alert-danger d-flex align-items-center gap-2 mb-3" role="alert">
                <i className="fa-solid fa-triangle-exclamation fs-5"></i>
                <div style={{ fontSize: '13px' }}>{submitError}</div>
              </div>
            )}

            <form onSubmit={handleSubmitApply}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-bold small text-secondary">Họ và tên đoàn viên (*):</label>
                  <input
                    type="text"
                    className="form-control"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold small text-secondary">Đơn vị / Tổ Công đoàn (*):</label>
                  <input
                    type="text"
                    className="form-control"
                    name="unit"
                    value={formData.unit}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold small text-secondary">Số điện thoại liên hệ (*):</label>
                  <input
                    type="tel"
                    className="form-control"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold small text-secondary">Email nhận thông báo:</label>
                  <input
                    type="email"
                    className="form-control"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold small text-secondary">Chế độ đề nghị (*):</label>
                  <select
                    className="form-select"
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                  >
                    <option value="Trợ cấp ốm đau nằm viện dài ngày">Trợ cấp ốm đau nằm viện dài ngày</option>
                    <option value="Chế độ nghỉ dưỡng thai sản">Chế độ nghỉ dưỡng thai sản</option>
                    <option value="Trợ cấp khó khăn đột xuất do tai nạn">Trợ cấp khó khăn đột xuất do tai nạn</option>
                    <option value="Học bổng khuyến học con đoàn viên">Học bổng khuyến học con đoàn viên</option>
                    <option value="Trợ cấp tang chế tứ thân phụ mẫu">Trợ cấp tang chế tứ thân phụ mẫu</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold small text-secondary">Số tiền đề nghị (VNĐ):</label>
                  <input
                    type="number"
                    className="form-control"
                    name="amount_requested"
                    value={formData.amount_requested}
                    onChange={handleInputChange}
                    step="500000"
                    min="500000"
                    required
                  />
                </div>
                <div className="col-12">
                  <label className="form-label fw-bold small text-secondary">Lý do và hoàn cảnh cụ thể (*):</label>
                  <textarea
                    className="form-control"
                    name="reason"
                    rows={3}
                    placeholder="Mô tả cụ thể hoàn cảnh (thời gian nằm viện, bệnh viện điều trị, hoặc thành tích học tập của con...)"
                    value={formData.reason}
                    onChange={handleInputChange}
                    required
                  ></textarea>
                </div>
                <div className="col-12 d-flex justify-content-end gap-2 mt-4">
                  <button
                    type="button"
                    className="btn btn-light border"
                    onClick={() => setShowApplyModal(false)}
                  >
                    Đóng
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary fw-bold"
                    disabled={submitLoading}
                    style={{ background: '#002855', borderColor: '#002855' }}
                  >
                    {submitLoading ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin me-2"></i>Đang gửi đơn...
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-paper-plane me-2 text-warning"></i>Nộp Đơn Tới Ban Thường Vụ
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhucLoiDoanVien;
