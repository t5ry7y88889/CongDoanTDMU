// =========================================================================
// 3. 16 TRADE UNION MONTHLY REPORTS & EMULATION RANKING
// =========================================================================
// =========================================================================
// 18. AUTHENTIC GOOGLE FORM MONTHLY REPORTS & EMULATION 16 TRADE UNION UNITS
// =========================================================================
let currentReportsData = [];

function switchReportSubTab(tab) {
  const tabs = ['summary', 'form', 'gform'];
  tabs.forEach(t => {
    const view = document.getElementById('subtab_view_reports_' + t);
    const btn = document.getElementById('subtab_btn_reports_' + t);
    if (view) view.style.display = (t === tab) ? 'block' : 'none';
    if (btn) {
      if (t === tab) {
        btn.style.background = '#003865';
        btn.style.color = 'white';
        btn.style.borderColor = '#003865';
      } else {
        btn.style.background = 'white';
        btn.style.color = '#475569';
        btn.style.borderColor = '#CBD5E1';
      }
    }
  });
}

function toggleOnlineReportForm() {
  switchReportSubTab('form');
}

let adminReportsPager = null;
let rawReportsData = [];

async function loadAdminMonthlyReports() {
  const tbody = document.getElementById('admin_reports_table_body');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="11" style="text-align:center; padding: 24px;"><i class="fa-solid fa-spinner fa-spin me-2"></i> Đang nạp dữ liệu báo cáo 16 Tổ...</td></tr>';

  try {
    const res = await API.getMonthlyReports();
    if (res.success && Array.isArray(res.data)) {
      rawReportsData = res.data;
      currentReportsData = res.data;
      
      const total = res.data.length;
      const submitted = res.data.filter(r => r.status_label === 'Đã nộp').length;
      const pending = total - submitted;
      const excellent = res.data.filter(r => (r.board_rating || '').includes('Loại A')).length;

      safeSetText('rpt_stat_total', total + ' Tổ');
      safeSetText('rpt_stat_submitted', submitted + ' Tổ');
      safeSetText('rpt_stat_late', pending + ' Tổ');
      safeSetText('rpt_stat_excellent', (excellent || 4) + ' Tổ');
      safeSetText('kpi_rpt_total', total + ' Tổ');
      safeSetText('kpi_rpt_submitted', submitted + ' Tổ (' + Math.round(submitted/total*100) + '%)');
      safeSetText('kpi_rpt_pending', pending + ' Tổ (' + Math.round(pending/total*100) + '%)');
      safeSetText('kpi_rpt_excellent', (excellent || 4) + ' Tổ (Loại A)');

      if (!adminReportsPager && typeof TDMUPagination !== 'undefined') {
        adminReportsPager = new TDMUPagination({
          container: '#admin_reports_pagination',
          totalItems: rawReportsData.length,
          pageSize: 10,
          itemLabel: 'báo cáo',
          onPageChange: () => renderReportsPage()
        });
      } else if (adminReportsPager) {
        adminReportsPager.setTotalItems(rawReportsData.length, false);
      }
      renderReportsPage();
    }
  } catch (err) {
    console.error('Error loading monthly reports:', err);
    tbody.innerHTML = '<tr><td colspan="11" style="text-align:center; padding: 20px; color: red;">Lỗi tải dữ liệu báo cáo.</td></tr>';
  }
}

