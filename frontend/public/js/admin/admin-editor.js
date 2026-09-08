// =========================================================================
// 5. RIBBON TOOLBAR, UNDO/REDO MULTI-LEVEL & JOURNALISM MEDIA INSERTION
// =========================================================================
function applyDiffSuggestion(origText, newContent, actionName, isSelection, range) {
  const editor = document.getElementById('native_rich_editor');
  if (!editor) return;

  if (currentPendingDiff) {
    acceptAiDiff(false);
  }

  saveEditorState("Trước khi đề xuất: " + actionName);

  const diffId = "ai_diff_" + Date.now();
  currentPendingDiff = {
    id: diffId,
    actionName: actionName,
    origText: origText,
    newContent: newContent,
    isSelection: isSelection
  };

  const diffHtml = `<span id="${diffId}" class="ai-diff-container" style="display: block; margin: 12px 0; border: 1.5px dashed #0284C7; background: #F0F9FF; padding: 12px 16px; border-radius: 8px;"><del class="diff-removed" style="background:#FEE2E2; color:#B91C1C; text-decoration:line-through; padding:3px 6px; border-radius:4px; margin-right:8px; display:inline-block;">${escapeHtml(origText)}</del><ins class="diff-added" style="background:#DCFCE7; color:#15803D; text-decoration:none; font-weight:600; padding:3px 6px; border-radius:4px; display:inline-block;">${newContent}</ins></span>`;

  if (isSelection && range) {
    try {
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      document.execCommand('insertHTML', false, diffHtml);
    } catch (e) {
      editor.innerHTML = diffHtml;
    }
  } else {
    editor.innerHTML = `<span id="${diffId}" class="ai-diff-container" style="display: block; margin: 12px 0; border: 1.5px dashed #0284C7; background: #F0F9FF; padding: 12px 16px; border-radius: 8px;"><del class="diff-removed" style="background:#FEE2E2; color:#B91C1C; text-decoration:line-through; padding:4px 8px; border-radius:4px; display:block; margin-bottom:10px;">${escapeHtml(origText)}</del><ins class="diff-added" style="background:#DCFCE7; color:#15803D; text-decoration:none; font-weight:500; padding:4px 8px; border-radius:4px; display:block;">${newContent}</ins></span>`;
  }

  const banner = document.getElementById('diff_action_banner');
  const msg = document.getElementById('diff_banner_message');
  if (banner) {
    banner.style.display = 'flex';
    if (msg) msg.innerHTML = `<strong>✨ Bản thảo đề xuất ${actionName}:</strong> Xem xét đoạn gạch đỏ (cũ) và xanh lá (mới)`;
  }
}

function acceptAiDiff(notify = true) {
  if (!currentPendingDiff) return;
  const el = document.getElementById(currentPendingDiff.id);
  const newContent = currentPendingDiff.newContent;
  const actionName = currentPendingDiff.actionName;

  if (el) {
    el.outerHTML = newContent;
  } else {
    const editor = document.getElementById('native_rich_editor');
    if (editor) {
      const diffNode = editor.querySelector('.ai-diff-container');
      if (diffNode) diffNode.outerHTML = newContent;
    }
  }

  const banner = document.getElementById('diff_action_banner');
  if (banner) banner.style.display = 'none';

  currentPendingDiff = null;
  saveEditorState("Chấp nhận bản thảo đề xuất: " + actionName);

  if (notify) {
    const copilotStatus = document.getElementById('copilot_status_indicator');
    if (copilotStatus) {
      copilotStatus.innerHTML = `<span style="color:#16A34A;font-weight:700;"><i class="fa-solid fa-check"></i> Đã áp dụng bản thảo đề xuất (${actionName})</span>`;
      setTimeout(() => { copilotStatus.innerHTML = 'Sẵn sàng hỗ trợ'; }, 3000);
    }
  }
}

