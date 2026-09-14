import React from 'react';
import { Link } from 'react-router-dom';

const GioiThieu = () => {
  return (
    <div className="container my-3">
      <div className="breadcrumb-box">
        <Link to="/">Trang chủ</Link> / <span className="text-muted">Giới thiệu</span>
      </div>

      <div className="row g-4">
        <div className="col-lg-9">
          <div className="content-box">
            <div className="tieudelon">
              <i className="fa-solid fa-circle-info me-2 text-primary"></i>
              QUÁ TRÌNH HÌNH THÀNH &amp; PHÁT TRIỂN
            </div>

            <p className="lead" style={{ fontSize: '15px', fontWeight: 600, color: '#003865' }}>
              Công đoàn cơ sở Trường Đại học Thủ Dầu Một là tổ chức chính trị - xã hội của cán bộ, giảng viên, nhân viên và người lao động thuộc Trường Đại học Thủ Dầu Một, chịu sự lãnh đạo toàn diện của Đảng ủy Trường và sự chỉ đạo của Liên đoàn Lao động Tỉnh Bình Dương.
            </p>

            <h5 className="fw-bold mt-4 text-primary"><i className="fa-solid fa-bullseye me-2 text-danger"></i>I. TÔN CHỈ &amp; MỤC ĐÍCH</h5>
            <p style={{ lineHeight: 1.8, textAlign: 'justify' }}>
              Đại diện, bảo vệ quyền, lợi ích hợp pháp, chính đáng của đoàn viên và người lao động; tham gia quản lý, thanh tra, kiểm tra, giám sát hoạt động của Nhà trường; tuyên truyền, vận động người lao động học tập, nâng cao trình độ, kỹ năng nghề nghiệp, chấp hành pháp luật, xây dựng và bảo vệ Tổ quốc.
            </p>

            <h5 className="fw-bold mt-4 text-primary"><i className="fa-solid fa-award me-2 text-warning"></i>II. THÀNH TÍCH ĐẠT ĐƯỢC</h5>
            <ul className="list-group list-group-flush mb-4">
              <li className="list-group-item px-0 py-2 border-0 d-flex align-items-start gap-2">
                <i className="fa-solid fa-medal text-warning mt-1"></i>
                <div>Cờ thi đua xuất sắc của Tổng Liên đoàn Lao động Việt Nam nhiều năm liền.</div>
              </li>
              <li className="list-group-item px-0 py-2 border-0 d-flex align-items-start gap-2">
                <i className="fa-solid fa-certificate text-danger mt-1"></i>
                <div>Bằng khen của Ủy ban Nhân dân Tỉnh Bình Dương về thành tích xuất sắc trong phong trào thi đua "Lao động giỏi - Lao động sáng tạo".</div>
              </li>
              <li className="list-group-item px-0 py-2 border-0 d-flex align-items-start gap-2">
                <i className="fa-solid fa-circle-check text-success mt-1"></i>
                <div>100% Tổ Công đoàn đạt danh hiệu Hoàn thành tốt và Hoàn thành xuất sắc nhiệm vụ.</div>
              </li>
            </ul>
          </div>
        </div>

        <div className="col-lg-3">
          <div className="panel-tdmu">
            <div className="panel-heading-tdmu"><i className="fa-solid fa-link me-2 text-primary"></i>Liên kết website</div>
            <div className="list-group-tdmu">
              <a href="http://tdmu.edu.vn/" target="_blank" rel="noreferrer" className="list-group-item"><i className="fa-solid fa-chevron-right me-1 text-muted small"></i> Đại học Thủ Dầu Một</a>
              <a href="http://danguy.tdmu.edu.vn/" target="_blank" rel="noreferrer" className="list-group-item"><i className="fa-solid fa-chevron-right me-1 text-muted small"></i> Đảng Bộ Đại học Thủ Dầu Một</a>
              <a href="http://www.congdoan.vn" target="_blank" rel="noreferrer" className="list-group-item"><i className="fa-solid fa-chevron-right me-1 text-muted small"></i> Tổng LĐLĐ Việt Nam</a>
              <a href="http://congdoanbinhduong.org.vn/" target="_blank" rel="noreferrer" className="list-group-item"><i className="fa-solid fa-chevron-right me-1 text-muted small"></i> LĐLĐ Tỉnh Bình Dương</a>
              <a href="http://lib.tdmu.edu.vn/" target="_blank" rel="noreferrer" className="list-group-item"><i className="fa-solid fa-chevron-right me-1 text-muted small"></i> TT Học Liệu ĐH Thủ Dầu Một</a>
              <a href="http://doanvien.congdoan.vn/VTBWebProject" target="_blank" rel="noreferrer" className="list-group-item"><i className="fa-solid fa-chevron-right me-1 text-muted small"></i> Phần mềm quản lý đoàn viên</a>
            </div>
          </div>

          <div className="panel-tdmu">
            <div className="panel-heading-tdmu"><i className="fa-solid fa-chart-simple me-2 text-warning"></i>Thống kê truy cập</div>
            <div className="p-3" style={{ fontSize: '13px' }}>
              <p className="mb-2"><i className="fa-solid fa-users text-primary me-2"></i> Đang trực tuyến: <strong>12</strong></p>
              <p className="mb-0"><i className="fa-solid fa-eye text-success me-2"></i> Tổng lượt xem: <strong>811,221</strong></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GioiThieu;