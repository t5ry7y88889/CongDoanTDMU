// =============================================================================
// ADMIN TEMPLATES (KHO BIỂU MẪU CÔNG ĐOÀN TDMU)
// =============================================================================

let adminTemplatesList = [];
let currentTemplateCategory = 'all';

async function loadAdminTemplates() {
  const tbody = document.getElementById('admin_templates_table_body');
  if (!tbody) return;
  
  tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 24px; color: #64748B;"><i class="fa-solid fa-circle-notch fa-spin me-2"></i> Đang tải danh sách biểu mẫu...</td></tr>';

  try {
    const res = await fetch('/api/templates').then(r => r.json());
    if (res.success) {
      adminTemplatesList = res.data || [];
      renderAdminTemplatesTable();
      safeSetText('sidebar_templates_count', adminTemplatesList.length);
    } else {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 24px; color: #EF4444;">Không thể tải danh sách biểu mẫu.</td></tr>';
    }
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 24px; color: #EF4444;">Lỗi kết nối máy chủ.</td></tr>';
  }
}

function filterTemplatesCategory(cat) {
  currentTemplateCategory = cat;
  document.querySelectorAll('.btn-tpl-filter').forEach(b => {
    if (b.dataset.cat === cat) {
      b.style.background = '#0284C7';
      b.style.color = 'white';
    } else {
      b.style.background = '#F1F5F9';
      b.style.color = '#475569';
    }
  });
  renderAdminTemplatesTable();
}

function searchAdminTemplates(q) {
  renderAdminTemplatesTable(q);
}

