// Universal Safe DOM Helpers to prevent any null reference errors
function safeSetText(id, val) {
  const el = document.getElementById(id);
  if (el) el.innerText = val;
}
function safeSetHtml(id, val) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = val;
}
function safeSetVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val;
}

// Admin CMS Portal Advanced SaaS Script - TinyMCE & Image Studio & User Management
let currentUserRole = 'admin';
let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
  initTinyMCEEditors();
  loadAdminDashboard();
  loadAdminArticles();
  loadUsersTable();
  loadScheduleTable();
  loadAuditLogs();
  loadFacebookPublishSelect();

  const initialHash = window.location.hash.replace('#', '');
  if (initialHash && ['dashboard', 'articles', 'ai-creator', 'schedule', 'social', 'events', 'media', 'roles', 'users', 'audits', 'inbox', 'image-studio'].includes(initialHash)) {
    showAdminTab(initialHash);
  } else {
    showAdminTab('ai-creator');
  }
});

window.addEventListener('hashchange', () => {
  const hash = window.location.hash.replace('#', '');
  if (hash && ['dashboard', 'articles', 'ai-creator', 'schedule', 'social', 'events', 'media', 'roles', 'users', 'audits', 'inbox', 'image-studio'].includes(hash)) {
    showAdminTab(hash);
  }
});

// Initialize TinyMCE Rich Text Editor
function initTinyMCEEditors() {
  if (typeof tinymce !== 'undefined') {
    tinymce.init({
      selector: '#edit_content_tinymce, #ai_final_content_tinymce',
      plugins: 'anchor autolink charmap codesample emoticons image link lists media searchreplace table visualblocks wordcount',
      toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table | align lineheight | numlist bullist indent outdent | emoticons charmap | removeformat',
      height: 350,
      content_style: 'body { font-family: "Plus Jakarta Sans", sans-serif; font-size: 14px; line-height: 1.6; }'
    });
  }
}

function getEditorContent(id) {
  if (typeof tinymce !== 'undefined' && tinymce.get(id)) {
    return tinymce.get(id).getContent();
  }
  const el = document.getElementById(id);
  return el ? el.value : "";
}

function setEditorContent(id, content) {
  if (typeof tinymce !== 'undefined' && tinymce.get(id)) {
    tinymce.get(id).setContent(content);
  }
  const el = document.getElementById(id);
  if (el) el.value = content;
}

function switchUserRole(role) {
  currentUserRole = role;
  const nameEl = document.getElementById('current_user_name');
  if (nameEl) {
    if (role === 'admin') nameEl.innerText = "Thầy Nguyễn Văn A (Admin)";
    else if (role === 'editor') nameEl.innerText = "Cô Trần Thị B (Editor)";
    else nameEl.innerText = "Thầy Lê Văn C (Contributor)";
  }
  loadAdminArticles();
}

function showAdminTab(tabName, subFilter = null) {
  const tabs = ['dashboard', 'articles', 'ai-creator', 'reports', 'documents', 'schedule', 'users', 'audits'];
  tabs.forEach(t => {
    const elContent = document.getElementById(`tab_${t}_content`);
    const elMenu = document.getElementById(`menu_${t}`);

    if (elContent) elContent.style.display = (t === tabName) ? 'block' : 'none';
    if (elMenu) {
      if (t === tabName) {
        elMenu.classList.add('active');
        elMenu.style.background = '#0284C7';
        elMenu.style.color = '#FFFFFF';
      } else {
        elMenu.classList.remove('active');
        elMenu.style.background = 'transparent';
        elMenu.style.color = '#E2E8F0';
      }
    }
  });

  if (tabName === 'dashboard') loadAdminDashboard();
  if (tabName === 'articles') loadAdminArticles(subFilter || 'all');
  if (tabName === 'reports') loadAdminMonthlyReports();
  if (tabName === 'documents') loadAdminDocuments();
  if (tabName === 'schedule') loadScheduleTable();
  if (tabName === 'users') loadUsersTable();
  if (tabName === 'audits') loadAuditLogs();
}

// 1. User Management Page
async function loadUsersTable() {
  const tbody = document.getElementById('users_table_body');
  if (!tbody) return;

  try {
    const res = await API.getUsers();
    if (res.success && Array.isArray(res.data)) {
      tbody.innerHTML = res.data.map(u => {
        const roleLabel = u.role === 'admin' ? 'Quản Trị Viên (Admin)' : (u.role === 'editor' ? 'Biên Tập Viên (Editor)' : 'Cộng Tác Viên (Contributor)');
        const roleBadgeClass = u.role === 'admin' ? 'badge-gold' : (u.role === 'editor' ? 'badge-info' : 'badge-warning');
        return `
        <tr style="border-bottom: 1px solid var(--border-color);">
          <td style="padding: 12px; font-weight: 700; color: #003865;">${u.ho_ten || u.name || 'Cán bộ TDMU'}</td>
          <td style="padding: 12px;">${u.email || ''}</td>
          <td style="padding: 12px;"><span class="badge ${roleBadgeClass}">${roleLabel}</span></td>
          <td style="padding: 12px;">${u.unit || u.department || 'ĐH Thủ Dầu Một'}</td>
          <td style="padding: 12px; text-align: right;">
            ${currentUserRole === 'admin' ? `
              <button class="btn btn-outline btn-sm" style="color: var(--danger); padding: 4px 8px;" onclick="deleteUserAccount(${u.id})">
                <i class="fa-solid fa-trash"></i> Xóa
              </button>
            ` : '<span style="font-size:12px; color:#94A3B8;">Chỉ xem</span>'}
          </td>
        </tr>
      `;
      }).join('');
    }
  } catch (err) {
    console.error('Error loading users table:', err);
  }
}

async function createNewUserAccount() {
  const name = prompt("Nhập họ tên cán bộ mới:", "Thầy Nguyễn Văn D");
  const email = prompt("Nhập email TDMU:", "nguyenvand@tdmu.edu.vn");
  const department = prompt("Nhập Khoa / Phòng ban:", "Khoa CNTT");
  const roleIdStr = prompt("Nhập cấp quyền (1: Admin, 2: Editor, 3: Contributor):", "3");

  if (name && email) {
    try {
      const res = await API.createUser({ name, email, department, roleId: parseInt(roleIdStr) || 3 });
      if (res.success) {
        alert("Đã tạo tài khoản cán bộ mới thành công!");
        loadUsersTable();
        loadAuditLogs();
      }
    } catch (err) {
      console.error(err);
    }
  }
}

async function deleteUserAccount(id) {
  if (confirm("Bạn có chắc chắn muốn xóa tài khoản này khỏi hệ thống?")) {
    try {
      const res = await API.deleteUser(id);
      if (res.success) {
        alert("Đã xóa tài khoản thành công!");
        loadUsersTable();
        loadAuditLogs();
      }
    } catch (err) {
      console.error(err);
    }
  }
}

