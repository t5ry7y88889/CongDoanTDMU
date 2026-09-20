// =============================================================================
// TDMU NEWSROOM COMPOSER — CORE ENGINE
// Architecture inspired by The Washington Post (Arc XP) & The New York Times (Oak)
// Semantic Block Canvas + Ingestion Tray + Multi-Platform Syndication
// =============================================================================

const composerState = window.composerState = {
  files: [],            // { name, size, type, text, dataUrl, isScannedDoc, charCount, pagesCount }
  photos: [],           // { url, caption, isFeatured, width, height, size }
  activeArticleId: null,
  activeRole: 'editor', // 'editor' | 'contributor'
  facebookPhotos: [],
  masterArticle: {
    title: '',
    sapo: '',
    bodyHtml: ''
  },
  syndication: {
    facebook: '',
    zalo: ''
  }
};

// ── 0. VIETNAMESE FONT NORMALIZER & MEDIA DEFENSE ────────────────────────────
function fixVietnameseFont(str) {
  if (!str || typeof str !== 'string') return '';
  let s = str.normalize('NFC');

  const acuteMap = {
    'a': 'á', 'A': 'Á', 'ă': 'ắ', 'Ă': 'Ắ', 'â': 'ấ', 'Â': 'Ấ',
    'e': 'é', 'E': 'É', 'ê': 'ế', 'Ê': 'Ế',
    'i': 'í', 'I': 'Í',
    'o': 'ó', 'O': 'Ó', 'ô': 'ố', 'Ô': 'Ố', 'ơ': 'ớ', 'Ơ': 'Ớ',
    'u': 'ú', 'U': 'Ú', 'ư': 'ứ', 'Ư': 'Ứ',
    'y': 'ý', 'Y': 'Ý'
  };
  const graveMap = {
    'a': 'à', 'A': 'À', 'ă': 'ằ', 'Ă': 'Ằ', 'â': 'ầ', 'Â': 'Ầ',
    'e': 'è', 'E': 'È', 'ê': 'ề', 'Ê': 'Ề',
    'i': 'ì', 'I': 'Ì',
    'o': 'ò', 'O': 'Ò', 'ô': 'ồ', 'Ô': 'Ồ', 'ơ': 'ờ', 'Ơ': 'Ờ',
    'u': 'ù', 'U': 'Ù', 'ư': 'ừ', 'Ư': 'Ừ',
    'y': 'ỳ', 'Y': 'Ỳ'
  };
  const tildeMap = {
    'a': 'ã', 'A': 'Ã', 'ă': 'ẵ', 'Ă': 'Ẵ', 'â': 'ẫ', 'Â': 'Ẫ',
    'e': 'ẽ', 'E': 'Ẽ', 'ê': 'ễ', 'Ê': 'Ễ',
    'i': 'ĩ', 'I': 'Ĩ',
    'o': 'õ', 'O': 'Õ', 'ô': 'ỗ', 'Ô': 'Ỗ', 'ơ': 'ỡ', 'Ơ': 'Ỡ',
    'u': 'ũ', 'U': 'Ũ', 'ư': 'ữ', 'Ư': 'Ữ',
    'y': 'ỹ', 'Y': 'Ỹ'
  };
  const hookMap = {
    'a': 'ả', 'A': 'Ả', 'ă': 'ẳ', 'Ă': 'Ẳ', 'â': 'ẩ', 'Â': 'Ẩ',
    'e': 'ẻ', 'E': 'Ẻ', 'ê': 'ể', 'Ê': 'Ể',
    'i': 'ỉ', 'I': 'Ỉ',
    'o': 'ỏ', 'O': 'Ỏ', 'ô': 'ổ', 'Ô': 'Ổ', 'ơ': 'ở', 'Ơ': 'Ở',
    'u': 'ủ', 'U': 'Ủ', 'ư': 'ử', 'Ư': 'Ử',
    'y': 'ỷ', 'Y': 'Ỷ'
  };
  const dotMap = {
    'a': 'ạ', 'A': 'Ạ', 'ă': 'ặ', 'Ă': 'Ặ', 'â': 'ậ', 'Â': 'Ậ',
    'e': 'ẹ', 'E': 'Ẹ', 'ê': 'ệ', 'Ê': 'Ệ',
    'i': 'ị', 'I': 'Ị',
    'o': 'ọ', 'O': 'Ọ', 'ô': 'ộ', 'Ô': 'Ộ', 'ơ': 'ợ', 'Ơ': 'Ợ',
    'u': 'ụ', 'U': 'Ụ', 'ư': 'ự', 'Ư': 'Ự',
    'y': 'ỵ', 'Y': 'Ỵ'
  };
  const circumflexMap = {
    'a': 'â', 'A': 'Â', 'e': 'ê', 'E': 'Ê', 'o': 'ô', 'O': 'Ô'
  };

  s = s.replace(/([aAăĂâÂeEêÊiIoOôÔơƠuUưƯyY])[´\u02CA]/g, (m, c) => acuteMap[c] || m);
  s = s.replace(/([aAăĂâÂeEêÊiIoOôÔơƠuUưƯyY])[`\u02CB]/g, (m, c) => graveMap[c] || m);
  s = s.replace(/([aAăĂâÂeEêÊiIoOôÔơƠuUưƯyY])[~\u02DC]/g, (m, c) => tildeMap[c] || m);
  s = s.replace(/([aAăĂâÂeEêÊiIoOôÔơƠuUưƯyY])[\u02C0\u0309]/g, (m, c) => hookMap[c] || m);
  s = s.replace(/([aAăĂâÂeEêÊiIoOôÔơƠuUưƯyY])\u0323/g, (m, c) => dotMap[c] || m);
  s = s.replace(/([aeoAEO])[\^ˆ]/g, (m, c) => circumflexMap[c] || m);
  s = s.replace(/([a-zA-ZÀ-ỹ])[´`\u02CA\u02CB]/g, '$1');

  return s.normalize('NFC');
}

function attachCanvasImageDefense(container) {
  if (!container) return;
  container.querySelectorAll('img').forEach(img => {
    if (!img.dataset.hasDefense) {
      img.dataset.hasDefense = 'true';
      img.onerror = function() {
        console.warn('[Newsroom Studio] Removing broken or inaccessible image:', this.src);
        const fig = this.closest('figure');
        if (fig) fig.remove();
        else this.remove();
        if (typeof updateComposerMetrics === 'function') updateComposerMetrics();
      };
    }
  });
}

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
      return { text: res.text || '', html: res.html || '', embeddedImages: res.images || [] };
    }
  } catch (e) {
    console.warn('[Docx Server Parse Warning]:', e.message);
  }
  return null;
}

async function readDocumentText(file) {
  try {
    const base64 = await readFileAsDataUrl(file);
    const res = await fetch('/api/documents/parse-document', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        fileBase64: base64
      })
    }).then(r => r.json());

    if (res.success) {
      if (res.isScannedDoc) {
        if (typeof logComposerActivity === 'function') {
          logComposerActivity('doc_ocr', `📄 Đã nhận diện tài liệu Scan (${res.pagesCount || 1} trang) - AI đã tự động OCR đọc toàn bộ ${res.charCount || 0} ký tự văn bản!`, 'done');
        }
      }
      
      const stats = [
        res.isScannedDoc ? 'Đã OCR tài liệu Scan' : '',
        res.pagesCount ? `${res.pagesCount} trang` : '',
        res.sheetsCount ? `${res.sheetsCount} sheet Excel` : '',
        res.slidesCount ? `${res.slidesCount} slide PPT` : ''
      ].filter(Boolean).join(', ');

      if (typeof logComposerActivity === 'function') {
        logComposerActivity('doc_parsed', `Đã bóc tách tệp ${file.name} (${res.fileType.toUpperCase()}${stats ? ' - ' + stats : ''}, ${res.charCount || 0} ký tự)`, 'done');
      }
      return {
        text: res.text || res.markdown || '',
        isScannedDoc: !!res.isScannedDoc,
        charCount: res.charCount || 0,
        pagesCount: res.pagesCount || 1
      };
    }
  } catch (e) {
    console.warn('[Document Universal Parse Error]:', e.message);
  }

  // Fallback for plain text files
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const text = e.target.result;
        resolve({ text: (text || '').slice(0, 15000), isScannedDoc: false });
      } catch(err) {
        resolve({ text: '[Tài liệu: ' + file.name + ']', isScannedDoc: false });
      }
    };
    reader.onerror = () => resolve({ text: '[Tài liệu: ' + file.name + ']', isScannedDoc: false });
    reader.readAsText(file);
  });
}


// ── 2. INGESTION TRAY (TIẾP NHẬN TƯ LIỆU) ─────────────────────────────────────

function clearComposerTray() {
  composerState.files = [];
  composerState.photos = [];
  const fileInput = document.getElementById('composer_file_input');
  if (fileInput) fileInput.value = '';
  const folderInput = document.getElementById('composer_folder_input');
  if (folderInput) folderInput.value = '';
  renderComposerFilesList();
  renderComposerPhotosList();
  logComposerActivity('tray_cleared', 'Đã làm trống toàn bộ khay Tinbaiviet để sẵn sàng nạp tệp mới.', 'done');
}

