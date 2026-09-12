
// =============================================================================
// ADMIN AUTO-PILOT — Auto-generate + 3-channel publish engine
// =============================================================================

const apState = {
  articleId: null,
  files: [],       // { name, text, type }
  photos: [],      // { url, caption, isFeatured }
  channel: null,   // currently scheduling for this channel
  webContent: '',
  facebookContent: {},
  zaloContent: {}
};

// ── UTILS ─────────────────────────────────────────────────────────────────────

function apAutoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 300) + 'px';
}

function apDragOver(e) {
  e.preventDefault();
  document.getElementById('ap_dropzone').style.borderColor = '#6366F1';
  document.getElementById('ap_dropzone').style.background = '#EEF2FF';
}

function apDragLeave(e) {
  document.getElementById('ap_dropzone').style.borderColor = '#A5B4FC';
  document.getElementById('ap_dropzone').style.background = '#F8FAFF';
}

function apHandleDrop(e) {
  e.preventDefault();
  apDragLeave(e);
  apHandleFiles(e.dataTransfer.files);
}

async function apHandleFiles(fileList) {
  const listEl = document.getElementById('ap_file_list');
  for (const file of fileList) {
    const ext = file.name.split('.').pop().toLowerCase();
    let text = '';

    if (['txt', 'md'].includes(ext)) {
      text = await file.text();
    } else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
      // Treat as photo
      const url = URL.createObjectURL(file);
      apState.photos.push({ url, caption: file.name, isFeatured: apState.photos.length === 0, isLocal: true });
      apRenderPhotoGrid();
      continue;
    } else {
      text = `[File dinh kem: ${file.name} — Noi dung can xu ly thu cong]`;
    }

    apState.files.push({ name: file.name, text, type: ext });

    const chip = document.createElement('div');
    chip.style.cssText = 'display:flex;align-items:center;gap:8px;background:#F0F4FF;border:1px solid #C7D2FE;border-radius:8px;padding:8px 12px;font-size:12px;';
    chip.innerHTML = `<i class="fa-solid fa-file-lines" style="color:#6366F1;"></i>
      <span style="flex:1;font-weight:600;color:#002855;">${file.name}</span>
      <span style="color:#64748B;">${(file.size/1024).toFixed(1)} KB</span>
      <button onclick="this.parentElement.remove();apState.files=apState.files.filter(f=>f.name!=='${file.name}')" style="background:none;border:none;color:#EF4444;cursor:pointer;font-size:13px;">✕</button>`;
    listEl.appendChild(chip);
  }
}

async function apUploadPhotos(fileList) {
  for (const file of fileList) {
    const url = URL.createObjectURL(file);
    apState.photos.push({ url, caption: file.name, isFeatured: apState.photos.length === 0, isLocal: true });
  }
  apRenderPhotoGrid();
}

function apAddPhotoFromUrl() {
  const url = prompt('Nhap URL anh:');
  if (!url || !url.trim()) return;
  const caption = prompt('Caption anh (co the bo trong):', '') || '';
  apState.photos.push({ url: url.trim(), caption, isFeatured: apState.photos.length === 0 });
  apRenderPhotoGrid();
}

function apRenderPhotoGrid() {
  const grid = document.getElementById('ap_photo_grid');
  const countEl = document.getElementById('ap_photo_count');
  if (!grid) return;

  countEl.textContent = apState.photos.length + ' anh';
  grid.innerHTML = apState.photos.map((p, i) => `
    <div style="position:relative;border-radius:8px;overflow:hidden;border:2px solid ${p.isFeatured ? '#FCD34D' : '#E2E8F0'};">
      <img src="${p.url}" style="width:100%;height:70px;object-fit:cover;display:block;">
      <div style="position:absolute;top:2px;right:2px;display:flex;gap:2px;">
        ${!p.isFeatured ? `<button onclick="apSetFeaturedPhoto(${i})" style="background:#FCD34D;border:none;border-radius:4px;width:18px;height:18px;font-size:9px;cursor:pointer;" title="Dat lam anh dai dien">★</button>` : '<span style="background:#FCD34D;border-radius:4px;padding:1px 4px;font-size:9px;font-weight:900;">★</span>'}
        <button onclick="apRemovePhoto(${i})" style="background:#EF4444;color:white;border:none;border-radius:4px;width:18px;height:18px;font-size:9px;cursor:pointer;">✕</button>
      </div>
    </div>
  `).join('');
}