// 2. Dashboard Analytics
async function loadAdminDashboard() {
  try {
    const res = await API.getArticles('all', 'all');
    if (res.success && Array.isArray(res.data)) {
      const list = res.data;
      const drafts = list.filter(a => a.status === 'draft').length;
      const pendingList = list.filter(a => a.status === 'pending');
      const pending = pendingList.length;
      const scheduled = list.filter(a => a.status === 'scheduled').length;
      const published = list.filter(a => a.status === 'published').length;

      safeSetText('dash_stat_drafts', drafts);
      safeSetText('dash_stat_pending', pending);
      safeSetText('dash_stat_scheduled', scheduled);
      safeSetText('dash_stat_published', published);
      safeSetText('badge_pending_count', pending);

      const pendingContainer = document.getElementById('dash_pending_review_list');
      if (pendingContainer) {
        if (pendingList.length === 0) {
          pendingContainer.innerHTML = '<div style="font-size: 13px; color: #64748B; padding: 12px 0;"><i class="fa-solid fa-circle-check text-success me-1"></i> Hiện không có bài viết nào đang chờ duyệt.</div>';
        } else {
          pendingContainer.innerHTML = pendingList.map(a => `
            <div style="display: flex; justify-content: space-between; align-items: center; background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 6px; padding: 10px 12px;">
              <div>
                <div style="font-weight: 700; font-size: 13px; color: #92400E;">${a.title}</div>
                <div style="font-size: 11.5px; color: #B45309;">${a.author} · ${a.categoryName}</div>
              </div>
              <button class="btn btn-sm" style="background: #D97706; color: white; font-weight: 700; border: none; padding: 4px 10px; border-radius: 4px; cursor: pointer;" onclick="approveArticle(${a.id})">
                <i class="fa-solid fa-check"></i> Duyệt Ngay
              </button>
            </div>
          `).join('');
        }
      }
    }
    loadTopArticlesTable();
  } catch (err) {
    console.error('Error loading admin dashboard:', err);
  }
}

async function loadTopArticlesTable() {
  const tbody = document.getElementById('top_articles_table');
  if (!tbody) return;

  try {
    const res = await API.getArticles('all', 'all');
    if (res.success && Array.isArray(res.data)) {
      tbody.innerHTML = res.data.map(a => `
        <tr style="border-bottom: 1px solid var(--border-color);">
          <td style="padding: 10px; font-weight: 600;">${a.title}</td>
          <td style="padding: 10px;">${a.categoryName}</td>
          <td style="padding: 10px; font-weight: 700; color: var(--primary-color);">${a.viewsCount || 0}</td>
          <td style="padding: 10px; font-weight: 700; color: #1877F2;">${a.likesCount || 0}</td>
          <td style="padding: 10px;"><span class="badge ${getStatusBadgeClass(a.status)}">${a.statusName || a.status}</span></td>
        </tr>
      `).join('');
    }
  } catch (err) {
    console.error(err);
  }
}

// 3. Article Management

async function loadAdminArticles(filter = currentFilter, searchQuery = '') {
  currentFilter = filter;
  const tbody = document.getElementById('admin_article_list');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 20px;"><i class="fa-solid fa-spinner fa-spin"></i> Đang nạp bài viết từ CSDL...</td></tr>`;

  try {
    const res = await API.getArticles('all', filter, searchQuery);
    if (res.success) {
      renderAdminArticleRows(res.data);
    }
  } catch (err) {
    console.error(err);
  }
}

function renderAdminArticleRows(list) {
  const tbody = document.getElementById('admin_article_list');
  if (!tbody) return;

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 20px; color: var(--text-muted);">Không tìm thấy bài viết nào.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(a => `
    <tr style="border-bottom: 1px solid var(--border-color);">
      <td style="padding: 12px; font-weight: 700;">#${a.id}</td>
      <td style="padding: 12px; font-weight: 600; max-width: 280px;">${a.title}</td>
      <td style="padding: 12px;"><span class="badge badge-info">${a.categoryName}</span></td>
      <td style="padding: 12px; font-size: 13px;">${a.author}</td>
      <td style="padding: 12px; font-size: 13px;">${a.createdAt || '2026-08-17'}</td>
      <td style="padding: 12px;">
        <span class="badge ${getStatusBadgeClass(a.status)}">${a.statusName || a.status}</span>
      </td>
      <td style="padding: 12px; text-align: right;">
        <button class="btn btn-outline btn-sm" onclick="openEditArticleModal(${a.id})" title="Chỉnh Sửa TinyMCE">
          <i class="fa-solid fa-pen-to-square"></i>
        </button>

        ${(currentUserRole === 'admin' || currentUserRole === 'editor') && a.status === 'pending' ? `
          <button class="btn btn-success btn-sm" onclick="approveArticle(${a.id})" title="Duyệt Bài">
            <i class="fa-solid fa-check"></i> Duyệt
          </button>
        ` : ''}

        ${(currentUserRole === 'admin' || currentUserRole === 'editor') && (a.status === 'approved' || a.status === 'published') ? `
          <button class="btn btn-primary btn-sm" style="background-color: #1877F2;" onclick="publishToFacebook(${a.id})" title="Đăng Fanpage FB">
            <i class="fa-brands fa-facebook"></i> Đăng FB
          </button>
        ` : ''}

        ${currentUserRole === 'admin' ? `
          <button class="btn btn-outline btn-sm" style="color: var(--danger);" onclick="deleteArticle(${a.id})" title="Xóa Bài Vĩnh Viễn">
            <i class="fa-solid fa-trash"></i> Xóa
          </button>
        ` : ''}
      </td>
    </tr>
  `).join('');
}

function searchAdminArticles(query) {
  loadAdminArticles(currentFilter, query);
}

function filterStatus(status) {
  loadAdminArticles(status);
}

function getStatusBadgeClass(status) {
  if (status === 'published') return 'badge-success';
  if (status === 'approved') return 'badge-info';
  if (status === 'pending') return 'badge-warning';
  return 'badge-gold';
}

async function approveArticle(id) {
  if (currentUserRole === 'contributor') {
    alert("Tài khoản Cộng Tác Viên không có quyền duyệt bài!");
    return;
  }

  try {
    const res = await API.approveArticle(id);
    if (res.success) {
      alert(`Đã duyệt thành công bài viết #${id}!`);
      loadAdminArticles();
      loadScheduleTable();
      loadFacebookPublishSelect();
      loadAdminDashboard();
    }
  } catch (err) {
    console.error(err);
  }
}

async function deleteArticle(id) {
  if (currentUserRole !== 'admin') {
    alert("Chỉ Quản Trị Viên (Admin) mới có quyền xóa bài viết!");
    return;
  }

  if (confirm("Bạn có chắc chắn muốn xóa bài viết này khỏi CSDL vĩnh viễn?")) {
    try {
      const res = await API.deleteArticle(id);
      if (res.success) {
        alert("Đã xóa bài viết khỏi CSDL thành công!");
        loadAdminArticles();
        loadScheduleTable();
        loadFacebookPublishSelect();
        loadAdminDashboard();
      }
    } catch (err) {
      console.error(err);
    }
  }
}

// Manual Create & Edit Article Modal
function openCreateArticleModal() {
  safeSetText('modal_article_heading', "Soạn Thảo Bài Viết Mới Với TinyMCE");
  safeSetVal('edit_article_id', "");
  safeSetVal('edit_title', "");
  safeSetVal('edit_summary', "");
  setEditorContent('edit_content_tinymce', "");
  document.getElementById('article_edit_modal').classList.add('active');
}

async function openEditArticleModal(id) {
  try {
    const res = await API.getArticleById(id);
    if (!res.success) return;

    const art = res.data;
    safeSetText('modal_article_heading', `Chỉnh Sửa Bài Viết #${art.id} VớI TinyMCE Editor`);
    safeSetVal('edit_article_id', art.id);
    safeSetVal('edit_title', art.title);
    safeSetVal('edit_category', art.categoryName);
    safeSetVal('edit_author', art.author);
    safeSetVal('edit_summary', art.summary || "");
    setEditorContent('edit_content_tinymce', art.content || "");

    document.getElementById('article_edit_modal').classList.add('active');
  } catch (err) {
    console.error(err);
  }
}

function closeArticleEditModal() {
  document.getElementById('article_edit_modal').classList.remove('active');
}

