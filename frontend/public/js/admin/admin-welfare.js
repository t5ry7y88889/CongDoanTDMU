// =============================================================================
// ADMIN WELFARE MANAGEMENT - QUẢN LÝ VĂN BẢN & CHÍNH SÁCH PHÚC LỢI
// Tinh giản, chuẩn hóa đồng bộ như Kho Văn Bản và Kho Biểu Mẫu
// =============================================================================

let adminWelfarePolicies = [];
let currentWelfareCatFilter = 'all';
let currentWelfarePage = 1;
const welfarePageSize = 8;

// Escape HTML helper
function escapeHtmlWelfare(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// 1. Tải danh sách văn bản chính sách phúc lợi
async function loadAdminWelfare() {
  const tbody = document.getElementById('admin_welfare_pdf_table_body');
  if (tbody) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 24px; color: #64748B;"><i class="fa-solid fa-circle-notch fa-spin me-2"></i> Đang tải danh sách văn bản phúc lợi...</td></tr>';
  }

  try {
    const res = await fetch('/api/welfare').then(r => r.json());
    if (res.success && Array.isArray(res.data)) {
      adminWelfarePolicies = res.data;
    } else {
      adminWelfarePolicies = [];
    }

    renderAdminWelfarePoliciesTable();
  } catch (err) {
    console.error('Lỗi loadAdminWelfare:', err);
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 24px; color: #EF4444;">Lỗi kết nối máy chủ khi tải danh sách phúc lợi.</td></tr>';
    }
  }
}

// 2. Lọc theo chuyên mục
function filterWelfareCategory(cat) {
  currentWelfareCatFilter = cat;
  currentWelfarePage = 1;

  document.querySelectorAll('.btn-welf-cat-filter').forEach(btn => {
    if (btn.dataset.cat === cat) {
      btn.style.background = '#DC2626';
      btn.style.color = 'white';
      btn.style.fontWeight = '700';
    } else {
      btn.style.background = '#F1F5F9';
      btn.style.color = '#475569';
      btn.style.fontWeight = '600';
    }
  });

  renderAdminWelfarePoliciesTable();
}

// 3. Tìm kiếm văn bản
function searchAdminWelfare(query) {
  currentWelfarePage = 1;
  renderAdminWelfarePoliciesTable(query);
}