function apSetFeaturedPhoto(idx) {
  apState.photos.forEach((p, i) => p.isFeatured = i === idx);
  apRenderPhotoGrid();
}

function apRemovePhoto(idx) {
  apState.photos.splice(idx, 1);
  if (apState.photos.length > 0 && !apState.photos.some(p => p.isFeatured)) {
    apState.photos[0].isFeatured = true;
  }
  apRenderPhotoGrid();
}

// ── MAIN RUN ──────────────────────────────────────────────────────────────────

async function runAutoPilot() {
  const prompt = (document.getElementById('ap_prompt_input')?.value || '').trim();
  const genre = document.getElementById('ap_genre_select')?.value || 'tin_hoat_dong';

  if (!prompt && apState.files.length === 0 && apState.photos.length === 0) {
    alert('Vui long nhap Prompt hoac dinh kem tai lieu de AI co the xu ly!');
    return;
  }

  // Reset state
  apState.articleId = null;
  apState.webContent = '';
  apState.facebookContent = {};
  apState.zaloContent = {};

  // UI reset
  const webContentEl = document.getElementById('ap_web_content');
  if (webContentEl) webContentEl.innerHTML = '';
  const statusBar = document.getElementById('ap_status_bar');
  const runBtn = document.getElementById('ap_run_btn');
  if (runBtn) { runBtn.disabled = true; runBtn.style.opacity = '0.5'; }
  if (statusBar) { statusBar.style.display = 'flex'; }

  // Switch to web preview tab
  apSwitchPreviewTab('web');
  document.querySelector('#ap_preview_web > div:first-child')?.remove();

  const apiKey = localStorage.getItem('ap_gemini_key') || '';

  const payload = {
    userPrompt: prompt,
    filesInfo: apState.files,
    photos: apState.photos,
    genre,
    apiKey
  };

  try {
    const response = await fetch('/api/ai/autopilot-generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop(); // keep incomplete line

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const evt = JSON.parse(line.slice(6));
          apHandleSSEEvent(evt, webContentEl, statusBar);
        } catch (e) {}
      }
    }
  } catch (err) {
    console.error('[AutoPilot] SSE error:', err);
    apSetStatus('Loi ket noi den may chu: ' + err.message);
  } finally {
    if (runBtn) { runBtn.disabled = false; runBtn.style.opacity = '1'; }
  }
}

function apHandleSSEEvent(evt, webContentEl, statusBar) {
  if (evt.error) {
    apSetStatus('Loi: ' + evt.error);
    return;
  }

  if (evt.step === 'status') {
    apSetStatus(evt.message);
  } else if (evt.step === 'web_chunk') {
    apState.webContent += evt.chunk;
    if (webContentEl) webContentEl.innerHTML = apState.webContent;
    // Auto-scroll to bottom of preview
    webContentEl.scrollTop = webContentEl.scrollHeight;
  } else if (evt.step === 'web_done') {
    apSetStatus('Bai bao Website hoan tat. Dang chuyen the mang xa hoi...');
  } else if (evt.step === 'social_done') {
    apState.facebookContent = evt.facebook || {};
    apState.zaloContent = evt.zalo || {};
    apRenderFacebookPreview(evt.facebook);
    apRenderZaloPreview(evt.zalo);
    apSetStatus('Da tao xong Facebook & Zalo. Dang luu...');
  } else if (evt.step === 'all_done') {
    apState.articleId = evt.articleId;
    apSetStatus('✅ Hoan tat! Bai bao #' + evt.articleId + ' da luu. San sang xuat ban.');

    // Show publish panel
    const publishPanel = document.getElementById('ap_publish_panel');
    if (publishPanel) {
      publishPanel.style.display = 'block';
      document.getElementById('ap_article_id_display').textContent = 'ID Bai Bao: #' + evt.articleId;
      apLoadSchedulesForArticle(evt.articleId);
    }

    // Show edit toolbar
    const toolbar = document.getElementById('ap_edit_toolbar');
    if (toolbar) toolbar.style.display = 'flex';

    if (statusBar) setTimeout(() => { statusBar.style.display = 'none'; }, 3000);
  }
}

