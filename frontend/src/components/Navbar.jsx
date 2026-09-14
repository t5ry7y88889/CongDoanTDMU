import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = ({ onOpenBookmarks, bookmarkCount = 0 }) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
  const [docDropdownOpen, setDocDropdownOpen] = useState(false);

  const orgDropdownRef = useRef(null);
  const docDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (orgDropdownRef.current && !orgDropdownRef.current.contains(e.target)) {
        setOrgDropdownOpen(false);
      }
      if (docDropdownRef.current && !docDropdownRef.current.contains(e.target)) {
        setDocDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setOrgDropdownOpen(false);
    setDocDropdownOpen(false);
  }, [location.pathname]);

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <>
      <header className="top-brand-header">
        <div className="container d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-3">
            <Link to="/" className="d-flex align-items-center text-decoration-none">
              <img
                src="/images/logo_cong_doan.png"
                alt="Logo Công Đoàn TDMU"
                style={{ height: '58px', width: 'auto', objectFit: 'contain' }}
              />
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
            <a href="/admin" className="btn-portal-access">
              <i className="fa-solid fa-sliders me-1 text-warning"></i> Quản lý website truyền thông công đoàn TDMU
            </a>
          </div>
        </div>
      </header>

      <nav className="navbar navbar-expand-lg navbar-tdmu sticky-top">
        <div className="container">
          <button
            className="navbar-toggler text-white"
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation"
          >
            <i className="fa-solid fa-bars"></i>
          </button>

          <div className={`collapse navbar-collapse ${mobileMenuOpen ? 'show' : ''}`} id="tdmuNavbar">
            <ul className="navbar-nav mx-auto">
              <li className="nav-item">
                <Link className={`nav-link ${isActive('/') ? 'active' : ''}`} to="/">
                  Trang Chủ
                </Link>
              </li>
              <li className="nav-item">
                <Link className={`nav-link ${isActive('/gioi-thieu') ? 'active' : ''}`} to="/gioi-thieu">
                  Giới Thiệu
                </Link>
              </li>

              <li className="nav-item dropdown position-relative" ref={orgDropdownRef}>
                <a
                  className={`nav-link dropdown-toggle ${isActive('/co-cau-to-chuc') ? 'active' : ''}`}
                  href="#org"
                  onClick={(e) => {
                    e.preventDefault();
                    setOrgDropdownOpen(!orgDropdownOpen);
                    setDocDropdownOpen(false);
                  }}
                  role="button"
                >
                  Cơ Cấu Tổ Chức
                </a>
                <ul className={`dropdown-menu ${orgDropdownOpen ? 'show' : ''}`}>
                  <li>
                    <Link className="dropdown-item" to="/co-cau-to-chuc?tab=ban-thuong-vu" onClick={() => setOrgDropdownOpen(false)}>
                      <i className="fa-solid fa-caret-right me-1 text-primary"></i> Ban thường vụ
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" to="/co-cau-to-chuc?tab=ban-chap-hanh" onClick={() => setOrgDropdownOpen(false)}>
                      <i className="fa-solid fa-caret-right me-1 text-primary"></i> Ban chấp hành
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" to="/co-cau-to-chuc?tab=uy-ban-kiem-tra" onClick={() => setOrgDropdownOpen(false)}>
                      <i className="fa-solid fa-caret-right me-1 text-primary"></i> Ủy ban kiểm tra
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" to="/co-cau-to-chuc?tab=16-to-cong-doan" onClick={() => setOrgDropdownOpen(false)}>
                      <i className="fa-solid fa-caret-right me-1 text-primary"></i> 16 Tổ công đoàn cơ sở
                    </Link>
                  </li>
                </ul>
              </li>

              <li className="nav-item">
                <Link className={`nav-link ${isActive('/tin-tuc') ? 'active' : ''}`} to="/tin-tuc">
                  Tin Tức
                </Link>
              </li>
              <li className="nav-item">
                <Link className={`nav-link ${isActive('/phuc-loi-doan-vien') ? 'active' : ''}`} to="/phuc-loi-doan-vien">
                  Phúc Lợi Đoàn Viên
                </Link>
              </li>

              <li className="nav-item dropdown position-relative" ref={docDropdownRef}>
                <Link
                  className={`nav-link dropdown-toggle ${isActive('/van-ban') ? 'active' : ''}`}
                  to="/van-ban"
                  onClick={() => {
                    setDocDropdownOpen(!docDropdownOpen);
                    setOrgDropdownOpen(false);
                  }}
                  role="button"
                >
                  Văn Bản
                </Link>
                <ul className={`dropdown-menu ${docDropdownOpen ? 'show' : ''}`}>
                  <li>
                    <Link className="dropdown-item" to="/van-ban#tuyen-truyen" onClick={() => setDocDropdownOpen(false)}>
                      <i className="fa-solid fa-caret-right me-1 text-primary"></i> Công văn tuyên truyền
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" to="/van-ban#ke-hoach" onClick={() => setDocDropdownOpen(false)}>
                      <i className="fa-solid fa-caret-right me-1 text-primary"></i> Kế hoạch hoạt động
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" to="/van-ban#luat" onClick={() => setDocDropdownOpen(false)}>
                      <i className="fa-solid fa-caret-right me-1 text-primary"></i> Văn bản luật
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" to="/van-ban#quyet-dinh" onClick={() => setDocDropdownOpen(false)}>
                      <i className="fa-solid fa-caret-right me-1 text-primary"></i> Quyết định
                    </Link>
                  </li>
                </ul>
              </li>

              <li className="nav-item">
                <Link className={`nav-link ${isActive('/bieu-mau') ? 'active' : ''}`} to="/bieu-mau">
                  Biểu Mẫu
                </Link>
              </li>
              <li className="nav-item">
                <Link className={`nav-link ${isActive('/lien-he') ? 'active' : ''}`} to="/lien-he">
                  Liên Hệ
                </Link>
              </li>
            </ul>

            {onOpenBookmarks && (
              <button
                type="button"
                className="btn-bookmark-header ms-lg-2 my-2 my-lg-0"
                onClick={onOpenBookmarks}
                title="Mở Tủ Sách Đọc Sau"
              >
                <i className="fa-solid fa-bookmark"></i>
                <span className="d-lg-none d-xl-inline">Đọc sau</span>
                <span className="badge-count-pill">{bookmarkCount}</span>
              </button>
            )}
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;