// =============================================================================
// ADMIN CO CAU TO CHUC (QUẢN LÝ CƠ CẤU TỔ CHỨC, CÁN BỘ & 16 TỔ CÔNG ĐOÀN)
// =============================================================================

let adminOrgCadres = [];
let adminOrgUnits = [];
let adminOrgBoards = [];
let adminOrgFilter = 'all';

async function loadAdminOrganization() {
  const tbody = document.getElementById('admin_org_cadres_table_body');
  if (tbody) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 24px; color: #64748B;"><i class="fa-solid fa-circle-notch fa-spin me-2"></i> Đang tải dữ liệu cơ cấu tổ chức từ CSDL...</td></tr>';
  }

  try {
    const res = await fetch('/api/org-full-tree').then(r => r.json());
    if (res.success && res.data) {
      adminOrgCadres = res.data.cadres || [];
      adminOrgUnits = res.data.units || [];
      adminOrgBoards = res.data.boards || [];

      // Update Org Badges
      const totalCadresEl = document.getElementById('stat_org_total_cadres');
      const btvCountEl = document.getElementById('stat_org_btv_count');
      const bchCountEl = document.getElementById('stat_org_bch_count');
      const ubktCountEl = document.getElementById('stat_org_ubkt_count');
      const unitsCountEl = document.getElementById('stat_org_units_count');

      const btv = adminOrgCadres.filter(c => c.board_id === 1 || (c.role && (c.role.includes('Chủ tịch') || c.role.includes('Thường vụ'))));
      const ubkt = adminOrgCadres.filter(c => c.board_id === 3 || (c.role && (c.role.includes('UBKT') || c.role.includes('Kiểm tra'))));

      if (totalCadresEl) totalCadresEl.innerText = adminOrgCadres.length;
      if (btvCountEl) btvCountEl.innerText = btv.length;
      if (bchCountEl) bchCountEl.innerText = adminOrgCadres.length;
      if (ubktCountEl) ubktCountEl.innerText = ubkt.length;
      if (unitsCountEl) unitsCountEl.innerText = adminOrgUnits.length;

      renderAdminOrgTable();
    }
  } catch (err) {
    console.error('Lỗi nạp cơ cấu tổ chức:', err);
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 24px; color: #EF4444;"><i class="fa-solid fa-triangle-exclamation me-2"></i> Lỗi kết nối CSDL: ${err.message}</td></tr>`;
    }
  }
}

function filterAdminOrg(filterType) {
  adminOrgFilter = filterType;
  const buttons = document.querySelectorAll('.org-filter-btn');
  buttons.forEach(btn => {
    if (btn.getAttribute('data-filter') === filterType) {
      btn.style.background = '#003865';
      btn.style.color = '#FFFFFF';
    } else {
      btn.style.background = '#F1F5F9';
      btn.style.color = '#334155';
    }
  });

  const cadreTableWrap = document.getElementById('admin_org_cadre_table_wrap');
  const unitTableWrap = document.getElementById('admin_org_unit_table_wrap');

  if (filterType === 'units') {
    if (cadreTableWrap) cadreTableWrap.style.display = 'none';
    if (unitTableWrap) unitTableWrap.style.display = 'block';
    renderAdminOrgUnitsTable();
  } else {
    if (cadreTableWrap) cadreTableWrap.style.display = 'block';
    if (unitTableWrap) unitTableWrap.style.display = 'none';
    renderAdminOrgTable();
  }
}

