import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const GioiThieu = () => {
  const [stats, setStats] = useState({ online: 12, totalViews: 811221 });

  useEffect(() => {
    // Fetch live access stats if available
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => {
        if (data && data.online !== undefined) {
          setStats({
            online: data.online || 12,
            totalViews: data.totalViews || 811221
          });
        }
      })
      .catch(() => {
        // Fallback default stats
      });
  }, []);

  return (
    <div className="container my-4">
      {/* Breadcrumb */}
      <div className="breadcrumb-box mb-3">
        <Link to="/">Trang chủ</Link> / <span className="text-muted">Giới thiệu</span>
      </div>

      <div className="row g-4">
        {/* CỘT TRÁI (9 PHẦN): NỘI DUNG GIỚI THIỆU */}
        <div className="col-lg-9">
          <div className="content-box">
            <div className="tieudelon">
              <i className="fa-solid fa-circle-info me-2 text-primary"></i>
              QUÁ TRÌNH HÌNH THÀNH &amp; PHÁT TRIỂN
            </div>
            
            <p className="lead" style={{ fontSize: '15.5px', fontWeight: 600, color: '#003865', lineHeight: 1.7 }}>
              Công đoàn cơ sở Trường Đại học Thủ Dầu Một là tổ chức chính trị - xã hội của cán bộ, giảng viên, nhân viên và người lao động thuộc Trường Đại học Thủ Dầu Một, chịu sự lãnh đạo toàn diện của Đảng ủy Trường và sự chỉ đạo của Liên đoàn Lao động Tỉnh Bình Dương.
            </p>
            
            <h5 className="fw-bold mt-4 text-primary d-flex align-items-center">
              <i className="fa-solid fa-bullseye me-2 text-danger"></i>I. TÔN CHỈ &amp; MỤC ĐÍCH
            </h5>
            <p style={{ lineHeight: 1.8, textAlign: 'justify' }}>
              Đại diện, chăm lo và bảo vệ quyền, lợi ích hợp pháp, chính đáng của đoàn viên và người lao động; tham gia quản lý, thanh tra, kiểm tra, giám sát hoạt động của Nhà trường; tuyên truyền, vận động người lao động học tập, nâng cao trình độ chuyên môn, kỹ năng nghề nghiệp, chấp hành pháp luật, đồng hành xây dựng và phát triển Trường Đại học Thủ Dầu Một theo định hướng chuẩn đại học thông minh, đổi mới sáng tạo.
            </p>

            <h5 className="fw-bold mt-4 text-primary d-flex align-items-center">
              <i className="fa-solid fa-award me-2 text-warning"></i>II. THÀNH TÍCH ĐẠT ĐƯỢC TIÊU BIỂU
            </h5>
            <ul className="list-group list-group-flush mb-4">
              <li className="list-group-item px-0 py-2 border-0 d-flex align-items-start gap-2">
                <i className="fa-solid fa-medal text-warning mt-1"></i>
                <div><strong>Cờ thi đua xuất sắc</strong> của Tổng Liên đoàn Lao động Việt Nam nhiều năm liền dành cho Công đoàn cơ sở vững mạnh xuất sắc.</div>
              </li>
              <li className="list-group-item px-0 py-2 border-0 d-flex align-items-start gap-2">
                <i className="fa-solid fa-certificate text-danger mt-1"></i>
                <div><strong>Bằng khen của Chủ tịch UBND Tỉnh Bình Dương</strong> về thành tích xuất sắc trong phong trào thi đua "Lao động giỏi - Lao động sáng tạo".</div>
              </li>
              <li className="list-group-item px-0 py-2 border-0 d-flex align-items-start gap-2">
                <i className="fa-solid fa-circle-check text-success mt-1"></i>
                <div><strong>100% Tổ Công đoàn</strong> trực thuộc hoàn thành tốt và hoàn thành xuất sắc nhiệm vụ được giao hàng năm.</div>
              </li>
              <li className="list-group-item px-0 py-2 border-0 d-flex align-items-start gap-2">
                <i className="fa-solid fa-hand-holding-heart text-info mt-1"></i>
                <div>Hàng trăm lượt cán bộ, giảng viên, nhân viên được hỗ trợ khó khăn, tặng quà tết và hưởng các gói phúc lợi đoàn viên công đoàn ưu việt.</div>
              </li>
            </ul>

            <h5 className="fw-bold mt-4 text-primary d-flex align-items-center">
              <i className="fa-solid fa-compass me-2 text-primary"></i>III. PHƯƠNG CHÂM HOẠT ĐỘNG
            </h5>
            <div className="alert alert-primary bg-light border-primary p-3 rounded-3">
              <div className="fst-italic fw-semibold text-primary mb-1">
                "Đổi mới - Dân chủ - Đoàn kết - Phát triển"
              </div>
              <small className="text-muted">
                Tất cả vì quyền lợi chính đáng của người lao động, đồng hành cùng sự phát triển bền vững của Trường Đại học Thủ Dầu Một.
              </small>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI (3 PHẦN): LIÊN KẾT & WIDGET */}
        <div className="col-lg-3">
          {/* Liên Kết Website */}
          <div className="panel-tdmu mb-4">
            <div className="panel-heading-tdmu">
              <i className="fa-solid fa-link me-2 text-primary"></i>Liên kết website
            </div>
            <div className="list-group list-group-flush" style={{ fontSize: '13.5px' }}>
              <a href="http://tdmu.edu.vn/" target="_blank" rel="noreferrer" className="list-group-item list-group-item-action py-2">
                <i className="fa-solid fa-chevron-right me-2 text-muted small"></i>Đại học Thủ Dầu Một
              </a>
              <a href="http://danguy.tdmu.edu.vn/" target="_blank" rel="noreferrer" className="list-group-item list-group-item-action py-2">
                <i className="fa-solid fa-chevron-right me-2 text-muted small"></i>Đảng Bộ ĐH Thủ Dầu Một
              </a>
              <a href="http://www.congdoan.vn" target="_blank" rel="noreferrer" className="list-group-item list-group-item-action py-2">
                <i className="fa-solid fa-chevron-right me-2 text-muted small"></i>Tổng LĐLĐ Việt Nam
              </a>
              <a href="http://congdoanbinhduong.org.vn/" target="_blank" rel="noreferrer" className="list-group-item list-group-item-action py-2">
                <i className="fa-solid fa-chevron-right me-2 text-muted small"></i>LĐLĐ Tỉnh Bình Dương
              </a>
              <a href="http://lib.tdmu.edu.vn/" target="_blank" rel="noreferrer" className="list-group-item list-group-item-action py-2">
                <i className="fa-solid fa-chevron-right me-2 text-muted small"></i>TT Học Liệu ĐH Thủ Dầu Một
              </a>
              <a href="http://doanvien.congdoan.vn/VTBWebProject" target="_blank" rel="noreferrer" className="list-group-item list-group-item-action py-2">
                <i className="fa-solid fa-chevron-right me-2 text-muted small"></i>QL Đoàn Viên Toàn Quốc
              </a>
            </div>
          </div>

          {/* Thống Kê Truy Cập Widget */}
          <div className="panel-tdmu">
            <div className="panel-heading-tdmu">
              <i className="fa-solid fa-chart-simple me-2 text-warning"></i>Thống kê truy cập
            </div>
            <div className="p-3" style={{ fontSize: '13.5px' }}>
              <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                <span><i className="fa-solid fa-users text-primary me-2"></i>Đang trực tuyến:</span>
                <strong className="text-primary">{stats.online.toLocaleString('vi-VN')}</strong>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <span><i className="fa-solid fa-eye text-success me-2"></i>Tổng lượt xem:</span>
                <strong className="text-success">{stats.totalViews.toLocaleString('vi-VN')}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GioiThieu;
