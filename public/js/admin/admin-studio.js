// =============================================================================
// TDMU NEWSROOM COMPOSER — CORE ENGINE
// Architecture inspired by The Washington Post (Arc XP) & The New York Times (Oak)
// Semantic Block Canvas + Ingestion Tray + Multi-Platform Syndication
// =============================================================================

const composerState = window.composerState = {
  files: [],            // { name, size, type, text, dataUrl }
  photos: [],           // { url, caption, isFeatured }
  activeArticleId: null,
  masterArticle: {
    title: '',
    sapo: '',
    bodyHtml: ''
  },
  syndication: {
    facebook: '',
    zalo: ''
  },
  currentTab: 'web'
};

// ── 1. DOCUMENT & NATIVE XML PARSER ──────────────────────────────────────────

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function parseDocxOnServer(file) {
  try {
    const base64 = await readFileAsDataUrl(file);
    const res = await fetch('/api/documents/parse-docx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        fileBase64: base64
      })
    }).then(r => r.json());

    if (res.success) {
      if (res.images && res.images.length > 0) {
        res.images.forEach(img => {
          composerState.photos.push({
            url: img.url,
            caption: img.caption || ('Ảnh trích xuất từ: ' + file.name),
            isFeatured: composerState.photos.length === 0
          });
        });
        logComposerActivity('docx_imgs', 'Đã tự động trích xuất ' + res.images.length + ' ảnh nhúng từ tệp Word ' + file.name + '!', 'done');
      }
      return { text: res.text || '', html: res.html || '' };
    }
  } catch (e) {
    console.warn('[Docx Server Parse Warning]:', e.message);
  }
  return null;
}

async function readDocumentText(file) {
  if (file.name.endsWith('.docx')) {
    const parsed = await parseDocxOnServer(file);
    if (parsed && parsed.text) {
      return parsed.text;
    }
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const buffer = e.target.result;
        const decoder = new TextDecoder('utf-8', { fatal: false });
        const text = decoder.decode(buffer);
        const cleaned = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ').replace(/\s+/g, ' ').trim();
        if (cleaned.length > 30) {
          return resolve(cleaned.slice(0, 15000));
        }
        resolve('[Tài liệu: ' + file.name + ' - ' + (file.size/1024).toFixed(1) + ' KB]');
      } catch(err) {
        resolve('[Tài liệu: ' + file.name + ']');
      }
    };
    reader.onerror = () => resolve('[Tài liệu: ' + file.name + ']');
    reader.readAsArrayBuffer(file);
  });
}

// ── 2. INGESTION TRAY (TIẾP NHẬN TƯ LIỆU) ─────────────────────────────────────

async function handleComposerFiles(files) {
  if (!files || !files.length) return;
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    const fileObj = {
      name: f.name,
      size: (f.size / 1024).toFixed(1) + ' KB',
      type: f.type || 'document',
      text: '',
      dataUrl: ''
    };

    if (f.type.startsWith('image/')) {
      fileObj.dataUrl = await readFileAsDataUrl(f);
      composerState.photos.push({
        url: fileObj.dataUrl,
        caption: f.name.replace(/\.[^/.]+$/, ''),
        isFeatured: composerState.photos.length === 0
      });
    } else if (f.type.startsWith('text/') || f.name.endsWith('.txt') || f.name.endsWith('.csv') || f.name.endsWith('.md')) {
      fileObj.text = await new Promise((res) => {
        const reader = new FileReader();
        reader.onload = (e) => res(e.target.result);
        reader.readAsText(f);
      });
    } else {
      fileObj.text = await readDocumentText(f);
    }
    composerState.files.push(fileObj);
  }
  renderComposerFilesList();
  logComposerActivity('files', 'Đã tiếp nhận ' + files.length + ' tệp tài liệu mới vào khay biên tập.', 'done');
}

function renderComposerFilesList() {
  const container = document.getElementById('composer_files_list');
  if (!container) return;

  if (!composerState.files.length) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = composerState.files.map((f, idx) => {
    const isImg = f.type.startsWith('image/') || f.dataUrl;
    return (
      '<div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 8px 12px; font-size: 12.5px; display: flex; align-items: center; justify-content: space-between; gap: 8px;">' +
        '<div style="display: flex; align-items: center; gap: 8px; overflow: hidden;">' +
          (isImg && f.dataUrl ? '<img src="' + f.dataUrl + '" style="width: 28px; height: 28px; object-fit: cover; border-radius: 4px; flex-shrink: 0;">' : '<i class="fa-solid ' + (isImg ? 'fa-image text-success' : 'fa-file-lines text-primary') + '"></i>') +
          '<span style="font-weight: 700; color: #002855; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 190px;" title="' + escapeHtml(f.name) + '">' + escapeHtml(f.name) + '</span>' +
          '<span style="color: #64748B; font-size: 11px; flex-shrink: 0;">(' + f.size + ')</span>' +
        '</div>' +
        '<button type="button" onclick="removeComposerFile(' + idx + ')" style="background: none; border: none; color: #94A3B8; cursor: pointer; font-size: 14px; padding: 0 4px; line-height: 1;" title="Xóa tệp">✕</button>' +
      '</div>'
    );
  }).join('');
}