function apSetStatus(msg) {
  const el = document.getElementById('ap_status_text');
  if (el) el.textContent = msg;
}

// ── PREVIEW TABS ──────────────────────────────────────────────────────────────

function apSwitchPreviewTab(tab) {
  ['web', 'facebook', 'zalo'].forEach(t => {
    const preview = document.getElementById('ap_preview_' + t);
    const btn = document.getElementById('ap_tab_' + t);
    if (preview) preview.style.display = t === tab ? 'block' : 'none';
    if (btn) {
      if (t === tab) {
        btn.style.background = '#002855';
        btn.style.color = '#FCD34D';
      } else {
        btn.style.background = 'transparent';
        btn.style.color = '#64748B';
      }
    }
  });
}

function apRenderFacebookPreview(fb) {
  if (!fb || !fb.caption) return;
  const placeholder = document.getElementById('ap_fb_placeholder');
  const card = document.getElementById('ap_fb_card');
  const captionEl = document.getElementById('ap_fb_caption');
  const photoArea = document.getElementById('ap_fb_photo_area');

  if (placeholder) placeholder.style.display = 'none';
  if (card) card.style.display = 'block';
  if (captionEl) captionEl.textContent = fb.caption;

  // Show photos if any
  if (photoArea && fb.photos && fb.photos.length > 0) {
    photoArea.style.display = 'block';
    const photo = fb.photos[0];
    photoArea.innerHTML = `<img src="${photo.url}" style="width:100%;max-height:280px;object-fit:cover;">`;
  }
}

function apRenderZaloPreview(zalo) {
  if (!zalo || !zalo.message) return;
  const placeholder = document.getElementById('ap_zalo_placeholder');
  const card = document.getElementById('ap_zalo_card');
  const msgEl = document.getElementById('ap_zalo_message');
  const linkArea = document.getElementById('ap_zalo_link_area');

  if (placeholder) placeholder.style.display = 'none';
  if (card) card.style.display = 'block';
  if (msgEl) msgEl.textContent = zalo.message;

  if (linkArea && apState.articleId) {
    linkArea.style.display = 'block';
    const shareEl = document.getElementById('ap_zalo_share_link');
    if (shareEl) shareEl.textContent = 'Xem toan bai: /article/' + apState.articleId;
  }
}

// ── PUBLISH NOW ───────────────────────────────────────────────────────────────

async function apPublishNow(channel) {
  if (!apState.articleId) {
    alert('Chua co bai bao! Hay chay Auto-Pilot truoc.');
    return;
  }

  const channelName = channel === 'web' ? 'Website' : channel === 'facebook' ? 'Facebook' : 'Zalo OA';
  if (!confirm(`Xac nhan dang ngay len ${channelName}?`)) return;

  try {
    const res = await fetch('/api/publish/now', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        articleId: apState.articleId,
        channel,
        facebook: apState.facebookContent,
        zalo: apState.zaloContent
      })
    });
    const data = await res.json();
    apLogPublish(data.message || 'Da dang xong!', channel);
    if (channel === 'facebook' && data.data?.url) {
      apLogPublish('Link: ' + data.data.url, channel);
    }
  } catch (err) {
    apLogPublish('Loi: ' + err.message, channel);
  }
}

