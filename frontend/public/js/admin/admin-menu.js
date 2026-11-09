// =============================================================================
// ADMIN NAVIGATION MENUS (QUẢN TRỊ MENU ĐIỀU HƯỚNG WEBSITE - DBO.NAVIGATION_MENUS)
// =============================================================================

let adminMenus = [];
let editingMenuId = null;

async function loadAdminMenus() {
  const tbody = document.getElementById('admin_menus_table_body');
  if (tbody) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 24px; color: #64748B;"><i class="fa-solid fa-circle-notch fa-spin me-2"></i> Đang tải danh sách menu từ CSDL...</td></tr>';
  }

  try {
    const res = await fetch('/api/navigation-menus?all=true').then(r => r.json());
    if (res.success && Array.isArray(res.data)) {
      adminMenus = res.data;
      renderAdminMenusTable();
    } else {
      if (tbody) tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 24px; color: #EF4444;">Không thể tải dữ liệu menu: ' + (res.error || 'Lỗi không xác định') + '</td></tr>';
    }
  } catch (err) {
    console.error('Lỗi tải danh sách menu:', err);
    if (tbody) tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 24px; color: #EF4444;"><i class="fa-solid fa-triangle-exclamation me-2"></i> Lỗi kết nối CSDL: ${err.message}</td></tr>`;
  }
}