function removeComposerFile(idx) {
  composerState.files.splice(idx, 1);
  renderComposerFilesList();
}

// ── 3. ACTIVITY LOG (TIẾN TRÌNH BIÊN TẬP THỜI GIAN THỰC) ──────────────────────

function logComposerActivity(key, text, status) {
  const stream = document.getElementById('composer_activity_stream');
  const badge = document.getElementById('composer_activity_badge');
  if (!stream) return;

  const placeholder = stream.querySelector('.empty-placeholder');
  if (placeholder) placeholder.remove();

  const icon = status === 'running' 
    ? '<i class="fa-solid fa-circle-notch fa-spin" style="color: #0284C7;"></i>'
    : status === 'done'
    ? '<i class="fa-solid fa-circle-check" style="color: #16A34A;"></i>'
    : '<i class="fa-solid fa-circle-xmark" style="color: #DC2626;"></i>';

  const item = document.createElement('div');
  item.style.cssText = 'display: flex; align-items: flex-start; gap: 8px; font-size: 12px; line-height: 1.5; color: #334155;';
  item.innerHTML = '<span style="font-size: 13px; margin-top: 1px;">' + icon + '</span><span style="flex: 1;">' + escapeHtml(text) + '</span>';
  stream.appendChild(item);
  stream.scrollTop = stream.scrollHeight;

  if (badge) {
    if (status === 'running') {
      badge.textContent = 'Đang xử lý';
      badge.style.background = '#EFF6FF';
      badge.style.color = '#1D4ED8';
    } else if (status === 'done') {
      badge.textContent = 'Sẵn sàng';
      badge.style.background = '#ECFDF5';
      badge.style.color = '#059669';
    } else {
      badge.textContent = 'Lỗi';
      badge.style.background = '#FEF2F2';
      badge.style.color = '#DC2626';
    }
  }
}

// ── 4. AI MASTER COMPOSITION (LẬP BÀI BÁO GỐC CHUẨN TÒA SOẠN) ───────────────────