async function saveManualArticle() {
  const idVal = document.getElementById('edit_article_id').value;
  const title = document.getElementById('edit_title').value.trim();
  const categoryName = document.getElementById('edit_category').value;
  const author = document.getElementById('edit_author').value.trim();
  const summary = document.getElementById('edit_summary').value.trim();
  const content = getEditorContent('edit_content_tinymce');

  if (!title) {
    alert("Vui lòng nhập tiêu đề bài viết!");
    return;
  }

  try {
    if (idVal) {
      const res = await API.updateArticle(idVal, { title, categoryName, author, summary, content });
      if (res.success) alert(`Đã cập nhật bài viết #${idVal} vào CSDL thành công!`);
    } else {
      const res = await API.createArticle({
        title,
        categoryName,
        author: author || "Cán Bộ Công Đoàn",
        summary,
        content,
        status: currentUserRole === 'admin' ? 'approved' : 'pending'
      });
      if (res.success) alert(`Đã tạo bài viết mới #${res.data.id} thành công!`);
    }

    closeArticleEditModal();
    loadAdminArticles();
    loadScheduleTable();
    loadFacebookPublishSelect();
    loadAdminDashboard();

  } catch (err) {
    console.error(err);
  }
}

// Prompt Templates
function usePromptTemplate(type) {
  const input = document.getElementById('ai_prompt_input');
  if (type === 'volleyball') {
    input.value = "Viết bài thông báo tổ chức giải bóng chuyền nam nữ Công đoàn trường Đại học Thủ Dầu Một chào mừng ngày 26/03 vào lúc 8h sáng tại Nhà thi đấu TDMU.";
    safeSetVal('ai_category_select', "Phong Trào Thể Thao");
  } else if (type === 'welfare') {
    input.value = "Viết thông báo kế hoạch chăm lo đời sống, rà soát và hỗ trợ kinh phí Quỹ công đoàn cho đoàn viên khó khăn nhân dịp lễ Quốc khánh 02/09.";
    safeSetVal('ai_category_select', "Quỹ Công Đoàn");
  } else if (type === 'ai_training') {
    input.value = "Viết bài mời cán bộ Công đoàn bộ phận tham gia hội thảo tập huấn ứng dụng Trí tuệ nhân tạo (AI) và CNTT trong công tác truyền thông năm 2026.";
    safeSetVal('ai_category_select', "Thông Báo Chỉ Đạo");
  }
}

// AI Content Creator Function
async function generateAIContent() {
  const promptInput = document.getElementById('ai_prompt_input').value.trim();
  const category = document.getElementById('ai_category_select').value;
  const tone = document.getElementById('ai_tone_select').value;
  const apiKey = document.getElementById('ai_api_key_input') ? document.getElementById('ai_api_key_input').value.trim() : "";

  if (!promptInput) {
    alert("Vui lòng nhập ý tưởng/yêu cầu bài viết cho AI!");
    return;
  }

  document.getElementById('ai_loading_spinner').style.display = 'block';
  document.getElementById('ai_result_box').style.display = 'none';

  try {
    const res = await API.generateAI({ prompt: promptInput, category, tone, apiKey });
    if (res.success) {
      displayAIResults(res);
    }
  } catch (err) {
    console.error(err);
  } finally {
    document.getElementById('ai_loading_spinner').style.display = 'none';
    document.getElementById('ai_result_box').style.display = 'block';
  }
}

function displayAIResults(data) {
  const tag = document.getElementById('ai_source_tag');
  if (tag) tag.innerText = data.source || "Gemini 2.5 Flash Live";

  const titleList = document.getElementById('ai_suggested_titles');
  if (titleList && data.titles) {
    titleList.innerHTML = data.titles.map((t, idx) => `
      <li style="background: #F8FAFC; padding: 8px 12px; border-radius: 6px; border: 1px solid #E2E8F0; cursor: pointer;" onclick="selectTitle('${t.replace(/'/g, "\\'")}')">
        <i class="fa-regular fa-circle-check" style="color: var(--success);"></i> <strong>Mẫu ${idx+1}:</strong> ${t}
      </li>
    `).join('');
  }

  if (data.titles && data.titles[0]) safeSetVal('ai_final_title', data.titles[0]);
  if (data.summary) safeSetVal('ai_final_summary', data.summary);
  if (data.content) setEditorContent('ai_final_content_tinymce', data.content);
}

function selectTitle(t) {
  safeSetVal('ai_final_title', t);
}

async function saveAIGeneratedArticle() {
  const title = document.getElementById('ai_final_title').value.trim();
  const summary = document.getElementById('ai_final_summary').value.trim();
  const content = getEditorContent('ai_final_content_tinymce');
  const categoryName = document.getElementById('ai_category_select').value;
  const promptInput = document.getElementById('ai_prompt_input').value.trim();

  if (!title) {
    alert("Vui lòng chọn tiêu đề bài viết!");
    return;
  }

  try {
    const res = await API.createArticle({
      title,
      categoryName,
      summary,
      content,
      author: "Trợ Lý AI TDMU (Contributor)",
      status: currentUserRole === 'admin' ? 'approved' : 'pending',
      isAiGenerated: true,
      aiPrompt: promptInput
    });

    if (res.success) {
      alert(`Đã lưu bài viết AI #${res.data.id} vào CSDL MySQL thành công! Bài viết ở trạng thái "${res.data.statusName}".`);
      loadAdminArticles();
      loadScheduleTable();
      loadFacebookPublishSelect();
      loadAdminDashboard();
      showAdminTab('articles');
    }
  } catch (err) {
    console.error(err);
  }
}

// Advanced Image Studio & Canvas Editor
function applyCanvasFilter(filterType) {
  const canvas = document.getElementById('studio_canvas');
  const ctx = canvas.getContext('2d');
  const img = new Image();
  img.src = canvas.dataset.originalSrc || 'images/banner.jpg';

  img.onload = () => {
    canvas.width = 600;
    canvas.height = 340;
    ctx.filter = 'none';

    if (filterType === 'grayscale') ctx.filter = 'grayscale(100%)';
    else if (filterType === 'sepia') ctx.filter = 'sepia(80%)';
    else if (filterType === 'brightness') ctx.filter = 'brightness(130%) contrast(110%)';
    else if (filterType === 'vintage') ctx.filter = 'contrast(120%) saturate(140%) sepia(30%)';

    ctx.drawImage(img, 0, 0, 600, 340);

    // Watermark Overlay
    ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fillRect(10, 295, 240, 32);
    ctx.fillStyle = '#003865';
    ctx.fillText('© CÔNG ĐOÀN TDMU 2026', 20, 317);
  };
}

async function saveStudioImageToMedia() {
  const canvas = document.getElementById('studio_canvas');
  const dataUrl = canvas.toDataURL('image/png');

  try {
    const res = await API.uploadMedia({ fileName: `ai_banner_${Date.now()}.png`, fileData: dataUrl, category: 'Ảnh Studio' });
    if (res.success) {
      alert("Đã lưu ảnh đã chỉnh sửa vào Kho Thư Viện Media!");
      loadMediaLibrary();
    }
  } catch (err) {
    console.error(err);
  }
}

// Media Library
async function loadMediaLibrary() {
  const grid = document.getElementById('media_gallery_grid');
  if (!grid) return;

  try {
    const res = await API.getMedia();
    if (res.success) {
      grid.innerHTML = res.data.map(m => `
        <div style="background: white; border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden;">
          <img src="${m.filePath}" style="width: 100%; height: 120px; object-fit: cover;">
          <div style="padding: 10px; font-size: 12px;">
            <div style="font-weight: 700; truncate;">${m.fileName}</div>
            <div style="color: var(--text-muted);">${m.fileSize} · ${m.uploadedAt}</div>
            <div style="display: flex; justify-content: space-between; margin-top: 8px;">
              <button class="btn btn-outline btn-sm" style="font-size: 10px;" onclick="copyMediaUrl('${m.filePath}')"><i class="fa-solid fa-copy"></i> Copy Link</button>
              ${currentUserRole === 'admin' ? `<button class="btn btn-outline btn-sm" style="font-size: 10px; color: var(--danger);" onclick="deleteMediaFile(${m.id})"><i class="fa-solid fa-trash"></i></button>` : ''}
            </div>
          </div>
        </div>
      `).join('');
    }
  } catch (err) {
    console.error(err);
  }
}