function renderAdminMenusTable() {
  const tbody = document.getElementById('admin_menus_table_body');
  if (!tbody) return;

  if (adminMenus.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 24px; color: #64748B;">Chưa có mục menu nào trong CSDL. Hãy bấm "+ Thêm Mục Menu Mới".</td></tr>';
    return;
  }

  tbody.innerHTML = adminMenus.map((m, index) => {
    const activeBadge = m.isActive !== false
      ? '<span style="background: #DEF7EC; color: #03543F; padding: 4px 10px; border-radius: 999px; font-size: 11.5px; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-circle-check"></i> Hiển thị</span>'
      : '<span style="background: #F3F4F6; color: #4B5563; padding: 4px 10px; border-radius: 999px; font-size: 11.5px; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-eye-slash"></i> Tạm ẩn</span>';

    const targetBadge = m.targetBlank
      ? '<span style="background: #E0E7FF; color: #3730A3; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">Tab mới (_blank)</span>'
      : '<span style="background: #F1F5F9; color: #475569; padding: 3px 8px; border-radius: 4px; font-size: 11px;">Cùng tab</span>';

    return `
      <tr style="border-bottom: 1px solid #E2E8F0; transition: background 0.15s;" onmouseover="this.style.background='#F8FAFC'" onmouseout="this.style.background='white'">
        <td style="padding: 12px 14px; text-align: center; font-weight: 600; color: #64748B;">${index + 1}</td>
        <td style="padding: 12px 14px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="display: inline-flex; width: 28px; height: 28px; border-radius: 6px; background: #EEF2F6; color: #003865; align-items: center; justify-content: center; font-size: 13px;">
              <i class="fa-solid ${m.icon || 'fa-link'}"></i>
            </span>
            <strong style="color: #003865; font-size: 13.5px;">${m.title}</strong>
          </div>
        </td>
        <td style="padding: 12px 14px; font-size: 12.5px;">
          <code style="background: #F1F5F9; padding: 3px 8px; border-radius: 4px; color: #0284C7; font-family: monospace;">${m.url}</code>
        </td>
        <td style="padding: 12px 14px; text-align: center; font-weight: 700; color: #334155;">${m.order || 0}</td>
        <td style="padding: 12px 14px; text-align: center;">${targetBadge}</td>
        <td style="padding: 12px 14px; text-align: center;">${activeBadge}</td>
        <td style="padding: 12px 14px; text-align: center;">
          <div style="display: flex; gap: 6px; justify-content: center; align-items: center;">
            <button type="button" onclick="openEditMenuModal(${m.id})" style="border: none; background: #E0F2FE; color: #0284C7; border-radius: 6px; padding: 6px 10px; font-size: 12px; font-weight: 600; cursor: pointer;" title="Chỉnh sửa menu">
              <i class="fa-solid fa-pen-to-square"></i> Sửa
            </button>
            <button type="button" onclick="toggleAdminMenu(${m.id}, ${m.isActive !== false ? 'false' : 'true'})" style="border: none; background: ${m.isActive !== false ? '#FEF3C7' : '#DEF7EC'}; color: ${m.isActive !== false ? '#B45309' : '#03543F'}; border-radius: 6px; padding: 6px 10px; font-size: 12px; font-weight: 600; cursor: pointer;" title="${m.isActive !== false ? 'Tạm ẩn' : 'Bật hiển thị'}">
              <i class="fa-solid ${m.isActive !== false ? 'fa-eye-slash' : 'fa-eye'}"></i>
            </button>
            <button type="button" onclick="deleteAdminMenu(${m.id}, '${(m.title || '').replace(/'/g, "\\'")}')" style="border: none; background: #FEE2E2; color: #DC2626; border-radius: 6px; padding: 6px 10px; font-size: 12px; font-weight: 600; cursor: pointer;" title="Xóa menu">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function openAddMenuModal() {
  editingMenuId = null;
  document.getElementById('menu_modal_title').innerText = 'Thêm Mục Menu Điều Hướng Mới';
  document.getElementById('nav_menu_title').value = '';
  document.getElementById('nav_menu_url').value = '';
  document.getElementById('nav_menu_order').value = (adminMenus.length + 1);
  document.getElementById('nav_menu_icon').value = 'fa-link';
  document.getElementById('nav_menu_blank').checked = false;
  document.getElementById('nav_menu_active').checked = true;

  document.getElementById('menu_edit_modal').style.display = 'flex';
}

function openEditMenuModal(id) {
  const m = adminMenus.find(item => item.id == id);
  if (!m) return;

  editingMenuId = id;
  document.getElementById('menu_modal_title').innerText = 'Chỉnh Sửa Mục Menu: ' + m.title;
  document.getElementById('nav_menu_title').value = m.title || '';
  document.getElementById('nav_menu_url').value = m.url || '';
  document.getElementById('nav_menu_order').value = m.order !== undefined ? m.order : 0;
  document.getElementById('nav_menu_icon').value = m.icon || 'fa-link';
  document.getElementById('nav_menu_blank').checked = Boolean(m.targetBlank);
  document.getElementById('nav_menu_active').checked = m.isActive !== false;

  document.getElementById('menu_edit_modal').style.display = 'flex';
}

function closeMenuModal() {
  document.getElementById('menu_edit_modal').style.display = 'none';
  editingMenuId = null;
}

async function saveMenuForm() {
  const title = document.getElementById('nav_menu_title').value.trim();
  const url = document.getElementById('nav_menu_url').value.trim();
  const order = parseInt(document.getElementById('nav_menu_order').value) || 0;
  const icon = document.getElementById('nav_menu_icon').value.trim() || 'fa-link';
  const targetBlank = document.getElementById('nav_menu_blank').checked;
  const isActive = document.getElementById('nav_menu_active').checked;

  if (!title) {
    alert('Vui lòng nhập Tiêu đề menu!');
    return;
  }
  if (!url) {
    alert('Vui lòng nhập Đường dẫn liên kết (URL)!');
    return;
  }

  const payload = {
    title,
    url,
    order,
    icon,
    targetBlank,
    isActive
  };

  try {
    let res;
    if (editingMenuId) {
      res = await fetch(`/api/navigation-menus/${editingMenuId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(r => r.json());
    } else {
      res = await fetch('/api/navigation-menus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(r => r.json());
    }

    if (res.success) {
      alert(res.message || 'Đã lưu mục menu thành công!');
      closeMenuModal();
      loadAdminMenus();
    } else {
      alert('Lỗi: ' + (res.error || 'Không thể lưu mục menu'));
    }
  } catch (err) {
    alert('Lỗi kết nối: ' + err.message);
  }
}

async function toggleAdminMenu(id, newActive) {
  try {
    const res = await fetch(`/api/navigation-menus/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: newActive })
    }).then(r => r.json());

    if (res.success) {
      loadAdminMenus();
    } else {
      alert('Lỗi: ' + (res.error || 'Không thể đổi trạng thái menu'));
    }
  } catch (err) {
    alert('Lỗi kết nối: ' + err.message);
  }
}

async function deleteAdminMenu(id, title) {
  if (!confirm(`Bạn có chắc chắn muốn xóa mục menu "${title}" khỏi thanh điều hướng website?`)) {
    return;
  }

  try {
    const res = await fetch(`/api/navigation-menus/${id}`, { method: 'DELETE' }).then(r => r.json());
    if (res.success) {
      alert(res.message || 'Đã xóa mục menu thành công!');
      loadAdminMenus();
    } else {
      alert('Lỗi: ' + (res.error || 'Không thể xóa menu'));
    }
  } catch (err) {
    alert('Lỗi kết nối: ' + err.message);
  }
}
