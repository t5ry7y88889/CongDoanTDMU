import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  const [articles, setArticles] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState({ online: 12, totalViews: 811221 });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const pageSize = 4;

  const carouselRef = useRef(null);

  useEffect(() => {
    // 1. Fetch Articles from SQL Server / API
    fetch('/api/articles?status=published')
      .then(r => r.json())
      .then(data => {
        if (data && data.data && data.data.length > 0) {
          setArticles(data.data);
        } else {
          setArticles(defaultArticles);
        }
      })
      .catch(() => setArticles(defaultArticles))
      .finally(() => setLoading(false));

    // 2. Fetch Documents from SQL Server / API
    fetch('/api/documents')
      .then(r => r.json())
      .then(data => {
        if (data && data.data && data.data.length > 0) {
          setDocuments(data.data.slice(0, 5));
        }
      })
      .catch(() => {});

    // 3. Fetch Live Access Stats
    fetch('/api/stats')
      .then(r => r.json())
      .then(data => {
        if (data) {
          setStats({
            online: data.online || 12,
            totalViews: data.totalViews || 811221
          });
        }
      })
      .catch(() => {});

    // 4. Initialize Bootstrap 5 Carousel
    if (typeof window !== 'undefined' && window.bootstrap) {
      const carouselEl = document.getElementById('heroCarousel');
      if (carouselEl) {
        const carousel = window.bootstrap.Carousel.getOrCreateInstance(carouselEl, {
          interval: 4000,
          ride: 'carousel',
          wrap: true
        });
        carousel.cycle();
      }
    }
  }, []);

  // Open Article Detail Modal
  const openArticleModal = (art) => {
    setSelectedArticle(art);
    if (typeof window !== 'undefined' && window.bootstrap) {
      const modalEl = document.getElementById('articleDetailModal');
      if (modalEl) {
        const modal = window.bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.show();
      }
    }
  };

  // Pagination calculation
  const totalPages = Math.ceil((articles.length || 1) / pageSize);
  const displayedArticles = articles.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <>
      {/* Section Hero Carousel */}
      <section id="sectionslide" className="my-3">
        <div className="container">
          <div id="heroCarousel" className="carousel slide shadow-sm" data-bs-ride="carousel" ref={carouselRef}>
            <div className="carousel-indicators">
              <button type="button" data-bs-target="#heroCarousel" data-bs-slide-to="0" className="active"></button>
              <button type="button" data-bs-target="#heroCarousel" data-bs-slide-to="1"></button>
              <button type="button" data-bs-target="#heroCarousel" data-bs-slide-to="2"></button>
            </div>
            <div className="carousel-inner rounded" style={{ maxHeight: '380px' }}>
              <div className="carousel-item active">
                <img src="/images/banner.jpg" className="d-block w-100" alt="Đại hội Công đoàn TDMU" style={{ height: '380px', objectFit: 'cover' }} />
                <div className="carousel-caption d-none d-md-block" style={{ background: 'rgba(0, 34, 64, 0.75)', borderRadius: '4px', padding: '12px 20px' }}>
                  <h5 className="fw-bold text-warning">ĐẠI HỘI CÔNG ĐOÀN CƠ SỞ TRƯỜNG ĐẠI HỌC THỦ DẦU MỘT</h5>
                  <p className="mb-0">Đổi mới - Dân chủ - Đoàn kết - Phát triển vì quyền lợi đoàn viên</p>
                </div>
              </div>
              <div className="carousel-item">
                <img src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200" className="d-block w-100" alt="Hoạt động chăm lo" style={{ height: '380px', objectFit: 'cover' }} />
                <div className="carousel-caption d-none d-md-block" style={{ background: 'rgba(0, 34, 64, 0.75)', borderRadius: '4px', padding: '12px 20px' }}>
                  <h5 className="fw-bold text-warning">CHĂM LO ĐỜI SỐNG &amp; BẢO VỆ QUYỀN LỢI ĐOÀN VIÊN</h5>
                  <p className="mb-0">Triển khai nhiều chương trình phúc lợi, trợ cấp khó khăn và khám sức khỏe định kỳ</p>
                </div>
              </div>
              <div className="carousel-item">
                <img src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200" className="d-block w-100" alt="Phong trào thi đua" style={{ height: '380px', objectFit: 'cover' }} />
                <div className="carousel-caption d-none d-md-block" style={{ background: 'rgba(0, 34, 64, 0.75)', borderRadius: '4px', padding: '12px 20px' }}>
                  <h5 className="fw-bold text-warning">PHONG TRÀO THI ĐUA DẠY TỐT - HỌC TỐT - NGHIÊN CỨU TỐT</h5>
                  <p className="mb-0">Phát huy tinh thần sáng tạo của cán bộ, giảng viên trong kỷ nguyên số</p>
                </div>
              </div>
            </div>
            <button className="carousel-control-prev" type="button" data-bs-target="#heroCarousel" data-bs-slide="prev">
              <span className="carousel-control-prev-icon"></span>
            </button>
            <button className="carousel-control-next" type="button" data-bs-target="#heroCarousel" data-bs-slide="next">
              <span className="carousel-control-next-icon"></span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Content: Tin Tức (9 phần) & Cột Phải (3 phần) */}
      <section className="my-3" id="tintuc">
        <div className="container">
          <div className="row g-4">
            {/* CỘT TRÁI: HOẠT ĐỘNG CÔNG ĐOÀN */}
            <div className="col-lg-9">
              <div className="tieudelon d-flex align-items-center justify-content-between">
                <div>
                  <span><i className="fa-solid fa-newspaper me-2"></i>HOẠT ĐỘNG CÔNG ĐOÀN</span>
                  <span className="badge bg-success text-white ms-2" style={{ fontSize: '11px', fontWeight: '500' }}>
                    <i className="fa-solid fa-database me-1"></i> MSSQL Live
                  </span>
                </div>
                <Link to="/tin-tuc" className="fw-bold" style={{ color: '#005696', textDecoration: 'none' }}>
                  Xem tất cả <i className="fa-solid fa-angle-right ms-1"></i>
                </Link>
              </div>

              {/* Danh Sách Bài Viết */}
              <div className="row" id="article_container">
                {displayedArticles.map(art => (
                  <div className="col-md-6 new_item" key={art.id}>
                    <h3 className="new_item_title">
                      <a href="javascript:void(0)" onClick={() => openArticleModal(art)}>
                        {art.title}
                      </a>
                    </h3>
                    <img
                      src={art.image || 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=500'}
                      className="new_item_img"
                      alt={art.title}
                      onClick={() => openArticleModal(art)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span className="new_item_time">
                      <i className="fa-regular fa-clock me-1"></i> {art.date || (art.createdAt ? art.createdAt.slice(0, 16) : '26/06/2026')} &nbsp;|&nbsp; 
                      <i className="fa-regular fa-eye me-1"></i> {art.views || art.viewsCount || 140} lượt xem &nbsp;|&nbsp; 
                      <span className="badge bg-light text-primary border">{art.categoryName || 'Tin tức'}</span>
                    </span>
                    <span className="new_item_desc">
                      {art.summary || (art.content ? art.content.replace(/<[^>]*>/g, '').slice(0, 160) + '...' : '')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Phân Trang React */}
              {totalPages > 1 && (
                <div className="d-flex justify-content-center align-items-center gap-2 mt-4 pt-2">
                  <button
                    className="btn btn-sm btn-outline-primary"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  >
                    <i className="fa-solid fa-chevron-left me-1"></i> Trang trước
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
                    <button
                      key={num}
                      className={`btn btn-sm ${currentPage === num ? 'btn-primary fw-bold' : 'btn-outline-secondary'}`}
                      onClick={() => setCurrentPage(num)}
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    className="btn btn-sm btn-outline-primary"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  >
                    Trang sau <i className="fa-solid fa-chevron-right ms-1"></i>
                  </button>
                </div>
              )}
            </div>

            {/* CỘT PHẢI: LIÊN KẾT WEBSITE & THỐNG KÊ */}
            <div className="col-lg-3">
              <div className="panel-tdmu mb-4">
                <div className="panel-heading-tdmu">
                  <i className="fa-solid fa-link me-2 text-primary"></i>Liên kết website
                </div>
                <div className="list-group-tdmu">
                  <a href="http://tdmu.edu.vn/" target="_blank" rel="noreferrer" className="list-group-item">
                    <i className="fa-solid fa-chevron-right me-1 text-muted small"></i> Đại học Thủ Dầu Một
                  </a>
                  <a href="http://danguy.tdmu.edu.vn/" target="_blank" rel="noreferrer" className="list-group-item">
                    <i className="fa-solid fa-chevron-right me-1 text-muted small"></i> Đảng Bộ Đại học Thủ Dầu Một
                  </a>
                  <a href="http://www.congdoan.vn" target="_blank" rel="noreferrer" className="list-group-item">
                    <i className="fa-solid fa-chevron-right me-1 text-muted small"></i> Tổng LĐLĐ Việt Nam
                  </a>
                  <a href="http://congdoanbinhduong.org.vn/" target="_blank" rel="noreferrer" className="list-group-item">
                    <i className="fa-solid fa-chevron-right me-1 text-muted small"></i> LĐLĐ Tỉnh Bình Dương
                  </a>
                  <a href="http://lib.tdmu.edu.vn/" target="_blank" rel="noreferrer" className="list-group-item">
                    <i className="fa-solid fa-chevron-right me-1 text-muted small"></i> TT Học Liệu ĐH Thủ Dầu Một
                  </a>
                  <a href="http://doanvien.congdoan.vn/VTBWebProject" target="_blank" rel="noreferrer" className="list-group-item">
                    <i className="fa-solid fa-chevron-right me-1 text-muted small"></i> Quản lý đoàn viên toàn quốc
                  </a>
                </div>
              </div>

              {/* Thống Kê Truy Cập Widget */}
              <div className="panel-tdmu">
                <div className="panel-heading-tdmu">
                  <i className="fa-solid fa-chart-simple me-2 text-warning"></i>Thống kê truy cập
                </div>
                <div className="p-3" style={{ fontSize: '13px' }}>
                  <p className="mb-2">
                    <i className="fa-solid fa-users text-primary me-2"></i> Đang trực tuyến: <strong>{stats.online.toLocaleString('vi-VN')}</strong>
                  </p>
                  <p className="mb-0">
                    <i className="fa-solid fa-eye text-success me-2"></i> Tổng lượt xem: <strong>{stats.totalViews.toLocaleString('vi-VN')}</strong>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section VĂN BẢN CHỈ ĐẠO & ĐIỀU HÀNH */}
      <section id="sectionTB" className="my-4">
        <div className="container">
          <div className="row g-4">
            <div className="col-lg-9">
              <div className="tieudelon-section">
                <i className="fa-solid fa-folder-open me-2 text-danger"></i>VĂN BẢN CHỈ ĐẠO &amp; ĐIỀU HÀNH
              </div>
              <div className="list-group-vb">
                {documents.length > 0 ? (
                  documents.map(doc => (
                    <Link to={`/van-ban#${doc.loai_van_ban || 'tuyen-truyen'}`} className="list-group-vb-item" key={doc.id}>
                      <span>
                        <i className="fa-regular fa-file-pdf text-danger me-2 fa-lg"></i> 
                        <strong>[{doc.so_hieu}]</strong> {doc.tieu_de}
                      </span>
                      <span className="badge bg-light text-primary border">
                        <i className="fa-solid fa-download me-1"></i> {doc.dung_luong || '1.5 MB'}
                      </span>
                    </Link>
                  ))
                ) : (
                  <>
                    <Link to="/van-ban#tuyen-truyen" className="list-group-vb-item">
                      <span><i className="fa-regular fa-file-pdf text-danger me-2 fa-lg"></i> <strong>[18/CV-CĐCS]</strong> Vận động ủng hộ đồng bào bị thiệt hại do bão số 3</span>
                      <span className="badge bg-light text-primary border"><i className="fa-solid fa-download me-1"></i> 1.2 MB</span>
                    </Link>
                    <Link to="/van-ban#ke-hoach" className="list-group-vb-item">
                      <span><i className="fa-regular fa-file-pdf text-danger me-2 fa-lg"></i> <strong>[25/KH-CĐCS]</strong> Kế hoạch tổ chức giải Bóng đá truyền thống "Công đoàn trường ĐH Thủ Dầu Một"</span>
                      <span className="badge bg-light text-primary border"><i className="fa-solid fa-download me-1"></i> 3.1 MB</span>
                    </Link>
                  </>
                )}
              </div>
            </div>

            <div className="col-lg-3">
              <div className="tieudelon-section">
                <i className="fa-solid fa-bell me-2 text-warning"></i>THÔNG BÁO NHANH
              </div>
              <div className="notice-quick-box">
                <p className="mb-2"><i className="fa-solid fa-circle-info text-primary me-1"></i> <strong>Hội nghị Cán bộ, Viên chức:</strong> Năm học 2026 - 2027 dự kiến tổ chức vào tháng 10/2026.</p>
                <p className="mb-0"><i className="fa-solid fa-circle-check text-success me-1"></i> <strong>Khám sức khỏe:</strong> 100% đoàn viên tham gia khám sức khỏe định kỳ năm 2026.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MODAL XEM NHANH BÀI VIẾT (ARTICLE DETAIL MODAL) */}
      <div className="modal fade" id="articleDetailModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content" style={{ borderRadius: '8px' }}>
            <div className="modal-header" style={{ background: '#003865', color: 'white' }}>
              <h5 className="modal-title fw-bold" id="modalArticleTitle">
                {selectedArticle ? selectedArticle.title : 'Chi Tiết Bài Báo'}
              </h5>
              <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div className="modal-body p-4" id="modalArticleBody">
              {selectedArticle && (
                <>
                  <div className="mb-3 d-flex align-items-center gap-3 text-muted small border-bottom pb-2">
                    <span><i className="fa-regular fa-calendar me-1 text-primary"></i> {selectedArticle.date || (selectedArticle.createdAt ? selectedArticle.createdAt.slice(0, 16) : '26/06/2026')}</span>
                    <span><i className="fa-solid fa-user-pen me-1 text-primary"></i> {selectedArticle.author || 'Ban Thường Vụ'}</span>
                    <span><i className="fa-regular fa-eye me-1 text-success"></i> {selectedArticle.views || selectedArticle.viewsCount || 140} lượt xem</span>
                  </div>
                  {selectedArticle.image && (
                    <img
                      src={selectedArticle.image}
                      className="img-fluid rounded mb-3 w-100"
                      alt={selectedArticle.title}
                      style={{ maxHeight: '360px', objectFit: 'cover' }}
                    />
                  )}
                  <div
                    style={{ fontSize: '14.5px', lineHeight: 1.8, color: '#2d3748' }}
                    dangerouslySetInnerHTML={{ __html: selectedArticle.content || selectedArticle.summary || '' }}
                  />
                  <div className="mt-4 pt-3 border-top d-flex justify-content-between align-items-center">
                    <Link
                      to={`/bai-viet?id=${selectedArticle.id}`}
                      className="btn btn-sm btn-primary"
                      onClick={() => {
                        if (window.bootstrap) {
                          const modalEl = document.getElementById('articleDetailModal');
                          const instance = window.bootstrap.Modal.getInstance(modalEl);
                          if (instance) instance.hide();
                        }
                      }}
                    >
                      <i className="fa-solid fa-up-right-from-square me-1"></i> Xem bài viết trang riêng
                    </Link>
                    <button type="button" className="btn btn-sm btn-secondary" data-bs-dismiss="modal">
                      Đóng
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* OFFCANVAS TỦ SÁCH ĐỌC SAU (SAVED ARTICLES DRAWER) */}
      <div className="offcanvas offcanvas-end" tabIndex="-1" id="bookmarksOffcanvas" style={{ width: '380px' }}>
        <div className="offcanvas-header" style={{ background: '#002855', color: 'white' }}>
          <h5 className="offcanvas-title fw-bold" style={{ fontSize: '16px' }}>
            <i className="fa-solid fa-bookmark text-warning me-2"></i> Tủ Sách Đọc Sau
          </h5>
          <button type="button" className="btn-close btn-close-white" data-bs-dismiss="offcanvas"></button>
        </div>
        <div className="offcanvas-body p-3 bg-light" id="bookmarksListContainerDrawer">
          <p className="text-muted small">Danh sách các bài viết đã lưu để đọc lại offline.</p>
        </div>
        <div className="p-3 bg-white border-top text-center">
          <small className="text-muted"><i className="fa-solid fa-shield-halved text-success me-1"></i> Danh sách lưu trữ an toàn trên thiết bị của bạn</small>
        </div>
      </div>
    </>
  );
};

const defaultArticles = [
  {
    id: 1,
    title: 'Tọa đàm "Dinh dưỡng lành mạnh vì sức khỏe gia đình"',
    date: '26/06/2026',
    views: 147,
    author: 'Ban Nữ công Công đoàn TDMU',
    image: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800',
    content: '<p>Hướng tới kỷ niệm Ngày Gia đình Việt Nam, Công đoàn Trường Đại học Thủ Dầu Một đã tổ chức tọa đàm với chủ đề "Dinh dưỡng lành mạnh vì sức khỏe gia đình", thu hút đông đảo nữ cán bộ, giảng viên tham gia thảo luận về chế độ ăn uống khoa học và cân bằng cuộc sống.</p>'
  },
  {
    id: 2,
    title: 'Chào mừng Đại hội XIV Công đoàn Việt Nam nhiệm kỳ 2026 – 2031',
    date: '01/06/2026',
    views: 140,
    author: 'Ban Thường Vụ',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
    content: '<p>Đại hội XIV Công đoàn Việt Nam là sự kiện chính trị quan trọng của giai cấp công nhân và tổ chức Công đoàn Việt Nam. Toàn thể đoàn viên TDMU ra sức thi đua lập thành tích xuất sắc chào mừng ngày hội lớn.</p>'
  },
  {
    id: 3,
    title: 'Đại học Thủ Dầu Một được tuyên dương điển hình tiên tiến trong học tập và làm theo Bác',
    date: '08/05/2026',
    views: 306,
    author: 'Ban Tuyên giáo',
    image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800',
    content: '<p>Trường Đại học Thủ Dầu Một vinh dự được trao tặng Bằng khen dành cho tập thể điển hình tiên tiến có thành tích tiêu biểu giai đoạn 2021–2026 trong phong trào học tập và làm theo tư tưởng, đạo đức, phong cách Hồ Chí Minh.</p>'
  },
  {
    id: 4,
    title: 'Phiên chợ Tết “Ngựa ô đón Tết – Rước lộc về dinh” chào xuân 2026',
    date: '30/01/2026',
    views: 911,
    author: 'Ban Thường Vụ',
    image: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=800',
    content: '<p>Trong không khí rộn ràng đón Tết, Công đoàn TDMU tổ chức Phiên chợ Tết với nhiều gian hàng ẩm thực, quà tết ưu đãi cho cán bộ, giảng viên và sinh viên có hoàn cảnh khó khăn.</p>'
  }
];

export default Home;