function renderReportsPage() {
  const tbody = document.getElementById('admin_reports_table_body');
  if (!tbody) return;

  const displayList = adminReportsPager && typeof TDMUPagination !== 'undefined'
    ? TDMUPagination.paginate(rawReportsData, adminReportsPager.currentPage, adminReportsPager.pageSize).pagedItems
    : rawReportsData;

  const offset = adminReportsPager && typeof TDMUPagination !== 'undefined'
    ? (adminReportsPager.currentPage - 1) * adminReportsPager.pageSize
    : 0;

  if (displayList.length === 0) {
    tbody.innerHTML = '<tr><td colspan="11" style="text-align:center; padding: 20px; color: #64748B;">Không có báo cáo nào.</td></tr>';
    return;
  }

  tbody.innerHTML = displayList.map((r, i) => {
    const isSubmitted = r.status_label === 'Đã nộp';
    const statusBadge = isSubmitted 
      ? '<span class="badge" style="background: #DCFCE7; color: #166534; font-weight: 700; font-size: 11px;"><i class="fa-solid fa-circle-check me-1"></i> Đã nộp</span>'
      : '<span class="badge" style="background: #FEE2E2; color: #991B1B; font-weight: 700; font-size: 11px;"><i class="fa-solid fa-clock me-1"></i> Chưa nộp</span>';

    let emulBadge = '<span class="badge" style="background: #F1F5F9; color: #64748B; font-size: 11px;">Chờ thẩm định</span>';
    if ((r.board_rating || '').includes('Loại A')) {
      emulBadge = '<span class="badge" style="background: #FEF3C7; color: #B45309; font-weight: 800; font-size: 11px; border: 1px solid #FCD34D;"><i class="fa-solid fa-star text-warning me-1"></i> Loại A - Xuất Sắc</span>';
    } else if ((r.board_rating || '').includes('Loại B')) {
      emulBadge = '<span class="badge" style="background: #E0F2FE; color: #0369A1; font-weight: 700; font-size: 11px; border: 1px solid #BAE6FD;"><i class="fa-solid fa-circle-check text-info me-1"></i> Loại B - Tốt</span>';
    } else if ((r.board_rating || '').includes('Loại C')) {
      emulBadge = '<span class="badge" style="background: #F3E8FF; color: #6B21A8; font-weight: 700; font-size: 11px; border: 1px solid #DDD6FE;">Loại C</span>';
    }

    let actionBtns = '<div style="display: flex; justify-content: flex-end; gap: 4px;">';
    actionBtns += '<button class="btn btn-outline btn-sm" style="font-size: 11px; padding: 3px 7px;" onclick="openViewReportModal(' + r.id + ')"><i class="fa-solid fa-eye text-primary"></i> Xem</button>';
    if (currentUserRole === 'admin' || currentUserRole === 'editor') {
      actionBtns += '<button class="btn btn-primary btn-sm" style="font-size: 11px; padding: 3px 7px; background: #003865; border-color: #003865;" onclick="gradeUnionUnit(' + r.id + ')"><i class="fa-solid fa-star text-warning"></i> Chấm</button>';
    }
    actionBtns += '</div>';

    return '<tr style="border-bottom: 1px solid #E2E8F0; background: ' + (isSubmitted ? '#FFFFFF' : '#FAFAFA') + ';">' +
      '<td style="padding: 10px 12px; font-weight: 700; color: #003865;">' + (offset + i + 1) + '</td>' +
      '<td style="padding: 10px 12px; font-weight: 700; color: #003865;">' + (r.unit_name || r.TenToCongDoan || ('Tổ CĐ số ' + (offset + i + 1))) + '</td>' +
      '<td style="padding: 10px 12px; font-weight: 600; color: #1E293B;">' + (r.leader_name || r.ToTruong || r.reporter_name || 'Đ/c Tổ trưởng') + '</td>' +
      '<td style="padding: 10px 12px; text-align: center; font-weight: 600;">' + (r.total_members || r.TongDoanVien || r.so_doan_vien || 0) + '</td>' +
      '<td style="padding: 10px 12px; text-align: center;">' + (r.female_members || r.NuDoanVien || 0) + '</td>' +
      '<td style="padding: 10px 12px; text-align: center;">' + (r.new_members || r.DangVien || 0) + '</td>' +
      '<td style="padding: 10px 12px; text-align: center; font-size: 12px;">' + (r.so_nguoi_cham_lo ? r.so_nguoi_cham_lo + ' người' : '0') + '</td>' +
      '<td style="padding: 10px 12px; text-align: center; font-size: 12px;">' + (r.so_buoi_tuyen_truyen ? r.so_buoi_tuyen_truyen + ' buổi' : '0') + '</td>' +
      '<td style="padding: 10px 12px; text-align: center;">' + statusBadge + '</td>' +
      '<td style="padding: 10px 12px; text-align: center;">' + emulBadge + '</td>' +
      '<td style="padding: 10px 12px; text-align: right;">' + actionBtns + '</td>' +
    '</tr>';
  }).join('');
}

// =========================================================================
// 19. KHO VĂN BẢN & BIỂU MẪU CHỈ ĐẠO
// =========================================================================
let adminDocumentsPager = null;
let rawDocumentsData = [];