async function runComposerGeneration() {
  const prompt = (document.getElementById('composer_prompt_input')?.value || '').trim();
  const btn = document.getElementById('btn_composer_generate');

  if (!prompt && !composerState.files.length) {
    alert("⚠️ Vui lòng tải lên tài liệu (Word, PDF, TXT) hoặc nhập chỉ đạo để bắt đầu lập bài báo gốc!");
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin me-2"></i> ⚡ ĐANG LẬP BÀI BÁO GỐC...';
    btn.style.opacity = '0.8';
  }

  // Clear previous activity
  const stream = document.getElementById('composer_activity_stream');
  if (stream) stream.innerHTML = '';

  logComposerActivity('init', 'Khởi động Tòa Soạn AI: Đang đọc hiểu toàn bộ tư liệu nguồn...', 'running');

  // Switch to Web Master Document
  switchComposerTab('web');
  const canvas = document.getElementById('composer_canvas_editor');
  if (canvas) canvas.innerHTML = '';

  const apiKey = localStorage.getItem('gemini_api_key') || '';

  const payload = {
    sourceText: '',
    userPrompt: prompt || "Lập bài báo website truyền thông Công Đoàn TDMU hoàn chỉnh, trang trọng từ hồ sơ tư liệu.",
    filesInfo: composerState.files.map(f => ({
      name: f.name,
      size: f.size,
      type: f.type,
      text: f.text || ''
    })),
    photos: composerState.photos,
    genre: 'tin_hoat_dong',
    apiKey
  };

  try {
    logComposerActivity('analyze', 'Trích xuất dữ kiện 5W1H & thiết lập cấu trúc Semantic Blocks...', 'running');

    const response = await fetch('/api/ai/autopilot-generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let webHtml = '';
    let fbCaption = '';
    let zaloMessage = '';
    let articleId = null;
    let extractedTitle = '';
    let extractedSummary = '';

    logComposerActivity('stream', 'Đang chấp bút Master Article và stream trực tiếp lên Canvas...', 'running');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const evt = JSON.parse(line.slice(6));
          if (evt.step === 'web_chunk') {
            webHtml += evt.chunk;
            if (canvas) {
              // Dynamic block routing
              const titleMatch = webHtml.match(/<h1[^>]*>(.*?)<\/h1>/i);
              if (titleMatch) {
                const curTitle = titleMatch[1].replace(/<[^>]*>/g, '').trim();
                safeSetVal('composer_title_input', curTitle);
                composerState.masterArticle.title = curTitle;
              }
              const sapoMatch = webHtml.match(/<p class="sapo"[^>]*>.*?<strong>(.*?)<\/strong>/i);
              if (sapoMatch) {
                const curSapo = sapoMatch[1].replace(/<[^>]*>/g, '').trim();
                safeSetVal('composer_sapo_input', curSapo);
                composerState.masterArticle.sapo = curSapo;
              }

              // Strip h1 and sapo from canvas so they live in dedicated semantic blocks
              let bodyClean = webHtml;
              if (titleMatch) bodyClean = bodyClean.replace(/<h1[^>]*>.*?<\/h1>/i, '');
              if (sapoMatch) bodyClean = bodyClean.replace(/<p class="sapo"[^>]*>.*?<\/p>/i, '');
              canvas.innerHTML = bodyClean.trim();
              canvas.scrollTop = canvas.scrollHeight;
              updateComposerMetrics();
            }
          } else if (evt.step === 'social_done') {
            fbCaption = evt.facebook?.caption || '';
            zaloMessage = evt.zalo?.message || '';

            composerState.syndication.facebook = fbCaption;
            composerState.syndication.zalo = zaloMessage;

            safeSetVal('composer_fb_caption', fbCaption);
            safeSetText('composer_fb_preview_text', fbCaption);
            safeSetVal('composer_zalo_caption', zaloMessage);
            safeSetText('composer_zalo_preview_text', zaloMessage);

            if (composerState.photos.length > 0) {
              const fbImg = document.getElementById('composer_fb_img_preview');
              if (fbImg) {
                fbImg.style.display = 'block';
                fbImg.innerHTML = '<img src="' + composerState.photos[0].url + '" style="width:100%;max-height:220px;object-fit:cover;border-radius:6px;">';
              }
            }
            logComposerActivity('syndication', 'Đã chuyển thể thành công bản Fanpage Facebook & tin Zalo OA.', 'done');
          } else if (evt.step === 'all_done') {
            articleId = evt.articleId;
            extractedTitle = evt.title || '';
            extractedSummary = evt.summary || '';
            composerState.activeArticleId = articleId;
          }
        } catch (e) {}
      }
    }

    if (!webHtml.trim()) {
      throw new Error("Không nhận được nội dung từ AI");
    }

    // Extract Title & Sapo if needed
    if (!extractedTitle) {
      const titleMatch = webHtml.match(/<h1[^>]*>(.*?)<\/h1>/i);
      extractedTitle = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '').trim() : "Hoạt động Công Đoàn TDMU 2026";
    }
    if (!extractedSummary) {
      const sapoMatch = webHtml.match(/<p class="sapo"[^>]*>.*?<strong>(.*?)<\/strong>/i);
      extractedSummary = sapoMatch ? sapoMatch[1].replace(/<[^>]*>/g, '').trim() : webHtml.replace(/<[^>]*>/g, '').slice(0, 180);
    }

    composerState.masterArticle.title = extractedTitle;
    composerState.masterArticle.sapo = extractedSummary;

    safeSetVal('composer_title_input', extractedTitle);
    safeSetVal('composer_sapo_input', extractedSummary);

    // Clean out h1 from body to keep title in Title block
    const cleanBody = webHtml.replace(/<h1[^>]*>.*?<\/h1>/i, '').trim();
    if (canvas) canvas.innerHTML = cleanBody;
    composerState.masterArticle.bodyHtml = cleanBody;

    updateComposerMetrics();
    logComposerActivity('complete', 'Hoàn tất bài báo #' + (articleId || '') + '! Bản thảo sẵn sàng xuất bản.', 'done');

  } catch (err) {
    console.error('[Composer Error]:', err);
    logComposerActivity('error', 'Lỗi: ' + err.message, 'error');
    alert("❌ Lỗi khi tạo bài báo: " + err.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles text-warning"></i> ⚡ LẬP BÀI BÁO GỐC (MASTER STORY) →';
      btn.style.opacity = '1';
    }
  }
}

// ── 5. SYNDICATION TABS (CHUYỂN KÊNH PHÂN PHỐI) ───────────────────────────────

function switchComposerTab(tab) {
  composerState.currentTab = tab;
  const tabs = ['web', 'fb', 'zalo', 'schedule'];

  tabs.forEach(t => {
    const btn = document.getElementById('tab_btn_' + t);
    const pane = document.getElementById('pane_' + t);

    if (pane) pane.style.display = (t === tab) ? 'block' : 'none';
    if (btn) {
      if (t === tab) {
        btn.style.background = 'white';
        btn.style.color = '#002855';
        btn.style.borderBottom = '3px solid #002855';
      } else {
        btn.style.background = 'transparent';
        btn.style.color = '#64748B';
        btn.style.borderBottom = '3px solid transparent';
      }
    }
  });

  if (tab === 'schedule') {
    loadComposerSchedules();
  }
}

