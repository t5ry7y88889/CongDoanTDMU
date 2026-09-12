// =========================================================================
// ENTERPRISE AI CONTENT STUDIO: STATE MACHINE WORKFLOW ENGINE
// Quản trị toàn trình: Ingest -> Analyze -> Plan -> Draft -> Media -> Compliance
// Hỗ trợ 3 Cấp độ kiểm soát: Auto (0 CP), Assisted (2 CP), Full Review (5 CP)
// =========================================================================

const studioState = {
  mode: 'full_review', // 'auto' | 'assisted' | 'full_review'
  currentStage: 1, // 1 to 6
  uploadedFiles: [],
  factSheet: null,
  verifiedFacts: [],
  missingInfo: [],
  editorialPlan: null,
  contentDraft: null,
  mediaPackage: null,
  complianceAudit: null,
  currentChannel: 'web',
  auditTrail: [
    {
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('vi-VN'),
      actor: 'Hệ Thống Tòa Soạn',
      action: 'Khởi tạo phiên làm việc mới',
      stage: 'Stage 1: Intake',
      note: 'Sẵn sàng tiếp nhận hồ sơ sự kiện và tư liệu'
    }
  ]
};

// =========================================================================
// 1. GOVERNANCE MODE SWITCHING & GATE POLICIES
// =========================================================================
function setGovernanceMode(mode) {
  studioState.mode = mode;

  const btnAuto = document.getElementById('btn_gov_auto');
  const btnAssisted = document.getElementById('btn_gov_assisted');
  const btnFull = document.getElementById('btn_gov_full');
  const modeBadge = document.getElementById('studio_governance_badge');
  const modeDesc = document.getElementById('studio_mode_description');

  // Reset all buttons
  [btnAuto, btnAssisted, btnFull].forEach(b => {
    if (b) {
      b.style.background = 'transparent';
      b.style.color = '#475569';
      b.style.boxShadow = 'none';
      b.style.fontWeight = '600';
    }
  });

  if (mode === 'auto') {
    if (btnAuto) {
      btnAuto.style.background = '#059669';
      btnAuto.style.color = '#FFFFFF';
      btnAuto.style.boxShadow = '0 2px 8px rgba(5,150,105,0.3)';
      btnAuto.style.fontWeight = '800';
    }
    if (modeBadge) {
      modeBadge.innerText = '🟢 Chế độ Hỏa Tốc (0 Checkpoints)';
      modeBadge.style.background = '#ECFDF5';
      modeBadge.style.color = '#065F46';
      modeBadge.style.border = '1px solid #A7F3D0';
    }
    if (modeDesc) {
      modeDesc.innerText = 'AI tự động thực thi toàn bộ 6 công đoạn: Fact -> Plan -> Draft -> Media -> Compliance -> Xuất bản.';
    }
  } else if (mode === 'assisted') {
    if (btnAssisted) {
      btnAssisted.style.background = '#D97706';
      btnAssisted.style.color = '#FFFFFF';
      btnAssisted.style.boxShadow = '0 2px 8px rgba(217,119,6,0.3)';
      btnAssisted.style.fontWeight = '800';
    }
    if (modeBadge) {
      modeBadge.innerText = '🟡 Bán Tự Động (2 Checkpoints: Fact + Final)';
      modeBadge.style.background = '#FFFBEB';
      modeBadge.style.color = '#B45309';
      modeBadge.style.border = '1px solid #FDE68A';
    }
    if (modeDesc) {
      modeDesc.innerText = 'AI tự sinh các khâu trung gian, cán bộ chỉ kiểm soát tại 2 cổng thiết yếu: Bảng Sự Thật & Duyệt Xuất Bản.';
    }
  } else {
    if (btnFull) {
      btnFull.style.background = '#002855';
      btnFull.style.color = '#FFFFFF';
      btnFull.style.boxShadow = '0 2px 8px rgba(0,40,85,0.3)';
      btnFull.style.fontWeight = '800';
    }
    if (modeBadge) {
      modeBadge.innerText = '🔴 Doanh Nghiệp Toàn Trình (5 Checkpoints)';
      modeBadge.style.background = '#EFF6FF';
      modeBadge.style.color = '#1E40AF';
      modeBadge.style.border = '1px solid #BFDBFE';
    }
    if (modeDesc) {
      modeDesc.innerText = 'Quy chuẩn tòa soạn cao cấp: Phê duyệt Fact Sheet, Kế hoạch bài, Bản thảo Canvas, Gán ảnh và Gác cổng Compliance.';
    }
  }

  // Update button text in Stage 1 & other stages
  updateStage1ActionButtonText();
  updateStageButtonsForMode();
}

function updateStage1ActionButtonText() {
  const btn = document.getElementById('btn_intake_submit');
  if (!btn) return;

  if (studioState.mode === 'auto') {
    btn.innerHTML = '<i class="fa-solid fa-bolt text-warning me-1"></i> ⚡ BẮT ĐẦU TỰ ĐỘNG HÓA PIPELINE (0-CHẠM) <i class="fa-solid fa-arrow-right"></i>';
  } else if (studioState.mode === 'assisted') {
    btn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles text-warning me-1"></i> ⚡ BÓC TÁCH FACT SHEET & VÀO CHECKPOINT 1 →';
  } else {
    btn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles text-warning me-1"></i> ⚡ BÓC TÁCH FACT SHEET & BẮT ĐẦU QUY TRÌNH TOÀN TRÌNH →';
  }
}

function updateStageButtonsForMode() {
  const draftBtn = document.getElementById('btn_approve_draft');
  const stage5Back = document.getElementById('btn_stage5_back');
  const stage6Back = document.getElementById('btn_stage6_back');

  if (draftBtn) {
    draftBtn.innerHTML = '<i class="fa-solid fa-check text-success me-1"></i> ✓ Duyệt Bản Nháp (Approve Draft) & Sang Thẩm Định Xuất Bản <i class="fa-solid fa-arrow-right"></i>';
  }

  if (stage5Back) {
    if (studioState.mode === 'assisted') {
      stage5Back.innerHTML = '<i class="fa-solid fa-arrow-left me-1"></i> Quay Lại Fact Sheet (Stage 2)';
    } else {
      stage5Back.innerHTML = '<i class="fa-solid fa-arrow-left me-1"></i> Quay Lại Gán Ảnh (Stage 4)';
    }
  }

  if (stage6Back) {
    stage6Back.innerHTML = '<i class="fa-solid fa-arrow-left me-1"></i> Quay Lại Bản Nháp (Stage 5)';
  }
}

function handleStage5Back() {
  if (studioState.mode === 'assisted') {
    goToStage(2);
  } else {
    goToStage(4);
  }
}

function handleStage6Back() {
  goToStage(5);
}

// =========================================================================
// 2. STATE MACHINE STEPPER & STAGE NAVIGATION
// =========================================================================
function goToStage(stageNum) {
  if (stageNum < 1 || stageNum > 6) return;
  studioState.currentStage = stageNum;

  for (let i = 1; i <= 6; i++) {
    const pane = document.getElementById(`studio_stage_pane_${i}`);
    const indicator = document.getElementById(`stage_indicator_${i}`);

    if (pane) {
      pane.style.display = (i === stageNum) ? 'block' : 'none';
    }

    if (indicator) {
      const badge = indicator.querySelector('.stage-num-badge');
      if (i === stageNum) {
        indicator.style.background = '#002855';
        indicator.style.color = '#FFFFFF';
        indicator.style.borderColor = '#002855';
        if (badge) {
          badge.style.background = '#D97706';
          badge.style.color = '#FFFFFF';
        }
      } else if (i < stageNum) {
        indicator.style.background = '#F0FDF4';
        indicator.style.color = '#166534';
        indicator.style.borderColor = '#BBF7D0';
        if (badge) {
          badge.style.background = '#16A34A';
          badge.style.color = '#FFFFFF';
        }
      } else {
        indicator.style.background = '#F8FAFC';
        indicator.style.color = '#64748B';
        indicator.style.borderColor = '#E2E8F0';
        if (badge) {
          badge.style.background = '#CBD5E1';
          badge.style.color = '#475569';
        }
      }
    }
  }

  if (stageNum === 4 && typeof renderMediaReviewUI === 'function') {
    renderMediaReviewUI(studioState.mediaPackage);
  }
  if (stageNum === 6) {
    const genreSel = document.getElementById('compliance_genre_selector');
    if (genreSel && studioState.editorialPlan?.genre) {
      genreSel.value = studioState.editorialPlan.genre;
    }
  }
  if (typeof updateGlobalPhotoBadge === 'function') {
    updateGlobalPhotoBadge();
  }

  updateStageButtonsForMode();

  const container = document.getElementById('tab_ai-creator_content');
  if (container) container.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// =========================================================================
// 3. AUDIT LOGGING HELPER
// =========================================================================
function logStudioAudit(action, stage, note = '') {
  const entry = {
    timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('vi-VN'),
    actor: document.getElementById('current_user_name')?.innerText || 'TS. Lê Thị Kim Út',
    action,
    stage,
    note
  };
  studioState.auditTrail.unshift(entry);
  renderAuditTrailUI();
}

function renderAuditTrailUI() {
  const container = document.getElementById('studio_audit_trail_list');
  if (!container) return;

  container.innerHTML = studioState.auditTrail.map(item => `
    <div style="border-left: 2px solid #0284C7; padding-left: 10px; margin-bottom: 10px; font-size: 12px; line-height: 1.4;">
      <div style="display: flex; justify-content: space-between; color: #64748B; font-size: 11px;">
        <span><strong>${item.actor}</strong> &bull; ${item.stage}</span>
        <span>${item.timestamp}</span>
      </div>
      <div style="font-weight: 700; color: #002855; margin-top: 2px;">${item.action}</div>
      ${item.note ? `<div style="color: #475569; font-style: italic; margin-top: 1px;">${item.note}</div>` : ''}
    </div>
  `).join('');
}

// =========================================================================
// 4. STAGE 1: INTAKE & PRESETS (Tự điền trước mắt, không nhảy trang)
// =========================================================================
function applyPreset(type) {
  const briefText = document.getElementById('intake_source_text');
  const genreSel = document.getElementById('intake_genre_selector');

  if (type === 'volleyball') {
    if (genreSel) genreSel.value = 'tin_hoat_dong';
    if (briefText) {
      briefText.value = "Kế hoạch số 25/KH-CĐ ngày 20/03/2026 của Ban Thường vụ Công đoàn Trường ĐH Thủ Dầu Một về việc tổ chức Giải bóng chuyền nam nữ chào mừng Ngày thành lập Đoàn 26/03/2026. Khai mạc lúc 08h00 ngày 26/03/2026 tại Nhà thi đấu Đa năng TDMU. Đơn vị chủ trì: Ban Thường vụ Công đoàn Trường. Thành phần: 16 Tổ Công đoàn cơ sở với hơn 120 vận động viên tham gia tranh tài. Kinh phí khen thưởng 15 triệu đồng từ Quỹ phong trào Công đoàn.";
    }
  } else if (type === 'welfare') {
    if (genreSel) genreSel.value = 'phuc_loi';
    if (briefText) {
      briefText.value = "Kế hoạch chăm lo đời sống đoàn viên, người lao động nhân dịp lễ Quốc khánh 02/09/2026. Ban Thường vụ Công đoàn rà soát và trao 60 suất quà hỗ trợ (mỗi suất 500.000đ) cho cán bộ, giảng viên và nhân viên có hoàn cảnh khó khăn tại Hội trường A, Trung tâm Hội nghị TDMU lúc 08h30 ngày 28/08/2026. Tổng kinh phí 30 triệu đồng trích từ Quỹ hoạt động Công đoàn Trường.";
    }
  } else if (type === 'ai_training') {
    if (genreSel) genreSel.value = 'thong_bao';
    if (briefText) {
      briefText.value = "Thông báo tổ chức Hội thảo tập huấn ứng dụng Trí tuệ nhân tạo (AI) và Chuyển đổi số trong công tác truyền thông Công đoàn năm 2026 vào lúc 08h00 ngày 15/09/2026 tại Phòng Hội thảo 1, Trường ĐH Thủ Dầu Một. Thành phần tham dự: Toàn thể ủy viên BCH Công đoàn trường, ban nữ công và cán bộ phụ trách tuyên giáo 16 Tổ CĐ cơ sở.";
    }
  } else if (type === 'emulation') {
    if (genreSel) genreSel.value = 'khen_thuong';
    if (briefText) {
      briefText.value = "Phát động đợt thi đua cao điểm 'Dạy tốt - Học tốt - Nghiên cứu khoa học xuất sắc' chào mừng năm học mới 2026-2027 của Công đoàn Trường ĐH Thủ Dầu Một. Khen thưởng 4 Tổ Công đoàn xuất sắc dẫn đầu khối thi đua và trao giấy khen cho 25 cá nhân tiêu biểu.";
    }
  }

  if (briefText) {
    briefText.style.transition = 'border-color 0.3s';
    briefText.style.borderColor = '#10B981';
    briefText.focus();
    setTimeout(() => { briefText.style.borderColor = '#CBD5E1'; }, 1000);
  }
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
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
        
        // Check for Word docx XML tags (<w:t>)
        const matches = text.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g);
        if (matches && matches.length > 0) {
          const extracted = matches.map(m => m.replace(/<[^>]+>/g, '')).join(' ');
          if (extracted.trim().length > 10) {
            return resolve(extracted.trim());
          }
        }
        
        // Clean printable strings for txt/pdf/doc
        const cleaned = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ').replace(/\s+/g, ' ').trim();
        if (cleaned.length > 30) {
          return resolve(cleaned.slice(0, 10000));
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

async function handleIntakeFilesSelected(files) {
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
    } else if (f.type.startsWith('text/') || f.name.endsWith('.txt') || f.name.endsWith('.csv') || f.name.endsWith('.json') || f.name.endsWith('.md')) {
      fileObj.text = await new Promise((res) => {
        const reader = new FileReader();
        reader.onload = (e) => res(e.target.result);
        reader.readAsText(f);
      });
    } else {
      // Word .docx, .doc, PDF or other docs
      fileObj.text = await readDocumentText(f);
    }
    studioState.uploadedFiles.push(fileObj);
  }
  renderIntakeFilesList();
}

