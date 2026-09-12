import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PaginationBar from '../components/PaginationBar';
import { useBookmarks } from '../App';

const TinTuc = () => {
  const navigate = useNavigate();
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

  const startIndex = (currentPage - 1) * pageSize;
  const currentGridArticles = allGridArticles.slice(startIndex, startIndex + pageSize);

  return (
    <div className="container my-3">
      {/* Breadcrumb */}
      <div className="breadcrumb-box mb-3">
        <Link to="/">Trang chủ</Link> / <span className="text-muted">Tạp chí Tin tức &amp; Sự kiện</span>
      </div>

      {/* BỘ LỌC CHUYÊN MỤC & THANH TÌM KIẾM BÀI VIẾT */}
      <div className="content-box mb-4 py-3">
        <div className="row g-3 align-items-center">
          <div className="col-lg-8">
            <div className="doc-filter-bar mb-0 border-0 pb-0" id="articleCategoryFilter">
              <button
                className={`doc-tab-btn ${currentCategory === 'all' ? 'active' : ''}`}
                onClick={() => setCurrentCategory('all')}
              >
                <i className="fa-solid fa-newspaper text-primary me-1"></i> Tất cả tin tức
              </button>
              <button
                className={`doc-tab-btn ${currentCategory === 'Hoạt động công đoàn' ? 'active' : ''}`}
                onClick={() => setCurrentCategory('Hoạt động công đoàn')}
              >
                <i className="fa-solid fa-users text-primary me-1"></i> Hoạt động CĐ
              </button>
              <button
                className={`doc-tab-btn ${currentCategory === 'Phong trào thi đua' ? 'active' : ''}`}
                onClick={() => setCurrentCategory('Phong trào thi đua')}
              >
                <i className="fa-solid fa-trophy text-warning me-1"></i> Phong trào thi đua
              </button>
              <button
                className={`doc-tab-btn ${currentCategory === 'Chăm lo đời sống' ? 'active' : ''}`}
                onClick={() => setCurrentCategory('Chăm lo đời sống')}
              >
                <i className="fa-solid fa-heart-pulse text-danger me-1"></i> Chăm lo đời sống
              </button>
              <button
                className={`doc-tab-btn ${currentCategory === 'Văn hóa - Thể thao' ? 'active' : ''}`}
                onClick={() => setCurrentCategory('Văn hóa - Thể thao')}
              >
                <i className="fa-solid fa-futbol text-success me-1"></i> Văn hóa - Thể thao
              </button>
              <button
                className={`doc-tab-btn ${currentCategory === 'saved' ? 'active' : ''}`}
                onClick={() => setCurrentCategory('saved')}
              >
                <i className="fa-solid fa-bookmark text-danger me-1"></i> Đã lưu ({bookmarks ? bookmarks.length : 0})
              </button>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="position-relative">
              <i className="fa-solid fa-magnifying-glass position-absolute text-muted" style={{ left: '14px', top: '12px' }}></i>
              <input
                type="text"
                id="articleSearchInput"
                className="form-control"
                style={{ borderRadius: '20px', paddingLeft: '38px', fontSize: '13px', border: '1px solid #CBD5E1' }}
                placeholder="Tìm kiếm bài viết, tác giả..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* LEFT COLUMN (9 PHẦN): FEED TẠP CHÍ QUỐC TẾ */}
        <div className="col-lg-9">
          {loading ? (
            <div className="text-center py-5 text-muted">
              <i className="fa-solid fa-circle-notch fa-spin fa-2x text-primary mb-3"></i>
              <div>Đang tải bài viết từ CSDL SQL Server...</div>
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="col-12 text-center p-5 text-muted bg-white rounded border">
              <i className="fa-solid fa-inbox fa-3x mb-3 text-secondary"></i>
              <p className="mb-0">Không tìm thấy bài viết nào trong chuyên mục này.</p>
            </div>
          ) : (
            <>
              {/* BÀI BÁO TIÊU ĐIỂM HERO */}
              {heroArticle && currentPage === 1 && currentCategory === 'all' && !searchQuery && (
                <div
                  className="news-hero-headline"
                  onClick={() => navigate(`/bai-viet?id=${heroArticle.id}`)}
                  title="Bấm vào để đọc toàn văn bài viết"
                >
                  <div className="row g-0">
                    <div className="col-md-7">
                      <div className="hero-img-wrap">
                        <img
                          src={heroArticle.image || 'https://tdmu.edu.vn/hinh/thuvien/hinhanh/DSC02559(1).JPG'}
                          className="hero-img"
                          alt={heroArticle.title}
                        />
                        <div className="live-reader-badge">
                          <span className="live-dot"></span> <span>24 cán bộ đang đọc</span>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-5 p-4 d-flex flex-column justify-content-between">
                      <div>
                        <div className="d-flex align-items-center gap-2 mb-2">
                          <span className="badge" style={{ background: '#002855', color: '#FEF08A', fontWeight: 700, fontSize: '11px' }}>
                            TIÊU ĐIỂM HÔM NAY
                          </span>
                          <span className="text-muted small">
                            <i className="fa-regular fa-clock me-1"></i> 3 phút đọc
                          </span>
                        </div>
                        <h3 className="fw-bold mt-1" style={{ fontSize: '18px', lineHeight: 1.45, color: '#002855' }}>
                          {heroArticle.title}
                        </h3>

                        {/* AI 30s Takeaways */}
                        <div className="ai-takeaway-box">
                          <div className="ai-takeaway-title">
                            <i className="fa-solid fa-bolt text-warning"></i> Điểm Nhấn Bản Tin (30 Giây)
                          </div>
                          <ul className="ai-takeaway-list">
                            <li>{heroArticle.summary ? heroArticle.summary.slice(0, 100) + '...' : 'Thông tin cập nhật mới nhất từ Công đoàn TDMU.'}</li>
                            <li>Đồng hành chăm lo và bảo vệ quyền lợi chính đáng cho toàn thể đoàn viên.</li>
                          </ul>
                        </div>
                      </div>

                      <div>
                        <div className="d-flex justify-content-between align-items-center text-muted small mb-3 border-top pt-2">
                          <div className="d-flex align-items-center gap-3">
                            <span><i className="fa-regular fa-calendar me-1 text-primary"></i> {heroArticle.createdAt ? String(heroArticle.createdAt).split('T')[0] : '26/06/2026'}</span>
                            <span><i className="fa-regular fa-eye text-success me-1"></i> <strong>{heroArticle.viewsCount || heroArticle.views || 450}</strong></span>
                            <button
                              type="button"
                              className="btn btn-sm btn-link p-0 text-secondary"
                              onClick={(e) => handleBookmarkToggle(e, heroArticle)}
                              title="Lưu đọc sau"
                            >
                              <i className={`fa-${isBookmarked && isBookmarked(heroArticle.id) ? 'solid text-danger' : 'regular'} fa-bookmark fs-6`}></i>
                            </button>
                          </div>
                          <span className="text-primary fw-bold">{heroArticle.author || 'Ban Thường Vụ'}</span>
                        </div>
                        <button
                          className="btn btn-sm btn-primary w-100 fw-bold py-2"
                          style={{ background: '#002855', borderColor: '#002855', borderRadius: '6px' }}
                        >
                          <i className="fa-solid fa-book-open-reader me-2 text-warning"></i> ĐỌC TOÀN VĂN BÀI VIẾT
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* LƯỚI TẠP CHÍ CÁC BÀI VIẾT (MAGAZINE GRID) */}
              <div className="row g-3">
                {currentGridArticles.map(a => (
                  <div className="col-md-6" key={a.id}>
                    <div
                      className="magazine-card"
                      onClick={() => navigate(`/bai-viet?id=${a.id}`)}
                      title="Bấm vào để đọc toàn văn bài viết"
                    >
                      <div className="magazine-thumb-wrap">
                        <img
                          src={a.image || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500'}
                          className="magazine-thumb"
                          alt={a.title}
                        />
                        <div className="position-absolute bottom-0 start-0 m-2">
                          <span className="badge" style={{ background: 'rgba(0,40,85,0.88)', color: '#FEF08A', fontWeight: 700, fontSize: '11px' }}>
                            {a.categoryName || a.category || a.ChuyenMuc || 'Tin tức'}
                          </span>
                        </div>
                      </div>

                      <div className="p-3 d-flex flex-column justify-content-between flex-grow-1">
                        <div>
                          <h4 className="fw-bold mb-2" style={{ fontSize: '15.5px', lineHeight: 1.45, color: '#002855' }}>
                            {a.title}
                          </h4>
                          <p
                            className="text-muted small mb-3"
                            style={{
                              fontSize: '12.5px',
                              lineHeight: 1.5,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}
                          >
                            {a.summary || ''}
                          </p>
                        </div>

                        <div className="d-flex justify-content-between align-items-center text-muted small pt-2 border-top">
                          <div>
                            <span className="me-2"><i className="fa-regular fa-calendar me-1 text-primary"></i> {a.createdAt ? String(a.createdAt).split('T')[0] : '26/06/2026'}</span>
                            <span><i className="fa-regular fa-eye text-success me-1"></i> {a.viewsCount || a.views || 140}</span>
                          </div>
                          <button
                            type="button"
                            className="btn btn-sm btn-link text-secondary p-0"
                            onClick={(e) => handleBookmarkToggle(e, a)}
                            title="Lưu bài viết đọc sau"
                          >
                            <i className={`fa-${isBookmarked && isBookmarked(a.id) ? 'solid text-danger' : 'regular'} fa-bookmark fs-6`}></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Phân trang */}
              {allGridArticles.length > 0 && (
                <div className="mt-4">
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
                </div>
              )}
            </>
          )}
        </div>

        {/* RIGHT COLUMN (3 PHẦN): WIDGET THÔNG MINH */}
        <div className="col-lg-3">
          {/* Widget Chủ Đề Thịnh Hành */}
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

          {/* Widget Liên Kết */}
          <div className="panel-tdmu mb-4">
            <div className="panel-heading-tdmu">
              <i className="fa-solid fa-link me-2 text-primary"></i>Liên kết website
            </div>
            <div className="list-group-tdmu">
              <a href="http://tdmu.edu.vn/" target="_blank" rel="noreferrer" className="list-group-item">
                <i className="fa-solid fa-chevron-right me-1 text-muted small"></i> Đại học Thủ Dầu Một
              </a>
              <a href="http://danguy.tdmu.edu.vn/" target="_blank" rel="noreferrer" className="list-group-item">
                <i className="fa-solid fa-chevron-right me-1 text-muted small"></i> Đảng Bộ Đại học TDMU
              </a>
              <a href="http://www.congdoan.vn" target="_blank" rel="noreferrer" className="list-group-item">
                <i className="fa-solid fa-chevron-right me-1 text-muted small"></i> Tổng LĐLĐ Việt Nam
              </a>
              <a href="http://congdoanbinhduong.org.vn/" target="_blank" rel="noreferrer" className="list-group-item">
                <i className="fa-solid fa-chevron-right me-1 text-muted small"></i> LĐLĐ Tỉnh Bình Dương
              </a>
              <a href="http://lib.tdmu.edu.vn/" target="_blank" rel="noreferrer" className="list-group-item">
                <i className="fa-solid fa-chevron-right me-1 text-muted small"></i> TT Học Liệu ĐH TDMU
              </a>
            </div>
          </div>

          {/* Thống Kê */}
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
