import React, { useEffect } from 'react';

const BieuMau = () => {
  const htmlContent = `<div class="container my-3">
    <div class="breadcrumb-box"><a href="index.html">Trang chủ</a> / <span class="text-muted">Kho biểu mẫu</span></div>
    <div class="row g-4">
      <div class="col-lg-9">
        <div class="content-box">
          <div class="tieudelon"><i class="fa-solid fa-file-word me-2"></i>KHO BIỂU MẪU NGHIỆP VỤ CÔNG ĐOÀN TDMU</div>
          
          <div class="p-3 border rounded mb-3 d-flex justify-content-between align-items-center bg-white shadow-sm">
            <div class="d-flex align-items-center gap-3">
              <i class="fa-regular fa-file-word text-primary fa-2x"></i>
              <div>
                <h6 class="fw-bold mb-1">BM-01/CĐ: Phiếu Lý Lịch &amp; Đơn Xin Gia Nhập Công Đoàn TDMU</h6>
                <small class="text-muted">Dành cho Cán bộ, Giảng viên mới tuyển dụng gia nhập tổ chức công đoàn</small>
              </div>
            </div>
            <a href="uploads/templates/BM_01_Don_Gia_Nhap_Cong_Doan.docx" class="btn-portal-access"><i class="fa-solid fa-download me-1"></i> Tải về (.docx)</a>
          </div>

          <div class="p-3 border rounded mb-3 d-flex justify-content-between align-items-center bg-white shadow-sm">
            <div class="d-flex align-items-center gap-3">
              <i class="fa-regular fa-file-word text-primary fa-2x"></i>
              <div>
                <h6 class="fw-bold mb-1">BM-02/CĐ: Mẫu Báo Cáo Hoạt Động Định Kỳ Tháng của Tổ Công Đoàn</h6>
                <small class="text-muted">Biểu mẫu chuẩn hóa dành cho 16 Tổ công đoàn cơ sở</small>
              </div>
            </div>
            <a href="uploads/templates/BM_02_Mau_Bao_Cao_Thang_To_Cong_Doan.docx" class="btn-portal-access"><i class="fa-solid fa-download me-1"></i> Tải về (.docx)</a>
          </div>

          <div class="p-3 border rounded mb-3 d-flex justify-content-between align-items-center bg-white shadow-sm">
            <div class="d-flex align-items-center gap-3">
              <i class="fa-regular fa-file-word text-primary fa-2x"></i>
              <div>
                <h6 class="fw-bold mb-1">BM-03/CĐ: Đơn Đề Nghị Hỗ Trợ Chăm Lo Khó Khăn &amp; Bệnh Hiểm Nghèo</h6>
                <small class="text-muted">Hồ sơ xét duyệt trợ cấp Quỹ tương thân tương ái Công đoàn TDMU</small>
              </div>
            </div>
            <a href="uploads/templates/BM_03_Don_Ho_Tro_Kho_Khan.docx" class="btn-portal-access"><i class="fa-solid fa-download me-1"></i> Tải về (.docx)</a>
          </div>

          <div class="p-3 border rounded mb-3 d-flex justify-content-between align-items-center bg-white shadow-sm">
            <div class="d-flex align-items-center gap-3">
              <i class="fa-regular fa-file-word text-primary fa-2x"></i>
              <div>
                <h6 class="fw-bold mb-1">BM-04/CĐ: Phiếu Đánh Giá &amp; Xếp Loại Đoàn Viên Cuối Năm</h6>
                <small class="text-muted">Dùng cho công tác bình bầu thi đua và khen thưởng cán bộ đoàn viên</small>
              </div>
            </div>
            <a href="uploads/templates/BM_04_Danh_Gia_Xep_Loai.docx" class="btn-portal-access"><i class="fa-solid fa-download me-1"></i> Tải về (.docx)</a>
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
        console.warn('Inline page script notice for BieuMau:', err);
      }
    }
  }, []);

  return (
    <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
  );
};

export default BieuMau;