function renderAdminOrgTable() {
  const tbody = document.getElementById('admin_org_cadres_table_body');
  if (!tbody) return;

  const searchKeyword = (document.getElementById('admin_org_search')?.value || '').toLowerCase().trim();

  let list = adminOrgCadres;
  if (adminOrgFilter === 'btv') {
    list = list.filter(c => c.board_id === 1 || (c.role && (c.role.includes('Chủ tịch') || c.role.includes('Thường vụ'))));
  } else if (adminOrgFilter === 'bch') {
    list = list;
  } else if (adminOrgFilter === 'ubkt') {
    list = list.filter(c => c.board_id === 3 || (c.role && (c.role.includes('UBKT') || c.role.includes('Kiểm tra'))));
  }

  if (searchKeyword) {
    list = list.filter(c =>
      (c.name && c.name.toLowerCase().includes(searchKeyword)) ||
      (c.role && c.role.toLowerCase().includes(searchKeyword)) ||
      (c.email && c.email.toLowerCase().includes(searchKeyword)) ||
      (c.unit && c.unit.toLowerCase().includes(searchKeyword)) ||
      (c.unit_name && c.unit_name.toLowerCase().includes(searchKeyword))
    );
  }

  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 24px; color: #64748B;">Không tìm thấy cán bộ nào phù hợp.</td></tr>';
    return;
  }

  tbody.innerHTML = list.map((c, index) => {
    let roleBadge = '<span style="background: #E0E7FF; color: #3730A3; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 700;">' + (c.role || 'Ủy viên') + '</span>';
    if (c.role && c.role.includes('Chủ tịch') && !c.role.includes('Phó')) {
      roleBadge = '<span style="background: #FEF3C7; color: #92400E; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 700;"><i class="fa-solid fa-crown me-1 text-warning"></i> ' + c.role + '</span>';
    } else if (c.role && c.role.includes('Phó Chủ tịch')) {
      roleBadge = '<span style="background: #E0F2FE; color: #0369A1; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 700;"><i class="fa-solid fa-star me-1 text-primary"></i> ' + c.role + '</span>';
    }

    return `
      <tr style="border-bottom: 1px solid #E2E8F0;">
        <td style="padding: 12px 14px; text-align: center; font-weight: 600; color: #64748B;">${index + 1}</td>
        <td style="padding: 12px 14px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <img src="${c.photo || 'https://congdoan.tdmu.edu.vn/img/ckeditor/Images/Danh.jpg'}" style="width: 38px; height: 38px; border-radius: 50%; object-fit: cover; border: 1px solid #CBD5E1;" onerror="this.src='https://congdoan.tdmu.edu.vn/img/ckeditor/Images/Danh.jpg'">
            <div>
              <strong style="color: #003865; font-size: 13.5px; display: block;">${c.name}</strong>
              <small style="color: #64748B;">${c.degree || 'Cử nhân'}</small>
            </div>
          </div>
        </td>
        <td style="padding: 12px 14px;">${roleBadge}</td>
        <td style="padding: 12px 14px; font-size: 12.5px; color: #334155;">${c.unit_name || c.unit || 'Công đoàn TDMU'}</td>
        <td style="padding: 12px 14px; font-size: 12.5px; color: #005696;">
          <div><i class="fa-solid fa-envelope me-1 text-muted"></i> ${c.email || 'congdoan@tdmu.edu.vn'}</div>
          ${c.phone ? `<small style="color: #64748B;"><i class="fa-solid fa-phone me-1"></i> ${c.phone}</small>` : ''}
        </td>
        <td style="padding: 12px 14px; font-size: 12px; color: #64748B; max-width: 220px;">
          <div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${c.duties || ''}">
            ${c.duties || 'Tham gia các hoạt động phong trào.'}
          </div>
        </td>
        <td style="padding: 12px 14px; text-align: center;">
          <div style="display: flex; gap: 6px; justify-content: center;">
            <button type="button" onclick="openEditCadreModal(${c.id})" style="border: none; background: #E0F2FE; color: #0284C7; border-radius: 6px; padding: 6px 10px; font-size: 12px; font-weight: 600; cursor: pointer;" title="Chỉnh sửa hồ sơ cán bộ">
              <i class="fa-solid fa-pen-to-square"></i> Sửa
            </button>
            <button type="button" onclick="deleteAdminCadre(${c.id}, '${(c.name || '').replace(/'/g, "\\'")}')" style="border: none; background: #FEE2E2; color: #DC2626; border-radius: 6px; padding: 6px 10px; font-size: 12px; font-weight: 600; cursor: pointer;" title="Xóa cán bộ">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function renderAdminOrgUnitsTable() {
  const tbody = document.getElementById('admin_org_units_table_body');
  if (!tbody) return;

  tbody.innerHTML = adminOrgUnits.map((u, index) => `
    <tr style="border-bottom: 1px solid #E2E8F0;">
      <td style="padding: 12px 14px; text-align: center; font-weight: 700; color: #005696;">${u.code || ('TCD' + String(index + 1).padStart(2, '0'))}</td>
      <td style="padding: 12px 14px; font-weight: 700; color: #003865;">${u.name}</td>
      <td style="padding: 12px 14px; font-size: 13px; color: #334155;"><strong>${u.leader || 'Ban Chấp Hành Tổ'}</strong></td>
      <td style="padding: 12px 14px; font-size: 12.5px; color: #005696;"><i class="fa-solid fa-envelope me-1 text-muted"></i> ${u.email || 'congdoan@tdmu.edu.vn'}</td>
      <td style="padding: 12px 14px; font-size: 12.5px; color: #64748B;"><i class="fa-solid fa-phone me-1 text-success"></i> ${u.phone || '0274.3822058'}</td>
      <td style="padding: 12px 14px; text-align: center;">
        <button type="button" onclick="openEditUnitModal(${u.id})" style="border: none; background: #E0F2FE; color: #0284C7; border-radius: 6px; padding: 6px 12px; font-size: 12px; font-weight: 600; cursor: pointer;">
          <i class="fa-solid fa-pen-to-square me-1"></i> Cập Nhật Tổ
        </button>
      </td>
    </tr>
  `).join('');
}

// ─── MODAL ADD / EDIT CADRE ──────────────────────────────────────────────────
let editingCadreId = null;

function openAddCadreModal() {
  editingCadreId = null;
  document.getElementById('cadre_modal_title').innerText = 'Thêm Cán Bộ Mới Vào Cơ Cấu Tổ Chức';
  document.getElementById('cadre_name').value = '';
  document.getElementById('cadre_degree').value = 'Thạc sĩ';
  document.getElementById('cadre_role').value = 'Ủy viên Ban Chấp hành';
  document.getElementById('cadre_unit').value = 'Khoa Kỹ thuật Công nghệ';
  document.getElementById('cadre_email').value = '';
  document.getElementById('cadre_phone').value = '';
  document.getElementById('cadre_board_id').value = '2';
  document.getElementById('cadre_duties').value = 'Tham gia công tác phong trào và thực hiện các nhiệm vụ do Ban Thường vụ phân công.';
  
  // Populate unit select
  populateUnitSelect(1);

  document.getElementById('cadre_edit_modal').style.display = 'flex';
}

function openEditCadreModal(id) {
  const c = adminOrgCadres.find(item => item.id == id);
  if (!c) return;

  editingCadreId = id;
  document.getElementById('cadre_modal_title').innerText = 'Chỉnh Sửa Hồ Sơ Cán Bộ: ' + c.name;
  document.getElementById('cadre_name').value = c.name || '';
  document.getElementById('cadre_degree').value = c.degree || 'Cử nhân';
  document.getElementById('cadre_role').value = c.role || 'Ủy viên';
  document.getElementById('cadre_unit').value = c.unit || c.unit_name || '';
  document.getElementById('cadre_email').value = c.email || '';
  document.getElementById('cadre_phone').value = c.phone || '';
  document.getElementById('cadre_board_id').value = String(c.board_id || 2);
  document.getElementById('cadre_duties').value = c.duties || '';

  populateUnitSelect(c.unit_id || 1);

  document.getElementById('cadre_edit_modal').style.display = 'flex';
}

function populateUnitSelect(selectedId) {
  const sel = document.getElementById('cadre_unit_id');
  if (!sel) return;
  sel.innerHTML = adminOrgUnits.map(u => `
    <option value="${u.id}" ${u.id == selectedId ? 'selected' : ''}>${u.name}</option>
  `).join('');
}

function closeCadreModal() {
  document.getElementById('cadre_edit_modal').style.display = 'none';
  editingCadreId = null;
}

async function saveCadreForm() {
  const name = document.getElementById('cadre_name').value.trim();
  const degree = document.getElementById('cadre_degree').value.trim();
  const role = document.getElementById('cadre_role').value.trim();
  const unit = document.getElementById('cadre_unit').value.trim();
  const email = document.getElementById('cadre_email').value.trim();
  const phone = document.getElementById('cadre_phone').value.trim();
  const board_id = parseInt(document.getElementById('cadre_board_id').value) || 2;
  const unit_id = parseInt(document.getElementById('cadre_unit_id').value) || 1;
  const duties = document.getElementById('cadre_duties').value.trim();

  if (!name) {
    alert('Vui lòng nhập Họ và tên cán bộ!');
    return;
  }

  const payload = {
    name,
    degree,
    role,
    unit,
    email,
    phone,
    board_id,
    unit_id,
    duties
  };

  try {
    let res;
    if (editingCadreId) {
      res = await fetch(`/api/members/${editingCadreId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(r => r.json());
    } else {
      res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(r => r.json());
    }

    if (res.success) {
      alert(res.message || 'Đã lưu thông tin cán bộ thành công!');
      closeCadreModal();
      loadAdminOrganization();
    } else {
      alert('Lỗi: ' + (res.error || 'Không thể lưu cán bộ'));
    }
  } catch (err) {
    alert('Lỗi gửi yêu cầu: ' + err.message);
  }
}

