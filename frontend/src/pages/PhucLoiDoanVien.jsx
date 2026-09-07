import React, { useEffect } from 'react';

const PhucLoiDoanVien = () => {
  const htmlContent = `<!-- Main Content Body -->
    <div class="container my-3">
      <div class="breadcrumb-box"><a href="index.html">Trang chủ</a> / <span class="text-muted">Chính sách chăm lo &amp; Phúc lợi đoàn viên</span></div>
      
      <div class="row g-4">
        <!-- LEFT COLUMN: DANH SÁCH CHƯƠNG TRÌNH PHÚC LỢI (NỐI TỪ CSDL) -->
        <div class="col-lg-9">
          <div class="content-box mb-4">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <div class="tieudelon mb-0">
                <span><i class="fa-solid fa-hand-holding-heart text-danger me-2"></i>CHÍNH SÁCH CHĂM LO &amp; PHÚC LỢI ĐOÀN VIÊN TDMU</span>
              </div>
              <button class="btn btn-sm btn-primary fw-bold" onclick="openApplyModal()">
                <i class="fa-solid fa-file-pen me-1"></i> Gửi Đơn Đề Nghị Trợ Cấp
              </button>
            </div>
            
            <p class="text-muted small mb-4">Hệ thống các chương trình phúc lợi, trợ cấp khó khăn và chăm lo đời sống vật chất, tinh thần được lưu trữ và xét duyệt trực tiếp trên Cơ sở dữ liệu Công đoàn Trường.</p>

            <div class="row g-3" id="welfareGridContainer">
              <div class="text-center py-4 text-muted"><i class="fa-solid fa-spinner fa-spin me-2"></i> Đang tải dữ liệu chính sách từ CSDL...</div>
            </div>
          </div>
        </div>

        <!-- RIGHT COLUMN: LIÊN KẾT & QUY MÔ -->
        <div class="col-lg-3">
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

          <div class="panel-tdmu">
            <div class="panel-heading-tdmu"><i class="fa-solid fa-shield-heart me-2 text-danger"></i>Quỹ tương trợ CĐ</div>
            <div class="p-3" style="font-size: 13px;">
              <p class="mb-2"><i class="fa-solid fa-check text-success me-2"></i> Trợ cấp ốm đau: <strong>100% hồ sơ</strong></p>
              <p class="mb-2"><i class="fa-solid fa-check text-success me-2"></i> Thăm hỏi thai sản: <strong>Kịp thời</strong></p>
              <p class="mb-0"><i class="fa-solid fa-check text-success me-2"></i> Khám sức khỏe: <strong>Định kỳ hàng năm</strong></p>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>

  <!-- MODAL NỘP ĐƠN ĐỀ NGHỊ TRỢ CẤP TRỰC TUYẾN -->
  <div class="modal fade" id="applyWelfareModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content" style="border-radius: 12px; overflow: hidden; border: 1px solid var(--border-subtle);">
        <div class="modal-header text-white" style="background: #002855;">
          <h5 class="modal-title fw-bold" style="font-size: 16px;">
            <i class="fa-solid fa-file-signature text-warning me-2"></i> ĐƠN ĐỀ NGHỊ TRỢ CẤP / CHĂM LO PHÚC LỢI
          </h5>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
        </div>
        <form id="welfareForm" onsubmit="submitWelfareApplication(event)">
          <div class="modal-body p-4 bg-light">
            <div class="mb-3">
              <label class="form-label fw-bold small text-secondary">Họ và Tên Cán bộ / Đoàn viên (*):</label>
              <input type="text" class="form-control" id="appFullName" value="TS. Lê Thị Kim Út" required>
            </div>
            <div class="mb-3">
              <label class="form-label fw-bold small text-secondary">Đơn vị / Tổ Công đoàn (*):</label>
              <input type="text" class="form-control" id="appUnit" value="Phòng Quản lý Khoa học" required>
            </div>
            <div class="row g-2 mb-3">
              <div class="col-6">
                <label class="form-label fw-bold small text-secondary">Số điện thoại (*):</label>
                <input type="tel" class="form-control" id="appPhone" value="0918.370.363" required>
              </div>
              <div class="col-6">
                <label class="form-label fw-bold small text-secondary">Email liên hệ (*):</label>
                <input type="email" class="form-control" id="appEmail" value="utltk@tdmu.edu.vn" required>
              </div>
            </div>
            <div class="mb-3">
              <label class="form-label fw-bold small text-secondary">Loại hình đề nghị trợ cấp (*):</label>
              <select class="form-select" id="appType" required>
                <option value="Trợ cấp khó khăn đột xuất">Trợ cấp khó khăn đột xuất</option>
                <option value="Thăm hỏi ốm đau / phẫu thuật">Thăm hỏi ốm đau / phẫu thuật</option>
                <option value="Chăm lo thai sản / nữ công">Chăm lo thai sản / nữ công</option>
                <option value="Hỗ trợ thân nhân gia đình khó khăn">Hỗ trợ thân nhân gia đình khó khăn</option>
              </select>
            </div>
            <div class="mb-3">
              <label class="form-label fw-bold small text-secondary">Số tiền đề nghị (VNĐ):</label>
              <input type="number" class="form-control" id="appAmount" value="2000000" step="500000">
            </div>
            <div class="mb-3">
              <label class="form-label fw-bold small text-secondary">Lý do &amp; Hoàn cảnh cụ thể (*):</label>
              <textarea class="form-control" id="appReason" rows="3" placeholder="Mô tả tóm tắt hoàn cảnh để Ban Thường Vụ xem xét..." required></textarea>
            </div>
          </div>
          <div class="modal-footer bg-white py-2">
            <button type="button" class="btn btn-sm btn-secondary" data-bs-dismiss="modal">Hủy bỏ</button>
            <button type="submit" class="btn btn-sm btn-primary fw-bold" id="btnSubmitWelfare">
              <i class="fa-solid fa-paper-plane me-1"></i> Gửi Đơn Tới Ban Thường Vụ
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <!-- Footer -->`;
  const pageScript = `async function loadWelfarePrograms() {
      try {
        const res = await fetch('/api/welfare');
        const json = await res.json();
        const container = document.getElementById('welfareGridContainer');
        if (!json.success || !json.data || !json.data.length) {
          container.innerHTML = '<div class="col-12 text-center text-muted">Chưa có chương trình phúc lợi nào.</div>';
          return;
        }

        container.innerHTML = json.data.map(p => \`
          <div class="col-md-6">
            <div class="welfare-card">
              <div>
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <span class="badge bg-light text-\${p.color} border"><i class="fa-solid \${p.icon} me-1"></i> \${p.code}</span>
                  <span class="welfare-badge-budget">\${p.budget_range}</span>
                </div>
                <h6 class="fw-bold text-primary mb-2" style="font-size: 15px;">\${p.title}</h6>
                <p class="small text-muted mb-2">\${p.description}</p>
              </div>
              <div class="border-top pt-2 mt-2 text-secondary small d-flex justify-content-between align-items-center">
                <span><i class="fa-solid fa-users text-primary me-1"></i> Đối tượng: <strong>\${p.target}</strong></span>
              </div>
            </div>
          </div>
        \`).join('');
      } catch (err) {
        console.error('Error loading welfare programs:', err);
      }
    }

    function openApplyModal() {
      const m = new bootstrap.Modal(document.getElementById('applyWelfareModal'));
      m.show();
    }

    async function submitWelfareApplication(e) {
      e.preventDefault();
      const btn = document.getElementById('btnSubmitWelfare');
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-1"></i> Đang gửi...';

      const payload = {
        full_name: document.getElementById('appFullName').value,
        unit: document.getElementById('appUnit').value,
        phone: document.getElementById('appPhone').value,
        email: document.getElementById('appEmail').value,
        type: document.getElementById('appType').value,
        amount_requested: document.getElementById('appAmount').value,
        reason: document.getElementById('appReason').value
      };

      try {
        const res = await fetch('/api/welfare/apply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (json.success) {
          alert('✅ ' + json.message);
          bootstrap.Modal.getInstance(document.getElementById('applyWelfareModal')).hide();
          document.getElementById('welfareForm').reset();
        } else {
          alert('❌ ' + json.error);
        }
      } catch (err) {
        alert('❌ Lỗi kết nối máy chủ!');
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-paper-plane me-1"></i> Gửi Đơn Tới Ban Thường Vụ';
      }
    }

    document.addEventListener('DOMContentLoaded', loadWelfarePrograms);`;

  useEffect(() => {
    if (pageScript) {
      try {
        // Run in global scope so functions attach to window for onclick handlers
        (0, eval)(pageScript);
        // Also trigger DOMContentLoaded logic manually if any
        window.dispatchEvent(new Event('DOMContentLoaded'));
      } catch (err) {
        console.warn('Inline page script notice for PhucLoiDoanVien:', err);
      }
    }
  }, []);

  return (
    <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
  );
};

export default PhucLoiDoanVien;
