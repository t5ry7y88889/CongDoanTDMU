import React from 'react';

const PortalLinks = () => (
  <div className="panel-tdmu">
    <div className="panel-heading-tdmu"><i className="fa-solid fa-link me-2 text-primary"></i>Liên kết website</div>
    <div className="list-group-tdmu">
      <a href="https://tdmu.edu.vn/" target="_blank" rel="noreferrer" className="list-group-item"><i className="fa-solid fa-chevron-right me-1 text-muted small"></i> Đại học Thủ Dầu Một</a>
      <a href="https://danguy.tdmu.edu.vn/" target="_blank" rel="noreferrer" className="list-group-item"><i className="fa-solid fa-chevron-right me-1 text-muted small"></i> Đảng Bộ Đại học TDMU</a>
      <a href="https://www.congdoan.vn" target="_blank" rel="noreferrer" className="list-group-item"><i className="fa-solid fa-chevron-right me-1 text-muted small"></i> Tổng LĐLĐ Việt Nam</a>
      <a href="https://congdoanbinhduong.org.vn/" target="_blank" rel="noreferrer" className="list-group-item"><i className="fa-solid fa-chevron-right me-1 text-muted small"></i> LĐLĐ Tỉnh Bình Dương</a>
      <a href="https://lib.tdmu.edu.vn/" target="_blank" rel="noreferrer" className="list-group-item"><i className="fa-solid fa-chevron-right me-1 text-muted small"></i> TT Học Liệu ĐH TDMU</a>
      <a href="https://doanvien.congdoan.vn/VTBWebProject" target="_blank" rel="noreferrer" className="list-group-item"><i className="fa-solid fa-chevron-right me-1 text-muted small"></i> Phần mềm quản lý đoàn viên</a>
    </div>
  </div>
);

const PortalStats = () => (
  <div className="panel-tdmu">
    <div className="panel-heading-tdmu"><i className="fa-solid fa-chart-simple me-2 text-warning"></i>Thống kê truy cập</div>
    <div className="p-3" style={{ fontSize: '13px' }}>
      <p className="mb-2"><i className="fa-solid fa-users text-primary me-2"></i> Đang trực tuyến: <strong>12</strong></p>
      <p className="mb-0"><i className="fa-solid fa-eye text-success me-2"></i> Tổng lượt xem: <strong>811,221</strong></p>
    </div>
  </div>
);

const Sidebar = ({ children }) => (
  <div className="col-lg-3">
    <PortalLinks />
    <PortalStats />
    {children}
  </div>
);

export default Sidebar;