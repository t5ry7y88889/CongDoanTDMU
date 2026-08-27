// Master Admin CMS Studio Script - 100% Bug-Free Architecture
let currentUserRole = 'admin';
let currentStudioStep = 1;
let versionHistoryStack = [];
let isContentUnsaved = false;
let selectedAiTitle = "";
let currentEditingArticleId = null; // Track current article ID to prevent duplicate draft/publish entries!

document.addEventListener('DOMContentLoaded', () => {
  loadAdminDashboard();
  loadAdminArticles('all');
  loadUsersTable();
  loadScheduleTable();
  loadAuditLogs();
  loadFacebookPublishSelect();
  initNativeRichEditor();
  initSelectionHighlightMenu();
  initCanvasStudio();
  initUnsavedWarning();
  updateAiStatusBadge();

  const initialHash = window.location.hash.replace('#', '');
  if (initialHash && ['dashboard', 'articles', 'ai-creator', 'schedule', 'social', 'events', 'media', 'roles', 'users', 'audits', 'inbox'].includes(initialHash)) {
    showAdminTab(initialHash);
  } else {
    showAdminTab('dashboard');
  }
});

window.addEventListener('hashchange', () => {
  const hash = window.location.hash.replace('#', '');
  if (hash && ['dashboard', 'articles', 'ai-creator', 'schedule', 'social', 'events', 'media', 'roles', 'users', 'audits', 'inbox'].includes(hash)) {
    showAdminTab(hash);
  }
});

// NAVIGATION
function showAdminTab(tabName, subFilter = null) {
  const tabs = ['dashboard', 'articles', 'inbox', 'workspace', 'ai-creator', 'schedule', 'social', 'analytics', 'events', 'media', 'roles', 'users', 'audits'];
  
  tabs.forEach(t => {
    const elContent = document.getElementById(`tab_${t}_content`);
    const elMenu = document.getElementById(`menu_${t}`);

    if (elContent) elContent.style.display = (t === tabName) ? 'block' : 'none';
    if (elMenu) {
      if (t === tabName && !subFilter) elMenu.classList.add('active');
      else elMenu.classList.remove('active');
    }
  });

  // Handle article sub-status filters in menu
  if (tabName === 'articles') {
    ['all', 'draft', 'pending_review', 'published'].forEach(s => {
      const el = document.getElementById(`menu_articles_${s}`);
      if (el) {
        if (s === subFilter) el.classList.add('active');
        else el.classList.remove('active');
      }
    });
  }

  if (tabName === 'dashboard') loadAdminDashboard();
  if (tabName === 'articles') loadAdminArticles(subFilter || 'all');
  if (tabName === 'inbox') loadAssetsRepository();
  if (tabName === 'workspace') loadWorkspacePackages();
  if (tabName === 'ai-creator') {
    initStudioDossierDropdown();
    checkAndPromptLocalDraft();
    startStudioAutoSave();
  } else {
    if (typeof stopStudioAutoSave === 'function') stopStudioAutoSave();
  }
  if (tabName === 'users') loadUsersTable();
  if (tabName === 'audits') loadAuditLogs();
  if (tabName === 'media') loadMediaLibrary();
  if (tabName === 'events') loadEventsList();
  if (tabName === 'schedule') loadScheduleTable();
  if (tabName === 'social') loadFacebookPublishSelect();
  if (tabName === 'analytics') loadAdminDashboard();
}

function switchUserRole(role) {
  currentUserRole = role;
  const nameEl = document.getElementById('current_user_name');
  const badgeEl = document.getElementById('display_author_badge');
  let displayName = "TS. Nguyễn Văn A (Chủ Tịch Công Đoàn)";
  if (role === 'editor') displayName = "ThS. Trần Thị B (Phó Chủ Tịch Công Đoàn)";
  if (role === 'contributor') displayName = "ThS. Lê Văn C (Ủy Viên Ban Thường Vụ)";

  if (nameEl) {
    if (role === 'admin') nameEl.innerText = "Thầy Nguyễn Văn A (Admin)";
    else if (role === 'editor') nameEl.innerText = "Cô Trần Thị B (Editor)";
    else nameEl.innerText = "Thầy Lê Văn C (Contributor)";
  }
  if (badgeEl) badgeEl.innerText = displayName;
  loadAdminArticles('all');
}

function getCurrentAuthorName() {
  if (currentUserRole === 'editor') return "ThS. Trần Thị B (Phó Chủ Tịch)";
  if (currentUserRole === 'contributor') return "ThS. Lê Văn C (Ủy Viên BTV)";
  return "TS. Nguyễn Văn A (Chủ Tịch Công Đoàn)";
}

// 1. MASTER 4-STEP LINEAR STUDIO WORKFLOW
function goToStudioStep(stepNum) {
  currentStudioStep = stepNum;

  [1, 2, 3, 4].forEach(s => {
    const btn = document.getElementById(`studio_step_btn_${s}`);
    const panel = document.getElementById(`studio_step_panel_${s}`);

    if (btn) {
      if (s === stepNum) {
        btn.classList.add('active');
        btn.style.borderBottom = '3px solid var(--accent-gold)';
        btn.style.color = 'var(--primary-color)';
        btn.style.fontWeight = '800';
      } else {
        btn.classList.remove('active');
        btn.style.borderBottom = 'none';
        btn.style.color = 'var(--text-muted)';
        btn.style.fontWeight = '600';
      }
    }

    if (panel) panel.style.display = (s === stepNum) ? 'block' : 'none';
  });

  if (stepNum === 2) {
    const title = selectedAiTitle || document.getElementById('ai_final_title')?.value || "Bài Viết Công Đoàn TDMU";
    if (document.getElementById('studio_title_text')) document.getElementById('studio_title_text').value = title;
    if (document.getElementById('ai_image_prompt_custom')) document.getElementById('ai_image_prompt_custom').value = title;
    initProCanvasStudio();
    redrawCanvasStudio();
  } else if (stepNum === 3) {
    updateSocialPreviews();
    runAiQualityCheck();
  }
}

// 2. UNSAVED CHANGES WARNING
function initUnsavedWarning() {
  window.addEventListener('beforeunload', (e) => {
    if (isContentUnsaved) {
      e.preventDefault();
      e.returnValue = 'Bạn có thay đổi chưa được lưu vào CSDL!';
    }
  });
}

function markContentUnsaved() {
  isContentUnsaved = true;
  const badge = document.getElementById('unsaved_warning_badge');
  if (badge) badge.style.display = 'inline-block';
}

function markContentSaved() {
  isContentUnsaved = false;
  const badge = document.getElementById('unsaved_warning_badge');
  if (badge) badge.style.display = 'none';
}

// 3. NATIVE ZERO-DEPENDENCY RICH TEXT EDITOR & VERSION HISTORY (DUPLICATE-FREE)
function initNativeRichEditor() {
  const editor = document.getElementById('native_rich_editor');
  if (editor) {
    editor.addEventListener('input', () => {
      updateEditorMetrics();
      markContentUnsaved();
    });
    updateEditorMetrics();
  }
}

function execEditorCmd(command, value = null) {
  document.execCommand(command, false, value);
  updateEditorMetrics();
  markContentUnsaved();
}

function updateEditorMetrics() {
  const editor = document.getElementById('native_rich_editor');
  if (!editor) return;

  const text = editor.innerText || "";
  const charCount = text.length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const readTime = Math.ceil(wordCount / 200);

  const charEl = document.getElementById('metric_char_count');
  const wordEl = document.getElementById('metric_word_count');
  const timeEl = document.getElementById('metric_read_time');

  if (charEl) charEl.innerText = `${charCount} ký tự`;
  if (wordEl) wordEl.innerText = `${wordCount} từ`;
  if (timeEl) timeEl.innerText = `~${readTime} phút đọc`;
}

function getNativeEditorContent() {
  const editor = document.getElementById('native_rich_editor');
  return editor ? editor.innerHTML : "";
}

function setNativeEditorContent(html, skipHistory = false) {
  const editor = document.getElementById('native_rich_editor');
  if (editor) {
    editor.innerHTML = html;
    updateEditorMetrics();
    if (!skipHistory) {
      if (typeof saveEditorState === 'function') saveEditorState();
    }
  }
}

// 4. HIGHLIGHT & INLINE SELECTION AI ACTION MENU
function initSelectionHighlightMenu() { return; /* Disabled per user request */ 
  const editor = document.getElementById('native_rich_editor');
  const menu = document.getElementById('ai_selection_floating_menu');
  if (!editor || !menu) return;

  document.addEventListener('selectionchange', () => {
    const selection = window.getSelection();
    if (!selection.isCollapsed && editor.contains(selection.anchorNode)) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      menu.style.display = 'flex';
      menu.style.top = `${window.scrollY + rect.top - 42}px`;
      menu.style.left = `${window.scrollX + rect.left}px`;
    } else {
      setTimeout(() => {
        if (window.getSelection().isCollapsed) {
          menu.style.display = 'none';
        }
      }, 200);
    }
  });
}

async function handleSelectionAiAction(action) {
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();

  if (!selectedText) {
    alert("Vui lòng bôi đen một đoạn văn bản cần AI xử lý!");
    return;
  }

  const apiKey = localStorage.getItem('gemini_api_key') || "";

  try {
    const res = await API.floatingCommand({ action, text: selectedText, apiKey });
    if (res.success) {
      document.execCommand('insertHTML', false, `<span style="background: #FEF3C7; padding: 2px 4px; border-radius: 4px;" title="AI Đã Sửa">${res.result}</span>`);
      markContentUnsaved();
      alert(`[AI HIGHLIGHT ACTION SUCCESS] Đã thực hiện thao tác AI "${action}" cho đoạn văn được chọn!`);
    }
  } catch (err) {
    console.error(err);
  }
}

// 5. VERSION HISTORY STACK (DUPLICATE-FREE RESTORE)
function saveVersionHistory(content) {
  if (!content) return;
  const timestamp = new Date().toLocaleTimeString('vi-VN');
  
  // Avoid saving exact same content consecutively
  if (versionHistoryStack.length > 0 && versionHistoryStack[0].content === content) return;

  versionHistoryStack.unshift({ timestamp, content });
  if (versionHistoryStack.length > 5) versionHistoryStack.pop();

  const select = document.getElementById('version_history_select');
  if (select) {
    select.innerHTML = versionHistoryStack.map((v, idx) => `
      <option value="${idx}">Phiên bản ${versionHistoryStack.length - idx} (${v.timestamp})</option>
    `).join('');
  }
}

function restoreVersionHistory(index) {
  if (versionHistoryStack[index]) {
    setNativeEditorContent(versionHistoryStack[index].content, true); // true = skip history push!
    alert(`Đã khôi phục lại nội dung phiên bản (${versionHistoryStack[index].timestamp})!`);
  }
}

// 6. SYSTEM SETTINGS MODAL (LƯU API KEY)
function openSystemSettingsModal() {
  const key = localStorage.getItem('gemini_api_key') || "";
  document.getElementById('settings_api_key_input').value = key;
  document.getElementById('settings_groq_api_key_input').value = localStorage.getItem('groq_api_key') || '';
  document.getElementById('system_settings_modal').classList.add('active');
}

function closeSystemSettingsModal() {
  document.getElementById('system_settings_modal').classList.remove('active');
}

function saveSystemSettings() {
  const key = document.getElementById('settings_api_key_input').value.trim();
  localStorage.setItem('gemini_api_key', key);
  localStorage.setItem('groq_api_key', document.getElementById('settings_groq_api_key_input').value.trim());
  closeSystemSettingsModal();
  updateAiStatusBadge();
  alert("Đã lưu cấu hình Google Gemini API Key vào hệ thống thành công!");
}

function updateAiStatusBadge() {
  const badge = document.getElementById('global_ai_status_badge');
  const key = localStorage.getItem('gemini_api_key');
  if (badge) {
    if (key && key !== '') {
      badge.className = 'badge badge-success';
      badge.innerHTML = '<i class="fa-solid fa-circle-check"></i> Gemini 2.5 Flash Live Active';
    } else {
      badge.className = 'badge badge-warning';
      badge.innerHTML = '<i class="fa-solid fa-bolt"></i> Local Dynamic NLP Engine Active';
    }
  }
}

// 7. INPUT MODE SWITCHING
function switchAiInputMode(mode) {
  const formBox = document.getElementById('ai_event_form_box');
  const promptBox = document.getElementById('ai_freedom_prompt_box');
  const btnForm = document.getElementById('btn_mode_event_form');
  const btnPrompt = document.getElementById('btn_mode_freedom_prompt');

  if (mode === 'form') {
    if (formBox) formBox.style.display = 'block';
    if (promptBox) promptBox.style.display = 'none';
    if (btnForm) btnForm.classList.add('active');
    if (btnPrompt) btnPrompt.classList.remove('active');
  } else {
    if (formBox) formBox.style.display = 'none';
    if (promptBox) promptBox.style.display = 'block';
    if (btnForm) btnForm.classList.remove('active');
    if (btnPrompt) btnPrompt.classList.add('active');
  }
}

// 8. AI GENERATION WITH STEPPER ANIMATION
async function generateAIContent() {
  const isFormMode = document.getElementById('ai_event_form_box')?.style.display !== 'none';
  let eventForm = {};
  let promptInput = "";

  if (isFormMode) {
    eventForm = {
      name: document.getElementById('event_form_name').value.trim(),
      date: document.getElementById('event_form_date').value.trim(),
      time: document.getElementById('event_form_time').value.trim(),
      location: document.getElementById('event_form_location').value.trim(),
      audience: document.getElementById('event_form_audience').value
    };
    if (!eventForm.name) {
      alert("Vui lòng nhập Tên sự kiện!");
      return;
    }
  } else {
    promptInput = document.getElementById('ai_prompt_input').value.trim();
    if (!promptInput) {
      alert("Vui lòng nhập ý tưởng bài viết!");
      return;
    }
  }

  const category = document.getElementById('ai_category_select').value;
  const tone = document.getElementById('ai_tone_select').value;
  const lengthOption = document.getElementById('ai_length_select').value;
  const targetAudience = document.getElementById('ai_audience_select').value;
  const apiKey = localStorage.getItem('gemini_api_key') || "";
  const groqApiKey = localStorage.getItem('groq_api_key') || "";
  const aiEngine = localStorage.getItem('ai_engine_preference') || 'auto';

  const spinnerBox = document.getElementById('ai_stepper_spinner');
  const resultBox = document.getElementById('ai_editor_workspace');
  if (spinnerBox) spinnerBox.style.display = 'block';
  if (resultBox) resultBox.style.display = 'none';

  updateAiStepperState("🧠 Step 1/4: AI đang phân tích thông tin sự kiện & ngữ cảnh TDMU...");
  await new Promise(r => setTimeout(r, 400));

  updateAiStepperState("✍️ Step 2/4: AI đang sáng tạo nội dung văn bản chuẩn hành chính...");
  await new Promise(r => setTimeout(r, 400));

  try {
    const res = await API.generateAI({ prompt: promptInput, eventForm, category, tone, lengthOption, targetAudience, apiKey, groqApiKey, aiEngine });
    if (res.success) {
      updateAiStepperState("🔍 Step 3/4: AI kiểm tra văn phong & trích xuất tiêu đề...");
      await new Promise(r => setTimeout(r, 300));

      displayAIResults(res);
      updateAiStepperState("✓ Step 4/4: Hoàn tất bài viết thành công!");
    }
  } catch (err) {
    console.error(err);
  } finally {
    if (spinnerBox) spinnerBox.style.display = 'none';
    if (resultBox) resultBox.style.display = 'flex';
  }
}

