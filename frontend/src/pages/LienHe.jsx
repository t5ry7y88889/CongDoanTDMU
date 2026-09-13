import React, { useState } from 'react';

const LienHe = () => {
  const [formData, setFormData] = useState({
    sender_name: 'TS. Lê Thị Kim Út',
    unit: 'Phòng Quản lý Khoa học',
    email: 'utltk@tdmu.edu.vn',
    phone: '0918.370.363',
    category: 'Góp ý chế độ chính sách',
    title: '',
    content: ''
  });

  const [loading, setLoading] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(null);
  const [feedbackError, setFeedbackError] = useState(null);

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
            <div className="tieudelon">
              <i className="fa-solid fa-address-book me-2 text-primary"></i>
              DANH BẠ 16 TỔ CÔNG ĐOÀN BỘ PHẬN TDMU
            </div>
            
            <div className="table-responsive mt-3">
              <table className="table table-bordered table-hover align-middle" style={{ fontSize: '13px' }}>
                <thead className="table-primary">
                  <tr>
                    <th style={{ width: '60px', textAlign: 'center' }}>STT</th>
                    <th>Tên Tổ Công Đoàn</th>
                    <th>Tổ Trưởng</th>
                    <th>Email Liên Hệ</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td className="text-center">1</td><td><strong>Tổ Công đoàn 1 - Khối Hiệu Bộ</strong></td><td>Đ/c Nguyễn Văn A</td><td>tcd01@tdmu.edu.vn</td></tr>
                  <tr><td className="text-center">2</td><td><strong>Tổ Công đoàn 2 - Phòng Đào Tạo &amp; Khảo Thí</strong></td><td>Đ/c Trần Thị B</td><td>tcd02@tdmu.edu.vn</td></tr>
                  <tr><td className="text-center">3</td><td><strong>Tổ Công đoàn 3 - Viện Công Nghệ Số</strong></td><td>Đ/c Lê Văn C</td><td>tcd03@tdmu.edu.vn</td></tr>
                  <tr><td className="text-center">4</td><td><strong>Tổ Công đoàn 4 - Khoa Khoa Học Tự Nhiên</strong></td><td>Đ/c Nguyễn Thị Hương</td><td>tcd04@tdmu.edu.vn</td></tr>
                  <tr><td className="text-center">5</td><td><strong>Tổ Công đoàn 5 - Khoa Khoa Học Xã Hội</strong></td><td>Đ/c Phạm Văn Dũng</td><td>tcd05@tdmu.edu.vn</td></tr>
                  <tr><td className="text-center">6</td><td><strong>Tổ Công đoàn 6 - Khoa Kinh Tế</strong></td><td>Đ/c Hoàng Minh Tuấn</td><td>tcd06@tdmu.edu.vn</td></tr>
                  <tr><td className="text-center">7</td><td><strong>Tổ Công đoàn 7 - Khoa Ngoại Ngữ</strong></td><td>Đ/c Vũ Thị Mai</td><td>tcd07@tdmu.edu.vn</td></tr>
                  <tr><td className="text-center">8</td><td><strong>Tổ Công đoàn 8 - Khoa Kỹ Thuật Công Nghệ</strong></td><td>Đ/c Đặng Văn Long</td><td>tcd08@tdmu.edu.vn</td></tr>
                  <tr><td className="text-center">9</td><td><strong>Tổ Công đoàn 9 - Khoa Kiến Trúc</strong></td><td>Đ/c Bùi Thị Lan</td><td>tcd09@tdmu.edu.vn</td></tr>
                  <tr><td className="text-center">10</td><td><strong>Tổ Công đoàn 10 - Khoa Sư Phạm</strong></td><td>Đ/c Đỗ Văn Hùng</td><td>tcd10@tdmu.edu.vn</td></tr>
                  <tr><td className="text-center">11</td><td><strong>Tổ Công đoàn 11 - Khoa Luật</strong></td><td>Đ/c Ngô Thị Bích</td><td>tcd11@tdmu.edu.vn</td></tr>
                  <tr><td className="text-center">12</td><td><strong>Tổ Công đoàn 12 - Viện Đào Tạo Sau Đại Học</strong></td><td>Đ/c Dương Văn Nam</td><td>tcd12@tdmu.edu.vn</td></tr>
                  <tr><td className="text-center">13</td><td><strong>Tổ Công đoàn 13 - Trung Tâm Học Liệu &amp; CNTT</strong></td><td>Đ/c Lý Thị Thu</td><td>tcd13@tdmu.edu.vn</td></tr>
                  <tr><td className="text-center">14</td><td><strong>Tổ Công đoàn 14 - Phòng Công Tác Sinh Viên</strong></td><td>Đ/c Trịnh Văn Phát</td><td>tcd14@tdmu.edu.vn</td></tr>
                  <tr><td className="text-center">15</td><td><strong>Tổ Công đoàn 15 - Phòng Quản Trị &amp; Cơ Sở Vật Chất</strong></td><td>Đ/c Mai Thị Ngọc</td><td>tcd15@tdmu.edu.vn</td></tr>
                  <tr><td className="text-center">16</td><td><strong>Tổ Công đoàn 16 - Trung Tâm Ngoại Ngữ - Tin Học</strong></td><td>Đ/c Đoàn Văn Khải</td><td>tcd16@tdmu.edu.vn</td></tr>
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
                    <label className="form-label fw-bold small text-secondary">Họ và Tên (*):</label>
                    <input
                      type="text"
                      className="form-control"
                      name="sender_name"
                      value={formData.sender_name}
                      onChange={handleChange}
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
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-secondary">Email nhận phản hồi (*):</label>
                    <input
                      type="email"
                      className="form-control"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-secondary">Số điện thoại liên hệ:</label>
                    <input
                      type="tel"
                      className="form-control"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-bold small text-secondary">Chuyên mục phản ánh / Góp ý:</label>
                    <select
                      className="form-select"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                    >
                      <option value="Góp ý chế độ chính sách">Góp ý chế độ chính sách, quyền lợi đoàn viên</option>
                      <option value="Cơ sở vật chất & Đời sống">Cơ sở vật chất &amp; Điều kiện làm việc</option>
                      <option value="Hoạt động phong trào">Hoạt động phong trào văn thể mỹ</option>
                      <option value="Chuyển đổi số & Cải cách">Chuyển đổi số &amp; Cải cách hành chính</option>
                      <option value="Ý kiến khác">Ý kiến khác</option>
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-bold small text-secondary">Tiêu đề ý kiến (*):</label>
                    <input
                      type="text"
                      className="form-control"
                      name="title"
                      placeholder="Ví dụ: Đề xuất lắp đặt thêm máy lọc nước tại khu vực giảng đường..."
                      value={formData.title}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-bold small text-secondary">Nội dung chi tiết (*):</label>
                    <textarea
                      className="form-control"
                      name="content"
                      rows={4}
                      placeholder="Nhập chi tiết ý kiến, tâm tư hoặc nguyện vọng cần Công đoàn giải quyết..."
                      value={formData.content}
                      onChange={handleChange}
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
          </div>
        </div>

        {/* CỘT PHẢI: LIÊN KẾT & THỐNG KÊ */}
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
                <i className="fa-solid fa-chevron-right me-1 text-muted small"></i> Đảng Bộ ĐH Thủ Dầu Một
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
              <i className="fa-solid fa-headset me-2 text-warning"></i>Đường dây nóng
            </div>
            <div className="p-3" style={{ fontSize: '13px' }}>
              <p className="mb-2"><i className="fa-solid fa-phone text-danger me-2"></i> Hotline: <strong>0274.3822.058</strong></p>
              <p className="mb-2"><i className="fa-solid fa-envelope text-primary me-2"></i> Email: <strong>congdoan@tdmu.edu.vn</strong></p>
              <p className="mb-0"><i className="fa-solid fa-location-dot text-success me-2"></i> VP: <strong>Phòng 102 - Nhà A</strong></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LienHe;