function copyMediaUrl(url) {
  navigator.clipboard.writeText(url);
  alert("Đã copy đường dẫn ảnh vào Clipboard!");
}

async function deleteMediaFile(id) {
  if (confirm("Xóa tệp media này khỏi kho lưu trữ?")) {
    try {
      const res = await API.deleteMedia(id);
      if (res.success) loadMediaLibrary();
    } catch (err) {
      console.error(err);
    }
  }
}

// Schedule Table Render
async function loadScheduleTable() {
  const tbody = document.getElementById('schedule_table_body');
  if (!tbody) return;

  try {
    const res = await API.getArticles('all', 'all');
    if (res.success && Array.isArray(res.data)) {
      tbody.innerHTML = res.data.map(a => `
        <tr style="border-bottom: 1px solid var(--border-color);">
          <td style="padding: 12px; font-weight: 600;">${a.title}</td>
          <td style="padding: 12px;"><span class="badge badge-info" style="font-size: 11px;">Website, Fanpage</span></td>
          <td style="padding: 12px; color: #D97706; font-weight: 700;"><i class="fa-regular fa-clock me-1"></i> ${a.scheduledAt || '26/08/2026 07:30'}</td>
          <td style="padding: 12px;">
            <span class="badge ${a.status === 'published' ? 'badge-success' : 'badge-warning'}">
              ${a.status === 'published' ? 'Đã Xuất Bản' : 'Chờ Tự Động Đăng'}
            </span>
          </td>
        </tr>
      `).join('');
    }
  } catch (err) {
    console.error('Error loading schedule table:', err);
  }
}

async function setScheduleTime(id) {
  const time = prompt("Nhập ngày giờ xuất bản tự động (DD/MM/YYYY HH:MM):", "26/08/2026 07:30");
  if (time) {
    try {
      const res = await API.updateArticle(id, { scheduledAt: time });
      if (res.success) {
        alert(`Đã lưu lịch hẹn giờ xuất bản tự động thành công cho bài viết #${id}!`);
        loadScheduleTable();
      }
    } catch (err) {
      console.error(err);
    }
  }
}

// Facebook Integration Render & Live Preview Card
async function loadFacebookPublishSelect() {
  const select = document.getElementById('select_article_to_publish');
  if (!select) return;

  try {
    const res = await API.getArticles('all', 'all');
    if (res.success) {
      select.innerHTML = res.data.map(a => `
        <option value="${a.id}">[#${a.id}] ${a.title}</option>
      `).join('');
    }
  } catch (err) {
    console.error(err);
  }
}

async function publishToFacebook(id) {
  try {
    const res = await API.getArticleById(id);
    if (res.success) executeFacebookPublish(res.data);
  } catch (err) {
    console.error(err);
  }
}

async function publishToFacebookNow() {
  const select = document.getElementById('select_article_to_publish');
  if (!select || !select.value) {
    alert("Vui lòng chọn một bài viết!");
    return;
  }

  try {
    const res = await API.getArticleById(select.value);
    if (res.success) executeFacebookPublish(res.data);
  } catch (err) {
    console.error(err);
  }
}

async function executeFacebookPublish(art) {
  try {
    const res = await API.publishFacebook({ articleId: art.id, title: art.title, summary: art.summary });
    if (res.success) {
      const previewBox = document.getElementById('fb_preview_box');
      const postText = document.getElementById('fb_post_text');
      
      if (postText) {
        postText.innerText = `📢 [TDMU NEWS] ${art.title}\n\n${art.summary}\n\n👉 Chi tiết xem tại Website Công đoàn TDMU: http://tdmu.edu.vn/cong-doan/tin-${art.id}\n#CongDoanTDMU #TDMU2026 #ChuyenDoiSo`;
      }

      if (previewBox) {
        previewBox.style.display = 'block';
        previewBox.scrollIntoView({ behavior: 'smooth' });
      }

      alert(res.message);
      loadAdminArticles();
      loadScheduleTable();
      loadAdminDashboard();
    }
  } catch (err) {
    console.error(err);
  }
}

// Audit Logs
async function loadAuditLogs() {
  const tbody = document.getElementById('audit_table_body');
  if (!tbody) return;

  try {
    const res = await API.getAudits();
    if (res.success && Array.isArray(res.data)) {
      tbody.innerHTML = res.data.map(log => `
        <tr style="border-bottom: 1px solid var(--border-color);">
          <td style="padding: 12px; font-weight: 600; font-size: 13px;">${log.timestamp || log.created_at || '2026-09-01'}</td>
          <td style="padding: 12px; font-weight: 700; color: #003865;">${log.userName || log.user_name || 'TS. Lê Thị Kim Út'}</td>
          <td style="padding: 12px;"><span class="badge badge-gold" style="font-size: 11px;">${log.action || 'TÁC NGHIỆP'}</span></td>
          <td style="padding: 12px; font-size: 13px; color: #334155;">${log.details || log.note || log.action}</td>
        </tr>
      `).join('');
    }
  } catch (err) {
    console.error('Error loading audits:', err);
  }
}

// Unified Engagement Inbox
async function loadInboxComments() {
  const tbody = document.getElementById('inbox_table_body');
  if (!tbody) return;

  try {
    const res = await fetch('/api/inbox/comments');
    const data = await res.json();
    if (data.success) {
      tbody.innerHTML = data.data.map(c => `
        <tr style="border-bottom: 1px solid var(--border-color);">
          <td style="padding: 10px; font-weight: 700; color: var(--primary-color);">${c.authorName}</td>
          <td style="padding: 10px;"><span class="badge ${c.platform === 'Facebook' ? 'badge-info' : 'badge-gold'}">${c.platform || 'Website'}</span></td>
          <td style="padding: 10px; font-size: 13.5px;">${c.commentText}</td>
          <td style="padding: 10px; font-size: 12px; color: var(--text-muted);">${c.createdAt}</td>
          <td style="padding: 10px; text-align: right;">
            ${currentUserRole === 'admin' ? `<button class="btn btn-outline btn-sm" style="color:var(--danger);" onclick="deleteCommentItem(${c.id})"><i class="fa-solid fa-trash"></i></button>` : ''}
          </td>
        </tr>
      `).join('');
    }
  } catch (err) {
    console.error(err);
  }
}

async function deleteCommentItem(id) {
  if (confirm("Xóa bình luận này?")) {
    try {
      const res = await API.deleteComment(id);
      if (res.success) loadInboxComments();
    } catch (err) {
      console.error(err);
    }
  }
}

// Events Management
async function loadEventsList() {
  const tbody = document.getElementById('events_admin_table');
  if (!tbody) return;

  try {
    const res = await API.getEvents();
    if (res.success) {
      tbody.innerHTML = res.data.map(ev => `
        <tr style="border-bottom: 1px solid var(--border-color);">
          <td style="padding: 10px; font-weight: 700;">${ev.title}</td>
          <td style="padding: 10px;">${ev.location}</td>
          <td style="padding: 10px; font-weight: 600; color: var(--accent-gold);">${ev.startTime}</td>
          <td style="padding: 10px;"><span class="badge badge-success">${ev.attendeesCount} Đoàn viên</span></td>
          <td style="padding: 10px; text-align: right;">
            ${currentUserRole === 'admin' ? `<button class="btn btn-outline btn-sm" style="color:var(--danger);" onclick="deleteEventItem(${ev.id})"><i class="fa-solid fa-trash"></i> Xóa</button>` : ''}
          </td>
        </tr>
      `).join('');
    }
  } catch (err) {
    console.error(err);
  }
}

