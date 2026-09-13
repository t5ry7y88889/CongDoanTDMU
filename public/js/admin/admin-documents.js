// =============================================================================
// ADMIN DOCUMENTS (KHO VĂN BẢN CHỈ ĐẠO & ĐIỀU HÀNH CHUẨN DMS)
// =============================================================================

let adminDocumentsList = [];
let currentDocCategory = 'all';
let editingDocId = null;

async function loadAdminDocuments() {
  const tbody = document.getElementById('admin_documents_table_body');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 24px; color: #64748B;"><i class="fa-solid fa-circle-notch fa-spin me-2"></i> Đang tải kho văn bản chỉ đạo...</td></tr>';

  try {
    const res = await fetch('/api/documents').then(r => r.json());
    if (res.success) {
      adminDocumentsList = res.data || [];
      renderAdminDocumentsTable();
      updateDocumentBadgeCount();
    } else {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 24px; color: #EF4444;">Không thể tải danh sách văn bản.</td></tr>';
    }
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 24px; color: #EF4444;">Lỗi kết nối máy chủ.</td></tr>';
  }
}

function updateDocumentBadgeCount() {
  const badgeEl = document.getElementById('sidebar_documents_count');
  if (badgeEl) {
    badgeEl.innerText = adminDocumentsList.length;
  }
}

function filterDocCategory(cat) {
  currentDocCategory = cat;
  document.querySelectorAll('.btn-doc-filter').forEach(b => {
    if (b.dataset.cat === cat) {
      b.style.background = '#059669';
      b.style.color = 'white';
    } else {
      b.style.background = '#F1F5F9';
      b.style.color = '#475569';
    }
  });
  renderAdminDocumentsTable();
}

function searchAdminDocuments(q) {
  renderAdminDocumentsTable(q);
}

