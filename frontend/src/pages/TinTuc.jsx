import React, { useEffect } from 'react';

const TinTuc = () => {
  const htmlContent = `<!-- Main Content Body -->
    <div class="container my-3">
      <div class="breadcrumb-box"><a href="index.html">Trang chủ</a> / <span class="text-muted">Tạp chí Tin tức &amp; Sự kiện</span></div>
      
      <!-- BỘ LỌC CHUYÊN MỤC & THANH TÌM KIẾM BÀI VIẾT -->
      <div class="content-box mb-4 py-3">
        <div class="row g-3 align-items-center">
          <div class="col-lg-8">
            <div class="doc-filter-bar mb-0 border-0 pb-0" id="articleCategoryFilter">
              <button class="doc-tab-btn active" onclick="filterArticles('all', this)"><i class="fa-solid fa-newspaper text-primary"></i> Tất cả tin tức</button>
              <button class="doc-tab-btn" onclick="filterArticles('Hoạt động công đoàn', this)"><i class="fa-solid fa-users text-primary"></i> Hoạt động CĐ</button>
              <button class="doc-tab-btn" onclick="filterArticles('Phong trào thi đua', this)"><i class="fa-solid fa-trophy text-warning"></i> Phong trào thi đua</button>
              <button class="doc-tab-btn" onclick="filterArticles('Chăm lo đời sống', this)"><i class="fa-solid fa-heart-pulse text-danger"></i> Chăm lo đời sống</button>
              <button class="doc-tab-btn" onclick="filterArticles('Văn hóa - Thể thao', this)"><i class="fa-solid fa-futbol text-success"></i> Văn hóa - Thể thao</button>
              <button class="doc-tab-btn" onclick="filterArticles('saved', this)"><i class="fa-solid fa-bookmark text-danger"></i> Đã lưu (<span class="bookmark-badge-count">2</span>)</button>
            </div>
          </div>
          <div class="col-lg-4">
            <div class="position-relative">
              <i class="fa-solid fa-magnifying-glass position-absolute text-muted" style="left: 14px; top: 12px;"></i>
              <input type="text" id="articleSearchInput" class="form-control" style="border-radius: 20px; padding-left: 38px; font-size: 13px; border: 1px solid #CBD5E1;" placeholder="Tìm kiếm bài viết, tác giả..." oninput="handleSearchArticles()">
            </div>
          </div>
        </div>
      </div>

      <div class="row g-4">
        <!-- LEFT COLUMN (9 PHẦN): FEED TẠP CHÍ QUỐC TẾ -->
        <div class="col-lg-9">
          
          <!-- BÀI BÁO TIÊU ĐIỂM HERO (CLICK MỞ THẲNG BAI-VIET.HTML?ID=1) -->
          <div class="news-hero-headline" id="featured_hero_article" onclick="window.location.href='bai-viet.html?id=1'" title="Bấm vào để đọc toàn văn bài viết">
            <div class="row g-0">
              <div class="col-md-7">
                <div class="hero-img-wrap">
                  <img src="https://tdmu.edu.vn/hinh/thuvien/hinhanh/DSC02559(1).JPG" class="hero-img" id="hero_img" alt="Tiêu điểm">
                  <div class="live-reader-badge">
                    <span class="live-dot"></span> <span id="hero_live_readers">24 cán bộ đang đọc</span>
                  </div>
                </div>
              </div>
              <div class="col-md-5 p-4 d-flex flex-column justify-content-between">
                <div>
                  <div class="d-flex align-items-center gap-2 mb-2">
                    <span class="badge" style="background: #002855; color: #FEF08A; font-weight: 700; font-size: 11px;">TIÊU ĐIỂM HÔM NAY</span>
                    <span class="text-muted small"><i class="fa-regular fa-clock me-1"></i> <span id="hero_time">3 phút đọc</span></span>
                  </div>
                  <h3 class="fw-bold mt-1" style="font-size: 18px; line-height: 1.45; color: #002855;" id="hero_title">
                    Tọa đàm "Dinh dưỡng lành mạnh vì sức khỏe gia đình" lan tỏa giá trị xây dựng mái ấm hạnh phúc
                  </h3>
                  
                  <!-- AI 30s Takeaways -->
                  <div class="ai-takeaway-box">
                    <div class="ai-takeaway-title">
                      <i class="fa-solid fa-bolt text-warning"></i> Điểm Nhấn Bản Tin (30 Giây)
                    </div>
                    <ul class="ai-takeaway-list" id="hero_takeaways">
                      <li>Hưởng ứng kỷ niệm 25 năm Ngày Gia đình Việt Nam (28/6/2001 – 28/6/2026).</li>
                      <li>PGS.TS. Lê Tuấn Anh và TS. Lê Thị Kim Út chủ trì tọa đàm.</li>
                    </ul>
                  </div>
                </div>

                <div>
                  <div class="d-flex justify-content-between align-items-center text-muted small mb-3 border-top pt-2">
                    <div class="d-flex align-items-center gap-3">
                      <span><i class="fa-regular fa-calendar me-1 text-primary"></i> <span id="hero_date">26/06/2026</span></span>
                      <span><i class="fa-regular fa-eye text-success me-1"></i> <strong id="hero_views">450</strong></span>
                      <span><i class="fa-regular fa-comment-dots text-primary me-1"></i> <strong id="hero_comments">14</strong> bình luận</span>
                    </div>
                    <span class="text-primary fw-bold" id="hero_author">Ban Nữ công</span>
                  </div>
                  <button class="btn btn-sm btn-primary w-100 fw-bold py-2" style="background: #002855; border-color: #002855; border-radius: 6px;">
                    <i class="fa-solid fa-book-open-reader me-2 text-warning"></i> ĐỌC TOÀN VĂN BÀI VIẾT
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- LƯỚI TẠP CHÍ CÁC BÀI VIẾT (MAGAZINE GRID) -->
          <div class="row g-3" id="magazine_grid_container">
            <!-- Rendered dynamically -->
          </div>
        </div>

        <!-- RIGHT COLUMN (3 PHẦN): WIDGET THÔNG MINH -->
        <div class="col-lg-3">
          <!-- Widget Chủ Đề Thịnh Hành (Trending Tags) -->
          <div class="panel-tdmu">
            <div class="panel-heading-tdmu"><i class="fa-solid fa-fire me-2 text-danger"></i>Chủ đề thịnh hành</div>
            <div class="p-3 d-flex flex-wrap gap-2">
              <span class="badge bg-light text-primary border" style="cursor: pointer;" onclick="filterArticles('Hoạt động công đoàn')">#DinhDuongGiaDinh</span>
              <span class="badge bg-light text-primary border" style="cursor: pointer;" onclick="filterArticles('Phong trào thi đua')">#DaiHoiXIVCongDoan</span>
              <span class="badge bg-light text-primary border" style="cursor: pointer;" onclick="filterArticles('Phong trào thi đua')">#HocTapTheoBac</span>
              <span class="badge bg-light text-primary border" style="cursor: pointer;" onclick="filterArticles('Văn hóa - Thể thao')">#GiaiBongDaTDMU</span>
              <span class="badge bg-light text-primary border" style="cursor: pointer;" onclick="filterArticles('Chăm lo đời sống')">#TetTrungThu2026</span>
            </div>
          </div>

          <!-- Widget Liên Kết -->
          <div class="panel-tdmu">
            <div class="panel-heading-tdmu"><i class="fa-solid fa-link me-2 text-primary"></i>Liên kết website</div>
            <div class="list-group-tdmu">
              <a href="http://tdmu.edu.vn/" target="_blank" class="list-group-item"><i class="fa-solid fa-chevron-right me-1 text-muted small"></i> Đại học Thủ Dầu Một</a>
              <a href="http://danguy.tdmu.edu.vn/" target="_blank" class="list-group-item"><i class="fa-solid fa-chevron-right me-1 text-muted small"></i> Đảng Bộ Đại học TDMU</a>
              <a href="http://www.congdoan.vn" target="_blank" class="list-group-item"><i class="fa-solid fa-chevron-right me-1 text-muted small"></i> Tổng LĐLĐ Việt Nam</a>
              <a href="http://congdoanbinhduong.org.vn/" target="_blank" class="list-group-item"><i class="fa-solid fa-chevron-right me-1 text-muted small"></i> LĐLĐ Tỉnh Bình Dương</a>
              <a href="http://lib.tdmu.edu.vn/" target="_blank" class="list-group-item"><i class="fa-solid fa-chevron-right me-1 text-muted small"></i> TT Học Liệu ĐH TDMU</a>
            </div>
          </div>

          <!-- Thống Kê -->
          <div class="panel-tdmu">
            <div class="panel-heading-tdmu"><i class="fa-solid fa-chart-simple me-2 text-warning"></i>Thống kê tương tác</div>
            <div class="p-3" style="font-size: 13px;">
              <p class="mb-2"><i class="fa-solid fa-heart text-danger me-2"></i> Lượt thả tim: <strong>3,890</strong></p>
              <p class="mb-0"><i class="fa-solid fa-eye text-success me-2"></i> Tổng lượt xem: <strong>811,221</strong></p>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>

  <!-- Footer (Chuẩn 2 Cột Thực Tế: Cơ Quan & Nhóm Đồ Án) -->`;
  const pageScript = `let allArticles = [];
    let currentCategory = 'all';

    async function loadArticlesFeed() {
      const container = document.getElementById('magazine_grid_container');
      if (container) {
        container.innerHTML = '<div class="col-12 text-center p-4"><i class="fa-solid fa-spinner fa-spin fa-2x text-primary"></i><p class="mt-2 text-muted">Đang nạp dữ liệu tạp chí từ CSDL SQL Server...</p></div>';
      }

      try {
        const res = (typeof API !== 'undefined' && API.getArticles)
          ? await API.getArticles('all', 'published')
          : await fetch('/api/articles?status=published').then(r => r.json());

        if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
          allArticles = res.data;

          // BINDING HERO ARTICLE DYNAMICALLY
          const hero = allArticles[0];
          const heroEl = document.getElementById('featured_hero_article');
          if (hero && heroEl) {
            const heroImg = document.getElementById('hero_img');
            if (heroImg && hero.image) heroImg.src = hero.image;
            const heroTitle = document.getElementById('hero_title');
            if (heroTitle) heroTitle.innerText = hero.title;
            const heroTime = document.getElementById('hero_time');
            if (heroTime) heroTime.innerText = (hero.readingTime || '3 phút') + ' đọc';
            const heroDate = document.getElementById('hero_date');
            if (heroDate) heroDate.innerText = (hero.createdAt || '').split(' ')[0] || '2026-09-08';
            const heroViews = document.getElementById('hero_views');
            if (heroViews) heroViews.innerText = hero.viewsCount || 160;
            const heroComments = document.getElementById('hero_comments');
            if (heroComments) heroComments.innerText = hero.commentsCount || 8;
            const heroAuthor = document.getElementById('hero_author');
            if (heroAuthor) heroAuthor.innerText = hero.author || 'Ban Thường vụ';

            heroEl.onclick = function() { window.location.href = 'bai-viet.html?id=' + hero.id; };

            const heroTakeaways = document.getElementById('hero_takeaways');
            if (heroTakeaways) {
              if (hero.ai_takeaways && Array.isArray(hero.ai_takeaways) && hero.ai_takeaways.length > 0) {
                heroTakeaways.innerHTML = hero.ai_takeaways.map(t => '<li>' + t + '</li>').join('');
              } else if (hero.summary) {
                heroTakeaways.innerHTML = '<li>' + hero.summary + '</li>';
              }
            }
          }

          renderMagazineGrid();
        } else if (container) {
          container.innerHTML = '<div class="col-12 text-center p-5 text-muted"><i class="fa-solid fa-inbox fa-3x mb-3 text-secondary"></i><p>Chưa có bài viết nào được xuất bản.</p></div>';
        }
      } catch (e) {
        console.error('Lỗi tải tin tức:', e);
        if (container) container.innerHTML = '<div class="alert alert-warning text-center">Không thể kết nối danh mục bài viết từ máy chủ.</div>';
      }
    }

    function renderMagazineGrid() {
      const container = document.getElementById('magazine_grid_container');
      if (!container) return;
      let filtered = allArticles;

      if (currentCategory === 'saved') {
        const savedIds = typeof getSavedArticleIds === 'function' ? getSavedArticleIds() : [];
        filtered = filtered.filter(a => savedIds.includes(parseInt(a.id)));
      } else if (currentCategory !== 'all') {
        filtered = filtered.filter(a => (a.categoryName || a.ChuyenMuc) === currentCategory);
      }

      const qInput = document.getElementById('articleSearchInput');
      const q = (qInput ? qInput.value : '').toLowerCase().trim();
      if (q) {
        filtered = filtered.filter(a => (a.title || '').toLowerCase().includes(q) || (a.summary || '').toLowerCase().includes(q));
      } else if (currentCategory === 'all' && filtered.length > 1) {
        // Exclude hero article from repeating below if displaying 'all' feed
        filtered = filtered.slice(1);
      }

      if (filtered.length === 0) {
        container.innerHTML = '<div class="col-12 text-center p-5 text-muted"><i class="fa-solid fa-inbox fa-3x mb-3 text-secondary"></i><p>Không tìm thấy bài viết nào trong chuyên mục này.</p></div>';
        return;
      }

      container.innerHTML = filtered.map(a => \`
        <div class="col-md-6">
          <div class="magazine-card" onclick="window.location.href='bai-viet.html?id=\${a.id}'" title="Bấm vào để đọc toàn văn bài viết">
            <div class="magazine-thumb-wrap">
              <img src="\${a.image || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500'}" class="magazine-thumb" alt="\${a.title}">
              <div class="position-absolute bottom-0 start-0 m-2">
                <span class="badge" style="background: rgba(0,40,85,0.88); color:#FEF08A; font-weight:700; font-size:11px;">
                  \${a.categoryName || a.ChuyenMuc || 'Tin tức'}
                </span>
              </div>
            </div>
            
            <div class="p-3 d-flex flex-column justify-content-between flex-grow-1">
              <div>
                <h4 class="fw-bold" style="font-size: 15px; line-height: 1.45; color: #002855; margin-bottom: 8px;">
                  \${a.title}
                </h4>
                <p class="text-muted small mb-3" style="line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                  \${a.summary || ''}
                </p>
              </div>

              <!-- THANH SỐ LIỆU ĐỒNG NHẤT 100% (NGÀY ĐĂNG + LƯỢT XEM + BÌNH LUẬN + BAN/TỔ) -->
              <div class="d-flex justify-content-between align-items-center text-muted small border-top pt-2 mt-auto">
                <div class="d-flex align-items-center gap-3">
                  <span title="Ngày đăng"><i class="fa-regular fa-calendar text-primary me-1"></i> \${(a.createdAt || '26/08/2026').split(' ')[0]}</span>
                  <span title="Lượt xem"><i class="fa-regular fa-eye text-success me-1"></i> \${a.viewsCount || 160}</span>
                  <span title="Bình luận"><i class="fa-regular fa-comment-dots text-primary me-1"></i> \${a.commentsCount || 8} bình luận</span>
                </div>
                <span class="text-primary fw-bold" style="font-size: 12px;">
                  \${a.author || a.TacGia || 'Ban Thường vụ'}
                </span>
              </div>
            </div>
          </div>
        </div>
      \`).join('');
    }

    function filterArticles(cat, btn) {
      currentCategory = cat;
      document.querySelectorAll('#articleCategoryFilter button').forEach(b => b.classList.remove('active'));
      if (btn) btn.classList.add('active');
      renderMagazineGrid();
    }

    function handleSearchArticles() {
      renderMagazineGrid();
    }

    document.addEventListener('DOMContentLoaded', loadArticlesFeed);`;

  useEffect(() => {
    if (pageScript) {
      try {
        // Run in global scope so functions attach to window for onclick handlers
        (0, eval)(pageScript);
        // Also trigger DOMContentLoaded logic manually if any
        window.dispatchEvent(new Event('DOMContentLoaded'));
      } catch (err) {
        console.warn('Inline page script notice for TinTuc:', err);
      }
    }
  }, []);

  return (
    <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
  );
};

export default TinTuc;
