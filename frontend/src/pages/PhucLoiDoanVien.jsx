import React, { useEffect, useRef, useState } from 'react';

const emptyForm = {
  full_name: 'TS. Lê Thị Kim Út',
  unit: 'Phòng Quản lý Khoa học',
  phone: '0918.370.363',
  email: 'utltk@tdmu.edu.vn',
  type: '',
  amount_requested: '2000000',
  reason: ''
};

const PhucLoiDoanVien = () => {
  const [programs, setPrograms] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const modalRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/welfare');
        const json = await res.json();
        if (!cancelled && json.success && Array.isArray(json.data)) setPrograms(json.data);
      } catch (err) {
        console.error('Error loading welfare programs:', err);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (showModal && modalRef.current) {
      bootstrap.Modal.getOrCreateInstance(modalRef.current).show();
    }
  }, [showModal]);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch('/api/welfare/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const json = await res.json();
      if (json.success) {
        alert('✅ ' + json.message);
        bootstrap.Modal.getInstance(modalRef.current).hide();
        setShowModal(false);
        setForm(emptyForm);
      } else {
        alert('❌ ' + json.error);
      }
    } catch (err) {
      alert('❌ Lỗi kết nối máy chủ!');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="container my-3">
      <div className="breadcrumb-box"><a href="/">Trang chủ</a> / <span className="text-muted">Chính sách chăm lo &amp; Phúc lợi đoàn viên</span></div>

      <div className="row g-4">
        <div className="col-lg-9">
          <div className="content-box mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="tieudelon mb-0">
                <span><i className="fa-solid fa-hand-holding-heart text-danger me-2"></i>CHÍNH SÁCH CHĂM LO &amp; PHÚC LỢI ĐOÀN VIÊN TDMU</span>
              </div>
              <button className="btn btn-sm btn-primary fw-bold" onClick={() => setShowModal(true)}>
                <i className="fa-solid fa-file-pen me-1"></i> Gửi Đơn Đề Nghị Trợ Cấp
              </button>
            </div>

            <p className="text-muted small mb-4">
              Hệ thống các chương trình phúc lợi, trợ cấp khó khăn và chăm lo đời sống vật chất, tinh thần được lưu trữ và xét duyệt trực tiếp trên Cơ sở dữ liệu Công đoàn Trường.
            </p>

            {programs.length === 0 && (
              <div className="text-center py-4 text-muted"><i className="fa-solid fa-spinner fa-spin me-2"></i> Đang tải dữ liệu chính sách từ CSDL...</div>
            )}

            <div className="row g-3">
              {programs.map((p) => (
                <div className="col-md-6" key={p.id ?? p.code ?? p.title}>
                  <div className="welfare-card">
                    <div>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className={`badge bg-light text-${p.color || 'primary'} border`}><i className={`fa-solid ${p.icon || 'fa-gift'} me-1`}></i> {p.code}</span>
                        <span className="welfare-badge-budget">{p.budget_range || p.amount || p.MucHoTro || ''}</span>
                      </div>
                      <h6 className="fw-bold text-primary mb-2" style={{ fontSize: '15px' }}>{p.title}</h6>
                      <p className="small text-muted mb-2">{p.description}</p>
                    </div>
                    <div className="border-top pt-2 mt-2 text-secondary small d-flex justify-content-between align-items-center">
                      <span><i className="fa-solid fa-users text-primary me-1"></i> Đối tượng: <strong>{p.target || p.target_audience || p.DoiTuongHuong || ''}</strong></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-lg-3">
          <div className="panel-tdmu">
            <div className="panel-heading-tdmu"><i className="fa-solid fa-link me-2 text-primary"></i>Liên kết website</div>
            <div className="list-group-tdmu">
              <a href="https://tdmu.edu.vn/" target="_blank" rel="noreferrer" className="list-group-item"><i className="fa-solid fa-chevron-right me-1 text-muted small"></i> Đại học Thủ Dầu Một</a>
              <a href="https://danguy.tdmu.edu.vn/" target="_blank" rel="noreferrer" className="list-group-item"><i className="fa-solid fa-chevron-right me-1 text-muted small"></i> Đảng Bộ Đại học TDMU</a>
              <a href="https://www.congdoan.vn" target="_blank" rel="noreferrer" className="list-group-item"><i className="fa-solid fa-chevron-right me-1 text-muted small"></i> Tổng LĐLĐ Việt Nam</a>
              <a href="https://congdoanbinhduong.org.vn/" target="_blank" rel="noreferrer" className="list-group-item"><i className="fa-solid fa-chevron-right me-1 text-muted small"></i> LĐLĐ Tỉnh Bình Dương</a>
              <a href="https://lib.tdmu.edu.vn/" target="_blank" rel="noreferrer" className="list-group-item"><i className="fa-solid fa-chevron-right me-1 text-muted small"></i> TT Học Liệu ĐH TDMU</a>
            </div>
          </div>

          <div className="panel-tdmu">
            <div className="panel-heading-tdmu"><i className="fa-solid fa-shield-heart me-2 text-danger"></i>Quỹ tương trợ CĐ</div>
            <div className="p-3" style={{ fontSize: '13px' }}>
              <p className="mb-2"><i className="fa-solid fa-check text-success me-2"></i> Trợ cấp ốm đau: <strong>100% hồ sơ</strong></p>
              <p className="mb-2"><i className="fa-solid fa-check text-success me-2"></i> Thăm hỏi thai sản: <strong>Kịp thời</strong></p>
              <p className="mb-0"><i className="fa-solid fa-check text-success me-2"></i> Khám sức khỏe: <strong>Định kỳ hàng năm</strong></p>
            </div>
          </div>
        </div>
      </div>

      <div className="modal fade" ref={modalRef} tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content" style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
            <div className="modal-header text-white" style={{ background: '#002855' }}>
              <h5 className="modal-title fw-bold" style={{ fontSize: '16px' }}>
                <i className="fa-solid fa-file-signature text-warning me-2"></i> ĐƠN ĐỀ NGHỊ TRỢ CẤP / CHĂM LO PHÚC LỢI
              </h5>
              <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <form onSubmit={submit}>
              <div className="modal-body p-4 bg-light">
                <div className="mb-3">
                  <label className="form-label fw-bold small text-secondary">Họ và Tên Cán bộ / Đoàn viên (*):</label>
                  <input type="text" className="form-control" value={form.full_name} onChange={set('full_name')} required />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold small text-secondary">Đơn vị / Tổ Công đoàn (*):</label>
                  <input type="text" className="form-control" value={form.unit} onChange={set('unit')} required />
                </div>
                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <label className="form-label fw-bold small text-secondary">Số điện thoại (*):</label>
                    <input type="tel" className="form-control" value={form.phone} onChange={set('phone')} required />
                  </div>
                  <div className="col-6">
                    <label className="form-label fw-bold small text-secondary">Email liên hệ (*):</label>
                    <input type="email" className="form-control" value={form.email} onChange={set('email')} required />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold small text-secondary">Loại hình đề nghị trợ cấp (*):</label>
                  <select className="form-select" value={form.type} onChange={set('type')} required>
                    <option value="">-- Chọn loại hình --</option>
                    <option value="Trợ cấp khó khăn đột xuất">Trợ cấp khó khăn đột xuất</option>
                    <option value="Thăm hỏi ốm đau / phẫu thuật">Thăm hỏi ốm đau / phẫu thuật</option>
                    <option value="Chăm lo thai sản / nữ công">Chăm lo thai sản / nữ công</option>
                    <option value="Hỗ trợ thân nhân gia đình khó khăn">Hỗ trợ thân nhân gia đình khó khăn</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold small text-secondary">Số tiền đề nghị (VNĐ):</label>
                  <input type="number" className="form-control" value={form.amount_requested} onChange={set('amount_requested')} step="500000" min="0" />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold small text-secondary">Lý do &amp; Hoàn cảnh cụ thể (*):</label>
                  <textarea className="form-control" value={form.reason} onChange={set('reason')} rows="3" placeholder="Mô tả tóm tắt hoàn cảnh để Ban Thường Vụ xem xét..." required></textarea>
                </div>
              </div>
              <div className="modal-footer bg-white py-2">
                <button type="button" className="btn btn-sm btn-secondary" data-bs-dismiss="modal">Hủy bỏ</button>
                <button type="submit" className="btn btn-sm btn-primary fw-bold" disabled={sending}>
                  {sending ? <i className="fa-solid fa-spinner fa-spin me-1"></i> : <i className="fa-solid fa-paper-plane me-1"></i>}
                  {sending ? ' Đang gửi...' : ' Gửi Đơn Tới Ban Thường Vụ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhucLoiDoanVien;