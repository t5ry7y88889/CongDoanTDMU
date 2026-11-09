import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const Navbar = ({ onOpenBookmarks, bookmarkCount = 0 }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
  const [docDropdownOpen, setDocDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const orgDropdownRef = useRef(null);
  const docDropdownRef = useRef(null);
  const userDropdownRef = useRef(null);

  const [settings, setSettings] = useState({
    brandTitle: 'CÔNG ĐOÀN TRƯỜNG ĐẠI HỌC THỦ DẦU MỘT',
    brandSub: 'THU DAU MOT UNIVERSITY TRADE UNION',
    hotline: '(0274) 3.815.184'
  });

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('tdmu_user') || 'null');
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    const syncUser = () => {
      try {
        const u = JSON.parse(localStorage.getItem('tdmu_user') || 'null');
        setCurrentUser(u);
      } catch (e) {
        setCurrentUser(null);
      }
    };

    window.addEventListener('tdmu_auth_change', syncUser);
    window.addEventListener('storage', syncUser);
    return () => {
      window.removeEventListener('tdmu_auth_change', syncUser);
      window.removeEventListener('storage', syncUser);
    };
  }, []);

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

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (orgDropdownRef.current && !orgDropdownRef.current.contains(e.target)) {
        setOrgDropdownOpen(false);
      }
      if (docDropdownRef.current && !docDropdownRef.current.contains(e.target)) {
        setDocDropdownOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setOrgDropdownOpen(false);
    setDocDropdownOpen(false);
    setUserDropdownOpen(false);
  }, [location.pathname]);

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const handleLogout = () => {
    if (window.confirm('Bạn có chắc chắn muốn đăng xuất tài khoản?')) {
      localStorage.removeItem('tdmu_token');
      localStorage.removeItem('tdmu_user');
      localStorage.removeItem('tdmu_user_id');
      localStorage.removeItem('tdmu_user_name');
      setCurrentUser(null);
      window.dispatchEvent(new Event('tdmu_auth_change'));
      navigate('/', { replace: true });
    }
  };

  const role = (currentUser?.role || '').toLowerCase();
  const isCadre = (role === 'admin' || role === 'editor' || role === 'contributor');
  const roleTitle = role === 'admin' ? 'Quản Trị Viên' : (role === 'editor' ? 'Biên Tập Viên' : (role === 'contributor' ? 'Cộng Tác Viên' : 'Đoàn Viên'));

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
              <h1 className="brand-title-main">{settings.brandTitle}</h1>
              <span className="brand-sub-main">{settings.brandSub}</span>
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="badge-hotline d-none d-md-inline-flex">
              <i className="fa-solid fa-phone me-1 text-warning"></i> Hotline: {settings.hotline}
            </span>
            <a href="/admin.html" className="btn-portal-access" title="Truy cập Bảng điều hành Quản trị Công đoàn TDMU">
              <i className="fa-solid fa-sliders me-1 text-warning"></i> Quản lý website truyền thông công đoàn TDMU
            </a>
          </div>
        </div>
      </header>

      <nav className="navbar navbar-expand-lg navbar-tdmu sticky-top">
        <div className="container">
          <button
            className="navbar-toggler text-white border-light"
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation"
          >
            <i className="fa-solid fa-bars"></i>
          </button>

          <div className={`collapse navbar-collapse ${mobileMenuOpen ? 'show' : ''}`} id="tdmuNavbar">
            <ul className="navbar-nav mx-auto">
              <li className="nav-item">
                <Link className={`nav-link ${isActive('/') ? 'active fw-bold' : ''}`} to="/">
                  Trang Chủ
                </Link>
              </li>
              <li className="nav-item">
                <Link className={`nav-link ${isActive('/gioi-thieu') ? 'active fw-bold' : ''}`} to="/gioi-thieu">
                  Giới Thiệu
                </Link>
              </li>

              <li className="nav-item dropdown position-relative" ref={orgDropdownRef}>
                <a
                  className={`nav-link dropdown-toggle ${isActive('/co-cau-to-chuc') ? 'active fw-bold' : ''}`}
                  href="#org"
                  onClick={(e) => {
                    e.preventDefault();
                    setOrgDropdownOpen(!orgDropdownOpen);
                    setDocDropdownOpen(false);
                    setUserDropdownOpen(false);
                  }}
                  role="button"
                >
                  Cơ Cấu Tổ Chức
                </a>
                <ul className={`dropdown-menu shadow ${orgDropdownOpen ? 'show' : ''}`} style={{ borderTop: '3px solid #002855' }}>
                  <li>
                    <Link className="dropdown-item py-2" to="/co-cau-to-chuc?tab=ban-thuong-vu" onClick={() => setOrgDropdownOpen(false)}>
                      <i className="fa-solid fa-crown me-2 text-warning"></i> Ban thường vụ
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item py-2" to="/co-cau-to-chuc?tab=ban-chap-hanh" onClick={() => setOrgDropdownOpen(false)}>
                      <i className="fa-solid fa-users me-2 text-primary"></i> Ban chấp hành
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item py-2" to="/co-cau-to-chuc?tab=uy-ban-kiem-tra" onClick={() => setOrgDropdownOpen(false)}>
                      <i className="fa-solid fa-scale-balanced me-2 text-success"></i> Ủy ban kiểm tra
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item py-2" to="/co-cau-to-chuc?tab=16-to-cong-doan" onClick={() => setOrgDropdownOpen(false)}>
                      <i className="fa-solid fa-sitemap me-2 text-danger"></i> 16 Tổ công đoàn cơ sở
                    </Link>
                  </li>
                </ul>
              </li>

              <li className="nav-item">
                <Link className={`nav-link ${isActive('/tin-tuc') ? 'active fw-bold' : ''}`} to="/tin-tuc">
                  Tin Tức
                </Link>
              </li>
              <li className="nav-item">
                <Link className={`nav-link ${isActive('/phuc-loi-doan-vien') ? 'active fw-bold' : ''}`} to="/phuc-loi-doan-vien">
                  Phúc Lợi Đoàn Viên
                </Link>
              </li>

              <li className="nav-item dropdown position-relative" ref={docDropdownRef}>
                <a
                  className={`nav-link dropdown-toggle ${isActive('/van-ban') ? 'active fw-bold' : ''}`}
                  href="#doc"
                  onClick={(e) => {
                    e.preventDefault();
                    setDocDropdownOpen(!docDropdownOpen);
                    setOrgDropdownOpen(false);
                    setUserDropdownOpen(false);
                  }}
                  role="button"
                >
                  Văn Bản
                </a>
                <ul className={`dropdown-menu shadow ${docDropdownOpen ? 'show' : ''}`} style={{ borderTop: '3px solid #002855' }}>
                  <li>
                    <Link className="dropdown-item py-2" to="/van-ban#tuyen-truyen" onClick={() => setDocDropdownOpen(false)}>
                      <i className="fa-solid fa-bullhorn me-2 text-primary"></i> Công văn tuyên truyền
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item py-2" to="/van-ban#ke-hoach" onClick={() => setDocDropdownOpen(false)}>
                      <i className="fa-solid fa-calendar-check me-2 text-primary"></i> Kế hoạch hoạt động
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item py-2" to="/van-ban#luat" onClick={() => setDocDropdownOpen(false)}>
                      <i className="fa-solid fa-book-journal-whills me-2 text-primary"></i> Văn bản luật
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item py-2" to="/van-ban#quyet-dinh" onClick={() => setDocDropdownOpen(false)}>
                      <i className="fa-solid fa-stamp me-2 text-primary"></i> Quyết định
                    </Link>
                  </li>
                </ul>
              </li>

              <li className="nav-item">
                <Link className={`nav-link ${isActive('/bieu-mau') ? 'active fw-bold' : ''}`} to="/bieu-mau">
                  Biểu Mẫu
                </Link>
              </li>
              <li className="nav-item">
                <Link className={`nav-link ${isActive('/lien-he') ? 'active fw-bold' : ''}`} to="/lien-he">
                  Liên Hệ
                </Link>
              </li>
            </ul>

            {/* Read Later Bookmark Badge */}
            {onOpenBookmarks && (
              <button
                type="button"
                className="btn btn-outline-warning btn-sm d-flex align-items-center gap-1 text-white border-warning ms-lg-2 my-2 my-lg-0"
                onClick={onOpenBookmarks}
                title="Mở Tủ Sách Đọc Sau"
              >
                <i className="fa-solid fa-bookmark text-warning"></i>
                <span className="d-lg-none d-xl-inline">Đọc sau</span>
                <span className="badge bg-warning text-dark rounded-pill px-2" style={{ fontSize: '11px' }}>
                  {bookmarkCount}
                </span>
              </button>
            )}

            {/* Auth User Menu or Login Button */}
            {currentUser ? (
              <div className="dropdown position-relative ms-lg-2 my-2 my-lg-0" ref={userDropdownRef}>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-light dropdown-toggle d-flex align-items-center gap-2 rounded-pill px-2 py-1"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  style={{ borderColor: 'rgba(255,255,255,0.4)' }}
                >
                  <img
                    src={currentUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200'}
                    alt="Avatar"
                    className="rounded-circle border border-white"
                    style={{ width: '28px', height: '28px', objectFit: 'cover' }}
                  />
                  <span className="d-none d-lg-inline small fw-semibold text-truncate" style={{ maxWidth: '130px', color: '#ffffff' }}>
                    {currentUser.ho_ten || currentUser.name || 'Đoàn viên'}
                  </span>
                </button>
                <ul className={`dropdown-menu dropdown-menu-end shadow border-0 py-1 ${userDropdownOpen ? 'show' : ''}`} style={{ minWidth: '220px', fontSize: '13.5px', borderRadius: '12px' }}>
                  <li className="px-3 py-2 bg-light border-bottom">
                    <div className="fw-bold text-dark text-truncate">{currentUser.ho_ten || currentUser.name}</div>
                    <span className="badge bg-primary text-white" style={{ fontSize: '10.5px' }}>{roleTitle}</span>
                  </li>
                  <li>
                    <Link className="dropdown-item py-2" to="/ho-so" onClick={() => setUserDropdownOpen(false)}>
                      <i className="fa-solid fa-id-card me-2 text-primary"></i> Hồ sơ cá nhân
                    </Link>
                  </li>
                  <li>
                    <button
                      type="button"
                      className="dropdown-item py-2"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        if (onOpenBookmarks) onOpenBookmarks();
                      }}
                    >
                      <i className="fa-solid fa-bookmark me-2 text-warning"></i> Tủ sách đọc sau
                    </button>
                  </li>
                  {isCadre && (
                    <li>
                      <a className="dropdown-item py-2" href="/admin.html">
                        <i className="fa-solid fa-sliders me-2 text-success"></i> Quản trị website & Studio AI
                      </a>
                    </li>
                  )}
                  <li><hr className="dropdown-divider my-1" /></li>
                  <li>
                    <button type="button" className="dropdown-item py-2 text-danger fw-semibold" onClick={handleLogout}>
                      <i className="fa-solid fa-arrow-right-from-bracket me-2"></i> Đăng xuất
                    </button>
                  </li>
                </ul>
              </div>
            ) : (
              <Link
                to="/dang-nhap"
                className="btn btn-warning btn-sm rounded-pill text-dark fw-bold px-3 ms-lg-2 my-2 my-lg-0 d-flex align-items-center gap-1 shadow-sm"
              >
                <i className="fa-solid fa-arrow-right-to-bracket"></i>
                <span>Đăng Nhập</span>
              </Link>
            )}

          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