async function handleComposerFiles(files, append = false) {
  if (!files || !files.length) return;

  // Unless explicitly asked to append, reset files to ensure only currently selected files exist
  if (!append) {
    composerState.files = [];
    composerState.photos = [];
  }

  // Filter out temporary/system files (~$*, .DS_Store, Thumbs.db, etc.)
  const validFiles = Array.from(files).filter(f => {
    const name = f.name || '';
    if (name.startsWith('~$') || name.startsWith('.') || name === 'Thumbs.db' || name === 'desktop.ini') return false;
    return true;
  });

  if (!validFiles.length) return;

  logComposerActivity('files_ingesting', `Đang tiếp nhận và phân tích song song ${validFiles.length} tệp được chọn...`, 'running');

  const parsedItems = await Promise.all(validFiles.map(async (f) => {
    const fileObj = {
      name: f.name,
      size: (f.size / 1024).toFixed(1) + ' KB',
      type: f.type || 'document',
      text: '',
      dataUrl: '',
      isScannedDoc: false,
      embeddedImages: []
    };

    if (f.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp|svg)$/i.test(f.name)) {
      fileObj.dataUrl = await readFileAsDataUrl(f);
      fileObj.type = 'image';
      return {
        fileObj,
        photo: {
          url: fileObj.dataUrl,
          caption: f.name.replace(/\.[^/.]+$/, ''),
          isFeatured: false
        }
      };
    } else if (f.type.startsWith('text/') || f.name.endsWith('.txt') || f.name.endsWith('.csv') || f.name.endsWith('.md')) {
      fileObj.text = await new Promise((res) => {
        const reader = new FileReader();
        reader.onload = (e) => res(e.target.result);
        reader.onerror = () => res('');
        reader.readAsText(f);
      });
      return { fileObj, photo: null };
    } else {
      const parsedRes = await readDocumentText(f);
      if (typeof parsedRes === 'object' && parsedRes !== null) {
        fileObj.text = parsedRes.text || '';
        fileObj.isScannedDoc = !!parsedRes.isScannedDoc;
        fileObj.charCount = parsedRes.charCount;
        fileObj.pagesCount = parsedRes.pagesCount;
        if (parsedRes.embeddedImages) {
          fileObj.embeddedImages = parsedRes.embeddedImages;
        }
      } else {
        fileObj.text = parsedRes || '';
      }
      return { fileObj, photo: null };
    }
  }));

  parsedItems.forEach(item => {
    if (item.fileObj) {
      composerState.files.push(item.fileObj);
    }
    if (item.photo) {
      if (composerState.photos.length === 0) item.photo.isFeatured = true;
      composerState.photos.push(item.photo);
    }
  });

  renderComposerFilesList();
  renderComposerPhotosList();
  logComposerActivity('files', 'Đã tiếp nhận ' + validFiles.length + ' tệp hợp lệ vào khay Tinbaiviet.', 'done');
}

function setComposerPromptSuggestion(text) {
  const input = document.getElementById('composer_prompt_input');
  if (input) {
    input.value = text;
    input.focus();
    if (input.parentElement) {
      input.parentElement.style.borderColor = '#2563EB';
      setTimeout(() => {
        if (document.activeElement !== input) {
          input.parentElement.style.borderColor = '#E2E8F0';
        }
      }, 1000);
    }
  }
}
window.setComposerPromptSuggestion = setComposerPromptSuggestion;

function renderComposerFilesList() {
  const container = document.getElementById('composer_files_list');
  const inspBadge = document.getElementById('inspector_badge');
  if (inspBadge) {
    inspBadge.textContent = composerState.files.length + ' tệp';
  }

  if (!container) return;

  if (!composerState.files.length) {
    container.innerHTML = '<div style="color: #94A3B8; font-size: 11.5px; font-style: italic; padding: 6px 0;">Chưa có tệp nào trong khay Tinbaiviet.</div>';
    return;
  }

  container.innerHTML = composerState.files.map((f, idx) => {
    const isImg = f.type.startsWith('image/') || f.dataUrl;
    const ext = (f.name || '').split('.').pop().toLowerCase();
    
    let iconColor = '#0284C7';
    let iconBg = '#F0F9FF';
    let iconClass = 'fa-file-lines';

    if (isImg && f.dataUrl) {
      return (
        '<div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 8px; padding: 6px 10px; font-size: 12px; display: flex; align-items: center; justify-content: space-between; gap: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.03); transition: all 0.15s ease;" onmouseover="this.style.borderColor=\'#CBD5E1\'" onmouseout="this.style.borderColor=\'#E2E8F0\'">' +
          '<div style="display: flex; align-items: center; gap: 8px; overflow: hidden; flex: 1;">' +
            '<img src="' + f.dataUrl + '" style="width: 26px; height: 26px; object-fit: cover; border-radius: 4px; flex-shrink: 0; border: 1px solid #E2E8F0;">' +
            '<span style="font-weight: 600; color: #0F172A; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 170px;" title="' + escapeHtml(f.name) + '">' + escapeHtml(f.name) + '</span>' +
            '<span style="color: #94A3B8; font-size: 10.5px; flex-shrink: 0;">(' + f.size + ')</span>' +
          '</div>' +
          '<button type="button" onclick="removeComposerFile(' + idx + ')" style="background: transparent; border: none; color: #94A3B8; cursor: pointer; font-size: 12px; width: 22px; height: 22px; border-radius: 4px; display: flex; align-items: center; justify-content: center; line-height: 1; transition: all 0.15s;" onmouseover="this.style.background=\'#FEE2E2\'; this.style.color=\'#DC2626\';" onmouseout="this.style.background=\'transparent\'; this.style.color=\'#94A3B8\';" title="Xóa tệp">✕</button>' +
        '</div>'
      );
    } else if (isImg) {
      iconColor = '#16A34A';
      iconBg = '#F0FDF4';
      iconClass = 'fa-image';
    } else if (ext === 'docx' || ext === 'doc') {
      iconColor = '#2563EB';
      iconBg = '#EFF6FF';
      iconClass = 'fa-file-word';
    } else if (ext === 'pdf') {
      iconColor = '#DC2626';
      iconBg = '#FEF2F2';
      iconClass = 'fa-file-pdf';
    } else if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
      iconColor = '#16A34A';
      iconBg = '#F0FDF4';
      iconClass = 'fa-file-excel';
    } else if (ext === 'pptx' || ext === 'ppt') {
      iconColor = '#EA580C';
      iconBg = '#FFF7ED';
      iconClass = 'fa-file-powerpoint';
    }

    const scanBadge = f.isScannedDoc
      ? '<span style="background: #EFF6FF; color: #1D4ED8; font-size: 9.5px; font-weight: 700; padding: 1px 5px; border-radius: 4px; border: 1px solid #BFDBFE; white-space: nowrap;"><i class="fa-solid fa-file-invoice me-1"></i>OCR (' + (f.charCount || 0) + ')</span>'
      : '';

    return (
      '<div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 8px; padding: 6px 10px; font-size: 12px; display: flex; align-items: center; justify-content: space-between; gap: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.03); transition: all 0.15s ease;" onmouseover="this.style.borderColor=\'#CBD5E1\'" onmouseout="this.style.borderColor=\'#E2E8F0\'">' +
        '<div style="display: flex; align-items: center; gap: 8px; overflow: hidden; flex: 1;">' +
          '<div style="width: 26px; height: 26px; border-radius: 6px; background: ' + iconBg + '; color: ' + iconColor + '; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 12px;">' +
            '<i class="fa-solid ' + iconClass + '"></i>' +
          '</div>' +
          '<span style="font-weight: 600; color: #0F172A; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 170px;" title="' + escapeHtml(f.name) + '">' + escapeHtml(f.name) + '</span>' +
          '<span style="color: #94A3B8; font-size: 10.5px; flex-shrink: 0;">(' + f.size + ')</span>' +
          scanBadge +
        '</div>' +
        '<button type="button" onclick="removeComposerFile(' + idx + ')" style="background: transparent; border: none; color: #94A3B8; cursor: pointer; font-size: 12px; width: 22px; height: 22px; border-radius: 4px; display: flex; align-items: center; justify-content: center; line-height: 1; transition: all 0.15s;" onmouseover="this.style.background=\'#FEE2E2\'; this.style.color=\'#DC2626\';" onmouseout="this.style.background=\'transparent\'; this.style.color=\'#94A3B8\';" title="Xóa tệp">✕</button>' +
      '</div>'
    );
  }).join('');
}

function removeComposerFile(idx) {
  composerState.files.splice(idx, 1);
  renderComposerFilesList();
  renderComposerPhotosList();
}

function renderComposerPhotosList() {
  const container = document.getElementById('composer_photos_list');
  const countBadge = document.getElementById('composer_photos_count_badge');
  if (countBadge) {
    countBadge.textContent = (composerState.photos ? composerState.photos.length : 0) + ' ảnh';
  }

  if (typeof renderFbAssetPicker === 'function') {
    renderFbAssetPicker();
  }

  if (!container) return;

  const hasScannedDoc = (composerState.files || []).some(f => f.isScannedDoc);

  if (!composerState.photos || !composerState.photos.length) {
    if (hasScannedDoc) {
      container.innerHTML = (
        '<div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 8px; padding: 9px 11px; font-size: 11.5px; color: #166534; display: flex; align-items: flex-start; gap: 7px;">' +
          '<i class="fa-solid fa-circle-check text-success" style="font-size: 13px; margin-top: 2px;"></i>' +
          '<div>' +
            '<div style="font-weight: 700; margin-bottom: 2px;">Đã tự động bóc tách toàn bộ văn bản scan qua AI OCR!</div>' +
            '<div style="font-size: 10.5px; color: #15803D;">Văn bản được chuyển thành nội dung bài báo, giữ kho ảnh gọn sạch.</div>' +
          '</div>' +
        '</div>'
      );
    } else {
      container.innerHTML = '<div style="color: #94A3B8; font-size: 11.5px; font-style: italic; padding: 4px 0;">Chưa có ảnh tư liệu. Nạp thư mục Tinbaiviet để tự động trích xuất ảnh.</div>';
    }
    return;
  }

  container.innerHTML = (
    '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(92px, 1fr)); gap: 8px;">' +
      composerState.photos.map((p, idx) => (
        '<div style="position: relative; border-radius: 8px; overflow: hidden; border: 1.5px solid ' + (p.isFeatured ? '#2563EB' : '#E2E8F0') + '; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.05); transition: all 0.15s ease;" onmouseover="this.style.borderColor=\'' + (p.isFeatured ? '#2563EB' : '#CBD5E1') + '\'">' +
          '<img src="' + p.url + '" alt="' + escapeHtml(p.caption) + '" style="width: 100%; height: 60px; object-fit: cover; display: block;" onerror="this.src=\'images/banner.jpg\'">' +
          '<div style="padding: 3px 5px; font-size: 9.5px; color: #334155; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; background: white;" title="' + escapeHtml(p.caption) + '">' +
            escapeHtml(p.caption || ('Ảnh ' + (idx + 1))) +
          '</div>' +
          '<div style="display: flex; gap: 3px; padding: 3px 4px; background: #F8FAFC; border-top: 1px solid #F1F5F9;">' +
            '<button type="button" onclick="insertPhotoIntoCanvas(\'' + p.url + '\', \'' + escapeHtml(p.caption || '') + '\')" style="flex: 1; background: #EFF6FF; color: #1D4ED8; border: none; border-radius: 4px; font-size: 9.5px; font-weight: 700; padding: 2px 4px; cursor: pointer; transition: background 0.15s;" onmouseover="this.style.background=\'#DBEAFE\'" onmouseout="this.style.background=\'#EFF6FF\'" title="Chèn vào bài báo">+ Chèn</button>' +
            '<button type="button" onclick="setComposerFeaturedPhoto(' + idx + ')" style="background: ' + (p.isFeatured ? '#2563EB' : '#F1F5F9') + '; color: ' + (p.isFeatured ? 'white' : '#64748B') + '; border: none; border-radius: 4px; font-size: 9.5px; font-weight: 700; padding: 2px 5px; cursor: pointer;" title="' + (p.isFeatured ? 'Ảnh đại diện chính' : 'Đặt làm ảnh chính') + '">★</button>' +
          '</div>' +
          '<button type="button" onclick="removeComposerPhoto(' + idx + ')" style="position: absolute; top: 3px; right: 3px; background: rgba(15,23,42,0.7); color: white; border: none; border-radius: 50%; width: 18px; height: 18px; font-size: 9px; cursor: pointer; display: flex; align-items: center; justify-content: center; line-height: 1;" title="Xóa ảnh">✕</button>' +
          (p.isFeatured ? '<span style="position: absolute; top: 3px; left: 3px; background: #2563EB; color: white; font-size: 8px; font-weight: 800; padding: 1px 5px; border-radius: 4px; box-shadow: 0 1px 2px rgba(0,0,0,0.2);">Đại diện</span>' : '') +
        '</div>'
      )).join('') +
    '</div>'
  );
}

function setComposerFeaturedPhoto(idx) {
  if (!composerState.photos || !composerState.photos[idx]) return;
  composerState.photos.forEach((p, i) => { p.isFeatured = (i === idx); });
  renderComposerPhotosList();
  logComposerActivity('feat_img', 'Đã chọn ảnh "' + (composerState.photos[idx].caption || 'Ảnh ' + (idx + 1)) + '" làm Ảnh Chính đại diện bài báo.', 'done');
}

function removeComposerPhoto(idx) {
  composerState.photos.splice(idx, 1);
  if (composerState.photos.length > 0 && !composerState.photos.some(p => p.isFeatured)) {
    composerState.photos[0].isFeatured = true;
  }
  renderComposerPhotosList();
}

function closeUploadAssetModal() {
  const modal = document.getElementById('upload_asset_modal');
  if (modal) modal.style.display = 'none';
}

function openUploadAssetModal() {
  const modal = document.getElementById('upload_asset_modal');
  if (modal) modal.style.display = 'flex';
}