async function deleteAdminCadre(id, name) {
  if (!confirm(`Bạn có chắc chắn muốn xóa cán bộ "${name}" khỏi cơ cấu tổ chức Công đoàn?`)) {
    return;
  }

  try {
    const res = await fetch(`/api/members/${id}`, { method: 'DELETE' }).then(r => r.json());
    if (res.success) {
      alert(res.message || 'Đã xóa cán bộ thành công!');
      loadAdminOrganization();
    } else {
      alert('Lỗi: ' + (res.error || 'Không thể xóa cán bộ'));
    }
  } catch (err) {
    alert('Lỗi kết nối: ' + err.message);
  }
}

// ─── MODAL EDIT UNION BRANCH ─────────────────────────────────────────────────
let editingUnitId = null;

function openEditUnitModal(id) {
  const u = adminOrgUnits.find(item => item.id == id);
  if (!u) return;

  editingUnitId = id;
  document.getElementById('unit_modal_title').innerText = 'Cập Nhật Tổ Công Đoàn: ' + u.name;
  document.getElementById('unit_name').value = u.name || '';
  document.getElementById('unit_leader').value = u.leader || '';
  document.getElementById('unit_email').value = u.email || '';
  document.getElementById('unit_phone').value = u.phone || '';

  document.getElementById('unit_edit_modal').style.display = 'flex';
}

function closeUnitModal() {
  document.getElementById('unit_edit_modal').style.display = 'none';
  editingUnitId = null;
}

async function saveUnitForm() {
  const name = document.getElementById('unit_name').value.trim();
  const leader = document.getElementById('unit_leader').value.trim();
  const email = document.getElementById('unit_email').value.trim();
  const phone = document.getElementById('unit_phone').value.trim();

  if (!name) {
    alert('Vui lòng nhập Tên Tổ Công Đoàn!');
    return;
  }

  try {
    const res = await fetch(`/api/to-cong-doan/${editingUnitId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, leader, email, phone })
    }).then(r => r.json());

    if (res.success) {
      alert(res.message || 'Đã cập nhật Tổ Công đoàn thành công!');
      closeUnitModal();
      loadAdminOrganization();
    } else {
      alert('Lỗi: ' + (res.error || 'Không thể cập nhật tổ công đoàn'));
    }
  } catch (err) {
    alert('Lỗi kết nối: ' + err.message);
  }
}
