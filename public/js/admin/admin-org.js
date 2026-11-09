// =============================================================================
// ADMIN CO CAU TO CHUC (QUẢN LÝ CƠ CẤU TỔ CHỨC, CÁC BAN, CÁN BỘ & TỔ CÔNG ĐOÀN)
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
      const boardsCountEl = document.getElementById('stat_org_boards_count');

      const btv = adminOrgCadres.filter(c => c.board_id === 1 || (c.role && (c.role.includes('Chủ tịch') || c.role.includes('Thường vụ'))));
      const ubkt = adminOrgCadres.filter(c => c.board_id === 3 || (c.role && (c.role.includes('UBKT') || c.role.includes('Kiểm tra'))));

      if (totalCadresEl) totalCadresEl.innerText = adminOrgCadres.length;
      if (btvCountEl) btvCountEl.innerText = btv.length;
      if (bchCountEl) bchCountEl.innerText = adminOrgCadres.length;
      if (ubktCountEl) ubktCountEl.innerText = ubkt.length;
      if (unitsCountEl) unitsCountEl.innerText = adminOrgUnits.length;
      if (boardsCountEl) boardsCountEl.innerText = adminOrgBoards.length;

      // Populate selects for Cadre modal
      populateUnitSelect();
      populateBoardSelect();

      if (adminOrgFilter === 'boards') {
        renderAdminOrgBoardsTable();
      } else if (adminOrgFilter === 'units') {
        renderAdminOrgUnitsTable();
      } else {
        renderAdminOrgTable();
      }
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
  const boardTableWrap = document.getElementById('admin_org_board_table_wrap');
  const cadreSearchBox = document.getElementById('admin_org_search_wrap');

  if (filterType === 'boards') {
    if (cadreTableWrap) cadreTableWrap.style.display = 'none';
    if (unitTableWrap) unitTableWrap.style.display = 'none';
    if (boardTableWrap) boardTableWrap.style.display = 'block';
    if (cadreSearchBox) cadreSearchBox.style.display = 'none';
    renderAdminOrgBoardsTable();
  } else if (filterType === 'units') {
    if (cadreTableWrap) cadreTableWrap.style.display = 'none';
    if (boardTableWrap) boardTableWrap.style.display = 'none';
    if (unitTableWrap) unitTableWrap.style.display = 'block';
    if (cadreSearchBox) cadreSearchBox.style.display = 'none';
    renderAdminOrgUnitsTable();
  } else {
    if (cadreTableWrap) cadreTableWrap.style.display = 'block';
    if (boardTableWrap) boardTableWrap.style.display = 'none';
    if (unitTableWrap) unitTableWrap.style.display = 'none';
    if (cadreSearchBox) cadreSearchBox.style.display = 'block';
    renderAdminOrgTable();
  }

  const btnAddCadre = document.getElementById('btn_org_add_cadre');
  const btnAddBoard = document.getElementById('btn_org_add_board');
  const btnAddUnit = document.getElementById('btn_org_add_unit');

  if (btnAddCadre) btnAddCadre.style.display = (filterType === 'boards' || filterType === 'units') ? 'none' : 'inline-flex';
  if (btnAddBoard) btnAddBoard.style.display = (filterType === 'boards') ? 'inline-flex' : 'none';
  if (btnAddUnit) btnAddUnit.style.display = (filterType === 'units') ? 'inline-flex' : 'none';
}

// ─── 1. BẢNG CÁN BỘ ──────────────────────────────────────────────────────────
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