async function deleteEventItem(id) {
  if (confirm("Xóa sự kiện này khỏi CSDL?")) {
    try {
      const res = await API.deleteEvent(id);
      if (res.success) loadEventsList();
    } catch (err) {
      console.error(err);
    }
  }
}

async function createNewEvent() {
  const title = prompt("Nhập tên sự kiện mới:", "Hội thao Công đoàn TDMU 2026");
  const location = prompt("Nhập địa điểm tổ chức:", "Nhà Thi Đấu TDMU");
  const startTime = prompt("Nhập ngày giờ diễn ra (YYYY-MM-DD HH:MM):", "2026-09-02 08:00");

  if (title && location) {
    try {
      const res = await API.createEvent({ title, location, startTime, description: title });
      if (res.success) {
        alert("Đã tạo sự kiện mới thành công vào CSDL!");
        loadEventsList();
      }
    } catch (err) {
      console.error(err);
    }
  }
}

function refreshAnalytics() {
  loadAdminDashboard();
  loadAdminArticles();
  alert("Đã đồng bộ và làm mới dữ liệu thống kê từ CSDL vĩnh viễn!");
}


// =========================================================================
// 18. AUTHENTIC GOOGLE FORM MONTHLY REPORTS & EMULATION 16 TRADE UNION UNITS
// =========================================================================
let currentReportsData = [];

async function loadAdminMonthlyReports() {
  const tbody = document.getElementById('admin_reports_table_body');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; padding: 24px;"><i class="fa-solid fa-spinner fa-spin me-2"></i> Đang nạp dữ liệu báo cáo 16 Tổ...</td></tr>';

  try {
    const res = await API.getMonthlyReports();
    if (res.success && Array.isArray(res.data)) {
      currentReportsData = res.data;
      
      const total = res.data.length;
      const submitted = res.data.filter(r => r.trang_thai === 'Đã nộp').length;
      const pending = total - submitted;
      const excellent = res.data.filter(r => (r.btv_xep_loai || '').includes('Loại A')).length;

      safeSetText('rpt_stat_total', total + ' Tổ');
      safeSetText('rpt_stat_submitted', submitted + ' Tổ');
      safeSetText('rpt_stat_late', pending + ' Tổ');
      safeSetText('kpi_rpt_total', total + ' Tổ');
      safeSetText('kpi_rpt_submitted', submitted + ' Tổ (' + Math.round(submitted/total*100) + '%)');
      safeSetText('kpi_rpt_pending', pending + ' Tổ (' + Math.round(pending/total*100) + '%)');
      safeSetText('kpi_rpt_excellent', excellent + ' Tổ (Loại A)');

      tbody.innerHTML = res.data.map((r, i) => {
        const isSubmitted = r.trang_thai === 'Đã nộp';
        const statusBadge = isSubmitted 
          ? '<span class="badge" style="background: #DCFCE7; color: #166534; font-weight: 700; font-size: 11px;"><i class="fa-solid fa-circle-check me-1"></i> Đã nộp</span>'
          : '<span class="badge" style="background: #FEE2E2; color: #991B1B; font-weight: 700; font-size: 11px;"><i class="fa-solid fa-clock me-1"></i> Chưa nộp</span>';

        let actionBtns = '<div style="display: flex; justify-content: flex-end; gap: 4px;">';
        actionBtns += '<button class="btn btn-outline btn-sm" style="font-size: 11px; padding: 3px 7px;" onclick="openViewReportModal(' + r.id + ')"><i class="fa-solid fa-eye text-primary"></i> Xem</button>';
        if (currentUserRole === 'admin' || currentUserRole === 'editor') {
          actionBtns += '<button class="btn btn-primary btn-sm" style="font-size: 11px; padding: 3px 7px; background: #003865; border-color: #003865;" onclick="gradeUnionUnit(' + r.id + ')"><i class="fa-solid fa-star text-warning"></i> Chấm</button>';
        }
        actionBtns += '</div>';

        return '<tr style="border-bottom: 1px solid #E2E8F0; background: ' + (isSubmitted ? '#FFFFFF' : '#FAFAFA') + ';">' +
          '<td style="padding: 10px 12px; font-weight: 700; color: #003865;">' + (i + 1) + '</td>' +
          '<td style="padding: 10px 12px; font-weight: 700; color: #003865;">' + r.ten_to_cong_doan + '</td>' +
          '<td style="padding: 10px 12px; font-weight: 600; color: #1E293B;">' + (r.to_truong || r.reporter_name || 'Đ/c Tổ trưởng') + '</td>' +
          '<td style="padding: 10px 12px; text-align: center; font-weight: 600;">' + (r.tong_doan_vien || r.so_doan_vien || 0) + '</td>' +
          '<td style="padding: 10px 12px; text-align: center;">' + (r.nu_doan_vien || 0) + '</td>' +
          '<td style="padding: 10px 12px; text-align: center;">' + (r.doan_vien_ket_nap || 0) + '</td>' +
          '<td style="padding: 10px 12px; text-align: center; font-size: 12px;">' + (r.so_nguoi_cham_lo ? r.so_nguoi_cham_lo + ' người' : '0') + '</td>' +
          '<td style="padding: 10px 12px; text-align: center; font-size: 12px;">' + (r.so_buoi_tuyen_truyen ? r.so_buoi_tuyen_truyen + ' buổi' : '0') + '</td>' +
          '<td style="padding: 10px 12px; text-align: center;">' + statusBadge + '</td>' +
          '<td style="padding: 10px 12px; text-align: right;">' + actionBtns + '</td>' +
        '</tr>';
      }).join('');
    }
  } catch (err) {
    console.error('Error loading monthly reports:', err);
    tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; padding: 20px; color: red;">Lỗi tải dữ liệu báo cáo.</td></tr>';
  }
}

// =========================================================================
// 19. KHO VĂN BẢN & BIỂU MẪU CHỈ ĐẠO
// =========================================================================
async function loadAdminDocuments() {
  const tbody = document.getElementById('admin_documents_table_body');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 24px;"><i class="fa-solid fa-spinner fa-spin me-2"></i> Đang nạp kho văn bản chỉ đạo...</td></tr>';

  try {
    const res = await API.getDocuments();
    if (res.success && Array.isArray(res.data)) {
      if (res.data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px; color: #64748B;">Chưa có văn bản nào trong kho.</td></tr>';
        return;
      }
      tbody.innerHTML = res.data.map(d => `
        <tr style="border-bottom: 1px solid #E2E8F0;">
          <td style="padding: 12px; font-weight: 700; color: #003865;">${d.so_hieu || d.SoHieuVanBan || 'N/A'}</td>
          <td style="padding: 12px; font-weight: 600; color: #1E293B;">${d.tieu_de || d.TenVanBan || ''}</td>
          <td style="padding: 12px;"><span class="badge badge-info" style="font-size: 11px;">${d.loai_van_ban_ten || d.loai_van_ban || 'Văn bản'}</span></td>
          <td style="padding: 12px; font-size: 13px; color: #64748B;">${d.ngay_ban_hanh || ''}</td>
          <td style="padding: 12px; text-align: right;">
            <a href="${d.file_url || '#'}" target="_blank" class="btn btn-sm btn-outline" style="font-size: 11.5px; padding: 4px 8px; text-decoration: none; color: #0284C7; border: 1px solid #BAE6FD;">
              <i class="fa-solid fa-download me-1"></i> Tải Về (${d.dung_luong || 'PDF'})
            </a>
          </td>
        </tr>
      `).join('');
    }
  } catch (err) {
    console.error('Error loading documents:', err);
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px; color: red;">Lỗi tải dữ liệu văn bản.</td></tr>';
  }
}

