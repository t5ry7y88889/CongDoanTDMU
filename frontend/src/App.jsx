import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import BookmarksDrawer from './components/BookmarksDrawer';
import { syncBookmarks } from './lib/bookmarks';
import Home from './pages/Home';
import GioiThieu from './pages/GioiThieu';
import CoCauToChuc from './pages/CoCauToChuc';
import TinTuc from './pages/TinTuc';
import PhucLoiDoanVien from './pages/PhucLoiDoanVien';
import VanBan from './pages/VanBan';
import BieuMau from './pages/BieuMau';
import LienHe from './pages/LienHe';
import BaiViet from './pages/BaiViet';

const HtmlRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    if (path.endsWith('.html') && path !== '/admin.html' && path !== '/bao-cao-thang.html') {
      const route = path.replace(/\.html$/, '');
      navigate(route + location.search + location.hash, { replace: true });
    }
  }, [location, navigate]);

  return null;
};

const LinkInterceptor = ({ children }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleClick = (e) => {
      const a = e.target.closest('a');
      if (a && a.href) {
        const url = new URL(a.href);
        if (url.origin === window.location.origin) {
          if (url.pathname.endsWith('.html') && url.pathname !== '/admin.html' && url.pathname !== '/bao-cao-thang.html') {
            e.preventDefault();
            const route = url.pathname.replace('.html', '');
            navigate(route + url.search + url.hash);
          }
        }
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [navigate]);

  return <>{children}</>;
};

function App() {
  useEffect(() => {
    syncBookmarks();
  }, []);

  return (
    <BrowserRouter>
      <LinkInterceptor>
        <div className="main-content-wrapper">
          <Header />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/gioi-thieu" element={<GioiThieu />} />
            <Route path="/co-cau-to-chuc" element={<CoCauToChuc />} />
            <Route path="/tin-tuc" element={<TinTuc />} />
            <Route path="/phuc-loi-doan-vien" element={<PhucLoiDoanVien />} />
            <Route path="/van-ban" element={<VanBan />} />
            <Route path="/bieu-mau" element={<BieuMau />} />
            <Route path="/lien-he" element={<LienHe />} />
            <Route path="/bai-viet" element={<BaiViet />} />
            <Route path="*" element={<HtmlRedirect />} />
          </Routes>
        </div>
        <Footer />
      </LinkInterceptor>
      <BookmarksDrawer />
    </BrowserRouter>
  );
}

export default App;