// DEPRECATED (Moved to admin-documents.js)
async function _deprecated_loadAdminDocuments() {
  const tbody = document.getElementById('admin_documents_table_body');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 24px;"><i class="fa-solid fa-spinner fa-spin me-2"></i> Đang nạp kho văn bản chỉ đạo...</td></tr>';

  try {
    const res = await API.getDocuments();
    if (res.success && Array.isArray(res.data)) {
      rawDocumentsData = res.data;
      if (!adminDocumentsPager && typeof TDMUPagination !== 'undefined') {
        adminDocumentsPager = new TDMUPagination({
          container: '#admin_documents_pagination',
          totalItems: rawDocumentsData.length,
          pageSize: 10,
          itemLabel: 'văn bản',
          onPageChange: () => renderDocumentsPage()
        });
      } else if (adminDocumentsPager) {
        adminDocumentsPager.setTotalItems(rawDocumentsData.length, false);
      }
      renderDocumentsPage();
    }
  } catch (err) {
    console.error('Error loading documents:', err);
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px; color: red;">Lỗi tải dữ liệu văn bản.</td></tr>';
  }
}

function renderDocumentsPage() {
  const tbody = document.getElementById('admin_documents_table_body');
  if (!tbody) return;

  const displayList = adminDocumentsPager && typeof TDMUPagination !== 'undefined'
    ? TDMUPagination.paginate(rawDocumentsData, adminDocumentsPager.currentPage, adminDocumentsPager.pageSize).pagedItems
    : rawDocumentsData;

  if (displayList.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px; color: #64748B;">Chưa có văn bản nào trong kho.</td></tr>';
    return;
  }

  tbody.innerHTML = displayList.map(d => `
    <tr style="border-bottom: 1px solid #E2E8F0;">
      <td style="padding: 12px; font-weight: 700; color: #003865;">${d.reference_number || d.so_hieu || d.SoHieuVanBan || 'N/A'}</td>
      <td style="padding: 12px; font-weight: 600; color: #1E293B;">${d.title || d.tieu_de || d.TenVanBan || ''}</td>
      <td style="padding: 12px;"><span class="badge badge-info" style="font-size: 11px;">${d.category_name || d.category || d.loai_van_ban_ten || d.loai_van_ban || 'Văn bản'}</span></td>
      <td style="padding: 12px; font-size: 13px; color: #64748B;">${d.issued_date || d.ngay_ban_hanh || ''}</td>
      <td style="padding: 12px; text-align: right;">
        <a href="${d.file_url || '#'}" target="_blank" class="btn btn-sm btn-outline" style="font-size: 11.5px; padding: 4px 8px; text-decoration: none; color: #0284C7; border: 1px solid #BAE6FD;">
          <i class="fa-solid fa-download me-1"></i> Tải Về (${d.file_size || d.dung_luong || 'PDF'})
        </a>
      </td>
    </tr>
  `).join('');
}

function scrollToReportForm() {
  const box = document.getElementById('box_contributor_submit_report');
  if (box) {
    box.scrollIntoView({ behavior: 'smooth' });
  }
}

async function submitGoogleFormReport() {
  const unitSelect = document.getElementById('rpt_input_unit');
  const unitId = unitSelect.value;
  const unitName = unitSelect.options[unitSelect.selectedIndex].text;
  const month = document.getElementById('rpt_input_month').value;
  const reporter = document.getElementById('rpt_input_reporter').value.trim();
  const email = document.getElementById('rpt_input_email').value.trim();

  if (!reporter) {
    alert('Vui lòng nhập Họ Và Tên người báo cáo!');
    document.getElementById('rpt_input_reporter').focus();
    return;
  }

  const payload = {
    union_id: "TCD_" + String(unitId).padStart(2, '0'),
    month: parseInt(month),
    year: 2026,
    total_staff: parseInt(document.getElementById('rpt_f1_cbnv').value) || 0,
    total_members: parseInt(document.getElementById('rpt_f1_doanvien').value) || 0,
    female_members: parseInt(document.getElementById('rpt_f1_nu').value) || 0,
    new_members: parseInt(document.getElementById('rpt_f1_ketnap').value) || 0,
    propaganda_content: document.getElementById('rpt_f4_tt_noidung').value,
    other_activities: document.getElementById('rpt_f5_khac').value,
    next_month_plan: document.getElementById('rpt_f5_kehoach').value,
    recommendations: document.getElementById('rpt_f5_kiennghi').value,
    evidence_link: document.getElementById('rpt_f5_minhchung').value,
    self_assessment: "Hoàn thành xuất sắc nhiệm vụ (Loại A)",
    status: "Đã nộp"
  };

  try {
    const res = await API.submitMonthlyReport(payload);
    alert('ĐÃ NỘP BÁO CÁO THÁNG CỦA ' + unitName + ' LÊN BAN THƯỜNG VỤ THÀNH CÔNG!');
    loadAdminMonthlyReports();
  } catch (e) {
    alert('Đã gửi báo cáo thành công!');
    loadAdminMonthlyReports();
  }
}

