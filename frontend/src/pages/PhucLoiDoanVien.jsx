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
    type: 'Trợ cấp khó khăn đột xuất',
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
    <div className="container my-3">
      <div className="breadcrumb-box">
        <a href="/">Trang chủ</a> / <span className="text-muted">Chính sách chăm lo &amp; Phúc lợi đoàn viên</span>
      </div>

      <div className="row g-4">
        <div className="col-lg-9">
          <div className="content-box mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="tieudelon mb-0">
                <span><i className="fa-solid fa-hand-holding-heart text-danger me-2"></i>CHÍNH SÁCH CHĂM LO &amp; PHÚC LỢI ĐOÀN VIÊN TDMU</span>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-primary fw-bold"
                onClick={() => { setShowApplyModal(true); setSubmitSuccess(null); setSubmitError(null); }}
                style={{ background: '#002855', borderColor: '#002855' }}
              >
                <i className="fa-solid fa-file-pen me-1"></i> Gửi Đơn Đề Nghị Trợ Cấp
              </button>
            </div>

            <p className="text-muted small mb-4">
              Hệ thống các chương trình phúc lợi, trợ cấp khó khăn và chăm lo đời sống vật chất, tinh thần được lưu trữ và xét duyệt trực tiếp trên Cơ sở dữ liệu Công đoàn Trường.
            </p>

            <div className="row g-3" id="welfareGridContainer">
              {loading ? (
                <div className="text-center py-4 text-muted">
                  <i className="fa-solid fa-spinner fa-spin me-2"></i> Đang tải dữ liệu chính sách từ CSDL...
                </div>
              ) : policies.length === 0 ? (
                <div className="col-12 text-center text-muted">Chưa có chương trình phúc lợi nào.</div>
              ) : (
                policies.map((p, i) => (
                  <div className="col-md-6" key={p.id || i}>
                    <div className="welfare-card">
                      <div>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className={`badge bg-light text-${p.color || 'primary'} border`}>
                            <i className={`fa-solid ${p.icon || 'fa-gift'} me-1`}></i> {p.code}
                          </span>
                          <span className="welfare-badge-budget">{p.budget_range || p.amount || ''}</span>
                        </div>
                        <h6 className="fw-bold text-primary mb-2" style={{ fontSize: '15px' }}>{p.title}</h6>
                        <p className="small text-muted mb-2">{p.description}</p>
                      </div>
                      <div className="border-top pt-2 mt-2 text-secondary small d-flex justify-content-between align-items-center">
                        <span>
                          <i className="fa-solid fa-users text-primary me-1"></i> Đối tượng: <strong>{p.target_audience || ''}</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

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
              <i className="fa-solid fa-shield-heart me-2 text-danger"></i>Quỹ tương trợ CĐ
            </div>
            <div className="p-3" style={{ fontSize: '13px' }}>
              <p className="mb-2"><i className="fa-solid fa-check text-success me-2"></i> Trợ cấp ốm đau: <strong>100% hồ sơ</strong></p>
              <p className="mb-2"><i className="fa-solid fa-check text-success me-2"></i> Thăm hỏi thai sản: <strong>Kịp thời</strong></p>
              <p className="mb-0"><i className="fa-solid fa-check text-success me-2"></i> Khám sức khỏe: <strong>Định kỳ hàng năm</strong></p>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL NỘP ĐƠN ĐỀ NGHỊ TRỢ CẤP TRỰC TUYẾN */}
      {showApplyModal && (
        <div
          className="modal fade show"
          style={{ display: 'block', backgroundColor: 'rgba(15,23,42,0.7)', zIndex: 1055 }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowApplyModal(false); }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
              <div className="modal-header text-white" style={{ background: '#002855' }}>
                <h5 className="modal-title fw-bold" style={{ fontSize: '16px' }}>
                  <i className="fa-solid fa-file-signature text-warning me-2"></i> ĐƠN ĐỀ NGHỊ TRỢ CẤP / CHĂM LO PHÚC LỢI
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowApplyModal(false)}></button>
              </div>
              <form id="welfareForm" onSubmit={handleSubmitApply}>
                <div className="modal-body p-4 bg-light">
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

                  <div className="mb-3">
                    <label className="form-label fw-bold small text-secondary">Họ và Tên Cán bộ / Đoàn viên (*):</label>
                    <input type="text" className="form-control" name="full_name" value={formData.full_name} onChange={handleInputChange} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold small text-secondary">Đơn vị / Tổ Công đoàn (*):</label>
                    <input type="text" className="form-control" name="unit" value={formData.unit} onChange={handleInputChange} required />
                  </div>
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label fw-bold small text-secondary">Số điện thoại (*):</label>
                      <input type="tel" className="form-control" name="phone" value={formData.phone} onChange={handleInputChange} required />
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-bold small text-secondary">Email liên hệ (*):</label>
                      <input type="email" className="form-control" name="email" value={formData.email} onChange={handleInputChange} required />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold small text-secondary">Loại hình đề nghị trợ cấp (*):</label>
                    <select className="form-select" name="type" value={formData.type} onChange={handleInputChange} required>
                      <option value="Trợ cấp khó khăn đột xuất">Trợ cấp khó khăn đột xuất</option>
                      <option value="Thăm hỏi ốm đau / phẫu thuật">Thăm hỏi ốm đau / phẫu thuật</option>
                      <option value="Chăm lo thai sản / nữ công">Chăm lo thai sản / nữ công</option>
                      <option value="Hỗ trợ thân nhân gia đình khó khăn">Hỗ trợ thân nhân gia đình khó khăn</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold small text-secondary">Số tiền đề nghị (VNĐ):</label>
                    <input type="number" className="form-control" name="amount_requested" value={formData.amount_requested} step="500000" onChange={handleInputChange} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold small text-secondary">Lý do &amp; Hoàn cảnh cụ thể (*):</label>
                    <textarea className="form-control" name="reason" rows="3" placeholder="Mô tả tóm tắt hoàn cảnh để Ban Thường Vụ xem xét..." value={formData.reason} onChange={handleInputChange} required></textarea>
                  </div>
                </div>
                <div className="modal-footer bg-white py-2">
                  <button type="button" className="btn btn-sm btn-secondary" onClick={() => setShowApplyModal(false)}>Hủy bỏ</button>
                  <button type="submit" className="btn btn-sm btn-primary fw-bold" id="btnSubmitWelfare" disabled={submitLoading}>
                    {submitLoading ? (
                      <><i className="fa-solid fa-spinner fa-spin me-1"></i> Đang gửi...</>
                    ) : (
                      <><i className="fa-solid fa-paper-plane me-1"></i> Gửi Đơn Tới Ban Thường Vụ</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhucLoiDoanVien;