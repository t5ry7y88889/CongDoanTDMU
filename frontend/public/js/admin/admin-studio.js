// =============================================================================
// MANUS & JENNI AI EDITORIAL STUDIO ENGINE — CONG DOAN TDMU
// Ultra-clean, Document-First Workspace with Real-time Thought Stream & Multi-channel Canvas
// =============================================================================

const studioState = {
  uploadedFiles: [],    // { name, size, type, text, dataUrl }
  photos: [],           // { url, caption, isFeatured }
  activeArticleId: null,
  activePackage: null,
  currentChannel: 'web'
};

// ── UTILITIES & DOCUMENT PARSER ──────────────────────────────────────────────

async function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function readDocumentText(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const buffer = e.target.result;
        const decoder = new TextDecoder('utf-8', { fatal: false });
        const text = decoder.decode(buffer);
        
        // Extract Word docx XML tags (<w:t>)
        const matches = text.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g);
        if (matches && matches.length > 0) {
          const extracted = matches.map(m => m.replace(/<[^>]+>/g, '')).join(' ');
          if (extracted.trim().length > 10) {
            return resolve(extracted.trim());
          }
        }
        
        // Clean printable strings
        const cleaned = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ').replace(/\s+/g, ' ').trim();
        if (cleaned.length > 30) {
          return resolve(cleaned.slice(0, 12000));
        }
        resolve(`[Tệp: ${file.name} - ${(file.size/1024).toFixed(1)} KB]`);
      } catch(err) {
        resolve(`[Tệp: ${file.name}]`);
      }
    };
    reader.onerror = () => resolve(`[Tệp: ${file.name}]`);
    reader.readAsArrayBuffer(file);
  });
}

// ── FILE INTAKE & MANAGEMENT ──────────────────────────────────────────────────

async function handleManusFilesSelected(files) {
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
      studioState.photos.push({
        url: fileObj.dataUrl,
        caption: f.name.replace(/\.[^/.]+$/, ''),
        isFeatured: studioState.photos.length === 0
      });
    } else if (f.type.startsWith('text/') || f.name.endsWith('.txt') || f.name.endsWith('.csv') || f.name.endsWith('.md')) {
      fileObj.text = await new Promise((res) => {
        const reader = new FileReader();
        reader.onload = (e) => res(e.target.result);
        reader.readAsText(f);
      });
    } else {
      // Word .docx, .doc, PDF
      fileObj.text = await readDocumentText(f);
    }
    studioState.uploadedFiles.push(fileObj);
  }
  renderManusFilesList();
  addManusThought('files', `Đã tiếp nhận ${files.length} tệp tài liệu mới. Sẵn sàng bóc tách dữ liệu.`, 'done');
}

function renderManusFilesList() {
  const container = document.getElementById('manus_files_list');
  if (!container) return;

  if (!studioState.uploadedFiles.length) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = studioState.uploadedFiles.map((f, idx) => `
    <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 6px 10px; font-size: 12px; display: flex; align-items: center; justify-content: space-between;">
      <div style="display: flex; align-items: center; gap: 8px; overflow: hidden;">
        <i class="fa-solid ${f.type.startsWith('image/') ? 'fa-image text-success' : 'fa-file-lines text-primary'}"></i>
        <span style="font-weight: 700; color: #002855; max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${f.name}">${f.name}</span>
        <span style="color: #64748B; font-size: 11px;">(${f.size})</span>
      </div>
      <button type="button" onclick="removeManusFile(${idx})" style="background: none; border: none; color: #EF4444; cursor: pointer; font-size: 12px; padding: 0 4px;">✕</button>
    </div>
  `).join('');
}

function removeManusFile(idx) {
  studioState.uploadedFiles.splice(idx, 1);
  renderManusFilesList();
}

// ── MANUS THOUGHT STREAM ──────────────────────────────────────────────────────

