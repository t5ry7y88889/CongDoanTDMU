import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <>
      <header className="top-brand-header">
        <div className="container d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-3">
            <Link to="/" className="d-flex align-items-center text-decoration-none">
              <img src="/images/logo_cong_doan.png" alt="Logo Công Đoàn TDMU" style={{ height: '58px', width: 'auto', objectFit: 'contain' }} />
            </Link>
            <div>
              <h1 className="brand-title-main">CÔNG ĐOÀN TRƯỜNG ĐẠI HỌC THỦ DẦU MỘT</h1>
              <span className="brand-sub-main">THU DAU MOT UNIVERSITY TRADE UNION</span>
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="badge-hotline">
              <i className="fa-solid fa-phone me-1 text-warning"></i> Hotline: (0274) 3.815.184
            </span>
            <a href="/admin.html" className="btn-portal-access">
              <i className="fa-solid fa-sliders me-1 text-warning"></i> Quản lý website truyền thông công đoàn TDMU
            </a>
          </div>
        </div>
      </header>

      <nav className="navbar navbar-expand-lg navbar-tdmu sticky-top">
        <div className="container">
          <button className="navbar-toggler text-white" type="button" data-bs-toggle="collapse" data-bs-target="#tdmuNavbar">
            <i className="fa-solid fa-bars"></i>
          </button>
          <div className="collapse navbar-collapse" id="tdmuNavbar">
            <ul className="navbar-nav mx-auto">
              <li className="nav-item"><Link className="nav-link active" to="/">Trang Chủ</Link></li>
              <li className="nav-item"><a className="nav-link" href="/gioi-thieu.html">Giới Thiệu</a></li>
              
              <li className="nav-item dropdown">
                <a className="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">
                  Cơ Cấu Tổ Chức
                </a>
                <ul className="dropdown-menu">
                  <li><a className="dropdown-item" href="/co-cau-to-chuc.html?tab=ban-thuong-vu"><i className="fa-solid fa-caret-right me-1 text-primary"></i> Ban thường vụ</a></li>
                  <li><a className="dropdown-item" href="/co-cau-to-chuc.html?tab=ban-chap-hanh"><i className="fa-solid fa-caret-right me-1 text-primary"></i> Ban chấp hành</a></li>
                  <li><a className="dropdown-item" href="/co-cau-to-chuc.html?tab=uy-ban-kiem-tra"><i className="fa-solid fa-caret-right me-1 text-primary"></i> Ủy ban kiểm tra</a></li>
                  <li><a className="dropdown-item" href="/co-cau-to-chuc.html?tab=16-to-cong-doan"><i className="fa-solid fa-caret-right me-1 text-primary"></i> 16 Tổ công đoàn cơ sở</a></li>
                </ul>
              </li>

              <li className="nav-item"><a className="nav-link" href="/tin-tuc.html">Tin Tức</a></li>
              <li className="nav-item"><a className="nav-link" href="/phuc-loi-doan-vien.html">Phúc Lợi Đoàn Viên</a></li>

              <li className="nav-item dropdown">
                <a className="nav-link dropdown-toggle" href="/van-ban.html" data-bs-toggle="dropdown">
                  Văn Bản
                </a>
                <ul className="dropdown-menu">
                  <li><a className="dropdown-item" href="/van-ban.html#tuyen-truyen"><i className="fa-solid fa-caret-right me-1 text-primary"></i> Công văn tuyên truyền</a></li>
                  <li><a className="dropdown-item" href="/van-ban.html#ke-hoach"><i className="fa-solid fa-caret-right me-1 text-primary"></i> Kế hoạch hoạt động</a></li>
                  <li><a className="dropdown-item" href="/van-ban.html#luat"><i className="fa-solid fa-caret-right me-1 text-primary"></i> Văn bản luật</a></li>
                  <li><a className="dropdown-item" href="/van-ban.html#quyet-dinh"><i className="fa-solid fa-caret-right me-1 text-primary"></i> Quyết định</a></li>
                </ul>
              </li>

              <li className="nav-item"><a className="nav-link" href="/bieu-mau.html">Biểu Mẫu</a></li>
              <li className="nav-item"><a className="nav-link" href="/lien-he.html">Liên Hệ</a></li>
            </ul>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Header;