function handleStudioFileUpload(input) {
  if (input && input.files && input.files.length) {
    handleComposerFiles(input.files);
    closeUploadAssetModal();
    input.value = '';
  }
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
    genre: 'auto', // AI tự động phân tích hồ sơ tư liệu để xác định chủ đề và thể loại
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
            webHtml += fixVietnameseFont(evt.chunk);
            if (canvas) {
              // Dynamic block routing
              const titleMatch = webHtml.match(/<h1[^>]*>(.*?)<\/h1>/i);
              if (titleMatch) {
                const curTitle = fixVietnameseFont(titleMatch[1].replace(/<[^>]*>/g, '').trim());
                safeSetVal('composer_title_input', curTitle);
                composerState.masterArticle.title = curTitle;
              }
              const sapoMatch = webHtml.match(/<p class="sapo"[^>]*>.*?<strong>(.*?)<\/strong>/i);
              if (sapoMatch) {
                const curSapo = fixVietnameseFont(sapoMatch[1].replace(/<[^>]*>/g, '').trim());
                safeSetVal('composer_sapo_input', curSapo);
                composerState.masterArticle.sapo = curSapo;
              }

              // Strip h1 and sapo from canvas so they live in dedicated semantic blocks
              let bodyClean = webHtml;
              if (titleMatch) bodyClean = bodyClean.replace(/<h1[^>]*>.*?<\/h1>/i, '');
              if (sapoMatch) bodyClean = bodyClean.replace(/<p class="sapo"[^>]*>.*?<\/p>/i, '');

              // If no photos uploaded, strip any hallucinated <figure> or <img> tags
              if (!composerState.photos || composerState.photos.length === 0) {
                bodyClean = bodyClean.replace(/<figure[\s\S]*?<\/figure>/gi, '').replace(/<img[^>]*>/gi, '');
              }

              canvas.innerHTML = fixVietnameseFont(bodyClean).trim();
              attachCanvasImageDefense(canvas);
              canvas.scrollTop = canvas.scrollHeight;
              updateComposerMetrics();
            }
          } else if (evt.step === 'social_done') {
            fbCaption = fixVietnameseFont(evt.facebook?.caption || '');
            zaloMessage = fixVietnameseFont(evt.zalo?.message || '');

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
            extractedTitle = fixVietnameseFont(evt.title || '');
            extractedSummary = fixVietnameseFont(evt.summary || '');
            composerState.activeArticleId = articleId;
            saveComposerAutosave();
            loadDraftsList();
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
    extractedTitle = fixVietnameseFont(extractedTitle);

    if (!extractedSummary) {
      const sapoMatch = webHtml.match(/<p class="sapo"[^>]*>.*?<strong>(.*?)<\/strong>/i);
      extractedSummary = sapoMatch ? sapoMatch[1].replace(/<[^>]*>/g, '').trim() : webHtml.replace(/<[^>]*>/g, '').slice(0, 180);
    }
    extractedSummary = fixVietnameseFont(extractedSummary);

    composerState.masterArticle.title = extractedTitle;
    composerState.masterArticle.sapo = extractedSummary;

    safeSetVal('composer_title_input', extractedTitle);
    safeSetVal('composer_sapo_input', extractedSummary);

    // Clean out h1 AND sapo from body to keep them strictly in their dedicated blocks
    let cleanBody = webHtml
      .replace(/<h1[^>]*>.*?<\/h1>/i, '')
      .replace(/<p class="sapo"[^>]*>.*?<\/p>/i, '')
      .trim();

    if (!composerState.photos || composerState.photos.length === 0) {
      cleanBody = cleanBody.replace(/<figure[\s\S]*?<\/figure>/gi, '').replace(/<img[^>]*>/gi, '');
    }
    cleanBody = fixVietnameseFont(cleanBody);

    if (canvas) {
      canvas.innerHTML = cleanBody;
      attachCanvasImageDefense(canvas);
    }
    composerState.masterArticle.bodyHtml = cleanBody;

    saveComposerAutosave();
    loadDraftsList();
    updateComposerMetrics();
    logComposerActivity('complete', 'Hoàn tất bài báo #' + (articleId || '') + '! Bản thảo đã được lưu vào CSDL MSSQL & Tủ Bản Thảo.', 'done');

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
  renderComposerPhotosList();
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

  if (!title && !sapo && (!content || content.includes('Nội dung bài báo sẽ xuất hiện tại đây'))) {
    alert("⚠️ Vui lòng nhập tiêu đề hoặc nội dung bài báo trước khi lưu!");
    return;
  }

  const featuredPhoto = (composerState.photos || []).find(p => p.isFeatured) || (composerState.photos || [])[0];
  const payload = {
    title: title || 'Bản Thảo Chưa Đặt Tiêu Đề',
    summary: sapo,
    content,
    categoryId: 2,
    categoryName: 'Bản Thảo AI',
    image: featuredPhoto ? featuredPhoto.url : 'images/banner.jpg',
    status: 'draft',
    packageData: {
      facebook: { caption: document.getElementById('composer_fb_caption')?.value || '', photos: composerState.facebookPhotos || [] },
      zalo: { message: document.getElementById('composer_zalo_caption')?.value || '' },
      photos: composerState.photos || []
    }
  };

  try {
    let res;
    if (composerState.activeArticleId) {
      res = await fetch('/api/articles/' + composerState.activeArticleId, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(r => r.json());
    } else {
      res = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(r => r.json());
      if (res.success && res.data && res.data.id) {
        composerState.activeArticleId = res.data.id;
      }
    }

    if (res.success) {
      saveComposerAutosave();
      await loadDraftsList();
      logComposerActivity('save', 'Đã lưu bản nháp thành công vào CSDL (Mã #' + (composerState.activeArticleId || (res.data && res.data.id) || '') + ').', 'done');
      alert('💾 Đã lưu thành công Bản Nháp vào Tủ Bản Thảo (Mã #' + (composerState.activeArticleId || (res.data && res.data.id) || '') + ')!');
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

function autoResizeSapo() {
  const el = document.getElementById('composer_sapo_input');
  if (el) {
    el.style.height = 'auto';
    el.style.height = Math.max(52, el.scrollHeight) + 'px';
  }
}

function safeSetVal(id, val) {
  const el = document.getElementById(id);
  if (el) {
    el.value = val;
    if (id === 'composer_sapo_input') {
      autoResizeSapo();
    }
  }
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

// ── IMAGE RESIZE & ALIGNMENT CONTROLS ────────────────────────────────────────

let activeEditorFigure = null;

function initCanvasImageControls() {
  const canvas = document.getElementById('composer_canvas_editor');
  const paneWeb = document.getElementById('pane_web');
  const bar = document.getElementById('image_resizer_floating_bar');
  if (!canvas || !bar || !paneWeb) return;

  canvas.addEventListener('click', (e) => {
    const target = e.target;
    const figure = target.closest('figure') || target.closest('.journalism-figure') || (target.tagName === 'IMG' ? target.closest('figure') || target : null);

    if (figure) {
      if (activeEditorFigure && activeEditorFigure !== figure) {
        activeEditorFigure.style.outline = 'none';
      }
      activeEditorFigure = figure;
      activeEditorFigure.style.outline = '2px solid #0284C7';
      activeEditorFigure.style.outlineOffset = '3px';

      const figRect = figure.getBoundingClientRect();
      const paneRect = paneWeb.getBoundingClientRect();

      bar.style.display = 'flex';
      const topOffset = Math.max(10, (figRect.top - paneRect.top - 46) + paneWeb.scrollTop);
      const leftOffset = Math.max(16, (figRect.left - paneRect.left));
      bar.style.top = topOffset + 'px';
      bar.style.left = leftOffset + 'px';
    } else {
      closeImageResizer();
    }
  });

  document.addEventListener('click', (e) => {
    if (!activeEditorFigure) return;
    if (e.target.closest('#image_resizer_floating_bar') || e.target.closest('#composer_canvas_editor')) return;
    closeImageResizer();
  });
}

function setImageFigureWidth(widthPercent) {
  if (!activeEditorFigure) return;
  pushHistorySnapshot();
  activeEditorFigure.style.width = widthPercent;
  activeEditorFigure.style.maxWidth = '100%';
  if (widthPercent === '100%') {
    activeEditorFigure.style.float = 'none';
    activeEditorFigure.style.margin = '20px auto';
    activeEditorFigure.style.display = 'block';
  }
  const img = activeEditorFigure.querySelector('img') || (activeEditorFigure.tagName === 'IMG' ? activeEditorFigure : null);
  if (img) {
    img.style.width = '100%';
    img.style.height = 'auto';
  }
  saveComposerAutosave();
}

function setImageFigureAlign(align) {
  if (!activeEditorFigure) return;
  pushHistorySnapshot();
  if (align === 'left') {
    activeEditorFigure.style.float = 'left';
    activeEditorFigure.style.margin = '10px 20px 14px 0';
    if (!activeEditorFigure.style.width || activeEditorFigure.style.width === '100%') {
      activeEditorFigure.style.width = '48%';
    }
    activeEditorFigure.style.display = 'block';
  } else if (align === 'right') {
    activeEditorFigure.style.float = 'right';
    activeEditorFigure.style.margin = '10px 0 14px 20px';
    if (!activeEditorFigure.style.width || activeEditorFigure.style.width === '100%') {
      activeEditorFigure.style.width = '48%';
    }
    activeEditorFigure.style.display = 'block';
  } else {
    activeEditorFigure.style.float = 'none';
    activeEditorFigure.style.margin = '20px auto';
    activeEditorFigure.style.display = 'block';
    activeEditorFigure.style.textAlign = 'center';
  }
  saveComposerAutosave();
}

function deleteActiveImageFigure() {
  if (!activeEditorFigure) return;
  pushHistorySnapshot();
  activeEditorFigure.remove();
  activeEditorFigure = null;
  closeImageResizer();
  updateComposerMetrics();
  saveComposerAutosave();
}

function closeImageResizer() {
  const bar = document.getElementById('image_resizer_floating_bar');
  if (bar) bar.style.display = 'none';
  if (activeEditorFigure) {
    activeEditorFigure.style.outline = 'none';
    activeEditorFigure = null;
  }
}

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
    renderComposerPhotosList();
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

// =============================================================================
// PHASE 3: FOLDER DRAG/DROP & 1-CLICK DEMO TINBAIVIET
// =============================================================================

async function getFilesFromDataTransferItems(items) {
  const fileList = [];
  const queue = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.webkitGetAsEntry) {
      const entry = item.webkitGetAsEntry();
      if (entry) queue.push(entry);
    } else if (item.kind === 'file') {
      const f = item.getAsFile();
      if (f) fileList.push(f);
    }
  }

  async function traverseEntry(entry) {
    if (!entry) return;
    if (entry.isFile) {
      try {
        const file = await new Promise((resolve, reject) => entry.file(resolve, reject));
        if (!file.name.startsWith('.') && !file.name.startsWith('~$') && file.name !== 'Thumbs.db') {
          fileList.push(file);
        }
      } catch (err) {}
    } else if (entry.isDirectory) {
      const dirReader = entry.createReader();
      const readEntries = () => new Promise((resolve, reject) => dirReader.readEntries(resolve, reject));
      try {
        let entries = await readEntries();
        while (entries && entries.length > 0) {
          for (const child of entries) {
            await traverseEntry(child);
          }
          entries = await readEntries();
        }
      } catch (dirErr) {}
    }
  }

  for (const entry of queue) {
    await traverseEntry(entry);
  }

  return fileList;
}

async function handleComposerDrop(event) {
  event.preventDefault();
  const dropzone = document.getElementById('composer_dropzone');
  if (dropzone) {
    dropzone.style.borderColor = '#CBD5E1';
    dropzone.style.background = '#F8FAFC';
  }

  if (event.dataTransfer && event.dataTransfer.items) {
    const files = await getFilesFromDataTransferItems(event.dataTransfer.items);
    if (files.length > 0) {
      await handleComposerFiles(files);
      return;
    }
  }

  if (event.dataTransfer && event.dataTransfer.files) {
    await handleComposerFiles(event.dataTransfer.files);
  }
}

async function handleComposerFolder(input) {
  if (input && input.files && input.files.length > 0) {
    await handleComposerFiles(input.files);
    input.value = '';
  }
}

async function loadDemoTinbaivietFolder() {
  logComposerActivity('demo', 'Đang nạp toàn bộ thư mục demo Tinbaiviet từ hệ thống...', 'running');
  try {
    const res = await fetch('/api/documents/demo-tinbaiviet').then(r => r.json());
    if (!res.success || !res.files || !res.files.length) {
      throw new Error(res.error || 'Không tìm thấy dữ liệu thư mục demo');
    }

    const convertedFiles = [];
    for (const f of res.files) {
      const byteCharacters = atob(f.base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: f.type });
      const file = new File([blob], f.name, { type: f.type });
      convertedFiles.push(file);
    }

    await handleComposerFiles(convertedFiles);
    logComposerActivity('demo', `✅ Đã nạp thành công ${convertedFiles.length} tệp tài liệu mẫu từ thư mục Tinbaiviet! Bạn có thể chọn gợi ý prompt hoặc bấm "✨ LẬP BÀI BÁO GỐC" ngay.`, 'done');
  } catch (err) {
    console.error('Demo Tinbaiviet failed:', err);
    logComposerActivity('demo_err', 'Không thể nạp demo Tinbaiviet: ' + err.message, 'error');
  }
}

// =============================================================================
// PHASE 4: INGESTION & RAW EXTRACTION INSPECTOR
// =============================================================================

function openIngestionInspector() {
  const modal = document.getElementById('modal_ingestion_inspector');
  if (!modal) return;
  modal.style.display = 'flex';

  const files = composerState.files || [];
  const photos = composerState.photos || [];

  const totalChars = files.reduce((acc, f) => acc + (f.charCount || (f.text || '').length || 0), 0);
  const successFiles = files.filter(f => (f.text && f.text.trim()) || f.isScannedDoc || f.dataUrl).length;

  safeSetText('insp_stat_files', files.length + ' tệp');
  safeSetText('insp_stat_success', successFiles + ' tệp');
  safeSetText('insp_stat_chars', totalChars.toLocaleString('vi-VN') + ' ký tự');
  safeSetText('insp_stat_photos', photos.length + ' ảnh');

  // 1. Render Raw Text Tab
  const textContainer = document.getElementById('insp_files_text_container');
  if (textContainer) {
    if (!files.length) {
      textContainer.innerHTML = '<div style="color: #94A3B8; font-style: italic; text-align: center; padding: 24px;">Chưa có tệp nào trong khay tư liệu. Hãy kéo thả Folder "Tinbaiviet" hoặc bấm 1-Click Demo!</div>';
    } else {
      textContainer.innerHTML = files.map((f, idx) => {
        const rawText = f.text || '(Tệp hình ảnh hoặc không có text)';
        const charLen = rawText.length;
        const isScan = f.isScannedDoc;
        const ext = (f.name || '').split('.').pop().toUpperCase();
        const badge = isScan
          ? '<span style="background: #EFF6FF; color: #1D4ED8; font-size: 11px; font-weight: 800; padding: 3px 8px; border-radius: 6px; border: 1px solid #BFDBFE;">📄 Đã OCR (Tài liệu Scan)</span>'
          : charLen > 0
          ? '<span style="background: #DCFCE7; color: #15803D; font-size: 11px; font-weight: 800; padding: 3px 8px; border-radius: 6px; border: 1px solid #BBF7D0;">✓ Bóc tách thành công (' + charLen.toLocaleString('vi-VN') + ' ký tự)</span>'
          : '<span style="background: #FEF2F2; color: #DC2626; font-size: 11px; font-weight: 800; padding: 3px 8px; border-radius: 6px; border: 1px solid #FECACA;">⚠️ Không có text</span>';

        return (
          '<div style="border: 1px solid #E2E8F0; border-radius: 8px; overflow: hidden; background: white;">' +
            '<div style="background: #F8FAFC; padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #E2E8F0;">' +
              '<div style="display: flex; align-items: center; gap: 8px;">' +
                '<span style="background: #002855; color: #FCD34D; font-size: 10.5px; font-weight: 900; padding: 2px 6px; border-radius: 4px;">' + ext + '</span>' +
                '<span style="font-weight: 800; font-size: 13px; color: #002855;">' + escapeHtml(f.name) + '</span>' +
                '<span style="font-size: 11.5px; color: #64748B;">(' + f.size + ')</span>' +
              '</div>' +
              '<div>' + badge + '</div>' +
            '</div>' +
            '<div style="padding: 10px 14px;">' +
              '<pre style="margin: 0; background: #0F172A; color: #E2E8F0; padding: 12px; border-radius: 6px; font-size: 12px; line-height: 1.55; max-height: 180px; overflow-y: auto; white-space: pre-wrap; font-family: Consolas, Menlo, monospace;">' + escapeHtml(rawText.slice(0, 15000)) + (rawText.length > 15000 ? '\n\n...[Đã cắt gọn hiển thị 15,000 ký tự đầu]...' : '') + '</pre>' +
            '</div>' +
          '</div>'
        );
      }).join('');
    }
  }

  // 2. Render Media Tab
  const mediaGrid = document.getElementById('insp_media_grid');
  if (mediaGrid) {
    if (!photos.length) {
      mediaGrid.innerHTML = '<div style="color: #94A3B8; font-style: italic; text-align: center; grid-column: 1/-1; padding: 24px;">Chưa có ảnh tư liệu nào được trích xuất.</div>';
    } else {
      mediaGrid.innerHTML = photos.map((p, pIdx) => {
        const featBadge = p.isFeatured
          ? '<span style="background: #D97706; color: white; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px;">★ Ảnh Chính</span>'
          : '';
        return (
          '<div style="border: 1px solid #E2E8F0; border-radius: 8px; overflow: hidden; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.05); display: flex; flex-direction: column;">' +
            '<div style="height: 130px; background: #0F172A; position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center;">' +
              '<img src="' + p.url + '" style="max-width: 100%; max-height: 100%; object-fit: contain;" onerror="this.src=\'images/banner.jpg\'">' +
              '<div style="position: absolute; top: 6px; left: 6px;">' + featBadge + '</div>' +
            '</div>' +
            '<div style="padding: 10px; font-size: 11.5px; display: flex; flex-direction: column; gap: 4px; flex: 1;">' +
              '<div style="font-weight: 700; color: #002855; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="' + escapeHtml(p.caption || '') + '">' + escapeHtml(p.caption || 'Ảnh tư liệu') + '</div>' +
              '<div style="color: #16A34A; font-weight: 600; font-size: 10.5px;">✓ Đã kiểm định chuẩn báo chí</div>' +
              '<div style="margin-top: auto; display: flex; gap: 6px; padding-top: 6px;">' +
                '<button type="button" onclick="setComposerFeaturedPhoto(' + pIdx + ')" style="flex: 1; background: #F1F5F9; border: 1px solid #CBD5E1; color: #002855; padding: 4px; border-radius: 4px; font-size: 10.5px; font-weight: 700; cursor: pointer;">Gán ảnh chính</button>' +
                '<button type="button" onclick="insertPhotoIntoCanvas(\'' + p.url + '\', \'' + escapeHtml(p.caption || '') + '\')" style="background: #0284C7; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 10.5px; font-weight: 700; cursor: pointer;">+ Chèn</button>' +
              '</div>' +
            '</div>' +
          '</div>'
        );
      }).join('');
    }
  }
}

function closeIngestionInspector() {
  const modal = document.getElementById('modal_ingestion_inspector');
  if (modal) modal.style.display = 'none';
}

function switchInspectorSubtab(tab) {
  const btnText = document.getElementById('insp_subtab_text');
  const btnMedia = document.getElementById('insp_subtab_media');
  const panelText = document.getElementById('insp_panel_text');
  const panelMedia = document.getElementById('insp_panel_media');

  if (tab === 'text') {
    if (btnText) { btnText.style.background = '#002855'; btnText.style.color = 'white'; }
    if (btnMedia) { btnMedia.style.background = '#F1F5F9'; btnMedia.style.color = '#475569'; }
    if (panelText) panelText.style.display = 'block';
    if (panelMedia) panelMedia.style.display = 'none';
  } else {
    if (btnText) { btnText.style.background = '#F1F5F9'; btnText.style.color = '#475569'; }
    if (btnMedia) { btnMedia.style.background = '#002855'; btnMedia.style.color = 'white'; }
    if (panelText) panelText.style.display = 'none';
    if (panelMedia) panelMedia.style.display = 'block';
  }
}

// =============================================================================
// PHASE 5: UNIFIED UNDO / REDO ENGINE & TYPOGRAPHY
// =============================================================================

const composerHistory = {
  undoStack: [],
  redoStack: [],
  maxHistory: 30
};

function pushHistorySnapshot() {
  try {
    const title = (document.getElementById('composer_title_input')?.value || '').trim();
    const sapo = (document.getElementById('composer_sapo_input')?.value || '').trim();
    const canvas = document.getElementById('composer_canvas_editor');
    const bodyHtml = (canvas?.innerHTML || '').trim();

    const last = composerHistory.undoStack[composerHistory.undoStack.length - 1];
    if (last && last.bodyHtml === bodyHtml && last.title === title && last.sapo === sapo) {
      return;
    }

    composerHistory.undoStack.push({ title, sapo, bodyHtml, timestamp: Date.now() });
    if (composerHistory.undoStack.length > composerHistory.maxHistory) {
      composerHistory.undoStack.shift();
    }
    composerHistory.redoStack = [];
    updateUndoRedoButtons();
  } catch (e) {}
}

function composerUndo() {
  if (!composerHistory.undoStack.length) return;
  const canvas = document.getElementById('composer_canvas_editor');
  const current = {
    title: document.getElementById('composer_title_input')?.value || '',
    sapo: document.getElementById('composer_sapo_input')?.value || '',
    bodyHtml: canvas?.innerHTML || '',
    timestamp: Date.now()
  };
  composerHistory.redoStack.push(current);

  const prev = composerHistory.undoStack.pop();
  if (prev) {
    safeSetVal('composer_title_input', prev.title);
    safeSetVal('composer_sapo_input', prev.sapo);
    if (canvas) canvas.innerHTML = prev.bodyHtml;
    updateComposerMetrics();
    updateUndoRedoButtons();
    saveComposerAutosave();
  }
}

function composerRedo() {
  if (!composerHistory.redoStack.length) return;
  const canvas = document.getElementById('composer_canvas_editor');
  const current = {
    title: document.getElementById('composer_title_input')?.value || '',
    sapo: document.getElementById('composer_sapo_input')?.value || '',
    bodyHtml: canvas?.innerHTML || '',
    timestamp: Date.now()
  };
  composerHistory.undoStack.push(current);

  const next = composerHistory.redoStack.pop();
  if (next) {
    safeSetVal('composer_title_input', next.title);
    safeSetVal('composer_sapo_input', next.sapo);
    if (canvas) canvas.innerHTML = next.bodyHtml;
    updateComposerMetrics();
    updateUndoRedoButtons();
    saveComposerAutosave();
  }
}

function updateUndoRedoButtons() {
  const btnUndo = document.getElementById('btn_composer_undo');
  const btnRedo = document.getElementById('btn_composer_redo');
  if (btnUndo) {
    btnUndo.disabled = composerHistory.undoStack.length === 0;
    btnUndo.style.opacity = composerHistory.undoStack.length === 0 ? '0.45' : '1';
  }
  if (btnRedo) {
    btnRedo.disabled = composerHistory.redoStack.length === 0;
    btnRedo.style.opacity = composerHistory.redoStack.length === 0 ? '0.45' : '1';
  }
}

let typingTimer = null;
function handleCanvasUserInput() {
  updateComposerMetrics();
  clearTimeout(typingTimer);
  typingTimer = setTimeout(() => {
    pushHistorySnapshot();
    saveComposerAutosave();
  }, 600);
}

function applyComposerFontFamily(fontFamily) {
  pushHistorySnapshot();
  const selection = window.getSelection();
  if (selection && !selection.isCollapsed && selection.rangeCount > 0) {
    document.execCommand('fontName', false, fontFamily);
  } else {
    const canvas = document.getElementById('composer_canvas_editor');
    if (canvas) canvas.style.fontFamily = fontFamily;
  }
  saveComposerAutosave();
}

function applyComposerFontSize(fontSize) {
  pushHistorySnapshot();
  const selection = window.getSelection();
  if (selection && !selection.isCollapsed && selection.rangeCount > 0) {
    const span = document.createElement('span');
    span.style.fontSize = fontSize;
    span.style.lineHeight = '1.6';
    const range = selection.getRangeAt(0);
    try {
      range.surroundContents(span);
    } catch (e) {
      document.execCommand('fontSize', false, '4');
    }
  } else {
    const canvas = document.getElementById('composer_canvas_editor');
    if (canvas) canvas.style.fontSize = fontSize;
  }
  saveComposerAutosave();
}

// =============================================================================
// PHASE 6: INLINE SELECTION AI COPILOT ("NÓI GÌ NÓ SỬA ĐÓ")
// =============================================================================

let currentCopilotRange = null;

function initInlineSelectionAssistant() {
  const canvas = document.getElementById('composer_canvas_editor');
  const copilot = document.getElementById('floating_inline_ai_copilot');
  if (!canvas || !copilot) return;

  const handleSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      copilot.style.display = 'none';
      return;
    }

    const anchor = selection.anchorNode;
    if (!canvas.contains(anchor)) {
      copilot.style.display = 'none';
      return;
    }

    try {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      if (rect.width === 0) {
        copilot.style.display = 'none';
        return;
      }

      currentCopilotRange = range.cloneRange();

      const left = Math.max(16, Math.min(window.innerWidth - 410, rect.left + window.scrollX));
      let top = rect.top + window.scrollY - 105;
      if (top < 10) {
        top = rect.bottom + window.scrollY + 10;
      }

      copilot.style.left = left + 'px';
      copilot.style.top = top + 'px';
      copilot.style.display = 'block';

      const status = document.getElementById('inline_ai_status');
      if (status) status.textContent = 'Nói gì sửa đó...';
      const input = document.getElementById('inline_ai_prompt_input');
      if (input) input.focus();
    } catch (e) {
      copilot.style.display = 'none';
    }
  };

  canvas.addEventListener('mouseup', () => setTimeout(handleSelection, 50));
  canvas.addEventListener('keyup', (e) => {
    if (['Shift', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
      setTimeout(handleSelection, 50);
    }
  });

  document.addEventListener('mousedown', (e) => {
    if (copilot && !copilot.contains(e.target) && !canvas.contains(e.target)) {
      copilot.style.display = 'none';
    }
  });

  // Attach Ctrl+Z / Ctrl+Y keyboard shortcuts to Canvas
  canvas.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault();
      if (e.shiftKey) composerRedo();
      else composerUndo();
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
      e.preventDefault();
      composerRedo();
    }
  });
}