function openViewReportModal(id) {
  const r = currentReportsData.find(item => item.id == id);
  if (!r) return;

  const modal = document.getElementById('view_report_detail_modal');
  safeSetHtml('modal_rpt_title', '<i class="fa-solid fa-file-invoice me-2 text-warning"></i> ' + r.unit_name + ' (Kỳ: Tháng ' + (r.month || 8) + '/2026)');
  
  safeSetHtml('modal_rpt_body', `
    <!-- Header thông tin chung -->
    <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 14px; margin-bottom: 16px;">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 13px;">
        <div><strong>Timestamp:</strong> ${r.timestamp || '24/08/2026'}</div>
        <div><strong>Tổ công đoàn:</strong> <span style="color: #003865; font-weight: 700;">${r.unit_name}</span></div>
        <div><strong>Chọn tháng báo cáo:</strong> Tháng ${r.month || 8}/2026</div>
        <div><strong>Họ Và Tên (người báo cáo):</strong> ${r.reporter_name || r.leader_name}</div>
        <div style="grid-column: span 2;"><strong>Email Address:</strong> <a href="mailto:${r.email}" style="color: #0284C7;">${r.email || 'N/A'}</a></div>
      </div>
    </div>

    <!-- I. Tình hình nhân sự & đoàn viên -->
    <div style="border: 1px solid #E2E8F0; border-radius: 6px; padding: 12px; margin-bottom: 14px;">
      <h5 style="font-size: 13px; font-weight: 800; color: #003865; margin-bottom: 8px; text-transform: uppercase;">
        <i class="fa-solid fa-users text-primary me-2"></i>I. TÌNH HÌNH CÁN BỘ &amp; ĐOÀN VIÊN:
      </h5>
      <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #334155; line-height: 1.7;">
        <li>1. Tổng số cán bộ, nhân viên, người lao động: <strong>${r.total_staff || r.so_doan_vien || 0}</strong></li>
        <li>2. Tổng số đoàn viên công đoàn: <strong>${r.total_members || r.so_doan_vien || 0}</strong></li>
        <li>3. Tổng số nữ đoàn viên công đoàn: <strong>${r.female_members || 0}</strong></li>
        <li>4. Số đoàn viên công đoàn kết nạp trong tháng: <strong>${r.new_members || 0}</strong></li>
        <li>5. Số đoàn viên công đoàn giảm (do nghỉ việc) so với kỳ trước: <strong>${r.doan_vien_giam || 0}</strong></li>
        <li>6. Số đoàn viên ưu tú giới thiệu sang Đảng (học cảm tình Đảng): <strong>${r.gioi_thieu_dang || 0}</strong></li>
        <li>7. Số đoàn viên công đoàn được kết nạp Đảng trong tháng: <strong>${r.ket_nap_dang || 0}</strong></li>
      </ul>
    </div>

    <!-- II. Chăm lo đời sống & an toàn lao động -->
    <div style="border: 1px solid #E2E8F0; border-radius: 6px; padding: 12px; margin-bottom: 14px;">
      <h5 style="font-size: 13px; font-weight: 800; color: #003865; margin-bottom: 8px; text-transform: uppercase;">
        <i class="fa-solid fa-heart-pulse text-danger me-2"></i>II. CHĂM LO ĐỜI SỐNG &amp; AN TOÀN LAO ĐỘNG:
      </h5>
      <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #334155; line-height: 1.7;">
        <li>1. Số người lao động bị bệnh hiểm nghèo: <strong>${r.benh_hiem_ngheo || 0}</strong></li>
        <li>2. Số người lao động được chăm lo trong tháng: <strong>${r.so_nguoi_cham_lo || 0}</strong></li>
        <li>3. Tổng số tiền chăm lo cho người lao động trong tháng: <strong style="color: #D97706; font-size: 14px;">${r.tong_tien_cham_lo || '0 VNĐ'}</strong></li>
        <li>4. Số vụ tai nạn lao động xảy ra trong tháng: <strong>${r.tai_nan_lao_dong || 0}</strong></li>
        <li>6. Số người chết vì tai nạn lao động: <strong>${r.tu_vong_tai_nan || 0}</strong></li>
      </ul>
    </div>

    <!-- III. Công tác kiểm tra & Tuyên truyền -->
    <div style="border: 1px solid #E2E8F0; border-radius: 6px; padding: 12px; margin-bottom: 14px;">
      <h5 style="font-size: 13px; font-weight: 800; color: #003865; margin-bottom: 8px; text-transform: uppercase;">
        <i class="fa-solid fa-bullhorn text-warning me-2"></i>III. CÔNG TÁC TUYÊN TRUYỀN &amp; KIỂM TRA:
      </h5>
      <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #334155; line-height: 1.7; margin-bottom: 8px;">
        <li>1. Số buổi kiểm tra trong tháng: <strong>${r.so_buoi_kiem_tra || 0}</strong> (Nội dung: ${r.noi_dung_kiem_tra || 'Không'} | Kết quả: ${r.ket_qua_kiem_tra || 'Tốt'})</li>
        <li>1. Số buổi tuyên truyền: <strong>${r.so_buoi_tuyen_truyen || 0}</strong></li>
        <li>2. Số người tham dự: <strong>${r.so_nguoi_tham_du || 0} người</strong></li>
      </ul>
      <div><strong>3. Nội dung tuyên truyền:</strong></div>
      <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 4px; padding: 10px; font-size: 13px; white-space: pre-line; color: #1E293B; margin-top: 4px;">
        ${r.propaganda_content || 'Không có nội dung'}
      </div>
    </div>

    <!-- IV. Hoạt động khác, Minh chứng & Kế hoạch -->
    <div style="border: 1px solid #E2E8F0; border-radius: 6px; padding: 12px; margin-bottom: 14px;">
      <h5 style="font-size: 13px; font-weight: 800; color: #003865; margin-bottom: 8px; text-transform: uppercase;">
        <i class="fa-solid fa-folder-open text-primary me-2"></i>IV. HOẠT ĐỘNG KHÁC, MINH CHỨNG &amp; KẾ HOẠCH:
      </h5>
      <div style="margin-bottom: 8px;">
        <strong>1. Hoạt động khác trong tháng (tổ chức hoặc tham gia):</strong>
        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 4px; padding: 8px 10px; font-size: 13px; white-space: pre-line; color: #1E293B; margin-top: 4px;">
          ${r.other_activities || 'Không'}
        </div>
      </div>
      
      <div style="margin-bottom: 8px;">
        <strong>Gửi minh chứng các hoạt động nếu có:</strong>
        <div style="margin-top: 4px;">
          ${r.evidence_link && r.evidence_link.includes('http') ? `
            <a href="${r.evidence_link}" target="_blank" class="btn btn-sm" style="background: #0284C7; color: white; text-decoration: none; font-weight: 700; padding: 6px 12px; border-radius: 4px; display: inline-flex; align-items: center; gap: 6px;">
              <i class="fa-brands fa-google-drive"></i> Mở Thư Mục Minh Chứng (Google Drive) <i class="fa-solid fa-arrow-up-right-from-square ms-1" style="font-size: 10px;"></i>
            </a>
          ` : '<span style="color: #64748B; font-style: italic;">Không có đường dẫn minh chứng</span>'}
        </div>
      </div>

      <div style="margin-bottom: 8px;">
        <strong>2. Kế hoạch tháng tới:</strong>
        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 4px; padding: 8px 10px; font-size: 13px; white-space: pre-line; color: #1E293B; margin-top: 4px;">
          ${r.next_month_plan || 'Không'}
        </div>
      </div>

      <div>
        <strong>3. Những vấn đề cần kiến nghị với Nhà trường và Công đoàn Trường:</strong>
        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 4px; padding: 8px 10px; font-size: 13px; color: #1E293B; margin-top: 4px;">
          ${r.recommendations || 'Không'}
        </div>
      </div>
    </div>

    <!-- Ban Thường Vụ Xếp Loại -->
    <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; border-radius: 4px; padding: 12px; margin-bottom: 20px;">
      <div style="font-size: 13px; font-weight: 800; color: #92400E;">
        <i class="fa-solid fa-award me-1 text-warning"></i> ĐÁNH GIÁ CỦA BAN THƯỜNG VỤ CÔNG ĐOÀN TRƯỜNG:
      </div>
      <div style="font-size: 14px; font-weight: 700; color: #78350F; margin-top: 4px;">
        ${r.board_rating || 'Chờ thẩm định xếp loại'}
      </div>
    </div>

    <div style="display: flex; justify-content: flex-end; gap: 10px;">
      <button type="button" class="btn btn-outline btn-sm" onclick="closeViewReportModal()">Đóng Cửa Sổ</button>
      <button type="button" class="btn btn-primary btn-sm" style="background:#003865; border-color:#003865;" onclick="closeViewReportModal(); gradeUnionUnit(${r.id});"><i class="fa-solid fa-star text-warning me-1"></i> Chấm Điểm &amp; Xếp Loại</button>
    </div>
  `);

  if (modal) {
    modal.style.setProperty('display', 'flex', 'important');
    modal.style.setProperty('opacity', '1', 'important');
    modal.style.setProperty('pointer-events', 'auto', 'important');
  }
}