// ── 6. DIRECT MEDIA INSERTION (NÉM ẢNH TRỰC TIẾP VÀO BÀI) ──────────────────────

async function insertDirectPhotoToCanvas(files) {
  if (!files || !files.length) return;
  const editor = document.getElementById('composer_canvas_editor');
  if (!editor) return;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const dataUrl = await readFileAsDataUrl(file);
    const caption = file.name.replace(/\.[^/.]+$/, '');

    composerState.photos.push({
      url: dataUrl,
      caption,
      isFeatured: composerState.photos.length === 0
    });

    const figureHtml = (
      '<figure class="newsroom-figure" style="margin: 24px 0; text-align: center;">' +
        '<img src="' + dataUrl + '" alt="' + escapeHtml(caption) + '" style="max-width: 100%; border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,0.08); display: block; margin: 0 auto;" />' +
        '<figcaption contenteditable="true" style="font-size: 13px; font-style: italic; color: #64748B; margin-top: 8px; outline: none;">Ảnh: ' + escapeHtml(caption) + '</figcaption>' +
      '</figure>' +
      '<p></p>'
    );

    editor.focus();
    document.execCommand('insertHTML', false, figureHtml);

    // Sync to Facebook preview
    const fbImg = document.getElementById('composer_fb_img_preview');
    if (fbImg) {
      fbImg.style.display = 'block';
      fbImg.innerHTML = '<img src="' + dataUrl + '" style="width:100%;max-height:220px;object-fit:cover;border-radius:6px;">';
    }
  }

  updateComposerMetrics();
  logComposerActivity('img', 'Đã chèn ' + files.length + ' ảnh hiện trường vào thân bài.', 'done');
}

// ── 7. QUICK POLISH TOOLS (JENNI STYLE ACTIONS) ───────────────────────────────

async function runComposerQuickTool(action) {
  const canvas = document.getElementById('composer_canvas_editor');
  if (!canvas || !canvas.innerText.trim()) {
    alert("⚠️ Chưa có nội dung bài báo trên Canvas!");
    return;
  }

  const actionLabels = {
    formal: 'Chuẩn hóa văn phong Nghị Định 30',
    shorten: 'Rút gọn nội dung cô đọng',
    expand: 'Mở rộng chiều sâu dữ liệu',
    factcheck: 'Đối chiếu số liệu & mốc thời gian'
  };

  logComposerActivity('polish', 'Đang thực hiện: ' + (actionLabels[action] || action) + '...', 'running');
  canvas.style.opacity = '0.5';

  try {
    const res = await fetch('/api/ai/inline-edit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: canvas.innerText.slice(0, 4000),
        action,
        apiKey: localStorage.getItem('gemini_api_key') || ''
      })
    }).then(r => r.json());

    if (res.success && res.result) {
      canvas.innerHTML = res.result;
      updateComposerMetrics();
      logComposerActivity('polish_done', 'Đã hoàn tất ' + (actionLabels[action] || action) + '!', 'done');
    } else {
      throw new Error(res.error || 'Không thể chỉnh sửa');
    }
  } catch (err) {
    alert("Lỗi tinh chỉnh: " + err.message);
    logComposerActivity('polish_err', 'Lỗi: ' + err.message, 'error');
  } finally {
    canvas.style.opacity = '1';
  }
}

// ── 8. FORMATTING & METRICS ───────────────────────────────────────────────────

function execComposerFormat(command) {
  document.execCommand(command, false, null);
  document.getElementById('composer_canvas_editor')?.focus();
}

function insertComposerH2() {
  const text = prompt("Nhập tiêu đề đề mục H2 mới:", "Nội Dung Trọng Tâm");
  if (!text) return;
  const editor = document.getElementById('composer_canvas_editor');
  if (editor) {
    editor.focus();
    document.execCommand('insertHTML', false, '<h2 style="font-size: 19px; font-weight: 800; color: #002855; margin: 24px 0 10px; border-left: 4px solid #0284C7; padding-left: 10px;">' + escapeHtml(text) + '</h2><p></p>');
    updateComposerMetrics();
  }
}

function insertComposerQuote() {
  const quote = prompt("Nhập trích dẫn phát biểu:", "Tổ chức Công đoàn luôn là điểm tựa tin cậy của người lao động.");
  if (!quote) return;
  const author = prompt("Tên và chức vụ người phát biểu (tùy chọn):", "Đại diện Ban Thường Vụ Công Đoàn Trường");
  const editor = document.getElementById('composer_canvas_editor');
  if (editor) {
    editor.focus();
    document.execCommand('insertHTML', false, (
      '<blockquote style="margin: 20px 0; padding: 14px 20px; background: #F8FAFC; border-left: 4px solid #D97706; font-style: italic; color: #334155; border-radius: 0 8px 8px 0;">' +
        '"' + escapeHtml(quote) + '"' +
        (author ? '<div style="font-style: normal; font-weight: 700; font-size: 13px; color: #002855; margin-top: 6px;">— ' + escapeHtml(author) + '</div>' : '') +
      '</blockquote><p></p>'
    ));
    updateComposerMetrics();
  }
}