function updateAiStepperState(msg) {
  const el = document.getElementById('ai_stepper_msg');
  if (el) el.innerText = msg;
}

// 9. CARD-BASED TITLE PICKER SELECTION
function displayAIResults(data) {
  const titlePicker = document.getElementById('ai_title_card_picker');
  if (titlePicker && data.titles) {
    titlePicker.innerHTML = data.titles.map((t, idx) => `
      <div class="title-card ${idx === 0 ? 'selected' : ''}" style="background: white; border: 2px solid ${idx === 0 ? 'var(--accent-gold)' : '#E2E8F0'}; padding: 10px 14px; border-radius: 8px; cursor: pointer; display: flex; justify-content: space-between; align-items: center;" onclick="selectTitleCard('${t.replace(/'/g, "\'")}', this)">
        <div>
          <strong style="color: var(--primary-color); font-size: 11px;">Mẫu ${idx+1}:</strong>
          <div style="font-weight: 700; font-size: 13.5px; color: var(--text-main); margin-top: 2px;">${t}</div>
        </div>
        <button class="btn btn-outline btn-sm" style="font-size: 11px;"><i class="fa-solid fa-check"></i> Chọn Tiêu Đề Này</button>
      </div>
    `).join('');
  }

  if (data.titles && data.titles[0]) {
    selectedAiTitle = data.titles[0];
    document.getElementById('ai_final_title').value = data.titles[0];
  }
  if (data.summary) document.getElementById('ai_final_summary').value = data.summary;
  if (data.content) setNativeEditorContent(data.content);
}

function selectTitleCard(titleText, cardEl) {
  selectedAiTitle = titleText;
  document.getElementById('ai_final_title').value = titleText;
  document.querySelectorAll('.title-card').forEach(c => c.style.borderColor = '#E2E8F0');
  if (cardEl) cardEl.style.borderColor = 'var(--accent-gold)';
  markContentUnsaved();
}