function apCopyZaloText() {
  const msgEl = document.getElementById('ap_zalo_message');
  const linkEl = document.getElementById('ap_zalo_share_link');
  const text = (msgEl?.textContent || '') + (linkEl ? '\n' + linkEl.textContent : '');
  if (!text.trim()) { alert('Chua co noi dung Zalo!'); return; }
  navigator.clipboard.writeText(text).then(() => {
    alert('Da copy noi dung Zalo! Paste vao Zalo OA de gui.');
  });
}

// ── SCHEDULING ────────────────────────────────────────────────────────────────

function apOpenSchedule(channel) {
  if (!apState.articleId) {
    alert('Chua co bai bao! Hay chay Auto-Pilot truoc.');
    return;
  }
  apState.channel = channel;

  const modal = document.getElementById('modal_ap_schedule');
  const label = document.getElementById('ap_schedule_channel_label');
  const channelName = channel === 'web' ? '📰 Website' : channel === 'facebook' ? '📘 Facebook Fanpage' : '💬 Zalo OA';
  if (label) label.textContent = 'Kenh: ' + channelName + ' — Bai #' + apState.articleId;

  // Set default datetime to tomorrow 8am
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(8, 0, 0, 0);
  const dtInput = document.getElementById('ap_schedule_datetime');
  if (dtInput) {
    const pad = n => String(n).padStart(2, '0');
    dtInput.value = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth()+1)}-${pad(tomorrow.getDate())}T${pad(tomorrow.getHours())}:${pad(tomorrow.getMinutes())}`;
  }

  if (modal) {
    modal.style.display = 'flex';
    apLoadSchedulesForArticle(apState.articleId);
  }
}

async function apConfirmSchedule() {
  const dtInput = document.getElementById('ap_schedule_datetime');
  const scheduledAt = dtInput?.value;
  if (!scheduledAt) { alert('Vui long chon ngay gio!'); return; }

  const scheduledDate = new Date(scheduledAt);
  if (scheduledDate <= new Date()) { alert('Thoi gian phai la tuong lai!'); return; }

  try {
    const res = await fetch('/api/publish/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        articleId: apState.articleId,
        channel: apState.channel,
        scheduledAt: scheduledDate.toISOString(),
        title: document.getElementById('ap_web_content')?.innerText?.slice(0, 100) || '',
        facebook: apState.facebookContent,
        zalo: apState.zaloContent
      })
    });
    const data = await res.json();
    if (data.success) {
      document.getElementById('modal_ap_schedule').style.display = 'none';
      const channelName = apState.channel === 'web' ? 'Website' : apState.channel === 'facebook' ? 'Facebook' : 'Zalo';
      apLogPublish('Da dat lich: ' + channelName + ' luc ' + scheduledDate.toLocaleString('vi-VN'), apState.channel);
      apLoadSchedulesForArticle(apState.articleId);
    } else {
      alert('Loi: ' + data.error);
    }
  } catch (err) {
    alert('Loi ket noi: ' + err.message);
  }
}

async function apLoadSchedulesForArticle(articleId) {
  if (!articleId) return;
  try {
    const res = await fetch('/api/publish/schedules/' + articleId);
    const data = await res.json();
    const schedules = data.data || [];

    ['web', 'facebook', 'zalo'].forEach(channel => {
      const el = document.getElementById('ap_' + channel + '_schedules');
      const channelSchedules = schedules.filter(s => s.channel === channel);
      if (!el) return;
      if (channelSchedules.length === 0) {
        el.innerHTML = '<span style="color:#94A3B8;">Chua co lich hen</span>';
      } else {
        el.innerHTML = channelSchedules.map(s => {
          const dt = new Date(s.scheduledAt).toLocaleString('vi-VN');
          const statusColor = s.status === 'done' ? '#059669' : s.status === 'failed' ? '#DC2626' : '#D97706';
          return `<div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:6px;padding:6px 8px;margin-bottom:4px;">
            <div style="font-weight:700;font-size:11px;color:#002855;">${dt}</div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:2px;">
              <span style="font-size:10px;color:${statusColor};font-weight:700;">${s.status === 'done' ? 'Da dang' : s.status === 'failed' ? 'That bai' : 'Cho dang'}</span>
              ${s.status === 'pending' ? `<button onclick="apCancelSchedule(${s.id})" style="background:none;border:none;color:#EF4444;font-size:10px;cursor:pointer;font-weight:700;">Huy</button>` : ''}
            </div>
          </div>`;
        }).join('');
      }
    });

    // Update modal upcoming list
    const upcomingEl = document.getElementById('ap_schedule_upcoming');
    if (upcomingEl) {
      const pending = schedules.filter(s => s.status === 'pending');
      if (pending.length > 0) {
        upcomingEl.innerHTML = '<div style="font-size:12px;font-weight:700;color:#374151;margin-bottom:6px;">Lich hen hien tai:</div>' +
          pending.map(s => {
            const dt = new Date(s.scheduledAt).toLocaleString('vi-VN');
            const ch = s.channel === 'web' ? '📰' : s.channel === 'facebook' ? '📘' : '💬';
            return `<div style="background:#F0F9FF;border:1px solid #BAE6FD;border-radius:6px;padding:6px 10px;font-size:12px;display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
              <span>${ch} ${dt}</span>
              <button onclick="apCancelSchedule(${s.id})" style="background:none;border:none;color:#EF4444;font-size:11px;cursor:pointer;font-weight:700;">Huy</button>
            </div>`;
          }).join('');
      } else {
        upcomingEl.innerHTML = '';
      }
    }
  } catch (err) {
    console.error('[AutoPilot] Load schedules error:', err);
  }
}

async function apCancelSchedule(scheduleId) {
  if (!confirm('Huy lich hen nay?')) return;
  try {
    await fetch('/api/publish/schedule/' + scheduleId, { method: 'DELETE' });
    apLoadSchedulesForArticle(apState.articleId);
    apLogPublish('Da huy lich hen #' + scheduleId, '');
  } catch (err) {
    alert('Loi: ' + err.message);
  }
}

// ── INLINE EDIT ───────────────────────────────────────────────────────────────

async function apInlineEdit(action) {
  const webEl = document.getElementById('ap_web_content');
  if (!webEl || !webEl.innerText.trim()) { alert('Chua co bai bao!'); return; }

  const currentContent = webEl.innerHTML;
  const apiKey = localStorage.getItem('ap_gemini_key') || '';

  webEl.style.opacity = '0.5';
  try {
    const res = await fetch('/api/ai/inline-edit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: webEl.innerText.slice(0, 3000), action, apiKey })
    });
    const data = await res.json();
    if (data.success && data.result) {
      webEl.innerHTML = data.result;
      apState.webContent = data.result;
    }
  } catch (err) {
    webEl.innerHTML = currentContent;
    alert('Loi chinh sua: ' + err.message);
  } finally {
    webEl.style.opacity = '1';
  }
}

// ── LOG ───────────────────────────────────────────────────────────────────────

function apLogPublish(msg, channel) {
  const logEl = document.getElementById('ap_publish_log');
  if (!logEl) return;
  const icon = channel === 'web' ? '📰' : channel === 'facebook' ? '📘' : channel === 'zalo' ? '💬' : '🔔';
  const entry = document.createElement('div');
  entry.style.cssText = 'display:flex;align-items:center;gap:8px;padding:4px 0;border-bottom:1px solid #E2E8F0;';
  entry.innerHTML = `<span>${icon}</span><span style="flex:1;">${msg}</span><span style="font-size:10px;color:#94A3B8;">${new Date().toLocaleTimeString('vi-VN')}</span>`;
  logEl.insertBefore(entry, logEl.firstChild);
}

// ── INIT ──────────────────────────────────────────────────────────────────────

(function initAutoPilot() {
  // Set default preview tab
  document.addEventListener('DOMContentLoaded', () => {
    apSwitchPreviewTab('web');
  });
})();
