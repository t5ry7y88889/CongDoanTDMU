/**
 * ============================================================================
 * File: public/js/auth-nav.js
 * Chức năng: Quản lý trạng thái đăng nhập toàn cục trên Header / Navbar
 *            Tự động hiển thị Avatar, Menu xổ xuống, Liên kết Hồ sơ cá nhân.
 *            Tải Menu điều hướng động từ CSDL MSSQL (dbo.NAVIGATION_MENUS)
 * ============================================================================
 */

function initAuthNav() {
  const token = localStorage.getItem('tdmu_token');
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem('tdmu_user') || 'null');
  } catch (e) {
    user = null;
  }

  // Tìm vị trí gắn Widget trên Navbar
  const navbarCollapse = document.getElementById('tdmuNavbar');
  if (!navbarCollapse) return;

  // Xóa widget cũ nếu có
  let existingWidget = document.getElementById('navAuthWidget');
  if (existingWidget) existingWidget.remove();

  const widget = document.createElement('div');
  widget.id = 'navAuthWidget';
  widget.className = 'd-flex align-items-center gap-2 ms-lg-2 my-2 my-lg-0';

  if (token && user) {
    const avatarUrl = user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200';
    const fullName = user.ho_ten || user.name || 'Đoàn viên TDMU';
    const role = (user.role || 'member').toLowerCase();
    const isCadre = (role === 'admin' || role === 'editor' || role === 'contributor');
    const roleTitle = role === 'admin' ? 'Quản Trị Viên' : (role === 'editor' ? 'Biên Tập Viên' : (role === 'contributor' ? 'Cộng Tác Viên' : 'Đoàn Viên'));

    widget.innerHTML = `
      <div class="dropdown">
        <a href="#" class="d-flex align-items-center text-white text-decoration-none dropdown-toggle py-1 px-2 rounded" id="userMenuDropdown" data-bs-toggle="dropdown" aria-expanded="false" style="background: rgba(255, 255, 255, 0.15); transition: background 0.2s;">
          <img src="${avatarUrl}" alt="${fullName}" width="30" height="30" class="rounded-circle me-2 border border-white" style="object-fit: cover;">
          <span class="d-none d-md-inline fw-semibold" style="font-size: 13.5px; max-width: 140px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${fullName}</span>
        </a>
        <ul class="dropdown-menu dropdown-menu-end shadow border-0 py-1" style="min-width: 220px; font-size: 13.5px; border-radius: 12px;">
          <li class="px-3 py-2 bg-light border-bottom">
            <div class="fw-bold text-dark text-truncate">${fullName}</div>
            <span class="badge bg-primary text-white" style="font-size: 10.5px;">${roleTitle}</span>
          </li>
          <li>
            <a class="dropdown-item py-2" href="/ho-so.html">
              <i class="fa-solid fa-id-card me-2 text-primary"></i> Hồ sơ cá nhân
            </a>
          </li>
          ${isCadre ? `
          <li>
            <a class="dropdown-item py-2" href="/admin.html">
              <i class="fa-solid fa-gauge-high me-2 text-warning"></i> Bàn làm việc Quản trị
            </a>
          </li>
          ` : ''}
          <li><hr class="dropdown-divider my-1"></li>
          <li>
            <a class="dropdown-item py-2 text-danger fw-semibold" href="javascript:void(0)" onclick="handleNavLogout()">
              <i class="fa-solid fa-arrow-right-from-bracket me-2"></i> Đăng xuất
            </a>
          </li>
        </ul>
      </div>
    `;
  } else {
    widget.innerHTML = `
      <a href="/dang-nhap.html" class="btn btn-warning btn-sm rounded-pill text-dark fw-bold px-3 d-flex align-items-center gap-1 shadow-sm">
        <i class="fa-solid fa-arrow-right-to-bracket"></i>
        <span>Đăng Nhập</span>
      </a>
    `;
  }

  navbarCollapse.appendChild(widget);
}

function handleNavLogout() {
  if (confirm('Bạn có chắc chắn muốn đăng xuất tài khoản?')) {
    localStorage.removeItem('tdmu_token');
    localStorage.removeItem('tdmu_user');
    localStorage.removeItem('tdmu_user_id');
    localStorage.removeItem('tdmu_user_name');
    window.location.reload();
  }
}

