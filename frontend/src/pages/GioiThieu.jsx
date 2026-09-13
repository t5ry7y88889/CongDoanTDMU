import React from 'react';
import Sidebar from '../components/Sidebar';

const GioiThieu = () => (
  <div className="container my-3">
    <div className="breadcrumb-box"><a href="/">Trang chủ</a> / <span className="text-muted">Giới thiệu</span></div>
    <div className="row g-4">
      <div className="col-lg-9">
        <div className="content-box">
          <div className="tieudelon"><i className="fa-solid fa-circle-info me-2"></i>QUÁ TRÌNH HÌNH THÀNH &amp; PHÁT TRIỂN</div>
          <p className="lead" style={{ fontSize: '15px', fontWeight: 600, color: '#003865' }}>
            Công đoàn cơ sở Trường Đại học Thủ Dầu Một là tổ chức chính trị - xã hội của cán bộ, giảng viên, nhân viên và người lao động thuộc Trường Đại học Thủ Dầu Một, chịu sự lãnh đạo toàn diện của Đảng ủy Trường và sự chỉ đạo của Liên đoàn Lao động Tỉnh Bình Dương.
          </p>

          <h5 className="fw-bold mt-4 text-primary"><i className="fa-solid fa-bullseye me-2"></i>I. TÔN CHỈ &amp; MỤC ĐÍCH</h5>
          <p>
            Đại diện, bảo vệ quyền, lợi ích hợp pháp, chính đáng của đoàn viên và người lao động; tham gia quản lý, thanh tra, kiểm tra, giám sát hoạt động của Nhà trường; tuyên truyền, vận động người lao động học tập, nâng cao trình độ, kỹ năng nghề nghiệp, chấp hành pháp luật, xây dựng và bảo vệ Tổ quốc.
          </p>

          <h5 className="fw-bold mt-4 text-primary"><i className="fa-solid fa-award me-2"></i>II. THÀNH TÍCH ĐẠT ĐƯỢC</h5>
          <ul>
            <li>Cờ thi đua xuất sắc của Tổng Liên đoàn Lao động Việt Nam nhiều năm liền.</li>
            <li>Bằng khen của Ủy ban Nhân dân Tỉnh Bình Dương về thành tích xuất sắc trong phong trào thi đua Lao động giỏi - Lao động sáng tạo.</li>
            <li>100% Tổ Công đoàn đạt danh hiệu Hoàn thành tốt và Hoàn thành xuất sắc nhiệm vụ.</li>
          </ul>
        </div>
      </div>
      <Sidebar />
    </div>
  </div>
);

export default GioiThieu;