// ─── 2. BẢNG CÁC BAN (dbo.ORGANIZATIONS) ──────────────────────────────────────
function renderAdminOrgBoardsTable() {
  const tbody = document.getElementById('admin_org_boards_table_body');
  if (!tbody) return;

  if (adminOrgBoards.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 24px; color: #64748B;">Chưa có dữ liệu Ban nào. Hãy bấm "+ Thêm Ban Mới".</td></tr>';
    return;
  }

  tbody.innerHTML = adminOrgBoards.map((b, index) => {
    return `
      <tr style="border-bottom: 1px solid #E2E8F0; transition: background 0.15s;" onmouseover="this.style.background='#F8FAFC'" onmouseout="this.style.background='white'">
        <td style="padding: 12px 14px; text-align: center; font-weight: 600; color: #64748B;">${index + 1}</td>
        <td style="padding: 12px 14px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <i class="fa-solid fa-shield-halved text-primary"></i>
            <strong style="color: #003865; font-size: 14px;">${b.name || b.TenToChuc}</strong>
          </div>
        </td>
        <td style="padding: 12px 14px; font-size: 12.5px; color: #475569;">
          <span style="background: #F1F5F9; padding: 3px 8px; border-radius: 4px; font-weight: 600;">${b.tenure || b.NhiemKy || 'Nhiệm kỳ 2023 - 2028'}</span>
        </td>
        <td style="padding: 12px 14px; font-size: 12.5px; color: #334155; max-width: 320px;">
          ${b.description || b.MoTaChucNang || 'Chức năng, quyền hạn theo Điều lệ Công đoàn.'}
        </td>
        <td style="padding: 12px 14px; text-align: center; font-weight: 700; color: #0284C7;">
          ${b.orderIndex !== undefined ? b.orderIndex : (b.ThuTuHienThi || (index + 1))}
        </td>
        <td style="padding: 12px 14px; text-align: center;">
          <span style="background: #DEF7EC; color: #03543F; padding: 4px 10px; border-radius: 999px; font-size: 11.5px; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">
            <i class="fa-solid fa-circle-check"></i> Hoạt động
          </span>
        </td>
        <td style="padding: 12px 14px; text-align: center;">
          <div style="display: flex; gap: 6px; justify-content: center;">
            <button type="button" onclick="openEditBoardModal(${b.id || b.MaToChuc})" style="border: none; background: #E0F2FE; color: #0284C7; border-radius: 6px; padding: 6px 12px; font-size: 12px; font-weight: 600; cursor: pointer;" title="Chỉnh sửa Ban">
              <i class="fa-solid fa-pen-to-square me-1"></i> Sửa
            </button>
            <button type="button" onclick="deleteAdminBoard(${b.id || b.MaToChuc}, '${(b.name || b.TenToChuc || '').replace(/'/g, "\\'")}')" style="border: none; background: #FEE2E2; color: #DC2626; border-radius: 6px; padding: 6px 10px; font-size: 12px; font-weight: 600; cursor: pointer;" title="Xóa Ban">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// ─── 3. BẢNG TỔ CÔNG ĐOÀN (dbo.UNION_BRANCHES) ──────────────────────────────
function renderAdminOrgUnitsTable() {
  const tbody = document.getElementById('admin_org_units_table_body');
  if (!tbody) return;

  if (adminOrgUnits.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 24px; color: #64748B;">Chưa có Tổ công đoàn nào. Hãy bấm "+ Thêm Tổ Công Đoàn Mới".</td></tr>';
    return;
  }

  tbody.innerHTML = adminOrgUnits.map((u, index) => `
    <tr style="border-bottom: 1px solid #E2E8F0; transition: background 0.15s;" onmouseover="this.style.background='#F8FAFC'" onmouseout="this.style.background='white'">
      <td style="padding: 12px 14px; text-align: center; font-weight: 700; color: #005696;">
        <span style="background: #E0F2FE; color: #0369A1; padding: 3px 8px; border-radius: 4px; font-family: monospace;">${u.code || ('TCD_' + String(index + 1).padStart(2, '0'))}</span>
      </td>
      <td style="padding: 12px 14px; font-weight: 700; color: #003865;">${u.name}</td>
      <td style="padding: 12px 14px; font-size: 13px; color: #334155;"><strong>${u.leader || 'Ban Chấp Hành Tổ'}</strong></td>
      <td style="padding: 12px 14px; font-size: 12.5px; color: #005696;"><i class="fa-solid fa-envelope me-1 text-muted"></i> ${u.email || 'congdoan@tdmu.edu.vn'}</td>
      <td style="padding: 12px 14px; font-size: 12.5px; color: #64748B;"><i class="fa-solid fa-phone me-1 text-success"></i> ${u.phone || '0274.3822058'}</td>
      <td style="padding: 12px 14px; text-align: center;">
        <div style="display: flex; gap: 6px; justify-content: center;">
          <button type="button" onclick="openEditUnitModal(${u.id})" style="border: none; background: #E0F2FE; color: #0284C7; border-radius: 6px; padding: 6px 12px; font-size: 12px; font-weight: 600; cursor: pointer;">
            <i class="fa-solid fa-pen-to-square me-1"></i> Sửa
          </button>
          <button type="button" onclick="deleteAdminUnit(${u.id}, '${(u.name || '').replace(/'/g, "\\'")}')" style="border: none; background: #FEE2E2; color: #DC2626; border-radius: 6px; padding: 6px 10px; font-size: 12px; font-weight: 600; cursor: pointer;" title="Xóa Tổ">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
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
  document.getElementById('cadre_board_id').value = adminOrgBoards.length > 0 ? String(adminOrgBoards[0].id) : '2';
  document.getElementById('cadre_duties').value = 'Tham gia công tác phong trào và thực hiện các nhiệm vụ do Ban Thường vụ phân công.';
  
  populateUnitSelect(1);
  populateBoardSelect();

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
  populateBoardSelect(c.board_id || 2);

  document.getElementById('cadre_edit_modal').style.display = 'flex';
}

function populateUnitSelect(selectedId) {
  const sel = document.getElementById('cadre_unit_id');
  if (!sel) return;
  sel.innerHTML = adminOrgUnits.map(u => `
    <option value="${u.id}" ${u.id == selectedId ? 'selected' : ''}>${u.name}</option>
  `).join('');
}

function populateBoardSelect(selectedId) {
  const sel = document.getElementById('cadre_board_id');
  if (!sel) return;
  sel.innerHTML = adminOrgBoards.map(b => `
    <option value="${b.id}" ${b.id == selectedId ? 'selected' : ''}>${b.name}</option>
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

// ─── 4. MODAL ADD / EDIT TỔ CÔNG ĐOÀN (UNION BRANCH) ─────────────────────────
let editingUnitId = null;

function openAddUnitModal() {
  editingUnitId = null;
  document.getElementById('unit_modal_title').innerText = 'Thêm Tổ Công Đoàn Cơ Sở Mới';
  const nextNum = adminOrgUnits.length + 1;
  document.getElementById('unit_code').value = 'TCD_' + String(nextNum).padStart(2, '0');
  document.getElementById('unit_name').value = '';
  document.getElementById('unit_leader').value = '';
  document.getElementById('unit_email').value = '';
  document.getElementById('unit_phone').value = '';
  document.getElementById('unit_office').value = '';

  document.getElementById('unit_edit_modal').style.display = 'flex';
}

function openEditUnitModal(id) {
  const u = adminOrgUnits.find(item => item.id == id);
  if (!u) return;

  editingUnitId = id;
  document.getElementById('unit_modal_title').innerText = 'Cập Nhật Tổ Công Đoàn: ' + u.name;
  document.getElementById('unit_code').value = u.code || '';
  document.getElementById('unit_name').value = u.name || '';
  document.getElementById('unit_leader').value = u.leader || '';
  document.getElementById('unit_email').value = u.email || '';
  document.getElementById('unit_phone').value = u.phone || '';
  document.getElementById('unit_office').value = u.office || '';

  document.getElementById('unit_edit_modal').style.display = 'flex';
}

function closeUnitModal() {
  document.getElementById('unit_edit_modal').style.display = 'none';
  editingUnitId = null;
}

async function saveUnitForm() {
  const code = document.getElementById('unit_code').value.trim();
  const name = document.getElementById('unit_name').value.trim();
  const leader = document.getElementById('unit_leader').value.trim();
  const email = document.getElementById('unit_email').value.trim();
  const phone = document.getElementById('unit_phone').value.trim();
  const office = document.getElementById('unit_office').value.trim();

  if (!name) {
    alert('Vui lòng nhập Tên Tổ Công Đoàn!');
    return;
  }

  const payload = { code, name, leader, email, phone, office };

  try {
    let res;
    if (editingUnitId) {
      res = await fetch(`/api/to-cong-doan/${editingUnitId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(r => r.json());
    } else {
      res = await fetch('/api/to-cong-doan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(r => r.json());
    }

    if (res.success) {
      alert(res.message || 'Đã lưu thông tin Tổ Công đoàn thành công!');
      closeUnitModal();
      loadAdminOrganization();
    } else {
      alert('Lỗi: ' + (res.error || 'Không thể lưu tổ công đoàn'));
    }
  } catch (err) {
    alert('Lỗi kết nối: ' + err.message);
  }
}

async function deleteAdminUnit(id, name) {
  if (!confirm(`Bạn có chắc chắn muốn xóa "${name}"? Hành động này sẽ gỡ liên kết các đoàn viên thuộc tổ này.`)) {
    return;
  }

  try {
    const res = await fetch(`/api/to-cong-doan/${id}`, { method: 'DELETE' }).then(r => r.json());
    if (res.success) {
      alert(res.message || 'Đã xóa Tổ Công đoàn thành công!');
      loadAdminOrganization();
    } else {
      alert('Lỗi: ' + (res.error || 'Không thể xóa tổ công đoàn'));
    }
  } catch (err) {
    alert('Lỗi kết nối: ' + err.message);
  }
}

// ─── 5. MODAL ADD / EDIT CÁC BAN (BOARDS / ORGANIZATIONS) ────────────────────
let editingBoardId = null;

function openAddBoardModal() {
  editingBoardId = null;
  document.getElementById('board_modal_title').innerText = 'Thêm Ban / Hội Đồng Công Đoàn Mới';
  document.getElementById('board_name').value = '';
  document.getElementById('board_tenure').value = 'Nhiệm kỳ 2023 - 2028';
  document.getElementById('board_desc').value = '';
  document.getElementById('board_order').value = adminOrgBoards.length + 1;

  document.getElementById('board_edit_modal').style.display = 'flex';
}

function openEditBoardModal(id) {
  const b = adminOrgBoards.find(item => (item.id || item.MaToChuc) == id);
  if (!b) return;

  editingBoardId = id;
  document.getElementById('board_modal_title').innerText = 'Chỉnh Sửa Ban: ' + (b.name || b.TenToChuc);
  document.getElementById('board_name').value = b.name || b.TenToChuc || '';
  document.getElementById('board_tenure').value = b.tenure || b.NhiemKy || 'Nhiệm kỳ 2023 - 2028';
  document.getElementById('board_desc').value = b.description || b.MoTaChucNang || '';
  document.getElementById('board_order').value = b.orderIndex !== undefined ? b.orderIndex : (b.ThuTuHienThi || 0);

  document.getElementById('board_edit_modal').style.display = 'flex';
}

function closeBoardModal() {
  document.getElementById('board_edit_modal').style.display = 'none';
  editingBoardId = null;
}

async function saveBoardForm() {
  const name = document.getElementById('board_name').value.trim();
  const tenure = document.getElementById('board_tenure').value.trim();
  const description = document.getElementById('board_desc').value.trim();
  const orderIndex = parseInt(document.getElementById('board_order').value) || 0;

  if (!name) {
    alert('Vui lòng nhập Tên Ban / Bộ phận!');
    return;
  }

  const payload = { name, tenure, description, orderIndex };

  try {
    let res;
    if (editingBoardId) {
      res = await fetch(`/api/organizations/${editingBoardId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(r => r.json());
    } else {
      res = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(r => r.json());
    }

    if (res.success) {
      alert(res.message || 'Đã lưu thông tin Ban thành công!');
      closeBoardModal();
      loadAdminOrganization();
    } else {
      alert('Lỗi: ' + (res.error || 'Không thể lưu Ban'));
    }
  } catch (err) {
    alert('Lỗi kết nối: ' + err.message);
  }
}

async function deleteAdminBoard(id, name) {
  if (!confirm(`Bạn có chắc chắn muốn xóa "${name}" khỏi cơ cấu tổ chức? Các cán bộ thuộc Ban này sẽ được giữ lại nhưng không thuộc ban nào.`)) {
    return;
  }

  try {
    const res = await fetch(`/api/organizations/${id}`, { method: 'DELETE' }).then(r => r.json());
    if (res.success) {
      alert(res.message || 'Đã xóa Ban thành công!');
      loadAdminOrganization();
    } else {
      alert('Lỗi: ' + (res.error || 'Không thể xóa Ban'));
    }
  } catch (err) {
    alert('Lỗi kết nối: ' + err.message);
  }
}
