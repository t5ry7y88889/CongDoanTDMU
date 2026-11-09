/**
 * ADMIN SETTINGS & BANNER MANAGEMENT MODULE
 * Trường Đại học Thủ Dầu Một - Công đoàn Cơ sở
 * Cung cấp toàn quyền quản trị: Banners, Thông báo nhanh, Liên kết ngoài, Danh mục, Cấu hình chung
 */

let currentSettingsSubTab = 'banners';
let cachedBanners = [];
let cachedNotices = [];
let cachedLinks = [];
let cachedCategories = [];
let cachedSettings = {};

// =========================================================================
// 1. CHUYỂN ĐỔI SUB-TABS TRONG PHÂN HỆ CẤU HÌNH
// =========================================================================
function switchSettingsSubTab(subTab) {
  currentSettingsSubTab = subTab;
  
  const subTabs = ['banners', 'notices', 'links', 'categories', 'general'];
  subTabs.forEach(tab => {
    const btn = document.getElementById(`btn_subtab_${tab}`);
    const section = document.getElementById(`subtab_${tab}_section`);
    if (btn) {
      if (tab === subTab) {
        btn.classList.add('active');
        btn.style.background = '#002855';
        btn.style.color = '#FFFFFF';
        btn.style.borderColor = '#002855';
      } else {
        btn.classList.remove('active');
        btn.style.background = '#FFFFFF';
        btn.style.color = '#475569';
        btn.style.borderColor = '#CBD5E1';
      }
    }
    if (section) {
      section.style.display = (tab === subTab) ? 'block' : 'none';
    }
  });

  if (subTab === 'banners') loadSettingsBanners();
  if (subTab === 'notices') loadSettingsNotices();
  if (subTab === 'links') loadSettingsLinks();
  if (subTab === 'categories') loadSettingsCategories();
  if (subTab === 'general') loadSettingsGeneral();
}

function loadAdminSettings() {
  switchSettingsSubTab(currentSettingsSubTab || 'banners');
}