function closeInlineAiCopilot() {
  const copilot = document.getElementById('floating_inline_ai_copilot');
  if (copilot) copilot.style.display = 'none';
}

async function submitInlineSelectionPrompt() {
  if (!currentCopilotRange) return;
  const input = document.getElementById('inline_ai_prompt_input');
  const instruction = (input?.value || '').trim();
  const selectedText = currentCopilotRange.toString().trim();

  if (!selectedText) {
    alert('Vui lòng bôi đen đoạn văn bản cần sửa!');
    return;
  }

  const status = document.getElementById('inline_ai_status');
  if (status) status.textContent = '⚡ Đang viết lại...';

  try {
    const canvas = document.getElementById('composer_canvas_editor');
    const fullContext = canvas?.innerText || '';

    const res = await fetch('/api/ai/inline-edit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        selectedText,
        instruction: instruction || 'Chỉnh sửa mạch lạc, trang trọng chuẩn báo chí',
        fullContext
      })
    }).then(r => r.json());

    if (res.success && res.rewrittenText) {
      pushHistorySnapshot();
      currentCopilotRange.deleteContents();
      const span = document.createElement('span');
      span.style.background = '#FEF08A';
      span.style.transition = 'background 1.5s ease-out';
      span.innerText = res.rewrittenText;
      currentCopilotRange.insertNode(span);
      setTimeout(() => {
        span.style.background = 'transparent';
      }, 1200);

      closeInlineAiCopilot();
      if (input) input.value = '';
      handleCanvasUserInput();
      logComposerActivity('inline_edit', `Đã sửa đoạn văn bản: "${res.rewrittenText.slice(0, 36)}..."`, 'done');
    } else {
      alert('Lỗi AI: ' + (res.error || 'Không thể viết lại đoạn văn'));
      if (status) status.textContent = 'Lỗi xử lý';
    }
  } catch (err) {
    alert('Lỗi kết nối AI: ' + err.message);
    if (status) status.textContent = 'Lỗi kết nối';
  }
}

