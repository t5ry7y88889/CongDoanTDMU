import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PaginationBar from '../components/PaginationBar';
import { useBookmarks } from '../App';

const TinTuc = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentCategory, setCurrentCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  const { bookmarks, toggleBookmark, isBookmarked } = useBookmarks();

  useEffect(() => {
    fetchArticles();
  }, []);

  // Reset page when category or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [currentCategory, searchQuery]);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/articles?status=published').then(r => r.json());
      if (res.success && Array.isArray(res.data)) {
        setArticles(res.data);
      }
    } catch (err) {
      console.error('Error fetching articles:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBookmarkToggle = (e, article) => {
    e.preventDefault();
    e.stopPropagation();
    toggleBookmark(article);
  };

  const strip = (str) =>
    (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLowerCase();

  const filteredArticles = articles.filter(a => {
    if (currentCategory === 'saved') {
      return isBookmarked(a.id);
    }
    const cat = a.categoryName || a.category || a.ChuyenMuc || '';
    const matchCat = currentCategory === 'all' || cat.toLowerCase().includes(currentCategory.toLowerCase());

    const q = strip(searchQuery.trim());
    const matchSearch = !q ||
      strip(a.title).includes(q) ||
      strip(a.summary).includes(q) ||
      strip(a.author || a.TacGia).includes(q);

    return matchCat && matchSearch;
  });

  const heroArticle = filteredArticles.length > 0 ? filteredArticles[0] : null;
  const allGridArticles = filteredArticles.length > 1 ? filteredArticles.slice(1) : (currentCategory !== 'all' ? filteredArticles : []);

  // Pagination slice for grid
  const startIndex = (currentPage - 1) * pageSize;
  const currentGridArticles = allGridArticles.slice(startIndex, startIndex + pageSize);

  return (
    <div className="container my-4">
      {/* Breadcrumb */}
      <div className="breadcrumb-box mb-3">
        <Link to="/">Trang chủ</Link> / <span className="text-muted">Tạp chí Tin tức &amp; Sự kiện</span>
      </div>

      {/* Bộ Lọc Chuyên Mục & Thanh Tìm Kiếm */}
      <div className="content-box mb-4 py-3">
        <div className="row g-3 align-items-center">
          <div className="col-lg-8">
            <div className="d-flex flex-wrap gap-2">
              <button
                className={`btn btn-sm ${currentCategory === 'all' ? 'btn-primary fw-bold' : 'btn-light border'}`}
                onClick={() => setCurrentCategory('all')}
              >
                <i className="fa-solid fa-newspaper me-1 text-primary"></i> Tất cả tin tức
              </button>
              <button
                className={`btn btn-sm ${currentCategory === 'Hoạt động công đoàn' ? 'btn-primary fw-bold' : 'btn-light border'}`}
                onClick={() => setCurrentCategory('Hoạt động công đoàn')}
              >
                <i className="fa-solid fa-users me-1 text-primary"></i> Hoạt động CĐ
              </button>
              <button
                className={`btn btn-sm ${currentCategory === 'Phong trào thi đua' ? 'btn-warning fw-bold text-dark' : 'btn-light border'}`}
                onClick={() => setCurrentCategory('Phong trào thi đua')}
              >
                <i className="fa-solid fa-trophy me-1 text-warning"></i> Phong trào thi đua
              </button>
              <button
                className={`btn btn-sm ${currentCategory === 'Chăm lo đời sống' ? 'btn-danger fw-bold' : 'btn-light border'}`}
                onClick={() => setCurrentCategory('Chăm lo đời sống')}
              >
                <i className="fa-solid fa-heart-pulse me-1 text-danger"></i> Chăm lo đời sống
              </button>
              <button
                className={`btn btn-sm ${currentCategory === 'Văn hóa - Thể thao' ? 'btn-success fw-bold' : 'btn-light border'}`}
                onClick={() => setCurrentCategory('Văn hóa - Thể thao')}
              >
                <i className="fa-solid fa-futbol me-1 text-success"></i> Văn hóa - Thể thao
              </button>
              <button
                className={`btn btn-sm ${currentCategory === 'saved' ? 'btn-danger fw-bold' : 'btn-light border'}`}
                onClick={() => setCurrentCategory('saved')}
              >
                <i className="fa-solid fa-bookmark me-1 text-danger"></i> Đã lưu ({bookmarks ? bookmarks.length : 0})
              </button>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0">
                <i className="fa-solid fa-magnifying-glass text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-0"
                placeholder="Tìm kiếm bài viết, tác giả..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* CỘT TRÁI: DANH SÁCH BÀI VIẾT */}
        <div className="col-lg-9">
          {loading ? (
            <div className="text-center py-5 text-muted">
              <i className="fa-solid fa-circle-notch fa-spin fa-2x text-primary mb-3"></i>
              <div>Đang tải bài viết từ CSDL SQL Server...</div>
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="text-center py-5 text-muted" style={{ background: '#F8FAFC', borderRadius: '10px' }}>
              <i className="fa-regular fa-newspaper fa-3x mb-3 text-secondary opacity-50"></i>
              <div className="fw-bold fs-5">Không tìm thấy bài viết nào!</div>
              <small>Thử chọn chuyên mục khác hoặc tìm kiếm với từ khóa khác.</small>
            </div>
          ) : (
            <>
              {/* BÀI VIẾT TIÊU ĐIỂM (CHỈ HIỂN THỊ Ở TRANG 1 VÀ KHI CÓ HERO) */}
              {heroArticle && currentPage === 1 && currentCategory === 'all' && !searchQuery && (
                <div className="card mb-4 border shadow-sm overflow-hidden" style={{ borderRadius: '12px' }}>
                  <div className="row g-0">
                    <div className="col-md-7 position-relative">
                      <img
                        src={heroArticle.image || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800'}
                        className="img-fluid h-100 w-100"
                        alt={heroArticle.title}
                        style={{ minHeight: '260px', objectFit: 'cover' }}
                      />
                      <span
                        className="badge position-absolute top-0 start-0 m-3 px-3 py-2"
                        style={{ background: '#002855', color: '#FEF08A', fontWeight: 'bold' }}
                      >
                        <i className="fa-solid fa-star me-1 text-warning"></i> TIÊU ĐIỂM
                      </span>
                    </div>
                    <div className="col-md-5 p-4 d-flex flex-column justify-content-between bg-white">
                      <div>
                        <div className="text-primary small fw-bold mb-2">
                          {heroArticle.categoryName || heroArticle.category || 'Hoạt động công đoàn'}
                        </div>
                        <h4 className="fw-bold" style={{ lineHeight: '1.4' }}>
                          <Link to={`/bai-viet?id=${heroArticle.id}`} className="text-decoration-none" style={{ color: '#002855' }}>
                            {heroArticle.title}
                          </Link>
                        </h4>
                        <p className="text-secondary small mt-2 mb-3" style={{ lineHeight: '1.5' }}>
                          {heroArticle.summary || ''}
                        </p>
                      </div>

                      <div>
                        <div className="d-flex justify-content-between align-items-center text-muted small mb-3 border-top pt-2">
                          <div>
                            <span className="me-2"><i className="fa-regular fa-calendar me-1 text-primary"></i> {heroArticle.createdAt ? String(heroArticle.createdAt).split('T')[0] : '2026-09-13'}</span>
                            <span><i className="fa-regular fa-eye text-success me-1"></i> {heroArticle.viewsCount || heroArticle.views || 350}</span>
                          </div>
                          <button
                            type="button"
                            className="btn btn-sm btn-link p-0 text-secondary"
                            onClick={(e) => handleBookmarkToggle(e, heroArticle)}
                            title="Lưu đọc sau"
                          >
                            <i className={`fa-${isBookmarked && isBookmarked(heroArticle.id) ? 'solid text-danger' : 'regular'} fa-bookmark fs-6`}></i>
                          </button>
                        </div>
                        <Link
                          to={`/bai-viet?id=${heroArticle.id}`}
                          className="btn btn-sm btn-primary w-100 fw-bold py-2"
                          style={{ background: '#002855', borderColor: '#002855' }}
                        >
                          <i className="fa-solid fa-book-open-reader me-2 text-warning"></i> ĐỌC TOÀN VĂN BÀI VIẾT
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* LƯỚI BÀI VIẾT TIẾP THEO */}
              <div className="row g-3">
                {currentGridArticles.map(a => (
                  <div className="col-md-6" key={a.id}>
                    <div className="card h-100 border shadow-sm" style={{ borderRadius: '10px', overflow: 'hidden' }}>
                      <div className="position-relative">
                        <img
                          src={a.image || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500'}
                          className="card-img-top"
                          alt={a.title}
                          style={{ height: '180px', objectFit: 'cover' }}
                        />
                        <span
                          className="badge position-absolute bottom-0 start-0 m-2"
                          style={{ background: 'rgba(0, 40, 85, 0.85)', color: '#FEF08A' }}
                        >
                          {a.categoryName || a.category || 'Tin tức'}
                        </span>
                      </div>
                      <div className="card-body d-flex flex-column justify-content-between">
                        <div>
                          <h6 className="card-title fw-bold" style={{ lineHeight: '1.45' }}>
                            <Link to={`/bai-viet?id=${a.id}`} className="text-decoration-none" style={{ color: '#002855' }}>
                              {a.title}
                            </Link>
                          </h6>
                          <p className="card-text text-secondary small" style={{ lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {a.summary || ''}
                          </p>
                        </div>

                        <div className="d-flex justify-content-between align-items-center text-muted small border-top pt-2 mt-3">
                          <div className="d-flex align-items-center gap-2">
                            <span><i className="fa-regular fa-calendar text-primary me-1"></i> {a.createdAt ? String(a.createdAt).split('T')[0] : '2026-09-13'}</span>
                            <span><i className="fa-regular fa-eye text-success me-1"></i> {a.viewsCount || a.views || 180}</span>
                          </div>
                          <button
                            type="button"
                            className="btn btn-sm btn-link p-0 text-secondary"
                            onClick={(e) => handleBookmarkToggle(e, a)}
                            title="Lưu đọc sau"
                          >
                            <i className={`fa-${isBookmarked && isBookmarked(a.id) ? 'solid text-danger' : 'regular'} fa-bookmark fs-6`}></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bộ Phân Trang Tin Tức */}
              {allGridArticles.length > 0 && (
                <PaginationBar
                  currentPage={currentPage}
                  totalItems={allGridArticles.length}
                  pageSize={pageSize}
                  pageSizeOptions={[6, 12, 24]}
                  onPageChange={(p) => setCurrentPage(p)}
                  onPageSizeChange={(s) => {
                    setPageSize(s);
                    setCurrentPage(1);
                  }}
                  itemLabel="bài viết"
                />
              )}
            </>
          )}
        </div>

        {/* CỘT PHẢI: WIDGET THỊNH HÀNH & LIÊN KẾT */}
        <div className="col-lg-3">
          <div className="panel-tdmu mb-4">
            <div className="panel-heading-tdmu">
              <i className="fa-solid fa-fire me-2 text-danger"></i>Chủ đề thịnh hành
            </div>
            <div className="p-3 d-flex flex-wrap gap-2">
              <span className="badge bg-light text-primary border" style={{ cursor: 'pointer' }} onClick={() => setCurrentCategory('Hoạt động công đoàn')}>#DinhDuongGiaDinh</span>
              <span className="badge bg-light text-primary border" style={{ cursor: 'pointer' }} onClick={() => setCurrentCategory('Phong trào thi đua')}>#DaiHoiXIVCongDoan</span>
              <span className="badge bg-light text-primary border" style={{ cursor: 'pointer' }} onClick={() => setCurrentCategory('Phong trào thi đua')}>#HocTapTheoBac</span>
              <span className="badge bg-light text-primary border" style={{ cursor: 'pointer' }} onClick={() => setCurrentCategory('Văn hóa - Thể thao')}>#GiaiBongDaTDMU</span>
              <span className="badge bg-light text-primary border" style={{ cursor: 'pointer' }} onClick={() => setCurrentCategory('Chăm lo đời sống')}>#TetTrungThu2026</span>
            </div>
          </div>

          <div className="panel-tdmu mb-4">
            <div className="panel-heading-tdmu">
              <i className="fa-solid fa-link me-2 text-primary"></i>Liên kết website
            </div>
            <div className="list-group-tdmu">
              <a href="http://tdmu.edu.vn/" target="_blank" rel="noreferrer" className="list-group-item">
                <i className="fa-solid fa-chevron-right me-1 text-muted small"></i> Đại học Thủ Dầu Một
              </a>
              <a href="http://danguy.tdmu.edu.vn/" target="_blank" rel="noreferrer" className="list-group-item">
                <i className="fa-solid fa-chevron-right me-1 text-muted small"></i> Đảng Bộ ĐH Thủ Dầu Một
              </a>
              <a href="http://www.congdoan.vn" target="_blank" rel="noreferrer" className="list-group-item">
                <i className="fa-solid fa-chevron-right me-1 text-muted small"></i> Tổng LĐLĐ Việt Nam
              </a>
              <a href="http://congdoanbinhduong.org.vn/" target="_blank" rel="noreferrer" className="list-group-item">
                <i className="fa-solid fa-chevron-right me-1 text-muted small"></i> LĐLĐ Tỉnh Bình Dương
              </a>
            </div>
          </div>

          <div className="panel-tdmu">
            <div className="panel-heading-tdmu">
              <i className="fa-solid fa-chart-simple me-2 text-warning"></i>Thống kê tương tác
            </div>
            <div className="p-3" style={{ fontSize: '13px' }}>
              <p className="mb-2"><i className="fa-solid fa-newspaper text-primary me-2"></i> Tổng bài viết: <strong>{articles.length}</strong></p>
              <p className="mb-2"><i className="fa-solid fa-eye text-success me-2"></i> Tổng lượt xem: <strong>{articles.reduce((sum, a) => sum + (a.viewsCount || a.views || 0), 0).toLocaleString('vi-VN')}</strong></p>
              <p className="mb-0"><i className="fa-solid fa-bookmark text-danger me-2"></i> Bài viết đã lưu: <strong>{bookmarks ? bookmarks.length : 0}</strong></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TinTuc;
