import React, { useEffect } from 'react';

const VanBan = () => {
  const htmlContent = `<!-- Main Body -->
    <div class="container my-3">
      <div class="breadcrumb-box"><a href="index.html">Trang chủ</a> / <span class="text-muted">Văn bản chỉ đạo</span></div>
      <div class="row g-4">
        <div class="col-lg-9">
          <div class="content-box">
            <div class="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
              <div class="tieudelon m-0"><i class="fa-solid fa-folder-open me-2 text-danger"></i>VĂN BẢN CHỈ ĐẠO &amp; ĐIỀU HÀNH</div>
              <!-- Ô TÌM KIẾM VĂN BẢN -->
              <div class="input-group" style="max-width: 320px;">
                <span class="input-group-text bg-white border-end-0 text-muted"><i class="fa-solid fa-magnifying-glass"></i></span>
                <input type="text" id="docSearchInput" class="form-control border-start-0 ps-0" placeholder="Tìm số hiệu, trích yếu..." oninput="handleDocSearch(this.value)">
              </div>
            </div>
            
            <!-- Category Tabs Pill Format (Không bị lùn hay nhảy chữ) -->
            <div class="doc-filter-bar" id="docCategoryTabs">
              <button class="doc-tab-btn active" onclick="filterDocs('all', this)"><i class="fa-solid fa-list"></i> Tất cả (<span id="count_all">0</span>)</button>
              <button class="doc-tab-btn" onclick="filterDocs('tuyentruyen', this)"><i class="fa-solid fa-bullhorn text-warning"></i> Tuyên truyền (<span id="count_tuyentruyen">0</span>)</button>
              <button class="doc-tab-btn" onclick="filterDocs('kehoach', this)"><i class="fa-solid fa-calendar-check text-success"></i> Kế hoạch (<span id="count_kehoach">0</span>)</button>
              <button class="doc-tab-btn" onclick="filterDocs('luat', this)"><i class="fa-solid fa-scale-balanced text-primary"></i> Văn bản luật (<span id="count_luat">0</span>)</button>
              <button class="doc-tab-btn" onclick="filterDocs('quyetdinh', this)"><i class="fa-solid fa-stamp text-danger"></i> Quyết định (<span id="count_quyetdinh">0</span>)</button>
            </div>

            <div id="document_list_container">
              <!-- Rendered dynamically -->
            </div>
          </div>
        </div>

        <!-- RIGHT COLUMN (3 PHẦN): LIÊN KẾT WEBSITE -->
        <div class="col-lg-3">
          <div class="panel-tdmu">
            <div class="panel-heading-tdmu"><i class="fa-solid fa-link me-2 text-primary"></i>Liên kết website</div>
            <div class="list-group-tdmu">
              <a href="http://tdmu.edu.vn/" target="_blank" class="list-group-item"><i class="fa-solid fa-chevron-right me-1 text-muted small"></i> Đại học Thủ Dầu Một</a>
              <a href="http://danguy.tdmu.edu.vn/" target="_blank" class="list-group-item"><i class="fa-solid fa-chevron-right me-1 text-muted small"></i> Đảng Bộ Đại học Thủ Dầu Một</a>
              <a href="http://www.congdoan.vn" target="_blank" class="list-group-item"><i class="fa-solid fa-chevron-right me-1 text-muted small"></i> Tổng LĐLĐ Việt Nam</a>
              <a href="http://congdoanbinhduong.org.vn/" target="_blank" class="list-group-item"><i class="fa-solid fa-chevron-right me-1 text-muted small"></i> LĐLĐ Tỉnh Bình Dương</a>
              <a href="http://lib.tdmu.edu.vn/" target="_blank" class="list-group-item"><i class="fa-solid fa-chevron-right me-1 text-muted small"></i> TT Học Liệu ĐH Thủ Dầu Một</a>
              <a href="http://doanvien.congdoan.vn/VTBWebProject" target="_blank" class="list-group-item"><i class="fa-solid fa-chevron-right me-1 text-muted small"></i> Phần mềm quản lý đoàn viên</a>
            </div>
          </div>

          <!-- Thống Kê Truy Cập Widget -->
          <div class="panel-tdmu">
            <div class="panel-heading-tdmu"><i class="fa-solid fa-chart-simple me-2 text-warning"></i>Thống kê truy cập</div>
            <div class="p-3" style="font-size: 13px;">
              <p class="mb-2"><i class="fa-solid fa-users text-primary me-2"></i> Đang trực tuyến: <strong>12</strong></p>
              <p class="mb-0"><i class="fa-solid fa-eye text-success me-2"></i> Tổng lượt xem: <strong>811,221</strong></p>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>

  <!-- MODAL XEM TRƯỚC VĂN BẢN (CHÍNH THỨC CHUẨN NGHỊ ĐỊNH 30) -->
  <div class="modal fade" id="modalDocPreview" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-centered">
      <div class="modal-content shadow-lg border-0">
        <div class="modal-header text-white" style="background: #002855;">
          <h5 class="modal-title fs-6 fw-bold" id="docModalTitle">
            <i class="fa-solid fa-file-lines text-warning me-2"></i>Chi Tiết Văn Bản Chỉ Đạo
          </h5>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body p-4 bg-light">
          <!-- KHUNG MÔ PHỎNG VĂN BẢN QUY PHẠM / HÀNH CHÍNH CHUẨN -->
          <div class="bg-white p-4 border rounded shadow-sm" style="min-height: 380px;">
            <div class="row text-center mb-4 pb-3 border-bottom">
              <div class="col-6">
                <div class="fw-bold text-uppercase" id="docModalOrg" style="font-size: 13px; color: #002855;">BAN THƯỜNG VỤ CÔNG ĐOÀN TDMU</div>
                <div class="text-danger fw-semibold mt-1" id="docModalNumber" style="font-size: 13px;">Số: 18/CV-CĐCS</div>
              </div>
              <div class="col-6">
                <div class="fw-bold text-uppercase" style="font-size: 13px;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                <div class="fw-bold text-decoration-underline" style="font-size: 12px;">Độc lập - Tự do - Hạnh phúc</div>
                <div class="fst-italic text-muted mt-1" id="docModalDate" style="font-size: 12px;">Bình Dương, ngày 15 tháng 8 năm 2026</div>
              </div>
            </div>

            <h5 class="text-center fw-bold my-3 text-primary" id="docModalHeading" style="line-height: 1.4;">
              Về việc vận động ủng hộ đồng bào bị thiệt hại do bão lũ
            </h5>

            <div class="mt-4 p-3 bg-light rounded border">
              <h6 class="fw-bold text-secondary mb-2" style="font-size: 13px;"><i class="fa-solid fa-circle-info me-1"></i> Trích yếu nội dung:</h6>
              <div id="docModalSummary" style="font-size: 14px; line-height: 1.7; color: #334155;">
                Nội dung văn bản...
              </div>
            </div>

            <div class="row mt-4 pt-3">
              <div class="col-6">
                <div class="small fw-bold text-muted">Nơi nhận:</div>
                <ul class="small text-muted ps-3 mb-0" style="font-size: 12px;">
                  <li>Đảng ủy Trường (để b/c);</li>
                  <li>Ban Giám hiệu (để phối hợp);</li>
                  <li>16 Tổ Công đoàn bộ phận;</li>
                  <li>Lưu: VT, CĐCS.</li>
                </ul>
              </div>
              <div class="col-6 text-center">
                <div class="fw-bold text-uppercase" style="font-size: 13px;">TM. BAN THƯỜNG VỤ</div>
                <div class="fw-semibold text-primary mt-1" style="font-size: 12px;">CHỦ TỊCH</div>
                <div style="height: 50px;"></div>
                <div class="fw-bold" id="docModalSigner" style="color: #002855;">TS. Lê Thị Kim Út</div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer bg-white">
          <button type="button" class="btn btn-secondary btn-sm px-3" data-bs-dismiss="modal">Đóng</button>
          <a id="docModalDownloadBtn" href="#" download class="btn btn-primary btn-sm px-4 fw-bold">
            <i class="fa-solid fa-file-pdf me-1 text-warning"></i> Tải File Văn Bản (.PDF)
          </a>
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
  const pageScript = `let allDocuments = [];
    let currentCategory = 'all';
    let currentSearchTerm = '';

    async function loadPortalDocuments() {
      const container = document.getElementById('document_list_container');
      container.innerHTML = '<div class="text-center p-4"><i class="fa-solid fa-spinner fa-spin me-2 text-primary"></i> Đang nạp danh mục văn bản chỉ đạo...</div>';
      try {
        const res = await API.getDocuments('all');
        if (res.success && Array.isArray(res.data)) {
          allDocuments = res.data;
          updateCategoryBadgeCounts();
          checkUrlHash();
          applyFilterAndSearch();
        }
      } catch (err) {
        console.error('Lỗi nạp văn bản:', err);
        container.innerHTML = '<div class="alert alert-danger m-3"><i class="fa-solid fa-triangle-exclamation me-2"></i> Không thể kết nối cơ sở dữ liệu văn bản!</div>';
      }
    }

    function updateCategoryBadgeCounts() {
      document.getElementById('count_all').innerText = allDocuments.length;
      document.getElementById('count_tuyentruyen').innerText = allDocuments.filter(d => (d.loai_van_ban || d.LoaiVanBan) === 'tuyentruyen').length;
      document.getElementById('count_kehoach').innerText = allDocuments.filter(d => (d.loai_van_ban || d.LoaiVanBan) === 'kehoach').length;
      document.getElementById('count_luat').innerText = allDocuments.filter(d => (d.loai_van_ban || d.LoaiVanBan) === 'luat').length;
      document.getElementById('count_quyetdinh').innerText = allDocuments.filter(d => (d.loai_van_ban || d.LoaiVanBan) === 'quyetdinh').length;
    }

    function renderDocs(docs) {
      const container = document.getElementById('document_list_container');
      if (!docs || docs.length === 0) {
        container.innerHTML = \`
          <div class="text-center p-5 text-muted">
            <i class="fa-solid fa-folder-open fa-3x mb-3 text-secondary opacity-50"></i>
            <h6 class="fw-bold">Không tìm thấy văn bản nào phù hợp</h6>
            <small>Vui lòng thử chọn danh mục khác hoặc xóa từ khóa tìm kiếm</small>
          </div>
        \`;
        return;
      }

      container.innerHTML = docs.map(d => {
        const title = d.tieu_de || d.TieuDe || d.TenVanBan || 'Văn bản chỉ đạo';
        const soHieu = d.so_hieu || d.SoHieuVanBan || (d.id ? \`\${d.id}/CĐCS\` : 'Văn bản');
        const coQuan = d.co_quan_ban_hanh || d.CoQuanBanHanh || 'Ban Thường Vụ Công Đoàn TDMU';
        const ngay = d.ngay_ban_hanh || d.NgayBanHanh || '2026-08-15';
        const dungLuong = d.dung_luong || d.DungLuong || '1.5 MB';
        const fileUrl = d.file_url || d.FileUrl || '#';
        const luotTai = d.luot_tai || d.LuotTai || 0;
        const moTa = d.mo_ta || d.MoTa || '';
        const rawJson = encodeURIComponent(JSON.stringify(d));

        return \`
          <div class="doc-card-item">
            <div class="d-flex align-items-center gap-3 flex-grow-1 me-3">
              <i class="fa-regular fa-file-pdf text-danger fa-2x flex-shrink-0"></i>
              <div>
                <div class="doc-card-title cursor-pointer" onclick="openDocPreviewModal('\${rawJson}')" style="cursor: pointer;">
                  <span class="badge bg-primary-subtle text-primary border me-1">\${soHieu}</span> \${title}
                </div>
                <div class="doc-card-meta">
                  <i class="fa-regular fa-building me-1"></i> \${coQuan} &nbsp;|&nbsp; 
                  <i class="fa-regular fa-calendar me-1"></i> \${ngay} &nbsp;|&nbsp; 
                  <i class="fa-solid fa-download me-1 text-muted"></i> \${luotTai} lượt tải
                </div>
                \${moTa ? \`<div class="small text-muted mt-1" style="font-size: 12px; line-height: 1.4;">\${moTa}</div>\` : ''}
              </div>
            </div>
            <div class="d-flex gap-2 align-items-center flex-shrink-0">
              <button type="button" class="btn btn-sm btn-outline-primary" onclick="openDocPreviewModal('\${rawJson}')" title="Xem chi tiết nội dung văn bản">
                <i class="fa-solid fa-eye me-1"></i> Xem
              </button>
              <a href="\${fileUrl}" download class="btn-doc-download" title="Tải văn bản PDF">
                <i class="fa-solid fa-download me-1"></i> Tải về (\${dungLuong})
              </a>
            </div>
          </div>
        \`;
      }).join('');
    }

    function filterDocs(cat, btn) {
      currentCategory = cat;
      document.querySelectorAll('#docCategoryTabs button').forEach(b => b.classList.remove('active'));
      if (btn) btn.classList.add('active');
      applyFilterAndSearch();
    }

    function handleDocSearch(term) {
      currentSearchTerm = (term || '').trim().toLowerCase();
      applyFilterAndSearch();
    }

    function applyFilterAndSearch() {
      let filtered = allDocuments;

      if (currentCategory !== 'all') {
        filtered = filtered.filter(d => {
          const loai = (d.loai_van_ban || d.LoaiVanBan || '').toLowerCase();
          return loai === currentCategory;
        });
      }

      if (currentSearchTerm) {
        filtered = filtered.filter(d => {
          const text = [
            d.so_hieu, d.SoHieuVanBan,
            d.tieu_de, d.TieuDe,
            d.co_quan_ban_hanh, d.CoQuanBanHanh,
            d.mo_ta, d.MoTa
          ].filter(Boolean).join(' ').toLowerCase();
          return text.includes(currentSearchTerm);
        });
      }

      renderDocs(filtered);
    }

    function checkUrlHash() {
      const rawHash = (window.location.hash || '').replace('#', '').toLowerCase();
      const hashMap = {
        'tuyen-truyen': 'tuyentruyen',
        'tuyentruyen': 'tuyentruyen',
        'ke-hoach': 'kehoach',
        'kehoach': 'kehoach',
        'luat': 'luat',
        'quyet-dinh': 'quyetdinh',
        'quyetdinh': 'quyetdinh'
      };
      const cat = hashMap[rawHash];
      if (cat) {
        currentCategory = cat;
        document.querySelectorAll('#docCategoryTabs button').forEach(b => {
          if (b.getAttribute('onclick') && b.getAttribute('onclick').includes(\`'\${cat}'\`)) {
            b.classList.add('active');
          } else {
            b.classList.remove('active');
          }
        });
      }
    }

    function openDocPreviewModal(rawJson) {
      try {
        const d = JSON.parse(decodeURIComponent(rawJson));
        const soHieu = d.so_hieu || d.SoHieuVanBan || 'Số: ...';
        const title = d.tieu_de || d.TieuDe || 'Văn bản chỉ đạo';
        const coQuan = d.co_quan_ban_hanh || d.CoQuanBanHanh || 'BAN THƯỜNG VỤ CÔNG ĐOÀN TDMU';
        const ngay = d.ngay_ban_hanh || d.NgayBanHanh || '2026-08-15';
        const nguoiKy = d.nguoi_ky || d.NguoiKy || 'TS. Lê Thị Kim Út';
        const moTa = d.mo_ta || d.MoTa || 'Văn bản chỉ đạo và điều hành của Công đoàn cơ sở Trường Đại học Thủ Dầu Một ban hành và triển khai đến các cấp công đoàn bộ phận.';
        const fileUrl = d.file_url || d.FileUrl || '#';

        document.getElementById('docModalTitle').innerHTML = \`<i class="fa-solid fa-file-lines text-warning me-2"></i>[\${soHieu}] \${title}\`;
        document.getElementById('docModalOrg').innerText = coQuan;
        document.getElementById('docModalNumber').innerText = \`Số: \${soHieu}\`;
        document.getElementById('docModalHeading').innerText = title;
        document.getElementById('docModalSummary').innerText = moTa;
        document.getElementById('docModalSigner').innerText = nguoiKy;

        // Parse date for formal format
        try {
          const parts = ngay.split('-');
          if (parts.length === 3) {
            document.getElementById('docModalDate').innerText = \`Bình Dương, ngày \${parts[2]} tháng \${parts[1]} năm \${parts[0]}\`;
          } else {
            document.getElementById('docModalDate').innerText = \`Bình Dương, ngày \${ngay}\`;
          }
        } catch (e) {
          document.getElementById('docModalDate').innerText = \`Bình Dương, \${ngay}\`;
        }

        const dlBtn = document.getElementById('docModalDownloadBtn');
        if (dlBtn) dlBtn.href = fileUrl;

        const modalEl = document.getElementById('modalDocPreview');
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
      } catch (err) {
        console.error('Lỗi mở modal:', err);
      }
    }

    window.addEventListener('hashchange', () => {
      checkUrlHash();
      applyFilterAndSearch();
    });

    document.addEventListener('DOMContentLoaded', loadPortalDocuments);`;

  useEffect(() => {
    if (pageScript) {
      try {
        // Run in global scope so functions attach to window for onclick handlers
        (0, eval)(pageScript);
        // Also trigger DOMContentLoaded logic manually if any
        window.dispatchEvent(new Event('DOMContentLoaded'));
      } catch (err) {
        console.warn('Inline page script notice for VanBan:', err);
      }
    }
  }, []);

  return (
    <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
  );
};

export default VanBan;