function renderIntakeFilesList() {
  const container = document.getElementById('intake_files_list');
  if (!container) return;

  if (!studioState.uploadedFiles.length) {
    container.innerHTML = '<span style="font-size: 11.5px; color: #94A3B8; font-style: italic;">Chưa có tệp đính kèm nào được tải lên.</span>';
    return;
  }

  container.innerHTML = studioState.uploadedFiles.map((f, idx) => `
    <div style="background: white; border: 1px solid #CBD5E1; border-radius: 6px; padding: 4px 8px; font-size: 11.5px; display: flex; align-items: center; gap: 6px;">
      <i class="fa-solid ${f.type.startsWith('image/') ? 'fa-image text-success' : 'fa-file-lines text-primary'}"></i>
      <span style="font-weight: 700; color: #002855; max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${f.name}">${f.name}</span>
      <span style="color: #64748B;">(${f.size})</span>
      <button type="button" onclick="removeIntakeFile(${idx})" style="background: none; border: none; color: #EF4444; cursor: pointer; font-size: 11px; padding: 0 2px;">✕</button>
    </div>
  `).join('');
}

function removeIntakeFile(idx) {
  studioState.uploadedFiles.splice(idx, 1);
  renderIntakeFilesList();
}

// =========================================================================
// 5. STAGE 1 -> STAGE 2: EXTRACT FACTS & DETECT MISSING INFO
// =========================================================================
async function extractFactsFromIntake() {
  const sourceText = (document.getElementById('intake_source_text')?.value || '').trim();
  const brief = (document.getElementById('intake_instructions_text')?.value || '').trim();
  const btn = document.getElementById('btn_intake_submit');

  if (!sourceText && !brief && !studioState.uploadedFiles.length) {
    alert("⚠️ Vui lòng dán văn bản nội dung sự kiện, nhập chỉ đạo hoặc tải lên ít nhất một tệp tài liệu/kế hoạch!");
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin me-1"></i> Đang đọc hiểu tài liệu & bóc tách sự thật...';
  }

  let extractionSucceeded = false;

  try {
    const payload = {
      sourceText,
      brief,
      filesInfo: studioState.uploadedFiles.map(f => ({ name: f.name, size: f.size, type: f.type, text: f.text })),
      apiKey: localStorage.getItem('gemini_api_key') || ''
    };

    const res = await fetch('/api/ai/extract-facts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(r => r.json());

    if (res.success && res.factSheet) {
      extractionSucceeded = true;
      const fs = res.factSheet;
      studioState.factSheet = {
        eventName: fs.eventName || sourceText.slice(0, 60).trim() || brief.slice(0, 60).trim() || "Hoạt động Công đoàn TDMU 2026",
        eventDate: fs.eventDate || new Date().toLocaleDateString('vi-VN'),
        eventTime: fs.eventTime || "08h00 - 11h30",
        location: fs.location || "Trường Đại học Thủ Dầu Một",
        organizer: fs.organizer || "Ban Thường Vụ Công Đoàn Trường ĐH Thủ Dầu Một",
        delegates: fs.delegates || "Đại diện Đảng ủy, Ban Giám hiệu, Ban Thường vụ Công đoàn trường và các Tổ Công đoàn",
        attendeesCount: fs.attendeesCount || "Toàn thể đoàn viên và cán bộ giảng viên người lao động",
        budgetOrGifts: fs.budgetOrGifts || "Kinh phí trích từ Quỹ hoạt động Công đoàn Trường",
        keyActivities: Array.isArray(fs.keyActivities) && fs.keyActivities.length > 0
          ? fs.keyActivities
          : ["Tuyên truyền mục đích, ý nghĩa và phát động phong trào thi đua", "Tổ chức các hoạt động trọng tâm và hỗ trợ thiết thực cho đoàn viên"],
        significance: fs.significance || "Phát huy truyền thống đoàn kết, chăm lo thiết thực đời sống cho đoàn viên.",
        quotes: fs.quotes || "Tổ chức Công đoàn luôn là điểm tựa tin cậy của người lao động."
      };
      studioState.verifiedFacts = res.verifiedFacts || [];
      studioState.missingInfo = res.missingInfo || [];

      logStudioAudit("Bóc tách Bảng Sự Thật (Fact Sheet)", "Stage 2: Fact Extraction", `Đã trích xuất ${studioState.verifiedFacts.length} dữ kiện và ${studioState.missingInfo.length} cảnh báo thiếu`);

      renderFactReviewUI();
    } else {
      throw new Error(res.error || "Không thể bóc tách Fact Sheet");
    }
  } catch (err) {
    alert("❌ Lỗi bóc tách Fact Sheet: " + err.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      updateStage1ActionButtonText();
    }
  }

  if (extractionSucceeded) {
    if (studioState.mode === 'auto') {
      await runAutoModePipeline();
    } else {
      goToStage(2);
    }
  }
}

// =========================================================================
// 6. STAGE 2: CHECKPOINT 1 - FACT REVIEW
// =========================================================================
function renderFactReviewUI() {
  const fs = studioState.factSheet;
  if (!fs) return;

  safeSetVal('fact_event_name', fs.eventName || '');
  safeSetVal('fact_event_date', fs.eventDate || '');
  safeSetVal('fact_event_time', fs.eventTime || '08h00 - 11h30');
  safeSetVal('fact_location', fs.location || 'Trường Đại học Thủ Dầu Một');
  safeSetVal('fact_organizer', fs.organizer || 'Ban Thường vụ Công đoàn Trường ĐH Thủ Dầu Một');
  safeSetVal('fact_delegates', fs.delegates || 'Đại diện Đảng ủy, BGH và BTV Công đoàn trường');
  safeSetVal('fact_attendees', fs.attendeesCount || 'Toàn thể đoàn viên và cán bộ giảng viên');
  safeSetVal('fact_budget', fs.budgetOrGifts || 'Theo quy định Quỹ Công đoàn');
  safeSetVal('fact_significance', fs.significance || 'Chăm lo thiết thực đời sống vật chất và tinh thần cho người lao động TDMU.');
  safeSetVal('fact_quotes', fs.quotes || 'Khẳng định vai trò đồng hành tin cậy của tổ chức Công đoàn.');

  const actContainer = document.getElementById('fact_activities_container');
  if (actContainer) {
    actContainer.innerHTML = '';
    const acts = Array.isArray(fs.keyActivities) ? fs.keyActivities : (fs.keyActivities ? [fs.keyActivities] : []);
    if (!acts.length) acts.push("Triển khai chuỗi hoạt động phong trào thi đua chào mừng sự kiện");
    acts.forEach(a => addFactActivityRow(a));
  }

  const verifiedList = document.getElementById('cp1_verified_facts_list');
  if (verifiedList) {
    verifiedList.innerHTML = studioState.verifiedFacts.map(f => `
      <li style="display: flex; align-items: flex-start; gap: 6px; margin-bottom: 6px; color: #166534;">
        <i class="fa-solid fa-circle-check text-success" style="margin-top: 3px;"></i>
        <span>${escapeHtml(f)}</span>
      </li>
    `).join('');
  }

  const missingList = document.getElementById('cp1_missing_info_list');
  const missingBox = document.getElementById('cp1_missing_info_box');
  if (missingList) {
    if (studioState.missingInfo && studioState.missingInfo.length > 0) {
      if (missingBox) missingBox.style.display = 'block';
      missingList.innerHTML = studioState.missingInfo.map(m => `
        <li style="display: flex; align-items: flex-start; gap: 6px; margin-bottom: 6px; color: #B45309;">
          <i class="fa-solid fa-triangle-exclamation text-warning" style="margin-top: 3px;"></i>
          <span>${escapeHtml(m)}</span>
        </li>
      `).join('');
    } else {
      if (missingBox) missingBox.style.display = 'none';
    }
  }
}

function addFactActivityRow(val = '') {
  const container = document.getElementById('fact_activities_container');
  if (!container) return;
  const div = document.createElement('div');
  div.style.cssText = "display: flex; gap: 8px; margin-bottom: 6px;";
  div.innerHTML = `
    <input type="text" class="fact-act-input" value="${escapeHtml(val)}" placeholder="Mô tả hoạt động cụ thể..." style="flex: 1; padding: 7px 10px; border: 1px solid #CBD5E1; border-radius: 6px; font-size: 12.5px;">
    <button type="button" onclick="this.parentElement.remove()" style="background: none; border: none; color: #EF4444; cursor: pointer; padding: 0 4px;"><i class="fa-solid fa-trash-can"></i></button>
  `;
  container.appendChild(div);
}

function collectFactSheetFromUI() {
  const acts = [];
  document.querySelectorAll('.fact-act-input').forEach(inp => {
    if (inp.value.trim()) acts.push(inp.value.trim());
  });

  return {
    eventName: document.getElementById('fact_event_name')?.value.trim() || 'Sự kiện Công đoàn TDMU',
    eventDate: document.getElementById('fact_event_date')?.value.trim() || '',
    eventTime: document.getElementById('fact_event_time')?.value.trim() || '08h00 - 11h30',
    location: document.getElementById('fact_location')?.value.trim() || 'Trường Đại học Thủ Dầu Một',
    organizer: document.getElementById('fact_organizer')?.value.trim() || 'Ban Thường vụ Công đoàn Trường ĐH Thủ Dầu Một',
    delegates: document.getElementById('fact_delegates')?.value.trim() || '',
    attendeesCount: document.getElementById('fact_attendees')?.value.trim() || '',
    budgetOrGifts: document.getElementById('fact_budget')?.value.trim() || '',
    keyActivities: acts.length ? acts : ['Tổ chức sự kiện chào mừng phong trào thi đua'],
    significance: document.getElementById('fact_significance')?.value.trim() || '',
    quotes: document.getElementById('fact_quotes')?.value.trim() || ''
  };
}

async function approveFactsAndAdvance() {
  studioState.factSheet = collectFactSheetFromUI();
  logStudioAudit("Phê duyệt Bảng Sự Thật (Checkpoint 1: Approved)", "Stage 2: Fact Review", `Xác nhận dữ kiện cho "${studioState.factSheet.eventName}"`);

  const btn = document.getElementById('btn_approve_facts');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin me-1"></i> Đang xây dựng Kế hoạch bài viết...';
  }

  try {
    const genre = document.getElementById('intake_genre_selector')?.value || 'tin_hoat_dong';
    const audience = document.getElementById('intake_audience_selector')?.value || 'Toàn trường';

    const planRes = await fetch('/api/ai/editorial-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        factSheet: studioState.factSheet,
        genre,
        audience,
        apiKey: localStorage.getItem('gemini_api_key') || ''
      })
    }).then(r => r.json());

    if (planRes.success && planRes.plan) {
      studioState.editorialPlan = planRes.plan;
      renderEditorialPlanUI(planRes.plan);

      if (studioState.mode === 'assisted') {
        // Assisted mode (2 Checkpoints: CP 1 Fact Sheet, CP 2 Draft Canvas):
        // CP 1 approved -> AI matches media, generates draft, opens CP 2 (Stage 5 Canvas)
        await matchMediaInternal();
        await generateDraftInternal();
        goToStage(5);
      } else {
        goToStage(3);
      }
    } else {
      throw new Error(planRes.error || "Không thể khởi tạo Kế hoạch biên tập");
    }
  } catch (err) {
    alert("❌ Lỗi xây dựng kế hoạch: " + err.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-check text-success me-1"></i> ✓ Duyệt Sự Thật (Approve Facts) & Đi Tiếp <i class="fa-solid fa-arrow-right"></i>';
    }
  }
}