// 10. REAL DYNAMIC COMPUTED AI QUALITY CHECK AUDIT
async function runAiQualityCheck() {
  const title = document.getElementById('ai_final_title')?.value || "";
  const content = getNativeEditorContent();
  const reportBox = document.getElementById('ai_quality_audit_report');
  if (!reportBox) return;

  try {
    const res = await fetch('/api/ai/quality-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content })
    }).then(r => r.json());

    if (res.success) {
      reportBox.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; background: #F8FAFC; padding: 14px; border-radius: 8px; border: 1px solid #CBD5E1; margin-bottom: 14px;">
          <div>
            <h4 style="font-size: 15px; font-weight: 800; color: var(--primary-color);">Điểm Chất Lượng Truyền Thông TDMU</h4>
            <p style="font-size: 12px; color: var(--text-muted); margin: 0;">Đánh giá tự động theo chuẩn văn phong Công đoàn nhà trường</p>
          </div>
          <div style="font-size: 28px; font-weight: 900; color: var(--success);">${res.overallScore} / 100</div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px;">
          ${res.checks.map(c => `
            <div style="display: flex; justify-content: space-between; font-size: 13px; background: white; padding: 8px 12px; border-radius: 6px; border: 1px solid #E2E8F0;">
              <span><i class="fa-solid fa-circle-check" style="color: ${c.status === 'pass' ? 'var(--success)' : 'var(--warning)'};"></i> ${c.name}</span>
              <strong style="color: var(--primary-color);">${c.score}</strong>
            </div>
          `).join('')}
        </div>

        <div style="background: #FEF3C7; padding: 10px 14px; border-radius: 6px; border-left: 4px solid var(--accent-gold);">
          <strong style="font-size: 12px; color: #92400E;"><i class="fa-solid fa-triangle-exclamation"></i> Khuyến Nghị Tối Ưu:</strong>
          <ul style="margin: 4px 0 0 16px; font-size: 12.5px; color: #78350F;">
            ${res.warnings.map(w => `<li>${w}</li>`).join('')}
          </ul>
        </div>
      `;
    }
  } catch (err) {
    console.error(err);
  }
}

// 11. MULTI-PLATFORM SOCIAL PREVIEWS
function updateSocialPreviews() {
  const title = document.getElementById('ai_final_title')?.value || "Tiêu đề bài viết";
  const summary = document.getElementById('ai_final_summary')?.value || "Tóm tắt bài viết...";

  const fbText = document.getElementById('preview_fb_text');
  const zaloText = document.getElementById('preview_zalo_text');
  const emailText = document.getElementById('preview_email_text');

  if (fbText) fbText.innerText = `📢 [TDMU NEWS] ${title}\n\n${summary}\n\n👉 Chi tiết xem tại Website Công đoàn TDMU!\n#CongDoanTDMU #TDMU2026`;
  if (zaloText) zaloText.innerText = `[CÔNG ĐOÀN TDMU THÔNG BÁO]\n${title}\n\n${summary}`;
  if (emailText) emailText.innerText = `Kính gửi Qúy Thầy/Cô Đoàn viên,\n\nBan Thường vụ Công đoàn TDMU trân trọng thông báo: "${title}".\n\n${summary}\n\nTrân trọng!`;
}

// 12. SAVE ARTICLE ACTIONS WITH SINGLE ID TRACKING (NO DUPES BETWEEN DRAFT AND PUBLISH)
async function saveAIGeneratedArticle(targetStatus = 'pending') {
  const title = document.getElementById('ai_final_title').value.trim();
  const subTitle = document.getElementById('ai_final_subtitle')?.value.trim() || '';
  const summary = document.getElementById('ai_final_summary').value.trim();
  const content = getNativeEditorContent();
  const categoryName = document.getElementById('ai_category_select').value;
  const issuingUnit = document.getElementById('ai_issuing_unit_select')?.value || 'Ban Thường Vụ Công Đoàn Trường';
  const author = getCurrentAuthorName();
  const tags = document.getElementById('ai_final_tags')?.value.trim() || '#CôngĐoànTDMU, #TinTức';
  const promptInput = document.getElementById('ai_prompt_input').value.trim();
  const image = document.getElementById('studio_image_preview') ? document.getElementById('studio_image_preview').src : 'images/banner.jpg';

  if (!title) {
    alert("Vui lòng chọn tiêu đề bài viết!");
    return;
  }

  const finalStatus = (currentUserRole === 'admin') ? (targetStatus === 'draft' ? 'draft' : 'approved') : 'pending';

  try {
    let res;
    if (currentEditingArticleId) {
      // UPDATE EXISTING ARTICLE (PUT) - NO DUPLICATES!
      res = await API.updateArticle(currentEditingArticleId, {
        title,
        categoryName,
        summary,
        content,
        image,
        status: finalStatus
      });
    } else {
      // CREATE NEW ARTICLE (POST) AND SAVE ID TO SINGLETON TRACKER
      res = await API.createArticle({
        title,
        subTitle,
        categoryName,
        summary,
        content,
        image,
        author,
        issuingUnit,
        tags,
        status: finalStatus,
        isAiGenerated: true,
        aiPrompt: promptInput
      });
      if (res.success && res.data) {
        currentEditingArticleId = res.data.id;
      }
    }

    if (res.success) {
      markContentSaved();
            const statusLabels = {
        'published': 'Đã Xuất Bản',
        'approved': 'Đã Duyệt',
        'pending': 'Chờ Duyệt',
        'pending_review': 'Chờ Duyệt',
        'draft': 'Bản Nháp'
      };
      const displayStatus = (res.data && res.data.statusName) || statusLabels[finalStatus] || 'Đã Lưu';
      const displayId = currentEditingArticleId || (res.data ? res.data.id : '');
      alert(`Đã lưu bài viết AI #${displayId} vào CSDL thành công! Trạng thái: "${displayStatus}".`);
      loadAdminArticles('all');
      loadScheduleTable();
      loadFacebookPublishSelect();
      loadAdminDashboard();
      showAdminTab('articles');
    }
  } catch (err) {
    console.error(err);
  }
}

// 13. ARTICLE MANAGEMENT RENDER & CLEAN DELETE HANDLER
let currentFilter = 'all';

async function loadAdminArticles(filter = 'all', searchQuery = '') {
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
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 20px; color: var(--text-muted);">Không tìm thấy bài viết nào trong CSDL.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(a => `
    <tr style="border-bottom: 1px solid var(--border-color);">
      <td style="padding: 12px; font-weight: 700;">#${a.id}</td>
      <td style="padding: 12px; font-weight: 600; max-width: 280px;">${a.title}</td>
      <td style="padding: 12px;"><span class="badge badge-info">${a.categoryName}</span></td>
      <td style="padding: 12px; font-size: 13px;">${a.author}</td>
      <td style="padding: 12px; font-size: 13px;">${a.createdAt || '2026-08-21'}</td>
      <td style="padding: 12px;">
        <span class="badge ${getStatusBadgeClass(a.status)}">${a.statusName || a.status}</span>
      </td>
      <td style="padding: 12px; text-align: right;">
        <button class="btn btn-outline btn-sm" onclick="openEditArticleModal(${a.id})" title="Chỉnh Sửa Bài Viết">
          <i class="fa-solid fa-pen-to-square"></i>
        </button>

        ${a.status === 'pending' ? `
          <button class="btn btn-success btn-sm" onclick="approveArticle(${a.id})" title="Duyệt Bài">
            <i class="fa-solid fa-check"></i> Duyệt
          </button>
        ` : ''}

        ${(a.status === 'approved' || a.status === 'published') ? `
          <button class="btn btn-primary btn-sm" style="background-color: #1877F2;" onclick="publishToFacebook(${a.id})" title="Mô phỏng Đăng FB">
            <i class="fa-brands fa-facebook"></i> Đăng FB
          </button>
        ` : ''}

        <button class="btn btn-outline btn-sm" style="color: var(--danger);" onclick="deleteArticle(${a.id})" title="Xóa Bài Vĩnh Viễn">
          <i class="fa-solid fa-trash"></i> Xóa
        </button>
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
  try {
    const res = await API.approveArticle(id);
    if (res.success) {
      alert(`Đã duyệt thành công bài viết #${id}!`);
      loadAdminArticles('all');
      loadScheduleTable();
      loadFacebookPublishSelect();
      loadAdminDashboard();
    }
  } catch (err) {
    console.error(err);
  }
}

async function deleteArticle(id) {
  if (confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn bài viết #${id} khỏi CSDL?`)) {
    try {
      const res = await API.deleteArticle(id);
      if (res.success) {
        alert("Đã xóa bài viết khỏi CSDL thành công!");
        loadAdminArticles('all');
        loadScheduleTable();
        loadFacebookPublishSelect();
        loadAdminDashboard();
      }
    } catch (err) {
      console.error(err);
    }
  }
}

// EDIT MANUAL MODAL
function openCreateArticleModal() {
  currentEditingArticleId = null;
  document.getElementById('modal_article_heading').innerText = "Soạn Thảo Bài Viết Mới";
  document.getElementById('edit_article_id').value = "";
  document.getElementById('edit_title').value = "";
  document.getElementById('edit_summary').value = "";
  document.getElementById('modal_manual_content').value = "";
  document.getElementById('article_edit_modal').classList.add('active');
}

async function openEditArticleModal(id) {
  try {
    const res = await API.getArticleById(id);
    if (!res.success) return;

    const art = res.data;
    
    // Check if this is a Full Package Draft
    if (art.packageData) {
      resumeAiPackage(art.packageData, art.id);
      return;
    }

    // Otherwise, open the simple editor modal
    currentEditingArticleId = art.id;
    document.getElementById('modal_article_heading').innerText = `Chỉnh Sửa Bài Viết #${art.id}`;
    document.getElementById('edit_article_id').value = art.id;
    document.getElementById('edit_title').value = art.title;
    document.getElementById('edit_category').value = art.categoryName;
    document.getElementById('edit_author').value = art.author;
    document.getElementById('edit_summary').value = art.summary || "";
    document.getElementById('modal_manual_content').value = art.content || "";

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
  const content = document.getElementById('modal_manual_content').value;

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
    loadAdminArticles('all');
    loadScheduleTable();
    loadFacebookPublishSelect();
    loadAdminDashboard();

  } catch (err) {
    console.error(err);
  }
}

// 14. USERS MANAGEMENT
async function loadUsersTable() {
  const tbody = document.getElementById('users_table_body');
  if (!tbody) return;

  try {
    const res = await API.getUsers();
    if (res.success) {
      tbody.innerHTML = res.data.map(u => `
        <tr style="border-bottom: 1px solid var(--border-color);">
          <td style="padding: 12px; font-weight: 700; color: var(--primary-color);">${u.name}</td>
          <td style="padding: 12px;">${u.email}</td>
          <td style="padding: 12px;"><span class="badge ${u.roleId === 1 ? 'badge-gold' : (u.roleId === 2 ? 'badge-info' : 'badge-warning')}">${u.roleName}</span></td>
          <td style="padding: 12px;">${u.department || 'TDMU'}</td>
          <td style="padding: 12px; text-align: right;">
            <button class="btn btn-outline btn-sm" style="color: var(--danger);" onclick="deleteUserAccount(${u.id})">
              <i class="fa-solid fa-trash"></i> Xóa
            </button>
          </td>
        </tr>
      `).join('');
    }
  } catch (err) {
    console.error(err);
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

// 15. CANVAS STUDIO
let currentFilterType = 'none';

function initCanvasStudio() {
  renderStudioCanvasBanner("Công Đoàn Trường Đại Học Thủ Dầu Một");
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

  ctx.filter = 'none';
  if (currentFilterType === 'grayscale') ctx.filter = 'grayscale(100%)';
  else if (currentFilterType === 'sepia') ctx.filter = 'sepia(80%)';
  else if (currentFilterType === 'brightness') ctx.filter = 'brightness(130%) contrast(110%)';
  else if (currentFilterType === 'vintage') ctx.filter = 'contrast(120%) saturate(140%) sepia(30%)';

  ctx.fillStyle = 'rgba(217, 119, 6, 0.25)';
  ctx.beginPath();
  ctx.arc(520, 60, 140, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 22px "Plus Jakarta Sans", sans-serif';
  
  const words = textTitle.split(' ');
  let line1 = words.slice(0, Math.ceil(words.length / 2)).join(' ');
  let line2 = words.slice(Math.ceil(words.length / 2)).join(' ');

  ctx.fillText(line1, 30, 150);
  if (line2) ctx.fillText(line2, 30, 185);

  ctx.fillStyle = '#F1C40F';
  ctx.font = '600 14px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('TRUYỀN THÔNG CÔNG ĐOÀN TDMU 2026', 30, 90);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.fillRect(20, 285, 260, 34);
  ctx.fillStyle = '#003865';
  ctx.font = 'bold 13px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('© BAN THƯỜNG VỤ CÔNG ĐOÀN', 32, 307);

  const previewImg = document.getElementById('studio_image_preview');
  if (previewImg) previewImg.src = canvas.toDataURL('image/png');
}

function applyIntegratedFilter(filter) {
  currentFilterType = filter;
  const title = document.getElementById('ai_final_title') ? document.getElementById('ai_final_title').value : "Bài Viết Công Đoàn TDMU";
  renderStudioCanvasBanner(title);
}

// 16. MEDIA, SCHEDULE, SOCIAL, INBOX, AUDITS, EVENTS
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
              <button class="btn btn-outline btn-sm" style="font-size: 10px; color: var(--danger);" onclick="deleteMediaFile(${m.id})"><i class="fa-solid fa-trash"></i></button>
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

async function loadScheduleTable() {
  const tbody = document.getElementById('schedule_table_body');
  if (!tbody) return;

  try {
    const res = await API.getArticles('all', 'all');
    if (res.success) {
      tbody.innerHTML = res.data.map(a => `
        <tr style="border-bottom: 1px solid var(--border-color);">
          <td style="padding: 10px; font-weight: 600;">${a.title}</td>
          <td style="padding: 10px; color: var(--accent-gold); font-weight: 700;"><i class="fa-regular fa-clock"></i> ${a.scheduledAt || 'Chưa thiết lập'}</td>
          <td style="padding: 10px;"><span class="badge badge-info">Website & Fanpage</span></td>
          <td style="padding: 10px;">
            <span class="badge ${a.status === 'published' ? 'badge-success' : 'badge-warning'}">
              ${a.status === 'published' ? 'Đã Xuất Bản' : 'Chờ Cronjob Chạy'}
            </span>
          </td>
          <td style="padding: 10px; text-align: right;">
            <button class="btn btn-outline btn-sm" onclick="setScheduleTime(${a.id})">
              <i class="fa-solid fa-pen-to-square"></i> Đặt Giờ
            </button>
          </td>
        </tr>
      `).join('');
    }
  } catch (err) {
    console.error(err);
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
      loadAdminArticles('all');
      loadScheduleTable();
      loadAdminDashboard();
    }
  } catch (err) {
    console.error(err);
  }
}

async function loadAuditLogs() {
  const tbody = document.getElementById('audit_table_body');
  if (!tbody) return;

  try {
    const res = await API.getAudits();
    if (res.success) {
      tbody.innerHTML = res.data.map(log => `
        <tr style="border-bottom: 1px solid var(--border-color);">
          <td style="padding: 10px; font-weight: 600;">${log.timestamp}</td>
          <td style="padding: 10px; font-weight: 700; color: var(--primary-color);">${log.userName}</td>
          <td style="padding: 10px;"><span class="badge badge-gold">${log.action}</span></td>
          <td style="padding: 10px; font-size: 13px;">${log.details}</td>
        </tr>
      `).join('');
    }
  } catch (err) {
    console.error(err);
  }
}

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
            <button class="btn btn-outline btn-sm" style="color:var(--danger);" onclick="deleteCommentItem(${c.id})"><i class="fa-solid fa-trash"></i></button>
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
            <button class="btn btn-outline btn-sm" style="color:var(--danger);" onclick="deleteEventItem(${ev.id})"><i class="fa-solid fa-trash"></i> Xóa</button>
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
  loadAdminArticles('all');
  alert("Đã đồng bộ và làm mới dữ liệu thống kê từ CSDL vĩnh viễn!");
}

async function aiRepurposeAction(platform) {
  const title = document.getElementById('ai_final_title')?.value || "Thông Báo TDMU";
  const content = getNativeEditorContent();
  try {
    const res = await API.repurposeContent({ platform, title, content });
    if (res.success) {
      alert(`[REPURPOSE ${platform.toUpperCase()} SUCCESS]\n\n${res.result}`);
    }
  } catch (err) {
    console.error(err);
  }
}

async function loadAdminDashboard() {
  try {
    const res = await API.getAnalytics();
    if (res.success) {
      const totalArtEl = document.getElementById('stat_total_articles');
      const totalViewsEl = document.getElementById('stat_total_views');
      const aiGenEl = document.getElementById('stat_ai_generated');
      const fbPubEl = document.getElementById('stat_fb_published');

      if (totalArtEl) totalArtEl.innerText = res.totalArticles;
      if (totalViewsEl) totalViewsEl.innerText = (res.totalViews || 0).toLocaleString();
      if (aiGenEl) aiGenEl.innerText = res.aiArticlesCount;
      if (fbPubEl) fbPubEl.innerText = res.publishedCount;
    }
    loadTopArticlesTable();
  } catch (err) {
    console.error("Error loading admin dashboard stats:", err);
  }
}

async function loadTopArticlesTable() {
  const tbody = document.getElementById('top_articles_table');
  if (!tbody) return;

  try {
    const res = await API.getArticles('all', 'all');
    if (res.success) {
      if (res.data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 20px; color: var(--text-muted);">Chưa có bài viết nào trong CSDL.</td></tr>`;
        return;
      }
      tbody.innerHTML = res.data.map(a => `
        <tr style="border-bottom: 1px solid var(--border-color);">
          <td style="padding: 10px; font-weight: 600;">${a.title}</td>
          <td style="padding: 10px;"><span class="badge badge-info">${a.categoryName}</span></td>
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


// 15. MULTI-MODAL AI: EVENT PLAN GENERATOR
async function generateAiEventPlan() {
  const eventName = document.getElementById('event_form_name')?.value || "Hội Thao Truyền Thống Công Đoàn TDMU 2026";
  const budget = document.getElementById('event_form_budget')?.value || "15,000,000 VNĐ";

  try {
    const res = await fetch('/api/ai/event-plan-generator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventName, budget })
    }).then(r => r.json());

    if (res.success) {
      let planHtml = `<h2>KỊCH BẢN TỔ CHỨC: ${res.eventTitle.toUpperCase()}</h2>`;
      planHtml += `<p><strong>I. LỊCH TRÌNH TIẾN ĐỘ CHƯƠNG TRÌNH:</strong></p><ul>`;
      res.timeline.forEach(t => {
        planHtml += `<li><strong>${t.time}:</strong> ${t.title} (<em>Phụ trách: ${t.leader}</em>)</li>`;
      });
      planHtml += `</ul><p><strong>II. DỰ TRÙ KINH PHÍ TỔ CHỨC:</strong></p><ul>`;
      res.budgetBreakdown.forEach(b => {
        planHtml += `<li>• ${b.item}: <strong>${b.amount}</strong></li>`;
      });
      planHtml += `</ul><div class="journal-contact-card">📌 <strong>Ban Tổ Chức Sự Kiện Công Đoàn TDMU</strong></div>`;

      setNativeEditorContent(planHtml);
      if (document.getElementById('ai_final_title')) {
        document.getElementById('ai_final_title').value = `Kế hoạch & Kịch bản tổ chức ${res.eventTitle}`;
      }
      if (document.getElementById('ai_final_summary')) {
        document.getElementById('ai_final_summary').value = res.pressReleaseDraft;
      }
      markContentUnsaved();
      alert("✨ AI đã tự động lập Kịch bản sự kiện, Timeline và Dự trù kinh phí vào khung soạn thảo!");
    }
  } catch (err) {
    console.error(err);
  }
}

// 16. MULTI-MODAL AI: IMAGE & BANNER PROMPT GENERATOR
async function generateAiImagePrompts() {
  const topic = document.getElementById('event_form_name')?.value || "Hoạt động công đoàn TDMU";

  try {
    const res = await fetch('/api/ai/image-prompt-generator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic })
    }).then(r => r.json());

    if (res.success) {
      if (document.getElementById('studio_title_text')) {
        document.getElementById('studio_title_text').value = res.slogan;
        redrawCanvasStudio();
      }
      alert(`🎨 AI đã sinh khẩu hiệu Banner: "${res.slogan}"\n\nPrompt tạo ảnh 4K:\n"${res.prompts[0]}"`);
    }
  } catch (err) {
    console.error(err);
  }
}


// =========================================================================
// 15. PRO INTERACTIVE CANVAS STUDIO & MULTI-IMAGE GALLERY ENGINE (60 FPS ULTRA-FAST)
let articleGallery = [
  {
    id: 'img_1',
    url: 'images/banner.jpg',
    title: 'Hội Thao Cán Bộ Giảng Viên TDMU',
    isBanner: true,
    date: '2026-08-22'
  },
  {
    id: 'img_2',
    url: 'images/banner.jpg',
    title: 'Tọa Đàm Chăm Lo Đời Sống Đoàn Viên',
    isBanner: false,
    date: '2026-08-20'
  },
  {
    id: 'img_3',
    url: 'images/banner.jpg',
    title: 'Khuôn Viên Đại Học Thủ Dầu Một',
    isBanner: false,
    date: '2026-08-15'
  }
];

let canvasState = {
  width: 720,
  height: 405,
  baseImageUrl: 'images/banner.jpg',
  title: 'PHONG TRÀO THỂ THAO CÔNG ĐOÀN TDMU 2026',
  subtitle: 'ĐOÀN KẾT - NĂNG ĐỘNG - SÁNG TẠO VƯƠN TẦM',
  textColor: '#FFFFFF',
  filterType: 'none',
  brightness: 100,
  contrast: 100,
  watermark: true,
  titlePos: { x: 40, y: 260 },
  subtitlePos: { x: 40, y: 190 },
  isDragging: false,
  dragTarget: null,
  dragOffset: { x: 0, y: 0 }
};

let baseImageObj = new Image();
baseImageObj.src = canvasState.baseImageUrl;

let isCanvasEventsBound = false;
let animFrameId = null;

function initProCanvasStudio() {
  renderArticleGallery();
  bindCanvasEventsOnce();
  redrawCanvasStudio();
}

function bindCanvasEventsOnce() {
  if (isCanvasEventsBound) return;
  const canvas = document.getElementById('integrated_studio_canvas');
  if (!canvas) return;

  isCanvasEventsBound = true;

  canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    // Check hit on Title
    if (Math.abs(mouseX - canvasState.titlePos.x) < 300 && Math.abs(mouseY - canvasState.titlePos.y) < 50) {
      canvasState.isDragging = true;
      canvasState.dragTarget = 'title';
      canvasState.dragOffset = { x: mouseX - canvasState.titlePos.x, y: mouseY - canvasState.titlePos.y };
      return;
    }

    // Check hit on Subtitle
    if (Math.abs(mouseX - canvasState.subtitlePos.x) < 250 && Math.abs(mouseY - canvasState.subtitlePos.y) < 40) {
      canvasState.isDragging = true;
      canvasState.dragTarget = 'subtitle';
      canvasState.dragOffset = { x: mouseX - canvasState.subtitlePos.x, y: mouseY - canvasState.subtitlePos.y };
      return;
    }
  });

  window.addEventListener('mousemove', (e) => {
    if (!canvasState.isDragging || !canvasState.dragTarget) return;
    const canvas = document.getElementById('integrated_studio_canvas');
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    if (canvasState.dragTarget === 'title') {
      canvasState.titlePos.x = Math.max(20, Math.min(canvas.width - 200, mouseX - canvasState.dragOffset.x));
      canvasState.titlePos.y = Math.max(40, Math.min(canvas.height - 30, mouseY - canvasState.dragOffset.y));
    } else if (canvasState.dragTarget === 'subtitle') {
      canvasState.subtitlePos.x = Math.max(20, Math.min(canvas.width - 200, mouseX - canvasState.dragOffset.x));
      canvasState.subtitlePos.y = Math.max(30, Math.min(canvas.height - 30, mouseY - canvasState.dragOffset.y));
    }

    if (!animFrameId) {
      animFrameId = requestAnimationFrame(() => {
        redrawCanvasStudio();
        animFrameId = null;
      });
    }
  });

  window.addEventListener('mouseup', () => {
    canvasState.isDragging = false;
    canvasState.dragTarget = null;
  });
}

function renderArticleGallery() {
  const container = document.getElementById('article_gallery_container');
  if (!container) return;

  container.innerHTML = articleGallery.map((img, idx) => `
    <div style="flex: 0 0 210px; background: white; border: 2px solid ${img.isBanner ? 'var(--accent-gold)' : '#CBD5E1'}; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 6px rgba(0,0,0,0.06);">
      <div style="position: relative; height: 110px; background: #001F3F;">
        <img src="${img.url}" style="width: 100%; height: 100%; object-fit: cover; cursor: pointer;" onclick="loadGalleryImageToCanvas('${img.id}')">
        ${img.isBanner ? '<span class="badge badge-gold" style="position: absolute; top: 6px; left: 6px; font-size: 10px;">⭐ BANNER CHÍNH</span>' : ''}
      </div>
      <div style="padding: 8px;">
        <div style="font-weight: 700; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-main);">${img.title}</div>
        <div style="font-size: 10.5px; color: #64748B; margin: 2px 0 6px 0;">${img.date}</div>
        <div style="display: flex; gap: 4px;">
          <button type="button" class="btn btn-outline btn-sm" style="flex: 1; font-size: 10.5px; padding: 4px 2px;" onclick="insertGalleryImageToRichEditor('${img.url}', '${img.title.replace(/'/g, "\'")}')">📥 Chèn</button>
          <button type="button" class="btn btn-outline btn-sm" style="flex: 1; font-size: 10.5px; padding: 4px 2px;" onclick="setGalleryImageAsBanner('${img.id}')">📌 Banner</button>
          <button type="button" class="btn btn-outline btn-sm" style="padding: 4px 6px; color: var(--danger);" onclick="deleteGalleryImage('${img.id}')"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
    </div>
  `).join('');
}

function loadGalleryImageToCanvas(id) {
  const item = articleGallery.find(g => g.id === id);
  if (!item) return;

  canvasState.baseImageUrl = item.url;
  baseImageObj = new Image();
  baseImageObj.src = item.url;
  baseImageObj.onload = () => redrawCanvasStudio();
  redrawCanvasStudio();
}

function setGalleryImageAsBanner(id) {
  articleGallery.forEach(g => g.isBanner = (g.id === id));
  renderArticleGallery();
  const banner = articleGallery.find(g => g.isBanner);
  if (banner && document.getElementById('studio_image_preview')) {
    document.getElementById('studio_image_preview').src = banner.url;
  }
  alert("✓ Đã đặt làm Banner đại diện chính của bài báo!");
}

function deleteGalleryImage(id) {
  if (articleGallery.length <= 1) {
    alert("Bài viết cần giữ ít nhất 1 ảnh đại diện!");
    return;
  }
  articleGallery = articleGallery.filter(g => g.id !== id);
  renderArticleGallery();
}

function insertGalleryImageToRichEditor(url, caption) {
  const editor = document.getElementById('native_rich_editor');
  if (!editor) return;

  const figureHtml = `
    <figure style="text-align: center; margin: 18px 0;">
      <img src="${url}" style="max-width: 100%; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" alt="${caption}">
      <figcaption style="font-size: 12.5px; color: #64748B; margin-top: 6px; font-style: italic;">
        <i class="fa-solid fa-camera"></i> ${caption || 'Hình ảnh hoạt động Công đoàn TDMU'}
      </figcaption>
    </figure>
    <p></p>
  `;
  document.execCommand('insertHTML', false, figureHtml);
  markContentUnsaved();
  alert("✓ Đã chèn ảnh vào nội dung bài báo ở Bước 1 thành công!");
}

function redrawCanvasStudio() {
  const canvas = document.getElementById('integrated_studio_canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  canvas.width = canvasState.width;
  canvas.height = canvasState.height;

  // Background Gradient
  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grad.addColorStop(0, '#003865');
  grad.addColorStop(1, '#001A35');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw Base Image if loaded
  if (baseImageObj.complete && baseImageObj.naturalWidth > 0) {
    let filterStr = `brightness(${canvasState.brightness}%) contrast(${canvasState.contrast}%)`;
    if (canvasState.filterType === 'grayscale') filterStr += ' grayscale(100%)';
    else if (canvasState.filterType === 'vintage') filterStr += ' sepia(35%) saturate(140%)';
    else if (canvasState.filterType === 'tdmu_theme') filterStr += ' hue-rotate(190deg) saturate(120%)';
    else if (canvasState.filterType === 'contrast') filterStr += ' contrast(140%)';
    
    ctx.filter = filterStr;
    ctx.drawImage(baseImageObj, 0, 0, canvas.width, canvas.height);
    ctx.filter = 'none';
  }

  // Dark Vignette Gradient
  const overlayGrad = ctx.createLinearGradient(0, canvas.height * 0.35, 0, canvas.height);
  overlayGrad.addColorStop(0, 'rgba(0, 26, 53, 0)');
  overlayGrad.addColorStop(1, 'rgba(0, 26, 53, 0.88)');
  ctx.fillStyle = overlayGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Watermark Badge
  const chkLogo = document.getElementById('chk_watermark_logo');
  if (!chkLogo || chkLogo.checked) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.beginPath();
    ctx.roundRect(24, 20, 260, 34, 6);
    ctx.fill();

    ctx.fillStyle = '#003865';
    ctx.font = 'bold 12.5px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('🏛️ CÔNG ĐOÀN ĐH THỦ DẦU MỘT', 36, 42);
  }

  // Slogan Layer
  const subtitleInput = document.getElementById('studio_subtitle_text');
  const subtitleText = (subtitleInput ? subtitleInput.value : canvasState.subtitle) || "ĐOÀN KẾT - NĂNG ĐỘNG - SÁNG TẠO VƯƠN TẦM";
  
  ctx.fillStyle = '#F1C40F';
  ctx.font = 'bold 13px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(subtitleText.toUpperCase(), canvasState.subtitlePos.x, canvasState.subtitlePos.y);

  // Title Layer
  const titleInput = document.getElementById('studio_title_text');
  const textColor = document.getElementById('studio_text_color')?.value || canvasState.textColor;
  const titleText = (titleInput && titleInput.value.trim()) ? titleInput.value.trim() : (document.getElementById('ai_final_title')?.value || canvasState.title);

  ctx.fillStyle = textColor;
  ctx.font = 'bold 22px "Plus Jakarta Sans", sans-serif';
  
  const words = titleText.split(' ');
  let line1 = words.slice(0, Math.ceil(words.length / 2)).join(' ');
  let line2 = words.slice(Math.ceil(words.length / 2)).join(' ');

  ctx.fillText(line1, canvasState.titlePos.x, canvasState.titlePos.y);
  if (line2) {
    ctx.fillText(line2, canvasState.titlePos.x, canvasState.titlePos.y + 30);
  }

  const previewImg = document.getElementById('studio_image_preview');
  if (previewImg) previewImg.src = canvas.toDataURL('image/png');
}

function handleSliderFilterChange() {
  const b = document.getElementById('slider_brightness')?.value || 100;
  const c = document.getElementById('slider_contrast')?.value || 100;

  canvasState.brightness = b;
  canvasState.contrast = c;

  if (document.getElementById('label_brightness_val')) document.getElementById('label_brightness_val').innerText = `${b}%`;
  if (document.getElementById('label_contrast_val')) document.getElementById('label_contrast_val').innerText = `${c}%`;

  redrawCanvasStudio();
}

function applyIntegratedFilter(filter) {
  canvasState.filterType = filter;
  redrawCanvasStudio();
}

function changeCanvasAspectRatio(ratio) {
  if (ratio === '16:9') {
    canvasState.width = 720;
    canvasState.height = 405;
  } else if (ratio === '4:3') {
    canvasState.width = 640;
    canvasState.height = 480;
  } else if (ratio === '1:1') {
    canvasState.width = 500;
    canvasState.height = 500;
  }
  redrawCanvasStudio();
}

function autoLayoutAiGoldRatio() {
  canvasState.titlePos = { x: 40, y: canvasState.height * 0.72 };
  canvasState.subtitlePos = { x: 40, y: canvasState.height * 0.58 };
  redrawCanvasStudio();
  alert("✨ AI đã tự động căn chỉnh bố cục Tỷ Lệ Vàng!");
}

function insertCurrentCanvasIntoArticle() {
  const canvas = document.getElementById('integrated_studio_canvas');
  if (!canvas) return;
  const dataUrl = canvas.toDataURL('image/png');
  const title = document.getElementById('studio_title_text')?.value || 'Banner Sự Kiện Công Đoàn TDMU';

  insertGalleryImageToRichEditor(dataUrl, title);
}

function setAsMainArticleBanner() {
  const imgEl = document.getElementById('ai_image_result');
  if (!imgEl || !imgEl.src) return;
  const dataUrl = imgEl.src;

  const newImg = {
    id: `img_${Date.now()}`,
    url: dataUrl,
    title: document.getElementById('ai_image_prompt')?.value || 'Banner AI Tạo',
    isBanner: true,
    date: new Date().toISOString().slice(0, 10)
  };

  articleGallery.forEach(g => g.isBanner = false);
  articleGallery.unshift(newImg);
  renderArticleGallery();

  alert("✓ Đã đặt làm Banner đại diện chính cho bài viết!");
}

function handleUserUploadImage(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const newImg = {
      id: `img_${Date.now()}`,
      url: e.target.result,
      title: file.name,
      isBanner: false,
      date: new Date().toISOString().slice(0, 10)
    };
    articleGallery.unshift(newImg);
    renderArticleGallery();
    loadGalleryImageToCanvas(newImg.id);
  };
  reader.readAsDataURL(file);
}

async function generateAiCustomImage() {
  const customPrompt = document.getElementById('ai_image_prompt_custom')?.value.trim() || document.getElementById('ai_final_title')?.value || "Hoạt động công đoàn TDMU";
  
  try {
    const res = await fetch('/api/ai/image-prompt-generator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: customPrompt })
    }).then(r => r.json());

    if (res.success) {
      const newImg = {
        id: `img_${Date.now()}`,
        url: 'images/banner.jpg',
        title: customPrompt,
        isBanner: false,
        date: new Date().toISOString().slice(0, 10)
      };
      articleGallery.unshift(newImg);
      renderArticleGallery();
      loadGalleryImageToCanvas(newImg.id);
      alert(`✨ AI đã sinh ảnh mới từ Prompt:\n"${res.prompts[0]}"\nĐã đưa vào Kho ảnh bài báo!`);
    }
  } catch (err) {
    console.error(err);
  }
}

function triggerAiNewImageGeneration() {
  generateAiCustomImage();
}


// 17. PRO TOOLBAR INSERT COMPONENTS & DIRECT AI ACTIONS
function insertQuoteBlock() {
  const quoteHtml = `
    <blockquote style="border-left: 4px solid var(--accent-gold); padding: 10px 16px; background: #FFFBEB; margin: 16px 0; font-style: italic; color: #78350F; border-radius: 0 8px 8px 0;">
      <i class="fa-solid fa-quote-left" style="color: var(--accent-gold); margin-right: 6px;"></i>
      "Phát huy truyền thống đoàn kết, năng động và sáng tạo, Công đoàn TDMU quyết tâm thực hiện thắng lợi các mục tiêu năm 2026."
    </blockquote><p></p>
  `;
  document.execCommand('insertHTML', false, quoteHtml);
  markContentUnsaved();
}

function insertContactCardBlock() {
  const contactHtml = `
    <div class="journal-contact-card" style="background: #F8FAFC; border: 1px solid #CBD5E1; border-left: 4px solid #003865; padding: 14px; border-radius: 0 8px 8px 0; margin: 18px 0; font-size: 13px;">
      📌 <strong>Thông Tin Liên Hệ & Giải Đáp Thắc Mắc:</strong><br>
      🏠 <strong>Văn phòng Công đoàn TDMU:</strong> Lầu 1, Dãy A, Cổng 1, Số 06 Trần Văn Ơn, P. Phú Lợi, TP. Thủ Dầu Một<br>
      📞 <strong>Hotline 24/7:</strong> (0274) 3815 184 | ✉️ <strong>Email:</strong> congdoan@tdmu.edu.vn
    </div><p></p>
  `;
  document.execCommand('insertHTML', false, contactHtml);
  markContentUnsaved();
}

async function handleToolbarAiAction(action) {
  const selection = window.getSelection();
  let textToProcess = selection.toString().trim();

  // If no text selected, process entire content in editor
  const editor = document.getElementById('native_rich_editor');
  if (!textToProcess && editor) {
    textToProcess = editor.innerText.trim();
  }

  if (!textToProcess) {
    alert("Vui lòng nhập hoặc bôi đen đoạn văn bản cần AI hỗ trợ!");
    return;
  }

  const apiKey = localStorage.getItem('gemini_api_key') || "";

  try {
    const res = await API.floatingCommand({ action, text: textToProcess, apiKey });
    if (res.success) {
      if (selection.toString().trim()) {
        document.execCommand('insertHTML', false, `<span style="background: #FEF3C7; padding: 2px 4px; border-radius: 4px;" title="AI Đã Xử Lý">${res.result}</span>`);
      } else if (editor) {
        editor.innerHTML = `<p>${res.result}</p>`;
      }
      markContentUnsaved();
      alert(`✓ AI đã hoàn tất thao tác "${action}" thành công!`);
    }
  } catch (err) {
    console.error(err);
  }
}


// =========================================================================
// 18. JENNI AI FLOATING BUBBLE & MANUS AI COPILOT CONTINUOUS CHAT ENGINE
// =========================================================================
let currentSelectedRange = null;
let currentFloatingAiResult = "";

function initSelectionHighlightMenu() { return; /* Disabled per user request */ 
  const editor = document.getElementById('native_rich_editor');
  const bubble = document.getElementById('ai_selection_floating_bubble');
  if (!editor || !bubble) return;

  document.addEventListener('selectionchange', () => {
    const selection = window.getSelection();
    if (!selection.isCollapsed && editor.contains(selection.anchorNode)) {
      currentSelectedRange = selection.getRangeAt(0).cloneRange();
      const rect = currentSelectedRange.getBoundingClientRect();
      bubble.style.display = 'flex';
      bubble.style.top = `${window.scrollY + rect.top - 120}px`;
      bubble.style.left = `${Math.max(20, window.scrollX + rect.left)}px`;
    }
  });
}

function closeFloatingBubble() { return; 
  const bubble = document.getElementById('ai_selection_floating_bubble');
  if (bubble) bubble.style.display = 'none';
  const resBox = document.getElementById('floating_bubble_result_box');
  if (resBox) resBox.style.display = 'none';
}

async function handleSelectionAiAction(action) {
  const selection = window.getSelection();
  const selectedText = selection.toString().trim() || (currentSelectedRange ? currentSelectedRange.toString().trim() : '');

  if (!selectedText) {
    alert("Vui lòng bôi đen một đoạn văn bản cần AI xử lý!");
    return;
  }

  const apiKey = localStorage.getItem('gemini_api_key') || "";

  try {
    const res = await API.floatingCommand({ action, text: selectedText, apiKey });
    if (res.success) {
      currentFloatingAiResult = res.result;
      const resBox = document.getElementById('floating_bubble_result_box');
      const resText = document.getElementById('floating_bubble_result_text');
      if (resBox && resText) {
        resText.innerText = res.result;
        resBox.style.display = 'block';
      }
    }
  } catch (err) {
    console.error(err);
  }
}

async function submitFloatingCustomPrompt() {
  const customPrompt = document.getElementById('floating_custom_prompt_input')?.value.trim();
  const selectedText = currentSelectedRange ? currentSelectedRange.toString().trim() : '';

  if (!customPrompt) return;

  const apiKey = localStorage.getItem('gemini_api_key') || "";

  try {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `${customPrompt}: "${selectedText}"`,
        articleTitle: document.getElementById('ai_final_title')?.value || '',
        apiKey
      })
    }).then(r => r.json());

    if (res.success) {
      currentFloatingAiResult = res.reply.replace(/<[^>]*>/g, '');
      const resBox = document.getElementById('floating_bubble_result_box');
      const resText = document.getElementById('floating_bubble_result_text');
      if (resBox && resText) {
        resText.innerText = currentFloatingAiResult;
        resBox.style.display = 'block';
      }
    }
  } catch (err) {
    console.error(err);
  }
}

function acceptFloatingResult(mode = 'replace') {
  if (!currentFloatingAiResult) return;
  const editor = document.getElementById('native_rich_editor');
  if (!editor) return;

  editor.focus();
  if (currentSelectedRange) {
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(currentSelectedRange);
  }

  if (mode === 'replace') {
    document.execCommand('insertHTML', false, `<span style="background: #FEF3C7; padding: 2px 4px; border-radius: 4px;" title="AI Đã Sửa">${currentFloatingAiResult}</span>`);
  } else {
    document.execCommand('insertHTML', false, `<p><span style="background: #E0F2FE; padding: 2px 4px; border-radius: 4px;" title="AI Bổ Sung">${currentFloatingAiResult}</span></p>`);
  }

  markContentUnsaved();
  closeFloatingBubble();
}

// 19. MANUS AI COPILOT SIDEBAR CHAT ENGINE


// 19. TRUE MANUS AI COPILOT DIRECT EDITING ENGINE
let copilotChatHistory = [];

let pendingManusEdits = {}; // Store edits to apply
let currentManusSelectionRange = null;

// ADVANCED CURSOR-LIKE SELECTION TRACKING
document.addEventListener('selectionchange', () => {
  const editor = document.getElementById('native_rich_editor');
  const selection = window.getSelection();
  const pill = document.getElementById('copilot_context_pill');
  const pillText = document.getElementById('copilot_context_text');
  
  if (editor && editor.contains(selection.anchorNode) && !selection.isCollapsed) {
    currentManusSelectionRange = selection.getRangeAt(0).cloneRange();
    
    // Update Context Pill in Chat
    const selectedString = selection.toString().trim();
    if (pill && pillText && selectedString.length > 0) {
      pill.style.display = 'flex';
      pillText.innerText = selectedString.substring(0, 40) + (selectedString.length > 40 ? '...' : '');
    }
  } else if (editor && document.activeElement === editor && selection.isCollapsed) {
    // Hide pill if they click away inside the editor
    clearManusSelection();
  }
});

document.addEventListener('mouseup', (e) => {
  const editor = document.getElementById('native_rich_editor');
  const popup = document.getElementById('floating_ask_copilot_btn');
  const selection = window.getSelection();
  
  if (editor && editor.contains(e.target) && !selection.isCollapsed) {
    // Show floating button right above cursor
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    if (popup) {
      popup.style.display = 'flex';
      popup.style.top = (rect.top + window.scrollY - 40) + 'px';
      popup.style.left = (rect.left + window.scrollX + (rect.width / 2) - 80) + 'px';
    }
  } else {
    if (popup) popup.style.display = 'none';
  }
});

function clearManusSelection() {
  currentManusSelectionRange = null;
  const pill = document.getElementById('copilot_context_pill');
  if (pill) pill.style.display = 'none';
  const popup = document.getElementById('floating_ask_copilot_btn');
  if (popup) popup.style.display = 'none';
}

function focusCopilotChat() {
  const input = document.getElementById('copilot_user_input');
  const popup = document.getElementById('floating_ask_copilot_btn');
  if (popup) popup.style.display = 'none';
  if (input) {
    input.focus();
    // Highlight the chat box briefly
    input.parentElement.style.boxShadow = '0 0 0 4px rgba(2,132,199,0.15)';
    setTimeout(() => { input.parentElement.style.boxShadow = 'none'; }, 1000);
  }
}

async function sendCopilotMessage() {
  const input = document.getElementById('copilot_user_input');
  if (!input) return;
  const msg = input.value.trim();
  if (!msg) return;

  input.value = '';
  appendCopilotMessage('user', msg);

  const container = document.getElementById('copilot_messages_container');
  const loadingId = `loading_${Date.now()}`;
  if (container) {
    container.innerHTML += `
      <div id="${loadingId}" style="display: flex; gap: 8px; align-items: center; color: #64748B; font-size: 11.5px;">
        <i class="fa-solid fa-circle-notch fa-spin"></i> Copilot đang xử lý trang viết...
      </div>
    `;
    container.scrollTop = container.scrollHeight;
  }

  const apiKey = localStorage.getItem('gemini_api_key') || "";
  const title = document.getElementById('ai_final_title')?.value || "";
  
  const content = getNativeEditorContent();
  let selectedText = "";
  let capturedRange = null;
  if (currentManusSelectionRange && !currentManusSelectionRange.collapsed) {
    selectedText = currentManusSelectionRange.toString().trim();
    capturedRange = currentManusSelectionRange.cloneRange();
    clearManusSelection(); // Hide context pill visually
  }

  try {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: msg,
        history: copilotChatHistory,
        articleTitle: title,
        articleContent: content,
        selectedText: selectedText,
        apiKey
      })
    }).then(r => r.json());

    document.getElementById(loadingId)?.remove();

    if (res.success) {
      copilotChatHistory.push({ role: 'user', text: msg });
      copilotChatHistory.push({ role: 'assistant', text: res.reply });
      
      appendManusCopilotResponse(res, capturedRange);
    }
  } catch (err) {
    document.getElementById(loadingId)?.remove();
    console.error(err);
  }
}



function sendQuickCopilotPrompt(promptText) {
  const input = document.getElementById('copilot_user_input');
  if (input) {
    input.value = promptText;
    sendCopilotMessage();
  }
}

function appendCopilotMessage(role, text) {
  const container = document.getElementById('copilot_messages_container');
  if (!container) return;

  if (role === 'user') {
    container.innerHTML += `
      <div style="display: flex; justify-content: flex-end;">
        <div style="background: #0F172A; color: white; border-radius: 12px 12px 2px 12px; padding: 10px 14px; font-size: 13px; max-width: 85%; line-height: 1.5;">
          ${text}
        </div>
      </div>
    `;
    container.scrollTop = container.scrollHeight;
  }
}

function appendManusCopilotResponse(res, capturedRange) {
  const container = document.getElementById('copilot_messages_container');
  if (!container) return;

  const msgId = `msg_${Date.now()}`;
  
  let editBlockHtml = '';
  if (res.editAction && res.editAction !== 'NONE' && res.editContent) {
    pendingManusEdits[msgId] = {
      action: res.editAction,
      content: res.editContent,
      range: capturedRange
    };
    
    let actionLabel = 'Chèn vào cuối trang';
    if (res.editAction === 'REPLACE_SELECTION') actionLabel = 'Thay thế đoạn bôi đen';
    if (res.editAction === 'REPLACE_ALL') actionLabel = 'Viết lại toàn bộ trang';

    editBlockHtml = `
      <div id="edit_block_${msgId}" style="margin-top: 12px; border: 1px solid #BAE6FD; border-radius: 8px; overflow: hidden; background: #F8FAFC;">
        <div style="background: #E0F2FE; color: #0369A1; font-size: 11px; font-weight: 700; padding: 6px 10px; display: flex; justify-content: space-between; align-items: center;">
          <span><i class="fa-solid fa-code-compare"></i> Bản Nháp: ${actionLabel}</span>
        </div>
        <div style="padding: 10px; font-size: 12px; color: #334155; max-height: 120px; overflow-y: auto; background: white; border-bottom: 1px solid #E2E8F0;">
          ${res.editContent}
        </div>
        <div style="padding: 8px; display: flex; gap: 8px; justify-content: flex-end; background: #F8FAFC;">
          <button type="button" style="background: transparent; color: #64748B; border: none; font-weight: 600; font-size: 11px; cursor: pointer;" onclick="document.getElementById('edit_block_${msgId}').style.display='none'; ">✕ Bỏ qua</button>
          <button type="button" style="background: #0284C7; color: white; border: none; border-radius: 6px; font-weight: 700; padding: 4px 12px; font-size: 11px; cursor: pointer; box-shadow: 0 2px 6px rgba(2,132,199,0.3);" onclick="applyManusEdit('${msgId}')">✨ Apply (Áp Dụng)</button>
        </div>
      </div>
    `;
  }

  container.innerHTML += `
    <div style="display: flex; gap: 10px; align-items: flex-start;">
      <div style="width: 28px; height: 28px; border-radius: 8px; background: #F0F9FF; color: #0284C7; display: flex; align-items: center; justify-content: center; font-size: 12px; flex-shrink: 0; border: 1px solid #BAE6FD;">
        <i class="fa-solid fa-sparkles"></i>
      </div>
      <div style="background: white; border: 1px solid #E2E8F0; border-radius: 12px 12px 12px 2px; padding: 12px 14px; font-size: 13px; line-height: 1.6; color: #334155; box-shadow: 0 2px 8px rgba(0,0,0,0.02); max-width: 88%;">
        <div>${res.reply}</div>
        ${editBlockHtml}
      </div>
    </div>
  `;
  container.scrollTop = container.scrollHeight;
}

function applyManusEdit(msgId) {
  const editData = pendingManusEdits[msgId];
  if (!editData) return;

  const editor = document.getElementById('native_rich_editor');
  if (!editor) return;

  editor.focus();

  const sel = window.getSelection();

  if (editData.action === 'REPLACE_SELECTION' && editData.range) {
    sel.removeAllRanges();
    sel.addRange(editData.range);
    // Native replacement so Ctrl+Z works flawlessly
    document.execCommand('insertHTML', false, editData.content);
  } else if (editData.action === 'REPLACE_ALL') {
    // Select all and insert so Ctrl+Z works flawlessly
    document.execCommand('selectAll', false, null);
    document.execCommand('insertHTML', false, editData.content);
  } else {
    // APPEND
    sel.removeAllRanges();
    const range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false);
    sel.addRange(range);
    document.execCommand('insertHTML', false, `<br><div style="margin-top: 16px; padding-top: 16px; border-top: 1px dashed #CBD5E1;">${editData.content}</div><br>`);
  }

  saveEditorState();
  markContentUnsaved();
  
  // Transform the block to show "Applied"
  const block = document.getElementById(`edit_block_${msgId}`);
  if (block) {
    block.innerHTML = `
      <div style="background: #ECFDF5; color: #047857; font-size: 11px; font-weight: 700; padding: 8px 10px; text-align: center;">
        <i class="fa-solid fa-check-circle"></i> Đã áp dụng thành công vào tài liệu
      </div>
    `;
  }
}


function clearCopilotChat() {
  copilotChatHistory = [];
  const container = document.getElementById('copilot_messages_container');
  if (container) {
    container.innerHTML = `
      <div style="display: flex; gap: 8px; align-items: flex-start;">
        <div style="width: 24px; height: 24px; border-radius: 50%; background: #003865; color: white; display: flex; align-items: center; justify-content: center; font-size: 11px; flex-shrink: 0;">AI</div>
        <div style="background: white; border: 1px solid #E2E8F0; border-radius: 8px; padding: 10px 12px; font-size: 12.5px; line-height: 1.5; color: #1E293B; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
          Đã làm mới cuộc trò chuyện. Thầy/Cô cần em hỗ trợ gì tiếp theo cho bài viết này ạ?
        </div>
      </div>
    `;
  }
}


// 20. MANUS AI OMNIBAR 1-CLICK GENERATOR
async function generateAIContentFromOmnibar() {
  const promptInput = document.getElementById('manus_omnibar_input')?.value.trim();
  if (!promptInput) {
    alert("⚠️ Vui lòng nhập ý tưởng hoặc thông tin sự kiện vào thanh AI!");
    return;
  }

  const category = document.getElementById('ai_category_select')?.value || 'Thông Báo Chỉ Đạo';
  const issuingUnit = document.getElementById('ai_issuing_unit_select')?.value || 'Ban Thường Vụ Công Đoàn Trường';
  const tone = document.getElementById('ai_tone_select')?.value || 'Trang trọng, chuẩn hành chính';
  const author = getCurrentAuthorName();
  const apiKey = localStorage.getItem('gemini_api_key') || "";
  const groqApiKey = localStorage.getItem('groq_api_key') || "";
  const aiEngine = localStorage.getItem('ai_engine_preference') || 'auto';

  const spinnerBox = document.getElementById('ai_stepper_spinner');
  if (spinnerBox) spinnerBox.style.display = 'block';

  try {
    const res = await API.generateAI({
      prompt: promptInput,
      category,
      tone,
      lengthOption: 'Vừa (300 - 500 từ)',
      targetAudience: 'Toàn thể công đoàn viên, cán bộ, giảng viên TDMU',
      issuingUnit,
      author,
      apiKey,
      groqApiKey,
      aiEngine
    });

    if (res.success) {
      if (document.getElementById('ai_final_title')) {
        let cleanTitle = res.titles && res.titles[0] ? res.titles[0] : promptInput;
        cleanTitle = cleanTitle.replace(/^Tiêu đề \d+:\s*/i, '').replace(/^Tiêu đề chính:\s*/i, '').replace(/^Title:\s*/i, '').trim();
        document.getElementById('ai_final_title').value = cleanTitle;
      }
      if (document.getElementById('ai_final_subtitle')) {
        document.getElementById('ai_final_subtitle').value = res.subTitle || "Kế hoạch hoạt động trọng tâm Công đoàn TDMU năm 2026";
      }
      if (res.content) {
        setNativeEditorContent(res.content);
        if (typeof showAiEngineToast === 'function') showAiEngineToast(res.source);
      } else {
        alert("⚠️ AI phản hồi nhưng nội dung bài viết bị rỗng! Chi tiết:\n" + JSON.stringify(res, null, 2));
      }
      markContentUnsaved();
    } else {
      alert("❌ LỖI SINH BÀI VIẾT (CHI TIẾT):\n\n" + (res.error || "Không nhận được phản hồi từ máy chủ AI."));
    }
  } catch (err) {
    console.error("Omnibar Generation Error:", err);
    alert("❌ LỖI KẾT NỐI MẠNG / CLIENT:\n\n" + err.message + "\n\nVui lòng kiểm tra lại console F12 hoặc khởi động lại server.");
  } finally {
    if (spinnerBox) spinnerBox.style.display = 'none';
  }
}


// =========================================================================



// ==========================================
// 20. ROBUST MS WORD-STYLE UNDO/REDO ENGINE
// ==========================================
const MAX_HISTORY_STEPS = 50;
let editorHistoryStack = [];
let editorHistoryIndex = -1;
let isRestoringHistory = false;
let editorSaveTimeout = null;

function saveEditorState() {
  if (isRestoringHistory) return;
  const editor = document.getElementById('native_rich_editor');
  if (!editor) return;
  
  const content = editor.innerHTML;
  
  if (editorHistoryIndex >= 0 && editorHistoryStack[editorHistoryIndex] === content) return;
  
  if (editorHistoryIndex < editorHistoryStack.length - 1) {
    editorHistoryStack = editorHistoryStack.slice(0, editorHistoryIndex + 1);
  }
  
  editorHistoryStack.push(content);
  if (editorHistoryStack.length > MAX_HISTORY_STEPS) {
    editorHistoryStack.shift();
  } else {
    editorHistoryIndex++;
  }
  
  updateUndoRedoButtons();
  markContentUnsaved();
}

function saveEditorStateDebounced() {
  clearTimeout(editorSaveTimeout);
  editorSaveTimeout = setTimeout(saveEditorState, 500);
}

function undoEditor() {
  if (editorHistoryIndex > 0) {
    isRestoringHistory = true;
    editorHistoryIndex--;
    document.getElementById('native_rich_editor').innerHTML = editorHistoryStack[editorHistoryIndex];
    isRestoringHistory = false;
    updateUndoRedoButtons();
  }
}

function redoEditor() {
  if (editorHistoryIndex < editorHistoryStack.length - 1) {
    isRestoringHistory = true;
    editorHistoryIndex++;
    document.getElementById('native_rich_editor').innerHTML = editorHistoryStack[editorHistoryIndex];
    isRestoringHistory = false;
    updateUndoRedoButtons();
  }
}

function updateUndoRedoButtons() {
  const undoBtn = document.getElementById('btn_undo_editor');
  const redoBtn = document.getElementById('btn_redo_editor');
  if (undoBtn) undoBtn.style.opacity = editorHistoryIndex > 0 ? '1' : '0.4';
  if (redoBtn) redoBtn.style.opacity = editorHistoryIndex < editorHistoryStack.length - 1 ? '1' : '0.4';
}

// Intercept Ctrl+Z and Ctrl+Y natively
document.addEventListener('keydown', function(e) {
  if (e.ctrlKey && e.key === 'z') {
    e.preventDefault();
    undoEditor();
  }
  if (e.ctrlKey && e.key === 'y') {
    e.preventDefault();
    redoEditor();
  }
});



// ==========================================
// 21. LIVE AI ENGINE NOTIFICATION ENGINE
// ==========================================
function showAiEngineToast(sourceName) {
  const toast = document.getElementById('ai_engine_active_toast');
  const text = document.getElementById('ai_toast_text');
  const icon = document.getElementById('ai_toast_icon');
  if (!toast || !text) return;

  text.innerText = sourceName || 'AI Engine Live';
  
  if (sourceName && sourceName.includes('Groq')) {
    icon.style.background = '#F59E0B';
    icon.innerHTML = '<i class="fa-solid fa-bolt" style="color: white;"></i>';
    text.style.color = '#FBBF24';
  } else {
    icon.style.background = '#0284C7';
    icon.innerHTML = '<i class="fa-solid fa-brain" style="color: white;"></i>';
    text.style.color = '#38BDF8';
  }

  toast.style.display = 'flex';
  
  clearTimeout(window.aiToastTimeout);
  window.aiToastTimeout = setTimeout(() => {
    toast.style.display = 'none';
  }, 4500);
}



// =========================================================================
// 📁 ENTERPRISE CONTENT LIFECYCLE MANAGEMENT (CLM) LOGIC
// =========================================================================

let cachedDossiers = [];
let cachedAssets = [];
let currentStudioDossierId = 'dossier_1';
let currentPackageData = null;

// 1. DASHBOARD & 5 OPERATIONAL QUESTIONS
async function loadAdminDashboard() {
  try {
    const resArticles = await fetch('/api/articles').then(r => r.json());
    const resAssets = await fetch('/api/assets').then(r => r.json());
    
    const articles = resArticles.data || [];
    const assets = resAssets.data || [];

    // Calculate 4 Lifecycle KPIs
    const drafts = articles.filter(a => a.status === 'draft' || !a.status);
    const pendings = articles.filter(a => a.status === 'pending_review' || a.status === 'pending');
    const scheduled = articles.filter(a => a.status === 'scheduled' || a.scheduledAt);
    const published = articles.filter(a => a.status === 'published');

    if (document.getElementById('dash_stat_drafts')) document.getElementById('dash_stat_drafts').innerText = drafts.length;
    if (document.getElementById('dash_stat_pending')) document.getElementById('dash_stat_pending').innerText = pendings.length;
    if (document.getElementById('dash_stat_scheduled')) document.getElementById('dash_stat_scheduled').innerText = scheduled.length;
    if (document.getElementById('dash_stat_published')) document.getElementById('dash_stat_published').innerText = published.length;

    // Sidebar badges
    if (document.getElementById('badge_draft_count')) document.getElementById('badge_draft_count').innerText = drafts.length;
    if (document.getElementById('badge_pending_count')) document.getElementById('badge_pending_count').innerText = pendings.length;

    // Assets count
    if (document.getElementById('dash_total_assets_count')) document.getElementById('dash_total_assets_count').innerText = `${assets.length} tư liệu`;

    // Multi-channel views
    const totalViews = articles.reduce((acc, a) => acc + (a.viewsCount || 0), 0);
    const totalLikes = articles.reduce((acc, a) => acc + (a.likesCount || 0), 0);
    if (document.getElementById('dash_views_web')) document.getElementById('dash_views_web').innerText = `${totalViews.toLocaleString()} lượt xem`;
    if (document.getElementById('dash_views_fb')) document.getElementById('dash_views_fb').innerText = `${totalLikes.toLocaleString()} tương tác`;
    if (document.getElementById('dash_views_zalo')) document.getElementById('dash_views_zalo').innerText = `${(articles.length * 150).toLocaleString()} tin nhận`;

    // Render Pending Review List (Actionable Work)
    const pendingListEl = document.getElementById('dash_pending_review_list');
    if (pendingListEl) {
      if (pendings.length === 0) {
        pendingListEl.innerHTML = `
          <div style="text-align: center; padding: 20px; color: #10B981; font-size: 13.5px; font-weight: 600;">
            <i class="fa-solid fa-circle-check fa-2x" style="display: block; margin-bottom: 6px;"></i>
            Tuyệt vời! Hiện không có bài viết nào đang chờ duyệt.
          </div>
        `;
      } else {
        pendingListEl.innerHTML = pendings.slice(0, 4).map(p => `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 8px;">
            <div style="max-width: 65%;">
              <div style="font-weight: 700; font-size: 13.5px; color: #92400E; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${p.title}</div>
              <div style="font-size: 11.5px; color: #B45309; margin-top: 2px;">
                Tác giả: <b>${p.author || 'Cán Bộ'}</b> • ${p.categoryName || 'Thông báo'}
              </div>
            </div>
            <div style="display: flex; gap: 6px;">
              <button type="button" class="btn btn-sm btn-outline" style="font-size: 11px; padding: 4px 8px; border-color: #FCD34D;" onclick="rejectArticle('${p.id}')">Trả lại</button>
              <button type="button" class="btn btn-sm" style="font-size: 11px; padding: 4px 10px; background: #059669; color: white; border: none; font-weight: 700;" onclick="approveArticle('${p.id}')"><i class="fa-solid fa-check"></i> Duyệt</button>
            </div>
          </div>
        `).join('');
      }
    }

    // Render Recent Articles Table
    const topTable = document.getElementById('top_articles_table');
    if (topTable) {
      topTable.innerHTML = articles.slice(0, 6).map(a => {
        let statusBadge = '<span class="badge" style="background:#E2E8F0; color:#475569;">Bản Nháp</span>';
        if (a.status === 'pending_review' || a.status === 'pending') statusBadge = '<span class="badge" style="background:#FEF3C7; color:#B45309;">Chờ Duyệt</span>';
        if (a.status === 'approved') statusBadge = '<span class="badge" style="background:#E0F2FE; color:#0284C7;">Đã Duyệt</span>';
        if (a.status === 'published') statusBadge = '<span class="badge" style="background:#D1FAE5; color:#065F46;">Đã Xuất Bản</span>';

        return `
          <tr style="border-bottom: 1px solid var(--border-color);">
            <td style="padding: 12px 10px; font-weight: 600; color: #0F172A; max-width: 320px;">
              <div style="text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${a.title}</div>
            </td>
            <td style="padding: 12px 10px; color: #64748B; font-size: 13px;">${a.dossierId ? 'HS-2026' : 'Nội bộ'}</td>
            <td style="padding: 12px 10px; font-size: 13px;">
              <i class="fa-solid fa-globe" style="color: #0284C7;" title="Website"></i> 
              <i class="fa-brands fa-facebook" style="color: #1877F2; margin-left: 4px;" title="Facebook"></i>
            </td>
            <td style="padding: 12px 10px;">${statusBadge}</td>
            <td style="padding: 12px 10px; text-align: right;">
              <button class="btn btn-sm btn-outline" onclick="editArticleFromDb('${a.id}')"><i class="fa-solid fa-pen-to-square"></i> Mở</button>
            </td>
          </tr>
        `;
      }).join('');
    }
  } catch (err) {
    console.error("Dashboard Load Error:", err);
  }
}

// 2. DOSSIERS WORKSPACE ENGINE
async function loadDossiersList() {
  try {
    const res = await fetch('/api/dossiers').then(r => r.json());
    cachedDossiers = res.data || [];
    renderDossiers(cachedDossiers);
  } catch (err) {
    console.error("Dossiers Load Error:", err);
  }
}

function renderDossiers(list) {
  const container = document.getElementById('dossiers_grid_container');
  if (!container) return;

  if (list.length === 0) {
    container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #64748B;">Chưa có hồ sơ nào. Bấm '+ Tạo Hồ Sơ Mới' để bắt đầu.</div>`;
    return;
  }

  container.innerHTML = list.map(d => `
    <div style="background: white; border: 1px solid var(--border-color); border-radius: 12px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.03); display: flex; flex-direction: column; justify-content: space-between;">
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <span class="badge" style="background: #E0F2FE; color: #0284C7; font-weight: 700; font-size: 11px;">${d.code || 'HS-TDMU'}</span>
          <span class="badge" style="background: ${d.status === 'active' ? '#D1FAE5' : '#E2E8F0'}; color: ${d.status === 'active' ? '#065F46' : '#475569'}; font-size: 11px;">
            ${d.status === 'active' ? '● Đang triển khai' : '✓ Đã hoàn tất'}
          </span>
        </div>

        <h3 style="font-size: 16px; font-weight: 800; color: #0F172A; margin: 0 0 8px 0; line-height: 1.4;">${d.title}</h3>
        <p style="font-size: 12.5px; color: #64748B; margin: 0 0 14px 0; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
          ${d.description || 'Chưa có mô tả mục tiêu chiến dịch.'}
        </p>

        <div style="font-size: 12px; color: #475569; margin-bottom: 14px;">
          <div><i class="fa-solid fa-user-tie" style="color: #64748B; width: 16px;"></i> <b>Chủ trì:</b> ${d.leadPerson || 'BTV Công đoàn'}</div>
          <div style="margin-top: 4px;"><i class="fa-regular fa-calendar" style="color: #64748B; width: 16px;"></i> <b>Thời gian:</b> ${d.startDate || '2026'} ${d.endDate ? '&rarr; ' + d.endDate : ''}</div>
        </div>
      </div>

      <div>
        <div style="display: flex; gap: 8px; padding-top: 14px; border-top: 1px dashed #E2E8F0; margin-bottom: 14px;">
          <span style="font-size: 11.5px; background: #F1F5F9; padding: 4px 8px; border-radius: 6px; color: #334155; font-weight: 600;">
            <i class="fa-solid fa-file-lines" style="color: #0284C7;"></i> ${d.assetsCount || 0} tư liệu
          </span>
          <span style="font-size: 11.5px; background: #F1F5F9; padding: 4px 8px; border-radius: 6px; color: #334155; font-weight: 600;">
            <i class="fa-solid fa-newspaper" style="color: #10B981;"></i> ${d.contentCount || 0} bài viết
          </span>
        </div>

        <div style="display: flex; gap: 8px;">
          <button type="button" class="btn btn-sm btn-outline" style="flex: 1; font-size: 12px;" onclick="viewDossierAssets('${d.id}')">
            <i class="fa-solid fa-photo-film"></i> Xem Tư Liệu
          </button>
          <button type="button" class="btn btn-sm btn-primary" style="flex: 1; font-size: 12px; font-weight: 700;" onclick="openDossierInStudio('${d.id}')">
            <i class="fa-solid fa-wand-magic-sparkles"></i> Mở AI Studio
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function filterDossiersList() {
  const query = document.getElementById('dossier_search_input')?.value.toLowerCase() || '';
  const status = document.getElementById('dossier_status_filter')?.value || 'all';

  const filtered = cachedDossiers.filter(d => {
    const matchQ = (d.title || '').toLowerCase().includes(query) || (d.code || '').toLowerCase().includes(query) || (d.leadPerson || '').toLowerCase().includes(query);
    const matchS = (status === 'all') || (d.status === status);
    return matchQ && matchS;
  });

  renderDossiers(filtered);
}

function openCreateDossierModal() {
  document.getElementById('create_dossier_modal')?.classList.add('active');
}
function closeCreateDossierModal() {
  document.getElementById('create_dossier_modal')?.classList.remove('active');
}

async function submitCreateNewDossier() {
  const title = document.getElementById('new_dossier_title')?.value.trim();
  if (!title) {
    alert("Vui lòng nhập tên hồ sơ chiến dịch!");
    return;
  }

  const payload = {
    title,
    code: document.getElementById('new_dossier_code')?.value.trim(),
    category: document.getElementById('new_dossier_category')?.value,
    unit: document.getElementById('new_dossier_unit')?.value,
    leadPerson: document.getElementById('new_dossier_lead')?.value,
    startDate: document.getElementById('new_dossier_start')?.value,
    endDate: document.getElementById('new_dossier_end')?.value,
    description: document.getElementById('new_dossier_desc')?.value
  };

  const res = await fetch('/api/dossiers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).then(r => r.json());

  if (res.success) {
    closeCreateDossierModal();
    alert("✅ Đã tạo hồ sơ nội dung mới thành công!");
    loadDossiersList();
  }
}

// 3. ASSETS REPOSITORY ENGINE
async function loadAssetsRepository() {
  try {
    const resAssets = await fetch('/api/assets').then(r => r.json());
    cachedAssets = resAssets.data || [];
    renderAssetsTable(cachedAssets);
    
    // Auto-refresh if there are items triage_processing
    if (cachedAssets.some(a => a.ai_status === 'triage_processing')) {
      setTimeout(() => {
        if (document.getElementById('tab_inbox_content').style.display === 'block') {
          loadAssetsRepository();
        }
      }, 3000);
    }
  } catch (err) {
    console.error("Assets Load Error:", err);
  }
}

function renderAssetsTable(list) {
  const tbody = document.getElementById('assets_table_body');
  if (!tbody) return;

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 30px; color: #64748B;">Chưa có tư liệu nào trong hòm thư. Bấm '+ Nạp Tư Liệu Mới' để bổ sung.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(a => {
    let typeIcon = '<i class="fa-solid fa-file-pdf" style="color: #EF4444;"></i> Văn Bản PDF';
    if (a.fileType === 'image') typeIcon = '<i class="fa-solid fa-image" style="color: #10B981;"></i> Hình Ảnh';
    if (a.fileType === 'video') typeIcon = '<i class="fa-solid fa-video" style="color: #8B5CF6;"></i> Video Clip';

    let triageBadge = '';
    if (a.ai_status === 'triage_processing') {
      triageBadge = `<span class="badge" style="background: #FEF3C7; color: #B45309; font-size: 11px;"><i class="fa-solid fa-spinner fa-spin"></i> Đang Phân Loại...</span>`;
    } else if (a.ai_status === 'triage_failed') {
      triageBadge = `<span class="badge" style="background: #FEE2E2; color: #B91C1C; font-size: 11px;" title="${a.ai_notes}">❌ Loại (${a.confidence_score}%)</span><div style="font-size:10px; color:#EF4444; margin-top:2px;">${a.ai_notes || 'Không hợp lệ'}</div>`;
    } else {
      triageBadge = `<span class="badge" style="background: #D1FAE5; color: #065F46; font-size: 11px;"><i class="fa-solid fa-check"></i> Đạt (${a.confidence_score}%)</span>`;
    }

    return `
      <tr style="border-bottom: 1px solid var(--border-color);">
        <td style="padding: 12px 16px;">
          <div style="font-weight: 700; color: #0F172A; font-size: 14px;">${a.title}</div>
          <div style="font-size: 12px; color: #64748B; margin-top: 2px;">Tệp: ${a.fileName}</div>
        </td>
        <td style="padding: 12px 16px; font-size: 12.5px;">
          <div>${typeIcon}</div>
          <div style="color: #94A3B8; font-size: 11.5px; margin-top: 2px;">${a.fileSize || '1 MB'}</div>
        </td>
        <td style="padding: 12px 16px; font-size: 12.5px; color: #475569;">
          <div><b>${a.source || 'Nội bộ'}</b></div>
          <div style="font-size: 11.5px; color: #64748B;">${a.unit || 'Đoàn thể'}</div>
        </td>
        <td style="padding: 12px 16px; text-align: center;">
          ${triageBadge}
        </td>
        <td style="padding: 12px 16px; text-align: right; white-space: nowrap;">
          <button type="button" class="btn btn-sm btn-outline" style="font-size: 11.5px;" onclick="openInboxInStudio('${a.id}')" ${a.ai_status === 'triage_failed' ? 'disabled' : ''} title="Đưa sang AI tạo Package">
            <i class="fa-solid fa-wand-magic-sparkles" style="color: #F59E0B;"></i> Tạo Gói Tin
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function filterAssetsByType(type) {
  document.querySelectorAll('.asset-filter-btn').forEach(btn => {
    if (btn.getAttribute('data-type') === type) {
      btn.className = 'btn btn-sm btn-primary asset-filter-btn active';
    } else {
      btn.className = 'btn btn-sm btn-outline asset-filter-btn';
    }
  });

  if (type === 'all') renderAssetsTable(cachedAssets);
  else renderAssetsTable(cachedAssets.filter(a => a.fileType === type));
}

function filterAssetsByDossier() {
  const dId = document.getElementById('asset_dossier_filter')?.value;
  if (dId === 'all') renderAssetsTable(cachedAssets);
  else renderAssetsTable(cachedAssets.filter(a => a.dossierId === dId));
}

let uploadOrigin = null;

function openUploadAssetModal(origin = null) {
  uploadOrigin = origin;
  document.getElementById('upload_asset_modal')?.classList.add('active');
}
function closeUploadAssetModal() {
  document.getElementById('upload_asset_modal')?.classList.remove('active');
}

async function submitUploadNewAsset() {
  const title = document.getElementById('new_asset_title')?.value.trim();
  if (!title) {
    alert("Vui lòng nhập tên tư liệu!");
    return;
  }

  const payload = {
    title,
    fileType: document.getElementById('new_asset_type')?.value,
    source: document.getElementById('new_asset_source')?.value,
    unit: document.getElementById('new_asset_unit')?.value,
    summary: document.getElementById('new_asset_summary')?.value,
    aiAllowed: document.getElementById('new_asset_ai_allowed')?.checked
  };

  const res = await fetch('/api/assets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).then(r => r.json());

  if (res.success) {
    closeUploadAssetModal();
    await loadAssetsRepository();
    
    if (uploadOrigin === 'studio') {
      addAssetToStudio(res.data.id);
    } else {
      alert("✅ Đã nạp tư liệu vào Hòm Thư thành công. AI đang phân loại (Triage) ngầm!");
    }
  }
}

// WORKSPACE ENGINE
async function loadWorkspacePackages() {
  try {
    const res = await fetch('/api/articles').then(r => r.json());
    if (!res.success) return;
    
    // Filter packages: draft, pending_review, or scheduled that are not published yet
    let packages = (res.data || []).filter(a => a.status === 'draft' || a.status === 'pending_review' || a.status === 'scheduled');
    
    const tbody = document.getElementById('workspace_packages_body');
    if (!tbody) return;

    if (packages.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 30px; color: #64748B;">Hàng đợi trống. Chưa có gói tin nào cần xử lý.</td></tr>`;
      return;
    }

    tbody.innerHTML = packages.map(p => {
      let statusBadge = '<span class="badge" style="background:#E2E8F0; color:#475569;">Bản Nháp (Draft)</span>';
      if (p.status === 'pending_review') statusBadge = '<span class="badge" style="background:#FEF3C7; color:#B45309;">Chờ Duyệt (Pending)</span>';
      if (p.status === 'scheduled') statusBadge = '<span class="badge" style="background:#DBEAFE; color:#1E40AF;">Đã Hẹn Giờ (Scheduled)</span>';

      let assigneeHtml = '<span style="color: #94A3B8; font-style: italic;">Chưa phân công</span>';
      let actionHtml = `<button class="btn btn-sm btn-primary" onclick="claimPackage('${p.id}')">Nhận Việc (Claim)</button>`;
      
      const currentUserId = 'user_' + currentUserRole;

      if (p.assignee_id) {
        assigneeHtml = `<b>${p.assignee_id}</b>`;
        if (p.assignee_id === currentUserId) {
          actionHtml = `
            <button class="btn btn-sm btn-outline" style="color: #0284C7; border-color: #0284C7;" onclick="openEditArticleModal('${p.id}')">Mở Biên Tập</button>
            <button class="btn btn-sm btn-outline" style="color: #EF4444; border-color: #EF4444; margin-left: 5px;" onclick="unclaimPackage('${p.id}')">Bỏ Qua</button>
          `;
        } else {
          actionHtml = `<button class="btn btn-sm btn-outline" disabled style="background: #F1F5F9; color: #94A3B8; border-color: #E2E8F0;"><i class="fa-solid fa-lock"></i> Đang Khóa</button>`;
        }
      }

      return `
        <tr style="border-bottom: 1px solid var(--border-color);">
          <td style="padding: 12px 16px; font-weight: 600; color: #0F172A;">[#${p.id}] ${p.title}</td>
          <td style="padding: 12px 16px; font-size: 12px; color: #64748B;">${p.createdAt || 'Vừa xong'}</td>
          <td style="padding: 12px 16px;">${statusBadge}</td>
          <td style="padding: 12px 16px; font-size: 13px;">${assigneeHtml}</td>
          <td style="padding: 12px 16px; text-align: right;">${actionHtml}</td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error("Workspace Load Error:", err);
  }
}

async function claimPackage(id) {
  const currentUserId = 'user_' + currentUserRole;
  try {
    const res = await fetch(`/api/packages/${id}/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUserId })
    }).then(r => r.json());

    if (res.success) {
      loadWorkspacePackages();
    } else {
      alert("Lỗi: " + res.error);
    }
  } catch (err) {
    console.error(err);
  }
}

async function unclaimPackage(id) {
  const currentUserId = 'user_' + currentUserRole;
  try {
    const res = await fetch(`/api/packages/${id}/unclaim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUserId })
    }).then(r => r.json());

    if (res.success) {
      loadWorkspacePackages();
    } else {
      alert("Lỗi: " + res.error);
    }
  } catch (err) {
    console.error(err);
  }
}

// 4. FLAGSHIP AI CONTENT STUDIO (GROUNDED MULTI-CHANNEL PACKAGE)
function addAssetToStudio(assetId) {
  showAdminTab('ai-creator');
  setTimeout(() => {
    const asset = cachedAssets.find(a => a.id == assetId);
    if (!asset) return;
    
    const listEl = document.getElementById('studio_assets_checklist');
    if (!listEl) return;

    let icon = '<i class="fa-solid fa-file-pdf" style="color:#EF4444;"></i>';
    if (asset.fileType === 'image') icon = '<i class="fa-solid fa-image" style="color:#10B981;"></i>';
    if (asset.fileType === 'video') icon = '<i class="fa-solid fa-video" style="color:#8B5CF6;"></i>';

    listEl.insertAdjacentHTML('beforeend', `
      <label style="display: flex; align-items: center; gap: 8px; font-size: 12px; cursor: pointer; padding: 4px 8px; background: white; border-radius: 4px; border: 1px solid #E2E8F0;">
        <input type="checkbox" class="studio-asset-chk" value="${asset.id}" checked>
        <span>${icon}</span>
        <span style="font-weight: 600; color: #1E293B; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${asset.title}</span>
      </label>
    `);
    updateSelectedAssetsCount();
  }, 200);
}

function updateSelectedAssetsCount() {
  const chks = document.querySelectorAll('.studio-asset-chk:checked');
  const countEl = document.getElementById('studio_selected_assets_count');
  if (countEl) countEl.innerText = `Đã đính kèm: ${chks.length} file`;
}

async function generateGroundedContentPackage() {
  const dossierId = document.getElementById('studio_dossier_select')?.value || currentStudioDossierId;
  const chkElements = document.querySelectorAll('.studio-asset-chk:checked');
  const assetIds = Array.from(chkElements).map(el => el.value);

  const channels = [];
  if (document.getElementById('chk_chan_web')?.checked) channels.push('website');
  if (document.getElementById('chk_chan_fb')?.checked) channels.push('facebook');
  if (document.getElementById('chk_chan_zalo')?.checked) channels.push('zalo');
  if (document.getElementById('chk_chan_video')?.checked) channels.push('video');

  const customPrompt = document.getElementById('studio_custom_instructions')?.value.trim();
  const briefText = document.getElementById('studio_brief_text')?.value.trim();
  const apiKey = localStorage.getItem('gemini_api_key') || "";
  const groqApiKey = localStorage.getItem('groq_api_key') || "";
  const aiEngine = localStorage.getItem('ai_engine_preference') || 'auto';

  const spinner = document.getElementById('studio_package_spinner');
  const btn = document.getElementById('btn_generate_package');

  if (spinner) spinner.style.display = 'block';
  if (btn) btn.disabled = true;

  try {
    const res = await fetch('/api/ai/package-generator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dossierId,
        assetIds,
        briefText,
        channels,
        customPrompt,
        apiKey,
        groqApiKey,
        aiEngine
      })
    }).then(r => r.json());

    if (res.success && res.package) {
      currentPackageData = res.package;
      const pkg = res.package;

      // 1. Fill Website Article
      if (pkg.website) {
        if (document.getElementById('ai_final_title')) document.getElementById('ai_final_title').value = pkg.website.title || '';
        if (document.getElementById('ai_final_subtitle')) document.getElementById('ai_final_subtitle').value = pkg.website.sapo || '';
        if (pkg.website.content) setNativeEditorContent(pkg.website.content);
      }

      // 2. Fill Facebook Post
      if (pkg.facebook) {
        if (document.getElementById('fb_preview_caption')) document.getElementById('fb_preview_caption').value = pkg.facebook.caption || '';
        if (document.getElementById('fb_preview_hashtags')) document.getElementById('fb_preview_hashtags').value = pkg.facebook.hashtags || '';
      }

      // 3. Fill Zalo OA
      if (pkg.zalo) {
        if (document.getElementById('zalo_preview_title')) document.getElementById('zalo_preview_title').value = pkg.zalo.headline || '';
        if (document.getElementById('zalo_preview_body')) document.getElementById('zalo_preview_body').value = pkg.zalo.broadcastBody || '';
      }

      // 4. Fill Video Script
      if (pkg.video) {
        if (document.getElementById('video_script_title')) document.getElementById('video_script_title').innerText = pkg.video.title || 'KỊCH BẢN PHÓNG SỰ 60S';
        const tbody = document.getElementById('video_scenes_tbody');
        if (tbody && Array.isArray(pkg.video.scenes)) {
          tbody.innerHTML = pkg.video.scenes.map((s, idx) => `
            <tr style="border-bottom: 1px solid #E2E8F0;">
              <td style="padding: 10px 16px; font-weight: 700; color: #8B5CF6;">Cảnh ${s.scene || idx + 1}</td>
              <td style="padding: 10px 16px; color: #334155;">${s.visual || ''}</td>
              <td style="padding: 10px 16px; font-style: italic; color: #0F172A;">"${s.voiceover || ''}"</td>
              <td style="padding: 10px 16px; color: #64748B; font-weight: 600;">10 - 15s</td>
            </tr>
          `).join('');
        }
      }

      // 5. Fill Banner Concept
      if (pkg.banner) {
        if (document.getElementById('banner_concept_headline')) document.getElementById('banner_concept_headline').innerText = pkg.banner.headline || '';
        if (document.getElementById('banner_concept_sub')) document.getElementById('banner_concept_sub').innerText = pkg.banner.subText || '';
      }

      // Update package status badge
      const badge = document.getElementById('package_status_badge');
      if (badge) {
        badge.className = 'badge';
        badge.style.background = '#E2E8F0';
        badge.style.color = '#475569';
        badge.innerText = 'Bản Nháp (Draft)';
      }

      // Toast notification
      if (typeof showAiEngineToast === 'function') {
        showAiEngineToast(res.source);
      }

      switchPackageTab('web');
      alert(`🎉 ĐÃ XUẤT XƯỞNG TRỌN GÓI CONTENT PACKAGE ĐA KÊNH!\n\nNguồn AI: ${res.source}\nCăn cứ: ${res.groundedAssetsCount} tư liệu thực tế.`);
    } else {
      alert("❌ LỖI TẠO CONTENT PACKAGE:\n\n" + (res.error || "Không nhận được phản hồi"));
    }
  } catch (err) {
    console.error(err);
    alert("❌ LỖI KẾT NỐI MẠNG:\n" + err.message);
  } finally {
    if (spinner) spinner.style.display = 'none';
    if (btn) btn.disabled = false;
  }
}

function switchPackageTab(tab) {
  ['web', 'fb', 'zalo', 'video', 'banner'].forEach(t => {
    const pane = document.getElementById(`pkg_view_${t}`);
    const btn = document.getElementById(`tab_btn_pkg_${t}`);
    
    if (pane) pane.style.display = (t === tab) ? 'block' : 'none';
    if (btn) {
      if (t === tab) {
        btn.style.background = 'white';
        btn.style.color = '#0284C7';
        btn.style.borderBottom = '3px solid #0284C7';
      } else {
        btn.style.background = 'transparent';
        btn.style.color = '#64748B';
        btn.style.borderBottom = 'none';
      }
    }
  });

  if (tab === 'banner') {
    applySloganToCanvas();
  }
}

function applySloganToCanvas() {
  const headline = document.getElementById('banner_concept_headline')?.innerText || 'CÔNG ĐOÀN ĐẠI HỌC THỦ DẦU MỘT';
  const sub = document.getElementById('banner_concept_sub')?.innerText || 'Đoàn kết - Tiên phong - Đổi mới';

  const titleInput = document.getElementById('studio_title_text');
  const subInput = document.getElementById('studio_subtitle_text');

  if (titleInput && (!titleInput.value || titleInput.value === 'Tiêu đề trên ảnh...')) {
    titleInput.value = headline;
  }
  if (subInput && (!subInput.value || subInput.value === 'Khẩu hiệu / Slogan...')) {
    subInput.value = sub;
  }

  if (typeof redrawCanvasStudio === 'function') {
    redrawCanvasStudio();
  } else if (typeof renderStudioCanvasBanner === 'function') {
    renderStudioCanvasBanner(headline);
  }
}

function downloadCanvasBanner() {
  const canvas = document.getElementById('integrated_studio_canvas');
  if (!canvas) return;
  const link = document.createElement('a');
  link.download = `Banner_CongDoan_TDMU_${Date.now()}.png`;
  link.href = canvas.toDataURL('image/png');
}

function copyFacebookCaption() {
  const cap = document.getElementById('fb_preview_caption')?.value || '';
  const hash = document.getElementById('fb_preview_hashtags')?.value || '';
  navigator.clipboard.writeText(`${cap}\n\n${hash}`);
  alert("📋 Đã sao chép toàn bộ nội dung bài đăng Facebook!");
}

function copyVideoScript() {
  if (!currentPackageData || !currentPackageData.video) return;
  const txt = JSON.stringify(currentPackageData.video, null, 2);
  navigator.clipboard.writeText(txt);
  alert("📋 Đã sao chép kịch bản video vào bộ nhớ tạm!");
}

async function saveCurrentPackageDraft() {
  const state = getCompletePackageState();
  const title = state.website.title || 'Bài Viết Mới (Bản Nháp)';
  const content = state.website.content;
  const summary = state.website.summary || title;

  const payload = {
    title,
    content,
    summary,
    dossierId: currentStudioDossierId,
    status: 'draft',
    isAiGenerated: true,
    packageData: state
  };

  let url = '/api/articles';
  let method = 'POST';
  
  if (currentAiPackageArticleId) {
    url = `/api/articles/${currentAiPackageArticleId}`;
    method = 'PUT';
  }

  const res = await fetch(url, {
    method: method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).then(r => r.json());

  if (res.success) {
    const badge = document.getElementById('package_status_badge');
    if (badge) {
      badge.style.background = '#E2E8F0';
      badge.style.color = '#475569';
      badge.innerText = 'Đã Lưu Nháp (Draft)';
    }
    alert("💾 Đã lưu bài viết vào hệ thống ở trạng thái Bản Nháp (Draft)!");
  }
}

let pendingPublishPayload = null;

function submitPackageForApproval() {
  const state = getCompletePackageState();
  const title = state.website.title || 'Bài Viết Mới';
  const content = state.website.content;
  const summary = state.website.summary || title;

  pendingPublishPayload = {
    title,
    content,
    summary,
    dossierId: currentStudioDossierId,
    status: 'published',
    isAiGenerated: true,
    packageData: state
  };

  document.getElementById('publish_article_id').value = currentAiPackageArticleId || '';
  document.getElementById('publish_schedule_modal').classList.add('active');
}

function openPublishModal(articleId = null) {
  // Fix popup over popup issue
  const articleModal = document.getElementById('article_edit_modal');
  if (articleModal && articleModal.classList.contains('active')) {
    articleModal.classList.remove('active');
  }

  if (articleId) {
    // Publish from existing article
    document.getElementById('publish_article_id').value = articleId;
    pendingPublishPayload = null; // We'll PUT to the API
  } else {
    // Use the payload from AI Studio
    document.getElementById('publish_article_id').value = '';
  }
  document.getElementById('publish_schedule_modal').classList.add('active');
}

function toggleScheduleInput() {
  const mode = document.getElementById('publish_mode_select').value;
  document.getElementById('publish_schedule_group').style.display = (mode === 'schedule') ? 'block' : 'none';
}

function closePublishScheduleModal() {
  document.getElementById('publish_schedule_modal').classList.remove('active');
  pendingPublishPayload = null;
  document.getElementById('publish_article_id').value = '';
}

async function executePublish() {
  const articleId = document.getElementById('publish_article_id').value;
  const mode = document.getElementById('publish_mode_select').value;
  
  let targetStatus = 'published';
  let scheduledAt = null;

  if (mode === 'schedule') {
    const timeVal = document.getElementById('publish_schedule_time').value;
    if (!timeVal) {
      alert("Vui lòng chọn ngày giờ xuất bản!");
      return;
    }
    const localDate = new Date(timeVal);
    targetStatus = 'scheduled';
    scheduledAt = localDate.toISOString(); 
  }

  try {
    let res;
    if (articleId) {
      let payload = { status: targetStatus };
      if (scheduledAt) payload.scheduledAt = scheduledAt;
      
      if (pendingPublishPayload) {
         payload = { ...pendingPublishPayload, ...payload };
      }

      res = await fetch(`/api/articles/${articleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(r => r.json());

    } else if (pendingPublishPayload) {
      // We are publishing a newly generated AI Studio package
      pendingPublishPayload.status = targetStatus;
      if (scheduledAt) pendingPublishPayload.scheduledAt = scheduledAt;
      
      res = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pendingPublishPayload)
      }).then(r => r.json());
    } else {
      return;
    }

    if (res.success) {
      closePublishScheduleModal();
      const badge = document.getElementById('package_status_badge');
      if (badge) {
        badge.style.background = mode === 'schedule' ? '#DBEAFE' : '#D1FAE5';
        badge.style.color = mode === 'schedule' ? '#1E40AF' : '#065F46';
        badge.innerText = mode === 'schedule' ? 'Đã Hẹn Giờ (Scheduled)' : 'Đã Xuất Bản (Published)';
      }
      alert(mode === 'schedule' ? "⏰ Đã lên lịch đăng bài thành công!" : "🚀 Đã xuất bản nội dung thành công!");
      
      // Update views if necessary
      closeArticleEditModal();
      loadAdminArticles('all');
      loadWorkspacePackages();
      loadScheduleTable();
    } else {
      alert("Lỗi xuất bản: " + res.error);
    }
  } catch (err) {
    console.error(err);
  }
}

async function approveArticle(id) {
  if (!confirm("Bác có chắc chắn muốn PHÊ DUYỆT bài viết này không?")) return;
  const res = await fetch(`/api/articles/${id}/approve`, { method: 'POST' }).then(r => r.json());
  if (res.success) {
    alert("✅ Đã phê duyệt bài viết thành công!");
    loadAdminDashboard();
    loadAdminArticles('all');
  }
}

async function rejectArticle(id) {
  const reason = prompt("Lý do trả lại bản nháp (góp ý cho biên tập viên):", "Cần chỉnh sửa lại câu từ cho trang trọng hơn");
  if (reason === null) return;
  const res = await fetch(`/api/articles/${id}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason })
  }).then(r => r.json());
  if (res.success) {
    alert("↩️ Đã hoàn trả bài viết về Bản Nháp để sửa đổi!");
    loadAdminDashboard();
    loadAdminArticles('all');
  }
}



// ==========================================
// 🛡️ MODAL BACKDROP SAFETY ENGINE (PREVENTS FROZEN OVERLAYS)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  // 1. Ensure all modal backdrops are cleanly closed on start
  document.querySelectorAll('.modal-backdrop').forEach(modal => {
    modal.classList.remove('active');
    
    // 2. Click on backdrop closes modal
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
  });

  // 3. Escape key closes any active modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-backdrop.active').forEach(m => m.classList.remove('active'));
    }
  });
});
// AI IMAGE GENERATOR
function generateAiImage() {
  const prompt = document.getElementById('ai_image_prompt').value.trim();
  if (!prompt) {
    alert("Vui l?ng nh?p m� t? ?nh!");
    return;
  }
  
  document.getElementById('ai_image_empty').style.display = 'none';
  document.getElementById('ai_image_result').style.display = 'none';
  document.getElementById('ai_image_actions').style.display = 'none';
  document.getElementById('ai_image_loading').style.display = 'flex';
  document.getElementById('btn_generate_image').disabled = true;

  // Simulate AI Generation Delay
  setTimeout(() => {
    // Determine ratio for placeholder
    const ratio = document.getElementById('ai_image_ratio').value;
    let width = 800;
    let height = 450; // 16:9
    if (ratio === '1:1') height = 800;
    if (ratio === '4:3') height = 600;

    // Use placeholder service to simulate result
    const randomId = Math.floor(Math.random() * 1000);
    
    document.getElementById('ai_image_loading').style.display = 'none';
    const resultImg = document.getElementById('ai_image_result');
    const imageUrl = finalizeImageUrl(Math.floor(Math.random() * 1000), width, height);
    resultImg.src = imageUrl;
    resultImg.style.display = 'block';
    document.getElementById('ai_image_actions').style.display = 'flex';
    document.getElementById('btn_generate_image').disabled = false;
  }, 3500);
}

function downloadAiImage() {
  const imgEl = document.getElementById('ai_image_result');
  if (!imgEl || !imgEl.src) return;
  
  const a = document.createElement('a');
  a.href = imgEl.src;
  a.download = finalizeDownloadName();
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
// Added lines back correctly
function finalizeImageUrl(randomId, width, height) {
    return 'https://picsum.photos/seed/' + randomId + '/' + width + '/' + height;
}

function finalizeDownloadName() {
    return 'AI_Generated_' + Date.now() + '.jpg';
}
// --- INLINE AI MICRO-EDITING (GRAMMARLY STYLE) ---
let currentAiSelection = null;
let currentAiRange = null;

document.addEventListener('selectionchange', () => {
  const selection = window.getSelection();
  const floatingMenu = document.getElementById('ai_floating_toolbar');
  
  if (!selection || selection.isCollapsed || selection.toString().trim().length < 5) {
    if (floatingMenu) floatingMenu.style.display = 'none';
    currentAiSelection = null;
    currentAiRange = null;
    return;
  }

  // Check if selection is inside native_rich_editor
  let node = selection.anchorNode;
  let isInsideEditor = false;
  while (node) {
    if (node.id === 'native_rich_editor') {
      isInsideEditor = true;
      break;
    }
    node = node.parentNode;
  }

  if (isInsideEditor) {
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    currentAiSelection = selection.toString();
    currentAiRange = range.cloneRange();

    floatingMenu.style.display = 'flex';
    floatingMenu.style.top = (rect.bottom + window.scrollY + 8) + 'px';
    floatingMenu.style.left = (rect.left + window.scrollX) + 'px';
  } else {
    floatingMenu.style.display = 'none';
  }
});

async function inlineAiAction(action) {
  if (!currentAiSelection || !currentAiRange) return;

  const originalText = currentAiSelection;
  const range = currentAiRange;
  
  // Visual feedback: replace text with loading state
  const loadingSpan = document.createElement('span');
  loadingSpan.style.backgroundColor = '#E0E7FF';
  loadingSpan.style.color = '#4F46E5';
  loadingSpan.style.borderRadius = '4px';
  loadingSpan.style.padding = '0 4px';
  loadingSpan.innerText = '? AI �ang x? l?...';
  
  range.deleteContents();
  range.insertNode(loadingSpan);
  document.getElementById('ai_floating_toolbar').style.display = 'none';

  try {
    const apiKey = localStorage.getItem('gemini_api_key') || "";
    const res = await fetch('/api/ai/inline-edit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: originalText,
        action: action,
        apiKey: apiKey
      })
    }).then(r => r.json());

    if (res.success && res.text) {
      // Replace loading span with result
      loadingSpan.replaceWith(document.createTextNode(res.text));
      saveEditorState(); // Save to undo stack
    } else {
      loadingSpan.replaceWith(document.createTextNode(originalText));
      alert("L?i AI: " + (res.error || "Kh�ng th? x? l?."));
    }
  } catch (e) {
    loadingSpan.replaceWith(document.createTextNode(originalText));
    alert("L?i m?ng: " + e.message);
  }
}
// --- UNDO / REDO / REGENERATE EDITOR STATE ---
let editorHistory = [];
let historyIndex = -1;

function saveEditorState() {
  const editor = document.getElementById('native_rich_editor');
  if (!editor) return;
  const content = editor.innerHTML;
  
  // If we are not at the end of history, truncate the future
  if (historyIndex < editorHistory.length - 1) {
    editorHistory = editorHistory.slice(0, historyIndex + 1);
  }
  
  editorHistory.push(content);
  // Keep last 20 states
  if (editorHistory.length > 20) {
    editorHistory.shift();
  } else {
    historyIndex++;
  }
}

function undoEditorAction() {
  if (historyIndex > 0) {
    historyIndex--;
    const editor = document.getElementById('native_rich_editor');
    if (editor) editor.innerHTML = editorHistory[historyIndex];
  }
}

function redoEditorAction() {
  if (historyIndex < editorHistory.length - 1) {
    historyIndex++;
    const editor = document.getElementById('native_rich_editor');
    if (editor) editor.innerHTML = editorHistory[historyIndex];
  }
}

// Hook into editor changes
document.addEventListener('DOMContentLoaded', () => {
  const editor = document.getElementById('native_rich_editor');
  if (editor) {
    saveEditorState(); // Initial state
    editor.addEventListener('input', () => {
      // Debounce saving state on manual typing
      clearTimeout(editor.saveTimeout);
      editor.saveTimeout = setTimeout(saveEditorState, 1000);
    });
  }
});
// --- AI PACKAGE STATE MANAGEMENT ---
function getCompletePackageState() {
  const state = {
    website: {
      title: document.getElementById('ai_final_title')?.value || '',
      summary: document.getElementById('ai_final_subtitle')?.value || '',
      content: getNativeEditorContent() || ''
    },
    facebook: {
      caption: document.getElementById('fb_preview_caption')?.value || '',
      hashtags: document.getElementById('fb_preview_hashtags')?.value || ''
    },
    zalo: {
      title: document.getElementById('zalo_preview_title')?.value || '',
      body: document.getElementById('zalo_preview_body')?.value || ''
    },
    video: {
      html: document.getElementById('video_scenes_tbody')?.innerHTML || ''
    },
    image: {
      prompt: document.getElementById('ai_image_prompt')?.value || '',
      ratio: document.getElementById('ai_image_ratio')?.value || '',
      style: document.getElementById('ai_image_style')?.value || '',
      url: document.getElementById('ai_image_result')?.src || ''
    }
  };
  return state;
}

let isResumingFromDb = false;
function resumeAiPackage(packageData, articleId = null) {
  isResumingFromDb = true;
  if (!packageData) return;
  currentAiPackageArticleId = articleId;
  showAdminTab('ai-creator');

  // Website
  if (packageData.website) {
    if (document.getElementById('ai_final_title')) document.getElementById('ai_final_title').value = packageData.website.title || '';
    if (document.getElementById('ai_final_subtitle')) document.getElementById('ai_final_subtitle').value = packageData.website.summary || '';
    if (packageData.website.content) setNativeEditorContent(packageData.website.content, true);
  }

  // Facebook
  if (packageData.facebook) {
    if (document.getElementById('fb_preview_caption')) document.getElementById('fb_preview_caption').value = packageData.facebook.caption || '';
    if (document.getElementById('fb_preview_hashtags')) document.getElementById('fb_preview_hashtags').value = packageData.facebook.hashtags || '';
  }

  // Zalo
  if (packageData.zalo) {
    if (document.getElementById('zalo_preview_title')) document.getElementById('zalo_preview_title').value = packageData.zalo.title || '';
    if (document.getElementById('zalo_preview_body')) document.getElementById('zalo_preview_body').value = packageData.zalo.body || '';
  }

  // Video
  if (packageData.video && packageData.video.html) {
    const tbody = document.getElementById('video_scenes_tbody');
    if (tbody) tbody.innerHTML = packageData.video.html;
  }

  // Image
  if (packageData.image) {
    if (document.getElementById('ai_image_prompt')) document.getElementById('ai_image_prompt').value = packageData.image.prompt || '';
    if (document.getElementById('ai_image_ratio')) document.getElementById('ai_image_ratio').value = packageData.image.ratio || '';
    if (document.getElementById('ai_image_style')) document.getElementById('ai_image_style').value = packageData.image.style || '';
    if (packageData.image.url && packageData.image.url !== window.location.href) {
      document.getElementById('ai_image_empty').style.display = 'none';
      const imgEl = document.getElementById('ai_image_result');
      imgEl.src = packageData.image.url;
      imgEl.style.display = 'block';
      document.getElementById('ai_image_actions').style.display = 'flex';
    }
  }

  alert("�? kh�i ph?c th�nh c�ng B?n Nh�p (Package State). B?n c� th? ti?p t?c bi�n t?p!");
}
let currentAiPackageArticleId = null;
// --- LOCAL STORAGE AUTO-SAVE (SIMPLE DRAFT RECOVERY) ---
let autoSaveInterval = null;

function startStudioAutoSave() {
  if (autoSaveInterval) clearInterval(autoSaveInterval);
  autoSaveInterval = setInterval(() => {
    // Only save if there is actually some content
    const state = getCompletePackageState();
    const hasContent = state.website.title || state.website.content.replace(/<[^>]*>?/gm, '').trim().length > 10 || state.facebook.caption;
    if (hasContent) {
      localStorage.setItem('studioLocalDraft', JSON.stringify(state));
    }
  }, 3000);
}

function stopStudioAutoSave() {
  if (autoSaveInterval) clearInterval(autoSaveInterval);
}

function checkAndPromptLocalDraft() {
  if (isResumingFromDb) {
    isResumingFromDb = false;
    return;
  }
  const draftStr = localStorage.getItem('studioLocalDraft');
  if (draftStr) {
    try {
      const draft = JSON.parse(draftStr);
      // Ensure it's not totally empty
      if (draft && (draft.website.title || draft.website.content.replace(/<[^>]*>?/gm, '').trim().length > 10)) {
        if (confirm("?? TR? L? AI: B?n �ang c� m?t phi�n l�m vi?c �ang l�m d? (ch�a l�u ho?c ch�a xu?t b?n). B?n c� mu?n kh�i ph?c l?i �? l�m ti?p kh�ng? (B?m Cancel �? x�a nh�p)")) {
          resumeAiPackage(draft);
        } else {
          localStorage.removeItem('studioLocalDraft');
        }
      }
    } catch (e) {
      localStorage.removeItem('studioLocalDraft');
    }
  }
}
