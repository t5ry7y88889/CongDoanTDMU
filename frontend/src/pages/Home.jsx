import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import HeroCarousel from '../components/HeroCarousel';
import PaginationBar from '../components/PaginationBar';
import ArticleQuickModal from '../components/ArticleQuickModal';

const staticArticles = [
  {
    id: 1,
    title: 'Tọa đàm "Dinh dưỡng lành mạnh vì sức khỏe gia đình"',
    createdAt: '2026-06-26 12:56',
    viewsCount: 147,
    author: 'Ban Nữ công Công đoàn TDMU',
    categoryName: 'Hoạt Động Phong Trào',
    image: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800',
    summary: 'Hướng tới kỷ niệm Ngày Gia đình Việt Nam, Công đoàn Trường Đại học Thủ Dầu Một đã tổ chức tọa đàm với chủ đề "Dinh dưỡng lành mạnh vì sức khỏe gia đình"...',
    content: '<p>Tọa đàm thu hút đông đảo nữ cán bộ, giảng viên tham gia thảo luận về chế độ ăn uống khoa học và cân bằng cuộc sống.</p>'
  },
  {
    id: 2,
    title: 'Chào mừng Đại hội XIV Công đoàn Việt Nam nhiệm kỳ 2026 – 2031',
    createdAt: '2026-06-01 21:06',
    viewsCount: 140,
    author: 'Ban Thường Vụ',
    categoryName: 'Thông Báo Chỉ Đạo',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
    summary: 'Đại hội XIV Công đoàn Việt Nam là sự kiện chính trị quan trọng của giai cấp công nhân và tổ chức Công đoàn Việt Nam, đánh dấu giai đoạn phát triển mới...',
    content: '<p>Toàn thể đoàn viên TDMU ra sức thi đua lập thành tích xuất sắc chào mừng ngày hội lớn.</p>'
  },
  {
    id: 3,
    title: 'Đại học Thủ Dầu Một được tuyên dương điển hình tiên tiến trong học tập và làm theo Bác',
    createdAt: '2026-05-08 21:41',
    viewsCount: 306,
    author: 'Ban Tuyên giáo',
    categoryName: 'Gương Sáng Đoàn Viên',
    image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800',
    summary: 'Trường Đại học Thủ Dầu Một vinh dự được trao tặng Bằng khen dành cho tập thể điển hình tiên tiến có thành tích tiêu biểu giai đoạn 2021–2026...',
    content: '<p>Trường Đại học Thủ Dầu Một vinh dự được trao tặng Bằng khen khen thưởng giai đoạn 2021–2026.</p>'
  },
  {
    id: 4,
    title: 'Phiên chợ Tết "Ngựa ô đón Tết – Rước lộc về dinh" chào xuân 2026',
    createdAt: '2026-01-30 11:56',
    viewsCount: 911,
    author: 'Ban Thường Vụ',
    categoryName: 'Chăm Lo Đời Sống',
    image: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=800',
    summary: 'Trong không khí rộn ràng đón Tết, Công đoàn TDMU tổ chức Phiên chợ Tết với nhiều gian hàng ẩm thực, quà tết ưu đãi cho cán bộ, giảng viên và sinh viên...',
    content: '<p>Phiên chợ Tết với nhiều gian hàng ẩm thực, quà tết ưu đãi cho cán bộ, giảng viên và sinh viên có hoàn cảnh khó khăn.</p>'
  }
];

const staticDocs = [
  { id: 1, reference_number: '18/CV-CĐCS', title: 'Vận động ủng hộ đồng bào bị thiệt hại do bão số 3', category: 'tuyen-truyen', file_size: '1.2 MB' },
  { id: 2, reference_number: '1630/CV-BTG', title: 'Công văn triển khai Cuộc thi tìm hiểu Nghị quyết Đại hội Công đoàn', category: 'tuyen-truyen', file_size: '1.9 MB' },
  { id: 3, reference_number: '25/KH-CĐCS', title: 'Kế hoạch tổ chức giải Bóng đá truyền thống "Công đoàn trường ĐH Thủ Dầu Một"', category: 'ke-hoach', file_size: '3.1 MB' },
  { id: 4, reference_number: '12/2012/QH13', title: 'Luật Công đoàn 2012 - Quốc hội nước CHXHCN Việt Nam', category: 'luat', file_size: '650 KB' },
  { id: 5, reference_number: '82/QĐ-LĐLĐ', title: 'Quyết định thành lập Công đoàn cơ sở Trường Đại học Thủ Dầu Một', category: 'quyet-dinh', file_size: '850 KB' }
];