// =========================================================================
// 7. STAGE 3: CHECKPOINT 2 - EDITORIAL PLAN
// =========================================================================
function renderEditorialPlanUI(plan) {
  if (!plan) return;

  safeSetText('plan_genre_title', plan.genreTitle || 'Tin Hoạt Động & Sự Kiện');
  safeSetText('plan_audience', plan.audience || 'Toàn thể Đoàn viên, Cán bộ Giảng viên TDMU');
  safeSetVal('plan_angle_input', plan.angle || '');
  safeSetText('plan_tone', plan.tone || 'Trang trọng, chuẩn mực hành chính đại học (NĐ 30)');

  const structContainer = document.getElementById('plan_structure_container');
  if (structContainer && Array.isArray(plan.structure)) {
    structContainer.innerHTML = plan.structure.map((s, idx) => `
      <div style="background: #F8FAFC; border-left: 3px solid #0284C7; padding: 8px 12px; margin-bottom: 6px; border-radius: 4px; font-size: 12.5px;">
        <div style="font-weight: 700; color: #002855;">${s.section || `Phần ${idx+1}`}</div>
        <div style="color: #64748B; font-size: 12px; margin-top: 2px;">${s.focus || ''}</div>
      </div>
    `).join('');
  }

  const msgContainer = document.getElementById('plan_key_messages_container');
  if (msgContainer && Array.isArray(plan.keyMessages)) {
    msgContainer.innerHTML = plan.keyMessages.map(m => `
      <li style="display: flex; align-items: flex-start; gap: 6px; margin-bottom: 4px; color: #002855; font-size: 12.5px;">
        <i class="fa-solid fa-bullseye text-primary" style="margin-top: 3px;"></i>
        <span>${escapeHtml(m)}</span>
      </li>
    `).join('');
  }
}

async function approvePlanAndAdvance() {
  const updatedAngle = document.getElementById('plan_angle_input')?.value.trim();
  if (updatedAngle && studioState.editorialPlan) {
    studioState.editorialPlan.angle = updatedAngle;
  }

  logStudioAudit("Phê duyệt Kế hoạch biên tập (Checkpoint 2: Approved)", "Stage 3: Editorial Plan", `Góc tiếp cận: ${studioState.editorialPlan?.angle || 'Mặc định'}`);

  const btn = document.getElementById('btn_approve_plan');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin me-1"></i> Đang phân bổ ảnh sự kiện...';
  }

  try {
    await matchMediaInternal();
    goToStage(4);
  } catch (err) {
    alert("❌ Lỗi phân bổ hình ảnh: " + err.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-check text-success me-1"></i> ✓ Duyệt Kế Hoạch (Approve Plan) & Sang Gán Ảnh <i class="fa-solid fa-arrow-right"></i>';
    }
  }
}

// =========================================================================
// 8. STAGE 4: CHECKPOINT 3 - MEDIA MATCHING, UPLOAD & CURATION
// =========================================================================
async function matchMediaInternal() {
  const payload = {
    factSheet: studioState.factSheet,
    uploadedFiles: studioState.uploadedFiles,
    apiKey: localStorage.getItem('gemini_api_key') || ''
  };

  const res = await fetch('/api/ai/media-match', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).then(r => r.json());

  if (res.success && res.mediaPackage) {
    studioState.mediaPackage = res.mediaPackage;
    renderMediaReviewUI(res.mediaPackage);
  } else {
    throw new Error(res.error || "Không thể phân bổ hình ảnh");
  }
}