// 4. Render bảng danh sách văn bản phúc lợi chuẩn như Kho Văn Bản
function renderAdminWelfarePoliciesTable(searchQuery = '') {
  const tbody = document.getElementById('admin_welfare_pdf_table_body');
  if (!tbody) return;

  const strip = str => (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLowerCase();
  const q = strip(searchQuery || document.getElementById('admin_welfare_search')?.value || '');

  let filtered = adminWelfarePolicies;

  if (currentWelfareCatFilter !== 'all') {
    filtered = filtered.filter(item => item.category === currentWelfareCatFilter);
  }

  if (q) {
    filtered = filtered.filter(item =>
      strip(item.title).includes(q) ||
      strip(item.code).includes(q) ||
      strip(item.category_name).includes(q) ||
      strip(item.category).includes(q)
    );
  }

  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 32px; color: #94A3B8; font-style: italic;">Không tìm thấy văn bản chính sách phúc lợi nào phù hợp.</td></tr>';
    const pager = document.getElementById('admin_welfare_pagination');
    if (pager) pager.innerHTML = '';
    return;
  }

  const categoryBadges = {
    le_tet: '<span style="background: #FEF3C7; color: #92400E; padding: 4px 8px; border-radius: 4px; font-weight: 700; font-size: 11.5px;"><i class="fa-solid fa-gift me-1 text-warning"></i>Lễ, Tết &amp; Kỷ Niệm</span>',
    tro_cap: '<span style="background: #EFF6FF; color: #1E40AF; padding: 4px 8px; border-radius: 4px; font-weight: 700; font-size: 11.5px;"><i class="fa-solid fa-hand-holding-heart me-1 text-primary"></i>Trợ Cấp Khó Khăn</span>',
    vay_von: '<span style="background: #ECFDF5; color: #065F46; padding: 4px 8px; border-radius: 4px; font-weight: 700; font-size: 11.5px;"><i class="fa-solid fa-money-bill-wave me-1 text-success"></i>Quỹ Trợ Vốn CEP</span>',
    y_te: '<span style="background: #F0FDF4; color: #15803D; padding: 4px 8px; border-radius: 4px; font-weight: 700; font-size: 11.5px;"><i class="fa-solid fa-heart-pulse me-1 text-danger"></i>Khám Sức Khỏe</span>',
    nu_cong: '<span style="background: #FDF2F8; color: #9D174D; padding: 4px 8px; border-radius: 4px; font-weight: 700; font-size: 11.5px;"><i class="fa-solid fa-children me-1 text-pink"></i>Nữ Công &amp; Thiếu Nhi</span>',
    uu_dai: '<span style="background: #F3F4F6; color: #374151; padding: 4px 8px; border-radius: 4px; font-weight: 700; font-size: 11.5px;"><i class="fa-solid fa-tags me-1 text-secondary"></i>Ưu Đãi Đoàn Viên</span>'
  };

  // Phân trang
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / welfarePageSize) || 1;
  if (currentWelfarePage > totalPages) currentWelfarePage = totalPages;
  const startIndex = (currentWelfarePage - 1) * welfarePageSize;
  const pagedItems = filtered.slice(startIndex, startIndex + welfarePageSize);

  renderWelfarePaginationBar(totalItems, totalPages);

  tbody.innerHTML = pagedItems.map(item => {
    const pdfUrl = item.file_url || '/uploads/welfare/Quy_Che_Phuc_Loi_Le_Tet_2026.pdf';
    const pdfSize = item.file_size || '1.8 MB';
    const fileName = pdfUrl.split('/').pop();
    const downloadCount = parseInt(item.downloads_count || item.LuotTai || 0);

    return `
      <tr style="border-bottom: 1px solid #F1F5F9; transition: background 0.15s;" onmouseover="this.style.background='#F8FAFC'" onmouseout="this.style.background='white'">
        <!-- Cột 1: Số / Ký hiệu -->
        <td style="padding: 12px 16px; font-weight: 800; color: #002855; white-space: nowrap;">
          <span style="font-family: monospace; font-size: 13px; background: #F1F5F9; padding: 3px 8px; border-radius: 4px; border: 1px solid #CBD5E1;">
            ${escapeHtmlWelfare(item.code || 'PL-0' + item.id)}
          </span>
        </td>

        <!-- Cột 2: Trích yếu chính sách -->
        <td style="padding: 12px 16px;">
          <div style="font-weight: 700; color: #003865; font-size: 13.5px; line-height: 1.4;">
            ${escapeHtmlWelfare(item.title)}
          </div>
        </td>

        <!-- Cột 3: Chuyên mục -->
        <td style="padding: 12px 16px; white-space: nowrap;">
          ${categoryBadges[item.category] || '<span class="badge bg-secondary">Chăm Lo Chung</span>'}
        </td>

        <!-- Cột 4: Ngày ban hành -->
        <td style="padding: 12px 16px; white-space: nowrap; color: #475569; font-size: 12.5px;">
          <i class="fa-regular fa-calendar me-1 text-muted"></i>${escapeHtmlWelfare(item.date || '15/01/2026')}
        </td>

        <!-- Cột 5: Tệp đính kèm (PDF/Word) -->
        <td style="padding: 12px 16px; white-space: nowrap;">
          <div style="display: inline-flex; align-items: center; gap: 6px; background: #FEF2F2; border: 1px solid #FECACA; border-radius: 6px; padding: 4px 8px;">
            <i class="fa-solid fa-file-pdf text-danger" style="font-size: 16px;"></i>
            <span style="font-size: 11.5px; font-weight: 600; color: #991B1B; max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHtmlWelfare(fileName)}">
              ${escapeHtmlWelfare(fileName)}
            </span>
            <a href="/api/welfare/download/${item.id}" target="_blank" onclick="trackPdfDownload(${item.id})" style="background: #DC2626; color: white; border-radius: 4px; padding: 2px 6px; font-size: 11px; font-weight: 700; text-decoration: none; margin-left: 2px;" title="Tải về">
              <i class="fa-solid fa-download"></i>
            </a>
          </div>
        </td>

        <!-- Cột 6: Lượt tải -->
        <td style="padding: 12px 16px; text-align: center; white-space: nowrap;">
          <span style="background: #F8FAFC; color: #002855; font-weight: 700; font-size: 12px; padding: 2px 8px; border-radius: 12px; border: 1px solid #CBD5E1;">
            <i class="fa-solid fa-download text-muted me-1" style="font-size: 10px;"></i>${downloadCount}
          </span>
        </td>

        <!-- Cột 7: Thao tác -->
        <td style="padding: 12px 16px; text-align: right; white-space: nowrap;">
          <button type="button" onclick="openEditWelfarePostModal(${item.id})" style="background: #003865; color: white; border: none; border-radius: 5px; padding: 5px 10px; font-size: 12px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; margin-right: 4px;">
            <i class="fa-solid fa-pen-to-square"></i> Sửa
          </button>
          <button type="button" onclick="deleteWelfarePost(${item.id})" style="background: transparent; border: 1px solid #CBD5E1; color: #EF4444; border-radius: 5px; padding: 4px 8px; font-size: 12px; cursor: pointer;" title="Xóa văn bản">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// 5. Thanh phân trang
function renderWelfarePaginationBar(totalItems, totalPages) {
  const container = document.getElementById('admin_welfare_pagination');
  if (!container) return;

  if (totalItems <= welfarePageSize) {
    container.innerHTML = `<span style="font-size: 12px; color: #64748B;">Tổng số <strong>${totalItems}</strong> văn bản chính sách phúc lợi</span>`;
    return;
  }

  let html = `
    <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; flex-wrap: wrap; gap: 10px;">
      <span style="font-size: 12px; color: #64748B;">
        Hiển thị <strong>${(currentWelfarePage - 1) * welfarePageSize + 1} - ${Math.min(currentWelfarePage * welfarePageSize, totalItems)}</strong> / Tổng <strong>${totalItems}</strong> văn bản
      </span>
      <div style="display: flex; gap: 4px; align-items: center;">
        <button type="button" onclick="changeWelfarePage(${currentWelfarePage - 1})" ${currentWelfarePage <= 1 ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''} style="background: white; border: 1px solid #CBD5E1; border-radius: 5px; padding: 4px 9px; font-size: 12px; font-weight: 600; color: #334155; cursor: pointer;">
          <i class="fa-solid fa-chevron-left me-1"></i>Trước
        </button>
  `;

  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || (p >= currentWelfarePage - 1 && p <= currentWelfarePage + 1)) {
      html += `
        <button type="button" onclick="changeWelfarePage(${p})" style="background: ${p === currentWelfarePage ? '#DC2626' : 'white'}; color: ${p === currentWelfarePage ? 'white' : '#334155'}; border: 1px solid ${p === currentWelfarePage ? '#DC2626' : '#CBD5E1'}; border-radius: 5px; padding: 4px 10px; font-size: 12px; font-weight: 700; cursor: pointer;">
          ${p}
        </button>
      `;
    } else if (p === currentWelfarePage - 2 || p === currentWelfarePage + 2) {
      html += `<span style="padding: 0 3px; color: #94A3B8;">...</span>`;
    }
  }

  html += `
        <button type="button" onclick="changeWelfarePage(${currentWelfarePage + 1})" ${currentWelfarePage >= totalPages ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''} style="background: white; border: 1px solid #CBD5E1; border-radius: 5px; padding: 4px 9px; font-size: 12px; font-weight: 600; color: #334155; cursor: pointer;">
          Sau<i class="fa-solid fa-chevron-right ms-1"></i>
        </button>
      </div>
    </div>
  `;

  container.innerHTML = html;
}

function changeWelfarePage(newPage) {
  currentWelfarePage = newPage;
  renderAdminWelfarePoliciesTable();
  const top = document.getElementById('tab_welfare_content');
  if (top) top.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// 6. Modal Thêm / Chỉnh sửa văn bản phúc lợi
function openAddWelfarePostModal() {
  document.getElementById('modal_welf_post_heading').innerHTML = '<i class="fa-solid fa-file-pdf text-danger me-2"></i>Thêm Văn Bản Phúc LỢi Mới';
  document.getElementById('welf_post_id').value = '';
  document.getElementById('welf_post_code').value = `PL-0${adminWelfarePolicies.length + 1}`;
  document.getElementById('welf_post_title').value = '';
  document.getElementById('welf_post_category').value = 'le_tet';
  document.getElementById('welf_post_date').value = new Date().toISOString().substring(0, 10);
  document.getElementById('welf_post_file_url').value = '/uploads/welfare/Quy_Che_Phuc_Loi_Le_Tet_2026.pdf';
  document.getElementById('welf_post_file_size').value = '1.8 MB';

  const fileInput = document.getElementById('welf_post_file_input');
  if (fileInput) fileInput.value = '';
  const currentWrap = document.getElementById('welf_post_current_file_wrap');
  if (currentWrap) currentWrap.style.display = 'none';

  document.getElementById('modal_welfare_post').style.display = 'flex';
}

function openEditWelfarePostModal(id) {
  const item = adminWelfarePolicies.find(p => p.id === id);
  if (!item) return;

  document.getElementById('modal_welf_post_heading').innerHTML = `<i class="fa-solid fa-pen-to-square text-primary me-2"></i>Chỉnh Sửa Văn Bản Phúc Lợi #${item.id}`;
  document.getElementById('welf_post_id').value = item.id;
  document.getElementById('welf_post_code').value = item.code || '';
  document.getElementById('welf_post_title').value = item.title || '';
  document.getElementById('welf_post_category').value = item.category || 'le_tet';
  document.getElementById('welf_post_date').value = item.date ? item.date.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1') : new Date().toISOString().substring(0, 10);
  document.getElementById('welf_post_file_url').value = item.file_url || '/uploads/welfare/Quy_Che_Phuc_Loi_Le_Tet_2026.pdf';
  document.getElementById('welf_post_file_size').value = item.file_size || '1.8 MB';

  const fileInput = document.getElementById('welf_post_file_input');
  if (fileInput) fileInput.value = '';
  const currentWrap = document.getElementById('welf_post_current_file_wrap');
  if (currentWrap) {
    currentWrap.style.display = 'flex';
    const fileNameEl = document.getElementById('welf_post_current_file_name');
    const fileSizeEl = document.getElementById('welf_post_current_file_size');
    if (fileNameEl) fileNameEl.innerText = (item.file_url || '').split('/').pop() || 'Tệp đính kèm';
    if (fileSizeEl) fileSizeEl.innerText = item.file_size || '1.8 MB';
  }

  document.getElementById('modal_welfare_post').style.display = 'flex';
}

function closeWelfarePostModal() {
  document.getElementById('modal_welfare_post').style.display = 'none';
}

// 7. Lưu form Thêm / Sửa
async function submitWelfarePostForm() {
  const id = document.getElementById('welf_post_id').value;
  const code = document.getElementById('welf_post_code').value.trim();
  const title = document.getElementById('welf_post_title').value.trim();
  const category = document.getElementById('welf_post_category').value;
  const dateVal = document.getElementById('welf_post_date').value;
  const file_url = document.getElementById('welf_post_file_url')?.value.trim() || '';
  const file_size = document.getElementById('welf_post_file_size')?.value.trim() || '1.8 MB';
  const fileInput = document.getElementById('welf_post_file_input');

  if (!title) {
    alert('Vui lòng nhập trích yếu / tiêu đề văn bản phúc lợi!');
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

  if (!id && !fileBase64 && !file_url) {
    alert('Vui lòng chọn tệp văn bản đính kèm (PDF / Word)!');
    return;
  }

  let formattedDate = '15/01/2026';
  if (dateVal) {
    const parts = dateVal.split('-');
    if (parts.length === 3) formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  const payload = {
    title,
    code: code || `PL-0${adminWelfarePolicies.length + 1}`,
    category,
    date: formattedDate,
    file_url,
    file_size,
    fileName,
    fileBase64
  };

  try {
    let res;
    if (id) {
      res = await fetch(`/api/welfare/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(r => r.json());
    } else {
      res = await fetch('/api/welfare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(r => r.json());
    }

    if (res.success) {
      alert(id ? '✅ Đã cập nhật văn bản phúc lợi thành công!' : '✅ Đã đăng tải văn bản phúc lợi mới thành công!');
      closeWelfarePostModal();
      loadAdminWelfare();
    } else {
      alert('Lỗi: ' + res.error);
    }
  } catch (err) {
    alert('Lỗi kết nối máy chủ: ' + err.message);
  }
}

// 8. Xóa bài đăng văn bản phúc lợi
async function deleteWelfarePost(id) {
  if (!confirm(`Bạn có chắc chắn muốn xóa văn bản phúc lợi #${id} này?`)) return;

  try {
    const res = await fetch(`/api/welfare/${id}`, { method: 'DELETE' }).then(r => r.json());
    if (res.success) {
      alert('✅ Đã xóa văn bản phúc lợi thành công!');
      loadAdminWelfare();
    } else {
      alert('Lỗi: ' + res.error);
    }
  } catch (e) {
    alert('Lỗi kết nối: ' + e.message);
  }
}

// 9. Theo dõi lượt tải
async function trackPdfDownload(id) {
  try {
    await fetch(`/api/welfare/${id}/download`, { method: 'POST' });
    const item = adminWelfarePolicies.find(p => p.id === id);
    if (item) {
      item.downloads_count = (parseInt(item.downloads_count || 0) + 1);
      renderAdminWelfarePoliciesTable();
    }
  } catch (e) {}
}

// Window exports
window.loadAdminWelfare = loadAdminWelfare;
window.filterWelfareCategory = filterWelfareCategory;
window.searchAdminWelfare = searchAdminWelfare;
window.renderAdminWelfarePoliciesTable = renderAdminWelfarePoliciesTable;
window.renderWelfarePaginationBar = renderWelfarePaginationBar;
window.changeWelfarePage = changeWelfarePage;
window.openAddWelfarePostModal = openAddWelfarePostModal;
window.openEditWelfarePostModal = openEditWelfarePostModal;
window.closeWelfarePostModal = closeWelfarePostModal;
window.submitWelfarePostForm = submitWelfarePostForm;
window.deleteWelfarePost = deleteWelfarePost;
window.trackPdfDownload = trackPdfDownload;
