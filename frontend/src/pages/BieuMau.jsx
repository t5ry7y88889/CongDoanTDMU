import React from 'react';
import Sidebar from '../components/Sidebar';

const templates = [
  { code: 'BM-01/CĐ', title: 'Phiếu Lý Lịch & Đơn Xin Gia Nhập Công Đoàn TDMU', desc: 'Dành cho Cán bộ, Giảng viên mới tuyển dụng gia nhập tổ chức công đoàn', href: 'uploads/templates/BM_01_Don_Gia_Nhap_Cong_Doan.docx' },
  { code: 'BM-02/CĐ', title: 'Mẫu Báo Cáo Hoạt Động Định Kỳ Tháng của Tổ Công Đoàn', desc: 'Biểu mẫu chuẩn hóa dành cho 16 Tổ công đoàn cơ sở', href: 'uploads/templates/BM_02_Mau_Bao_Cao_Thang_To_Cong_Doan.docx' },
  { code: 'BM-03/CĐ', title: 'Đơn Đề Nghị Hỗ Trợ Chăm Lo Khó Khăn & Bệnh Hiểm Nghèo', desc: 'Hồ sơ xét duyệt trợ cấp Quỹ tương thân tương ái Công đoàn TDMU', href: 'uploads/templates/BM_03_Don_Ho_Tro_Kho_Khan.docx' },
  { code: 'BM-04/CĐ', title: 'Phiếu Đánh Giá & Xếp Loại Đoàn Viên Cuối Năm', desc: 'Dùng cho công tác bình bầu thi đua và khen thưởng cán bộ đoàn viên', href: 'uploads/templates/BM_04_Danh_Gia_Xep_Loai.docx' }
];

const BieuMau = () => (
  <div className="container my-3">
    <div className="breadcrumb-box"><a href="/">Trang chủ</a> / <span className="text-muted">Kho biểu mẫu</span></div>
    <div className="row g-4">
      <div className="col-lg-9">
        <div className="content-box">
          <div className="tieudelon"><i className="fa-solid fa-file-word me-2"></i>KHO BIỂU MẪU NGHIỆP VỤ CÔNG ĐOÀN TDMU</div>

          {templates.map((t) => (
            <div key={t.code} className="p-3 border rounded mb-3 d-flex justify-content-between align-items-center bg-white shadow-sm">
              <div className="d-flex align-items-center gap-3">
                <i className="fa-regular fa-file-word text-primary fa-2x"></i>
                <div>
                  <h6 className="fw-bold mb-1">{t.code}: {t.title}</h6>
                  <small className="text-muted">{t.desc}</small>
                </div>
              </div>
              <a href={t.href} className="btn-portal-access"><i className="fa-solid fa-download me-1"></i> Tải về (.docx)</a>
            </div>
          ))}
        </div>
      </div>
      <Sidebar />
    </div>
  </div>
);

export default BieuMau;