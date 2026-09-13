import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';

const units = [
  ['1', 'Tổ Công đoàn 1 - Khối Hiệu Bộ', 'Đ/c Nguyễn Văn A', 'tcd01@tdmu.edu.vn'],
  ['2', 'Tổ Công đoàn 2 - Phòng Đào Tạo & Khảo Thí', 'Đ/c Trần Thị B', 'tcd02@tdmu.edu.vn'],
  ['3', 'Tổ Công đoàn 3 - Viện Công Nghệ Số', 'Đ/c Lê Văn C', 'tcd03@tdmu.edu.vn'],
  ['4', 'Tổ Công đoàn 4 - Khoa Khoa Học Tự Nhiên', 'Đ/c Nguyễn Thị Hương', 'tcd04@tdmu.edu.vn'],
  ['5', 'Tổ Công đoàn 5 - Khoa Khoa Học Xã Hội', 'Đ/c Phạm Văn Dũng', 'tcd05@tdmu.edu.vn'],
  ['6', 'Tổ Công đoàn 6 - Khoa Kinh Tế', 'Đ/c Hoàng Minh Tuấn', 'tcd06@tdmu.edu.vn'],
  ['7', 'Tổ Công đoàn 7 - Khoa Ngoại Ngữ', 'Đ/c Vũ Thị Mai', 'tcd07@tdmu.edu.vn'],
  ['8', 'Tổ Công đoàn 8 - Khoa Kỹ Thuật Công Nghệ', 'Đ/c Đặng Văn Long', 'tcd08@tdmu.edu.vn'],
  ['9', 'Tổ Công đoàn 9 - Khoa Kiến Trúc', 'Đ/c Bùi Thị Lan', 'tcd09@tdmu.edu.vn'],
  ['10', 'Tổ Công đoàn 10 - Khoa Sư Phạm', 'Đ/c Đỗ Văn Hùng', 'tcd10@tdmu.edu.vn'],
  ['11', 'Tổ Công đoàn 11 - Khoa Luật', 'Đ/c Ngô Thị Bích', 'tcd11@tdmu.edu.vn'],
  ['12', 'Tổ Công đoàn 12 - Viện Đào Tạo Sau Đại Học', 'Đ/c Dương Văn Nam', 'tcd12@tdmu.edu.vn'],
  ['13', 'Tổ Công đoàn 13 - Trung Tâm Học Liệu & CNTT', 'Đ/c Lý Thị Thu', 'tcd13@tdmu.edu.vn'],
  ['14', 'Tổ Công đoàn 14 - Phòng Công Tác Sinh Viên', 'Đ/c Trịnh Văn Phát', 'tcd14@tdmu.edu.vn'],
  ['15', 'Tổ Công đoàn 15 - Phòng Quản Trị & Cơ Sở Vật Chất', 'Đ/c Mai Thị Ngọc', 'tcd15@tdmu.edu.vn'],
  ['16', 'Tổ Công đoàn 16 - Trung Tâm Ngoại Ngữ - Tin Học', 'Đ/c Đoàn Văn Khải', 'tcd16@tdmu.edu.vn']
];

const emptyForm = { sender_name: 'TS. Lê Thị Kim Út', unit: 'Phòng Quản lý Khoa học', email: 'utltk@tdmu.edu.vn', phone: '0918.370.363', title: '', content: '' };

const LienHe = () => {
  const [form, setForm] = useState(emptyForm);
  const [sending, setSending] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const json = await res.json();
      if (json.success) {
        alert('✅ ' + json.message);
        setForm(emptyForm);
      } else {
        alert('❌ ' + json.error);
      }
    } catch (err) {
      alert('❌ Lỗi kết nối tới máy chủ!');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="container my-3">
      <div className="breadcrumb-box"><a href="/">Trang chủ</a> / <span className="text-muted">Liên hệ &amp; 16 Tổ công đoàn</span></div>
      <div className="row g-4">
        <div className="col-lg-9">
          <div className="content-box">
            <div className="tieudelon"><i className="fa-solid fa-address-book me-2"></i>DANH BẠ 16 TỔ CÔNG ĐOÀN CƠ SỞ TDMU</div>

            <table className="table table-bordered table-hover align-middle" style={{ fontSize: '13px' }}>
              <thead className="table-primary">
                <tr>
                  <th style={{ width: '60px' }}>STT</th>
                  <th>Tên Tổ Công Đoàn</th>
                  <th>Tổ Trưởng</th>
                  <th>Email Liên Hệ</th>
                </tr>
              </thead>
              <tbody>
                {units.map(([stt, name, leader, email]) => (
                  <tr key={stt}>
                    <td>{stt}</td>
                    <td><strong>{name}</strong></td>
                    <td>{leader}</td>
                    <td>{email}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="content-box mt-4">
              <div className="tieudelon">
                <span><i className="fa-solid fa-envelope-open-text text-primary me-2"></i>HỘP THƯ GÓP Ý &amp; PHẢN ÁNH NGUYỆN VỌNG ĐOÀN VIÊN</span>
              </div>
              <p className="text-muted small mb-3">
                Mọi ý kiến đóng góp, đề xuất và phản ánh về chế độ chính sách sẽ được chuyển trực tiếp vào Cơ sở dữ liệu để Ban Chấp Hành &amp; UBKT tiếp nhận xử lý.
              </p>

              <form onSubmit={submit}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-secondary">Họ và Tên (*):</label>
                    <input type="text" className="form-control" value={form.sender_name} onChange={set('sender_name')} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-secondary">Đơn vị / Tổ Công đoàn (*):</label>
                    <input type="text" className="form-control" value={form.unit} onChange={set('unit')} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-secondary">Email nhận phản hồi (*):</label>
                    <input type="email" className="form-control" value={form.email} onChange={set('email')} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-secondary">Số điện thoại liên hệ:</label>
                    <input type="tel" className="form-control" value={form.phone} onChange={set('phone')} />
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-bold small text-secondary">Tiêu đề phản ánh / Góp ý (*):</label>
                    <input type="text" className="form-control" value={form.title} onChange={set('title')} placeholder="Ví dụ: Đề xuất cải thiện cơ sở vật chất khu sinh hoạt công đoàn..." required />
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-bold small text-secondary">Nội dung chi tiết (*):</label>
                    <textarea className="form-control" rows="4" value={form.content} onChange={set('content')} placeholder="Nhập chi tiết nội dung ý kiến hoặc nguyện vọng..." required></textarea>
                  </div>
                  <div className="col-12 text-end">
                    <button type="submit" className="btn btn-primary fw-bold" disabled={sending}>
                      {sending ? <i className="fa-solid fa-spinner fa-spin me-1"></i> : <i className="fa-solid fa-paper-plane me-1"></i>}
                      {sending ? ' Đang gửi dữ liệu...' : ' Gửi Ý Kiến Tới Ban Chấp Hành'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
        <Sidebar />
      </div>
    </div>
  );
};

export default LienHe;