function submitInlineQuickAction(action) {
  const input = document.getElementById('inline_ai_prompt_input');
  const actionMap = {
    'formal': 'Viết lại trang trọng, chuẩn mực hành chính theo Nghị định 30/2020/NĐ-CP',
    'shorten': 'Rút gọn súc tích 50% nhưng giữ nguyên các sự thật và số liệu quan trọng',
    'expand': 'Mở rộng phân tích chiều sâu, làm rõ bối cảnh và ý nghĩa hoạt động',
    'grammar': 'Sửa toàn bộ lỗi chính tả, câu từ, diễn đạt mượt mà và gãy gọn',
    'warm': 'Đổi giọng văn ấm áp, truyền cảm, nêu bật tinh thần đại đoàn kết viên chức'
  };
  if (input) input.value = actionMap[action] || '';
  submitInlineSelectionPrompt();
}

// =============================================================================
// PHASE 7: DRAFTS MANAGEMENT DRAWER (CSDL PERSISTENCE)
// =============================================================================

function openDraftsDrawer() {
  const drawer = document.getElementById('drawer_composer_drafts');
  if (drawer) {
    drawer.style.display = 'flex';
    loadDraftsList();
  }
}

function closeDraftsDrawer() {
  const drawer = document.getElementById('drawer_composer_drafts');
  if (drawer) drawer.style.display = 'none';
}

async function loadDraftsList() {
  const container = document.getElementById('drawer_drafts_list');
  if (!container) return;

  try {
    const res = await fetch('/api/articles/drafts').then(r => r.json());
    const drafts = res.data || [];

    const badge = document.getElementById('composer_drafts_count_badge');
    if (badge) badge.textContent = drafts.length;

    if (!drafts.length) {
      container.innerHTML = '<div style="color: #94A3B8; font-style: italic; text-align: center; padding: 40px 0;">Chưa có bản thảo nào trong hệ thống. Nạp tư liệu và bấm Lưu Nháp để tạo mới!</div>';
      return;
    }

    container.innerHTML = drafts.map(d => {
      const dt = d.createdAt ? new Date(d.createdAt).toLocaleString('vi-VN') : 'Mới tạo';
      const isActive = composerState.activeArticleId == d.id;
      const roleBadge = d.author === 'Cộng Tác Viên'
        ? '<span style="background: #FEF3C7; color: #B45309; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px;">CTV Gửi</span>'
        : '<span style="background: #EFF6FF; color: #1D4ED8; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px;">BTV Soạn</span>';

      return (
        '<div style="border: 1.5px solid ' + (isActive ? '#0284C7' : '#E2E8F0') + '; background: ' + (isActive ? '#F0F9FF' : 'white') + '; border-radius: 8px; padding: 12px 14px; display: flex; flex-direction: column; gap: 6px; transition: all 0.2s;">' +
          '<div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">' +
            '<div style="font-weight: 800; font-size: 13.5px; color: #002855; line-height: 1.35;">' + escapeHtml(d.title || 'Bản thảo chưa đặt tiêu đề #' + d.id) + '</div>' +
            '<div>' + roleBadge + '</div>' +
          '</div>' +
          '<div style="font-size: 11.5px; color: #64748B;">Lưu lúc: ' + dt + '</div>' +
          '<div style="font-size: 12px; color: #475569; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">' + escapeHtml(d.summary || '') + '</div>' +
          '<div style="display: flex; gap: 8px; margin-top: 4px; padding-top: 6px; border-top: 1px solid #F1F5F9;">' +
            '<button type="button" onclick="switchActiveDraft(' + d.id + ')" style="flex: 1; background: ' + (isActive ? '#0284C7' : '#F8FAFC') + '; color: ' + (isActive ? 'white' : '#002855') + '; border: 1px solid ' + (isActive ? '#0284C7' : '#CBD5E1') + '; padding: 5px; border-radius: 6px; font-size: 11.5px; font-weight: 800; cursor: pointer;">' + (isActive ? '✓ Đang mở' : '✏️ Mở soạn tiếp') + '</button>' +
            '<button type="button" onclick="deleteDraftArticle(' + d.id + ')" style="background: none; border: 1px solid #FECACA; color: #DC2626; padding: 5px 8px; border-radius: 6px; font-size: 11.5px; cursor: pointer;" title="Xóa bản thảo">🗑️</button>' +
          '</div>' +
        '</div>'
      );
    }).join('');
  } catch (err) {
    container.innerHTML = '<div style="color: #DC2626;">Lỗi tải danh sách bản thảo.</div>';
  }
}