// =========================================================================
// 2. BANNERS TRANG CHỦ
// =========================================================================
async function loadSettingsBanners() {
  const container = document.getElementById('settings_banners_list');
  if (!container) return;
  container.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted"><i class="fa-solid fa-spinner fa-spin me-2"></i>Đang tải danh sách banner...</td></tr>';

  try {
    const res = await fetch('/api/banners?all=true');
    const json = await res.json();
    cachedBanners = json.data || [];

    if (cachedBanners.length === 0) {
      container.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">Chưa có banner nào. Hãy bấm "Thêm Banner Mới".</td></tr>';
      return;
    }

    container.innerHTML = cachedBanners.map(b => {
      const activeBadge = b.isActive !== false 
        ? '<span class="badge bg-success-subtle text-success px-2 py-1"><i class="fa-solid fa-circle-check me-1"></i>Đang hiển thị</span>'
        : '<span class="badge bg-secondary-subtle text-secondary px-2 py-1"><i class="fa-solid fa-eye-slash me-1"></i>Tạm ẩn</span>';
      
      const thumb = b.image 
        ? `<img src="${b.image}" alt="Banner" style="width: 120px; height: 50px; object-fit: cover; border-radius: 6px; border: 1px solid #E2E8F0;" onerror="this.src='images/banner.jpg'">`
        : `<div style="width: 120px; height: 50px; background: #E2E8F0; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 11px; color: #64748B;">Không có ảnh</div>`;

      return `
        <tr style="border-bottom: 1px solid #F1F5F9;">
          <td style="padding: 12px 14px; text-align: center; font-weight: 700; color: #64748B;">#${b.id}</td>
          <td style="padding: 12px 14px;">${thumb}</td>
          <td style="padding: 12px 14px;">
            <div style="font-weight: 700; color: #0F172A; font-size: 13.5px;">${escapeHtml(b.title || '')}</div>
            <div style="font-size: 12px; color: #64748B; margin-top: 2px;">${escapeHtml(b.subtitle || 'Không có phụ đề')}</div>
            <div style="font-size: 11.5px; color: #0284C7; margin-top: 2px;"><i class="fa-solid fa-link me-1"></i>${escapeHtml(b.linkUrl || '#')}</div>
          </td>
          <td style="padding: 12px 14px; text-align: center; font-weight: 700;">${b.orderIndex || 1}</td>
          <td style="padding: 12px 14px; text-align: center;">
            <button type="button" onclick="toggleBannerActive(${b.id}, ${b.isActive !== false})" style="background: none; border: none; cursor: pointer;">
              ${activeBadge}
            </button>
          </td>
          <td style="padding: 12px 14px; text-align: right;">
            <button type="button" onclick="openEditBannerModal(${b.id})" class="btn btn-sm btn-outline-primary me-1" title="Chỉnh sửa">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button type="button" onclick="deleteBannerItem(${b.id})" class="btn btn-sm btn-outline-danger" title="Xóa banner">
              <i class="fa-solid fa-trash"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error("Lỗi tải banner:", err);
    container.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-danger">Không thể tải dữ liệu: ${err.message}</td></tr>`;
  }
}

function openAddBannerModal() {
  document.getElementById('banner_modal_title').innerText = 'Thêm Banner Trình Chiếu Mới';
  document.getElementById('banner_id_input').value = '';
  document.getElementById('banner_title_input').value = '';
  document.getElementById('banner_subtitle_input').value = '';
  document.getElementById('banner_image_input').value = 'images/banner.jpg';
  document.getElementById('banner_link_input').value = '/tin-tuc';
  document.getElementById('banner_order_input').value = (cachedBanners.length + 1).toString();
  document.getElementById('banner_active_input').checked = true;
  document.getElementById('banner_modal').style.display = 'flex';
}

function openEditBannerModal(id) {
  const item = cachedBanners.find(b => b.id === id);
  if (!item) return;

  document.getElementById('banner_modal_title').innerText = `Chỉnh Sửa Banner #${id}`;
  document.getElementById('banner_id_input').value = item.id;
  document.getElementById('banner_title_input').value = item.title || '';
  document.getElementById('banner_subtitle_input').value = item.subtitle || '';
  document.getElementById('banner_image_input').value = item.image || '';
  document.getElementById('banner_link_input').value = item.linkUrl || '';
  document.getElementById('banner_order_input').value = item.orderIndex || 1;
  document.getElementById('banner_active_input').checked = item.isActive !== false;
  document.getElementById('banner_modal').style.display = 'flex';
}

function closeBannerModal() {
  document.getElementById('banner_modal').style.display = 'none';
}

async function saveBannerForm() {
  const id = document.getElementById('banner_id_input').value;
  const title = document.getElementById('banner_title_input').value.trim();
  const subtitle = document.getElementById('banner_subtitle_input').value.trim();
  const image = document.getElementById('banner_image_input').value.trim();
  const linkUrl = document.getElementById('banner_link_input').value.trim();
  const orderIndex = parseInt(document.getElementById('banner_order_input').value) || 1;
  const isActive = document.getElementById('banner_active_input').checked;

  if (!title || !image) {
    alert('Vui lòng nhập đầy đủ Tiêu đề và Đường dẫn hình ảnh banner!');
    return;
  }

  const payload = { title, subtitle, image, linkUrl, orderIndex, isActive };

  try {
    let res;
    if (id) {
      res = await fetch(`/api/banners/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } else {
      res = await fetch('/api/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }
    const json = await res.json();
    if (json.success) {
      closeBannerModal();
      loadSettingsBanners();
    } else {
      alert('Không thể lưu banner: ' + (json.error || 'Lỗi server'));
    }
  } catch (err) {
    alert('Lỗi kết nối khi lưu banner: ' + err.message);
  }
}

async function toggleBannerActive(id, currentStatus) {
  try {
    const res = await fetch(`/api/banners/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !currentStatus })
    });
    const json = await res.json();
    if (json.success) loadSettingsBanners();
  } catch (err) {
    console.error(err);
  }
}