function rejectAiDiff() {
  if (!currentPendingDiff) return;
  const el = document.getElementById(currentPendingDiff.id);
  const origText = currentPendingDiff.origText;
  const actionName = currentPendingDiff.actionName;

  if (el) {
    el.outerHTML = escapeHtml(origText).replace(/\n/g, '<br>');
  } else {
    const editor = document.getElementById('native_rich_editor');
    if (editor) {
      const diffNode = editor.querySelector('.ai-diff-container');
      if (diffNode) diffNode.outerHTML = escapeHtml(origText).replace(/\n/g, '<br>');
    }
  }

  const banner = document.getElementById('diff_action_banner');
  if (banner) banner.style.display = 'none';

  currentPendingDiff = null;
  saveEditorState("Từ chối bản thảo đề xuất: " + actionName);

  const copilotStatus = document.getElementById('copilot_status_indicator');
  if (copilotStatus) {
    copilotStatus.innerHTML = `<span style="color:#DC2626;font-weight:700;"><i class="fa-solid fa-xmark"></i> Đã giữ nguyên văn bản gốc</span>`;
    setTimeout(() => { copilotStatus.innerHTML = 'Sẵn sàng hỗ trợ'; }, 3000);
  }
}

async function handleToolbarAiAction(action) {
  const editor = document.getElementById('native_rich_editor');
  if (!editor || !editor.innerText.trim()) {
    alert("Vui lòng nhập hoặc bôi đen nội dung bài viết trước!");
    return;
  }

  const selection = window.getSelection();
  let textToProcess = selection.toString().trim();
  let isSelection = true;
  let targetRange = currentManusSelectionRange ? currentManusSelectionRange.cloneRange() : null;

  if (!textToProcess) {
    textToProcess = editor.innerText.trim();
    isSelection = false;
  }

  const actionNames = {
    formal: "Hành chính hóa",
    shorten: "Rút gọn",
    expand: "Mở rộng"
  };
  const actionName = actionNames[action] || action;

  const copilotStatus = document.getElementById('copilot_status_indicator');
  if (copilotStatus) {
    copilotStatus.innerHTML = `<span style="color:#0284C7;font-weight:700;"><i class="fa-solid fa-spinner fa-spin"></i> Đang xử lý ${actionName}...</span>`;
  }

  const promptMsg = action === 'formal'
    ? "Viết lại đoạn văn sau theo văn phong chuẩn mực hành chính Công đoàn TDMU, trang nhã, đúng thể thức nghị định 30:\n\n" + textToProcess
    : "Bổ sung các luận điểm sâu sắc, số liệu và dẫn chứng thực tế cho đoạn văn sau:\n\n" + textToProcess;

  try {
    const apiKey = localStorage.getItem('gemini_api_key') || "";
    const groqApiKey = localStorage.getItem('groq_api_key') || "";
    const title = document.getElementById('ai_final_title')?.value || "";

    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: promptMsg,
        history: [],
        articleTitle: title,
        articleContent: editor.innerHTML,
        selectedText: isSelection ? textToProcess : "",
        apiKey,
        groqApiKey
      })
    }).then(r => r.json());

    if (res.success && res.editContent) {
      applyDiffSuggestion(textToProcess, res.editContent, actionName, isSelection, targetRange);
      if (copilotStatus) {
        copilotStatus.innerHTML = `<span style="color:#0284C7;font-weight:700;"><i class="fa-solid fa-wand-magic-sparkles"></i> Đã đưa ra đề xuất thay đổi</span>`;
        setTimeout(() => { copilotStatus.innerHTML = 'Sẵn sàng hỗ trợ'; }, 3000);
      }
    } else {
      alert(res.reply || "✨ Đã hoàn thành xử lý nội dung.");
      if (copilotStatus) copilotStatus.innerHTML = 'Sẵn sàng hỗ trợ';
    }
  } catch (err) {
    console.error(err);
    alert("Lỗi xử lý hệ thống: " + err.message);
    if (copilotStatus) copilotStatus.innerHTML = 'Sẵn sàng hỗ trợ';
  }
}


// =========================================================================
// 22. ADVANCED AI-SYNCHRONIZED UNDO / REDO (TIẾN & LÙI) & STATE MEMORY
// =========================================================================
const MAX_HISTORY_STEPS = 50;
let editorHistoryStack = [];
let editorHistoryIndex = -1;
let isRestoringHistory = false;
let editorSaveTimeout = null;

/**
 * Lưu snapshot trạng thái văn bản và đồng bộ hóa ngữ cảnh AI Copilot
 * @param {string} actionLabel Mô tả hành động (VD: 'AI áp dụng đề xuất', 'Soạn thảo', 'AI hành chính hóa')
 */
