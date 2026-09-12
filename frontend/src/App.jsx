import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import GioiThieu from './pages/GioiThieu';
import CoCauToChuc from './pages/CoCauToChuc';
import TinTuc from './pages/TinTuc';
import PhucLoiDoanVien from './pages/PhucLoiDoanVien';
import VanBan from './pages/VanBan';
import BieuMau from './pages/BieuMau';
import LienHe from './pages/LienHe';
import BaiViet from './pages/BaiViet';

const LinkInterceptor = ({ children }) => {
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Link click interception for seamless SPA navigation
    const handleLinkClick = (e) => {
      const a = e.target.closest('a');
      if (a && a.href) {
        const url = new URL(a.href);
        if (url.origin === window.location.origin) {
          // Keep admin and external links native
          if (url.pathname === '/admin.html' || url.pathname === '/admin' || url.pathname === '/bao-cao-thang.html') {
            return;
          }
          if (url.pathname.endsWith('.html')) {
            e.preventDefault();
            let route = url.pathname.replace('.html', '');
            if (route === '/index') route = '/';
            navigate(route + url.search + url.hash);
          }
        }
      }
    };

    // 2. Global Bootstrap Event Delegation for React DOM
    const handleBootstrapEvents = (e) => {
      if (typeof window === 'undefined' || !window.bootstrap) return;

      // Dropdown toggle
      const dropdownToggle = e.target.closest('[data-bs-toggle="dropdown"]');
      if (dropdownToggle) {
        e.preventDefault();
        const instance = window.bootstrap.Dropdown.getOrCreateInstance(dropdownToggle);
        instance.toggle();
        return;
      }

      // Close dropdowns if click is outside any open dropdown
      if (!e.target.closest('.dropdown')) {
        document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
          menu.classList.remove('show');
          const toggle = menu.closest('.dropdown')?.querySelector('[data-bs-toggle="dropdown"]');
          if (toggle) {
            toggle.classList.remove('show');
            toggle.setAttribute('aria-expanded', 'false');
          }
        });
      }

      // Navbar Collapse toggle (Mobile view)
      const collapseToggle = e.target.closest('[data-bs-toggle="collapse"]');
      if (collapseToggle) {
        const targetSelector = collapseToggle.getAttribute('data-bs-target');
        if (targetSelector) {
          const targetEl = document.querySelector(targetSelector);
          if (targetEl) {
            e.preventDefault();
            const collapse = window.bootstrap.Collapse.getOrCreateInstance(targetEl);
            collapse.toggle();
          }
        }
      }
    };

    document.addEventListener('click', handleLinkClick);
    document.addEventListener('click', handleBootstrapEvents);

    return () => {
      document.removeEventListener('click', handleLinkClick);
      document.removeEventListener('click', handleBootstrapEvents);
    };
  }, [navigate]);

  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <LinkInterceptor>
        <div className="main-content-wrapper">
          <Header />
          <Routes>
            {/* Standard Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/index" element={<Home />} />
            <Route path="/gioi-thieu" element={<GioiThieu />} />
            <Route path="/co-cau-to-chuc" element={<CoCauToChuc />} />
            <Route path="/tin-tuc" element={<TinTuc />} />
            <Route path="/phuc-loi-doan-vien" element={<PhucLoiDoanVien />} />
            <Route path="/van-ban" element={<VanBan />} />
            <Route path="/bieu-mau" element={<BieuMau />} />
            <Route path="/lien-he" element={<LienHe />} />
            <Route path="/bai-viet" element={<BaiViet />} />

            {/* Path aliases without hyphens */}
            <Route path="/gioithieu" element={<GioiThieu />} />
            <Route path="/cocautochuc" element={<CoCauToChuc />} />
            <Route path="/tintuc" element={<TinTuc />} />
            <Route path="/phucloi" element={<PhucLoiDoanVien />} />
            <Route path="/vanban" element={<VanBan />} />
            <Route path="/bieumau" element={<BieuMau />} />
            <Route path="/lienhe" element={<LienHe />} />
            <Route path="/baiviet" element={<BaiViet />} />

            {/* Fallback */}
            <Route path="*" element={<Home />} />
          </Routes>
        </div>
        <Footer />
      </LinkInterceptor>
    </BrowserRouter>
  );
}

export default App;