function updateComposerMetrics() {
  const title = document.getElementById('composer_title_input')?.value || '';
  const sapo = document.getElementById('composer_sapo_input')?.value || '';
  const body = document.getElementById('composer_canvas_editor')?.innerText || '';
  const fullText = (title + ' ' + sapo + ' ' + body).trim();

  const words = fullText ? fullText.split(/\s+/).filter(Boolean).length : 0;
  const minutes = Math.max(1, Math.ceil(words / 220));

  safeSetText('composer_word_count', words + ' từ');
  safeSetText('composer_read_time', '~' + minutes + ' phút đọc');
}

// ── 9. PUBLISHING & SCHEDULING ────────────────────────────────────────────────

async function saveComposerDraft() {
  const title = (document.getElementById('composer_title_input')?.value || '').trim();
  const sapo = (document.getElementById('composer_sapo_input')?.value || '').trim();
  const content = (document.getElementById('composer_canvas_editor')?.innerHTML || '').trim();

  if (!title) {
    alert("⚠️ Vui lòng nhập tiêu đề bài báo trước khi lưu!");
    return;
  }

  const payload = {
    title,
    summary: sapo,
    content,
    categoryId: 2,
    status: 'draft',
    packageData: {
      facebook: { caption: document.getElementById('composer_fb_caption')?.value || '' },
      zalo: { message: document.getElementById('composer_zalo_caption')?.value || '' }
    }
  };

  try {
    const res = await fetch('/api/articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(r => r.json());

    if (res.success) {
      composerState.activeArticleId = res.data?.id;
      logComposerActivity('save', 'Đã lưu bản nháp thành công vào CSDL (Mã #' + res.data?.id + ').', 'done');
      alert('💾 Đã lưu thành công Bản Nháp (Draft) bài báo #' + res.data?.id + '!');
    } else {
      throw new Error(res.error || "Lỗi lưu bản nháp");
    }
  } catch (err) {
    alert("Lỗi lưu nháp: " + err.message);
  }
}

async function publishComposerLive() {
  const title = (document.getElementById('composer_title_input')?.value || '').trim();
  if (!title) {
    alert("⚠️ Vui lòng nhập tiêu đề bài báo!");
    return;
  }

  if (!confirm('Xác nhận xuất bản bài báo "' + title + '" lên Website Cổng Thông Tin Công Đoàn?')) return;

  const sapo = (document.getElementById('composer_sapo_input')?.value || '').trim();
  const content = (document.getElementById('composer_canvas_editor')?.innerHTML || '').trim();

  try {
    const res = await fetch('/api/articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        summary: sapo,
        content,
        categoryId: 2,
        status: 'published',
        publishedAt: new Date().toISOString(),
        packageData: {
          facebook: { caption: document.getElementById('composer_fb_caption')?.value || '' },
          zalo: { message: document.getElementById('composer_zalo_caption')?.value || '' }
        }
      })
    }).then(r => r.json());

    if (res.success) {
      logComposerActivity('publish', 'Bài viết "' + title + '" đã chính thức XUẤT BẢN LIVE!', 'done');
      alert('🎉 Đã xuất bản thành công bài báo #' + res.data?.id + ' lên Website Cổng thông tin!');
    } else {
      throw new Error(res.error || "Lỗi xuất bản");
    }
  } catch (err) {
    alert("Lỗi xuất bản: " + err.message);
  }
}

async function publishComposerChannel(channel) {
  if (channel === 'zalo') {
    copyComposerZalo();
    return;
  }
  if (!composerState.activeArticleId) {
    await saveComposerDraft();
  }
  if (!composerState.activeArticleId) return;

  try {
    const res = await fetch('/api/publish/now', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        articleId: composerState.activeArticleId,
        channel
      })
    }).then(r => r.json());

    if (res.success) {
      alert('✅ Đã xuất bản thành công lên kênh ' + channel.toUpperCase() + '!');
      logComposerActivity('pub_chan', res.message, 'done');
    } else {
      alert("Lỗi: " + res.error);
    }
  } catch (err) {
    alert("Lỗi kết nối: " + err.message);
  }
}

function openComposerScheduleModal(channel) {
  composerState.currentTab = channel;
  const modal = document.getElementById('modal_ap_schedule');
  const label = document.getElementById('ap_schedule_channel_label');
  if (label) {
    const name = channel === 'web' ? '📰 Website Cổng thông tin' : channel === 'facebook' ? '📘 Fanpage Facebook' : '💬 Zalo OA';
    label.textContent = 'Kênh xuất bản: ' + name;
  }
  if (modal) modal.style.display = 'flex';
}