function saveEditorState(actionLabel = "Soạn thảo") {
  if (isRestoringHistory) return;
  const editor = document.getElementById('native_rich_editor');
  if (!editor) return;
  
  const content = editor.innerHTML;
  const title = document.getElementById('ai_final_title')?.value || "";

  // Nếu nội dung không đổi so với đỉnh hiện tại thì bỏ qua
  if (editorHistoryIndex >= 0 && editorHistoryStack[editorHistoryIndex].content === content) return;
  
  // Cắt bỏ nhánh redo tương lai nếu người dùng tạo nhánh mới
  if (editorHistoryIndex < editorHistoryStack.length - 1) {
    editorHistoryStack = editorHistoryStack.slice(0, editorHistoryIndex + 1);
  }
  
  editorHistoryStack.push({
    content,
    title,
    actionLabel,
    timestamp: new Date().toLocaleTimeString('vi-VN'),
    copilotHistoryLength: copilotChatHistory.length
  });

  if (editorHistoryStack.length > MAX_HISTORY_STEPS) {
    editorHistoryStack.shift();
  } else {
    editorHistoryIndex++;
  }
  
  updateUndoRedoButtons();
}

function saveEditorStateDebounced() {
  clearTimeout(editorSaveTimeout);
  editorSaveTimeout = setTimeout(() => saveEditorState("Người dùng chỉnh sửa"), 400);
}

/**
 * Lùi lại (Undo) - Đồng bộ hoàn toàn với cả thao tác gõ tay và các chỉnh sửa của AI Copilot
 */
function undoEditor() {
  if (editorHistoryIndex > 0) {
    isRestoringHistory = true;
    editorHistoryIndex--;
    const state = editorHistoryStack[editorHistoryIndex];
    
    const editor = document.getElementById('native_rich_editor');
    if (editor && state) {
      editor.innerHTML = state.content;
      if (state.title) {
        const titleInput = document.getElementById('ai_final_title');
        if (titleInput) titleInput.value = state.title;
      }
    }

    // ĐỒNG BỘ BỘ NHỚ AI COPILOT VỀ ĐÚNG NGỮ CẢNH TRƯỚC KHI CHỈNH SỬA
    if (state && typeof state.copilotHistoryLength === 'number') {
      copilotChatHistory = copilotChatHistory.slice(0, state.copilotHistoryLength);
    }

    // Cập nhật giao diện các khối sửa của Copilot nếu có
    const allAppliedBadges = document.querySelectorAll('.copilot-applied-badge');
    allAppliedBadges.forEach(el => {
      el.innerHTML = '<span style="color: #92400E; font-size: 11px; font-weight: 700;"><i class="fa-solid fa-rotate-left me-1"></i> Đã hoàn tác về lúc trước khi sửa</span>';
      if (el.parentElement) {
        el.parentElement.style.background = '#FFFBEB';
        el.parentElement.style.borderColor = '#FCD34D';
      }
    });

    isRestoringHistory = false;
    updateUndoRedoButtons();
    console.log("⏪ [Undo] Đã lùi lại về trạng thái:", state ? state.actionLabel : "trước đó");
  }
}

/**
 * Tiến tới (Redo) - Đồng bộ với các bước sửa tiếp theo
 */
function redoEditor() {
  if (editorHistoryIndex < editorHistoryStack.length - 1) {
    isRestoringHistory = true;
    editorHistoryIndex++;
    const state = editorHistoryStack[editorHistoryIndex];

    const editor = document.getElementById('native_rich_editor');
    if (editor && state) {
      editor.innerHTML = state.content;
      if (state.title) {
        const titleInput = document.getElementById('ai_final_title');
        if (titleInput) titleInput.value = state.title;
      }
    }

    // Đồng bộ lại bộ nhớ Copilot
    if (state && typeof state.copilotHistoryLength === 'number') {
      copilotChatHistory = copilotChatHistory.slice(0, state.copilotHistoryLength);
    }

    isRestoringHistory = false;
    updateUndoRedoButtons();
    console.log("⏩ [Redo] Đã tiến tới trạng thái:", state ? state.actionLabel : "tiếp theo");
  }
}