function addManusThought(stepKey, text, status = 'done') {
  const stream = document.getElementById('manus_thought_stream');
  const badge = document.getElementById('manus_thought_badge');
  if (!stream) return;

  // Clear initial placeholder
  if (stream.querySelector('div[style*="italic"]')) {
    stream.innerHTML = '';
  }

  const icon = status === 'running' 
    ? '<i class="fa-solid fa-circle-notch fa-spin text-primary"></i>'
    : status === 'done'
    ? '<i class="fa-solid fa-circle-check text-success"></i>'
    : '<i class="fa-solid fa-circle-xmark text-danger"></i>';

  const row = document.createElement('div');
  row.style.cssText = 'display: flex; align-items: flex-start; gap: 8px; line-height: 1.5;';
  row.innerHTML = `<span style="font-size: 13px; margin-top: 2px;">${icon}</span><span style="flex: 1;">${text}</span>`;
  stream.appendChild(row);
  stream.scrollTop = stream.scrollHeight;

  if (badge) {
    if (status === 'running') {
      badge.textContent = 'Đang xử lý';
      badge.style.background = '#EFF6FF';
      badge.style.color = '#1D4ED8';
    } else if (status === 'done') {
      badge.textContent = 'Hoàn tất';
      badge.style.background = '#ECFDF5';
      badge.style.color = '#059669';
    } else {
      badge.textContent = 'Lỗi';
      badge.style.background = '#FEF2F2';
      badge.style.color = '#DC2626';
    }
  }
}

// ── CORE GENERATION (MANUS CHẤP BÚT) ──────────────────────────────────────────

async function runManusGeneration() {
  const prompt = (document.getElementById('manus_prompt_input')?.value || '').trim();
  const btn = document.getElementById('btn_manus_generate');

  if (!prompt && !studioState.uploadedFiles.length) {
    alert("⚠️ Vui lòng tải lên tài liệu (Word, PDF, TXT) hoặc nhập yêu cầu để AI bắt đầu chấp bút!");
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin me-2"></i> ✨ MANUS ĐANG CHẤP BÚT...';
    btn.style.opacity = '0.75';
  }

  // Clear previous thought stream
  const stream = document.getElementById('manus_thought_stream');
  if (stream) stream.innerHTML = '';

  addManusThought('read', 'Khởi động Manus Agent: Đang phân tích tệp tài liệu đính kèm...', 'running');

  // Reset editor
  const canvas = document.getElementById('manus_canvas_editor');
  if (canvas) canvas.innerHTML = '';
  switchManusTab('web');

  const apiKey = localStorage.getItem('gemini_api_key') || '';

  const payload = {
    sourceText: '',
    userPrompt: prompt || "Tạo bài báo hoàn chỉnh từ tài liệu đính kèm cho website Công Đoàn TDMU.",
    filesInfo: studioState.uploadedFiles.map(f => ({
      name: f.name,
      size: f.size,
      type: f.type,
      text: f.text || ''
    })),
    photos: studioState.photos,
    genre: 'tin_hoat_dong',
    apiKey
  };

  try {
    addManusThought('extract', 'Bóc tách sự thật 5W1H & xây dựng bố cục báo chí chuyên nghiệp...', 'running');

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

    addManusThought('write', 'Đang chấp bút bài báo Website và stream trực tiếp lên Word Canvas...', 'running');

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
              canvas.innerHTML = webHtml;
              canvas.scrollTop = canvas.scrollHeight;
              updateManusWordCount();
            }
          } else if (evt.step === 'social_done') {
            fbCaption = evt.facebook?.caption || '';
            zaloMessage = evt.zalo?.message || '';
            safeSetVal('manus_fb_caption', fbCaption);
            safeSetText('manus_fb_preview_text', fbCaption);
            safeSetVal('manus_zalo_caption', zaloMessage);
            safeSetText('manus_zalo_preview_text', zaloMessage);

            if (studioState.photos.length > 0) {
              const fbImg = document.getElementById('manus_fb_img_preview');
              if (fbImg) {
                fbImg.style.display = 'block';
                fbImg.innerHTML = `<img src="${studioState.photos[0].url}" style="width:100%;max-height:220px;object-fit:cover;">`;
              }
            }
            addManusThought('social', 'Chuyển thể thành công bài đăng Facebook Fanpage & tin Zalo OA.', 'done');
          } else if (evt.step === 'all_done') {
            articleId = evt.articleId;
            extractedTitle = evt.title || '';
            extractedSummary = evt.summary || '';
            studioState.activeArticleId = articleId;
          }
        } catch (e) {}
      }
    }

    if (!webHtml.trim()) {
      throw new Error("Không nhận được phản hồi từ AI");
    }

    // Extract Title & Sapo if not yet set
    if (!extractedTitle) {
      const titleMatch = webHtml.match(/<h1[^>]*>(.*?)<\/h1>/i);
      extractedTitle = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '').trim() : "Hoạt động Công Đoàn TDMU 2026";
    }
    if (!extractedSummary) {
      const sapoMatch = webHtml.match(/<p class="sapo"[^>]*>.*?<strong>(.*?)<\/strong>/i);
      extractedSummary = sapoMatch ? sapoMatch[1].replace(/<[^>]*>/g, '').trim() : webHtml.replace(/<[^>]*>/g, '').slice(0, 200);
    }

    safeSetVal('manus_title_input', extractedTitle);
    safeSetVal('manus_sapo_input', extractedSummary);

    // Clean out h1 from body to keep title in title box
    const cleanBody = webHtml.replace(/<h1[^>]*>.*?<\/h1>/i, '').trim();
    if (canvas) canvas.innerHTML = cleanBody;

    updateManusWordCount();

    addManusThought('complete', `Hoàn tất bài viết #${articleId || ''}! Bạn có thể chỉnh sửa trực tiếp trên Canvas.`, 'done');

  } catch (err) {
    console.error('[Manus] Error:', err);
    addManusThought('error', 'Lỗi: ' + err.message, 'error');
    alert("❌ Lỗi khi sinh bài báo: " + err.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles text-warning"></i> ✨ MANUS CHẤP BÚT BÀI BÁO →';
      btn.style.opacity = '1';
    }
  }
}