function renderAdminTemplatesTable(searchQuery = '') {
  const tbody = document.getElementById('admin_templates_table_body');
  if (!tbody) return;

  const strip = str => (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLowerCase();
  const q = strip(searchQuery || document.getElementById('admin_templates_search')?.value || '');

  let filtered = adminTemplatesList;
  if (currentTemplateCategory !== 'all') {
    filtered = filtered.filter(t => t.category === currentTemplateCategory);
  }
  if (q) {
    filtered = filtered.filter(t => strip(t.title).includes(q) || strip(t.code).includes(q) || strip(t.description).includes(q));
  }

  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 28px; color: #94A3B8; font-style: italic;">Không tìm thấy biểu mẫu nào phù hợp.</td></tr>';
    return;
  }

  const catBadges = {
    doan_vien: '<span style="background: #EFF6FF; color: #1D4ED8; padding: 3px 8px; border-radius: 4px; font-weight: 700; font-size: 11px;">Đoàn Viên</span>',
    to_cong_doan: '<span style="background: #ECFDF5; color: #059669; padding: 3px 8px; border-radius: 4px; font-weight: 700; font-size: 11px;">Tổ Công Đoàn</span>',
    tro_cap: '<span style="background: #FEF3C7; color: #D97706; padding: 3px 8px; border-radius: 4px; font-weight: 700; font-size: 11px;">Chăm Lo &amp; Trợ Cấp</span>',
    thi_dua: '<span style="background: #FDF2F8; color: #DB2777; padding: 3px 8px; border-radius: 4px; font-weight: 700; font-size: 11px;">Thi Đua</span>',
    tro_von: '<span style="background: #F5F3FF; color: #7C3AED; padding: 3px 8px; border-radius: 4px; font-weight: 700; font-size: 11px;">Quỹ Trợ Vốn</span>'
  };

  tbody.innerHTML = filtered.map(t => `
    <tr style="border-bottom: 1px solid #F1F5F9; transition: background 0.15s;" onmouseover="this.style.background='#F8FAFC'" onmouseout="this.style.background='white'">
      <td style="padding: 12px; font-weight: 800; color: #002855; white-space: nowrap;">
        <i class="fa-solid fa-file-word text-primary me-2"></i>${escapeHtml(t.code)}
      </td>
      <td style="padding: 12px;">
        <div style="font-weight: 700; color: #1E293B; margin-bottom: 2px;">${escapeHtml(t.title)}</div>
        <div style="font-size: 12px; color: #64748B;">${escapeHtml(t.description || '')}</div>
      </td>
      <td style="padding: 12px; white-space: nowrap;">
        ${catBadges[t.category] || '<span class="badge bg-secondary">Biểu mẫu</span>'}
      </td>
      <td style="padding: 12px; font-size: 12px; color: #64748B; white-space: nowrap;">
        <span style="font-weight: 600; color: #334155;">${escapeHtml(t.file_type?.toUpperCase() || 'DOCX')}</span> (${t.file_size || '4 KB'})
      </td>
      <td style="padding: 12px; text-align: center; white-space: nowrap;">
        <span style="display: inline-flex; align-items: center; gap: 4px; font-weight: 800; color: #0284C7; background: #F0F9FF; padding: 4px 10px; border-radius: 12px; font-size: 12px;">
          <i class="fa-solid fa-download"></i> ${t.downloads_count || 0}
        </span>
      </td>
      <td style="padding: 12px; text-align: right; white-space: nowrap;">
        <a href="/api/templates/download/${t.id}" target="_blank" style="background: #0284C7; color: white; border: none; border-radius: 6px; padding: 5px 10px; font-size: 11.5px; font-weight: 700; text-decoration: none; display: inline-flex; align-items: center; gap: 4px; margin-right: 6px;" title="Tải về kiểm tra">
          <i class="fa-solid fa-download"></i> Tải về
        </a>
        <button type="button" onclick="deleteAdminTemplate(${t.id})" style="background: transparent; border: 1px solid #CBD5E1; color: #EF4444; border-radius: 6px; padding: 4px 8px; font-size: 11.5px; cursor: pointer;" title="Xóa biểu mẫu">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

async function deleteAdminTemplate(id) {
  if (!confirm("Xác nhận xóa biểu mẫu này khỏi hệ thống?")) return;
  try {
    const res = await fetch('/api/templates/' + id, { method: 'DELETE' }).then(r => r.json());
    if (res.success) {
      alert("✅ Đã xóa biểu mẫu thành công!");
      loadAdminTemplates();
    } else {
      alert("Lỗi: " + res.error);
    }
  } catch (e) {
    alert("Lỗi kết nối: " + e.message);
  }
}

function openAddTemplateModal() {
  document.getElementById('modal_add_template').style.display = 'flex';
}

function closeAddTemplateModal() {
  document.getElementById('modal_add_template').style.display = 'none';
}

async function submitNewTemplate() {
  const code = (document.getElementById('tpl_code_input')?.value || '').trim();
  const title = (document.getElementById('tpl_title_input')?.value || '').trim();
  const description = (document.getElementById('tpl_desc_input')?.value || '').trim();
  const category = document.getElementById('tpl_category_select')?.value || 'doan_vien';
  const fileInput = document.getElementById('tpl_file_input');

  if (!code || !title) {
    alert("⚠️ Vui lòng nhập đầy đủ Mã hiệu và Tên biểu mẫu!");
    return;
  }

  let fileBase64 = '';
  let fileName = '';
  let fileSize = '4.0 KB';

  if (fileInput && fileInput.files && fileInput.files[0]) {
    const f = fileInput.files[0];
    fileName = f.name;
    fileSize = (f.size / 1024).toFixed(1) + ' KB';
    fileBase64 = await new Promise(res => {
      const reader = new FileReader();
      reader.onload = () => res(reader.result);
      reader.readAsDataURL(f);
    });
  }

  try {
    const res = await fetch('/api/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        title,
        description,
        category,
        fileBase64,
        fileName,
        file_size: fileSize
      })
    }).then(r => r.json());

    if (res.success) {
      alert("🎉 Đã thêm biểu mẫu mới thành công!");
      closeAddTemplateModal();
      loadAdminTemplates();
    } else {
      alert("Lỗi: " + res.error);
    }
  } catch (e) {
    alert("Lỗi kết nối: " + e.message);
  }
}
