import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Header = () => {
  const { pathname } = useLocation();
  const isExact = (path) => (path === '/' ? pathname === '/' : pathname.startsWith(path));
  const isTinTuc = pathname.startsWith('/tin-tuc') || pathname.startsWith('/bai-viet');

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
            <button className="btn-portal-access" type="button" data-bs-toggle="offcanvas" data-bs-target="#bookmarksOffcanvas" title="Tủ sách đọc sau">
              <i className="fa-solid fa-bookmark me-1 text-warning"></i> Tủ sách đọc sau
            </button>
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
              <li className="nav-item"><Link className={`nav-link${pathname === '/' ? ' active' : ''}`} to="/">Trang Chủ</Link></li>
              <li className="nav-item"><Link className={`nav-link${isExact('/gioi-thieu') ? ' active' : ''}`} to="/gioi-thieu">Giới Thiệu</Link></li>

              <li className="nav-item dropdown">
                <a className={`nav-link dropdown-toggle${isExact('/co-cau-to-chuc') ? ' active' : ''}`} href="/co-cau-to-chuc" data-bs-toggle="dropdown">
                  Cơ Cấu Tổ Chức
                </a>
                <ul className="dropdown-menu">
                  <li><Link className="dropdown-item" to="/co-cau-to-chuc?tab=ban-thuong-vu"><i className="fa-solid fa-caret-right me-1 text-primary"></i> Ban thường vụ</Link></li>
                  <li><Link className="dropdown-item" to="/co-cau-to-chuc?tab=ban-chap-hanh"><i className="fa-solid fa-caret-right me-1 text-primary"></i> Ban chấp hành</Link></li>
                  <li><Link className="dropdown-item" to="/co-cau-to-chuc?tab=uy-ban-kiem-tra"><i className="fa-solid fa-caret-right me-1 text-primary"></i> Ủy ban kiểm tra</Link></li>
                  <li><Link className="dropdown-item" to="/co-cau-to-chuc?tab=16-to-cong-doan"><i className="fa-solid fa-caret-right me-1 text-primary"></i> 16 Tổ công đoàn cơ sở</Link></li>
                </ul>
              </li>

              <li className="nav-item"><Link className={`nav-link${isTinTuc ? ' active' : ''}`} to="/tin-tuc">Tin Tức</Link></li>
              <li className="nav-item"><Link className={`nav-link${isExact('/phuc-loi-doan-vien') ? ' active' : ''}`} to="/phuc-loi-doan-vien">Phúc Lợi Đoàn Viên</Link></li>

              <li className="nav-item dropdown">
                <a className={`nav-link dropdown-toggle${isExact('/van-ban') ? ' active' : ''}`} href="/van-ban" data-bs-toggle="dropdown">
                  Văn Bản
                </a>
                <ul className="dropdown-menu">
                  <li><Link className="dropdown-item" to="/van-ban#tuyen-truyen"><i className="fa-solid fa-caret-right me-1 text-primary"></i> Công văn tuyên truyền</Link></li>
                  <li><Link className="dropdown-item" to="/van-ban#ke-hoach"><i className="fa-solid fa-caret-right me-1 text-primary"></i> Kế hoạch hoạt động</Link></li>
                  <li><Link className="dropdown-item" to="/van-ban#luat"><i className="fa-solid fa-caret-right me-1 text-primary"></i> Văn bản luật</Link></li>
                  <li><Link className="dropdown-item" to="/van-ban#quyet-dinh"><i className="fa-solid fa-caret-right me-1 text-primary"></i> Quyết định</Link></li>
                </ul>
              </li>

              <li className="nav-item"><Link className={`nav-link${isExact('/bieu-mau') ? ' active' : ''}`} to="/bieu-mau">Biểu Mẫu</Link></li>
              <li className="nav-item"><Link className={`nav-link${isExact('/lien-he') ? ' active' : ''}`} to="/lien-he">Liên Hệ</Link></li>
            </ul>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Header;