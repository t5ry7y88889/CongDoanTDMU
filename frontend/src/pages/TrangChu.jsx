import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import HeroCarousel from '../components/HeroCarousel';
import PaginationBar from '../components/PaginationBar';
import ArticleQuickModal from '../components/ArticleQuickModal';

const Home = () => {
  const [articles, setArticles] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState({ online: 12, totalViews: 811221 });
  const [loading, setLoading] = useState(true);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(4);

  // Modal states
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // 1. Fetch live articles from API
    fetch('/api/articles?status=published')
      .then((r) => r.json())
      .then((data) => {
        if (data && data.data && Array.isArray(data.data)) {
          setArticles(data.data);
        }
      })
      .catch((err) => console.error('Error fetching live articles:', err))
      .finally(() => setLoading(false));

    // 2. Fetch live documents from API
    fetch('/api/documents')
      .then((r) => r.json())
      .then((data) => {
        if (data && data.data && Array.isArray(data.data) && data.data.length > 0) {
          setDocuments(data.data.slice(0, 5));
        }
      })
      .catch(() => {});

    // 3. Fetch live visitor stats
    fetch('/api/stats')
      .then((r) => r.json())
      .then((data) => {
        if (data) {
          setStats({
            online: data.online || 12,
            totalViews: data.totalViews || 811221
          });
        }
      })
      .catch(() => {});
  }, []);

  const openQuickArticle = (art) => {
    setSelectedArticle(art);
    setIsModalOpen(true);
  };

  // Pagination slice
  const startIndex = (currentPage - 1) * pageSize;
  const currentArticles = articles.slice(startIndex, startIndex + pageSize);

  return (
    <>
      {/* 1. Hero Carousel */}
      <HeroCarousel />

      {/* 2. Main News Section & Sidebar */}
      <section className="my-3" id="tintuc">
        <div className="container">
          <div className="row g-4">
            {/* CỘT TRÁI (9 PHẦN): HOẠT ĐỘNG CÔNG ĐOÀN */}
            <div className="col-lg-9">
              <div className="tieudelon d-flex align-items-center justify-content-between mb-3">
                <div>
                  <span>
                    <i className="fa-solid fa-newspaper me-2 text-primary"></i>
                    HOẠT ĐỘNG CÔNG ĐOÀN
                  </span>
                  <span className="badge bg-success text-white ms-2" style={{ fontSize: '11px', fontWeight: '500' }}>
                    <i className="fa-solid fa-database me-1"></i> MSSQL Live
                  </span>
                </div>
                <Link to="/tin-tuc" className="fw-bold" style={{ color: '#005696', textDecoration: 'none' }}>
                  Xem tất cả <i className="fa-solid fa-angle-right ms-1"></i>
                </Link>
              </div>

              {/* Lưới bài viết */}
              <div className="row g-3" id="article_container">
                {loading ? (
                  <div className="col-12 text-center py-5">
                    <i className="fa-solid fa-spinner fa-spin fa-2x text-primary mb-2"></i>
                    <p className="text-muted">Đang tải bài báo từ cơ sở dữ liệu...</p>
                  </div>
                ) : currentArticles.length === 0 ? (
                  <div className="col-12 text-center py-5 text-muted">
                    <i className="fa-solid fa-inbox fa-3x mb-3 text-secondary"></i>
                    <p>Chưa có bài viết nào được xuất bản.</p>
                  </div>
                ) : (
                  currentArticles.map((art) => (
                    <div className="col-md-6 new_item" key={art.id}>
                      <h3 className="new_item_title">
                        <a
                          href={`#read-${art.id}`}
                          onClick={(e) => {
                            e.preventDefault();
                            openQuickArticle(art);
                          }}
                          title={art.title}
                        >
                          {art.title}
                        </a>
                      </h3>
                      <div
                        style={{ cursor: 'pointer', overflow: 'hidden', borderRadius: '4px' }}
                        onClick={() => openQuickArticle(art)}
                      >
                        <img
                          src={art.image || '/images/banner.jpg'}
                          className="new_item_img"
                          alt={art.title}
                        />
                      </div>
                      <span className="new_item_time">
                        <i className="fa-regular fa-clock me-1 text-primary"></i>
                        {art.publishedAt ? String(art.publishedAt).slice(0, 16) : (art.createdAt ? String(art.createdAt).slice(0, 16) : 'Vừa cập nhật')} &nbsp;|&nbsp;
                        <i className="fa-regular fa-eye me-1 text-success"></i>
                        {art.viewsCount || art.views || 0} lượt xem &nbsp;|&nbsp;
                        <span className="badge bg-light text-primary border">{art.categoryName || 'Tin tức'}</span>
                      </span>
                      <span className="new_item_desc">
                        {art.summary
                          ? art.summary.length > 160
                            ? art.summary.slice(0, 160) + '...'
                            : art.summary
                          : ''}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Bộ Phân Trang React */}
              <PaginationBar
                currentPage={currentPage}
                totalItems={articles.length}
                pageSize={pageSize}
                pageSizeOptions={[4, 8, 12]}
                onPageChange={(p) => setCurrentPage(p)}
                onPageSizeChange={(s) => {
                  setPageSize(s);
                  setCurrentPage(1);
                }}
                itemLabel="bài viết"
              />
            </div>

            {/* CỘT PHẢI (3 PHẦN): LIÊN KẾT & THỐNG KÊ */}
            <div className="col-lg-3">
              {/* Liên kết website */}
              <div className="panel-tdmu mb-4">
                <div className="panel-heading-tdmu">
                  <i className="fa-solid fa-link me-2 text-primary"></i>Liên kết website
                </div>
                <div className="list-group-tdmu">
                  <a href="https://tdmu.edu.vn/" target="_blank" rel="noreferrer" className="list-group-item">
                    <i className="fa-solid fa-chevron-right me-1 text-muted small"></i> Đại học Thủ Dầu Một
                  </a>
                  <a href="https://danguy.tdmu.edu.vn/" target="_blank" rel="noreferrer" className="list-group-item">
                    <i className="fa-solid fa-chevron-right me-1 text-muted small"></i> Đảng Bộ ĐH Thủ Dầu Một
                  </a>
                  <a href="https://congdoanvietnam.vn" target="_blank" rel="noreferrer" className="list-group-item">
                    <i className="fa-solid fa-chevron-right me-1 text-muted small"></i> Tổng LĐLĐ Việt Nam
                  </a>
                  <a href="https://binhduong.congdoan.vn/" target="_blank" rel="noreferrer" className="list-group-item">
                    <i className="fa-solid fa-chevron-right me-1 text-muted small"></i> LĐLĐ Tỉnh Bình Dương
                  </a>
                  <a href="https://laodong.vn/" target="_blank" rel="noreferrer" className="list-group-item">
                    <i className="fa-solid fa-chevron-right me-1 text-muted small"></i> Báo Lao Động
                  </a>
                  <a href="http://doanvien.congdoan.vn/" target="_blank" rel="noreferrer" className="list-group-item">
                    <i className="fa-solid fa-chevron-right me-1 text-muted small"></i> Phần mềm quản lý đoàn viên
                  </a>
                </div>
              </div>

              {/* Thống Kê Truy Cập Widget */}
              <div className="panel-tdmu">
                <div className="panel-heading-tdmu">
                  <i className="fa-solid fa-chart-simple me-2 text-warning"></i>Thống kê truy cập
                </div>
                <div className="p-3" style={{ fontSize: '13px' }}>
                  <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                    <span>
                      <i className="fa-solid fa-users text-primary me-2"></i>Đang trực tuyến:
                    </span>
                    <strong className="text-primary">{stats.online.toLocaleString('vi-VN')}</strong>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span>
                      <i className="fa-solid fa-eye text-success me-2"></i>Tổng lượt xem:
                    </span>
                    <strong className="text-success">{stats.totalViews.toLocaleString('vi-VN')}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Section VĂN BẢN & THÔNG BÁO NHANH */}
      <section id="sectionTB" className="my-4">
        <div className="container">
          <div className="row g-4">
            {/* Cột Trái: Văn bản chỉ đạo */}
            <div className="col-lg-9">
              <div className="tieudelon-section">
                <i className="fa-solid fa-folder-open me-2 text-danger"></i>VĂN BẢN CHỈ ĐẠO &amp; ĐIỀU HÀNH
              </div>
              <div className="list-group-vb">
                {documents.length > 0 ? (
                  documents.map((doc) => (
                    <Link
                      to={`/van-ban#${doc.loai_van_ban || 'tuyen-truyen'}`}
                      className="list-group-vb-item d-flex justify-content-between align-items-center"
                      key={doc.id}
                    >
                      <span>
                        <i className="fa-regular fa-file-pdf text-danger me-2 fa-lg"></i>
                        <strong>[{doc.so_hieu}]</strong> {doc.tieu_de}
                      </span>
                      <span className="badge bg-light text-primary border">
                        <i className="fa-solid fa-download me-1"></i>
                        {doc.dung_luong || '1.5 MB'}
                      </span>
                    </Link>
                  ))
                ) : (
                  <>
                    <Link to="/van-ban#tuyen-truyen" className="list-group-vb-item d-flex justify-content-between align-items-center">
                      <span>
                        <i className="fa-regular fa-file-pdf text-danger me-2 fa-lg"></i>
                        <strong>[18/CV-CĐCS]</strong> Vận động ủng hộ đồng bào bị thiệt hại do bão số 3
                      </span>
                      <span className="badge bg-light text-primary border">
                        <i className="fa-solid fa-download me-1"></i> 1.2 MB
                      </span>
                    </Link>
                    <Link to="/van-ban#ke-hoach" className="list-group-vb-item d-flex justify-content-between align-items-center">
                      <span>
                        <i className="fa-regular fa-file-pdf text-danger me-2 fa-lg"></i>
                        <strong>[25/KH-CĐCS]</strong> Kế hoạch tổ chức giải Bóng đá truyền thống "Công đoàn trường ĐH Thủ Dầu Một"
                      </span>
                      <span className="badge bg-light text-primary border">
                        <i className="fa-solid fa-download me-1"></i> 3.1 MB
                      </span>
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Cột Phải: Thông báo nhanh */}
            <div className="col-lg-3">
              <div className="tieudelon-section">
                <i className="fa-solid fa-bell me-2 text-warning"></i>THÔNG BÁO NHANH
              </div>
              <div className="notice-quick-box">
                <p className="mb-2">
                  <i className="fa-solid fa-circle-info text-primary me-1"></i>
                  <strong>Hội nghị Cán bộ, Viên chức:</strong> Năm học 2026 - 2027 dự kiến tổ chức vào tháng 10/2026.
                </p>
                <p className="mb-0">
                  <i className="fa-solid fa-circle-check text-success me-1"></i>
                  <strong>Khám sức khỏe:</strong> 100% đoàn viên tham gia khám sức khỏe định kỳ năm 2026.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Article Quick Modal */}
      <ArticleQuickModal
        article={selectedArticle}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

export default Home;