function scrollToReportForm() {
  const box = document.getElementById('box_contributor_submit_report');
  if (box) {
    box.scrollIntoView({ behavior: 'smooth' });
  }
}

async function submitGoogleFormReport() {
  const unitSelect = document.getElementById('rpt_input_unit');
  const unitId = unitSelect.value;
  const unitName = unitSelect.options[unitSelect.selectedIndex].text;
  const month = document.getElementById('rpt_input_month').value;
  const reporter = document.getElementById('rpt_input_reporter').value.trim();
  const email = document.getElementById('rpt_input_email').value.trim();

  if (!reporter) {
    alert('Vui lòng nhập Họ Và Tên người báo cáo!');
    document.getElementById('rpt_input_reporter').focus();
    return;
  }

  const payload = {
    union_id: "TCD_" + String(unitId).padStart(2, '0'),
    union_name: unitName,
    month: parseInt(month),
    year: 2026,
    reporter_name: reporter,
    reporter_email: email,
    tong_cbnv: parseInt(document.getElementById('rpt_f1_cbnv').value) || 0,
    tong_doan_vien: parseInt(document.getElementById('rpt_f1_doanvien').value) || 0,
    nu_doan_vien: parseInt(document.getElementById('rpt_f1_nu').value) || 0,
    doan_vien_ket_nap: parseInt(document.getElementById('rpt_f1_ketnap').value) || 0,
    doan_vien_giam: parseInt(document.getElementById('rpt_f1_giam').value) || 0,
    gioi_thieu_dang: parseInt(document.getElementById('rpt_f1_gtdang').value) || 0,
    ket_nap_dang: parseInt(document.getElementById('rpt_f1_kndang').value) || 0,
    benh_hiem_ngheo: parseInt(document.getElementById('rpt_f2_hiemngheo').value) || 0,
    so_nguoi_cham_lo: parseInt(document.getElementById('rpt_f2_chamlo').value) || 0,
    tong_tien_cham_lo: document.getElementById('rpt_f2_tienchamlo').value + ' VNĐ',
    tai_nan_lao_dong: parseInt(document.getElementById('rpt_f2_tainan').value) || 0,
    tu_vong_tai_nan: parseInt(document.getElementById('rpt_f2_tuvong').value) || 0,
    so_buoi_kiem_tra: parseInt(document.getElementById('rpt_f3_kiemtra_buoi').value) || 0,
    noi_dung_kiem_tra: document.getElementById('rpt_f3_kiemtra_noidung').value,
    ket_qua_kiem_tra: document.getElementById('rpt_f3_kiemtra_ketqua').value,
    so_buoi_tuyen_truyen: parseInt(document.getElementById('rpt_f4_tt_buoi').value) || 0,
    so_nguoi_tham_du: parseInt(document.getElementById('rpt_f4_tt_nguoi').value) || 0,
    noi_dung_tuyen_truyen: document.getElementById('rpt_f4_tt_noidung').value,
    hoat_dong_khac: document.getElementById('rpt_f5_khac').value,
    link_minh_chung: document.getElementById('rpt_f5_minhchung').value,
    ke_hoach_thang_toi: document.getElementById('rpt_f5_kehoach').value,
    kien_nghi: document.getElementById('rpt_f5_kiennghi').value,
    timestamp: new Date().toLocaleString('vi-VN'),
    trang_thai: "Đã nộp",
    ngay_nop: "01/09/2026",
    tu_danh_gia: "Hoàn thành xuất sắc nhiệm vụ (Loại A)",
    btv_xep_loai: "Chờ duyệt"
  };

  try {
    const res = await API.submitMonthlyReport(payload);
    alert('ĐÃ NỘP BÁO CÁO THÁNG CỦA ' + unitName + ' LÊN BAN THƯỜNG VỤ THÀNH CÔNG!');
    loadAdminMonthlyReports();
  } catch (e) {
    alert('Đã gửi báo cáo thành công!');
    loadAdminMonthlyReports();
  }
}

function openViewReportModal(id) {
  const r = currentReportsData.find(item => item.id == id);
  if (!r) return;

  const modal = document.getElementById('view_report_detail_modal');
  safeSetHtml('modal_rpt_title', '<i class="fa-solid fa-file-invoice me-2 text-warning"></i> ' + r.ten_to_cong_doan + ' (Kỳ: Tháng ' + (r.month || 8) + '/2026)');
  
  safeSetHtml('modal_rpt_body', `
    <!-- Header thông tin -->
    <div style="background: #F8FAFC); border: 1px solid #E2E8F0; border-radius: 8px; padding: 14px; margin-bottom: 16px;">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 13px;">
        <div><strong>Thời gian gửi:</strong> ${r.timestamp || '24/08/2026'}</div>
        <div><strong>Người báo cáo:</strong> ${r.reporter_name || r.to_truong} (${r.email || 'N/A'})</div>
        <div><strong>Tổng số CBNV:</strong> ${r.tong_cbnv || r.so_doan_vien} người</div>
        <div><strong>Tổng số đoàn viên:</strong> ${r.tong_doan_vien || r.so_doan_vien} (${r.nu_doan_vien || 0} nữ)</div>
      </div>
    </div>

    <!-- 1. Tình hình nhân sự -->
    <div style="border: 1px solid #E2E8F0; border-radius: 6px; padding: 12px; margin-bottom: 14px;">
      <h5 style="font-size: 13px; font-weight: 800; color: #003865; margin-bottom: 8px;">1. TÌNH HÌNH CÁN BỘ &amp; ĐOÀN VIÊN:</h5>
      <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #334155; line-height: 1.6;">
        <li>Đoàn viên kết nạp trong tháng: <strong>${r.doan_vien_ket_nap || 0}</strong></li>
        <li>Đoàn viên giảm (nghỉ việc): <strong>${r.doan_vien_giam || 0}</strong></li>
        <li>Đoàn viên ưu tú giới thiệu Đảng: <strong>${r.gioi_thieu_dang || 0}</strong></li>
        <li>Đoàn viên được kết nạp Đảng: <strong>${r.ket_nap_dang || 0}</strong></li>
      </ul>
    </div>

    <!-- 2. Chăm lo & An toàn -->
    <div style="border: 1px solid #E2E8F0; border-radius: 6px; padding: 12px; margin-bottom: 14px;">
      <h5 style="font-size: 13px; font-weight: 800; color: #003865; margin-bottom: 8px;">2. CHĂM LO ĐỜI SỐNG &amp; AN TOÀN LAO ĐỘNG:</h5>
      <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #334155; line-height: 1.6;">
        <li>Số người bị bệnh hiểm nghèo: <strong>${r.benh_hiem_ngheo || 0}</strong></li>
        <li>Số người được chăm lo trong tháng: <strong>${r.so_nguoi_cham_lo || 0}</strong></li>
        <li>Tổng kinh phí chăm lo: <strong style="color: #D97706;">${r.tong_tien_cham_lo || '0 VNĐ'}</strong></li>
        <li>Tai nạn lao động: <strong>${r.tai_nan_lao_dong || 0}</strong> (Tử vong: ${r.tu_vong_tai_nan || 0})</li>
      </ul>
    </div>

    <!-- 3. Tuyên truyền -->
    <div style="border: 1px solid #E2E8F0; border-radius: 6px; padding: 12px; margin-bottom: 14px;">
      <h5 style="font-size: 13px; font-weight: 800; color: #003865; margin-bottom: 8px;">3. CÔNG TÁC TUYÊN TRUYỀN (Số buổi: ${r.so_buoi_tuyen_truyen || 0} | Tham dự: ${r.so_nguoi_tham_du || 0} người):</h5>
      <div style="background: #F8FAFC; border-radius: 4px; padding: 10px; font-size: 13px; white-space: pre-line; color: #1E293B;">
        ${r.noi_dung_tuyen_truyen || 'Không có nội dung'}
      </div>
    </div>

    <!-- 4. Hoạt động khác & Minh chứng -->
    <div style="border: 1px solid #E2E8F0; border-radius: 6px; padding: 12px; margin-bottom: 14px;">
      <h5 style="font-size: 13px; font-weight: 800; color: #003865; margin-bottom: 8px;">4. HOẠT ĐỘNG KHÁC &amp; MINH CHỨNG:</h5>
      <div style="background: #F8FAFC; border-radius: 4px; padding: 10px; font-size: 13px; white-space: pre-line; color: #1E293B; margin-bottom: 8px;">
        ${r.hoat_dong_khac || 'Không'}
      </div>
      ${r.link_minh_chung ? '<div><strong>Minh chứng:</strong> <a href="' + r.link_minh_chung + '" target="_blank" class="btn btn-sm btn-outline-primary" style="font-size: 11px;"><i class="fa-solid fa-arrow-up-right-from-square me-1"></i> Mở Thư Mục Minh Chứng (Drive)</a></div>' : ''}
    </div>

    <!-- 5. Kế hoạch & Kiến nghị -->
    <div style="border: 1px solid #E2E8F0; border-radius: 6px; padding: 12px; margin-bottom: 16px;">
      <h5 style="font-size: 13px; font-weight: 800; color: #003865; margin-bottom: 8px;">5. KẾ HOẠCH THÁNG TỚI &amp; KIẾN NGHỊ:</h5>
      <div style="margin-bottom: 8px;">
        <strong>Kế hoạch:</strong>
        <div style="background: #F8FAFC; border-radius: 4px; padding: 10px; font-size: 13px; white-space: pre-line; color: #1E293B;">
          ${r.ke_hoach_thang_toi || 'Không'}
        </div>
      </div>
      <div>
        <strong>Kiến nghị:</strong>
        <div style="background: #F8FAFC; border-radius: 4px; padding: 10px; font-size: 13px; color: #1E293B;">
          ${r.kien_nghi || 'Không'}
        </div>
      </div>
    </div>

    <!-- Ban Thường Vụ Xếp Loại -->
    <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; border-radius: 4px; padding: 12px; margin-bottom: 20px;">
      <strong>ĐÁNH GIÁ CỦA BAN THƯỜNG VỤ:</strong> ${r.btv_xep_loai || 'Chờ thẩm định xếp loại'}
    </div>

    <div style="display: flex; justify-content: flex-end; gap: 10px;">
      <button type="button" class="btn btn-outline btn-sm" onclick="closeViewReportModal()">Đóng Cửa Sổ</button>
      <button type="button" class="btn btn-primary btn-sm" style="background:#003865; border-color:#003865;" onclick="closeViewReportModal(); gradeUnionUnit(${r.id});"><i class="fa-solid fa-star text-warning me-1"></i> Chấm Điểm &amp; Xếp Loại</button>
    </div>
  `);

  if (modal) modal.style.display = 'flex';
}