async function deleteBannerItem(id) {
  if (!confirm(`Bạn có chắc chắn muốn xóa Banner #${id} này không?`)) return;
  try {
    const res = await fetch(`/api/banners/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) {
      loadSettingsBanners();
    } else {
      alert('Không thể xóa: ' + (json.error || 'Lỗi'));
    }
  } catch (err) {
    alert('Lỗi khi xóa: ' + err.message);
  }
}

// =========================================================================
// 3. THÔNG BÁO NHANH (QUICK NOTICES / TICKER)
// =========================================================================
async function loadSettingsNotices() {
  const container = document.getElementById('settings_notices_list');
  if (!container) return;
  container.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-muted"><i class="fa-solid fa-spinner fa-spin me-2"></i>Đang tải thông báo nhanh...</td></tr>';

  try {
    const res = await fetch('/api/quick-notices?all=true');
    const json = await res.json();
    cachedNotices = json.data || [];

    if (cachedNotices.length === 0) {
      container.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-muted">Chưa có thông báo nhanh nào. Hãy bấm "Thêm Thông Báo".</td></tr>';
      return;
    }

    container.innerHTML = cachedNotices.map(n => {
      const activeBadge = n.isActive !== false 
        ? '<span class="badge bg-success-subtle text-success px-2 py-1"><i class="fa-solid fa-circle-check me-1"></i>Hiển thị</span>'
        : '<span class="badge bg-secondary-subtle text-secondary px-2 py-1"><i class="fa-solid fa-eye-slash me-1"></i>Tắt</span>';

      return `
        <tr style="border-bottom: 1px solid #F1F5F9;">
          <td style="padding: 12px 14px; text-align: center; font-weight: 700; color: #64748B;">#${n.id}</td>
          <td style="padding: 12px 14px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <i class="fa-solid ${escapeHtml(n.icon || 'fa-bullhorn')} text-primary"></i>
              <strong style="color: #0F172A;">${escapeHtml(n.title || '')}</strong>
            </div>
            <div style="font-size: 12.5px; color: #475569; margin-top: 4px;">${escapeHtml(n.content || '')}</div>
            <div style="font-size: 11px; color: #0284C7; margin-top: 2px;">Liên kết: ${escapeHtml(n.linkUrl || '#')}</div>
          </td>
          <td style="padding: 12px 14px; text-align: center; font-weight: 700;">${n.orderIndex || 1}</td>
          <td style="padding: 12px 14px; text-align: center;">
            <button type="button" onclick="toggleNoticeActive(${n.id}, ${n.isActive !== false})" style="background: none; border: none; cursor: pointer;">
              ${activeBadge}
            </button>
          </td>
          <td style="padding: 12px 14px; text-align: right;">
            <button type="button" onclick="openEditNoticeModal(${n.id})" class="btn btn-sm btn-outline-primary me-1" title="Sửa">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button type="button" onclick="deleteNoticeItem(${n.id})" class="btn btn-sm btn-outline-danger" title="Xóa">
              <i class="fa-solid fa-trash"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error("Lỗi tải thông báo nhanh:", err);
    container.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-danger">Lỗi: ${err.message}</td></tr>`;
  }
}

function openAddNoticeModal() {
  document.getElementById('notice_modal_title').innerText = 'Thêm Thông Báo Nhanh';
  document.getElementById('notice_id_input').value = '';
  document.getElementById('notice_title_input').value = '';
  document.getElementById('notice_content_input').value = '';
  document.getElementById('notice_icon_input').value = 'fa-circle-info text-primary';
  document.getElementById('notice_link_input').value = '/tin-tuc';
  document.getElementById('notice_order_input').value = (cachedNotices.length + 1).toString();
  document.getElementById('notice_active_input').checked = true;
  document.getElementById('notice_modal').style.display = 'flex';
}

function openEditNoticeModal(id) {
  const item = cachedNotices.find(n => n.id === id);
  if (!item) return;

  document.getElementById('notice_modal_title').innerText = `Chỉnh Sửa Thông Báo #${id}`;
  document.getElementById('notice_id_input').value = item.id;
  document.getElementById('notice_title_input').value = item.title || '';
  document.getElementById('notice_content_input').value = item.content || '';
  document.getElementById('notice_icon_input').value = item.icon || 'fa-circle-info text-primary';
  document.getElementById('notice_link_input').value = item.linkUrl || '';
  document.getElementById('notice_order_input').value = item.orderIndex || 1;
  document.getElementById('notice_active_input').checked = item.isActive !== false;
  document.getElementById('notice_modal').style.display = 'flex';
}

function closeNoticeModal() {
  document.getElementById('notice_modal').style.display = 'none';
}

async function saveNoticeForm() {
  const id = document.getElementById('notice_id_input').value;
  const title = document.getElementById('notice_title_input').value.trim();
  const content = document.getElementById('notice_content_input').value.trim();
  const icon = document.getElementById('notice_icon_input').value.trim();
  const linkUrl = document.getElementById('notice_link_input').value.trim();
  const orderIndex = parseInt(document.getElementById('notice_order_input').value) || 1;
  const isActive = document.getElementById('notice_active_input').checked;

  if (!title || !content) {
    alert('Vui lòng nhập đầy đủ Tiêu đề và Nội dung thông báo!');
    return;
  }

  const payload = { title, content, icon, linkUrl, orderIndex, isActive };

  try {
    let res;
    if (id) {
      res = await fetch(`/api/quick-notices/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } else {
      res = await fetch('/api/quick-notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }
    const json = await res.json();
    if (json.success) {
      closeNoticeModal();
      loadSettingsNotices();
    } else {
      alert('Không thể lưu: ' + (json.error || 'Lỗi'));
    }
  } catch (err) {
    alert('Lỗi kết nối: ' + err.message);
  }
}

async function toggleNoticeActive(id, currentStatus) {
  try {
    const res = await fetch(`/api/quick-notices/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !currentStatus })
    });
    const json = await res.json();
    if (json.success) loadSettingsNotices();
  } catch (err) {
    console.error(err);
  }
}

