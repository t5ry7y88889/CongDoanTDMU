import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  const [articles, setArticles] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Fetch Articles from SQL Server
    fetch('/api/articles?status=published')
      .then(r => r.json())
      .then(data => {
        if (data && data.data && data.data.length > 0) {
          setArticles(data.data.slice(0, 6));
        }
      })
      .catch(err => console.warn("Fetch articles notice:", err))
      .finally(() => setLoading(false));

    // 2. Fetch Documents from SQL Server
    fetch('/api/documents')
      .then(r => r.json())
      .then(data => {
        if (data && data.data && data.data.length > 0) {
          setDocuments(data.data.slice(0, 5));
        }
      })
      .catch(err => console.warn("Fetch documents notice:", err));
  }, []);

  return (
    <>
      {/* Section Hero Carousel */}
      <section id="sectionslide" className="my-3">
        <div className="container">
          <div id="heroCarousel" className="carousel slide shadow-sm" data-bs-ride="carousel">
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
                  <h5 className="fw-bold text-warning">CHĂM LO ĐỜI SỐNG & BẢO VỆ QUYỀN LỢI ĐOÀN VIÊN</h5>
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

      {/* Main Content: Tin Tức & Liên Kết */}
      <section className="my-3" id="tintuc">
        <div className="container">
          <div className="row g-4">
            {/* LEFT COLUMN: HOẠT ĐỘNG CÔNG ĐOÀN */}
            <div className="col-lg-9">
              <div className="tieudelon d-flex align-items-center justify-content-between">
                <div>
                  <span><i className="fa-solid fa-newspaper me-2"></i>HOẠT ĐỘNG CÔNG ĐOÀN</span>
                  <span className="badge bg-success text-white ms-2" style={{ fontSize: '11px', fontWeight: '500' }}>
                    <i className="fa-solid fa-database me-1"></i> MSSQL Live
                  </span>
                </div>
                <a href="/tin-tuc.html" className="fw-bold" style={{ color: '#005696', textDecoration: 'none' }}>
                  Xem tất cả <i className="fa-solid fa-angle-right ms-1"></i>
                </a>
              </div>

              <div className="row" id="article_container">
                {articles.length > 0 ? (
                  articles.map(art => (
                    <div className="col-md-6 new_item" key={art.id}>
                      <h3 className="new_item_title"><a href={`/bai-viet.html?id=${art.id}`}>{art.title}</a></h3>
                      <img src={art.image || 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=500'} className="new_item_img" alt={art.title} />
                      <span className="new_item_time">
                        <i className="fa-regular fa-clock me-1"></i> {art.createdAt ? art.createdAt.slice(0, 16) : 'Vừa cập nhật'} &nbsp;|&nbsp; 
                        <i className="fa-regular fa-eye me-1"></i> {art.viewsCount || 0} lượt xem &nbsp;|&nbsp; 
                        <span className="badge bg-light text-primary border">{art.categoryName || 'Tin tức'}</span>
                      </span>
                      <span className="new_item_desc">{art.summary ? (art.summary.length > 180 ? art.summary.slice(0, 180) + '...' : art.summary) : ''}</span>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="col-md-6 new_item">
                      <h3 className="new_item_title"><a href="#">Tọa đàm "Dinh dưỡng lành mạnh vì sức khỏe gia đình"</a></h3>
                      <img src="https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=500" className="new_item_img" alt="Tin 1" />
                      <span className="new_item_time"><i className="fa-regular fa-clock me-1"></i> 26/06/2026 12:56 &nbsp;|&nbsp; <i className="fa-regular fa-eye me-1"></i> 147 lượt xem</span>
                      <span className="new_item_desc">Hướng tới kỷ niệm Ngày Gia đình Việt Nam, Công đoàn Trường Đại học Thủ Dầu Một đã tổ chức tọa đàm với chủ đề "Dinh dưỡng lành mạnh vì sức khỏe gia đình"...</span>
                    </div>
                    <div className="col-md-6 new_item">
                      <h3 className="new_item_title"><a href="#">Chào mừng Đại hội XIV Công đoàn Việt Nam nhiệm kỳ 2026 – 2031</a></h3>
                      <img src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500" className="new_item_img" alt="Tin 2" />
                      <span className="new_item_time"><i className="fa-regular fa-clock me-1"></i> 01/06/2026 21:06 &nbsp;|&nbsp; <i className="fa-regular fa-eye me-1"></i> 140 lượt xem</span>
                      <span className="new_item_desc">Đại hội XIV Công đoàn Việt Nam là sự kiện chính trị quan trọng của giai cấp công nhân và tổ chức Công đoàn Việt Nam...</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: LIÊN KẾT WEBSITE */}
            <div className="col-lg-3">
              <div className="panel-tdmu">
                <div className="panel-heading-tdmu"><i className="fa-solid fa-link me-2 text-primary"></i>Liên kết website</div>
                <div className="list-group-tdmu">
                  <a href="http://tdmu.edu.vn/" target="_blank" rel="noreferrer" className="list-group-item"><i className="fa-solid fa-chevron-right me-1 text-muted small"></i> Đại học Thủ Dầu Một</a>
                  <a href="http://danguy.tdmu.edu.vn/" target="_blank" rel="noreferrer" className="list-group-item"><i className="fa-solid fa-chevron-right me-1 text-muted small"></i> Đảng Bộ Đại học Thủ Dầu Một</a>
                  <a href="http://www.congdoan.vn" target="_blank" rel="noreferrer" className="list-group-item"><i className="fa-solid fa-chevron-right me-1 text-muted small"></i> Tổng LĐLĐ Việt Nam</a>
                  <a href="http://congdoanbinhduong.org.vn/" target="_blank" rel="noreferrer" className="list-group-item"><i className="fa-solid fa-chevron-right me-1 text-muted small"></i> LĐLĐ Tỉnh Bình Dương</a>
                  <a href="http://lib.tdmu.edu.vn/" target="_blank" rel="noreferrer" className="list-group-item"><i className="fa-solid fa-chevron-right me-1 text-muted small"></i> TT Học Liệu ĐH Thủ Dầu Một</a>
                  <a href="http://doanvien.congdoan.vn/VTBWebProject" target="_blank" rel="noreferrer" className="list-group-item"><i className="fa-solid fa-chevron-right me-1 text-muted small"></i> Phần mềm quản lý đoàn viên</a>
                </div>
              </div>

              {/* Thống Kê Truy Cập Widget */}
              <div className="panel-tdmu">
                <div className="panel-heading-tdmu"><i className="fa-solid fa-chart-simple me-2 text-warning"></i>Thống kê truy cập</div>
                <div className="p-3" style={{ fontSize: '13px' }}>
                  <p className="mb-2"><i className="fa-solid fa-users text-primary me-2"></i> Đang trực tuyến: <strong>12</strong></p>
                  <p className="mb-0"><i className="fa-solid fa-eye text-success me-2"></i> Tổng lượt xem: <strong>811,221</strong></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section VĂN BẢN */}
      <section id="sectionTB">
        <div className="container">
          <div className="row g-4">
            <div className="col-lg-9">
              <div className="tieudelon-section">
                <i className="fa-solid fa-folder-open me-2 text-danger"></i>VĂN BẢN CHỈ ĐẠO & ĐIỀU HÀNH
              </div>
              <div className="list-group-vb">
                {documents.length > 0 ? (
                  documents.map(doc => (
                    <a href={`/van-ban.html#${doc.loai_van_ban || 'all'}`} className="list-group-vb-item" key={doc.id}>
                      <span>
                        <i className="fa-regular fa-file-pdf text-danger me-2 fa-lg"></i> 
                        <strong>[{doc.so_hieu}]</strong> {doc.tieu_de}
                      </span>
                      <span className="badge bg-light text-primary border">
                        <i className="fa-solid fa-download me-1"></i> {doc.dung_luong || '1.5 MB'}
                      </span>
                    </a>
                  ))
                ) : (
                  <>
                    <a href="/van-ban.html#tuyen-truyen" className="list-group-vb-item">
                      <span><i className="fa-regular fa-file-pdf text-danger me-2 fa-lg"></i> <strong>[18/CV-CĐCS]</strong> Vận động ủng hộ đồng bào bị thiệt hại do bão số 3</span>
                      <span className="badge bg-light text-primary border"><i className="fa-solid fa-download me-1"></i> 1.2 MB</span>
                    </a>
                    <a href="/van-ban.html#ke-hoach" className="list-group-vb-item">
                      <span><i className="fa-regular fa-file-pdf text-danger me-2 fa-lg"></i> <strong>[25/KH-CĐCS]</strong> Kế hoạch tổ chức giải Bóng đá truyền thống "Công đoàn trường ĐH Thủ Dầu Một"</span>
                      <span className="badge bg-light text-primary border"><i className="fa-solid fa-download me-1"></i> 3.1 MB</span>
                    </a>
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
    </>
  );
};

export default Home;