async function confirmComposerSchedule() {
  const dtInput = document.getElementById('ap_schedule_datetime');
  const scheduledAt = dtInput?.value;
  if (!scheduledAt) { alert('Vui lòng chọn ngày giờ!'); return; }

  const scheduledDate = new Date(scheduledAt);
  if (scheduledDate <= new Date()) { alert('Thời gian phải là tương lai!'); return; }

  if (!composerState.activeArticleId) {
    await saveComposerDraft();
  }
  if (!composerState.activeArticleId) return;

  try {
    const res = await fetch('/api/publish/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        articleId: composerState.activeArticleId,
        channel: composerState.currentTab || 'web',
        scheduledAt: scheduledDate.toISOString(),
        title: document.getElementById('composer_title_input')?.value || '',
        facebook: { caption: document.getElementById('composer_fb_caption')?.value || '' },
        zalo: { message: document.getElementById('composer_zalo_caption')?.value || '' }
      })
    }).then(r => r.json());

    if (res.success) {
      document.getElementById('modal_ap_schedule').style.display = 'none';
      alert('✅ Đã lên lịch hẹn xuất bản thành công!');
      loadComposerSchedules();
      logComposerActivity('sched', 'Đã hẹn giờ xuất bản (' + composerState.currentTab + ') lúc ' + scheduledDate.toLocaleString('vi-VN'), 'done');
    } else {
      alert('Lỗi: ' + res.error);
    }
  } catch (err) {
    alert('Lỗi kết nối: ' + err.message);
  }
}

function copyComposerZalo() {
  const text = document.getElementById('composer_zalo_caption')?.value || '';
  if (!text.trim()) {
    alert("Chưa có nội dung Zalo!");
    return;
  }
  navigator.clipboard.writeText(text).then(() => {
    alert("📋 Đã copy nội dung tin nhắn Zalo OA!");
  });
}

async function loadComposerSchedules() {
  const container = document.getElementById('composer_schedule_list');
  if (!container) return;
  try {
    const res = await fetch('/api/publish/schedules');
    const data = await res.json();
    const list = data.data || [];
    if (!list.length) {
      container.innerHTML = '<div style="color: #94A3B8; font-style: italic;">Chưa có lịch hẹn xuất bản nào trong hệ thống.</div>';
      return;
    }
    container.innerHTML = '<div style="font-weight: 800; font-size: 13px; color: #002855; margin-bottom: 8px;">Lịch Hẹn Đã Thiết Lập:</div>' +
      list.map(s => {
        const schedTime = new Date(s.scheduledAt);
        const dt = schedTime.toLocaleString('vi-VN');
        const ch = s.channel === 'web' ? '📰 Website' : s.channel === 'facebook' ? '📘 Facebook' : '💬 Zalo';
        
        let diffMs = schedTime - Date.now();
        let countdownStr = '';
        if (s.status === 'done') {
          countdownStr = '<span style="color: #16A34A; font-weight: 700;">✓ Đã xuất bản thành công</span>';
        } else if (diffMs <= 0) {
          countdownStr = '<span style="color: #2563EB; font-weight: 700;">⚡ Đang trong hàng đợi xuất bản</span>';
        } else {
          const mins = Math.floor(diffMs / 60000);
          const hrs = Math.floor(mins / 60);
          countdownStr = '<span style="color: #D97706; font-weight: 600;">(còn ' + (hrs > 0 ? (hrs + 'h ' + (mins % 60) + 'm') : (mins + ' phút')) + ')</span>';
        }

        return (
          '<div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 10px 14px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; gap: 12px;">' +
            '<div>' +
              '<div style="font-weight: 700; color: #002855; font-size: 13px;">' + ch + ' &bull; Bài #' + (s.articleId || '') + ' ' + (s.title ? ('- ' + escapeHtml(s.title)) : '') + '</div>' +
              '<div style="color: #64748B; font-size: 11.5px; margin-top: 3px;">' + dt + ' ' + countdownStr + '</div>' +
            '</div>' +
            '<div style="display: flex; gap: 8px; align-items: center;">' +
              (s.status === 'pending' ? '<button onclick="publishComposerScheduledNow(' + s.id + ', ' + s.articleId + ', \'' + s.channel + '\')" style="background: #0284C7; color: white; border: none; border-radius: 4px; padding: 4px 8px; font-size: 11px; font-weight: 700; cursor: pointer;">⚡ Đăng Ngay</button>' : '') +
              (s.status === 'pending' ? '<button onclick="cancelComposerSchedule(' + s.id + ')" style="background: none; border: 1px solid #CBD5E1; color: #EF4444; border-radius: 4px; padding: 3px 8px; font-size: 11px; cursor: pointer; font-weight: 600;">Hủy</button>' : '') +
            '</div>' +
          '</div>'
        );
      }).join('');
  } catch (e) {
    container.innerHTML = '<div style="color: #EF4444;">Không thể tải lịch hẹn.</div>';
  }
}