async function deleteNoticeItem(id) {
  if (!confirm(`Bạn có chắc chắn muốn xóa thông báo #${id}?`)) return;
  try {
    const res = await fetch(`/api/quick-notices/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) loadSettingsNotices();
  } catch (err) {
    alert('Lỗi khi xóa: ' + err.message);
  }
}

// =========================================================================
// 4. LIÊN KẾT NGOÀI (EXTERNAL AFFILIATE LINKS)
// =========================================================================
async function loadSettingsLinks() {
  const container = document.getElementById('settings_links_list');
  if (!container) return;
  container.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-muted"><i class="fa-solid fa-spinner fa-spin me-2"></i>Đang tải liên kết ngoài...</td></tr>';

  try {
    const res = await fetch('/api/external-links?all=true');
    const json = await res.json();
    cachedLinks = json.data || [];

    if (cachedLinks.length === 0) {
      container.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-muted">Chưa có liên kết ngoài nào.</td></tr>';
      return;
    }

    container.innerHTML = cachedLinks.map(l => {
      const activeBadge = l.isActive !== false 
        ? '<span class="badge bg-success-subtle text-success px-2 py-1"><i class="fa-solid fa-circle-check me-1"></i>Hoạt động</span>'
        : '<span class="badge bg-secondary-subtle text-secondary px-2 py-1"><i class="fa-solid fa-eye-slash me-1"></i>Tắt</span>';

      return `
        <tr style="border-bottom: 1px solid #F1F5F9;">
          <td style="padding: 12px 14px; text-align: center; font-weight: 700; color: #64748B;">#${l.id}</td>
          <td style="padding: 12px 14px; font-weight: 700; color: #0F172A;">${escapeHtml(l.title || '')}</td>
          <td style="padding: 12px 14px;">
            <a href="${escapeHtml(l.url || '#')}" target="_blank" rel="noopener noreferrer" style="color: #0284C7; text-decoration: none; font-size: 13px;">
              <i class="fa-solid fa-arrow-up-right-from-square me-1"></i>${escapeHtml(l.url || '')}
            </a>
          </td>
          <td style="padding: 12px 14px; text-align: center; font-weight: 700;">${l.orderIndex || 1}</td>
          <td style="padding: 12px 14px; text-align: center;">
            <button type="button" onclick="toggleLinkActive(${l.id}, ${l.isActive !== false})" style="background: none; border: none; cursor: pointer;">
              ${activeBadge}
            </button>
          </td>
          <td style="padding: 12px 14px; text-align: right;">
            <button type="button" onclick="openEditLinkModal(${l.id})" class="btn btn-sm btn-outline-primary me-1" title="Sửa">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button type="button" onclick="deleteLinkItem(${l.id})" class="btn btn-sm btn-outline-danger" title="Xóa">
              <i class="fa-solid fa-trash"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error("Lỗi tải liên kết ngoài:", err);
    container.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-danger">Lỗi: ${err.message}</td></tr>`;
  }
}

function openAddLinkModal() {
  document.getElementById('link_modal_title').innerText = 'Thêm Liên Kết Website Ngoài';
  document.getElementById('link_id_input').value = '';
  document.getElementById('link_title_input').value = '';
  document.getElementById('link_url_input').value = 'https://';
  document.getElementById('link_order_input').value = (cachedLinks.length + 1).toString();
  document.getElementById('link_active_input').checked = true;
  document.getElementById('link_modal').style.display = 'flex';
}

function openEditLinkModal(id) {
  const item = cachedLinks.find(l => l.id === id);
  if (!item) return;

  document.getElementById('link_modal_title').innerText = `Chỉnh Sửa Liên Kết #${id}`;
  document.getElementById('link_id_input').value = item.id;
  document.getElementById('link_title_input').value = item.title || '';
  document.getElementById('link_url_input').value = item.url || '';
  document.getElementById('link_order_input').value = item.orderIndex || 1;
  document.getElementById('link_active_input').checked = item.isActive !== false;
  document.getElementById('link_modal').style.display = 'flex';
}

function closeLinkModal() {
  document.getElementById('link_modal').style.display = 'none';
}

async function saveLinkForm() {
  const id = document.getElementById('link_id_input').value;
  const title = document.getElementById('link_title_input').value.trim();
  const url = document.getElementById('link_url_input').value.trim();
  const orderIndex = parseInt(document.getElementById('link_order_input').value) || 1;
  const isActive = document.getElementById('link_active_input').checked;

  if (!title || !url) {
    alert('Vui lòng nhập tên website và địa chỉ URL!');
    return;
  }

  const payload = { title, url, orderIndex, isActive };

  try {
    let res;
    if (id) {
      res = await fetch(`/api/external-links/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } else {
      res = await fetch('/api/external-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }
    const json = await res.json();
    if (json.success) {
      closeLinkModal();
      loadSettingsLinks();
    } else {
      alert('Không thể lưu: ' + (json.error || 'Lỗi'));
    }
  } catch (err) {
    alert('Lỗi kết nối: ' + err.message);
  }
}

async function toggleLinkActive(id, currentStatus) {
  try {
    const res = await fetch(`/api/external-links/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !currentStatus })
    });
    const json = await res.json();
    if (json.success) loadSettingsLinks();
  } catch (err) {
    console.error(err);
  }
}

