// =========================================================================
// 6. TRUE MANUS AI COPILOT 2.0 (MAGIC BUTTON, DIFF & ABORTCONTROLLER)
// =========================================================================
// =========================================================================
// 24. MANUS AI COPILOT CONTINUOUS CHAT & DIRECT EDITING ENGINE
// =========================================================================
let copilotChatHistory = [];
let pendingManusEdits = {};
let currentManusSelectionRange = null;

// Biến toàn cục cho Copilot
let copilotAbortController = null;
let globalCopilotSelectionRange = null;
let globalCopilotSelectedText = "";
let currentAiProposal = "";

// Bắt sự kiện bôi đen văn bản trong trình soạn thảo
document.addEventListener('selectionchange', () => {
  const editor = document.getElementById('native_rich_editor');
  const selection = window.getSelection();
  if (editor && editor.contains(selection.anchorNode) && !selection.isCollapsed) {
    currentManusSelectionRange = selection.getRangeAt(0).cloneRange();
  }
});

document.addEventListener('mouseup', (e) => {
  const editor = document.getElementById('native_rich_editor');
  const popup = document.getElementById('floating_ai_bubble_toolbar');
  const selection = window.getSelection();
  
  if (popup && popup.contains(e.target)) return;

  if (editor && editor.contains(e.target) && !selection.isCollapsed && selection.toString().trim().length > 0) {
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    if (popup) {
      popup.style.display = 'flex';
      popup.style.position = 'absolute';
      popup.style.top = (rect.top + window.scrollY - 32) + 'px';
      popup.style.left = (rect.right + window.scrollX + 8) + 'px';
    }
  } else {
    // Không ẩn nếu click vào chính popup
    if (popup && (!e.target || !popup.contains(e.target))) {
      popup.style.display = 'none';
    }
  }
});

function captureSelectionToCopilot() {
  if (currentManusSelectionRange && !currentManusSelectionRange.collapsed) {
    globalCopilotSelectionRange = currentManusSelectionRange.cloneRange();
    globalCopilotSelectedText = currentManusSelectionRange.toString().trim();
    
    const pill = document.getElementById('copilot_context_pill');
    const pillText = document.getElementById('copilot_context_text');
    if (pill && pillText) {
      pill.style.display = 'flex';
      pillText.innerText = globalCopilotSelectedText.substring(0, 40) + '...';
    }
  }
  
  const popup = document.getElementById('floating_ai_bubble_toolbar');
  if (popup) popup.style.display = 'none';

  const input = document.getElementById('copilot_user_input');
  if (input) input.focus();
}

function clearManusSelection() {
  currentManusSelectionRange = null;
  globalCopilotSelectionRange = null;
  globalCopilotSelectedText = "";
  const pill = document.getElementById('copilot_context_pill');
  if (pill) pill.style.display = 'none';
  const popup = document.getElementById('floating_ai_bubble_toolbar');
  if (popup) popup.style.display = 'none';
  const safezone = document.getElementById('copilot_diff_safezone');
  if (safezone) safezone.style.display = 'none';
}

function abortCopilotStream() {
  if (copilotAbortController) {
    copilotAbortController.abort();
    copilotAbortController = null;
  }
}

async function sendCopilotMessage() {
  const input = document.getElementById('copilot_user_input');
  if (!input) return;
  const msg = input.value.trim();
  if (!msg) return;

  input.value = '';
  appendCopilotMessage('user', msg);

  // Chuẩn bị UI Streaming
  const container = document.getElementById('copilot_messages_container');
  const msgId = `msg_${Date.now()}`;
  if (container) {
    container.innerHTML += `
      <div id="wrapper_${msgId}" style="display: flex; gap: 8px; align-items: flex-start;">
        <div style="width: 26px; height: 26px; border-radius: 6px; background: #F0F9FF; color: #0284C7; display: flex; align-items: center; justify-content: center; font-size: 12px; flex-shrink: 0; border: 1px solid #BAE6FD;">
          <i class="fa-solid fa-wand-magic-sparkles"></i>
        </div>
        <div id="${msgId}" style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 10px 12px; font-size: 13.5px; line-height: 1.5; color: #334155; width: 100%;">
          <i class="fa-solid fa-circle-notch fa-spin text-muted"></i> Đang suy nghĩ...
        </div>
      </div>
    `;
    container.scrollTop = container.scrollHeight;
  }

  const stopBtn = document.getElementById('copilot_stop_btn');
  if (stopBtn) stopBtn.style.display = 'flex';

  const safezone = document.getElementById('copilot_diff_safezone');
  const diffOld = document.getElementById('copilot_diff_old');
  const diffNew = document.getElementById('copilot_diff_new');

  currentAiProposal = "";
  if (globalCopilotSelectedText && diffOld) {
    diffOld.innerText = globalCopilotSelectedText;
    diffNew.innerText = "";
    safezone.style.display = 'flex';
  } else {
    safezone.style.display = 'none';
  }

  copilotAbortController = new AbortController();
  const apiKey = localStorage.getItem('gemini_api_key') || "";

  try {
    const res = await fetch('/api/ai/chat-stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: msg,
        selectedText: globalCopilotSelectedText,
        apiKey: apiKey
      }),
      signal: copilotAbortController.signal
    });

    if (!res.ok) throw new Error("Lỗi kết nối Stream");

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = "";
    let isFirstChunk = true;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      let lines = buffer.split('\n\n');
      buffer = lines.pop(); 

      for (let line of lines) {
        if (line.startsWith('data: ')) {
          const jsonStr = line.substring(6).trim();
          if (!jsonStr) continue;
          
          try {
            const data = JSON.parse(jsonStr);
            if (data.error) throw new Error(data.error);

            if (data.chunk) {
              if (isFirstChunk) {
                document.getElementById(msgId).innerHTML = "";
                isFirstChunk = false;
              }
              currentAiProposal += data.chunk;
              
              if (globalCopilotSelectedText) {
                document.getElementById(msgId).innerHTML = "<em>(Xem bản thảo so sánh bên dưới)</em>";
                diffNew.innerHTML += data.chunk;
              } else {
                document.getElementById(msgId).innerHTML += data.chunk;
              }
              container.scrollTop = container.scrollHeight;
            }
          } catch(e) {
            console.error("Lỗi parse SSE:", e);
          }
        }
      }
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      document.getElementById(msgId).innerHTML += '<br><span style="color:#EF4444;font-size:11px;">[Đã dừng AI]</span>';
    } else {
      document.getElementById(msgId).innerHTML = '<span style="color:#EF4444;"><i class="fa-solid fa-triangle-exclamation"></i> Lỗi: ' + err.message + '</span>';
    }
  } finally {
    const stopBtn = document.getElementById('copilot_stop_btn');
    if (stopBtn) stopBtn.style.display = 'none';
    copilotAbortController = null;
  }
}