async function publishComposerScheduledNow(schedId, articleId, channel) {
  if (!confirm("Xuất bản ngay lập tức mà không cần đợi đến giờ hẹn?")) return;
  try {
    const res = await fetch('/api/publish/now', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articleId, channel })
    }).then(r => r.json());

    if (res.success) {
      alert("✅ Đã xuất bản thành công!");
      await fetch('/api/publish/schedule/' + schedId, { method: 'DELETE' });
      loadComposerSchedules();
    } else {
      alert("Lỗi: " + res.error);
    }
  } catch (e) {
    alert("Lỗi: " + e.message);
  }
}

async function cancelComposerSchedule(id) {
  if (!confirm("Hủy lịch hẹn này?")) return;
  try {
    await fetch('/api/publish/schedule/' + id, { method: 'DELETE' });
    loadComposerSchedules();
  } catch (e) {
    alert("Lỗi: " + e.message);
  }
}

// ── 10. BACKWARD-COMPATIBILITY ALIASES & HELPERS ───────────────────────────────

function safeSetVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val;
}

function safeSetText(id, text) {
  const el = document.getElementById(id);
  if (el) el.innerText = text;
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

// Backward-compat aliases for modal / HTML onclicks
function apConfirmSchedule() { confirmComposerSchedule(); }
function execFormat(cmd) { execComposerFormat(cmd); }
function insertCustomH2() { insertComposerH2(); }
function insertCustomQuote() { insertComposerQuote(); }
function insertDirectImageToCanvas(files) { insertDirectPhotoToCanvas(files); }

// Manus & Studio aliases
function manusSaveDraft() { saveComposerDraft(); }
function manusPublishNow() { publishComposerLive(); }
function manusPublishChannel(ch) { publishComposerChannel(ch); }
function switchManusTab(t) { switchComposerTab(t); }
function manusInlineTool(a) { runComposerQuickTool(a); }
function manusCopyZalo() { copyComposerZalo(); }
function openScheduleModalForChannel(ch) { openComposerScheduleModal(ch); }
function handleManusFilesSelected(f) { handleComposerFiles(f); }
function updateManusWordCount() { updateComposerMetrics(); }
function runManusGeneration() { runComposerGeneration(); }

document.addEventListener('DOMContentLoaded', () => {
  updateComposerMetrics();
});


// =============================================================================
// PHASE 2: SEMANTIC BLOCK MANAGER, BUBBLE MENU & AUTO-SAVE ENGINE
// =============================================================================

const BlockManager = {
  createFigureHtml(url, caption, id) {
    const figId = id || ('fig_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6));
    return (
      '<figure id="' + figId + '" class="journalism-figure" style="margin: 24px 0; text-align: center; position: relative; border-radius: 8px; overflow: hidden; background: #F8FAFC; border: 1px solid #E2E8F0; padding: 8px;">' +
        '<div style="position: absolute; top: 12px; right: 12px; display: flex; gap: 6px; z-index: 10;">' +
          '<button type="button" onclick="BlockManager.removeFigure(\'' + figId + '\')" style="background: rgba(15, 23, 42, 0.75); color: white; border: none; border-radius: 4px; padding: 4px 8px; font-size: 11px; cursor: pointer;" title="Xóa ảnh">✕ Xóa</button>' +
        '</div>' +
        '<img src="' + url + '" alt="' + escapeHtml(caption) + '" style="max-width: 100%; max-height: 480px; border-radius: 6px; display: block; margin: 0 auto; object-fit: contain;" />' +
        '<figcaption contenteditable="true" style="font-size: 13px; font-style: italic; color: #64748B; margin-top: 10px; outline: none; padding: 4px 12px; cursor: text;">Ảnh: ' + escapeHtml(caption || 'Hình ảnh sự kiện tại Trường Đại học Thủ Dầu Một') + '</figcaption>' +
      '</figure>' +
      '<p><br></p>'
    );
  },

  removeFigure(id) {
    const fig = document.getElementById(id);
    if (fig) {
      fig.remove();
      updateComposerMetrics();
      saveComposerAutosave();
    }
  }
};

// ── BUBBLE MENU INTERACTION ──────────────────────────────────────────────────

function initBubbleMenu() {
  const canvas = document.getElementById('composer_canvas_editor');
  const menu = document.getElementById('composer_bubble_menu');
  if (!canvas || !menu) return;

  const handleSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      menu.style.display = 'none';
      return;
    }

    // Ensure selection is inside canvas
    const anchor = selection.anchorNode;
    if (!canvas.contains(anchor)) {
      menu.style.display = 'none';
      return;
    }

    try {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const canvasRect = canvas.getBoundingClientRect();

      if (rect.width === 0) {
        menu.style.display = 'none';
        return;
      }

      // Position menu centered above selection
      const left = Math.max(10, rect.left - canvasRect.left + (rect.width / 2) - 140);
      const top = Math.max(0, rect.top - canvasRect.top - 44);

      menu.style.left = left + 'px';
      menu.style.top = top + 'px';
      menu.style.display = 'flex';
    } catch (e) {
      menu.style.display = 'none';
    }
  };

  canvas.addEventListener('mouseup', () => setTimeout(handleSelection, 20));
  canvas.addEventListener('keyup', (e) => {
    if (['Shift', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
      setTimeout(handleSelection, 20);
    }
  });

  document.addEventListener('mousedown', (e) => {
    if (menu && !menu.contains(e.target) && !canvas.contains(e.target)) {
      menu.style.display = 'none';
    }
  });
}

function formatBlockSelection(action) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  if (action === 'bold') {
    document.execCommand('bold', false, null);
  } else if (action === 'italic') {
    document.execCommand('italic', false, null);
  } else if (action === 'h2') {
    document.execCommand('formatBlock', false, '<h2>');
  } else if (action === 'quote') {
    document.execCommand('formatBlock', false, '<blockquote>');
  }

  const menu = document.getElementById('composer_bubble_menu');
  if (menu) menu.style.display = 'none';

  updateComposerMetrics();
  saveComposerAutosave();
}

