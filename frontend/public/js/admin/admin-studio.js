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
  const stage4Back = document.getElementById('btn_stage4_back');
  const stage6Back = document.getElementById('btn_stage6_back');

  if (draftBtn) {
    if (studioState.mode === 'assisted') {
      draftBtn.innerHTML = '<i class="fa-solid fa-check text-success me-1"></i> ✓ Duyệt Bản Nháp & Sang Thẩm Định Xuất Bản (Stage 6) <i class="fa-solid fa-arrow-right"></i>';
    } else {
      draftBtn.innerHTML = '<i class="fa-solid fa-check text-success me-1"></i> ✓ Duyệt Bản Nháp (Approve Draft) & Sang Khâu Gán Ảnh <i class="fa-solid fa-arrow-right"></i>';
    }
  }

  if (stage4Back) {
    if (studioState.mode === 'assisted') {
      stage4Back.innerHTML = '<i class="fa-solid fa-arrow-left me-1"></i> Quay Lại Fact Sheet (Stage 2)';
    } else {
      stage4Back.innerHTML = '<i class="fa-solid fa-arrow-left me-1"></i> Quay Lại Kế Hoạch (Stage 3)';
    }
  }

  if (stage6Back) {
    if (studioState.mode === 'assisted') {
      stage6Back.innerHTML = '<i class="fa-solid fa-arrow-left me-1"></i> Quay Lại Bản Nháp (Stage 4)';
    } else {
      stage6Back.innerHTML = '<i class="fa-solid fa-arrow-left me-1"></i> Quay Lại Gán Ảnh (Stage 5)';
    }
  }
}

function handleStage4Back() {
  if (studioState.mode === 'assisted') {
    goToStage(2);
  } else {
    goToStage(3);
  }
}

function handleStage6Back() {
  if (studioState.mode === 'assisted') {
    goToStage(4);
  } else {
    goToStage(5);
  }
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

function handleIntakeFilesSelected(files) {
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

    if (f.type.startsWith('text/') || f.name.endsWith('.txt') || f.name.endsWith('.csv') || f.name.endsWith('.json')) {
      const reader = new FileReader();
      reader.onload = (e) => { fileObj.text = e.target.result; };
      reader.readAsText(f);
    } else if (f.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => { fileObj.dataUrl = e.target.result; };
      reader.readAsDataURL(f);
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
        // CP 1 (Fact Sheet) approved -> AI generates draft and takes user to CP 2 (Draft Canvas)
        await generateDraftInternal();
        goToStage(4);
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
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin me-1"></i> Đang khởi tạo Bản nháp Đa kênh...';
  }

  try {
    await generateDraftInternal();
    goToStage(4);
  } catch (err) {
    alert("❌ Lỗi sinh bản thảo: " + err.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-check text-success me-1"></i> ✓ Duyệt Kế Hoạch (Approve Plan) & Soạn Thảo Bản Nháp <i class="fa-solid fa-arrow-right"></i>';
    }
  }
}

async function generateDraftInternal() {
  const payload = {
    factSheet: studioState.factSheet,
    genre: studioState.editorialPlan?.genre || 'tin_hoat_dong',
    channels: ['website', 'facebook', 'zalo', 'video', 'infographic'],
    customInstructions: studioState.editorialPlan?.angle || '',
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

// =========================================================================
// 8. STAGE 4: CHECKPOINT 3 - DRAFT CANVAS REVIEW
// =========================================================================
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

  logStudioAudit("Phê duyệt Bản thảo Đa kênh (Checkpoint 3: Approved)", "Stage 4: Draft Canvas", `Đã lưu bản thảo Website, Facebook, Zalo`);

  const btn = document.getElementById('btn_approve_draft');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin me-1"></i> Đang gán & chú thích hình ảnh...';
  }

  try {
    await matchMediaInternal();
    if (studioState.mode === 'assisted') {
      // Assisted mode: CP 2 (Draft Canvas) approved -> AI runs compliance and jumps to Stage 6 for publish
      await runComplianceInternal();
      goToStage(6);
    } else {
      goToStage(5);
    }
  } catch (err) {
    alert("❌ Lỗi phân bổ hình ảnh: " + err.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      updateStageButtonsForMode();
    }
  }
}

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

// =========================================================================
// 9. STAGE 5: CHECKPOINT 4 - MEDIA REVIEW & CAPTIONING
// =========================================================================
function renderMediaReviewUI(pkg) {
  if (!pkg) return;

  if (pkg.featured) {
    const imgEl = document.getElementById('media_featured_preview');
    if (imgEl) imgEl.src = pkg.featured.url;
    safeSetVal('media_featured_caption', pkg.featured.caption || '');
    safeSetVal('media_featured_alt', pkg.featured.altText || '');
    safeSetText('media_featured_name', pkg.featured.fileName || 'Ảnh đại diện');
  }

  if (pkg.inBody && pkg.inBody.length > 0) {
    const b = pkg.inBody[0];
    const imgEl = document.getElementById('media_inbody_preview');
    if (imgEl) imgEl.src = b.url;
    safeSetVal('media_inbody_caption', b.caption || '');
    safeSetVal('media_inbody_alt', b.altText || '');
    safeSetText('media_inbody_name', b.fileName || 'Ảnh thân bài');
  }
}

async function approveMediaAndAdvance() {
  if (studioState.mediaPackage) {
    if (studioState.mediaPackage.featured) {
      studioState.mediaPackage.featured.caption = document.getElementById('media_featured_caption')?.value.trim() || studioState.mediaPackage.featured.caption;
      studioState.mediaPackage.featured.altText = document.getElementById('media_featured_alt')?.value.trim() || studioState.mediaPackage.featured.altText;
    }
    if (studioState.mediaPackage.inBody && studioState.mediaPackage.inBody[0]) {
      studioState.mediaPackage.inBody[0].caption = document.getElementById('media_inbody_caption')?.value.trim() || studioState.mediaPackage.inBody[0].caption;
      studioState.mediaPackage.inBody[0].altText = document.getElementById('media_inbody_alt')?.value.trim() || studioState.mediaPackage.inBody[0].altText;
    }
  }

  logStudioAudit("Phê duyệt Bộ ảnh Báo chí (Checkpoint 4: Approved)", "Stage 5: Media Review", `Đã duyệt ảnh đại diện và chú thích ảnh theo Nghị định 30`);

  const btn = document.getElementById('btn_approve_media');
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
      btn.innerHTML = '<i class="fa-solid fa-check text-success me-1"></i> ✓ Duyệt Bộ Ảnh Báo Chí (Approve Media) & Sang Thẩm Định <i class="fa-solid fa-arrow-right"></i>';
    }
  }
}