async function deleteLinkItem(id) {
  if (!confirm(`Bạn có chắc muốn xóa liên kết #${id}?`)) return;
  try {
    const res = await fetch(`/api/external-links/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) loadSettingsLinks();
  } catch (err) {
    alert('Lỗi khi xóa: ' + err.message);
  }
}

// =========================================================================
// 5. CHUYÊN MỤC TIN TỨC (NEWS CATEGORIES)
// =========================================================================
async function loadSettingsCategories() {
  const container = document.getElementById('settings_categories_list');
  if (!container) return;
  container.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-muted"><i class="fa-solid fa-spinner fa-spin me-2"></i>Đang tải danh mục...</td></tr>';

  try {
    const res = await fetch('/api/categories');
    const json = await res.json();
    cachedCategories = json.data || [];

    if (cachedCategories.length === 0) {
      container.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-muted">Chưa có chuyên mục nào.</td></tr>';
      return;
    }

    container.innerHTML = cachedCategories.map(c => `
      <tr style="border-bottom: 1px solid #F1F5F9;">
        <td style="padding: 12px 14px; text-align: center; font-weight: 700; color: #64748B;">#${c.id}</td>
        <td style="padding: 12px 14px; font-weight: 700; color: #0F172A;">${escapeHtml(c.name || '')}</td>
        <td style="padding: 12px 14px; color: #0284C7; font-family: monospace;">${escapeHtml(c.slug || '')}</td>
        <td style="padding: 12px 14px; color: #64748B; font-size: 12.5px;">${escapeHtml(c.description || 'Chưa có mô tả')}</td>
        <td style="padding: 12px 14px; text-align: right;">
          <button type="button" onclick="openEditCategoryModal(${c.id})" class="btn btn-sm btn-outline-primary me-1" title="Sửa">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button type="button" onclick="deleteCategoryItem(${c.id})" class="btn btn-sm btn-outline-danger" title="Xóa">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error("Lỗi tải chuyên mục:", err);
    container.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-danger">Lỗi: ${err.message}</td></tr>`;
  }
}

function openAddCategoryModal() {
  document.getElementById('cat_modal_title').innerText = 'Thêm Chuyên Mục Tin Tức Mới';
  document.getElementById('cat_id_input').value = '';
  document.getElementById('cat_name_input').value = '';
  document.getElementById('cat_slug_input').value = '';
  document.getElementById('cat_desc_input').value = '';
  document.getElementById('category_modal').style.display = 'flex';
}

function openEditCategoryModal(id) {
  const item = cachedCategories.find(c => c.id === id);
  if (!item) return;

  document.getElementById('cat_modal_title').innerText = `Chỉnh Sửa Chuyên Mục #${id}`;
  document.getElementById('cat_id_input').value = item.id;
  document.getElementById('cat_name_input').value = item.name || '';
  document.getElementById('cat_slug_input').value = item.slug || '';
  document.getElementById('cat_desc_input').value = item.description || '';
  document.getElementById('category_modal').style.display = 'flex';
}

function closeCategoryModal() {
  document.getElementById('category_modal').style.display = 'none';
}

async function saveCategoryForm() {
  const id = document.getElementById('cat_id_input').value;
  const name = document.getElementById('cat_name_input').value.trim();
  const slug = document.getElementById('cat_slug_input').value.trim();
  const description = document.getElementById('cat_desc_input').value.trim();

  if (!name) {
    alert('Vui lòng nhập tên chuyên mục!');
    return;
  }

  const payload = { name, slug, description };

  try {
    let res;
    if (id) {
      res = await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } else {
      res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }
    const json = await res.json();
    if (json.success) {
      closeCategoryModal();
      loadSettingsCategories();
    } else {
      alert('Không thể lưu: ' + (json.error || 'Lỗi'));
    }
  } catch (err) {
    alert('Lỗi kết nối: ' + err.message);
  }
}

async function deleteCategoryItem(id) {
  if (!confirm(`Bạn có chắc chắn muốn xóa Chuyên mục #${id}? Các bài viết thuộc chuyên mục này có thể bị ảnh hưởng.`)) return;
  try {
    const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) loadSettingsCategories();
  } catch (err) {
    alert('Lỗi khi xóa chuyên mục: ' + err.message);
  }
}