// ── LOCAL STORAGE AUTO-SAVE ENGINE ───────────────────────────────────────────

const AUTOSAVE_STORAGE_KEY = 'tdmu_composer_autosave_v2';

function saveComposerAutosave() {
  try {
    const title = (document.getElementById('composer_title_input')?.value || '').trim();
    const sapo = (document.getElementById('composer_sapo_input')?.value || '').trim();
    const canvas = document.getElementById('composer_canvas_editor');
    const bodyHtml = (canvas?.innerHTML || '').trim();

    if (!title && !sapo && (!bodyHtml || bodyHtml.includes('Nội dung bài báo sẽ xuất hiện tại đây'))) {
      return;
    }

    const payload = {
      title,
      sapo,
      bodyHtml,
      photos: composerState.photos,
      timestamp: Date.now()
    };

    localStorage.setItem(AUTOSAVE_STORAGE_KEY, JSON.stringify(payload));

    const statusBadge = document.getElementById('composer_autosave_status');
    if (statusBadge) {
      const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      statusBadge.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Đã tự động lưu lúc ' + timeStr;
      statusBadge.style.color = '#059669';
    }
  } catch (e) {
    console.warn('[AutoSave Warning]:', e.message);
  }
}

function checkAutosaveRecovery() {
  try {
    const saved = localStorage.getItem(AUTOSAVE_STORAGE_KEY);
    if (!saved) return;

    const data = JSON.parse(saved);
    if (!data || (!data.title && !data.bodyHtml)) return;

    // Only show banner if canvas is currently empty or default
    const canvas = document.getElementById('composer_canvas_editor');
    const isCurrentEmpty = !canvas || !canvas.innerText.trim() || canvas.innerText.includes('Nội dung bài báo sẽ xuất hiện');

    if (isCurrentEmpty) {
      const banner = document.getElementById('composer_restore_banner');
      if (banner) {
        banner.style.display = 'flex';
      }
    }
  } catch (e) {}
}

function restoreComposerAutosave() {
  try {
    const saved = localStorage.getItem(AUTOSAVE_STORAGE_KEY);
    if (!saved) return;
    const data = JSON.parse(saved);

    if (data.title) safeSetVal('composer_title_input', data.title);
    if (data.sapo) safeSetVal('composer_sapo_input', data.sapo);
    if (data.bodyHtml) {
      const canvas = document.getElementById('composer_canvas_editor');
      if (canvas) canvas.innerHTML = data.bodyHtml;
    }
    if (data.photos && Array.isArray(data.photos)) {
      composerState.photos = data.photos;
    }

    dismissComposerAutosave();
    updateComposerMetrics();
    logComposerActivity('restore', 'Đã khôi phục thành công bản thảo tự động lưu gần nhất.', 'done');
  } catch (e) {
    alert("Không thể khôi phục bản thảo: " + e.message);
  }
}

function dismissComposerAutosave() {
  const banner = document.getElementById('composer_restore_banner');
  if (banner) banner.style.display = 'none';
}

// Start auto-save heartbeat
setInterval(saveComposerAutosave, 5000);
window.addEventListener('DOMContentLoaded', () => {
  initBubbleMenu();
  checkAutosaveRecovery();
});

// Run immediate init if document is already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  initBubbleMenu();
  checkAutosaveRecovery();
}