async function switchActiveDraft(articleId) {
  try {
    const res = await fetch('/api/articles/' + articleId).then(r => r.json());
    if (!res.success || !res.data) throw new Error(res.error || 'Không tìm thấy bài viết');
    const art = res.data;

    composerState.activeArticleId = art.id;
    safeSetVal('composer_title_input', art.title || '');
    safeSetVal('composer_sapo_input', art.summary || '');
    const canvas = document.getElementById('composer_canvas_editor');
    if (canvas) canvas.innerHTML = art.content || '';

    if (art.packageData && art.packageData.facebook) {
      safeSetVal('composer_fb_caption', art.packageData.facebook.caption || '');
      safeSetText('composer_fb_preview_text', art.packageData.facebook.caption || '');
    }
    if (art.packageData && art.packageData.zalo) {
      safeSetVal('composer_zalo_caption', art.packageData.zalo.message || '');
      updateZaloPreview(art.packageData.zalo.message || '');
    }
    if (art.photos && Array.isArray(art.photos)) {
      composerState.photos = art.photos;
      renderComposerPhotosList();
      renderFbAssetPicker();
    }

    pushHistorySnapshot();
    if (canvas) attachCanvasImageDefense(canvas);
    updateComposerMetrics();
    saveComposerAutosave();
    closeDraftsDrawer();
    logComposerActivity('draft_switch', 'Đã mở bản thảo #' + art.id + ' ("' + art.title + '")', 'done');
  } catch (err) {
    alert('Lỗi mở bản thảo: ' + err.message);
  }
}

function createNewDraftArticle() {
  if (confirm('Tạo bản thảo mới? Mọi nội dung đang soạn sẽ được giữ trong CSDL.')) {
    saveComposerDraft();
    composerState.activeArticleId = null;
    composerState.files = [];
    composerState.photos = [];
    safeSetVal('composer_title_input', '');
    safeSetVal('composer_sapo_input', '');
    const canvas = document.getElementById('composer_canvas_editor');
    if (canvas) canvas.innerHTML = '<p style="color: #94A3B8; font-style: italic;">Nội dung bài báo mới...</p>';
    safeSetVal('composer_fb_caption', '');
    safeSetVal('composer_zalo_caption', '');
    renderComposerFilesList();
    renderComposerPhotosList();
    renderFbAssetPicker();
    pushHistorySnapshot();
    updateComposerMetrics();
    closeDraftsDrawer();
    logComposerActivity('new_draft', 'Đã tạo bản thảo mới sẵn sàng nạp tư liệu.', 'done');
  }
}

async function deleteDraftArticle(id) {
  if (!confirm('Xóa vĩnh viễn bản thảo #' + id + ' khỏi CSDL?')) return;
  try {
    await fetch('/api/articles/' + id, { method: 'DELETE' });
    if (composerState.activeArticleId == id) {
      composerState.activeArticleId = null;
    }
    loadDraftsList();
  } catch (err) {
    alert('Lỗi xóa: ' + err.message);
  }
}

// =============================================================================
// PHASE 8: MULTI-PLATFORM SYNDICATION (FACEBOOK TOOLS & ZALO OA)
// =============================================================================

function renderFbAssetPicker() {
  const container = document.getElementById('fb_asset_picker_grid');
  if (!container) return;
  const photos = composerState.photos || [];
  if (!photos.length) {
    container.innerHTML = '<span style="font-size: 11.5px; color: #94A3B8; font-style: italic;">Chưa có ảnh trong kho Tinbaiviet.</span>';
    return;
  }

  container.innerHTML = photos.map((p) => {
    const isSelected = (composerState.facebookPhotos || []).includes(p.url);
    return (
      '<div onclick="toggleFbPhotoSelection(\'' + p.url + '\')" style="position: relative; width: 68px; height: 68px; border-radius: 6px; overflow: hidden; cursor: pointer; border: 2.5px solid ' + (isSelected ? '#1877F2' : '#CBD5E1') + '; flex-shrink: 0;" title="Bấm để chọn/bỏ chọn">' +
        '<img src="' + p.url + '" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src=\'images/banner.jpg\'">' +
        (isSelected ? '<div style="position: absolute; top: 2px; right: 2px; background: #1877F2; color: white; border-radius: 50%; width: 18px; height: 18px; font-size: 10px; display: flex; align-items: center; justify-content: center; font-weight: 900;">✓</div>' : '') +
      '</div>'
    );
  }).join('');
}

function toggleFbPhotoSelection(url) {
  composerState.facebookPhotos = composerState.facebookPhotos || [];
  const idx = composerState.facebookPhotos.indexOf(url);
  if (idx > -1) {
    composerState.facebookPhotos.splice(idx, 1);
  } else {
    composerState.facebookPhotos.push(url);
  }
  renderFbAssetPicker();
  renderFbPreviewPhotos();
}

function renderFbPreviewPhotos() {
  const preview = document.getElementById('composer_fb_img_preview');
  if (!preview) return;
  const list = composerState.facebookPhotos || [];
  if (!list.length) {
    preview.style.display = 'none';
    preview.innerHTML = '';
    return;
  }
  preview.style.display = 'block';
  preview.innerHTML = '<div style="display: grid; grid-template-columns: repeat(' + Math.min(3, list.length) + ', 1fr); gap: 4px; margin-top: 8px;">' +
    list.map(u => '<img src="' + u + '" style="width: 100%; height: 120px; object-fit: cover; border-radius: 4px;">').join('') +
  '</div>';
}

function applyFbRatioGuide(ratio) {
  const tips = {
    '1:1': '📐 Khung Vuông 1:1 (1200x1200px): Hiển thị đồng đều trên cả máy tính và di động, tối ưu bài 1 ảnh.',
    '4:5': '📱 Khung Dọc 4:5 (1080x1350px): Chiếm diện tích hiển thị lớn nhất trên màn hình Newsfeed di động.',
    '16:9': '🖥️ Khung Ngang 16:9 (1200x675px): Chuẩn cho video cover hoặc ảnh chụp toàn cảnh sự kiện.',
    'album4': '🖼️ Bố cục Album 4 ảnh: 1 ảnh lớn dọc 4:5 bên trái + 3 ảnh vuông nhỏ xếp tầng bên phải.'
  };
  alert(tips[ratio] || 'Tỷ lệ chuẩn Facebook');
}

function insertFbEmoji(emoji) {
  const caption = document.getElementById('composer_fb_caption');
  if (!caption) return;
  const start = caption.selectionStart || caption.value.length;
  caption.value = caption.value.slice(0, start) + emoji + caption.value.slice(start);
  caption.focus();
  safeSetText('composer_fb_preview_text', caption.value);
}

function insertFbHashtag(tag) {
  const caption = document.getElementById('composer_fb_caption');
  if (!caption) return;
  if (!caption.value.includes(tag)) {
    caption.value = caption.value.trim() + '\n\n' + tag;
    safeSetText('composer_fb_preview_text', caption.value);
  }
}

function syncFbFromWebMaster() {
  const title = (document.getElementById('composer_title_input')?.value || '').trim();
  const sapo = (document.getElementById('composer_sapo_input')?.value || '').trim();
  if (!title) { alert('Chưa có tiêu đề bài báo!'); return; }

  const text = `${title.toUpperCase()}\n\n✨ ${sapo}\n\n👉 Kính mời quý Thầy/Cô và Đoàn viên theo dõi bài viết chi tiết trên Cổng thông tin Công đoàn TDMU!\n\n#CongDoanTDMU #TDMU2026 #HoatDongDoanVien`;
  safeSetVal('composer_fb_caption', text);
  safeSetText('composer_fb_preview_text', text);
  logComposerActivity('fb_sync', 'Đã đồng bộ nội dung từ bài báo sang Facebook Fanpage.', 'done');
}

function syncZaloFromWebMaster() {
  const title = (document.getElementById('composer_title_input')?.value || '').trim();
  const sapo = (document.getElementById('composer_sapo_input')?.value || '').trim();
  if (!title) { alert('Chưa có tiêu đề bài báo!'); return; }

  const text = `*THÔNG BÁO CÔNG ĐOÀN TDMU*\n\n*${title}*\n\n${sapo}\n\nTrân trọng kính mời quý Thầy/Cô xem bài đầy đủ trên Website Công đoàn.`;
  safeSetVal('composer_zalo_caption', text);
  updateZaloPreview(text);
  logComposerActivity('zalo_sync', 'Đã đồng bộ nội dung từ bài báo sang Zalo OA.', 'done');
}

function updateZaloPreview(val) {
  safeSetText('composer_zalo_preview_text', val);
  const countEl = document.getElementById('zalo_char_count');
  if (countEl) {
    countEl.textContent = (val || '').length + ' / 1000 ký tự';
    countEl.style.color = (val || '').length > 1000 ? '#DC2626' : '#64748B';
  }
}