// ── TAB SWITCHING ─────────────────────────────────────────────────────────────

function switchManusTab(tab) {
  studioState.currentChannel = tab;
  const tabs = ['web', 'fb', 'zalo', 'schedule'];

  tabs.forEach(t => {
    const btn = document.getElementById('manus_tab_' + t);
    const pane = document.getElementById('manus_pane_' + t);

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
    loadManusSchedules();
  }
}

// ── JENNI AI INLINE ACTIONS ───────────────────────────────────────────────────

async function manusInlineTool(action) {
  const canvas = document.getElementById('manus_canvas_editor');
  if (!canvas || !canvas.innerText.trim()) {
    alert("⚠️ Chưa có nội dung bài báo trên Canvas!");
    return;
  }

  const actionNames = {
    formal: 'Nâng cao tính trang trọng theo Nghị Định 30',
    shorten: 'Rút gọn nội dung súc tích',
    expand: 'Mở rộng chiều sâu dữ liệu',
    factcheck: 'Kiểm định đối chiếu số liệu'
  };

  addManusThought('inline', `Đang áp dụng công cụ: ${actionNames[action] || action}...`, 'running');
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
      updateManusWordCount();
      addManusThought('inline_done', `Đã hoàn tất ${actionNames[action] || action}!`, 'done');
    } else {
      throw new Error(res.error || 'Không thể chỉnh sửa');
    }
  } catch (err) {
    alert("Lỗi tinh chỉnh: " + err.message);
    addManusThought('inline_err', 'Lỗi: ' + err.message, 'error');
  } finally {
    canvas.style.opacity = '1';
  }
}

// ── METRICS COUNTER ───────────────────────────────────────────────────────────

function updateManusWordCount() {
  const title = document.getElementById('manus_title_input')?.value || '';
  const sapo = document.getElementById('manus_sapo_input')?.value || '';
  const body = document.getElementById('manus_canvas_editor')?.innerText || '';
  const fullText = (title + ' ' + sapo + ' ' + body).trim();

  const words = fullText ? fullText.split(/\s+/).filter(Boolean).length : 0;
  const minutes = Math.max(1, Math.ceil(words / 220));

  safeSetText('manus_word_count', `${words} từ`);
  safeSetText('manus_read_time', `~${minutes} phút đọc`);
}

// ── FORMATTING HELPERS ────────────────────────────────────────────────────────

function execFormat(command) {
  document.execCommand(command, false, null);
  document.getElementById('manus_canvas_editor')?.focus();
}

function insertCustomH2() {
  const h2Text = prompt("Nhập tiêu đề đề mục H2 mới:", "Điểm Nhấn Hoạt Động");
  if (!h2Text) return;
  const editor = document.getElementById('manus_canvas_editor');
  if (editor) {
    editor.focus();
    document.execCommand('insertHTML', false, `<h2 style="font-size: 19px; font-weight: 800; color: #002855; margin: 24px 0 10px; border-left: 4px solid #0284C7; padding-left: 10px;">${escapeHtml(h2Text)}</h2><p></p>`);
    updateManusWordCount();
  }
}

