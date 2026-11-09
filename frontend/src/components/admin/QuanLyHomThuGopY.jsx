import React, { useState, useEffect } from 'react';

export default function QuanLyHomThuGopY() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'pending' | 'resolved'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);

  // Form state for reply
  const [replyText, setReplyText] = useState('');
  const [signerTitle, setSignerTitle] = useState('Ban Thường Vụ Công Đoàn Trường Đại học Thủ Dầu Một');
  const [emailSubject, setEmailSubject] = useState('');
  const [sendEmailNotify, setSendEmailNotify] = useState(true);
  const [activeModalTab, setActiveModalTab] = useState('compose'); // 'compose' | 'preview'
  const [saving, setSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  const loadFeedbacks = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/feedback').then(r => r.json());
      if (res.success && Array.isArray(res.data)) {
        setFeedbacks(res.data);
      }
    } catch (e) {
      console.error('Lỗi nạp góp ý:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeedbacks();
  }, []);

  const openReplyModal = (item) => {
    setSelectedItem(item);
    const existingReply = item.response || item.reply || item.TraLoi || '';
    setReplyText(existingReply);
    setSignerTitle('Ban Thường Vụ Công Đoàn Trường Đại học Thủ Dầu Một');
    const title = item.title || item.TieuDe || 'Ý kiến đóng góp công đoàn';
    setEmailSubject(`[Công Đoàn TDMU] Phản hồi ý kiến: "${title}"`);
    setSendEmailNotify(Boolean(item.email || item.Email));
    setActiveModalTab('compose');
    setSaveSuccessMsg('');
  };

  // Quick reply templates
  const applyTemplate = (tplType) => {
    const sender = selectedItem?.sender_name || selectedItem?.fullname || selectedItem?.HoTen || 'Quý Thầy/Cô, Đoàn viên';
    switch (tplType) {
      case 'received':
        setReplyText(`Kính gửi Thầy/Cô ${sender},\n\nBan Thường Vụ Công Đoàn Trường Đại học Thủ Dầu Một đã tiếp nhận ý kiến đóng góp của Thầy/Cô. Nội dung này đã được chuyển đến Ban Chuyên môn liên quan để thẩm định và phối hợp giải quyết theo đúng quy chế.\n\nKết quả chi tiết sẽ được thông tin lại đến Thầy/Cô trong thời gian sớm nhất.\n\nTrân trọng cảm ơn Thầy/Cô đã luôn đồng hành và đóng góp xây dựng tổ chức Công đoàn.`);
        break;
      case 'policy':
        setReplyText(`Kính gửi Thầy/Cô ${sender},\n\nVề nội dung kiến nghị liên quan đến chế độ, chính sách và quyền lợi đoàn viên, Ban Thường Vụ Công Đoàn Trường xin giải đáp cụ thể như sau:\n\n1. Công đoàn Trường luôn thực hiện chi trả và bảo đảm đầy đủ các chế độ phúc lợi theo đúng Thỏa ước lao động tập thể và Quy chế chi tiêu nội bộ hiện hành.\n2. Trường hợp cụ thể của Thầy/Cô, Văn phòng Công đoàn sẽ chủ động liên hệ trực tiếp để hướng dẫn hoàn thiện các thủ tục hồ sơ thụ hưởng theo quy định.\n\nTrân trọng thông tin đến Thầy/Cô!`);
        break;
      case 'facilities':
        setReplyText(`Kính gửi Thầy/Cô ${sender},\n\nBan Thường Vụ Công Đoàn xin ghi nhận kiến nghị rất xác đáng của Thầy/Cô về việc nâng cấp cơ sở vật chất, điều kiện làm việc và giảng dạy. Công đoàn Trường đã có văn bản đề xuất chính thức gửi Ban Giám hiệu và Phòng Quản trị để sớm tiến hành kiểm tra thực tế và có phương án khắc phục, cải thiện trong thời gian tới.\n\nTrân trọng cảm ơn tinh thần trách nhiệm của Thầy/Cô!`);
        break;
      case 'resolved':
        setReplyText(`Kính gửi Thầy/Cô ${sender},\n\nBan Thường Vụ Công Đoàn Trường xin trân trọng thông báo: Nội dung kiến nghị, nguyện vọng của Thầy/Cô đã được các bộ phận chức năng xử lý hoàn tất.\n\nNếu Thầy/Cô cần trao đổi thêm thông tin, xin vui lòng liên hệ trực tiếp Văn phòng Công đoàn (Phòng B102) hoặc hotline để được hỗ trợ kịp thời.\n\nKính chúc Thầy/Cô luôn nhiều sức khỏe và công tác tốt!`);
        break;
      default:
        break;
    }
  };

  const handleSaveReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) {
      alert('Vui lòng nhập nội dung phản hồi!');
      return;
    }
    setSaving(true);
    setSaveSuccessMsg('');
    try {
      const res = await fetch(`/api/feedback/${selectedItem.id || selectedItem.MaGopY}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          response: replyText.trim(),
          reply: replyText.trim(),
          status: 'resolved',
          resolved_by: signerTitle,
          send_email: sendEmailNotify,
          email_subject: emailSubject
        })
      }).then(r => r.json());

      if (res.success) {
        setSaveSuccessMsg(res.message || 'Đã lưu phản hồi vào CSDL và gửi email thành công!');
        setTimeout(() => {
          setSelectedItem(null);
          loadFeedbacks();
        }, 1200);
      } else {
        alert('Lỗi: ' + (res.error || 'Không thể lưu phản hồi'));
      }
    } catch (err) {
      alert('Lỗi kết nối: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Bạn có chắc muốn xóa thư góp ý "${title}" khỏi hệ thống?`)) return;
    try {
      const res = await fetch(`/api/feedback/${id}`, { method: 'DELETE' }).then(r => r.json());
      if (res.success) {
        setFeedbacks(prev => prev.filter(f => (f.id || f.MaGopY) !== id));
      }
    } catch (e) {
      alert('Lỗi: ' + e.message);
    }
  };

  // Filter list
  const filtered = feedbacks.filter(f => {
    const st = (f.status || f.TrangThai || '').toLowerCase();
    const hasReply = Boolean(f.response || f.reply || f.TraLoi);

    if (filterStatus === 'pending' && (st === 'resolved' || hasReply)) return false;
    if (filterStatus === 'resolved' && (st !== 'resolved' && !hasReply)) return false;

    if (selectedCategory !== 'all') {
      const cat = (f.category || f.ChuDe || '').toLowerCase();
      if (!cat.includes(selectedCategory.toLowerCase())) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const name = (f.sender_name || f.fullname || f.HoTen || '').toLowerCase();
      const email = (f.email || f.Email || '').toLowerCase();
      const unit = (f.unit || f.DonVi || '').toLowerCase();
      const title = (f.title || f.TieuDe || '').toLowerCase();
      const content = (f.content || f.NoiDung || '').toLowerCase();
      if (!name.includes(q) && !email.includes(q) && !unit.includes(q) && !title.includes(q) && !content.includes(q)) {
        return false;
      }
    }
    return true;
  });

  const totalCount = feedbacks.length;
  const pendingCount = feedbacks.filter(f => !f.response && !f.reply && !f.TraLoi).length;
  const resolvedCount = totalCount - pendingCount;
  const resolveRate = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 100;

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: '#F8FAFC', padding: '28px 36px', minHeight: '100vh', boxSizing: 'border-box' }}>
      
      {/* ─── 1. TOP HEADER & METRICS BAR ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#FDF2F8', border: '1px solid #FBCFE8', color: '#BE185D', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '6px' }}>
            <i className="fa-solid fa-envelope-circle-check" /> HỆ THỐNG TIẾP NHẬN & PHẢN HỒI ĐOÀN VIÊN
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#002855', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="fa-solid fa-envelope-open-text" style={{ color: '#0284C7' }} />
            Quản Lý Hòm Thư Góp Ý &amp; Nguyện Vọng Cán Bộ, Đoàn Viên
          </h1>
          <p style={{ fontSize: '13.5px', color: '#64748B', margin: 0 }}>
            Tiếp nhận tâm tư, phản hồi chính thức bằng phiếu xử lý chuyên nghiệp và gửi email xác nhận trực tiếp về hòm thư người gửi.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={loadFeedbacks}
            style={{ background: '#FFF', color: '#002855', border: '1px solid #CBD5E1', padding: '10px 18px', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
          >
            <i className="fa-solid fa-rotate" /> Làm Mới
          </button>
        </div>
      </div>

      {/* 4 THẺ THỐNG KÊ KPI THỰC TẾ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#FFF', borderRadius: '12px', padding: '18px 20px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            <i className="fa-solid fa-inbox" />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '700' }}>TỔNG THƯ TIẾP NHẬN</div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#002855' }}>{totalCount}</div>
          </div>
        </div>

        <div style={{ background: '#FFF', borderRadius: '12px', padding: '18px 20px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            <i className="fa-solid fa-clock-rotate-left" />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '700' }}>CHỜ XỬ LÝ &amp; TRẢ LỜI</div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#D97706' }}>{pendingCount}</div>
          </div>
        </div>

        <div style={{ background: '#FFF', borderRadius: '12px', padding: '18px 20px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            <i className="fa-solid fa-envelope-circle-check" />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '700' }}>ĐÃ TRẢ LỜI &amp; GỬI MAIL</div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#059669' }}>{resolvedCount}</div>
          </div>
        </div>

        <div style={{ background: '#FFF', borderRadius: '12px', padding: '18px 20px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: '#F5F3FF', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            <i className="fa-solid fa-chart-pie" />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '700' }}>TỶ LỆ GIẢI QUYẾT</div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#7C3AED' }}>{resolveRate}%</div>
          </div>
        </div>
      </div>

      {/* ─── 2. SEARCH & FILTER CONTROLS ─── */}
      <div style={{ background: '#FFF', padding: '16px 20px', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        {/* Status Filters */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'Tất Cả Thư Góp Ý', count: totalCount },
            { id: 'pending', label: 'Chờ Phản Hồi', count: pendingCount, color: '#D97706', bg: '#FEF3C7' },
            { id: 'resolved', label: 'Đã Trả Lời & Gửi Mail', count: resolvedCount, color: '#059669', bg: '#ECFDF5' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setFilterStatus(t.id)}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: filterStatus === t.id ? '1.5px solid #002855' : '1px solid #E2E8F0',
                fontSize: '12.5px',
                fontWeight: filterStatus === t.id ? '800' : '600',
                cursor: 'pointer',
                background: filterStatus === t.id ? '#002855' : '#FFF',
                color: filterStatus === t.id ? '#FFF' : '#475569',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>{t.label}</span>
              <span style={{
                background: filterStatus === t.id ? 'rgba(255,255,255,0.25)' : (t.bg || '#F1F5F9'),
                color: filterStatus === t.id ? '#FFF' : (t.color || '#334155'),
                padding: '1px 7px',
                borderRadius: '10px',
                fontSize: '11px',
                fontWeight: '800'
              }}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search input */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flex: 1, maxWidth: '420px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', fontSize: '13px' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm theo họ tên, đơn vị, email hoặc nội dung..."
              style={{
                width: '100%',
                padding: '8px 12px 8px 34px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '12.5px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ border: 'none', background: 'transparent', color: '#64748B', cursor: 'pointer', fontSize: '12px' }}
            >
              Xóa
            </button>
          )}
        </div>
      </div>

      {/* ─── 3. FEEDBACK DATA TABLE ─── */}
      <div style={{ background: '#FFF', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748B' }}>
            <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '28px', color: '#0284C7', marginBottom: '12px' }} />
            <div>Đang tải hòm thư góp ý từ CSDL...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748B' }}>
            <i className="fa-regular fa-envelope" style={{ fontSize: '40px', color: '#CBD5E1', marginBottom: '12px' }} />
            <div style={{ fontWeight: '700', fontSize: '15px', color: '#334155' }}>Không có thư góp ý nào phù hợp</div>
            <div style={{ fontSize: '13px', color: '#94A3B8', marginTop: '4px' }}>Hãy thử chọn bộ lọc khác hoặc làm mới danh sách</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1.5px solid #E2E8F0', color: '#334155', fontWeight: '800', textAlign: 'left' }}>
                <th style={{ padding: '14px 16px', width: '80px', textAlign: 'center' }}>Mã</th>
                <th style={{ padding: '14px 16px', width: '230px' }}>Người Gửi &amp; Đơn Vị</th>
                <th style={{ padding: '14px 16px', width: '200px' }}>Chủ Đề &amp; Tiêu Đề</th>
                <th style={{ padding: '14px 16px' }}>Nội Dung Ý Kiến &amp; Phản Hồi Của BTV</th>
                <th style={{ padding: '14px 16px', width: '140px', textAlign: 'center' }}>Trạng Thái</th>
                <th style={{ padding: '14px 16px', width: '140px', textAlign: 'center' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, i) => {
                const id = item.id || item.MaGopY || (i + 1);
                const sender = item.fullname || item.sender_name || item.HoTen || 'Cán bộ / Đoàn viên';
                const email = item.email || item.Email || '';
                const phone = item.phone || item.SoDienThoai || '';
                const unit = item.unit || item.DonVi || 'Đoàn viên TDMU';
                const category = item.category || item.ChuDe || 'Góp ý chung';
                const title = item.title || item.TieuDe || 'Ý kiến đóng góp';
                const content = item.content || item.NoiDung || '';
                const reply = item.response || item.reply || item.TraLoi || '';
                const hasReply = Boolean(reply);
                const submitDate = item.submitted_at || item.NgayGui || '';

                return (
                  <tr key={id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s' }}>
                    
                    {/* Mã */}
                    <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '800', color: '#002855' }}>
                      <span style={{ background: '#F1F5F9', padding: '3px 8px', borderRadius: '6px', fontSize: '11.5px' }}>
                        #{id}
                      </span>
                    </td>

                    {/* Người gửi */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#E0E7FF', color: '#4338CA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '12px' }}>
                          {sender.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: '700', color: '#0F172A', fontSize: '13.5px' }}>{sender}</div>
                          <div style={{ fontSize: '11.5px', color: '#64748B' }}>{unit}</div>
                        </div>
                      </div>
                      <div style={{ marginTop: '6px', fontSize: '11.5px', color: '#0284C7', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        {email ? (
                          <span><i className="fa-regular fa-envelope me-1" />{email}</span>
                        ) : (
                          <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>Không có email</span>
                        )}
                        {phone && <span style={{ color: '#64748B', marginLeft: '6px' }}>· 📞 {phone}</span>}
                      </div>
                    </td>

                    {/* Chủ đề & Tiêu đề */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'inline-block', background: '#F1F5F9', color: '#475569', fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px', marginBottom: '4px' }}>
                        {category}
                      </div>
                      <div style={{ fontWeight: '700', color: '#1E293B', lineHeight: '1.4' }}>{title}</div>
                      {submitDate && (
                        <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>
                          <i className="fa-regular fa-clock me-1" />
                          {new Date(submitDate).toLocaleString('vi-VN')}
                        </div>
                      )}
                    </td>

                    {/* Nội dung ý kiến & Phản hồi */}
                    <td style={{ padding: '14px 16px', color: '#334155', lineHeight: 1.55 }}>
                      <div style={{ background: '#F8FAFC', borderLeft: '3px solid #CBD5E1', padding: '8px 12px', borderRadius: '4px', fontSize: '12.5px', color: '#334155' }}>
                        {content}
                      </div>
                      {hasReply && (
                        <div style={{ marginTop: '8px', background: '#F0FDF4', borderLeft: '3px solid #16A34A', padding: '8px 12px', borderRadius: '4px', fontSize: '12px', color: '#166534' }}>
                          <div style={{ fontWeight: '800', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <i className="fa-solid fa-reply" /> Phản hồi chính thức của Ban Thường Vụ:
                          </div>
                          <div style={{ whiteSpace: 'pre-line' }}>{reply}</div>
                        </div>
                      )}
                    </td>

                    {/* Trạng thái */}
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      {hasReply ? (
                        <span style={{
                          background: '#DCFCE7',
                          color: '#166534',
                          border: '1px solid #86EFAC',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '11px',
                          fontWeight: '800',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}>
                          <i className="fa-solid fa-circle-check" /> Đã Trả Lời &amp; Gửi Mail
                        </span>
                      ) : (
                        <span style={{
                          background: '#FEF3C7',
                          color: '#92400E',
                          border: '1px solid #FCD34D',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '11px',
                          fontWeight: '800',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}>
                          <i className="fa-solid fa-clock" /> Chờ Trả Lời
                        </span>
                      )}
                    </td>

                    {/* Thao tác */}
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          onClick={() => openReplyModal(item)}
                          title="Mở phiếu trả lời và gửi mail"
                          style={{
                            background: hasReply ? '#F0FDF4' : '#0284C7',
                            border: hasReply ? '1px solid #86EFAC' : 'none',
                            color: hasReply ? '#166534' : '#FFF',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '700',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            boxShadow: hasReply ? 'none' : '0 2px 4px rgba(2,132,199,0.2)'
                          }}
                        >
                          <i className={hasReply ? "fa-solid fa-pen-to-square" : "fa-solid fa-reply"} />
                          {hasReply ? 'Xem / Sửa' : 'Trả Lời'}
                        </button>
                        <button
                          onClick={() => handleDelete(id, title)}
                          title="Xóa góp ý"
                          style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', padding: '6px 9px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                        >
                          <i className="fa-solid fa-trash" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ─── 4. FORM TRẢ LỜI CHUYÊN NGHIỆP & GỬI EMAIL (PROFESSIONAL REPLY MODAL) ─── */}
      {selectedItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(5px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#FFF', borderRadius: '16px', width: '100%', maxWidth: '820px', maxHeight: '92vh', overflow: 'hidden', border: '1px solid #E2E8F0', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column' }}>
            
            {/* Modal Header */}
            <div style={{ padding: '16px 24px', background: 'linear-gradient(135deg, #002855 0%, #1E40AF 100%)', color: '#FFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                  <i className="fa-solid fa-file-pen" />
                </div>
                <div>
                  <div style={{ fontWeight: '800', fontSize: '16px' }}>
                    Phiếu Xử Lý &amp; Trả Lời Góp Ý Đoàn Viên
                  </div>
                  <div style={{ fontSize: '12px', color: '#93C5FD' }}>
                    Mã hồ sơ: <strong>#TDMU-GY-{(selectedItem.id || selectedItem.MaGopY || '').toString().padStart(3, '0')}</strong> · Trực thuộc Cổng thông tin Công đoàn TDMU
                  </div>
                </div>
              </div>

              {/* Tabs Compose / Preview */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.12)', padding: '3px', borderRadius: '8px', gap: '3px' }}>
                  <button
                    type="button"
                    onClick={() => setActiveModalTab('compose')}
                    style={{
                      border: 'none',
                      padding: '5px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      background: activeModalTab === 'compose' ? '#FFF' : 'transparent',
                      color: activeModalTab === 'compose' ? '#002855' : '#E2E8F0'
                    }}
                  >
                    <i className="fa-solid fa-pen-nib me-1" /> Soạn Thảo
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveModalTab('preview')}
                    style={{
                      border: 'none',
                      padding: '5px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      background: activeModalTab === 'preview' ? '#FFF' : 'transparent',
                      color: activeModalTab === 'preview' ? '#002855' : '#E2E8F0'
                    }}
                  >
                    <i className="fa-solid fa-eye me-1" /> Xem Trước Email
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  style={{ background: 'none', border: 'none', color: '#CBD5E1', fontSize: '22px', cursor: 'pointer', marginLeft: '6px' }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1, background: '#F8FAFC' }}>
              
              {/* THÔNG TIN CHI TIẾT ĐẦY ĐỦ CỦA NGƯỜI GỬI (100% ĐẦY ĐỦ THÔNG TIN) */}
              <div style={{ background: '#FFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '18px 20px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: '12px', fontWeight: '800', color: '#002855', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <i className="fa-solid fa-address-card text-primary" /> THÔNG TIN ĐẦY ĐỦ VỀ Ý KIẾN GỬI VỀ TỪ ĐOÀN VIÊN
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '14px', fontSize: '13px' }}>
                  <div>
                    <span style={{ color: '#64748B', fontSize: '12px' }}>Họ và tên:</span>
                    <div style={{ fontWeight: '700', color: '#0F172A', marginTop: '2px' }}>
                      {selectedItem.sender_name || selectedItem.fullname || selectedItem.HoTen || 'Cán bộ / Đoàn viên'}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', fontSize: '12px' }}>Đơn vị / Khoa / Phòng:</span>
                    <div style={{ fontWeight: '700', color: '#0F172A', marginTop: '2px' }}>
                      {selectedItem.unit || selectedItem.DonVi || 'Đoàn viên TDMU'}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', fontSize: '12px' }}>Email nhận phản hồi:</span>
                    <div style={{ fontWeight: '700', color: '#0284C7', marginTop: '2px' }}>
                      {selectedItem.email || selectedItem.Email || <span style={{ color: '#DC2626' }}>Chưa cung cấp email</span>}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', fontSize: '12px' }}>Số điện thoại:</span>
                    <div style={{ fontWeight: '700', color: '#0F172A', marginTop: '2px' }}>
                      {selectedItem.phone || selectedItem.SoDienThoai || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', fontSize: '12px' }}>Chuyên mục / Chủ đề:</span>
                    <div style={{ fontWeight: '700', color: '#0F172A', marginTop: '2px' }}>
                      {selectedItem.category || selectedItem.ChuDe || 'Góp ý chung'}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', fontSize: '12px' }}>Thời gian tiếp nhận:</span>
                    <div style={{ fontWeight: '700', color: '#0F172A', marginTop: '2px' }}>
                      {selectedItem.submitted_at || selectedItem.NgayGui ? new Date(selectedItem.submitted_at || selectedItem.NgayGui).toLocaleString('vi-VN') : 'Mới tiếp nhận'}
                    </div>
                  </div>
                </div>

                {/* Tiêu đề & Nội dung thư */}
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '14px 16px' }}>
                  <div style={{ fontWeight: '800', color: '#002855', fontSize: '14px', marginBottom: '6px' }}>
                    <i className="fa-solid fa-quote-left text-muted me-2" />
                    {selectedItem.title || selectedItem.TieuDe || 'Ý kiến đóng góp'}
                  </div>
                  <div style={{ fontSize: '13.5px', color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                    {selectedItem.content || selectedItem.NoiDung}
                  </div>
                </div>
              </div>

              {/* TAB 1: COMPOSE REPLY */}
              {activeModalTab === 'compose' ? (
                <form onSubmit={handleSaveReply} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {/* Quick Response Templates */}
                  <div style={{ background: '#FFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '14px 18px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '800', color: '#334155', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <i className="fa-solid fa-wand-magic-sparkles text-warning" />
                      MẪU PHẢN HỒI NHANH CHUẨN MỰC CÔNG ĐOÀN (Bấm để điền mẫu):
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => applyTemplate('received')}
                        style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '5px 12px', fontSize: '12px', fontWeight: '600', color: '#334155', cursor: 'pointer' }}
                      >
                        + Tiếp thu &amp; chuyển Ban chuyên môn
                      </button>
                      <button
                        type="button"
                        onClick={() => applyTemplate('policy')}
                        style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '5px 12px', fontSize: '12px', fontWeight: '600', color: '#334155', cursor: 'pointer' }}
                      >
                        + Giải đáp chế độ, chính sách phúc lợi
                      </button>
                      <button
                        type="button"
                        onClick={() => applyTemplate('facilities')}
                        style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '5px 12px', fontSize: '12px', fontWeight: '600', color: '#334155', cursor: 'pointer' }}
                      >
                        + Đề xuất cải thiện cơ sở vật chất
                      </button>
                      <button
                        type="button"
                        onClick={() => applyTemplate('resolved')}
                        style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '5px 12px', fontSize: '12px', fontWeight: '600', color: '#334155', cursor: 'pointer' }}
                      >
                        + Đã giải quyết xong nguyện vọng
                      </button>
                    </div>
                  </div>

                  {/* Form fields */}
                  <div style={{ background: '#FFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                      {/* Đại diện ký phản hồi */}
                      <div>
                        <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#1E293B', display: 'block', marginBottom: '6px' }}>
                          Đại diện Ban Thường Vụ ký văn bản phản hồi (*):
                        </label>
                        <select
                          value={signerTitle}
                          onChange={e => setSignerTitle(e.target.value)}
                          style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', background: '#FFF' }}
                        >
                          <option value="Ban Thường Vụ Công Đoàn Trường Đại học Thủ Dầu Một">TM. Ban Thường Vụ Công Đoàn Trường ĐH Thủ Dầu Một</option>
                          <option value="Chủ tịch Công đoàn Trường Đại học Thủ Dầu Một">Chủ tịch Công đoàn Cơ sở</option>
                          <option value="Ban Chăm lo Đời sống & Phúc lợi Đoàn viên">Ban Chăm lo Đời sống &amp; Phúc lợi Đoàn viên</option>
                          <option value="Ban Nữ công & Thi đua khen thưởng">Ban Nữ công &amp; Thi đua khen thưởng</option>
                          <option value="Văn phòng Công đoàn Trường">Văn phòng Công đoàn Trường</option>
                        </select>
                      </div>

                      {/* Tiêu đề Email */}
                      <div>
                        <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#1E293B', display: 'block', marginBottom: '6px' }}>
                          Tiêu đề thư gửi đến hòm thư người nhận (*):
                        </label>
                        <input
                          type="text"
                          required
                          value={emailSubject}
                          onChange={e => setEmailSubject(e.target.value)}
                          placeholder="Nhập tiêu đề email..."
                          style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>

                    {/* Nội dung phản hồi */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#1E293B' }}>
                          Nội dung trả lời &amp; kết quả giải quyết chính thức (*):
                        </label>
                        <span style={{ fontSize: '11px', color: '#64748B' }}>
                          {replyText.length} ký tự
                        </span>
                      </div>
                      <textarea
                        required
                        rows={6}
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        placeholder="Nhập văn bản trả lời trang trọng, chỉ đạo tiếp thu hoặc kết quả giải quyết kiến nghị của Công đoàn..."
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          border: '1.5px solid #CBD5E1',
                          borderRadius: '8px',
                          fontSize: '13.5px',
                          lineHeight: '1.6',
                          resize: 'vertical',
                          fontFamily: "system-ui, -apple-system, sans-serif",
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    {/* Tùy chọn gửi email */}
                    <div style={{ background: '#EFF6FF', border: '1.5px solid #BFDBFE', borderRadius: '10px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', margin: 0 }}>
                        <input
                          type="checkbox"
                          checked={sendEmailNotify}
                          onChange={e => setSendEmailNotify(e.target.checked)}
                          disabled={!selectedItem.email && !selectedItem.Email}
                          style={{ width: '18px', height: '18px', accentColor: '#2563EB', cursor: 'pointer' }}
                        />
                        <div>
                          <div style={{ fontWeight: '700', color: '#1E40AF', fontSize: '13.5px' }}>
                            <i className="fa-solid fa-paper-plane me-1" />
                            Gửi email phản hồi chính thức trực tiếp về hòm thư người gửi
                          </div>
                          <div style={{ fontSize: '12px', color: '#1E3A8A', marginTop: '2px' }}>
                            {selectedItem.email || selectedItem.Email ? (
                              <span>Địa chỉ nhận: <strong>{selectedItem.email || selectedItem.Email}</strong> (Kèm bản ghi lưu trữ Outbox)</span>
                            ) : (
                              <span style={{ color: '#DC2626' }}>Người gửi không cung cấp email, phản hồi sẽ được lưu trữ trong hệ thống và hiển thị công khai/nội bộ.</span>
                            )}
                          </div>
                        </div>
                      </label>

                      <button
                        type="button"
                        onClick={() => setActiveModalTab('preview')}
                        style={{ background: '#FFF', border: '1px solid #93C5FD', color: '#1D4ED8', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' }}
                      >
                        <i className="fa-solid fa-eye me-1" /> Xem Trước Thư
                      </button>
                    </div>

                  </div>

                  {saveSuccessMsg && (
                    <div style={{ background: '#DCFCE7', border: '1px solid #86EFAC', color: '#166534', padding: '12px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <i className="fa-solid fa-circle-check fs-5" />
                      {saveSuccessMsg}
                    </div>
                  )}

                  {/* Actions footer */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '4px' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedItem(null)}
                      style={{ background: '#FFF', border: '1px solid #CBD5E1', color: '#475569', padding: '10px 20px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}
                    >
                      Hủy Bỏ
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      style={{
                        background: '#0284C7',
                        color: '#FFF',
                        border: 'none',
                        padding: '10px 24px',
                        borderRadius: '8px',
                        fontWeight: '800',
                        cursor: saving ? 'not-allowed' : 'pointer',
                        fontSize: '13.5px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 2px 6px rgba(2,132,199,0.3)'
                      }}
                    >
                      {saving ? (
                        <>
                          <i className="fa-solid fa-spinner fa-spin" /> Đang Gửi Phản Hồi &amp; Email...
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-paper-plane" /> Lưu Phản Hồi &amp; Gửi Email Ngay
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                /* TAB 2: EMAIL PREVIEW */
                <div>
                  <div style={{ background: '#FFF', borderRadius: '12px', border: '1px solid #CBD5E1', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
                    
                    {/* Fake Email Client Bar */}
                    <div style={{ background: '#F1F5F9', borderBottom: '1px solid #E2E8F0', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#64748B' }}>
                      <div>
                        <strong>Người gửi:</strong> Công Đoàn Trường ĐH Thủ Dầu Một &lt;congdoan@tdmu.edu.vn&gt;<br />
                        <strong>Người nhận:</strong> {selectedItem.sender_name || selectedItem.fullname || selectedItem.HoTen} &lt;{selectedItem.email || selectedItem.Email || 'doanvien@tdmu.edu.vn'}&gt;<br />
                        <strong>Tiêu đề:</strong> {emailSubject || `[Công Đoàn TDMU] Phản hồi ý kiến: "${selectedItem.title || selectedItem.TieuDe}"`}
                      </div>
                      <span style={{ background: '#DCFCE7', color: '#166534', padding: '3px 8px', borderRadius: '4px', fontWeight: '700' }}>
                        BẢN XEM TRƯỚC HTML
                      </span>
                    </div>

                    {/* Official TDMU HTML Email Template Preview */}
                    <div style={{ padding: '30px', background: '#FFFFFF', maxWidth: '640px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
                      <div style={{ background: 'linear-gradient(135deg, #002855 0%, #1E40AF 100%)', color: '#FFFFFF', padding: '24px', textAlign: 'center', borderRadius: '8px 8px 0 0' }}>
                        <h2 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 'bold', letterSpacing: '0.5px' }}>CÔNG ĐOÀN TRƯỜNG ĐẠI HỌC THỦ DẦU MỘT</h2>
                        <div style={{ fontSize: '12px', color: '#FEF08A', fontWeight: '700' }}>HỆ THỐNG TRUYỀN THÔNG &amp; TIẾP NHẬN Ý KIẾN ĐOÀN VIÊN</div>
                      </div>
                      
                      <div style={{ padding: '24px 20px', border: '1px solid #E2E8F0', borderTop: 'none', borderRadius: '0 0 8px 8px', color: '#1E293B', fontSize: '14px', lineHeight: '1.6' }}>
                        <p>Kính gửi: <strong>{selectedItem.sender_name || selectedItem.fullname || selectedItem.HoTen || 'Quý Thầy/Cô, Đoàn viên'}</strong>,</p>
                        <p>Ban Thường Vụ Công Đoàn Trường Đại học Thủ Dầu Một xin trân trọng cảm ơn Quý Thầy/Cô, Đoàn viên đã gửi ý kiến đóng góp cho phong trào và hoạt động Công đoàn Trường.</p>
                        
                        <div style={{ background: '#F8FAFC', borderLeft: '4px solid #2563EB', padding: '12px 16px', margin: '16px 0', borderRadius: '4px' }}>
                          <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Tiêu đề ý kiến:</div>
                          <div style={{ fontWeight: '700', color: '#002855', fontSize: '14.5px', marginTop: '3px' }}>{selectedItem.title || selectedItem.TieuDe}</div>
                        </div>

                        <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '6px', padding: '16px', margin: '16px 0' }}>
                          <div style={{ fontSize: '12px', color: '#1E40AF', fontWeight: '700', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <i className="fa-solid fa-reply" /> NỘI DUNG PHẢN HỒI CHÍNH THỨC:
                          </div>
                          <div style={{ whiteSpace: 'pre-line', color: '#0F172A', fontSize: '13.5px', lineHeight: '1.65' }}>
                            {replyText || 'Ban Thường Vụ Công Đoàn Trường trân trọng cảm ơn và tiếp thu ý kiến của Quý Thầy/Cô để không ngừng hoàn thiện công tác chăm lo đời sống đoàn viên.'}
                          </div>
                        </div>

                        <p style={{ marginTop: '20px', fontSize: '13px' }}>
                          Nếu Quý Thầy/Cô cần trao đổi thêm thông tin, xin vui lòng liên hệ trực tiếp Văn phòng Công đoàn qua Cổng thông tin hoặc email: <a href="mailto:congdoan@tdmu.edu.vn" style={{ color: '#2563EB', fontWeight: '700' }}>congdoan@tdmu.edu.vn</a>.
                        </p>

                        <div style={{ marginTop: '24px', borderTop: '1px solid #E2E8F0', paddingTop: '16px', textAlign: 'right' }}>
                          <div style={{ fontWeight: '800', color: '#002855', fontSize: '13.5px' }}>{signerTitle}</div>
                          <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>Trường Đại học Thủ Dầu Một</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                    <button
                      type="button"
                      onClick={() => setActiveModalTab('compose')}
                      style={{ background: '#0284C7', color: '#FFF', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}
                    >
                      ← Quay Lại Soạn Thảo
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
