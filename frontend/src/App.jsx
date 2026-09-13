import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import BookmarksDrawer from './components/BookmarksDrawer';
import Home from './pages/Home';
import GioiThieu from './pages/GioiThieu';
import CoCauToChuc from './pages/CoCauToChuc';
import TinTuc from './pages/TinTuc';
import PhucLoiDoanVien from './pages/PhucLoiDoanVien';
import VanBan from './pages/VanBan';
import BieuMau from './pages/BieuMau';
import LienHe from './pages/LienHe';
import BaiViet from './pages/BaiViet';

export const BookmarkContext = createContext();

export const useBookmarks = () => useContext(BookmarkContext);

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="container my-5 py-5 text-center">
          <div className="alert alert-warning p-4 shadow-sm mx-auto" style={{ maxWidth: '600px', borderRadius: '12px' }}>
            <i className="fa-solid fa-triangle-exclamation fa-3x text-warning mb-3"></i>
            <h4 className="fw-bold text-dark">Đã có lỗi xảy ra khi tải nội dung</h4>
            <p className="text-muted small mb-3">Hệ thống đã tự động ghi nhận nhật ký lỗi. Vui lòng bấm làm mới hoặc quay lại trang chủ.</p>
            <div className="d-flex justify-content-center gap-2">
              <button className="btn btn-primary" onClick={() => window.location.reload()}>
                <i className="fa-solid fa-rotate-right me-1"></i> Làm mới trang
              </button>
              <a href="/" className="btn btn-outline-secondary">
                <i className="fa-solid fa-house me-1"></i> Về trang chủ
              </a>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const LinkInterceptor = ({ children }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleLinkClick = (e) => {
      const a = e.target.closest('a');
      if (a && a.href) {
        const url = new URL(a.href);
        if (url.origin === window.location.origin) {
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

    document.addEventListener('click', handleLinkClick);
    return () => document.removeEventListener('click', handleLinkClick);
  }, [navigate]);

  return <>{children}</>;
};

function AppContent() {
  const [isBookmarksOpen, setIsBookmarksOpen] = useState(false);
  const [bookmarks, setBookmarks] = useState([]);

  // Load bookmarks from localStorage on initial render
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('tdmu_read_later') || '[]');
      setBookmarks(saved);
    } catch (e) {
      setBookmarks([]);
    }
  }, []);

  const saveBookmarksToStorage = (newList) => {
    setBookmarks(newList);
    try {
      localStorage.setItem('tdmu_read_later', JSON.stringify(newList));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  };

  const toggleBookmark = (article) => {
    if (!article) return false;
    const articleId = parseInt(article.id || article.article_id);
    const exists = bookmarks.some(b => (b.id == articleId || b.article_id == articleId));

    if (exists) {
      const updated = bookmarks.filter(b => (b.id != articleId && b.article_id != articleId));
      saveBookmarksToStorage(updated);
      return false;
    } else {
      const item = {
        id: articleId,
        article_id: articleId,
        title: article.title || article.tieu_de || 'Bài viết Công đoàn',
        thumbnail: article.image || article.thumbnail || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600',
        date: article.createdAt || article.date || new Date().toISOString()
      };
      const updated = [item, ...bookmarks];
      saveBookmarksToStorage(updated);
      return true;
    }
  };

  const removeBookmark = (articleId) => {
    const updated = bookmarks.filter(b => (b.id != articleId && b.article_id != articleId));
    saveBookmarksToStorage(updated);
  };

  const isBookmarked = (articleId) => {
    if (!articleId) return false;
    return bookmarks.some(b => (b.id == articleId || b.article_id == articleId));
  };

  return (
    <BookmarkContext.Provider value={{ bookmarks, toggleBookmark, removeBookmark, isBookmarked }}>
      <LinkInterceptor>
        <div className="main-content-wrapper">
          <Navbar
            onOpenBookmarks={() => setIsBookmarksOpen(true)}
            bookmarkCount={bookmarks.length}
          />

          <ErrorBoundary>
            <Routes>
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

              {/* Aliases without hyphens */}
              <Route path="/gioithieu" element={<GioiThieu />} />
              <Route path="/cocautochuc" element={<CoCauToChuc />} />
              <Route path="/tintuc" element={<TinTuc />} />
              <Route path="/phucloi" element={<PhucLoiDoanVien />} />
              <Route path="/vanban" element={<VanBan />} />
              <Route path="/bieumau" element={<BieuMau />} />
              <Route path="/lienhe" element={<LienHe />} />
              <Route path="/baiviet" element={<BaiViet />} />

              <Route path="*" element={<Home />} />
            </Routes>
          </ErrorBoundary>
        </div>

        <Footer />

        <BookmarksDrawer
          isOpen={isBookmarksOpen}
          onClose={() => setIsBookmarksOpen(false)}
          bookmarks={bookmarks}
          onRemoveBookmark={removeBookmark}
        />
      </LinkInterceptor>
    </BookmarkContext.Provider>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