function updateUndoRedoButtons() {
  const undoBtn = document.getElementById('btn_undo_editor');
  const redoBtn = document.getElementById('btn_redo_editor');
  if (undoBtn) {
    const canUndo = editorHistoryIndex > 0;
    undoBtn.style.opacity = canUndo ? '1' : '0.4';
    undoBtn.style.cursor = canUndo ? 'pointer' : 'not-allowed';
  }
  if (redoBtn) {
    const canRedo = editorHistoryIndex < editorHistoryStack.length - 1;
    redoBtn.style.opacity = canRedo ? '1' : '0.4';
    redoBtn.style.cursor = canRedo ? 'pointer' : 'not-allowed';
  }
}

// Bắt phím tắt chuẩn Word Ctrl+Z và Ctrl+Y trên toàn trang
document.addEventListener('keydown', function(e) {
  if (e.ctrlKey && (e.key === 'z' || e.key === 'Z')) {
    e.preventDefault();
    undoEditor();
  }
  if (e.ctrlKey && (e.key === 'y' || e.key === 'Y')) {
    e.preventDefault();
    redoEditor();
  }
});



// 2. KHỐI BÁO CHÍ: TRÍCH DẪN & HỘP THÔNG TIN
function insertJournalismQuote() {
  saveEditorState("Trước khi chèn trích dẫn");
  const quoteHtml = `<blockquote>“Mỗi chương trình, hoạt động của Công đoàn TDMU là sự đồng hành thiết thực, bảo vệ quyền và lợi ích hợp pháp của cán bộ giảng viên và người lao động.”<cite style="display:block;font-size:13px;color:#0284C7;font-weight:700;margin-top:6px;">– Đại diện Ban Thường vụ Công đoàn TDMU</cite></blockquote><p><br></p>`;
  document.execCommand('insertHTML', false, quoteHtml);
  saveEditorState("Sau khi chèn trích dẫn");
}

function insertJournalismInfobox() {
  saveEditorState("Trước khi chèn hộp tin");
  const boxHtml = `<div class="journalism-infobox"><strong>📌 THÔNG TIN CẦN LƯU Ý:</strong><ul style="margin: 6px 0 0 0; padding-left: 20px;"><li><strong>Thời gian:</strong> Kế hoạch định kỳ năm 2026.</li><li><strong>Địa điểm:</strong> Trường Đại học Thủ Dầu Một (Số 06 Trần Văn Ơn, Phú Hòa, TP. TDM).</li><li><strong>Đối tượng:</strong> Toàn thể cán bộ, giảng viên và đoàn viên 16 Tổ Công đoàn.</li></ul></div><p><br></p>`;
  document.execCommand('insertHTML', false, boxHtml);
  saveEditorState("Sau khi chèn hộp tin");
}

function copyInfographicText() {
  const infoDiv = document.getElementById('infographic_content_display');
  if (!infoDiv) return;
  const text = infoDiv.innerText;
  navigator.clipboard.writeText(text).then(() => {
    alert("✅ Đã sao chép nội dung tóm tắt Infographic vào Clipboard!");
  }).catch(() => {
    alert("⚠️ Không thể sao chép tự động. Vui lòng chọn và copy thủ công.");
  });
}

// 3. MODAL CHÈN ẢNH BÁO CHÍ (FLUX AI / KHO TƯ LIỆU / URL)
let selectedModalImgSrc = "";
let savedImageInsertRange = null;

function openJournalismImageModal() {
  const sel = window.getSelection();
  if (sel.rangeCount > 0) {
    savedImageInsertRange = sel.getRangeAt(0).cloneRange();
  }
  const modal = document.getElementById('modal_journalism_image');
  if (modal) {
    modal.style.display = 'flex';
    // Auto fill prompt from title if empty
    const promptInput = document.getElementById('img_modal_prompt');
    const titleInput = document.getElementById('ai_final_title');
    if (promptInput && !promptInput.value && titleInput && titleInput.value) {
      promptInput.value = titleInput.value;
    }
  }
}

function closeJournalismImageModal() {
  const modal = document.getElementById('modal_journalism_image');
  if (modal) modal.style.display = 'none';
}

