import React from 'react';

const Footer = () => {
  return (
    <footer>
      <div className="container">
        <div className="row gy-3">
          <div className="col-md-7 text-start">
            <h6 className="fw-bold text-white mb-2">CÔNG ĐOÀN CƠ SỞ TRƯỜNG ĐẠI HỌC THỦ DẦU MỘT</h6>
            <p className="mb-1"><i className="fa-solid fa-location-dot me-2 text-warning"></i> Địa chỉ: Lầu 1, Dãy A, Cổng 1, Số 06 Trần Văn Ơn, P. Phú Lợi, TP. Thủ Dầu Một, Bình Dương</p>
            <p className="mb-1"><i className="fa-solid fa-phone me-2 text-warning"></i> Điện thoại: (0274) 3.815.184 | <i className="fa-solid fa-envelope ms-2 me-1 text-warning"></i> Email: congdoan@tdmu.edu.vn</p>
            <p className="mb-0"><i className="fa-solid fa-globe me-2 text-warning"></i> Website: congdoan.tdmu.edu.vn</p>
          </div>
          <div className="col-md-5 text-md-end text-start">
            <h6 className="fw-bold text-warning mb-2">HỆ THỐNG TRUYỀN THÔNG ĐA KÊNH</h6>
            <p className="mb-1">Đề tài NCKH Sinh viên / Đồ án Cơ sở ngành - Viện Công nghệ số</p>
            <p className="mb-0 text-light text-opacity-75">Nhóm 2: Nguyễn Bình Dương - Trần Hồng Thanh - Phạm Anh Tuấn</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