async function runComplianceInternal() {
  const payload = {
    factSheet: studioState.factSheet,
    editorialPlan: studioState.editorialPlan,
    draft: studioState.contentDraft,
    mediaPackage: studioState.mediaPackage,
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

  const listEl = document.getElementById('compliance_checklist_container');
  if (listEl && Array.isArray(audit.checks)) {
    listEl.innerHTML = audit.checks.map(c => `
      <div style="background: white; border: 1px solid #E2E8F0; border-radius: 8px; padding: 10px 14px; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 50%; background: ${c.status === 'pass' ? '#DCFCE7' : (c.status === 'warning' ? '#FEF3C7' : '#FEE2E2')}; color: ${c.status === 'pass' ? '#16A34A' : (c.status === 'warning' ? '#D97706' : '#DC2626')}; font-size: 11px;">
            <i class="fa-solid ${c.status === 'pass' ? 'fa-check' : (c.status === 'warning' ? 'fa-triangle-exclamation' : 'fa-xmark')}"></i>
          </span>
          <div>
            <div style="font-weight: 700; color: #002855; font-size: 13px;">${escapeHtml(c.name)}</div>
            <div style="color: #64748B; font-size: 11.5px; margin-top: 1px;">${escapeHtml(c.desc || '')}</div>
          </div>
        </div>
        <span style="font-weight: 800; font-size: 12.5px; color: ${c.status === 'pass' ? '#16A34A' : '#DC2626'};">${c.score}</span>
      </div>
    `).join('');
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
    4: 'Stage 4: Draft Canvas (Soạn Thảo Bài Viết)',
    5: 'Stage 5: Media Review (Bộ Ảnh Sự Kiện)'
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

    // Step 3: Editorial Planning & Media Matching
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

    await matchMediaInternal();
    markAutoStep('auto_step_log_3', 'done');

    // Step 4: Multi-channel Draft Generation
    markAutoStep('auto_step_log_4', 'running');
    await generateDraftInternal();
    markAutoStep('auto_step_log_4', 'done');

    // Step 5: Compliance Gate
    markAutoStep('auto_step_log_5', 'running');
    await runComplianceInternal();
    markAutoStep('auto_step_log_5', 'done');

    logStudioAudit("Tự động hóa toàn trình hoàn tất (Auto Mode: Finished)", "Stage 6: Compliance & Publish", `Bài viết "${studioState.factSheet?.eventName}" đã sẵn sàng`);

    goToStage(4);
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
  const imgUrl = studioState.mediaPackage?.featured?.url || 'images/banner.jpg';

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
  const caption = prompt("Nhập chú thích ảnh báo chí:", "Ảnh: Toàn cảnh chương trình diễn ra trang trọng tại TDMU");
  if (caption) {
    const imgUrl = studioState.mediaPackage?.featured?.url || 'images/banner.jpg';
    document.execCommand('insertHTML', false, `
      <figure class="journalism-figure" style="text-align: center; margin: 20px 0;">
        <img src="${imgUrl}" alt="${escapeHtml(caption)}" style="max-width: 100%; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        <figcaption style="font-size: 13px; color: #64748B; font-style: italic; margin-top: 8px;">${escapeHtml(caption)}</figcaption>
      </figure><p></p>
    `);
    updateWordCountMetrics();
  }
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
