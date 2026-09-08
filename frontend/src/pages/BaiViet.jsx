import React, { useEffect } from 'react';

const BaiViet = () => {
  const htmlContent = `<!-- Main Content Body -->
    <div class="container my-4">
      <div class="breadcrumb-box">
        <a href="index.html">Trang chủ</a> / <a href="tin-tuc.html">Tin tức &amp; Sự kiện</a> / <span class="text-muted" id="breadcrumbCategory">Hoạt động công đoàn</span>
      </div>

      <div class="row g-4">
        
        <!-- LEFT COLUMN (9 PHẦN): TOÀN VĂN BÀI BÁO PHÓNG KHOÁNG -->
        <div class="col-lg-9">
          <article class="article-main-container">
            
            <!-- Category Badge & Headline -->
            <div class="mb-2">
              <span class="badge" style="background: #002855; color: #FEF08A; font-weight: 700; font-size: 11.5px; padding: 6px 12px;" id="artCategory">
                HOẠT ĐỘNG CÔNG ĐOÀN
              </span>
            </div>
            <h1 class="article-headline" id="artTitle">
              Tọa đàm "Dinh dưỡng lành mạnh vì sức khỏe gia đình" lan tỏa giá trị xây dựng mái ấm hạnh phúc
            </h1>

            <!-- Meta Bar -->
            <div class="article-meta-bar">
              <div class="d-flex align-items-center gap-3">
                <span><i class="fa-solid fa-user-pen text-primary me-1"></i> <strong id="artAuthor">Ban Nữ công &amp; Ban Biên Tập</strong></span>
                <span><i class="fa-regular fa-calendar text-primary me-1"></i> <span id="artDate">26/06/2026 12:56</span></span>
              </div>
              <div class="d-flex align-items-center gap-3">
                <span><i class="fa-regular fa-clock me-1 text-warning"></i> <span id="artReadingTime">3 phút đọc</span></span>
                <span><i class="fa-regular fa-eye me-1 text-success"></i> <span id="artViews">162</span> lượt xem</span>
                <span><i class="fa-regular fa-comment-dots me-1 text-primary"></i> <span id="artCommentsCount">14</span> bình luận</span>
              </div>
            </div>

            <!-- AUDIO VOICE NARRATION PLAYER -->
            <div class="audio-narration-card">
              <div class="d-flex align-items-center gap-3">
                <button class="btn btn-primary rounded-circle" id="btnAudioArticle" onclick="toggleFullPageAudio()" style="width: 44px; height: 44px; background: #002855; border-color: #002855;">
                  <i class="fa-solid fa-play" id="audioArtIcon"></i>
                </button>
                <div>
                  <div class="fw-bold text-dark" id="audioArtTitle">Nghe Bản Tin Bằng Giọng Đọc AI</div>
                  <div class="text-muted small">Phát thanh tự động tiếng Việt chuẩn truyền cảm</div>
                </div>
              </div>
              <span class="badge bg-white text-primary border p-2"><i class="fa-solid fa-volume-high me-1"></i> Trực tuyến</span>
            </div>

            <!-- AI 30s KEY TAKEAWAYS -->
            <div class="ai-takeaways-card">
              <h6><i class="fa-solid fa-wand-magic-sparkles me-2 text-success"></i> AI 30s Key Takeaways (Tóm tắt nhanh)</h6>
              <ul class="mb-0 ps-3 text-secondary small" style="line-height: 1.6;" id="artTakeaways">
                <li>Hưởng ứng kỷ niệm 25 năm Ngày Gia đình Việt Nam (28/6/2001 – 28/6/2026).</li>
                <li>PGS.TS. Lê Tuấn Anh (Bí thư Đảng ủy) và TS. Lê Thị Kim Út (Chủ tịch CĐ) chủ trì tọa đàm.</li>
                <li>Chuyên gia Viện Y Dược TDMU chia sẻ giải pháp dinh dưỡng tăng cường đề kháng cho gia đình.</li>
              </ul>
            </div>

            <!-- Article Body Content -->
            <div class="article-content" id="artContent">
              <!-- Rendered dynamically -->
            </div>

            <!-- Engagement & Reaction Bar -->
            <div class="border-top border-bottom py-3 my-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
              <div class="d-flex gap-2">
                <button class="reaction-pill" id="btnLikeArt" onclick="toggleArtReaction('like')">
                  <i class="fa-solid fa-heart text-danger"></i> <span id="artLikeCount">128</span> Thích
                </button>
                <button class="reaction-pill" id="btnClapArt" onclick="toggleArtReaction('clap')">
                  <i class="fa-solid fa-hands-clapping text-warning"></i> <span id="artClapCount">64</span> Vỗ tay
                </button>
                <button class="reaction-pill" id="btnBookmarkArt" onclick="toggleArticleBookmark(currentArticle ? currentArticle.id : 1)">
                  <i class="fa-regular fa-bookmark text-primary"></i> Lưu đọc sau
                </button>
              </div>
              <div>
                <button class="btn btn-sm btn-outline-primary fw-bold" onclick="copyFullArticleLink()">
                  <i class="fa-solid fa-share-nodes me-1"></i> Chia sẻ bài viết
                </button>
              </div>
            </div>

            <!-- PHÂN HỆ BÌNH LUẬN & Ý KIẾN ĐOÀN VIÊN (COMMENTS SECTION) -->
            <section class="mt-4 pt-3" id="commentsSection">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h4 class="fw-bold m-0" style="color: #002855; font-size: 18px;">
                  <i class="fa-solid fa-comments text-primary me-2"></i> Ý Kiến &amp; Bình Luận Đoàn Viên (<span id="totalCommentsHeader">2</span>)
                </h4>
                <span class="text-muted small">Quy chế trao đổi văn minh &amp; xây dựng</span>
              </div>

                            <!-- Comment Input Box (Tự động nhận diện danh tính cán bộ từ hệ thống) -->
              <div class="p-3 bg-light rounded border mb-4 shadow-sm">
                <div class="d-flex align-items-center justify-content-between mb-2">
                  <div class="d-flex align-items-center gap-2">
                    <div class="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold" style="width: 32px; height: 32px; font-size: 12px;" id="userCommentAvatar">
                      U
                    </div>
                    <div style="font-size: 13px;">
                      Đang bình luận với tư cách: <strong class="text-primary" id="userCommentName">TS. Lê Thị Kim Út</strong>
                      <span class="badge bg-white text-secondary border ms-1" id="userCommentUnit">Tổ CĐ Viện Công nghệ số</span>
                    </div>
                  </div>
                  <span class="text-muted" style="font-size: 11px;"><i class="fa-solid fa-shield-halved text-success me-1"></i> Xác thực tài khoản TDMU</span>
                </div>
                <div class="mb-2">
                  <textarea id="inputCommentText" class="form-control" rows="3" placeholder="Nhập ý kiến thảo luận hoặc cảm nhận của bạn về bài viết này..." style="font-size: 13.5px;"></textarea>
                </div>
                <div class="d-flex justify-content-end">
                  <button class="btn btn-sm btn-primary fw-bold px-4 py-2" onclick="submitUserComment()" style="background: #002855; border-color: #002855; border-radius: 6px;">
                    <i class="fa-solid fa-paper-plane me-1 text-warning"></i> Gửi Bình Luận
                  </button>
                </div>
              </div>

              <!-- List of Comments -->
              <div id="commentsListContainer">
                <div class="d-flex gap-3 mb-3 p-3 bg-white border rounded shadow-sm">
                  <div class="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold" style="width: 42px; height: 42px; flex-shrink: 0;">
                    VL
                  </div>
                  <div class="flex-grow-1">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                      <div>
                        <strong class="text-dark">ThS. Võ Quốc Lương</strong>
                        <span class="badge bg-light text-primary border ms-2 small">Tổ CĐ Viện Công nghệ số</span>
                      </div>
                      <small class="text-muted"><i class="fa-regular fa-clock me-1"></i> 26/06/2026 14:20</small>
                    </div>
                    <p class="mb-0 text-secondary" style="font-size: 13.5px; line-height: 1.5;">
                      Chương trình tọa đàm rất bổ ích và thiết thực cho cán bộ giảng viên trong trường. Cảm ơn Ban Nữ công đã tổ chức chu đáo!
                    </p>
                  </div>
                </div>

                <div class="d-flex gap-3 mb-3 p-3 bg-white border rounded shadow-sm">
                  <div class="rounded-circle bg-success text-white d-flex align-items-center justify-content-center fw-bold" style="width: 42px; height: 42px; flex-shrink: 0;">
                    LK
                  </div>
                  <div class="flex-grow-1">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                      <div>
                        <strong class="text-dark">Đ/c Huỳnh Thị Lệ Kha</strong>
                        <span class="badge bg-light text-primary border ms-2 small">Tổ CĐ Trường Luật &amp; Quản lý</span>
                      </div>
                      <small class="text-muted"><i class="fa-regular fa-clock me-1"></i> 26/06/2026 15:05</small>
                    </div>
                    <p class="mb-0 text-secondary" style="font-size: 13.5px; line-height: 1.5;">
                      Nhiều kiến thức dinh dưỡng khoa học rất hữu ích để áp dụng vào bữa cơm gia đình hàng ngày. Mong Công đoàn tiếp tục duy trì các chuyên đề như thế này!
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <!-- Related Next Article -->
            <div class="p-3 bg-light rounded border mt-4">
              <div class="text-muted small fw-bold text-uppercase mb-2"><i class="fa-solid fa-arrow-right text-primary me-1"></i> Bài viết tiếp theo cùng chuyên mục:</div>
              <h5 class="fw-bold mb-1" id="nextArtTitle"><a href="bai-viet.html?id=2" class="text-decoration-none text-primary">Chào mừng Đại hội XIV Công đoàn Việt Nam nhiệm kỳ 2026 – 2031</a></h5>
              <div class="text-muted small">Phong trào thi đua | 4 phút đọc</div>
            </div>

          </article>
        </div>

        <!-- RIGHT COLUMN (3 PHẦN): SIDEBAR BÀI ĐỌC NHIỀU NHẤT -->
        <div class="col-lg-3">
          
          <!-- Sticky Widget: Bài đọc nhiều nhất -->
          <div class="panel-tdmu">
            <div class="panel-heading-tdmu"><i class="fa-solid fa-fire me-2 text-danger"></i>Đọc nhiều nhất</div>
            <div class="list-group-tdmu" id="popular_articles_sidebar">
              <!-- Rendered dynamically -->
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

        </div>

      </div>
    </div>
  </div>

  <!-- Footer (Chuẩn 2 Cột Thực Tế: Cơ Quan & Nhóm Đồ Án) -->
  

  
  
  
  

  <!-- OFFCANVAS TỦ SÁCH ĐỌC SAU (SAVED ARTICLES DRAWER) -->
  <div class="offcanvas offcanvas-end" tabindex="-1" id="bookmarksOffcanvas" style="width: 380px;">
    <div class="offcanvas-header" style="background: #002855; color: white;">
      <h5 class="offcanvas-title fw-bold" style="font-size: 16px;">
        <i class="fa-solid fa-bookmark text-warning me-2"></i> Tủ Sách Đọc Sau (<span class="bookmark-badge-count">2</span>)
      </h5>
      <button type="button" class="btn-close btn-close-white" data-bs-dismiss="offcanvas"></button>
    </div>
    <div class="offcanvas-body p-3 bg-light" id="bookmarksListContainerDrawer">
      <!-- Rendered dynamically from bookmarks.js -->
    </div>
    <div class="p-3 bg-white border-top text-center">
      <small class="text-muted"><i class="fa-solid fa-shield-halved text-success me-1"></i> Danh sách lưu trữ an toàn trên thiết bị của bạn</small>
    </div>
  </div>`;
  const pageScript = `let currentArticle = null;
    let isFullSpeaking = false;

    async function loadFullArticle() {
      const urlParams = new URLSearchParams(window.location.search);
      const articleId = urlParams.get('id') || 1;

      try {
        let a = null;
        let allArticlesList = [];

        // 1. Fetch single article directly
        try {
          const resSingle = await fetch('/api/articles/' + articleId).then(r => r.json());
          if (resSingle && resSingle.success && resSingle.data) {
            a = resSingle.data;
          }
        } catch (errSingle) {
          console.warn('Direct article fetch fallback:', errSingle);
        }

        // 2. Fetch all articles for sidebar & navigation
        try {
          const resList = (typeof API !== 'undefined' && API.getArticles)
            ? await API.getArticles('all')
            : await fetch('/api/articles?status=all').then(r => r.json());

          if (resList && resList.success && Array.isArray(resList.data)) {
            allArticlesList = resList.data;
            if (!a) {
              a = allArticlesList.find(item => item.id == articleId) || allArticlesList[0];
            }
          }
        } catch (errList) {
          console.warn('Articles list fetch notice:', errList);
        }

        if (a) {
          currentArticle = a;

          document.title = (a.title || a.TieuDe) + ' - Công Đoàn TDMU';
          const bcEl = document.getElementById('breadcrumbCategory');
          if (bcEl) bcEl.innerText = a.categoryName || a.ChuyenMuc || 'Tin tức';
          const catEl = document.getElementById('artCategory');
          if (catEl) catEl.innerText = (a.categoryName || a.ChuyenMuc || 'TIN TỨC').toUpperCase();
          const titleEl = document.getElementById('artTitle');
          if (titleEl) titleEl.innerText = a.title || a.TieuDe;
          const authorEl = document.getElementById('artAuthor');
          if (authorEl) authorEl.innerText = a.author || a.TacGia || 'Ban Tuyên giáo & Ban Biên Tập';
          const dateEl = document.getElementById('artDate');
          if (dateEl) dateEl.innerText = (a.createdAt || '2026-09-08');
          const timeEl = document.getElementById('artReadingTime');
          if (timeEl) timeEl.innerText = (a.readingTime || '3 phút') + ' đọc';
          const viewsEl = document.getElementById('artViews');
          if (viewsEl) viewsEl.innerText = a.viewsCount || a.LuotXem || 162;
          const commentsEl = document.getElementById('artCommentsCount');
          if (commentsEl) commentsEl.innerText = a.commentsCount || 14;

          const contentEl = document.getElementById('artContent');
          if (contentEl) {
            let bodyHtml = a.content || a.NoiDung || ('<p>' + (a.summary || a.TomTat || '') + '</p>');
            if (a.image && !bodyHtml.includes(a.image)) {
              bodyHtml = '<div class="text-center mb-4"><img src="' + a.image + '" class="img-fluid rounded shadow-sm" style="max-height: 480px; width: 100%; object-fit: cover;" alt="' + (a.title || '') + '"><p class="text-muted small mt-2 fst-italic">' + (a.title || '') + '</p></div>' + bodyHtml;
            }
            contentEl.innerHTML = bodyHtml;
          }

          const takeawaysEl = document.getElementById('artTakeaways');
          if (takeawaysEl) {
            if (a.ai_takeaways && Array.isArray(a.ai_takeaways) && a.ai_takeaways.length > 0) {
              takeawaysEl.innerHTML = a.ai_takeaways.map(t => '<li>' + t + '</li>').join('');
            } else if (a.summary) {
              takeawaysEl.innerHTML = '<li>' + a.summary + '</li>';
            }
          }

          // Render sidebar top articles
          const sideList = document.getElementById('popular_articles_sidebar');
          if (sideList && allArticlesList.length > 0) {
            sideList.innerHTML = allArticlesList.slice(0, 5).map(item => \`
              <a href="bai-viet.html?id=\${item.id}" class="list-group-item \${item.id == articleId ? 'fw-bold text-primary bg-light' : ''}">
                <i class="fa-solid fa-angle-right me-1 text-muted small"></i> \${item.title || item.TieuDe}
              </a>
            \`).join('');
          }

          // Next article
          const next = allArticlesList.find(item => item.id != articleId);
          const nextEl = document.getElementById('nextArtTitle');
          if (next && nextEl) {
            nextEl.innerHTML = '<a href="bai-viet.html?id=' + next.id + '" class="text-decoration-none text-primary">' + (next.title || next.TieuDe) + '</a>';
          }
        }
      } catch (e) {
        console.error('Lỗi tải bài viết chi tiết:', e);
      }
    }

    function toggleFullPageAudio() {
      if ('speechSynthesis' in window) {
        if (isFullSpeaking) {
          window.speechSynthesis.cancel();
          isFullSpeaking = false;
          document.getElementById('audioArtIcon').className = 'fa-solid fa-play';
          document.getElementById('audioArtTitle').innerText = 'Nghe Bản Tin Bằng Giọng Đọc AI';
        } else {
          const textToRead = document.getElementById('artTitle').innerText + '. ' + (currentArticle ? (currentArticle.summary || currentArticle.TomTat) : '');
          const utterance = new SpeechSynthesisUtterance(textToRead);
          utterance.lang = 'vi-VN';
          utterance.rate = 1.0;
          utterance.onend = () => {
            isFullSpeaking = false;
            document.getElementById('audioArtIcon').className = 'fa-solid fa-play';
            document.getElementById('audioArtTitle').innerText = 'Đã hoàn thành phát thanh';
          };
          window.speechSynthesis.speak(utterance);
          isFullSpeaking = true;
          document.getElementById('audioArtIcon').className = 'fa-solid fa-pause text-warning';
          document.getElementById('audioArtTitle').innerText = 'Đang phát thanh bản tin...';
        }
      } else {
        alert('Trình duyệt chưa hỗ trợ Web Speech API.');
      }
    }

    function toggleArtReaction(type) {
      if (type === 'like') {
        const btn = document.getElementById('btnLikeArt');
        const count = document.getElementById('artLikeCount');
        btn.classList.toggle('liked');
        count.innerText = parseInt(count.innerText) + (btn.classList.contains('liked') ? 1 : -1);
      } else if (type === 'clap') {
        const count = document.getElementById('artClapCount');
        count.innerText = parseInt(count.innerText) + 1;
      }
    }

    const currentLoggedUser = {
      name: 'TS. Lê Thị Kim Út',
      unit: 'Tổ CĐ Viện Công nghệ số',
      initials: 'KU',
      role: 'Chủ tịch Công đoàn'
    };

    function submitUserComment() {
      const text = document.getElementById('inputCommentText').value.trim();

      if (!text) {
        alert('Vui lòng nhập nội dung bình luận!');
        document.getElementById('inputCommentText').focus();
        return;
      }

      const list = document.getElementById('commentsListContainer');
      const now = new Date().toLocaleString('vi-VN');

      const newCommentEl = document.createElement('div');
      newCommentEl.className = 'd-flex gap-3 mb-3 p-3 bg-white border rounded shadow-sm';
      newCommentEl.innerHTML = \`
        <div class="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold" style="width: 42px; height: 42px; flex-shrink: 0;">
          \${currentLoggedUser.initials}
        </div>
        <div class="flex-grow-1">
          <div class="d-flex justify-content-between align-items-center mb-1">
            <div>
              <strong class="text-dark">\${currentLoggedUser.name}</strong>
              <span class="badge bg-light text-primary border ms-2 small">\${currentLoggedUser.unit}</span>
            </div>
            <small class="text-muted"><i class="fa-regular fa-clock me-1"></i> \${now}</small>
          </div>
          <p class="mb-0 text-secondary" style="font-size: 13.5px; line-height: 1.5;">
            \${text}
          </p>
        </div>
      \`;

      list.prepend(newCommentEl);
      document.getElementById('inputCommentText').value = '';
      const totalHeader = document.getElementById('totalCommentsHeader');
      totalHeader.innerText = parseInt(totalHeader.innerText) + 1;
      alert('Đã gửi ý kiến bình luận của bạn thành công!');
    }

    function copyFullArticleLink() {
      navigator.clipboard.writeText(window.location.href);
      alert('Đã sao chép liên kết bài viết vào bộ nhớ tạm!');
    }

    
    document.addEventListener('DOMContentLoaded', () => {
      loadFullArticle();
      const urlParams = new URLSearchParams(window.location.search);
      const articleId = urlParams.get('id') || 1;
      setTimeout(() => updateArticleBookmarkButtonState(articleId), 200);
    });`;

  useEffect(() => {
    if (pageScript) {
      try {
        // Run in global scope so functions attach to window for onclick handlers
        (0, eval)(pageScript);
        // Also trigger DOMContentLoaded logic manually if any
        window.dispatchEvent(new Event('DOMContentLoaded'));
      } catch (err) {
        console.warn('Inline page script notice for BaiViet:', err);
      }
    }
  }, []);

  return (
    <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
  );
};

export default BaiViet;