function insertCustomQuote() {
  const quote = prompt("Nhập lời phát biểu trích dẫn:", "Tổ chức Công đoàn luôn đồng hành cùng cán bộ, giảng viên và người lao động.");
  if (!quote) return;
  const author = prompt("Tên và chức vụ người phát biểu:", "Đại diện Ban Thường Vụ Công Đoàn Trường");
  const editor = document.getElementById('manus_canvas_editor');
  if (editor) {
    editor.focus();
    document.execCommand('insertHTML', false, `
      <blockquote style="margin: 20px 0; padding: 14px 20px; background: #F8FAFC; border-left: 4px solid #D97706; font-style: italic; color: #334155; border-radius: 0 8px 8px 0;">
        "${escapeHtml(quote)}"
        ${author ? `<div style="font-style: normal; font-weight: 700; font-size: 13px; color: #002855; margin-top: 6px;">— ${escapeHtml(author)}</div>` : ''}
      </blockquote><p></p>
    `);
    updateManusWordCount();
  }
}

// ── PUBLISHING & SCHEDULING ───────────────────────────────────────────────────

async function manusSaveDraft() {
  const title = (document.getElementById('manus_title_input')?.value || '').trim();
  const sapo = (document.getElementById('manus_sapo_input')?.value || '').trim();
  const content = (document.getElementById('manus_canvas_editor')?.innerHTML || '').trim();

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
      facebook: { caption: document.getElementById('manus_fb_caption')?.value || '' },
      zalo: { message: document.getElementById('manus_zalo_caption')?.value || '' }
    }
  };

  try {
    const res = await fetch('/api/articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(r => r.json());

    if (res.success) {
      studioState.activeArticleId = res.data?.id;
      addManusThought('save', `Đã lưu bản nháp thành công vào CSDL (Mã #${res.data?.id}).`, 'done');
      alert(`💾 Đã lưu thành công Bản Nháp (Draft) bài báo #${res.data?.id}!`);
    } else {
      throw new Error(res.error || "Lỗi lưu bản nháp");
    }
  } catch (err) {
    alert("Lỗi lưu nháp: " + err.message);
  }
}

async function manusPublishNow() {
  const title = (document.getElementById('manus_title_input')?.value || '').trim();
  if (!title) {
    alert("⚠️ Vui lòng nhập tiêu đề bài báo!");
    return;
  }

  if (!confirm(`Xác nhận xuất bản bài báo "${title}" lên Website Cổng Thông Tin Công Đoàn?`)) return;

  const sapo = (document.getElementById('manus_sapo_input')?.value || '').trim();
  const content = (document.getElementById('manus_canvas_editor')?.innerHTML || '').trim();

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
          facebook: { caption: document.getElementById('manus_fb_caption')?.value || '' },
          zalo: { message: document.getElementById('manus_zalo_caption')?.value || '' }
        }
      })
    }).then(r => r.json());

    if (res.success) {
      addManusThought('publish', `Bài viết "${title}" đã chính thức XUẤT BẢN LIVE!`, 'done');
      alert(`🎉 Đã xuất bản thành công bài báo #${res.data?.id} lên Website!`);
    } else {
      throw new Error(res.error || "Lỗi xuất bản");
    }
  } catch (err) {
    alert("Lỗi xuất bản: " + err.message);
  }
}

async function manusPublishChannel(channel) {
  if (channel === 'zalo') {
    manusCopyZalo();
    return;
  }
  if (!studioState.activeArticleId) {
    await manusSaveDraft();
  }
  if (!studioState.activeArticleId) return;

  try {
    const res = await fetch('/api/publish/now', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        articleId: studioState.activeArticleId,
        channel
      })
    }).then(r => r.json());

    if (res.success) {
      alert(`✅ Đã xuất bản thành công lên kênh ${channel.toUpperCase()}!`);
      addManusThought('pub_chan', res.message, 'done');
    } else {
      alert("Lỗi: " + res.error);
    }
  } catch (err) {
    alert("Lỗi kết nối: " + err.message);
  }
}

function openScheduleModalForChannel(channel) {
  studioState.currentChannel = channel;
  const modal = document.getElementById('modal_ap_schedule');
  const label = document.getElementById('ap_schedule_channel_label');
  if (label) {
    const name = channel === 'web' ? '📰 Website' : channel === 'facebook' ? '📘 Facebook Fanpage' : '💬 Zalo OA';
    label.textContent = `Kênh xuất bản: ${name}`;
  }
  if (modal) modal.style.display = 'flex';
}