function formatDateTime(str) {
  if (!str) return 'Vừa cập nhật';
  const d = new Date(str.length <= 10 ? str + 'T00:00:00' : String(str).replace(' ', 'T'));
  if (isNaN(d.getTime())) return String(str).slice(0, 16);
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

const Home = () => {
  const [articles, setArticles] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(4);

  const [selectedArticle, setSelectedArticle] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetch('/api/articles?status=published')
      .then((r) => r.json())
      .then((data) => {
        if (data && data.data && Array.isArray(data.data) && data.data.length > 0) {
          setArticles(data.data);
        } else {
          setArticles(staticArticles);
        }
      })
      .catch(() => setArticles(staticArticles))
      .finally(() => setLoading(false));

    fetch('/api/documents')
      .then((r) => r.json())
      .then((data) => {
        if (data && data.data && Array.isArray(data.data) && data.data.length > 0) {
          setDocuments(data.data.slice(0, 5));
        }
      })
      .catch(() => {});
  }, []);

  const openQuickArticle = (art) => {
    setSelectedArticle(art);
    setIsModalOpen(true);
  };

  const startIndex = (currentPage - 1) * pageSize;
  const currentArticles = articles.slice(startIndex, startIndex + pageSize);
  const docList = documents.length > 0 ? documents : staticDocs;

  return (
    <>
      <HeroCarousel />

      <section className="my-3" id="tintuc">
        <div className="container">
          <div className="row g-4">
            <div className="col-lg-9">
              <div className="tieudelon">
                <span>
                  <i className="fa-solid fa-newspaper me-2"></i>
                  HOẠT ĐỘNG CÔNG ĐOÀN
                </span>
                <Link to="/tin-tuc" className="fw-bold" style={{ color: '#005696', textDecoration: 'none' }}>
                  Xem tất cả <i className="fa-solid fa-angle-right ms-1"></i>
                </Link>
              </div>

              <div className="row" id="article_container">
                {loading && currentArticles.length === 0 ? (
                  <div className="text-center py-4 text-muted">
                    <i className="fa-solid fa-circle-notch fa-spin me-2"></i>Đang tải tin tức...
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
                      <img
                        src={art.image || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500'}
                        className="new_item_img"
                        alt={art.title}
                        style={{ cursor: 'pointer' }}
                        onClick={() => openQuickArticle(art)}
                      />
                      <span className="new_item_time">
                        <i className="fa-regular fa-clock me-1"></i>
                        {formatDateTime(art.createdAt || art.published_at)} &nbsp;|&nbsp;
                        <i className="fa-regular fa-eye me-1"></i>
                        {art.viewsCount || art.views || 140} lượt xem
                      </span>
                      <span className="new_item_desc">
                        {art.summary ? (art.summary.length > 160 ? art.summary.slice(0, 160) + '...' : art.summary) : ''}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div id="home_articles_pagination" className="mt-3">
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
            </div>

            <div className="col-lg-3">
              <div className="panel-tdmu">
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
                  <a href="http://lib.tdmu.edu.vn/" target="_blank" rel="noreferrer" className="list-group-item">
                    <i className="fa-solid fa-chevron-right me-1 text-muted small"></i> TT Học Liệu ĐH Thủ Dầu Một
                  </a>
                  <a href="http://doanvien.congdoan.vn/VTBWebProject" target="_blank" rel="noreferrer" className="list-group-item">
                    <i className="fa-solid fa-chevron-right me-1 text-muted small"></i> Phần mềm quản lý đoàn viên
                  </a>
                </div>
              </div>

              <div className="panel-tdmu">
                <div className="panel-heading-tdmu">
                  <i className="fa-solid fa-chart-simple me-2 text-warning"></i>Thống kê truy cập
                </div>
                <div className="p-3" style={{ fontSize: '13px' }}>
                  <p className="mb-2">
                    <i className="fa-solid fa-users text-primary me-2"></i> Đang trực tuyến: <strong id="stat_online">12</strong>
                  </p>
                  <p className="mb-0">
                    <i className="fa-solid fa-eye text-success me-2"></i> Tổng lượt xem: <strong id="stat_views">811,221</strong>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="sectionTB">
        <div className="container">
          <div className="row g-4">
            <div className="col-lg-9">
              <div className="tieudelon-section">
                <i className="fa-solid fa-folder-open me-2 text-danger"></i>VĂN BẢN CHỈ ĐẠO &amp; ĐIỀU HÀNH
              </div>
              <div className="list-group-vb" id="home_documents_list">
                {docList.map((doc) => (
                  <Link to={`/van-ban#${doc.category || 'tuyen-truyen'}`} className="list-group-vb-item" key={doc.id}>
                    <span>
                      <i className="fa-regular fa-file-pdf text-danger me-2 fa-lg"></i>
                      <strong>[{doc.reference_number}]</strong> {doc.title}
                    </span>
                    <span className="badge bg-light text-primary border">
                      <i className="fa-solid fa-download me-1"></i>
                      {doc.file_size || '1.5 MB'}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

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

      <ArticleQuickModal article={selectedArticle} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};

export default Home;