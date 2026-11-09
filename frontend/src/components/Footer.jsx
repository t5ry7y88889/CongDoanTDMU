import React, { useState, useEffect } from 'react';

const Footer = () => {
  const [settings, setSettings] = useState({
    brandTitle: 'CÔNG ĐOÀN CƠ SỞ TRƯỜNG ĐẠI HỌC THỦ DẦU MỘT',
    address: 'Lầu 1, Dãy A, Cổng 1, Số 06 Trần Văn Ơn, P. Phú Lợi, TP. Thủ Dầu Một, Bình Dương',
    hotline: '(0274) 3.815.184',
    email: 'congdoan@tdmu.edu.vn',
    websiteUrl: 'congdoan.tdmu.edu.vn'
  });

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data) {
          setSettings(prev => ({ ...prev, ...res.data }));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <footer>
      <div className="container">
        <div className="row gy-3">
          <div className="col-md-7 text-start">
            <h6 className="fw-bold text-white mb-2">{settings.brandTitle}</h6>
            <p className="mb-1">
              <i className="fa-solid fa-location-dot me-2 text-warning"></i> 
              Địa chỉ: {settings.address}
            </p>
            <p className="mb-1">
              <i className="fa-solid fa-phone me-2 text-warning"></i> 
              Điện thoại: {settings.hotline} | 
              <i className="fa-solid fa-envelope ms-2 me-1 text-warning"></i> 
              Email: {settings.email}
            </p>
            <p className="mb-0">
              <i className="fa-solid fa-globe me-2 text-warning"></i> 
              Website: {settings.websiteUrl}
            </p>
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