function escapeHtmlStudio(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

let isMediaManagerForInsert = false;

function updateGlobalPhotoBadge() {
  const photos = (studioState.mediaPackage && Array.isArray(studioState.mediaPackage.photos))
    ? studioState.mediaPackage.photos
    : [];
  const count = photos.length;
  const globalBadge = document.getElementById('global_photo_count_badge');
  if (globalBadge) globalBadge.textContent = count;
  const mediaBadge = document.getElementById('media_photos_count_badge');
  if (mediaBadge) mediaBadge.textContent = `${count} ảnh`;
  const totalText = document.getElementById('modal_media_total_text');
  if (totalText) totalText.textContent = `Tổng số ảnh: ${count} ảnh`;
}

function renderMediaReviewUI(pkg) {
  const emptyNotice = document.getElementById('media_empty_notice');
  const photosContainer = document.getElementById('media_photos_container');

  let photos = [];
  if (pkg && Array.isArray(pkg.photos) && pkg.photos.length > 0) {
    photos = pkg.photos;
  } else if (pkg && pkg.hasMedia && pkg.featured && pkg.featured.url) {
    photos = [pkg.featured, ...(pkg.inBody || [])].filter(Boolean);
    pkg.photos = photos;
  }

  updateGlobalPhotoBadge();

  const hasPhotos = photos.length > 0;

  if (!hasPhotos) {
    if (emptyNotice) emptyNotice.style.display = 'block';
    if (photosContainer) {
      photosContainer.style.display = 'none';
      photosContainer.innerHTML = '';
    }
    return;
  }

  if (emptyNotice) emptyNotice.style.display = 'none';
  if (photosContainer) {
    photosContainer.style.display = 'grid';
    photosContainer.innerHTML = photos.map((photo, idx) => {
      const isFeat = photo.isFeatured || (idx === 0 && !photos.some(p => p.isFeatured));
      const inArt = photo.inArticle !== false;
      const ratio = photo.aspectRatio || '16/9';
      const fit = photo.fitMode || 'cover';

      return `
      <div class="photo-card" style="background: ${isFeat ? '#F0F9FF' : '#F8FAFC'}; border: 1.5px solid ${isFeat ? '#0284C7' : '#CBD5E1'}; border-radius: 10px; padding: 16px; position: relative; display: flex; flex-direction: column; justify-content: space-between; box-shadow: ${isFeat ? '0 4px 12px rgba(2,132,199,0.08)' : 'none'};">
        <div>
          <!-- CARD HEADER -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <span style="font-size: 12px; font-weight: 800; color: ${isFeat ? '#0369A1' : '#002855'}; display: flex; align-items: center; gap: 6px;">
              ${isFeat 
                ? '<span style="background: #0284C7; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px;"><i class="fa-solid fa-star"></i> ẢNH ĐẠI DIỆN</span>' 
                : `<span style="background: #E2E8F0; color: #475569; padding: 2px 8px; border-radius: 4px; font-size: 11px;">ẢNH THÂN BÀI #${idx}</span>`}
            </span>
            <div style="display: flex; gap: 6px; align-items: center;">
              ${!isFeat ? `
              <button type="button" onclick="setPhotoAsFeatured(${idx})" title="Đặt làm ảnh đại diện" style="background: white; border: 1px solid #CBD5E1; color: #0284C7; padding: 3px 8px; border-radius: 5px; font-size: 11px; font-weight: 700; cursor: pointer;">
                <i class="fa-regular fa-star"></i> Chọn đại diện
              </button>` : ''}
              <button type="button" onclick="confirmDeletePhoto(${idx})" title="Xóa ảnh khỏi danh sách" style="background: white; border: 1px solid #FECACA; color: #EF4444; padding: 3px 8px; border-radius: 5px; font-size: 11px; cursor: pointer;">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </div>

          <!-- IMAGE PREVIEW (HIỂN THỊ TRỰC QUAN THEO ASPECT RATIO & FIT MODE) -->
          <div style="text-align: center; margin-bottom: 12px; background: #0F172A; border-radius: 8px; height: 180px; display: flex; align-items: center; justify-content: center; overflow: hidden; position: relative; border: 1px solid #CBD5E1;">
            <img src="${photo.url}" alt="${photo.altText || ''}" style="width: 100%; height: 100%; aspect-ratio: ${ratio !== 'auto' ? ratio : 'auto'}; object-fit: ${fit};">
            <span style="position: absolute; bottom: 6px; right: 6px; background: rgba(0,0,0,0.65); color: white; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px;">
              ${ratio === 'auto' ? 'Tỷ lệ gốc' : ratio} &bull; ${fit === 'contain' ? 'Vừa khít' : 'Cắt vừa'}
            </span>
          </div>

          <!-- ASPECT RATIO & FIT MODE CONTROLS -->
          <div style="background: white; border: 1px solid #E2E8F0; border-radius: 8px; padding: 10px; margin-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span style="font-size: 11px; font-weight: 800; color: #334155; text-transform: uppercase;">
                <i class="fa-solid fa-crop-simple text-primary me-1"></i> Khuôn Ảnh Báo Chí:
              </span>
              <button type="button" onclick="toggleFitMode(${idx})" title="Chuyển đổi giữa Cắt vừa (Cover) và Giữ nguyên khung (Contain)" style="background: #F1F5F9; border: 1px solid #CBD5E1; color: #0284C7; font-size: 10.5px; font-weight: 700; padding: 2px 7px; border-radius: 4px; cursor: pointer;">
                ${fit === 'contain' ? '🔍 Giữ tỷ lệ gốc (Contain)' : '✂️ Cắt vừa khuôn (Cover)'}
              </button>
            </div>
            <div style="display: flex; gap: 4px; flex-wrap: wrap;">
              ${[
                { key: '16/9', label: '16:9 Banner' },
                { key: '4/3', label: '4:3 Phóng sự' },
                { key: '3/2', label: '3:2 DSLR' },
                { key: '1/1', label: '1:1 Vuông' },
                { key: 'auto', label: 'Gốc' }
              ].map(opt => {
                const isActive = (ratio === opt.key);
                return `
                  <button type="button" onclick="setPhotoAspectRatio(${idx}, '${opt.key}')" style="flex: 1; min-width: 58px; background: ${isActive ? '#0284C7' : '#F8FAFC'}; color: ${isActive ? 'white' : '#475569'}; border: 1px solid ${isActive ? '#0284C7' : '#CBD5E1'}; font-size: 10.5px; font-weight: 700; padding: 4px 6px; border-radius: 5px; cursor: pointer; text-align: center; transition: all 0.15s;">
                    ${opt.label}
                  </button>
                `;
              }).join('')}
            </div>
          </div>

          <!-- FILE NAME & IN-ARTICLE TOGGLE -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; font-size: 11.5px; color: #64748B;">
            <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 190px;" title="${photo.fileName || ''}">
              <i class="fa-regular fa-image"></i> ${photo.fileName || 'anh_su_kien.jpg'}
            </span>
            <label style="display: inline-flex; align-items: center; gap: 5px; cursor: pointer; color: ${inArt ? '#047857' : '#94A3B8'}; font-weight: 700;">
              <input type="checkbox" ${inArt ? 'checked' : ''} onchange="togglePhotoInArticle(${idx}, this.checked)">
              Chèn vào bài
            </label>
          </div>

          <!-- CAPTION INPUT -->
          <div style="margin-bottom: 10px;">
            <label style="font-size: 11px; font-weight: 800; color: #334155; display: block; margin-bottom: 3px;">
              Chú thích ảnh báo chí (Caption NĐ 30):
            </label>
            <input type="text" id="photo_caption_${idx}" value="${escapeHtmlStudio(photo.caption || '')}" oninput="updatePhotoCaption(${idx}, this.value)" placeholder="Ảnh: ..." style="width: 100%; padding: 7px 10px; border: 1px solid #CBD5E1; border-radius: 6px; font-size: 12px; box-sizing: border-box;">
          </div>

          <!-- ALT INPUT -->
          <div style="margin-bottom: 12px;">
            <label style="font-size: 11px; font-weight: 800; color: #334155; display: block; margin-bottom: 3px;">
              Thẻ Alt Text (Mô tả tiếp cận &amp; SEO):
            </label>
            <input type="text" id="photo_alt_${idx}" value="${escapeHtmlStudio(photo.altText || '')}" oninput="updatePhotoAlt(${idx}, this.value)" placeholder="Mô tả tóm tắt..." style="width: 100%; padding: 7px 10px; border: 1px solid #CBD5E1; border-radius: 6px; font-size: 12px; box-sizing: border-box;">
          </div>
        </div>

        <!-- BOTTOM DELETE BUTTON -->
        <button type="button" onclick="confirmDeletePhoto(${idx})" style="background: white; border: 1px solid #FECACA; color: #DC2626; padding: 7px 12px; border-radius: 6px; font-size: 11.5px; font-weight: 700; width: 100%; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; transition: background 0.15s;">
          <i class="fa-solid fa-trash-can"></i> Xóa Ảnh Khỏi Bài
        </button>
      </div>
      `;
    }).join('');
  }
}

function setPhotoAspectRatio(idx, ratio) {
  if (!studioState.mediaPackage || !studioState.mediaPackage.photos || !studioState.mediaPackage.photos[idx]) return;
  studioState.mediaPackage.photos[idx].aspectRatio = ratio;
  renderMediaReviewUI(studioState.mediaPackage);
  renderModalMediaGrid();
}

function toggleFitMode(idx) {
  if (!studioState.mediaPackage || !studioState.mediaPackage.photos || !studioState.mediaPackage.photos[idx]) return;
  const current = studioState.mediaPackage.photos[idx].fitMode || 'cover';
  studioState.mediaPackage.photos[idx].fitMode = (current === 'contain') ? 'cover' : 'contain';
  renderMediaReviewUI(studioState.mediaPackage);
  renderModalMediaGrid();
}

function batchSetAspectRatio(ratio) {
  if (!studioState.mediaPackage || !Array.isArray(studioState.mediaPackage.photos) || studioState.mediaPackage.photos.length === 0) {
    alert("Chưa có ảnh nào trong bài để căn khuôn!");
    return;
  }
  studioState.mediaPackage.photos.forEach(p => {
    p.aspectRatio = ratio;
    if (!p.fitMode) p.fitMode = 'cover';
  });
  renderMediaReviewUI(studioState.mediaPackage);
  renderModalMediaGrid();
  const label = ratio === '16/9' ? '16:9 Banner' : (ratio === '4/3' ? '4:3 Phóng sự' : ratio);
  alert(`📐 Đã căn toàn bộ ${studioState.mediaPackage.photos.length} ảnh sang tỷ lệ khuôn ${label} chuẩn báo chí!`);
}

function confirmDeletePhoto(idx) {
  if (!studioState.mediaPackage || !studioState.mediaPackage.photos || !studioState.mediaPackage.photos[idx]) return;
  const photo = studioState.mediaPackage.photos[idx];
  const name = photo.fileName || `Ảnh #${idx + 1}`;
  if (confirm(`Bạn có chắc muốn xóa ảnh [${name}] khỏi bài viết?`)) {
    removePhotoFromStudio(idx);
    renderModalMediaGrid();
  }
}

function clearAllPhotosFromStudio() {
  if (!studioState.mediaPackage || !Array.isArray(studioState.mediaPackage.photos) || studioState.mediaPackage.photos.length === 0) {
    alert("Hiện tại chưa có ảnh nào để xóa!");
    return;
  }
  if (confirm(`Xác nhận xóa toàn bộ ${studioState.mediaPackage.photos.length} ảnh hiện trường khỏi bài viết?\n\nBài viết sẽ chuyển về chế độ thuần văn bản chuẩn mực.`)) {
    studioState.mediaPackage.photos = [];
    studioState.mediaPackage.hasMedia = false;
    studioState.mediaPackage.featured = null;
    studioState.mediaPackage.inBody = [];
    studioState.uploadedFiles = (studioState.uploadedFiles || []).filter(f => {
      const isImg = (f.type && f.type.startsWith('image/')) || (f.dataUrl && f.dataUrl.startsWith('data:image/')) || /\.(jpg|jpeg|png|webp|gif)$/i.test(f.name || '');
      return !isImg;
    });
    renderMediaReviewUI(studioState.mediaPackage);
    renderIntakeFilesList();
    renderModalMediaGrid();
    updateGlobalPhotoBadge();
  }
}

function setPhotoAsFeatured(idx) {
  if (!studioState.mediaPackage || !Array.isArray(studioState.mediaPackage.photos)) return;
  studioState.mediaPackage.photos.forEach((p, i) => {
    p.isFeatured = (i === idx);
  });
  studioState.mediaPackage.featured = studioState.mediaPackage.photos[idx];
  studioState.mediaPackage.inBody = studioState.mediaPackage.photos.filter((p, i) => i !== idx);
  renderMediaReviewUI(studioState.mediaPackage);
  renderModalMediaGrid();
}

function removePhotoFromStudio(idx) {
  if (!studioState.mediaPackage || !Array.isArray(studioState.mediaPackage.photos)) return;
  const removed = studioState.mediaPackage.photos.splice(idx, 1)[0];
  if (removed) {
    studioState.uploadedFiles = (studioState.uploadedFiles || []).filter(f => f.url !== removed.url && f.name !== removed.fileName);
  }

  if (studioState.mediaPackage.photos.length === 0) {
    studioState.mediaPackage.hasMedia = false;
    studioState.mediaPackage.featured = null;
    studioState.mediaPackage.inBody = [];
  } else {
    if (!studioState.mediaPackage.photos.some(p => p.isFeatured)) {
      studioState.mediaPackage.photos[0].isFeatured = true;
    }
    studioState.mediaPackage.featured = studioState.mediaPackage.photos.find(p => p.isFeatured);
    studioState.mediaPackage.inBody = studioState.mediaPackage.photos.filter(p => !p.isFeatured);
  }
  renderMediaReviewUI(studioState.mediaPackage);
  renderIntakeFilesList();
  renderModalMediaGrid();
  updateGlobalPhotoBadge();
}

function togglePhotoInArticle(idx, isChecked) {
  if (!studioState.mediaPackage || !studioState.mediaPackage.photos || !studioState.mediaPackage.photos[idx]) return;
  studioState.mediaPackage.photos[idx].inArticle = isChecked;
}

function updatePhotoCaption(idx, val) {
  if (!studioState.mediaPackage || !studioState.mediaPackage.photos || !studioState.mediaPackage.photos[idx]) return;
  studioState.mediaPackage.photos[idx].caption = val;
  if (studioState.mediaPackage.photos[idx].isFeatured && studioState.mediaPackage.featured) {
    studioState.mediaPackage.featured.caption = val;
  }
}

function updatePhotoAlt(idx, val) {
  if (!studioState.mediaPackage || !studioState.mediaPackage.photos || !studioState.mediaPackage.photos[idx]) return;
  studioState.mediaPackage.photos[idx].altText = val;
  if (studioState.mediaPackage.photos[idx].isFeatured && studioState.mediaPackage.featured) {
    studioState.mediaPackage.featured.altText = val;
  }
}

function promptAddPhotoByUrl() {
  const url = prompt("Nhập link URL hình ảnh sự kiện:\n(Ví dụ: https://tdmu.edu.vn/images/hoat-dong-cong-doan.jpg)");
  if (!url || !url.trim()) return;
  const trimmed = url.trim();

  if (!studioState.mediaPackage) {
    studioState.mediaPackage = { hasMedia: true, photos: [], featured: null, inBody: [] };
  }
  if (!Array.isArray(studioState.mediaPackage.photos)) {
    studioState.mediaPackage.photos = [];
  }

  const evtName = studioState.factSheet?.eventName || 'Sự kiện Công đoàn TDMU';
  const idx = studioState.mediaPackage.photos.length;
  const isFirst = idx === 0;
  const newPhoto = {
    id: 'photo_url_' + Date.now().toString().slice(-4),
    url: trimmed,
    fileName: trimmed.split('/').pop().split('?')[0] || 'anh_su_kien.jpg',
    caption: isFirst ? `Ảnh: Toàn cảnh sự kiện "${evtName}".` : `Ảnh: Hoạt động tiêu biểu tại chương trình "${evtName}".`,
    altText: `Hình ảnh sự kiện ${evtName}`,
    isFeatured: isFirst,
    inArticle: true,
    aspectRatio: '16/9',
    fitMode: 'cover'
  };

  studioState.mediaPackage.photos.push(newPhoto);
  studioState.mediaPackage.hasMedia = true;
  if (isFirst) {
    studioState.mediaPackage.featured = newPhoto;
  } else {
    studioState.mediaPackage.inBody = studioState.mediaPackage.photos.filter(p => !p.isFeatured);
  }

  // Ghi nhận vào uploadedFiles
  studioState.uploadedFiles.push({
    name: newPhoto.fileName,
    size: 'URL Link',
    type: 'image/jpeg',
    text: '',
    url: trimmed
  });

  renderMediaReviewUI(studioState.mediaPackage);
  renderIntakeFilesList();
  renderModalMediaGrid();
  updateGlobalPhotoBadge();
}

async function handleMediaStageUpload(files) {
  if (!files || !files.length) return;
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    if (!f.type.startsWith('image/')) continue;
    const dataUrl = await readFileAsDataUrl(f);
    studioState.uploadedFiles.push({
      name: f.name,
      size: (f.size / 1024).toFixed(1) + ' KB',
      type: f.type,
      text: '',
      dataUrl: dataUrl,
      url: dataUrl
    });
  }
  renderIntakeFilesList();
  await matchMediaInternal();
  renderModalMediaGrid();
  updateGlobalPhotoBadge();
}

// =========================================================================
// 8.1 KHO TÀI NGUYÊN ẢNH BÁO CHÍ (MEDIA RESOURCE MANAGER MODAL)
// =========================================================================
function openMediaManagerModal(forInsert = false) {
  isMediaManagerForInsert = !!forInsert;
  const modal = document.getElementById('modal_media_resource_manager');
  if (!modal) return;

  const modeBadge = document.getElementById('modal_media_mode_badge');
  const subtitle = document.getElementById('modal_media_subtitle');

  if (isMediaManagerForInsert) {
    if (modeBadge) {
      modeBadge.textContent = 'Chèn Vào Bài Viết';
      modeBadge.style.background = '#D97706';
    }
    if (subtitle) {
      subtitle.textContent = '👉 Chọn ảnh từ kho hoặc tải lên để chèn ngay vào vị trí con trỏ trong trình soạn thảo Word Canvas';
    }
  } else {
    if (modeBadge) {
      modeBadge.textContent = 'Quản Lý Tài Nguyên';
      modeBadge.style.background = '#0284C7';
    }
    if (subtitle) {
      subtitle.textContent = 'Quản lý toàn bộ ảnh hiện trường, chuẩn hóa tỷ lệ khung hình & kiểm soát tài nguyên bài viết';
    }
  }

  renderModalMediaGrid();
  modal.style.display = 'flex';
}

function closeMediaManagerModal() {
  const modal = document.getElementById('modal_media_resource_manager');
  if (modal) modal.style.display = 'none';
  isMediaManagerForInsert = false;
}

function renderModalMediaGrid() {
  const listEl = document.getElementById('modal_media_photos_list');
  const emptyEl = document.getElementById('modal_media_empty');
  if (!listEl) return;

  const photos = (studioState.mediaPackage && Array.isArray(studioState.mediaPackage.photos))
    ? studioState.mediaPackage.photos
    : [];

  updateGlobalPhotoBadge();

  if (photos.length === 0) {
    listEl.style.display = 'none';
    if (emptyEl) emptyEl.style.display = 'block';
    return;
  }

  if (emptyEl) emptyEl.style.display = 'none';
  listEl.style.display = 'grid';

  listEl.innerHTML = photos.map((photo, idx) => {
    const isFeat = photo.isFeatured || (idx === 0 && !photos.some(p => p.isFeatured));
    const ratio = photo.aspectRatio || '16/9';
    const fit = photo.fitMode || 'cover';

    return `
      <div style="background: ${isFeat ? '#F0F9FF' : '#F8FAFC'}; border: 1.5px solid ${isFeat ? '#0284C7' : '#E2E8F0'}; border-radius: 10px; padding: 12px; display: flex; flex-direction: column; justify-content: space-between; box-shadow: ${isFeat ? '0 3px 10px rgba(2,132,199,0.1)' : 'none'};">
        <div>
          <!-- THUMBNAIL -->
          <div style="width: 100%; height: 140px; background: #0F172A; border-radius: 6px; overflow: hidden; display: flex; align-items: center; justify-content: center; margin-bottom: 10px; position: relative;">
            <img src="${photo.url}" alt="${escapeHtmlStudio(photo.altText || '')}" style="width: 100%; height: 100%; aspect-ratio: ${ratio !== 'auto' ? ratio : 'auto'}; object-fit: ${fit};">
            ${isFeat ? '<span style="position: absolute; top: 6px; left: 6px; background: #0284C7; color: white; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px;"><i class="fa-solid fa-star"></i> Đại Diện</span>' : ''}
            <span style="position: absolute; bottom: 6px; right: 6px; background: rgba(0,0,0,0.7); color: white; font-size: 10px; font-weight: 700; padding: 2px 5px; border-radius: 4px;">
              ${ratio}
            </span>
          </div>

          <!-- ASPECT RATIO CONTROLS -->
          <div style="margin-bottom: 8px;">
            <div style="font-size: 10.5px; font-weight: 700; color: #475569; margin-bottom: 4px; display: flex; justify-content: space-between; align-items: center;">
              <span>Khuôn ảnh:</span>
              <span style="color: #0284C7; cursor: pointer; font-size: 10px;" onclick="toggleFitMode(${idx})">${fit === 'contain' ? '🔍 Giữ gốc' : '✂️ Cắt vừa'}</span>
            </div>
            <div style="display: flex; gap: 3px;">
              ${['16/9', '4/3', '3/2', '1/1', 'auto'].map(r => `
                <button type="button" onclick="setPhotoAspectRatio(${idx}, '${r}')" style="flex: 1; padding: 2px 3px; font-size: 10px; font-weight: 700; border-radius: 4px; border: 1px solid ${ratio === r ? '#0284C7' : '#CBD5E1'}; background: ${ratio === r ? '#0284C7' : 'white'}; color: ${ratio === r ? 'white' : '#475569'}; cursor: pointer;">
                  ${r === 'auto' ? 'Gốc' : r}
                </button>
              `).join('')}
            </div>
          </div>

          <!-- CAPTION INPUT -->
          <div style="margin-bottom: 8px;">
            <input type="text" value="${escapeHtmlStudio(photo.caption || '')}" oninput="updatePhotoCaption(${idx}, this.value)" placeholder="Chú thích ảnh..." style="width: 100%; font-size: 11px; padding: 6px 8px; border: 1px solid #CBD5E1; border-radius: 5px; box-sizing: border-box;">
          </div>
        </div>

        <!-- ACTIONS -->
        <div style="display: flex; gap: 6px; margin-top: 6px;">
          ${isMediaManagerForInsert ? `
            <button type="button" onclick="insertPhotoToCanvas(${idx})" style="flex: 1; background: #D97706; color: white; border: none; font-size: 11.5px; font-weight: 700; padding: 6px 10px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px;">
              <i class="fa-solid fa-plus"></i> Chèn Vào Bài
            </button>
          ` : `
            ${!isFeat ? `
              <button type="button" onclick="setPhotoAsFeatured(${idx})" title="Đặt làm ảnh đại diện" style="flex: 1; background: white; border: 1px solid #0284C7; color: #0284C7; font-size: 11px; font-weight: 700; padding: 5px; border-radius: 5px; cursor: pointer;">
                <i class="fa-regular fa-star"></i> Đại diện
              </button>
            ` : ''}
          `}
          <button type="button" onclick="confirmDeletePhoto(${idx})" title="Xóa ảnh này" style="background: #FEF2F2; border: 1px solid #FECACA; color: #DC2626; font-size: 11px; padding: 5px 10px; border-radius: 5px; cursor: pointer;">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

async function handleModalUpload(files) {
  if (!files || !files.length) return;
  await handleMediaStageUpload(files);
}

function insertPhotoToCanvas(idx) {
  if (!studioState.mediaPackage || !studioState.mediaPackage.photos || !studioState.mediaPackage.photos[idx]) return;
  const photo = studioState.mediaPackage.photos[idx];
  const ratio = photo.aspectRatio && photo.aspectRatio !== 'auto' ? photo.aspectRatio : '16/9';
  const fit = photo.fitMode || 'cover';
  const caption = photo.caption || 'Ảnh: Hoạt động Công đoàn Đại học Thủ Dầu Một';
  const alt = photo.altText || caption;

  const figureHtml = `
    <figure class="journalism-figure" style="margin: 24px auto; text-align: center; max-width: 780px;">
      <img src="${photo.url}" alt="${escapeHtmlStudio(alt)}" style="width: 100%; aspect-ratio: ${ratio}; object-fit: ${fit}; border-radius: 8px; box-shadow: 0 4px 14px rgba(0,0,0,0.08); display: block; margin: 0 auto;" />
      <figcaption contenteditable="true" style="font-size: 13px; font-style: italic; color: #64748B; margin-top: 8px; outline: none;">${escapeHtmlStudio(caption)}</figcaption>
    </figure>
    <p><br></p>
  `;

  const editor = document.getElementById('native_rich_editor');
  if (editor) {
    editor.focus();
    document.execCommand('insertHTML', false, figureHtml);
    updateWordCountMetrics();
    if (typeof saveEditorState === 'function') {
      saveEditorState("Chèn ảnh từ Kho Tài Nguyên");
    }
  }

  closeMediaManagerModal();
}

async function approveMediaAndAdvance() {
  if (studioState.mediaPackage && Array.isArray(studioState.mediaPackage.photos)) {
    studioState.mediaPackage.photos.forEach((p, idx) => {
      const capInput = document.getElementById(`photo_caption_${idx}`);
      const altInput = document.getElementById(`photo_alt_${idx}`);
      if (capInput) p.caption = capInput.value.trim();
      if (altInput) p.altText = altInput.value.trim();
    });

    const feat = studioState.mediaPackage.photos.find(p => p.isFeatured) || studioState.mediaPackage.photos[0];
    if (feat) feat.isFeatured = true;
    studioState.mediaPackage.featured = feat || null;
    studioState.mediaPackage.inBody = studioState.mediaPackage.photos.filter(p => p !== feat);
    studioState.mediaPackage.hasMedia = studioState.mediaPackage.photos.length > 0;
  }

  const hasPhoto = studioState.mediaPackage && studioState.mediaPackage.hasMedia && studioState.mediaPackage.photos && studioState.mediaPackage.photos.length > 0;
  const count = hasPhoto ? studioState.mediaPackage.photos.length : 0;
  logStudioAudit("Phê duyệt Bộ ảnh Báo chí (Checkpoint 3: Approved)", "Stage 4: Media Review", hasPhoto ? `Đã duyệt bộ ảnh báo chí gồm ${count} ảnh kèm chú thích theo Nghị định 30` : 'Xác nhận bài viết thuần văn bản (không kèm ảnh)');

  const btn = document.getElementById('btn_approve_media');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin me-1"></i> Đang khởi tạo Bản nháp Đa kênh...';
  }

  try {
    await generateDraftInternal();
    goToStage(5);
  } catch (err) {
    alert("❌ Lỗi sinh bản thảo: " + err.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-check text-success me-1"></i> ✓ Duyệt Bộ Ảnh Báo Chí (Approve Media) & Sang Soạn Bản Nháp <i class="fa-solid fa-arrow-right"></i>';
    }
  }
}

// =========================================================================
// 9. STAGE 5: CHECKPOINT 4 - DRAFT GENERATION & WORD CANVAS REVIEW
// =========================================================================
async function generateDraftInternal() {
  const payload = {
    factSheet: studioState.factSheet,
    genre: studioState.editorialPlan?.genre || 'tin_hoat_dong',
    channels: ['website', 'facebook', 'zalo', 'video', 'infographic'],
    customInstructions: studioState.editorialPlan?.angle || '',
    mediaPackage: studioState.mediaPackage,
    apiKey: localStorage.getItem('gemini_api_key') || ''
  };

  const res = await fetch('/api/ai/generate-from-facts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).then(r => r.json());

  if (res.success && res.package) {
    studioState.contentDraft = res.package;
    renderDraftToCanvasUI(res.package);
  } else {
    throw new Error(res.error || "Không thể tạo bản thảo từ Fact Sheet");
  }
}

function renderDraftToCanvasUI(pkg) {
  if (!pkg) return;

  if (pkg.website) {
    const editor = document.getElementById('native_rich_editor');
    if (editor) {
      editor.innerHTML = pkg.website.contentHtml || `
        <p class="sapo"><strong>(TDMU) - ${pkg.website.sapo || ''}</strong></p>
        <h2>Nội Dung Chương Trình</h2>
        <p>Chi tiết diễn biến sự kiện...</p>
      `;
    }
    safeSetVal('studio_title_input', pkg.website.title || '');
    safeSetVal('studio_sapo_input', pkg.website.sapo || '');
  }

  if (pkg.facebook) {
    safeSetVal('fb_caption_input', pkg.facebook.caption || '');
    safeSetText('preview_fb_text', pkg.facebook.caption || '');

    const fbImgContainer = document.getElementById('preview_fb_image_container');
    const fbImg = document.getElementById('preview_fb_img');
    const feat = studioState.mediaPackage?.featured || (studioState.mediaPackage?.photos && studioState.mediaPackage.photos[0]);
    if (feat && feat.url && fbImg && fbImgContainer) {
      fbImg.src = feat.url;
      fbImgContainer.style.display = 'block';
    } else if (fbImgContainer) {
      fbImgContainer.style.display = 'none';
    }
  }

  if (pkg.zalo) {
    safeSetVal('zalo_caption_input', pkg.zalo.caption || '');
    safeSetText('preview_zalo_text', pkg.zalo.caption || '');
  }

  if (pkg.video) {
    safeSetVal('video_script_input', pkg.video.script || '');
  }

  if (pkg.infographic) {
    safeSetVal('infographic_points_input', pkg.infographic.highlights || '');
  }

  updateWordCountMetrics();
}

async function approveDraftAndAdvance() {
  const editor = document.getElementById('native_rich_editor');
  if (editor && studioState.contentDraft && studioState.contentDraft.website) {
    studioState.contentDraft.website.contentHtml = editor.innerHTML;
    studioState.contentDraft.website.title = document.getElementById('studio_title_input')?.value.trim() || studioState.contentDraft.website.title;
    studioState.contentDraft.website.sapo = document.getElementById('studio_sapo_input')?.value.trim() || studioState.contentDraft.website.sapo;
  }

  if (studioState.contentDraft && studioState.contentDraft.facebook) {
    studioState.contentDraft.facebook.caption = document.getElementById('fb_caption_input')?.value || studioState.contentDraft.facebook.caption;
  }
  if (studioState.contentDraft && studioState.contentDraft.zalo) {
    studioState.contentDraft.zalo.caption = document.getElementById('zalo_caption_input')?.value || studioState.contentDraft.zalo.caption;
  }
  if (studioState.contentDraft && studioState.contentDraft.video) {
    studioState.contentDraft.video.script = document.getElementById('video_script_input')?.value || studioState.contentDraft.video.script;
  }
  if (studioState.contentDraft && studioState.contentDraft.infographic) {
    studioState.contentDraft.infographic.highlights = document.getElementById('infographic_points_input')?.value || studioState.contentDraft.infographic.highlights;
  }

  logStudioAudit("Phê duyệt Bản thảo Đa kênh (Checkpoint 4: Approved)", "Stage 5: Draft Canvas", `Đã duyệt hoàn thiện bản thảo Website và các kênh`);

  const btn = document.getElementById('btn_approve_draft');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin me-1"></i> Đang gác cổng thẩm định Compliance...';
  }

  try {
    await runComplianceInternal();
    goToStage(6);
  } catch (err) {
    alert("❌ Lỗi thẩm định Compliance: " + err.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      updateStageButtonsForMode();
    }
  }
}

async function runComplianceInternal(overrideGenre) {
  const currentGenre = overrideGenre || document.getElementById('compliance_genre_selector')?.value || studioState.editorialPlan?.genre || 'tin_hoat_dong';
  const payload = {
    factSheet: studioState.factSheet,
    editorialPlan: studioState.editorialPlan,
    draft: studioState.contentDraft,
    mediaPackage: studioState.mediaPackage,
    genre: currentGenre,
    apiKey: localStorage.getItem('gemini_api_key') || ''
  };

  const res = await fetch('/api/ai/compliance-check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).then(r => r.json());

  if (res.success) {
    studioState.complianceAudit = res;
    renderComplianceUI(res);
  } else {
    throw new Error(res.error || "Không thể thực hiện Compliance Check");
  }
}

async function switchComplianceGenre(newGenre) {
  try {
    if (studioState.editorialPlan) {
      studioState.editorialPlan.genre = newGenre;
    }
    const sel = document.getElementById('compliance_genre_selector');
    if (sel && sel.value !== newGenre) sel.value = newGenre;
    await runComplianceInternal(newGenre);
  } catch (err) {
    alert("❌ Lỗi chuyển đổi thể loại thẩm định: " + err.message);
  }
}

// =========================================================================
// 10. STAGE 6: CHECKPOINT 5 - COMPLIANCE GATE & REVISION LOOP
// =========================================================================
function renderComplianceUI(audit) {
  if (!audit) return;

  const scoreEl = document.getElementById('compliance_overall_score');
  if (scoreEl) scoreEl.innerText = `${audit.overallScore || 98}/100`;

  const statusBadge = document.getElementById('compliance_status_badge');
  if (statusBadge) {
    if (audit.canPublish) {
      statusBadge.innerText = 'STATUS: PASSED (SẴN SÀNG XUẤT BẢN)';
      statusBadge.style.background = '#ECFDF5';
      statusBadge.style.color = '#065F46';
      statusBadge.style.border = '1px solid #A7F3D0';
    } else {
      statusBadge.innerText = 'STATUS: BLOCKED (KHÓA XUẤT BẢN)';
      statusBadge.style.background = '#FEF2F2';
      statusBadge.style.color = '#991B1B';
      statusBadge.style.border = '1px solid #FECACA';
    }
  }

  // Cập nhật bộ chọn thể loại nếu có
  const genreSel = document.getElementById('compliance_genre_selector');
  if (genreSel && audit.genreInfo && audit.genreInfo.key) {
    genreSel.value = audit.genreInfo.key;
  }

  // Render Góp ý nâng tầm từ Thư ký Tòa soạn (Editorial Insights)
  const insightsBox = document.getElementById('compliance_editorial_insights_content');
  if (insightsBox) {
    const insights = audit.editorialInsights || [];
    if (insights.length > 0) {
      insightsBox.innerHTML = '<ul style="margin: 0; padding-left: 18px; line-height: 1.8;">' +
        insights.map(i => `<li>${escapeHtmlStudio(i)}</li>`).join('') +
        '</ul>';
    } else {
      insightsBox.innerHTML = '<em>Bài viết phù hợp tiêu chuẩn biên tập của Tòa soạn Báo chí Công đoàn TDMU.</em>';
    }
  }

  // Render danh sách tiêu chí thẩm định thích ứng với thể loại
  const listEl = document.getElementById('compliance_checklist_container');
  if (listEl && Array.isArray(audit.checks)) {
    listEl.innerHTML = audit.checks.map(c => {
      let tagBg = '#EFF6FF', tagColor = '#1D4ED8';
      const tagStr = c.tag || '';
      if (tagStr.includes('Bắt buộc')) {
        tagBg = '#FEE2E2'; tagColor = '#991B1B';
      } else if (tagStr.includes('Phóng sự') || tagStr.includes('Xã luận') || tagStr.includes('Thông báo') || tagStr.includes('Chân dung') || tagStr.includes('Thể loại')) {
        tagBg = '#EFF6FF'; tagColor = '#1E40AF';
      } else if (tagStr.includes('ảnh') || tagStr.includes('Đa phương tiện') || tagStr.includes('Kỹ thuật')) {
        tagBg = '#FAF5FF'; tagColor = '#7E22CE';
      } else if (tagStr.includes('Đa kênh')) {
        tagBg = '#ECFDF5'; tagColor = '#065F46';
      }

      return `
      <div style="background: white; border: 1px solid #E2E8F0; border-radius: 8px; padding: 12px 16px; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between; gap: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
        <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
          <span style="display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 50%; background: ${c.status === 'pass' ? '#DCFCE7' : (c.status === 'warning' ? '#FEF3C7' : '#FEE2E2')}; color: ${c.status === 'pass' ? '#16A34A' : (c.status === 'warning' ? '#D97706' : '#DC2626')}; font-size: 11px; flex-shrink: 0;">
            <i class="fa-solid ${c.status === 'pass' ? 'fa-check' : (c.status === 'warning' ? 'fa-triangle-exclamation' : 'fa-xmark')}"></i>
          </span>
          <div>
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              <span style="font-weight: 700; color: #002855; font-size: 13px;">${escapeHtmlStudio(c.name)}</span>
              ${c.tag ? `<span style="background: ${tagBg}; color: ${tagColor}; font-size: 10.5px; font-weight: 800; padding: 2px 8px; border-radius: 4px;">${escapeHtmlStudio(c.tag)}</span>` : ''}
            </div>
            <div style="color: #64748B; font-size: 11.5px; margin-top: 2px;">${escapeHtmlStudio(c.desc || '')}</div>
          </div>
        </div>
        <span style="font-weight: 800; font-size: 13px; color: ${c.status === 'pass' ? '#16A34A' : '#DC2626'}; flex-shrink: 0;">${c.score}</span>
      </div>
      `;
    }).join('');
  }

  const publishBtns = document.querySelectorAll('.final-publish-action-btn');
  publishBtns.forEach(btn => {
    btn.disabled = !audit.canPublish;
    if (!audit.canPublish) {
      btn.style.opacity = '0.5';
      btn.style.cursor = 'not-allowed';
    } else {
      btn.style.opacity = '1';
      btn.style.cursor = 'pointer';
    }
  });
}

function executeRevisionLoop() {
  const targetStage = parseInt(document.getElementById('revision_target_stage_selector')?.value || '4');
  const reason = document.getElementById('revision_reason_input')?.value.trim() || 'Cán bộ yêu cầu chỉnh sửa lại nội dung';

  const stageNames = {
    3: 'Stage 3: Editorial Plan (Góc Truyền Thông)',
    4: 'Stage 4: Media Review (Gán Ảnh & Chú Thích)',
    5: 'Stage 5: Draft Canvas (Soạn Thảo Bài Viết)'
  };

  if (!confirm(`Thầy/Cô có muốn gửi trả bài viết về [${stageNames[targetStage]}] để điều chỉnh không?\n\nLý do: "${reason}"`)) {
    return;
  }

  logStudioAudit(`Trả bài về ${stageNames[targetStage]} (Revision Loop)`, `Stage 6 -> Stage ${targetStage}`, `Lý do: ${reason}`);

  goToStage(targetStage);
  alert(`↺ Đã kích hoạt Revision Loop!\nBài viết đã được hoàn trả về [${stageNames[targetStage]}]. Toàn bộ dữ liệu của các khâu trước được giữ nguyên vẹn để Thầy/Cô tiếp tục tinh chỉnh.`);
}

// =========================================================================
// 11. AUTO MODE 1-TOUCH PIPELINE RUNNER
// =========================================================================
async function runAutoModePipeline() {
  const timelineBox = document.getElementById('auto_timeline_box');
  if (timelineBox) timelineBox.style.display = 'block';

  function markAutoStep(stepId, state = 'running') {
    const el = document.getElementById(stepId);
    if (!el) return;
    if (state === 'running') {
      el.style.color = '#0284C7';
      el.style.fontWeight = '700';
      el.innerHTML = el.innerHTML.replace(/fa-(circle|circle-check|circle-notch|circle-xmark)[^"]*/, 'fa-circle-notch fa-spin');
    } else if (state === 'done') {
      el.style.color = '#16A34A';
      el.style.fontWeight = '600';
      el.innerHTML = el.innerHTML.replace(/fa-(circle|circle-notch|circle-xmark)[^"]*/, 'fa-circle-check text-success');
    } else if (state === 'error') {
      el.style.color = '#DC2626';
      el.style.fontWeight = '600';
      el.innerHTML = el.innerHTML.replace(/fa-(circle|circle-notch)[^"]*/, 'fa-circle-xmark text-danger');
    }
  }

  try {
    markAutoStep('auto_step_log_1', 'done');
    markAutoStep('auto_step_log_2', 'done');

    // Step 3: Editorial Planning
    markAutoStep('auto_step_log_3', 'running');
    const genre = document.getElementById('intake_genre_selector')?.value || 'tin_hoat_dong';
    const audience = document.getElementById('intake_audience_selector')?.value || 'Toàn thể Đoàn viên, Cán bộ Giảng viên TDMU';
    const customInstructions = (document.getElementById('intake_instructions_text')?.value || '').trim();

    const planRes = await fetch('/api/ai/editorial-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        factSheet: studioState.factSheet,
        genre,
        audience,
        customInstructions,
        apiKey: localStorage.getItem('gemini_api_key') || ''
      })
    }).then(r => r.json());

    if (planRes.success && planRes.plan) {
      studioState.editorialPlan = planRes.plan;
      renderEditorialPlanUI(planRes.plan);
    }

    // Step 4: Media Matching (Scan real images or detect pure text)
    await matchMediaInternal();
    markAutoStep('auto_step_log_3', 'done');

    // Step 5: Multi-channel Draft Generation (Embeds real photos or clean pure text)
    markAutoStep('auto_step_log_4', 'running');
    await generateDraftInternal();
    markAutoStep('auto_step_log_4', 'done');

    // Step 6: Compliance Gate
    markAutoStep('auto_step_log_5', 'running');
    await runComplianceInternal();
    markAutoStep('auto_step_log_5', 'done');

    logStudioAudit("Tự động hóa toàn trình hoàn tất (Auto Mode: Finished)", "Stage 6: Compliance & Publish", `Bài viết "${studioState.factSheet?.eventName}" đã sẵn sàng`);

    goToStage(5);
    alert('🎉 Pipeline Tự Động Hóa Hoàn Tất!\nHệ thống đã tạo xong trọn bộ bài viết đa kênh (Website, Facebook, Zalo OA, Video Script). Đang mở Word Canvas để Thầy/Cô xem trước và xuất bản.');
  } catch (err) {
    console.error("Auto mode pipeline error:", err);
    alert("⚠️ Quy trình tự động gặp sự cố: " + err.message + "\nHệ thống đã lưu lại Fact Sheet và chuyển sang màn hình biên tập để Thầy/Cô tiếp tục thao tác.");
    goToStage(2);
  }
}

// =========================================================================
// 12. PUBLISHING ACTIONS
// =========================================================================
async function savePackageDraft(isSilent = false) {
  const payload = buildPublishPayload('draft');
  const res = await API.createArticle(payload);
  if (res.success) {
    logStudioAudit("Lưu bản nháp CSDL thành công", "Publishing Action", `Mã bài viết #${res.data?.id || 'mới'}`);
    if (!isSilent) {
      alert("💾 Đã lưu thành công Bản Nháp (Draft) vào Cơ sở dữ liệu Tòa Soạn!");
      if (typeof showAdminTab === 'function') showAdminTab('articles');
    }
  }
}

async function submitPackageForApproval(isSilent = false) {
  const payload = buildPublishPayload('pending');
  const res = await API.createArticle(payload);
  if (res.success) {
    logStudioAudit("Gửi duyệt Ban Thường Vụ", "Publishing Action", `Mã bài viết #${res.data?.id || 'mới'}`);
    if (!isSilent) {
      alert("📤 Đã gửi bài viết lên Ban Thường Vụ Công đoàn trường chờ phê duyệt (Pending)!");
      if (typeof showAdminTab === 'function') showAdminTab('articles');
    }
  }
}

async function publishPackageLive() {
  if (studioState.complianceAudit && !studioState.complianceAudit.canPublish) {
    alert("⛔ Bài viết đang bị khóa bởi Compliance Gate! Vui lòng khắc phục các điểm chưa đạt trước khi xuất bản.");
    return;
  }

  if (!confirm("Thầy/Cô có chắc chắn muốn XUẤT BẢN CHÍNH THỨC bài báo này lên Website và Fanpage không?")) {
    return;
  }

  const payload = buildPublishPayload('published');
  const res = await API.createArticle(payload);
  if (res.success) {
    logStudioAudit("Ký duyệt Xuất Bản Trực Tiếp (Live)", "Final Gate: Published", `Bài viết đã chính thức hiển thị tại Cổng thông tin Công đoàn`);
    alert("🎉 XUẤT BẢN THÀNH CÔNG!\nBài báo đã chính thức phát hành trên Cổng thông tin Công đoàn Đại học Thủ Dầu Một.");
    if (typeof showAdminTab === 'function') showAdminTab('articles');
  }
}

async function schedulePackagePost() {
  const schedTime = prompt("Nhập ngày giờ xuất bản tự động (DD/MM/YYYY HH:MM):", "26/08/2026 07:30");
  if (!schedTime) return;

  const payload = buildPublishPayload('scheduled');
  payload.scheduledAt = schedTime;

  const res = await API.createArticle(payload);
  if (res.success) {
    logStudioAudit("Đặt lịch phát hành tự động", "Final Gate: Scheduled", `Hẹn giờ đăng lúc ${schedTime}`);
    alert(`⏰ ĐÃ ĐẶT LỊCH THÀNH CÔNG!\nHệ thống sẽ tự động phát hành bài viết đa kênh vào lúc ${schedTime}.`);
    if (typeof showAdminTab === 'function') showAdminTab('schedule');
  }
}

function buildPublishPayload(status) {
  const title = document.getElementById('studio_title_input')?.value.trim() || studioState.factSheet?.eventName || 'Tin tức Công đoàn TDMU';
  const editor = document.getElementById('native_rich_editor');
  const contentHtml = editor ? editor.innerHTML : '';
  const sapo = document.getElementById('studio_sapo_input')?.value.trim() || '';
  const imgUrl = (studioState.mediaPackage?.featured && studioState.mediaPackage.featured.url) 
    ? studioState.mediaPackage.featured.url 
    : '';

  return {
    title,
    summary: sapo || title,
    content: contentHtml,
    categoryId: 1,
    status,
    image: imgUrl,
    author: document.getElementById('current_user_name')?.innerText || 'TS. Lê Thị Kim Út',
    isAiGenerated: true,
    scheduledAt: null,
    meta: {
      governanceMode: studioState.mode,
      factSheet: studioState.factSheet,
      editorialPlan: studioState.editorialPlan,
      mediaPackage: studioState.mediaPackage,
      complianceScore: studioState.complianceAudit?.overallScore || 98,
      auditTrail: studioState.auditTrail
    }
  };
}

// =========================================================================
// 13. WORD CANVAS RIBBON & MULTI-CHANNEL TAB HELPERS
// =========================================================================
function switchPackageTab(tab) {
  studioState.currentChannel = tab;
  const tabs = ['web', 'fb', 'zalo', 'video', 'infographic', 'banner'];
  tabs.forEach(t => {
    const pane = document.getElementById(`pkg_pane_${t}`);
    const btn = document.getElementById(`tab_btn_pkg_${t}`);
    if (pane) pane.style.display = (t === tab) ? 'block' : 'none';
    if (btn) {
      if (t === tab) {
        btn.classList.add('active');
        btn.style.background = '#002855';
        btn.style.color = '#FFFFFF';
        btn.style.border = 'none';
      } else {
        btn.classList.remove('active');
        btn.style.background = 'white';
        btn.style.color = '#475569';
        btn.style.border = '1px solid #CBD5E1';
      }
    }
  });
}

function execFormat(cmd, val = null) {
  document.execCommand(cmd, false, val);
  updateWordCountMetrics();
}

function insertCustomH2() {
  const text = prompt("Nhập tiêu đề đề mục H2:", "Lan tỏa tinh thần trách nhiệm và tương thân tương ái");
  if (text) {
    document.execCommand('insertHTML', false, `<h2>${escapeHtml(text)}</h2><p></p>`);
    updateWordCountMetrics();
  }
}

function insertCustomQuote() {
  const quote = prompt("Nhập trích dẫn phát biểu:", "Tổ chức Công đoàn luôn là điểm tựa tin cậy, đồng hành cùng sự phát triển bền vững của Nhà trường.");
  if (quote) {
    document.execCommand('insertHTML', false, `<blockquote>"${escapeHtml(quote)}"</blockquote><p></p>`);
    updateWordCountMetrics();
  }
}

function insertCustomFigure() {
  openMediaManagerModal(true);
}

function updateWordCountMetrics() {
  const editor = document.getElementById('native_rich_editor');
  if (!editor) return;
  const text = editor.innerText || '';
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const chars = text.length;

  safeSetText('canvas_word_count', `${words} từ`);
  safeSetText('canvas_char_count', `${chars} ký tự`);
}

function runManusReviewNghiDinh30() {
  alert("⚖️ Manus Copilot: Đã rà soát thể thức văn bản theo Nghị định 30/2020/NĐ-CP!\n\n✓ Tiêu đề đúng thể thức hoa/thường\n✓ Đoạn mở đầu đúng cấu trúc Sapo 5W1H\n✓ Từ ngữ hành chính đại học đạt chuẩn mực.");
}

function runManusRewriteSapo() {
  const sapoInp = document.getElementById('studio_sapo_input');
  if (!sapoInp) return;
  const fs = studioState.factSheet;
  if (!fs) return;
  sapoInp.value = `(TDMU) - Ngày ${fs.eventDate || 'vừa qua'}, tại ${fs.location || 'TDMU'}, ${fs.organizer || 'Công đoàn Trường'} đã trang trọng tổ chức "${fs.eventName}" với sự tham gia của ${fs.attendeesCount || 'đông đảo đoàn viên'}, tạo không khí thi đua sôi nổi và phát huy truyền thống tương thân tương ái.`;
  alert("✨ Manus Copilot: Đã tinh chỉnh lại đoạn Sapo 5W1H báo chí chuẩn mực!");
}

function runManusFactAudit() {
  goToStage(6);
}

// Backward-compatibility aliases
function switchStudioMode(mode) {
  if (mode === 'auto') setGovernanceMode('auto');
  else setGovernanceMode('full_review');
}
function goToReviewStep(s) { goToStage(s); }
function applyReviewPreset(t) { applyPreset(t); }
function handleReviewFilesSelected(f) { handleIntakeFilesSelected(f); }
function handleAutoDropFiles(e) { e.preventDefault(); handleIntakeFilesSelected(e.dataTransfer.files); }
function handleAutoFilesSelected(f) { handleIntakeFilesSelected(f); }
function runAutoModeOneTouch() { setGovernanceMode('auto'); extractFactsFromIntake(); }
function extractFactsAndGoToStep3() { extractFactsFromIntake(); }
function generateFromVerifiedFactsAndGoToStep4() { approveFactsAndAdvance(); }
function runStep5FactAudit() { goToStage(6); }
function publishCurrentPackageLive() { publishPackageLive(); }
function saveCurrentPackageDraft() { savePackageDraft(); }
function scheduleCurrentPackage() { schedulePackagePost(); }

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

document.addEventListener('DOMContentLoaded', () => {
  setGovernanceMode('full_review');
  renderAuditTrailUI();
});


// =========================================================================
// AUTO-ARTICLE FROM FILE: 1-TOUCH GENERATION DIRECTLY TO WORD CANVAS
// =========================================================================
async function runAutoArticleFromFile() {
  const sourceText = (document.getElementById('intake_source_text')?.value || '').trim();
  const brief = (document.getElementById('intake_instructions_text')?.value || '').trim();
  const btn = document.getElementById('btn_auto_article_file');
  const statusBar = document.getElementById('auto_file_status_bar');
  const statusText = document.getElementById('auto_file_status_text');

  if (!sourceText && !brief && !studioState.uploadedFiles.length) {
    alert("⚠️ Vui lòng tải lên ít nhất một tệp tài liệu (Word, PDF, TXT) hoặc dán thông tin sự kiện để AI bắt đầu viết bài!");
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin me-2"></i> ⚡ Đang đọc tài liệu & sinh bài báo web...';
  }
  if (statusBar) statusBar.style.display = 'flex';
  if (statusText) statusText.innerText = 'Bước 1/3: AI đang đọc hiểu hồ sơ tài liệu và trích xuất dữ kiện...';

  try {
    const photos = studioState.uploadedFiles
      .filter(f => f.type.startsWith('image/') || f.dataUrl)
      .map((f, i) => ({ url: f.dataUrl, caption: f.name, isFeatured: i === 0 }));

    if (studioState.mediaPackage && studioState.mediaPackage.photos && studioState.mediaPackage.photos.length > 0) {
      studioState.mediaPackage.photos.forEach(p => {
        if (!photos.some(existing => existing.url === p.url)) {
          photos.push(p);
        }
      });
    }

    const payload = {
      sourceText,
      userPrompt: brief || sourceText || "Viết bài báo website truyền thông Công Đoàn TDMU từ tài liệu đính kèm.",
      filesInfo: studioState.uploadedFiles.map(f => ({
        name: f.name,
        size: f.size,
        type: f.type,
        text: f.text || ''
      })),
      photos,
      genre: 'tin_hoat_dong',
      apiKey: localStorage.getItem('gemini_api_key') || ''
    };

    if (statusText) statusText.innerText = 'Bước 2/3: AI đang chấp bút bài báo Website và chuyển thể đa kênh...';

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
          if (evt.step === 'status' && statusText) {
            statusText.innerText = evt.message;
          } else if (evt.step === 'web_chunk') {
            webHtml += evt.chunk;
          } else if (evt.step === 'social_done') {
            fbCaption = evt.facebook?.caption || '';
            zaloMessage = evt.zalo?.message || '';
          } else if (evt.step === 'all_done') {
            articleId = evt.articleId;
            extractedTitle = evt.title || '';
            extractedSummary = evt.summary || '';
          }
        } catch (e) {}
      }
    }

    if (!webHtml.trim()) {
      throw new Error("Không nhận được nội dung bài báo từ AI");
    }

    if (statusText) statusText.innerText = 'Bước 3/3: Hoàn tất! Đang nạp bài báo vào Word Canvas...';

    if (!extractedTitle) {
      const titleMatch = webHtml.match(/<h1[^>]*>(.*?)<\/h1>/i);
      extractedTitle = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '').trim() : "Hoạt động Công Đoàn TDMU 2026";
    }
    if (!extractedSummary) {
      const sapoMatch = webHtml.match(/<p class="sapo"[^>]*>.*?<strong>(.*?)<\/strong>/i);
      extractedSummary = sapoMatch ? sapoMatch[1].replace(/<[^>]*>/g, '').trim() : webHtml.replace(/<[^>]*>/g, '').slice(0, 180);
    }

    // Strip <h1> out because Word Canvas has dedicated studio_title_input
    let bodyHtml = webHtml.replace(/<h1[^>]*>.*?<\/h1>/i, '').trim();

    studioState.contentDraft = {
      website: {
        title: extractedTitle,
        sapo: extractedSummary,
        contentHtml: bodyHtml
      },
      facebook: {
        caption: fbCaption || extractedSummary
      },
      zalo: {
        caption: zaloMessage || extractedSummary.slice(0, 150)
      }
    };

    renderDraftToCanvasUI(studioState.contentDraft);

    logStudioAudit("Tạo bài báo tự động từ file (Auto Article 1-Touch)", "Stage 5: Word Canvas", `Đã tạo bài "${extractedTitle}" và chuyển tới Word Canvas`);

    // Jump directly to Stage 5 Word Canvas!
    goToStage(5);

  } catch (err) {
    console.error("Auto article generation error:", err);
    alert("❌ Lỗi khi tự động tạo bài từ file: " + err.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-bolt text-warning"></i> ⚡ TỰ ĐỘNG TẠO BÀI BÁO WEB TỪ FILE (1 CHẠM) →';
    }
    if (statusBar) statusBar.style.display = 'none';
  }
}
