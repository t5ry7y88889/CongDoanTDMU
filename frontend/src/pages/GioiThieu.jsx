import React, { useEffect } from 'react';

const GioiThieu = () => {
  const htmlContent = `<div class="container my-3">
    <div class="breadcrumb-box"><a href="index.html">Trang chủ</a> / <span class="text-muted">Giới thiệu</span></div>
    <div class="row g-4">
      <div class="col-lg-9">
        <div class="content-box">
          <div class="tieudelon"><i class="fa-solid fa-circle-info me-2"></i>QUÁ TRÌNH HÌNH THÀNH &amp; PHÁT TRIỂN</div>
          <p class="lead" style="font-size: 15px; font-weight: 600; color: #003865;">Công đoàn cơ sở Trường Đại học Thủ Dầu Một là tổ chức chính trị - xã hội của cán bộ, giảng viên, nhân viên và người lao động thuộc Trường Đại học Thủ Dầu Một, chịu sự lãnh đạo toàn diện của Đảng ủy Trường và sự chỉ đạo của Liên đoàn Lao động Tỉnh Bình Dương.</p>
          
          <h5 class="fw-bold mt-4 text-primary"><i class="fa-solid fa-bullseye me-2"></i>I. TÔN CHỈ &amp; MỤC ĐÍCH</h5>
          <p>Đại diện, bảo vệ quyền, lợi ích hợp pháp, chính đáng của đoàn viên và người lao động; tham gia quản lý, thanh tra, kiểm tra, giám sát hoạt động của Nhà trường; tuyên truyền, vận động người lao động học tập, nâng cao trình độ, kỹ năng nghề nghiệp, chấp hành pháp luật, xây dựng và bảo vệ Tổ quốc.</p>

          <h5 class="fw-bold mt-4 text-primary"><i class="fa-solid fa-award me-2"></i>II. THÀNH TÍCH ĐẠT ĐƯỢC</h5>
          <ul>
            <li>Cờ thi đua xuất sắc của Tổng Liên đoàn Lao động Việt Nam nhiều năm liền.</li>
            <li>Bằng khen của Ủy ban Nhân dân Tỉnh Bình Dương về thành tích xuất sắc trong phong trào thi đua Lao động giỏi - Lao động sáng tạo.</li>
            <li>100% Tổ Công đoàn đạt danh hiệu Hoàn thành tốt và Hoàn thành xuất sắc nhiệm vụ.</li>
          </ul>
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

  <!-- Footer -->
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
  const pageScript = ``;

  useEffect(() => {
    if (pageScript) {
      try {
        // Run in global scope so functions attach to window for onclick handlers
        (0, eval)(pageScript);
        // Also trigger DOMContentLoaded logic manually if any
        window.dispatchEvent(new Event('DOMContentLoaded'));
      } catch (err) {
        console.warn('Inline page script notice for GioiThieu:', err);
      }
    }
  }, []);

  return (
    <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
  );
};

export default GioiThieu;