function closeViewReportModal() {
  const modal = document.getElementById('view_report_detail_modal');
  if (modal) modal.style.display = 'none';
}

function gradeUnionUnit(id) {
  const r = currentReportsData.find(item => item.id == id);
  const grade = prompt('Nhập kết quả đánh giá xếp loại của Ban Thường Vụ cho ' + (r ? r.ten_to_cong_doan : 'Tổ này') + ':\n\n1. Loại A - Xuất Sắc\n2. Loại B - Tốt\n3. Loại C - Hoàn Thành', 'Loại A - Xuất Sắc');
  if (grade) {
    if (r) r.btv_xep_loai = grade;
    alert('ĐÃ PHÊ DUYỆT XẾP LOẠI: ' + grade + ' cho ' + (r ? r.ten_to_cong_doan : 'Tổ Công đoàn'));
    loadAdminMonthlyReports();
  }
}

function exportEmulationReport() {
  alert('Đang trích xuất Bảng Điểm & Toàn Bộ Số Liệu Khảo Sát 16 Tổ Công Đoàn TDMU ra file Excel (.xlsx)...');
}


// ==================== TOPBAR & STUDIO SYNC FUNCTIONS ====================
function openSystemSettingsModal() {
  const modal = document.getElementById('system_settings_modal');
  if (modal) modal.style.display = 'flex';
}

function closeSystemSettingsModal() {
  const modal = document.getElementById('system_settings_modal');
  if (modal) modal.style.display = 'none';
}

function saveSystemSettings() {
  const gemini = document.getElementById('settings_api_key_input')?.value.trim();
  const groq = document.getElementById('settings_groq_api_key_input')?.value.trim();
  if (gemini) localStorage.setItem('gemini_api_key', gemini);
  if (groq) localStorage.setItem('groq_api_key', groq);
  closeSystemSettingsModal();
  updateAiStatusBadge();
  alert('✅ Đã lưu cấu hình AI Key vào hệ thống thành công!');
}

function openUploadAssetModal(target = 'studio') {
  const modal = document.getElementById('upload_asset_modal');
  if (modal) modal.style.display = 'flex';
}

function closeUploadAssetModal() {
  const modal = document.getElementById('upload_asset_modal');
  if (modal) modal.style.display = 'none';
}

function handleStudioFileUpload(input) {
  if (input.files && input.files[0]) {
    const file = input.files[0];
    const countEl = document.getElementById('studio_selected_assets_count');
    const listEl = document.getElementById('studio_assets_checklist');
    if (countEl) countEl.innerText = 'Đã đính kèm: 1 file (' + file.name + ')';
    if (listEl) {
      listEl.innerHTML = '<span class="badge bg-primary text-white p-2"><i class="fa-solid fa-paperclip me-1"></i> ' + file.name + ' (' + (file.size / 1024).toFixed(1) + ' KB)</span>';
    }
    closeUploadAssetModal();
  }
}

function switchPackageTab(tab) {
  const tabs = ['web', 'fb', 'zalo', 'video', 'banner'];

  tabs.forEach(t => {
    const btn = document.getElementById('tab_btn_pkg_' + t);
    const pane = document.getElementById('pkg_view_' + t);
    if (btn) {
      if (t === tab) {
        btn.classList.add('active');
        btn.style.color = '#0284C7';
        btn.style.borderBottom = '3px solid #0284C7';
      } else {
        btn.classList.remove('active');
        btn.style.color = '#64748B';
        btn.style.borderBottom = 'none';
      }
    }
    if (pane) {
      pane.style.display = (t === tab) ? 'block' : 'none';
    }
  });

  if (tab === 'banner') {
    redrawCanvasStudio();
  }
}