// =========================================================================
// 6. THÔNG TIN CHUNG & LIÊN HỆ & THỐNG KÊ THỰC (GENERAL SETTINGS)
// =========================================================================
async function loadSettingsGeneral() {
  try {
    // 1. Load settings
    const res = await fetch('/api/settings');
    const json = await res.json();
    cachedSettings = json.data || {};

    document.getElementById('setting_brand_title').value = cachedSettings.brandTitle || '';
    document.getElementById('setting_brand_sub').value = cachedSettings.brandSub || '';
    document.getElementById('setting_hotline').value = cachedSettings.hotline || '';
    document.getElementById('setting_email').value = cachedSettings.email || '';
    document.getElementById('setting_address').value = cachedSettings.address || '';
    document.getElementById('setting_website').value = cachedSettings.websiteUrl || '';
    document.getElementById('setting_facebook').value = cachedSettings.facebookUrl || '';
    document.getElementById('setting_zalo').value = cachedSettings.zaloUrl || '';
    document.getElementById('setting_views_offset').value = cachedSettings.totalViewsOffset || 0;

    // 2. Load realtime live stats
    const statsRes = await fetch('/api/stats/realtime');
    const statsJson = await statsRes.json();
    if (statsJson.success) {
      document.getElementById('live_stat_online').innerText = statsJson.online || 1;
      document.getElementById('live_stat_views').innerText = Number(statsJson.totalViews || 0).toLocaleString('vi-VN');
      document.getElementById('live_stat_articles').innerText = statsJson.totalArticles || 0;
      document.getElementById('live_stat_published').innerText = statsJson.publishedCount || 0;
    }
  } catch (err) {
    console.error("Lỗi tải thông tin chung:", err);
  }
}

async function saveGeneralSettingsForm() {
  const payload = {
    brandTitle: document.getElementById('setting_brand_title').value.trim(),
    brandSub: document.getElementById('setting_brand_sub').value.trim(),
    hotline: document.getElementById('setting_hotline').value.trim(),
    email: document.getElementById('setting_email').value.trim(),
    address: document.getElementById('setting_address').value.trim(),
    websiteUrl: document.getElementById('setting_website').value.trim(),
    facebookUrl: document.getElementById('setting_facebook').value.trim(),
    zaloUrl: document.getElementById('setting_zalo').value.trim(),
    totalViewsOffset: parseInt(document.getElementById('setting_views_offset').value) || 0
  };

  try {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (json.success) {
      alert('✅ Đã lưu cấu hình thông tin hệ thống thành công!');
      loadSettingsGeneral();
    } else {
      alert('Không thể lưu: ' + (json.error || 'Lỗi'));
    }
  } catch (err) {
    alert('Lỗi khi lưu cấu hình: ' + err.message);
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