// =============================================================================
// PHASE 9: ROLE WORKFLOW (CONTRIBUTOR COLLECTOR VS EDITOR PUBLISHER)
// =============================================================================

function switchComposerRole(role) {
  composerState.activeRole = role;
  const btnLive = document.getElementById('btn_composer_publish_live');
  const btnCtv = document.getElementById('btn_composer_submit_ctv');
  if (role === 'contributor') {
    if (btnLive) btnLive.style.display = 'none';
    if (btnCtv) btnCtv.style.display = 'flex';
    alert('👤 Chế độ Cộng Tác Viên: Chuyên thu thập thư mục tư liệu "Tinbaiviet" và gửi gói tin lên Ban Biên Tập.');
  } else {
    if (btnLive) btnLive.style.display = 'flex';
    if (btnCtv) btnCtv.style.display = 'none';
  }
}

async function submitContributorDossier() {
  const title = (document.getElementById('composer_title_input')?.value || '').trim();
  if (!title) {
    alert('Vui lòng nhập tên gói tư liệu hoặc sự kiện!');
    return;
  }
  const payload = {
    title: '[TƯ LIỆU CTV] ' + title,
    summary: (document.getElementById('composer_sapo_input')?.value || '').trim(),
    content: (document.getElementById('composer_canvas_editor')?.innerHTML || '').trim(),
    author: 'Cộng Tác Viên',
    status: 'draft',
    packageData: {
      files: composerState.files || [],
      photos: composerState.photos || [],
      directive: document.getElementById('composer_prompt_input')?.value || '',
      genre: document.getElementById('composer_genre_select')?.value || 'tin_hoat_dong'
    }
  };

  try {
    const res = await fetch('/api/articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(r => r.json());

    if (res.success) {
      alert('📤 Gói tư liệu đã được gửi thành công lên Ban Biên Tập (Mã #' + res.data.id + ')!\n\nBiên tập viên sẽ mở bản nháp để duyệt và xuất bản.');
      loadDraftsList();
    } else {
      alert('Lỗi: ' + res.error);
    }
  } catch (e) {
    alert('Lỗi nộp tư liệu: ' + e.message);
  }
}

function insertPhotoIntoCanvas(url, caption) {
  const canvas = document.getElementById('composer_canvas_editor');
  if (!canvas) return;
  pushHistorySnapshot();
  const figHtml = BlockManager.createFigureHtml(url, caption);
  canvas.innerHTML += figHtml;
  updateComposerMetrics();
  saveComposerAutosave();
  alert('📸 Đã chèn ảnh vào bài báo!');
}

// =============================================================================
// PHASE 10: INTERACTIVE STUDIO AI CHATBOT COPILOT
// =============================================================================

function switchStudioRightTab(tab) {
  const btnFiles = document.getElementById('btn_studio_subtab_files');
  const btnChat = document.getElementById('btn_studio_subtab_chat');
  const panelFiles = document.getElementById('panel_studio_files');
  const panelChat = document.getElementById('panel_studio_chat');

  if (tab === 'files') {
    if (btnFiles) { btnFiles.style.borderBottom = '2.5px solid #2563EB'; btnFiles.style.color = '#2563EB'; btnFiles.style.fontWeight = '800'; btnFiles.style.background = 'white'; }
    if (btnChat) { btnChat.style.borderBottom = '2.5px solid transparent'; btnChat.style.color = '#64748B'; btnChat.style.fontWeight = '700'; btnChat.style.background = 'transparent'; }
    if (panelFiles) panelFiles.style.display = 'flex';
    if (panelChat) panelChat.style.display = 'none';
  } else {
    if (btnFiles) { btnFiles.style.borderBottom = '2.5px solid transparent'; btnFiles.style.color = '#64748B'; btnFiles.style.fontWeight = '700'; btnFiles.style.background = 'transparent'; }
    if (btnChat) { btnChat.style.borderBottom = '2.5px solid #2563EB'; btnChat.style.color = '#2563EB'; btnChat.style.fontWeight = '800'; btnChat.style.background = 'white'; }
    if (panelFiles) panelFiles.style.display = 'none';
    if (panelChat) panelChat.style.display = 'flex';
    const input = document.getElementById('studio_chat_input');
    if (input) input.focus();
  }
}

function sendQuickStudioChat(prompt) {
  const input = document.getElementById('studio_chat_input');
  if (input) input.value = prompt;
  sendStudioChatMessage();
}

async function sendStudioChatMessage() {
  const input = document.getElementById('studio_chat_input');
  const msg = (input?.value || '').trim();
  if (!msg) return;

  const container = document.getElementById('studio_chat_messages');
  if (!container) return;

  // Append user message
  const userBubble = document.createElement('div');
  userBubble.style.cssText = 'display: flex; gap: 8px; justify-content: flex-end;';
  userBubble.innerHTML = `<div style="background: #2563EB; color: white; border-radius: 10px 0 10px 10px; padding: 8px 12px; font-size: 12.5px; max-width: 85%; line-height: 1.45;">${escapeHtml(msg)}</div>`;
  container.appendChild(userBubble);
  input.value = '';
  container.scrollTop = container.scrollHeight;

  // Append loading AI bubble
  const aiBubbleId = 'studio_ai_reply_' + Date.now();
  const aiBubble = document.createElement('div');
  aiBubble.id = aiBubbleId;
  aiBubble.style.cssText = 'display: flex; gap: 8px; align-items: flex-start;';
  aiBubble.innerHTML = `
    <div style="width: 28px; height: 28px; border-radius: 8px; background: #2563EB; color: white; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; flex-shrink: 0;">AI</div>
    <div style="background: #F1F5F9; border-radius: 0 10px 10px 10px; padding: 10px 12px; font-size: 12.5px; color: #475569; line-height: 1.5; max-width: 90%;">
      <i class="fa-solid fa-circle-notch fa-spin me-1"></i> Đang suy nghĩ và đối chiếu tài liệu...
    </div>
  `;
  container.appendChild(aiBubble);
  container.scrollTop = container.scrollHeight;

  const title = document.getElementById('composer_title_input')?.value || '';
  const canvas = document.getElementById('composer_canvas_editor');
  const articleContent = canvas?.innerText || '';

  try {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: msg,
        articleTitle: title,
        articleContent: articleContent.slice(0, 3000)
      })
    }).then(r => r.json());

    const replyEl = aiBubble.querySelector('div:last-child');
    if (replyEl) {
      const replyText = res.reply || 'Dạ, em đã xử lý xong yêu cầu của Thầy/Cô.';
      const editContent = res.editContent || '';

      let actionsHtml = '';
      if (editContent) {
        window._pendingChatSnippets = window._pendingChatSnippets || {};
        const snipId = 'snip_' + Date.now();
        window._pendingChatSnippets[snipId] = editContent;

        actionsHtml = `
          <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #E2E8F0; display: flex; gap: 6px;">
            <button type="button" onclick="insertStudioChatSnippet('${snipId}')" style="background: #002855; color: #FCD34D; border: none; border-radius: 4px; padding: 4px 8px; font-size: 11px; font-weight: 700; cursor: pointer;">
              <i class="fa-solid fa-plus me-1"></i> Chèn vào bài báo
            </button>
            <button type="button" onclick="copyStudioChatSnippet(this, '${snipId}')" style="background: white; border: 1px solid #CBD5E1; color: #334155; border-radius: 4px; padding: 4px 8px; font-size: 11px; cursor: pointer;">
              <i class="fa-regular fa-copy me-1"></i> Sao chép
            </button>
          </div>
        `;
      }

      replyEl.innerHTML = `<div>${escapeHtml(replyText).replace(/\n/g, '<br>')}</div>${actionsHtml}`;
    }
  } catch (err) {
    const replyEl = aiBubble.querySelector('div:last-child');
    if (replyEl) replyEl.innerHTML = `<span style="color: #DC2626;">Lỗi kết nối trợ lý: ${err.message}</span>`;
  }
  container.scrollTop = container.scrollHeight;
}

function insertStudioChatSnippet(snipId) {
  const snippet = (window._pendingChatSnippets || {})[snipId];
  if (!snippet) return;
  const canvas = document.getElementById('composer_canvas_editor');
  if (!canvas) return;

  pushHistorySnapshot();
  canvas.innerHTML += '<p style="margin-bottom: 18px; line-height: 1.85; text-align: justify;">' + snippet + '</p>';
  updateComposerMetrics();
  saveComposerAutosave();
  alert('✨ Đã chèn nội dung từ Trợ lý AI vào cuối bài báo!');
}

function copyStudioChatSnippet(btn, snipId) {
  const snippet = (window._pendingChatSnippets || {})[snipId];
  if (!snippet) return;
  navigator.clipboard.writeText(snippet).then(() => {
    const orig = btn.innerHTML;
    btn.innerHTML = '✓ Đã sao chép';
    setTimeout(() => { btn.innerHTML = orig; }, 1500);
  });
}

// =============================================================================
// INITIALIZATION
// =============================================================================

function initAllStudioEnhancements() {
  initBubbleMenu();
  initCanvasImageControls();
  checkAutosaveRecovery();
  initInlineSelectionAssistant();
  updateUndoRedoButtons();
  loadDraftsList();
}

// Start auto-save heartbeat
setInterval(saveComposerAutosave, 5000);
window.addEventListener('DOMContentLoaded', initAllStudioEnhancements);

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  initAllStudioEnhancements();
}