function renderAdminDocumentsTable(searchQuery = '') {
  const tbody = document.getElementById('admin_documents_table_body');
  if (!tbody) return;

  const strip = str => (str || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[đĐ]/g, 'd').toLowerCase();
  const q = strip(searchQuery || document.getElementById('admin_documents_search')?.value || '');

  let filtered = adminDocumentsList;
  if (currentDocCategory !== 'all') {
    filtered = filtered.filter(d => (d.loai_van_ban === currentDocCategory || d.LoaiVanBan === currentDocCategory));
  }
  if (q) {
    filtered = filtered.filter(d =>
      strip(d.so_hieu || d.SoHieuVanBan).includes(q) ||
      strip(d.tieu_de || d.TenVanBan).includes(q) ||
      strip(d.co_quan_ban_hanh || d.CoQuanBanHanh).includes(q) ||
      strip(d.nguoi_ky || d.NguoiKy).includes(q)
    );
  }

  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 28px; color: #94A3B8; font-style: italic;">Không tìm thấy văn bản nào trong kho.</td></tr>';
    return;
  }

  const catBadges = {
    tuyentruyen: '<span style="background: #FEF3C7; color: #D97706; padding: 3px 8px; border-radius: 4px; font-weight: 700; font-size: 11px;">Tuyên truyền</span>',
    kehoach: '<span style="background: #ECFDF5; color: #059669; padding: 3px 8px; border-radius: 4px; font-weight: 700; font-size: 11px;">Kế hoạch</span>',
    luat: '<span style="background: #EFF6FF; color: #1D4ED8; padding: 3px 8px; border-radius: 4px; font-weight: 700; font-size: 11px;">Văn bản luật</span>',
    quyetdinh: '<span style="background: #FEE2E2; color: #DC2626; padding: 3px 8px; border-radius: 4px; font-weight: 700; font-size: 11px;">Quyết định</span>',
    huongdan: '<span style="background: #F5F3FF; color: #7C3AED; padding: 3px 8px; border-radius: 4px; font-weight: 700; font-size: 11px;">Hướng dẫn</span>',
    thongbao: '<span style="background: #F0FDF4; color: #16A34A; padding: 3px 8px; border-radius: 4px; font-weight: 700; font-size: 11px;">Thông báo</span>'
  };

  tbody.innerHTML = filtered.map(d => {
    const isConHieuLuc = (d.hieu_luc || 'con_hieu_luc') === 'con_hieu_luc';
    const statusBadge = isConHieuLuc
      ? '<span style="background: #ECFDF5; color: #059669; padding: 3px 8px; border-radius: 4px; font-weight: 700; font-size: 11px;"><i class="fa-solid fa-circle-check me-1"></i>Còn hiệu lực</span>'
      : '<span style="background: #F1F5F9; color: #64748B; padding: 3px 8px; border-radius: 4px; font-weight: 600; font-size: 11px;"><i class="fa-solid fa-ban me-1"></i>Hết hiệu lực</span>';

    return `
      <tr style="border-bottom: 1px solid #F1F5F9; transition: background 0.15s;" onmouseover="this.style.background='#F8FAFC'" onmouseout="this.style.background='white'">
        <td style="padding: 12px; font-weight: 800; color: #002855; white-space: nowrap;">
          <i class="fa-solid fa-file-pdf text-danger me-2"></i>${escapeHtml(d.so_hieu || d.SoHieuVanBan || 'N/A')}
        </td>
        <td style="padding: 12px;">
          <div style="font-weight: 700; color: #1E293B; margin-bottom: 3px;">${escapeHtml(d.tieu_de || d.TenVanBan || '')}</div>
          <div style="font-size: 11.5px; color: #64748B;">
            Ban hành: <strong>${escapeHtml(d.co_quan_ban_hanh || d.CoQuanBanHanh || 'CĐ TDMU')}</strong> | Người ký: <strong>${escapeHtml(d.nguoi_ky || d.NguoiKy || 'Ban Thường Vụ')}</strong>
          </div>
        </td>
        <td style="padding: 12px; white-space: nowrap;">
          ${catBadges[d.loai_van_ban || d.LoaiVanBan] || '<span class="badge bg-secondary">Văn bản</span>'}
        </td>
        <td style="padding: 12px; font-size: 12.5px; color: #334155; white-space: nowrap;">
          ${escapeHtml(d.ngay_ban_hanh || d.NgayBanHanh || '')}
        </td>
        <td style="padding: 12px; white-space: nowrap;">
          ${statusBadge}
        </td>
        <td style="padding: 12px; text-align: center; white-space: nowrap;">
          <span style="display: inline-flex; align-items: center; gap: 4px; font-weight: 800; color: #059669; background: #ECFDF5; padding: 4px 10px; border-radius: 12px; font-size: 12px;">
            <i class="fa-solid fa-download"></i> ${d.luot_tai || d.LuotTai || 0}
          </span>
        </td>
        <td style="padding: 12px; text-align: right; white-space: nowrap;">
          <a href="/api/documents/download/${d.id || d.MaVanBan}" target="_blank" style="background: #059669; color: white; border: none; border-radius: 6px; padding: 5px 10px; font-size: 11.5px; font-weight: 700; text-decoration: none; display: inline-flex; align-items: center; gap: 4px; margin-right: 4px;" title="Tải về">
            <i class="fa-solid fa-download"></i> Tải về
          </a>
          <button type="button" onclick="openEditDocumentModal(${d.id || d.MaVanBan})" style="background: white; border: 1px solid #CBD5E1; color: #0284C7; border-radius: 6px; padding: 4px 8px; font-size: 11.5px; cursor: pointer; margin-right: 4px;" title="Chỉnh sửa">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button type="button" onclick="deleteAdminDocument(${d.id || d.MaVanBan})" style="background: transparent; border: 1px solid #CBD5E1; color: #EF4444; border-radius: 6px; padding: 4px 8px; font-size: 11.5px; cursor: pointer;" title="Xóa văn bản">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function openAddDocumentModal() {
  editingDocId = null;
  document.getElementById('modal_doc_title_header').innerText = 'Thêm Văn Bản Chỉ Đạo Mới';
  document.getElementById('doc_so_hieu_input').value = '';
  document.getElementById('doc_tieu_de_input').value = '';
  document.getElementById('doc_loai_select').value = 'tuyentruyen';
  document.getElementById('doc_co_quan_input').value = 'Ban Thường Vụ Công Đoàn TDMU';
  document.getElementById('doc_nguoi_ky_input').value = 'TS. Lê Thị Kim Út';
  document.getElementById('doc_ngay_input').value = new Date().toISOString().split('T')[0];
  document.getElementById('doc_hieu_luc_select').value = 'con_hieu_luc';
  document.getElementById('doc_file_input').value = '';
  document.getElementById('modal_document_form').style.display = 'flex';
}

function openEditDocumentModal(id) {
  const doc = adminDocumentsList.find(d => (d.id || d.MaVanBan) === id);
  if (!doc) return;

  editingDocId = id;
  document.getElementById('modal_doc_title_header').innerText = `Chỉnh Sửa Văn Bản: ${doc.so_hieu || doc.SoHieuVanBan || ''}`;
  document.getElementById('doc_so_hieu_input').value = doc.so_hieu || doc.SoHieuVanBan || '';
  document.getElementById('doc_tieu_de_input').value = doc.tieu_de || doc.TenVanBan || '';
  document.getElementById('doc_loai_select').value = doc.loai_van_ban || doc.LoaiVanBan || 'tuyentruyen';
  document.getElementById('doc_co_quan_input').value = doc.co_quan_ban_hanh || doc.CoQuanBanHanh || 'Ban Thường Vụ Công Đoàn TDMU';
  document.getElementById('doc_nguoi_ky_input').value = doc.nguoi_ky || doc.NguoiKy || 'TS. Lê Thị Kim Út';
  document.getElementById('doc_ngay_input').value = doc.ngay_ban_hanh || doc.NgayBanHanh || new Date().toISOString().split('T')[0];
  document.getElementById('doc_hieu_luc_select').value = doc.hieu_luc || 'con_hieu_luc';
  document.getElementById('doc_file_input').value = '';
  document.getElementById('modal_document_form').style.display = 'flex';
}

function closeDocumentModal() {
  document.getElementById('modal_document_form').style.display = 'none';
  editingDocId = null;
}

async function submitDocumentForm() {
  const so_hieu = (document.getElementById('doc_so_hieu_input')?.value || '').trim();
  const tieu_de = (document.getElementById('doc_tieu_de_input')?.value || '').trim();
  const loai_van_ban = document.getElementById('doc_loai_select')?.value || 'tuyentruyen';
  const co_quan_ban_hanh = (document.getElementById('doc_co_quan_input')?.value || '').trim();
  const nguoi_ky = (document.getElementById('doc_nguoi_ky_input')?.value || '').trim();
  const ngay_ban_hanh = document.getElementById('doc_ngay_input')?.value;
  const hieu_luc = document.getElementById('doc_hieu_luc_select')?.value || 'con_hieu_luc';
  const fileInput = document.getElementById('doc_file_input');

  if (!so_hieu || !tieu_de) {
    alert('⚠️ Vui lòng nhập đầy đủ Số hiệu và Trích yếu văn bản!');
    return;
  }

  let fileBase64 = '';
  let fileName = '';

  if (fileInput && fileInput.files && fileInput.files[0]) {
    const f = fileInput.files[0];
    fileName = f.name;
    fileBase64 = await new Promise(res => {
      const reader = new FileReader();
      reader.onload = () => res(reader.result);
      reader.readAsDataURL(f);
    });
  }

  const payload = {
    so_hieu,
    tieu_de,
    loai_van_ban,
    co_quan_ban_hanh,
    nguoi_ky,
    ngay_ban_hanh,
    hieu_luc,
    fileName,
    fileBase64
  };

  try {
    const url = editingDocId ? `/api/documents/${editingDocId}` : '/api/documents';
    const method = editingDocId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(r => r.json());

    if (res.success) {
      alert(editingDocId ? '✅ Đã cập nhật văn bản thành công!' : '🎉 Đã thêm văn bản chỉ đạo mới thành công!');
      closeDocumentModal();
      loadAdminDocuments();
    } else {
      alert('Lỗi: ' + res.error);
    }
  } catch (e) {
    alert('Lỗi kết nối: ' + e.message);
  }
}

async function deleteAdminDocument(id) {
  if (!confirm('Xác nhận xóa văn bản này khỏi hệ thống lưu trữ?')) return;
  try {
    const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' }).then(r => r.json());
    if (res.success) {
      alert('✅ Đã xóa văn bản thành công!');
      loadAdminDocuments();
    } else {
      alert('Lỗi: ' + res.error);
    }
  } catch (e) {
    alert('Lỗi kết nối: ' + e.message);
  }
}