function switchImageSourceTab(source) {
  ['ai', 'url', 'upload'].forEach(s => {
    const btn = document.getElementById('tab_img_src_' + s);
    const panel = document.getElementById('panel_img_src_' + s);
    if (btn) {
      btn.style.background = (s === source) ? 'white' : 'transparent';
      btn.style.color = (s === source) ? '#0284C7' : '#475569';
    }
    if (panel) {
      panel.style.display = (s === source) ? 'block' : 'none';
    }
  });
}

async function generateImageFromModal() {
  const promptInput = document.getElementById('img_modal_prompt');
  const btn = document.getElementById('btn_modal_gen_img');
  const preview = document.getElementById('img_modal_preview');
  const previewWrap = document.getElementById('img_modal_preview_wrap');
  const captionInput = document.getElementById('img_modal_caption');

  const promptText = (promptInput?.value || '').trim();
  if (!promptText) {
    alert("Vui lòng nhập mô tả ảnh (Prompt)!");
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin me-1"></i> Đang sinh ảnh Flux AI...';
  }

  try {
    const res = await fetch('/api/ai/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: promptText })
    }).then(r => r.json());

    if (res.success && res.imageUrl) {
      selectedModalImgSrc = res.imageUrl;
      if (preview) preview.src = res.imageUrl;
      if (previewWrap) previewWrap.style.display = 'block';
      if (captionInput && (!captionInput.value || captionInput.value.includes('Ảnh:'))) {
        captionInput.value = "Ảnh: " + promptText.slice(0, 70);
      }
    } else {
      alert("⚠️ Không thể sinh ảnh: " + (res.error || "Lỗi server"));
    }
  } catch (err) {
    console.error("Lỗi generateImageFromModal:", err);
    alert("❌ Lỗi sinh ảnh: " + err.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles me-1"></i> Khởi Tạo Đồ Họa Báo Chí';
    }
  }
}

function previewUrlImage(url) {
  selectedModalImgSrc = url.trim();
  const preview = document.getElementById('img_modal_preview');
  const previewWrap = document.getElementById('img_modal_preview_wrap');
  if (preview && selectedModalImgSrc) {
    preview.src = selectedModalImgSrc;
    if (previewWrap) previewWrap.style.display = 'block';
  }
}

function selectDamImage(src) {
  selectedModalImgSrc = src;
  document.querySelectorAll('.dam-pick-thumb').forEach(t => t.style.borderColor = 'transparent');
  const clicked = event.target;
  if (clicked) clicked.style.borderColor = '#0284C7';

  const captionInput = document.getElementById('img_modal_caption');
  if (captionInput && !captionInput.value) {
    captionInput.value = "Ảnh: Hoạt động truyền thống của đoàn viên Công đoàn TDMU";
  }
}

function confirmInsertJournalismImage() {
  const captionInput = document.getElementById('img_modal_caption');
  const caption = (captionInput?.value || '').trim() || "Ảnh: Hoạt động Công đoàn Trường Đại học Thủ Dầu Một";

  if (!selectedModalImgSrc) {
    const urlInput = document.getElementById('img_modal_url');
    if (urlInput && urlInput.value.trim()) {
      selectedModalImgSrc = urlInput.value.trim();
    }
  }

  if (!selectedModalImgSrc) {
    alert("Vui lòng chọn ảnh, tạo đồ họa mới hoặc nhập link ảnh trước khi chèn!");
    return;
  }

  saveEditorState("Trước khi chèn ảnh báo chí");

  const figureHtml = `
    <figure class="journalism-figure" style="margin: 24px auto; text-align: center; max-width: 780px;">
      <img src="${selectedModalImgSrc}" alt="${caption}" style="max-width: 100%; border-radius: 8px; box-shadow: 0 4px 14px rgba(0,0,0,0.08);" />
      <figcaption contenteditable="true" style="font-size: 13px; font-style: italic; color: #64748B; margin-top: 8px; outline: none;">${caption}</figcaption>
    </figure>
    <p><br></p>
  `;

  const editor = document.getElementById('native_rich_editor');
  if (editor) {
    editor.focus();
    
    if (savedImageInsertRange) {
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(savedImageInsertRange);
    }
    
    document.execCommand('insertHTML', false, figureHtml);
    saveEditorState("Sau khi chèn ảnh báo chí");
  }

  closeJournalismImageModal();
}

// Auto-initialize floating toolbar on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  // Floating toolbar initialized
});