// ─── TỰ ĐỘNG NẠP MENU ĐIỀU HƯỚNG TỪ CSDL MSSQL (DBO.NAVIGATION_MENUS) ────────
async function initDynamicPortalMenu() {
  const navContainer = document.querySelector('#tdmuNavbar .navbar-nav');
  if (!navContainer) return;

  try {
    const res = await fetch('/api/navigation-menus').then(r => r.json());
    if (res.success && Array.isArray(res.data) && res.data.length > 0) {
      const currentPath = window.location.pathname;
      const currentFile = currentPath.substring(currentPath.lastIndexOf('/') + 1) || 'index.html';

      let html = '';
      res.data.forEach(m => {
        const isCurrent = (currentFile === m.url) || (currentFile === '' && m.url === 'index.html') || (m.url.replace('.html','') === currentFile.replace('.html',''));
        const activeClass = isCurrent ? 'active' : '';
        const targetAttr = m.targetBlank ? 'target="_blank"' : '';

        if (m.url === 'co-cau-to-chuc.html') {
          html += `
            <li class="nav-item dropdown">
              <a class="nav-link dropdown-toggle ${activeClass}" href="${m.url}" data-bs-toggle="dropdown">
                ${m.title}
              </a>
              <ul class="dropdown-menu">
                <li><a class="dropdown-item" href="co-cau-to-chuc.html?tab=ban-thuong-vu"><i class="fa-solid fa-caret-right me-1 text-primary"></i> Ban thường vụ</a></li>
                <li><a class="dropdown-item" href="co-cau-to-chuc.html?tab=ban-chap-hanh"><i class="fa-solid fa-caret-right me-1 text-primary"></i> Ban chấp hành</a></li>
                <li><a class="dropdown-item" href="co-cau-to-chuc.html?tab=uy-ban-kiem-tra"><i class="fa-solid fa-caret-right me-1 text-primary"></i> Ủy ban kiểm tra</a></li>
                <li><a class="dropdown-item" href="co-cau-to-chuc.html?tab=16-to-cong-doan"><i class="fa-solid fa-caret-right me-1 text-primary"></i> 16 Tổ công đoàn cơ sở</a></li>
              </ul>
            </li>
          `;
        } else if (m.url === 'van-ban.html') {
          html += `
            <li class="nav-item dropdown">
              <a class="nav-link dropdown-toggle ${activeClass}" href="van-ban.html" data-bs-toggle="dropdown">
                ${m.title}
              </a>
              <ul class="dropdown-menu">
                <li><a class="dropdown-item" href="van-ban.html#tuyen-truyen"><i class="fa-solid fa-caret-right me-1 text-primary"></i> Công văn tuyên truyền</a></li>
                <li><a class="dropdown-item" href="van-ban.html#ke-hoach"><i class="fa-solid fa-caret-right me-1 text-primary"></i> Kế hoạch hoạt động</a></li>
                <li><a class="dropdown-item" href="van-ban.html#luat"><i class="fa-solid fa-caret-right me-1 text-primary"></i> Văn bản luật</a></li>
                <li><a class="dropdown-item" href="van-ban.html#quyet-dinh"><i class="fa-solid fa-caret-right me-1 text-primary"></i> Quyết định</a></li>
              </ul>
            </li>
          `;
        } else {
          html += `
            <li class="nav-item"><a class="nav-link ${activeClass}" href="${m.url}" ${targetAttr}>${m.title}</a></li>
          `;
        }
      });

      navContainer.innerHTML = html;
    }
  } catch (err) {
    console.warn('Sử dụng menu tĩnh fallback do không tải được menu động:', err.message);
  }
}

async function loadGlobalRealtimeStats() {
  const onlineEl = document.getElementById('stat_online');
  const viewsEl = document.getElementById('stat_views');
  if (!onlineEl && !viewsEl) return;

  try {
    await fetch('/api/stats/ping', { method: 'POST' }).catch(() => {});
    const res = await fetch('/api/stats/realtime').then(r => r.json());
    if (res.success) {
      if (onlineEl) onlineEl.innerText = res.online || 1;
      if (viewsEl) viewsEl.innerText = (res.totalViews || 0).toLocaleString('vi-VN');
    }
  } catch (err) {
    console.warn('Lỗi cập nhật thống kê thời gian thực:', err.message);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initAuthNav();
  initDynamicPortalMenu();
  loadGlobalRealtimeStats();
});
