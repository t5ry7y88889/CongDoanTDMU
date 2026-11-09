import React, { useState, useEffect } from 'react';

export default function ModalThamDinhBaiViet({
  isOpen,
  onClose,
  article,
  onApprove,
  onRequestRevision,
  onPublishLive
}) {
  const [activeChannelTab, setActiveChannelTab] = useState('web'); // 'web' | 'facebook' | 'zalo'
  const [reviewNotes, setReviewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(article?.status || 'draft');

  useEffect(() => {
    if (article) {
      setReviewNotes(article.reviewNotes || article.ghi_chu_kiem_duyet || '');
      setActiveChannelTab('web');
      setCurrentStatus(article.status || (article.isDraft ? 'draft' : 'published'));
    }
  }, [article]);

  if (!isOpen || !article) return null;

  const isApproved = currentStatus === 'approved';
  const isPublished = currentStatus === 'published';
  const isResubmitted = article?.isResubmitted || 
    (currentStatus === 'pending_review' && Boolean(article?.reviewNotes || article?.ghi_chu_kiem_duyet));

  const handleApproveClick = async () => {
    setSubmitting(true);
    try {
      const ok = await onApprove(article.id, reviewNotes || 'Nội dung đạt chuẩn báo chí, phê duyệt xuất bản');
      if (ok !== false) {
        setCurrentStatus('approved');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestRevisionClick = async () => {
    if (!reviewNotes.trim()) {
      alert('Vui lòng nhập nhận xét / lý do yêu cầu sửa đổi để cán bộ viết bài nắm thông tin!');
      return;
    }
    setSubmitting(true);
    try {
      const ok = await onRequestRevision(article.id, reviewNotes);
      if (ok !== false) {
        setCurrentStatus('requires_revision');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const applyQuickPreset = (presetText) => {
    setReviewNotes(prev => {
      if (!prev.trim()) return presetText;
      if (prev.includes(presetText)) return prev;
      return `${prev}\n• ${presetText}`;
    });
  };

  // Tính toán thời gian đọc và số từ
  const rawBodyText = (article.content || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const wordCount = rawBodyText ? rawBodyText.split(' ').length : 0;
  const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 220));

  const fbContent = article.noi_dung_fb || article.NoiDungFB || article.fbCaption || `${article.title}\n\n${article.summary || article.sapo || ''}\n\n#CongDoanTDMU #TDMU`;
  const zaloContent = article.noi_dung_zalo || article.NoiDungZalo || article.zaloText || `${article.title}\n\n${article.summary || article.sapo || ''}`;
  const rawImage = (article.image || article.HinhAnhDaiDien || article.HinhAnh || '').trim();
  const isHardcodedBanner = !rawImage || rawImage.includes('banner.jpg') || rawImage.includes('photo1.jpg');
  const imageUrl = !isHardcodedBanner 
    ? (rawImage.startsWith('http') || rawImage.startsWith('/') ? rawImage : '/' + rawImage) 
    : null;

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span style={{ background: '#DCFCE7', color: '#16A34A', border: '1px solid #86EFAC', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <i className="fa-solid fa-circle-check" /> Đã Phê Duyệt
          </span>
        );
      case 'published':
        return (
          <span style={{ background: '#DBEAFE', color: '#2563EB', border: '1px solid #93C5FD', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <i className="fa-solid fa-globe" /> Đã Phát Hành Live
          </span>
        );
      case 'requires_revision':
        return (
          <span style={{ background: '#FEE2E2', color: '#DC2626', border: '1px solid #FCA5A5', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <i className="fa-solid fa-arrow-rotate-left" /> Chờ Cán Bộ Sửa
          </span>
        );
      case 'pending_review':
        return (
          <span style={{ background: '#FEF3C7', color: '#D97706', border: '1px solid #FCD34D', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <i className="fa-solid fa-clock-rotate-left" /> Chờ Thẩm Định
          </span>
        );
      default:
        return (
          <span style={{ background: '#F1F5F9', color: '#64748B', border: '1px solid #CBD5E1', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <i className="fa-solid fa-file-pen" /> Bản Nháp
          </span>
        );
    }
  };

  // Dọn dẹp nội dung HTML: Tránh lặp lại tiêu đề H1/H2 bên trong body và đảm bảo không vỡ khung
  const cleanContentHtml = () => {
    let html = article.content || '<p class="text-muted fst-italic">Chưa có nội dung bài viết chi tiết.</p>';
    if (article.title) {
      const cleanTitle = article.title.trim().toLowerCase();
      // 1. Gỡ bỏ tiêu đề trùng lặp trong thẻ h1-h6
      html = html.replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/i, (match, p1) => {
        const textInHeading = p1.replace(/<[^>]*>/g, '').trim().toLowerCase();
        if (textInHeading === cleanTitle || textInHeading.startsWith(cleanTitle.slice(0, 30)) || cleanTitle.startsWith(textInHeading.slice(0, 30))) {
          return '';
        }
        return match;
      });
      // 2. Gỡ bỏ tiêu đề trùng lặp nếu tác giả bôi đậm trong thẻ p ở đầu bài
      html = html.replace(/^\s*<p[^>]*>\s*(?:<strong>|<b>)(.*?)(?:<\/strong>|<\/b>)\s*<\/p>/i, (match, p1) => {
        const textInP = p1.replace(/<[^>]*>/g, '').trim().toLowerCase();
        if (textInP === cleanTitle || textInP.startsWith(cleanTitle.slice(0, 30)) || cleanTitle.startsWith(textInP.slice(0, 30))) {
          return '';
        }
        return match;
      });
    }
    return html.normalize('NFC');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10, 20, 35, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        boxSizing: 'border-box'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#F8FAFC',
          borderRadius: '16px',
          width: '96vw',
          maxWidth: '1360px',
          height: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.4)',
          overflow: 'hidden',
          border: '1px solid #CBD5E1'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Style scoped cho nội dung bài đọc chuẩn báo chí, chống vỡ ảnh */}
        <style>{`
          .reader-article-body img {
            max-width: 100% !important;
            height: auto !important;
            max-height: 480px !important;
            object-fit: contain !important;
            border-radius: 8px !important;
            margin: 18px auto !important;
            display: block !important;
            box-shadow: 0 2px 12px rgba(0,0,0,0.08) !important;
          }
          .reader-article-body figure {
            max-width: 100% !important;
            margin: 20px auto !important;
            text-align: center !important;
          }
          .reader-article-body figure img {
            margin: 0 auto !important;
          }
          .reader-article-body figcaption {
            font-size: 13px !important;
            color: #64748B !important;
            font-style: italic !important;
            margin-top: 6px !important;
            text-align: center !important;
          }
          .reader-article-body table {
            max-width: 100% !important;
            width: 100% !important;
            border-collapse: collapse !important;
            overflow-x: auto !important;
            display: block !important;
          }
          .reader-article-body iframe,
          .reader-article-body video {
            max-width: 100% !important;
            border-radius: 8px !important;
          }
        `}</style>

        {/* ─── 1. TOP MASTER BAR: Điều Hướng & Chỉ Số Tòa Soạn ─── */}
        <div style={{
          padding: '12px 24px',
          background: '#002855',
          color: '#FFF',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0
        }}>
          {/* Trái: Định danh bài viết */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              background: '#0284C7',
              color: '#FFF',
              padding: '3px 8px',
              borderRadius: '6px',
              fontWeight: '800',
              fontSize: '11px',
              letterSpacing: '0.5px'
            }}>
              TÒA SOẠN & THẨM ĐỊNH
            </div>
            <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#93C5FD', fontSize: '13px' }}>
              #TDMU-{String(article.id).padStart(3, '0')}
            </span>
            <span style={{ color: '#64748B' }}>|</span>
            {renderStatusBadge(currentStatus)}
            {isResubmitted && (
              <span style={{
                background: '#EFF6FF',
                color: '#1D4ED8',
                border: '1.5px solid #60A5FA',
                padding: '3px 10px',
                borderRadius: '16px',
                fontSize: '11px',
                fontWeight: '800',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                boxShadow: '0 2px 6px rgba(37,99,235,0.2)'
              }}>
                <i className="fa-solid fa-arrows-rotate" /> ĐÃ SỬA & GỬI LẠI
              </span>
            )}
            <span style={{ fontSize: '12.5px', color: '#E2E8F0' }}>
              Chuyên mục: <strong>{article.categoryName || 'Hoạt động Công đoàn'}</strong>
            </span>
          </div>

          {/* Giữa: Bộ chọn 3 kênh phát hành */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.1)', padding: '3px', borderRadius: '8px', gap: '4px' }}>
            <button
              onClick={() => setActiveChannelTab('web')}
              style={{
                border: 'none',
                padding: '6px 16px',
                borderRadius: '6px',
                fontSize: '12.5px',
                fontWeight: '700',
                cursor: 'pointer',
                background: activeChannelTab === 'web' ? '#FFF' : 'transparent',
                color: activeChannelTab === 'web' ? '#002855' : '#E2E8F0',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <i className="fa-solid fa-newspaper" /> 🌐 Báo Web Tạp Chí
            </button>
            <button
              onClick={() => setActiveChannelTab('facebook')}
              style={{
                border: 'none',
                padding: '6px 16px',
                borderRadius: '6px',
                fontSize: '12.5px',
                fontWeight: '700',
                cursor: 'pointer',
                background: activeChannelTab === 'facebook' ? '#1877F2' : 'transparent',
                color: '#FFF',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <i className="fa-brands fa-facebook" /> 📘 Tin Facebook
            </button>
            <button
              onClick={() => setActiveChannelTab('zalo')}
              style={{
                border: 'none',
                padding: '6px 16px',
                borderRadius: '6px',
                fontSize: '12.5px',
                fontWeight: '700',
                cursor: 'pointer',
                background: activeChannelTab === 'zalo' ? '#0068FF' : 'transparent',
                color: '#FFF',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <i className="fa-solid fa-comment-dots" /> 💬 Tin Zalo OA
            </button>
          </div>

          {/* Phải: Đóng */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              onClick={onClose}
              style={{
                border: 'none',
                background: 'rgba(255,255,255,0.15)',
                color: '#FFF',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              title="Đóng cửa sổ thẩm định"
            >
              <i className="fa-solid fa-xmark fs-5" />
            </button>
          </div>
        </div>

        {/* ─── 2. MAIN SPLIT WORKSPACE: KHU VỰC ĐỌC (68%) & BÀN THẨM ĐỊNH (32%) ─── */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* ══════ CỘT TRÁI: BẢN ĐỌC BÁO CHÍ CAO CẤP (READER CANVAS) ══════ */}
          <div
            id="modal-reader-scroll-canvas"
            style={{
              flex: 1,
              overflowY: 'auto',
              background: '#F1F5F9',
              padding: '24px 20px'
            }}
          >

            {/* TAB 1: BÁO WEB TẠP CHÍ ĐIỆN TỬ */}
            {activeChannelTab === 'web' && (
              <div style={{
                width: '100%',
                maxWidth: '840px',
                margin: '0 auto 40px auto',
                background: '#FFFFFF',
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                border: '1px solid #E2E8F0',
                padding: '40px 48px',
                boxSizing: 'border-box',
                fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
              }}>
                {/* Banner Thông Báo Đã Sửa Lại (Nếu tác giả nộp lại sau khi bị yêu cầu sửa) */}
                {isResubmitted && (
                  <div style={{
                    background: '#EFF6FF',
                    border: '1.5px solid #60A5FA',
                    borderRadius: '10px',
                    padding: '14px 18px',
                    marginBottom: '24px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    fontFamily: "system-ui, sans-serif"
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: '#DBEAFE',
                      color: '#1D4ED8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <i className="fa-solid fa-arrows-rotate" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '800', color: '#1E40AF', fontSize: '13.5px' }}>
                        Bản thảo đã được Cán bộ hoàn thành chỉnh sửa và gửi lại thẩm định
                      </div>
                      <div style={{ fontSize: '12.5px', color: '#1E3A8A', marginTop: '4px', lineHeight: '1.5' }}>
                        <strong>Ý kiến yêu cầu sửa trước đó của Ban Biên Tập:</strong> <em>"{article.reviewNotes || article.ghi_chu_kiem_duyet}"</em>
                      </div>
                    </div>
                  </div>
                )}

                {/* Header Tạp Chí */}
                <div style={{ borderBottom: '2px solid #002855', paddingBottom: '12px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: '#002855', letterSpacing: '0.2px' }}>
                    <i className="fa-solid fa-landmark me-1" /> CÔNG ĐOÀN ĐẠI HỌC THỦ DẦU MỘT · BẢN THẨM ĐỊNH
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748B', fontFamily: "system-ui, sans-serif" }}>
                    <span>📖 {wordCount} từ</span> · <span>⏱️ ~{readTimeMinutes} phút đọc</span>
                  </div>
                </div>

                {/* Tiêu đề Báo Chí */}
                <h1 style={{
                  fontSize: '24px',
                  fontWeight: '800',
                  color: '#0F172A',
                  lineHeight: '1.4',
                  margin: '0 0 16px 0',
                  fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                }}>
                  {(article.title || 'Bài viết chưa đặt tên').normalize('NFC')}
                </h1>

                {/* Byline: Tác giả & Ngày đăng */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  paddingBottom: '20px',
                  marginBottom: '24px',
                  borderBottom: '1px solid #E2E8F0',
                  fontFamily: "system-ui, sans-serif"
                }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    background: '#002855',
                    color: '#FFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '800',
                    fontSize: '15px'
                  }}>
                    {((article.author || 'CB').split(' ').slice(-1)[0] || 'C').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '14px', color: '#1E293B' }}>
                      {article.author || 'Cán Bộ Ban Tuyên Giáo'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748B' }}>
                      Ngày nộp: {article.createdAt ? new Date(article.createdAt).toLocaleString('vi-VN') : 'Mới cập nhật'}
                    </div>
                  </div>
                </div>

                {/* Ảnh Đại Diện Báo Chí & Caption - Chỉ hiển thị khi có ảnh thực tế (không dùng ảnh hardcode) và trong nội dung bài chưa chứa ảnh này */}
                {imageUrl && !article.content?.includes(imageUrl) && (
                  <div style={{ marginBottom: '28px' }}>
                    <div style={{
                      borderRadius: '10px',
                      overflow: 'hidden',
                      maxHeight: '380px',
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      textAlign: 'center'
                    }}>
                      <img
                        src={imageUrl}
                        alt=""
                        style={{
                          width: '100%',
                          maxHeight: '380px',
                          objectFit: 'cover',
                          display: 'block'
                        }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </div>
                    <div style={{
                      padding: '8px 12px',
                      fontSize: '12.5px',
                      color: '#64748B',
                      fontStyle: 'italic',
                      fontFamily: "system-ui, sans-serif",
                      background: '#F8FAFC',
                      borderLeft: '3px solid #CBD5E1',
                      marginTop: '6px'
                    }}>
                      <i className="fa-solid fa-camera me-1" /> Hình ảnh tư liệu hoạt động ghi nhận tại Cổng thông tin Công đoàn TDMU
                    </div>
                  </div>
                )}

                {/* Đoạn Mở Đầu Báo Chí (Sapo / Lead Paragraph) */}
                {article.summary && (
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    fontStyle: 'italic',
                    color: '#334155',
                    lineHeight: '1.7',
                    background: '#F8FAFC',
                    borderLeft: '4px solid #002855',
                    borderRadius: '0 8px 8px 0',
                    padding: '16px 20px',
                    marginBottom: '28px'
                  }}>
                    {article.summary.normalize('NFC')}
                  </div>
                )}

                {/* Toàn Văn Thân Bài (Journalistic Body Text) */}
                <div
                  className="reader-article-body"
                  style={{
                    fontSize: '16px',
                    lineHeight: '1.85',
                    color: '#1E293B'
                  }}
                  dangerouslySetInnerHTML={{ __html: cleanContentHtml() }}
                />

                {/* Footer Ký Tên Tòa Soạn */}
                <div style={{
                  marginTop: '40px',
                  paddingTop: '20px',
                  borderTop: '1px solid #E2E8F0',
                  textAlign: 'right',
                  fontFamily: "system-ui, sans-serif",
                  fontSize: '13px',
                  color: '#64748B'
                }}>
                  <strong>BAN CHẤP HÀNH CÔNG ĐOÀN CƠ SỞ TRƯỜNG ĐẠI HỌC THỦ DẦU MỘT</strong>
                </div>
              </div>
            )}

            {/* TAB 2: BÀI ĐĂNG FACEBOOK FANPAGE LIVE PREVIEW */}
            {activeChannelTab === 'facebook' && (
              <div style={{ width: '100%', maxWidth: '580px', margin: '0 auto 40px auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <i className="fa-brands fa-facebook text-primary fs-5" />
                  Mô phỏng bài đăng Fanpage Facebook thực tế khi phát hành:
                </div>
                <div style={{ background: '#FFF', borderRadius: '12px', border: '1px solid #CED0D4', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                  {/* Header Fanpage */}
                  <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img src="/images/logo_cong_doan.png" alt="CĐ TDMU" style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'contain', background: '#FFF', border: '1px solid #E2E8F0', padding: '2px' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '700', fontSize: '14px', color: '#050505', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        Công Đoàn Trường Đại học Thủ Dầu Một
                        <i className="fa-solid fa-circle-check text-primary" style={{ fontSize: '12px' }} />
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#65676B' }}>Vừa xong · <i className="fa-solid fa-earth-americas" /></div>
                    </div>
                  </div>

                  {/* Caption */}
                  <div style={{ padding: '4px 16px 14px', whiteSpace: 'pre-wrap', fontSize: '14px', color: '#050505', lineHeight: '1.5' }}>
                    {fbContent}
                  </div>

                  {/* Photo */}
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt=""
                      style={{ width: '100%', maxHeight: '380px', objectFit: 'cover', display: 'block', borderTop: '1px solid #E4E6EB' }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  )}

                  {/* Actions Mockup */}
                  <div style={{ padding: '10px 16px', borderTop: '1px solid #E4E6EB', display: 'flex', justifyContent: 'space-around', color: '#65676B', fontSize: '13px', fontWeight: '600' }}>
                    <span><i className="fa-regular fa-thumbs-up me-1" /> Thích</span>
                    <span><i className="fa-regular fa-comment me-1" /> Bình luận</span>
                    <span><i className="fa-solid fa-share me-1" /> Chia sẻ</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: TIN NHẮN ZALO OA LIVE PREVIEW */}
            {activeChannelTab === 'zalo' && (
              <div style={{ width: '100%', maxWidth: '520px', margin: '0 auto 40px auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <i className="fa-solid fa-comment-dots text-primary fs-5" />
                  Mô phỏng tin nhắn Zalo OA gửi đến cán bộ, đoàn viên:
                </div>
                <div style={{ background: '#E5EBF5', padding: '20px', borderRadius: '16px', border: '1px solid #CBD5E1' }}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <img src="/images/logo_cong_doan.png" alt="CĐ TDMU" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'contain', background: '#FFF', border: '1px solid #CBD5E1', padding: '2px', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        Công Đoàn TDMU
                        <span style={{ background: '#0068FF', color: '#FFF', fontSize: '9px', padding: '1px 6px', borderRadius: '10px', fontWeight: '800' }}>OA XÁC THỰC</span>
                      </div>
                      <div style={{ background: '#FFF', borderRadius: '0 14px 14px 14px', padding: '16px', boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}>
                        {imageUrl && (
                          <img
                            src={imageUrl}
                            alt=""
                            style={{ width: '100%', maxHeight: '220px', objectFit: 'cover', borderRadius: '8px', marginBottom: '12px', display: 'block' }}
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        )}
                        <div style={{ whiteSpace: 'pre-wrap', fontSize: '13.5px', color: '#0F172A', lineHeight: '1.55' }}>
                          {zaloContent}
                        </div>
                        <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid #F1F5F9', textAlign: 'center' }}>
                          <span style={{ fontSize: '12px', fontWeight: '700', color: '#0068FF' }}>
                            Bấm để xem chi tiết trên Cổng thông tin <i className="fa-solid fa-chevron-right" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* ══════ CỘT PHẢI: BÀN THẨM ĐỊNH & PHÊ DUYỆT (EDITORIAL DESK) ══════ */}
          <div style={{
            width: '390px',
            background: '#FFFFFF',
            borderLeft: '1px solid #E2E8F0',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
            height: '100%',
            overflow: 'hidden'
          }}>

            {/* Phần trên có thể cuộn: Khối 1 & Khối 2 */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

              {/* Khối 1: Tóm Tắt Kiểm Tra Đa Kênh */}
              <div style={{ padding: '16px 18px', borderBottom: '1px solid #E2E8F0', flexShrink: 0 }}>
                <div style={{ fontSize: '12px', fontWeight: '800', color: '#002855', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <i className="fa-solid fa-clipboard-check text-primary" /> Tiêu Chí Thẩm Định Đa Kênh
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', padding: '5px 8px', borderRadius: '6px' }}>
                    <span>🌐 Bài Báo Web</span>
                    <span style={{ color: article.content ? '#16A34A' : '#DC2626', fontWeight: '700' }}>
                      {article.content ? '✓ Đạt chuẩn' : '✗ Thiếu nội dung'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', padding: '5px 8px', borderRadius: '6px' }}>
                    <span>📘 Nội Dung Facebook</span>
                    <span style={{ color: (article.noi_dung_fb || article.NoiDungFB || fbContent) ? '#16A34A' : '#D97706', fontWeight: '700' }}>
                      {(article.noi_dung_fb || article.NoiDungFB) ? '✓ Đã đồng bộ' : '⚡ Tự sinh'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', padding: '5px 8px', borderRadius: '6px' }}>
                    <span>💬 Tin Nhắn Zalo OA</span>
                    <span style={{ color: (article.noi_dung_zalo || article.NoiDungZalo || zaloContent) ? '#16A34A' : '#D97706', fontWeight: '700' }}>
                      {(article.noi_dung_zalo || article.NoiDungZalo) ? '✓ Đã đồng bộ' : '⚡ Tự sinh'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Khối 2: Lời Phê Của Biên Tập Viên & Quick Presets */}
              <div style={{ padding: '16px 18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: '12px', fontWeight: '800', color: '#002855', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <i className="fa-solid fa-pen-nib text-primary" /> Lời Phê & Yêu Cầu Chỉnh Sửa
                </div>
                <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '8px' }}>
                  Góp ý chỉ đạo cán bộ viết bài (hoặc chọn mẫu nhanh):
                </div>

                {/* Mẫu góp ý nhanh (Quick Presets) */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '10px' }}>
                  {[
                    'Đạt chuẩn, duyệt xuất bản',
                    'Cần bổ sung thêm ảnh minh họa',
                    'Rà soát lại số liệu đại biểu',
                    'Sửa tiêu đề cho ngắn gọn hơn',
                    'Bổ sung danh sách khen thưởng'
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => applyQuickPreset(preset)}
                      style={{
                        background: '#F1F5F9',
                        border: '1px solid #CBD5E1',
                        borderRadius: '12px',
                        padding: '2px 8px',
                        fontSize: '10.5px',
                        color: '#334155',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#E2E8F0'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = '#F1F5F9'; }}
                    >
                      + {preset}
                    </button>
                  ))}
                </div>

                {/* Ô nhập nhận xét */}
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Ghi chú nhận xét của Biên tập viên (Nếu trả bài, cán bộ viết bài sẽ nhận được lời phê này trên bàn soạn thảo)..."
                  rows={4}
                  style={{
                    width: '100%',
                    borderRadius: '8px',
                    border: '1.5px solid #CBD5E1',
                    padding: '8px 10px',
                    fontSize: '12.5px',
                    outline: 'none',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                    resize: 'none',
                    minHeight: '80px',
                    background: '#F8FAFC'
                  }}
                />
              </div>

            </div>

            {/* Khối 3: ACTION HUB — GHIM CỐ ĐỊNH Ở ĐÁY, LUÔN HIỂN THỊ 100% */}
            <div style={{
              padding: '14px 18px',
              borderTop: '1px solid #E2E8F0',
              background: '#F8FAFC',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              flexShrink: 0
            }}>
              {/* Trạng thái duyệt bài hiển thị rõ ràng */}
              <div style={{
                padding: '8px 12px',
                borderRadius: '6px',
                background: isApproved ? '#DCFCE7' : (isPublished ? '#DBEAFE' : '#FEF3C7'),
                border: isApproved ? '1px solid #86EFAC' : (isPublished ? '1px solid #93C5FD' : '1px solid #FCD34D'),
                fontSize: '12px',
                fontWeight: '700',
                color: isApproved ? '#15803D' : (isPublished ? '#1D4ED8' : '#92400E'),
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <i className={isApproved ? "fa-solid fa-circle-check" : (isPublished ? "fa-solid fa-globe" : "fa-solid fa-lock")} />
                {isApproved
                  ? 'Bài viết đã được duyệt! Đủ điều kiện xuất bản.'
                  : (isPublished ? 'Bài viết đã phát hành công khai. Quy trình kiểm duyệt đã hoàn tất.' : 'Cần PHÊ DUYỆT trước khi xuất bản.')}
              </div>

              {isPublished ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <a
                    href={`/bai-viet.html?id=${article.id}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      width: '100%',
                      background: 'linear-gradient(135deg, #002855 0%, #2563EB 100%)',
                      border: 'none',
                      color: '#FFF',
                      padding: '11px 16px',
                      borderRadius: '8px',
                      fontWeight: '800',
                      fontSize: '13px',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 3px 10px rgba(37,99,235,0.25)',
                      boxSizing: 'border-box'
                    }}
                  >
                    <i className="fa-solid fa-arrow-up-right-from-square" /> Xem Bài Viết Đã Phát Hành Trên Web ↗
                  </a>
                  <a
                    href={`https://zalo.me/share?url=${encodeURIComponent(typeof window !== 'undefined' ? (window.location.origin + '/bai-viet.html?id=' + article.id) : '')}&title=${encodeURIComponent(article.title || '')}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      width: '100%',
                      background: '#F0FDF4',
                      border: '1.5px solid #86EFAC',
                      color: '#15803D',
                      padding: '9px 16px',
                      borderRadius: '8px',
                      fontWeight: '700',
                      fontSize: '12.5px',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      boxSizing: 'border-box'
                    }}
                  >
                    <i className="fa-solid fa-share-nodes" /> Chia Sẻ Zalo 1-Chạm (Không Cần Bot)
                  </a>
                </div>
              ) : (
                <>
                  {/* Hàng nút 1: Trả bài & Phê duyệt */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={handleRequestRevisionClick}
                      disabled={submitting}
                      style={{
                        background: '#FEF2F2',
                        border: '1.5px solid #F87171',
                        color: '#DC2626',
                        padding: '10px 8px',
                        borderRadius: '8px',
                        fontWeight: '800',
                        fontSize: '12.5px',
                        cursor: submitting ? 'wait' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '5px'
                      }}
                      title="Trả bài lại cho cán bộ kèm ý kiến yêu cầu chỉnh sửa"
                    >
                      <i className="fa-solid fa-arrow-rotate-left" /> Trả Bài Sửa
                    </button>

                    <button
                      type="button"
                      onClick={handleApproveClick}
                      disabled={submitting || isApproved}
                      style={{
                        background: isApproved ? '#15803D' : 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)',
                        border: 'none',
                        color: '#FFF',
                        padding: '10px 8px',
                        borderRadius: '8px',
                        fontWeight: '800',
                        fontSize: '12.5px',
                        cursor: (submitting || isApproved) ? 'default' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '5px',
                        boxShadow: isApproved ? 'none' : '0 2px 8px rgba(22,163,74,0.3)',
                        opacity: isApproved ? 0.85 : 1
                      }}
                      title="Phê duyệt bài viết để sẵn sàng phát hành"
                    >
                      <i className="fa-solid fa-check-double" /> {isApproved ? '✓ Đã Duyệt' : 'Phê Duyệt'}
                    </button>
                  </div>

                  {/* Nút 2: XUẤT BẢN — KHÓA NẾU CHƯA PHÊ DUYỆT */}
                  <button
                    type="button"
                    disabled={!isApproved}
                    onClick={() => {
                      if (!isApproved) {
                        alert('Chưa thể xuất bản! Bài viết bắt buộc phải được "Phê Duyệt" trước khi phát hành.');
                        return;
                      }
                      onClose();
                      onPublishLive({ ...article, status: 'approved' });
                    }}
                    style={{
                      width: '100%',
                      background: isApproved
                        ? 'linear-gradient(135deg, #002855 0%, #2563EB 100%)'
                        : '#E2E8F0',
                      border: isApproved ? 'none' : '1px solid #CBD5E1',
                      color: isApproved ? '#FFF' : '#94A3B8',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      fontWeight: '800',
                      fontSize: '13.5px',
                      cursor: isApproved ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: isApproved ? '0 4px 14px rgba(37,99,235,0.3)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                    title={isApproved ? "Xuất bản bài viết" : "Bắt buộc bấm Phê Duyệt trước khi xuất bản"}
                  >
                    <i className="fa-solid fa-paper-plane" /> Xuất Bản Đa Kênh
                  </button>
                </>
              )}
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