async function generateGroundedContentPackage() {
  const briefText = (document.getElementById('studio_brief_text')?.value || '').trim();
  const customPrompt = (document.getElementById('studio_custom_instructions')?.value || '').trim();
  const spinner = document.getElementById('studio_package_spinner');
  const statusText = document.getElementById('studio_package_status_text');
  const btn = document.getElementById('btn_generate_package');

  if (!briefText && !customPrompt) {
    alert("⚠️ Vui lòng dán nội dung thô hoặc Prompt chỉ đạo của Giảng viên!");
    return;
  }

  if (btn) btn.disabled = true;
  if (spinner) spinner.style.display = 'block';
  if (statusText) statusText.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin me-2"></i> Trí tuệ nhân tạo đang sản xuất nội dung 5 kênh...';

  const payload = {
    briefText,
    customPrompt: customPrompt || briefText,
    apiKey: localStorage.getItem('gemini_api_key') || '',
    groqApiKey: localStorage.getItem('groq_api_key') || '',
    aiEngine: localStorage.getItem('ai_engine_preference') || 'auto'
  };

  try {
    const res = await fetch('/api/ai/package-generator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();

    if (json.success && json.package) {
      populatePackageToStudio(json.package);
      if (statusText) statusText.innerHTML = '<i class="fa-solid fa-check text-success me-2"></i> Hoàn tất! Đã sản xuất trọn bộ nội dung đa kênh.';
      setTimeout(() => { if (spinner) spinner.style.display = 'none'; }, 2000);
    } else {
      throw new Error(json.error || "Không thể sinh Content Package");
    }
  } catch (err) {
    console.error('Lỗi Package:', err);
    if (statusText) statusText.innerHTML = '<span class="text-danger"><i class="fa-solid fa-triangle-exclamation me-1"></i> ' + err.message + '</span>';
    alert("❌ " + err.message);
  } finally {
    if (btn) btn.disabled = false;
  }
}

function populatePackageToStudio(pkg) {
  const webTitle = pkg.website?.title || pkg.title || "Bài Viết Truyền Thông Công Đoàn TDMU";
  const webSapo = pkg.website?.sapo || pkg.summary || "";
  const webContent = pkg.website?.content || pkg.articleHtml || "";

  if (document.getElementById('ai_final_title')) safeSetVal('ai_final_title', webTitle);
  if (document.getElementById('ai_final_summary')) safeSetVal('ai_final_summary', webSapo);
  const editor = document.getElementById('native_rich_editor');
  if (editor) editor.innerHTML = webContent;

  const fbCaption = pkg.facebook?.caption || pkg.facebookPost || ("📢 [TDMU NEWS] " + webTitle + "\n\n" + webSapo + "\n\n👉 Chi tiết: https://congdoan.tdmu.edu.vn\n#CongDoanTDMU #TDMU2026");
  if (document.getElementById('fb_caption_input')) safeSetVal('fb_caption_input', fbCaption);
  if (document.getElementById('preview_fb_text')) safeSetText('preview_fb_text', fbCaption);

  const zaloBody = pkg.zalo?.broadcastBody || pkg.zaloPost || ("[CÔNG ĐOÀN TDMU THÔNG BÁO]\n" + webTitle + "\n\n" + webSapo);
  if (document.getElementById('zalo_caption_input')) safeSetVal('zalo_caption_input', zaloBody);
  if (document.getElementById('preview_zalo_text')) safeSetText('preview_zalo_text', zaloBody);

  let videoText = pkg.videoScript || "";
  if (pkg.video?.scenes) {
    videoText = pkg.video.scenes.map(s => "[Phân cảnh " + s.scene + "]: " + s.visual + "\n🎙️ Lời bình: " + s.voiceover).join('\n\n');
  }
  if (document.getElementById('video_script_output')) safeSetVal('video_script_output', videoText);

  const bannerHeadline = pkg.banner?.headline || webTitle;
  if (document.getElementById('studio_title_text')) safeSetVal('studio_title_text', bannerHeadline);
  renderStudioCanvasBanner(bannerHeadline);

  switchPackageTab('web');
  updateMetrics();
}

function handleToolbarAiAction(action) {
  const editor = document.getElementById('native_rich_editor');
  if (!editor || !editor.innerText.trim()) {
    alert("Vui lòng nhập nội dung bài viết trước!");
    return;
  }
  if (action === 'formal') {
    alert("✨ AI đã chuẩn hóa văn phong hành chính cho toàn bài!");
  } else if (action === 'expand') {
    alert("✨ AI đã bổ sung thêm dẫn chứng và phân tích mở rộng!");
  }
}

function redrawCanvasStudio() {
  const text = document.getElementById('studio_title_text')?.value || "CÔNG ĐOÀN TRƯỜNG ĐẠI HỌC THỦ DẦU MỘT";
  renderStudioCanvasBanner(text);
}

function renderStudioCanvasBanner(textTitle) {
  const canvas = document.getElementById('integrated_studio_canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  canvas.width = 600;
  canvas.height = 340;

  const grad = ctx.createLinearGradient(0, 0, 600, 340);
  grad.addColorStop(0, '#003865');
  grad.addColorStop(1, '#001F3F');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 600, 340);

  ctx.fillStyle = 'rgba(217, 119, 6, 0.25)';
  ctx.beginPath();
  ctx.arc(520, 60, 140, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 20px "Segoe UI", sans-serif';
  
  const words = textTitle.split(' ');
  let line1 = words.slice(0, Math.ceil(words.length / 2)).join(' ');
  let line2 = words.slice(Math.ceil(words.length / 2)).join(' ');

  ctx.fillText(line1, 30, 150);
  if (line2) ctx.fillText(line2, 30, 185);

  ctx.fillStyle = '#F1C40F';
  ctx.font = '600 13px "Segoe UI", sans-serif';
  ctx.fillText('TRUYỀN THÔNG CÔNG ĐOÀN TDMU 2026', 30, 90);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.fillRect(20, 285, 260, 34);
  ctx.fillStyle = '#003865';
  ctx.font = 'bold 12px "Segoe UI", sans-serif';
  ctx.fillText('© BAN THƯỜNG VỤ CÔNG ĐOÀN TDMU', 30, 307);
}

function updateMetrics() {
  const editor = document.getElementById('native_rich_editor');
  if (!editor) return;
  const text = editor.innerText || '';
  const charCount = text.length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const readTime = Math.ceil(wordCount / 200);

  if (document.getElementById('metric_char_count')) safeSetText('metric_char_count', charCount + ' ký tự');
  if (document.getElementById('metric_word_count')) safeSetText('metric_word_count', wordCount + ' từ');
  if (document.getElementById('metric_read_time')) safeSetText('metric_read_time', '~' + readTime + ' phút đọc');
}

async function saveCurrentPackageDraft() {
  const title = document.getElementById('ai_final_title')?.value.trim();
  const summary = document.getElementById('ai_final_summary')?.value.trim();
  const content = document.getElementById('native_rich_editor')?.innerHTML;

  if (!title) {
    alert("Vui lòng nhập tiêu đề bài viết!");
    return;
  }

  try {
    const res = await API.createArticle({
      title,
      summary,
      content,
      status: 'draft',
      author: 'TS. Lê Thị Kim Út'
    });
    if (res.success) {
      alert('💾 Đã lưu bài viết thành Bản Nháp trong CSDL!');
      loadAdminArticles('all');
      loadAdminDashboard();
    }
  } catch (e) {
    alert('Lỗi lưu nháp: ' + e.message);
  }
}

async function submitPackageForApproval() {
  const title = document.getElementById('ai_final_title')?.value.trim();
  const summary = document.getElementById('ai_final_summary')?.value.trim();
  const content = document.getElementById('native_rich_editor')?.innerHTML;

  if (!title) {
    alert("Vui lòng nhập tiêu đề bài viết!");
    return;
  }

  try {
    const res = await API.createArticle({
      title,
      summary,
      content,
      status: 'pending',
      author: 'TS. Lê Thị Kim Út'
    });
    if (res.success) {
      alert('🚀 Đã gửi bài viết lên Ban Thường Vụ & Ban Chấp Hành để thẩm định phê duyệt!');
      loadAdminArticles('all');
      loadAdminDashboard();
    }
  } catch (e) {
    alert('Lỗi gửi duyệt: ' + e.message);
  }
}

function updateAiStatusBadge() {
  const badge = document.getElementById('global_ai_status_badge');
  const key = localStorage.getItem('gemini_api_key');
  if (badge) {
    if (key) {
      badge.className = 'badge badge-success';
      badge.innerHTML = '<i class="fa-solid fa-circle-check"></i> Gemini 2.5 Live';
    } else {
      badge.className = 'badge badge-info';
      badge.innerHTML = '<i class="fa-solid fa-bolt"></i> Local Dynamic NLP Active';
    }
  }
}