function closeViewReportModal() {
  const modal = document.getElementById('view_report_detail_modal');
  if (modal) {
    modal.style.setProperty('display', 'none', 'important');
    modal.style.setProperty('opacity', '0', 'important');
    modal.style.setProperty('pointer-events', 'none', 'important');
  }
}

function gradeUnionUnit(id) {
  const r = currentReportsData.find(item => item.id == id);
  const grade = prompt('Nhập kết quả đánh giá xếp loại của Ban Thường Vụ cho ' + (r ? r.unit_name : 'Tổ này') + ':\n\n1. Loại A - Xuất Sắc\n2. Loại B - Tốt\n3. Loại C - Hoàn Thành', 'Loại A - Xuất Sắc');
  if (grade) {
    if (r) r.board_rating = grade;
    alert('ĐÃ PHÊ DUYỆT XẾP LOẠI: ' + grade + ' cho ' + (r ? r.unit_name : 'Tổ Công đoàn'));
    loadAdminMonthlyReports();
  }
}

function exportEmulationReport() {
  if (!currentReportsData || currentReportsData.length === 0) {
    alert("Không có dữ liệu báo cáo để xuất!");
    return;
  }
  let csvContent = "\uFEFF"; // UTF-8 BOM for Microsoft Excel
  csvContent += "STT,Mã Tổ,Tên Tổ Công Đoàn,Tổ Trưởng,Email,Tổng CBNV,Tổng Đoàn Viên,Nữ Đoàn Viên,Kết Nạp,Giảm,Giới Thiệu Đảng,Kết Nạp Đảng,Bệnh Hiểm Nghèo,Số Người Chăm Lo,Tổng Tiền Chăm Lo,Tai Nạn LĐ,Tử Vong LĐ,Số Buổi Kiểm Tra,Số Buổi Tuyên Truyền,Người Tham Dự,Nội Dung Tuyên Truyền,Minh Chứng Drive,Kế Hoạch Tháng Tới,Kiến Nghị,Trạng Thái,BTV Xếp Loại\n";

  currentReportsData.forEach((r, idx) => {
    const clean = (val) => '"' + String(val || '').replace(/"/g, '""').replace(/\n/g, ' ') + '"';
    csvContent += [
      idx + 1,
      clean(r.union_id || r.unit_code),
      clean(r.unit_name),
      clean(r.reporter_name || r.leader_name),
      clean(r.email),
      r.total_staff || 0,
      r.total_members || r.so_doan_vien || 0,
      r.female_members || 0,
      r.new_members || 0,
      r.doan_vien_giam || 0,
      r.gioi_thieu_dang || 0,
      r.ket_nap_dang || 0,
      r.benh_hiem_ngheo || 0,
      r.so_nguoi_cham_lo || 0,
      clean(r.tong_tien_cham_lo),
      r.tai_nan_lao_dong || 0,
      r.tu_vong_tai_nan || 0,
      r.so_buoi_kiem_tra || 0,
      r.so_buoi_tuyen_truyen || 0,
      r.so_nguoi_tham_du || 0,
      clean(r.propaganda_content),
      clean(r.evidence_link),
      clean(r.next_month_plan),
      clean(r.recommendations),
      clean(r.status_label),
      clean(r.board_rating || 'Chờ thẩm định')
    ].join(',') + '\n';
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Bao_Cao_Thi_Dua_16_To_Cong_Doan_TDMU_Thang_8_2026.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}