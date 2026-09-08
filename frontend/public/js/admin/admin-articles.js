// =========================================================================
// 2. ARTICLES, MEDIA, SCHEDULES, USERS & AUDIT MANAGEMENT
// =========================================================================
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

  tbody.innerHTML = list.map(a => {
    const s = (a.status || (a.id === 6 ? 'draft' : (a.id === 5 ? 'pending' : 'published'))).toLowerCase();
    let statusLabel = 'Đã Xuất Bản';
    let badgeClass = 'badge-success';
    if (s.includes('pend') || s.includes('chờ')) {
      statusLabel = 'Chờ Duyệt';
      badgeClass = 'badge-warning';
    } else if (s.includes('draft') || s.includes('nháp')) {
      statusLabel = 'Bản Nháp';
      badgeClass = 'badge';
    } else if (s.includes('app') || s.includes('duyệt')) {
      statusLabel = 'Đã Duyệt';
      badgeClass = 'badge-info';
    }

    return `
    <tr style="border-bottom: 1px solid var(--border-color);">
      <td style="padding: 12px; font-weight: 700;">#${a.id}</td>
      <td style="padding: 12px; font-weight: 600; max-width: 280px;">${a.title}</td>
      <td style="padding: 12px;"><span class="badge badge-info">${a.categoryName || 'Hoạt động công đoàn'}</span></td>
      <td style="padding: 12px; font-size: 13px;">${a.author || 'Ban Thường vụ'}</td>
      <td style="padding: 12px; font-size: 13px;">${a.createdAt || '30/08/2026'}</td>
      <td style="padding: 12px;">
        <span class="badge ${badgeClass}">${statusLabel}</span>
      </td>
      <td style="padding: 12px; text-align: right;">
        <button class="btn btn-outline btn-sm" onclick="openEditArticleModal(${a.id})" title="Chỉnh Sửa">
          <i class="fa-solid fa-pen-to-square"></i>
        </button>

        ${(currentUserRole === 'admin' || currentUserRole === 'editor') && s.includes('pend') ? `
          <button class="btn btn-success btn-sm" onclick="approveArticle(${a.id})" title="Duyệt Bài">
            <i class="fa-solid fa-check"></i> Duyệt
          </button>
        ` : ''}

        ${(currentUserRole === 'admin' || currentUserRole === 'editor') && (s.includes('publish') || s.includes('app')) ? `
          <button class="btn btn-primary btn-sm" style="background-color: #1877F2;" onclick="publishToFacebook(${a.id})" title="Đăng Fanpage FB">
            <i class="fa-brands fa-facebook"></i> Đăng FB
          </button>
        ` : ''}

        ${currentUserRole === 'admin' ? `
          <button class="btn btn-outline btn-sm" style="color: var(--danger);" onclick="deleteArticle(${a.id})" title="Xóa Bài">
            <i class="fa-solid fa-trash"></i> Xóa
          </button>
        ` : ''}
      </td>
    </tr>
  `;
  }).join('');
}

function searchAdminArticles(query) {
  loadAdminArticles(currentFilter, query);
}

function filterStatus(status) {
  // Update button active states
  ['all', 'draft', 'pending', 'published'].forEach(st => {
    const btn = document.getElementById('filter_btn_' + st);
    if (btn) {
      if (st === status) btn.classList.add('active');
      else btn.classList.remove('active');
    }
  });
  loadAdminArticles(status);
}

function getStatusBadgeClass(status) {
  const s = (status || 'published').toLowerCase();
  if (s.includes('publish')) return 'badge-success';
  if (s.includes('app')) return 'badge-info';
  if (s.includes('pend') || s.includes('chờ')) return 'badge-warning';
  if (s.includes('draft') || s.includes('nháp')) return 'badge';
  return 'badge-success';
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