function manusCopyZalo() {
  const text = document.getElementById('manus_zalo_caption')?.value || '';
  if (!text.trim()) {
    alert("Chưa có nội dung Zalo!");
    return;
  }
  navigator.clipboard.writeText(text).then(() => {
    alert("📋 Đã copy nội dung tin nhắn Zalo OA!");
  });
}

async function loadManusSchedules() {
  const container = document.getElementById('manus_schedule_list');
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
        const dt = new Date(s.scheduledAt).toLocaleString('vi-VN');
        const ch = s.channel === 'web' ? '📰 Website' : s.channel === 'facebook' ? '📘 Facebook' : '💬 Zalo';
        return `
          <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 8px 12px; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <span style="font-weight: 700; color: #002855;">${ch}</span> &bull; 
              <span style="color: #64748B;">${dt}</span> &bull; 
              <span style="font-size: 11px; font-weight: 700; color: ${s.status === 'done' ? '#16A34A' : '#D97706'};">${s.status === 'done' ? 'Đã chạy' : 'Đang chờ'}</span>
            </div>
            ${s.status === 'pending' ? `<button onclick="cancelScheduleItem(${s.id})" style="background: none; border: none; color: #EF4444; font-size: 11px; cursor: pointer; font-weight: 700;">Hủy</button>` : ''}
          </div>
        `;
      }).join('');
  } catch (e) {
    container.innerHTML = '<div style="color: #EF4444;">Không thể tải lịch hẹn.</div>';
  }
}

async function cancelScheduleItem(id) {
  if (!confirm("Hủy lịch hẹn này?")) return;
  try {
    await fetch('/api/publish/schedule/' + id, { method: 'DELETE' });
    loadManusSchedules();
  } catch (e) {
    alert("Lỗi: " + e.message);
  }
}

// ── BACKWARD-COMPATIBILITY ALIASES & HELPERS ──────────────────────────────────

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

// Global hook for modal insertion
function insertPhotoToWordCanvas(photo, alt, caption, ratio, fit) {
  const figureHtml = `
    <figure class="journalism-figure" style="margin: 22px 0; text-align: center;">
      <img src="${photo.url}" alt="${escapeHtml(alt)}" style="width: 100%; aspect-ratio: ${ratio}; object-fit: ${fit}; border-radius: 8px; box-shadow: 0 4px 14px rgba(0,0,0,0.08); display: block; margin: 0 auto;" />
      <figcaption contenteditable="true" style="font-size: 13px; font-style: italic; color: #64748B; margin-top: 8px; outline: none;">${escapeHtml(caption)}</figcaption>
    </figure>
    <p><br></p>
  `;

  const editor = document.getElementById('manus_canvas_editor');
  if (editor) {
    editor.focus();
    document.execCommand('insertHTML', false, figureHtml);
    updateManusWordCount();
  }
  closeMediaManagerModal();
}

document.addEventListener('DOMContentLoaded', () => {
  updateManusWordCount();
});


async function apConfirmSchedule() {
  const dtInput = document.getElementById('ap_schedule_datetime');
  const scheduledAt = dtInput?.value;
  if (!scheduledAt) { alert('Vui lòng chọn ngày giờ!'); return; }

  const scheduledDate = new Date(scheduledAt);
  if (scheduledDate <= new Date()) { alert('Thời gian phải là tương lai!'); return; }

  if (!studioState.activeArticleId) {
    await manusSaveDraft();
  }
  if (!studioState.activeArticleId) return;

  try {
    const res = await fetch('/api/publish/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        articleId: studioState.activeArticleId,
        channel: studioState.currentChannel || 'web',
        scheduledAt: scheduledDate.toISOString(),
        title: document.getElementById('manus_title_input')?.value || '',
        facebook: { caption: document.getElementById('manus_fb_caption')?.value || '' },
        zalo: { message: document.getElementById('manus_zalo_caption')?.value || '' }
      })
    }).then(r => r.json());

    if (res.success) {
      document.getElementById('modal_ap_schedule').style.display = 'none';
      alert('✅ Đã lên lịch hẹn xuất bản thành công!');
      loadManusSchedules();
      addManusThought('sched', Đã hẹn giờ xuất bản () vào lúc ., 'done');
    } else {
      alert('Lỗi: ' + res.error);
    }
  } catch (err) {
    alert('Lỗi kết nối: ' + err.message);
  }
}