function approveCopilotDiff() {
  const safezone = document.getElementById('copilot_diff_safezone');
  
  if (globalCopilotSelectionRange && currentAiProposal) {
    const editor = document.getElementById('native_rich_editor');
    saveEditorState("Trước khi phê duyệt bản thảo");
    
    try {
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(globalCopilotSelectionRange);
      document.execCommand('insertHTML', false, currentAiProposal);
    } catch (e) {
      console.error(e);
      alert("Không thể thay thế, vui lòng copy thủ công!");
    }
  }
  
  if (safezone) safezone.style.display = 'none';
  clearManusSelection();
}

function rejectCopilotDiff() {
  const safezone = document.getElementById('copilot_diff_safezone');
  if (safezone) safezone.style.display = 'none';
  clearManusSelection();
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
        <div style="background: #003865; color: white; border-radius: 12px 12px 2px 12px; padding: 10px 14px; font-size: 13px; max-width: 85%; line-height: 1.5;">
          ${text}
        </div>
      </div>
    `;
    container.scrollTop = container.scrollHeight;
  }
}

function applyManusEdit(msgId) {
  const editData = pendingManusEdits[msgId];
  if (!editData) return;

  const editor = document.getElementById('native_rich_editor');
  if (!editor) return;

  // 1. LƯU TRẠNG THÁI TRƯỚC KHI COPILOT SỬA VÀO BỘ NHỚ LỊCH SỬ ĐỒNG BỘ
  saveEditorState("Trước khi Copilot sửa");

  editor.focus();
  const sel = window.getSelection();

  if (editData.action === 'REPLACE_SELECTION' && editData.range) {
    sel.removeAllRanges();
    sel.addRange(editData.range);
    document.execCommand('insertHTML', false, editData.content);
  } else if (editData.action === 'REPLACE_ALL') {
    editor.innerHTML = editData.content;
  } else {
    editor.innerHTML += `<div style="margin-top: 14px; padding-top: 14px; border-top: 1px dashed #CBD5E1;">${editData.content}</div>`;
  }

  // 2. LƯU TRẠNG THÁI SAU KHI COPILOT SỬA VÀO BỘ NHỚ LỊCH SỬ
  saveEditorState("Sau khi áp dụng chỉnh sửa");
  
  const block = document.getElementById(`edit_block_${msgId}`);
  if (block) {
    block.innerHTML = `
      <div style="background: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 6px; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center;">
        <span class="copilot-applied-badge" style="color: #047857; font-size: 11.5px; font-weight: 700;">
          <i class="fa-solid fa-check-circle me-1"></i> Đã áp dụng vào bài
        </span>
        <button type="button" class="btn btn-sm" onclick="undoEditor()" style="background: white; border: 1px solid #CBD5E1; color: #92400E; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 4px; cursor: pointer; box-shadow: 0 1px 3px rgba(0,0,0,0.05);" title="Hoàn tác lùi về trạng thái trước khi chỉnh sửa">
          <i class="fa-solid fa-rotate-left me-1"></i> Hoàn Tác (Lùi Lại)
        </button>
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
        <div style="width: 26px; height: 26px; border-radius: 6px; background: #F0F9FF; color: #0284C7; display: flex; align-items: center; justify-content: center; font-size: 12px; flex-shrink: 0; border: 1px solid #BAE6FD;">
          <i class="fa-solid fa-wand-magic-sparkles"></i>
        </div>
        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 10px 12px; font-size: 12.5px; line-height: 1.5; color: #334155;">
          Cuộc trò chuyện đã được làm mới! Sẵn sàng hỗ trợ Thầy/Cô soạn thảo.
        </div>
      </div>
    `;
  }
}

/* =========================================================================
   TDMU MULTI-CHANNEL JOURNALISM SUITE - CLIENT CONTROLS & BUBBLE TOOLBAR
   ========================================================================= */
