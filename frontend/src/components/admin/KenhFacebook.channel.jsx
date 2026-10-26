import React, { useRef } from 'react';
import { FB_EMOJIS, FB_HASHTAGS } from './hangSoAdmin';

export default function FacebookChannel({
  title,
  activeArticleId,
  fbCaption,
  setFbCaption,
  fbSelectedPhotos,
  setFbSelectedPhotos,
  eventPhotos,
  attachedFiles,
  fbRatio,
  setFbRatio,
  selectedFbAccId,
  setSelectedFbAccId,
  channelAccounts,
  openEditAccountModal,
  openNewAccountModal,
  testChannelConnection,
  generateFbWithAi,
  syncFbFromWeb,
  insertArticleLinkToChannel,
  insertDocLinksToChannel,
  publishToFacebookDirect,
  isPublishingNow,
  showRollbackToast,
  activeDossier
}) {
  const fbFileInputRef = useRef(null);

  const insertFbHashtag = (tag) => {
    setFbCaption(prev => prev ? `${prev} ${tag}` : tag);
  };

  const insertFbEmoji = (em) => {
    setFbCaption(prev => prev ? `${prev}${em}` : em);
  };

  const handleFbPhotoUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (re) => {
        setFbSelectedPhotos(prev => [...prev, re.target.result]);
      };
      reader.readAsDataURL(file);
    });
    if (showRollbackToast) {
      showRollbackToast(`Đã thêm ${files.length} ảnh vào bài Facebook`);
    }
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 1. Account & Sender Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '320px' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#1877F2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '18px', flexShrink: 0 }}>
            <i className="fa-brands fa-facebook-f" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#1E40AF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Tài Khoản Gửi (Fanpage Facebook):
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', flexWrap: 'wrap' }}>
              <select
                value={selectedFbAccId}
                onChange={e => setSelectedFbAccId(e.target.value)}
                style={{ padding: '5px 8px', borderRadius: '6px', border: '1.5px solid #93C5FD', fontSize: '12px', fontWeight: '700', color: '#0F172A', background: '#FFF', outline: 'none', maxWidth: '240px' }}
              >
                {(channelAccounts.facebook || []).map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} {acc.isDefault ? '★ (Mặc định)' : ''} {acc.pageName ? `[${acc.pageName}]` : ''}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => openEditAccountModal('facebook', selectedFbAccId)}
                style={{ padding: '5px 9px', borderRadius: '6px', border: '1px solid #93C5FD', background: '#FFF', color: '#1D4ED8', fontSize: '11px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                title="Cấu hình Access Token, Page ID của tài khoản này"
              >
                ⚙️ Cài đặt Token
              </button>
              <button
                type="button"
                onClick={() => openNewAccountModal('facebook')}
                style={{ padding: '5px 9px', borderRadius: '6px', border: 'none', background: '#1877F2', color: 'white', fontSize: '11px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                title="Thêm tài khoản Fanpage Facebook mới"
              >
                + Thêm Fanpage
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0', borderRadius: '20px', fontSize: '11.5px', fontWeight: '700' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10B981' }} /> Meta Graph API Ready
          </span>
          <button
            type="button"
            onClick={() => testChannelConnection('facebook')}
            style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #BFDBFE', background: '#EFF6FF', color: '#1D4ED8', fontSize: '11.5px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            title="Kiểm tra kết nối tới Meta API với token của tài khoản đang chọn"
          >
            <i className="fa-solid fa-circle-check" /> Test Kết Nối
          </button>
        </div>
      </div>

      {/* 2. Main 2-Column Split: Left Composer, Right Realistic Feed Preview */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 390px', gap: '22px', alignItems: 'start' }}>
        {/* Left Column: Post Composer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Source Article Live Indicator */}
          <div style={{ padding: '8px 12px', background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
              <span style={{ background: '#0284C7', color: 'white', fontSize: '9px', fontWeight: '800', padding: '2px 6px', borderRadius: '4px' }}>BÀI BÁO GỐC</span>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#0369A1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {title || 'Chưa đặt tiêu đề bài báo'}
              </span>
            </div>
            <span style={{ fontSize: '11px', color: '#64748B', whiteSpace: 'nowrap' }}>
              🔗 {activeArticleId ? `ID: #${activeArticleId}` : 'Bản nháp Canvas'}
            </span>
          </div>

          {/* Sync + AI Tools Action Bar */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button type="button" onClick={generateFbWithAi} className="action-btn" style={{ background: 'linear-gradient(135deg, #1877F2, #0284C7)', color: 'white', fontWeight: '800', boxShadow: '0 2px 6px rgba(24,119,242,0.25)' }} title="AI tự động phân tích bài báo và viết caption Facebook chuẩn tương tác, tự đính kèm đầy đủ link bài và file">
              ⚡ AI Tối Ưu Caption
            </button>
            <button type="button" onClick={syncFbFromWeb} className="action-btn" style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', fontWeight: '700' }} title="Đồng bộ tức thì tiêu đề, sapo, link bài và danh sách file vào caption">
              🔄 Đồng Bộ Nhanh
            </button>
            <button type="button" onClick={() => insertArticleLinkToChannel('fb')} className="action-btn" style={{ background: '#FFF', color: '#0284C7', border: '1px solid #BAE6FD', fontWeight: '700', fontSize: '11.5px' }} title="Chèn nhanh link công khai của bài báo vào caption">
              🔗 Chèn Link Bài
            </button>
            <button type="button" onClick={() => insertDocLinksToChannel('fb')} className="action-btn" style={{ background: '#FFF', color: '#059669', border: '1px solid #A7F3D0', fontWeight: '700', fontSize: '11.5px' }} title="Chèn link tải toàn bộ tài liệu đính kèm vào caption">
              📎 Chèn Link File ({(attachedFiles || []).filter(f => f.type !== 'image').length})
            </button>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>Tỷ lệ:</span>
              {['1:1 Vuông','4:5 Dọc','16:9 Ngang'].map(r => (
                <button key={r} type="button" onClick={() => setFbRatio(r)} className="fbpill" style={{ background: fbRatio === r ? '#1877F2' : '#EFF6FF', color: fbRatio === r ? 'white' : '#1D4ED8', border: fbRatio === r ? 'none' : '1px solid #BFDBFE', padding: '3px 8px', fontSize: '11px' }}>{r}</button>
              ))}
            </div>
          </div>

          {/* Realistic Facebook Post Box */}
          <div style={{ background: '#FFFFFF', border: '1.5px solid #CBD5E1', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Post Creator Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(135deg, #002855, #1877F2)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '14px', flexShrink: 0, boxShadow: '0 2px 6px rgba(0,40,85,0.2)' }}>
                CĐ
              </div>
              <div>
                <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Công Đoàn Trường Đại học Thủ Dầu Một
                  <i className="fa-solid fa-circle-check" style={{ color: '#1877F2', fontSize: '13px' }} title="Fanpage đã xác minh" />
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#F1F5F9', padding: '1px 8px', borderRadius: '12px', fontSize: '11px', color: '#475569', fontWeight: '600', marginTop: '2px' }}>
                  <i className="fa-solid fa-earth-americas" style={{ fontSize: '10px' }} /> Công khai ▾
                </div>
              </div>
            </div>

            {/* Textarea */}
            <textarea
              value={fbCaption}
              onChange={e => setFbCaption(e.target.value)}
              placeholder="Bạn đang nghĩ gì? Hãy soạn caption Facebook hấp dẫn chuẩn tương tác mạng xã hội..."
              rows={9}
              style={{ width: '100%', padding: '12px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '13.5px', lineHeight: '1.65', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical', background: '#FBFCFE' }}
            />

            {/* Tools & Counters */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              {/* Hashtag chips */}
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '700' }}>Hashtag:</span>
                {FB_HASHTAGS.map(tag => (
                  <button key={tag} type="button" onClick={() => insertFbHashtag(tag)} className="fbpill" style={{ padding: '2px 8px', fontSize: '11px', background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>{tag}</button>
                ))}
              </div>
              <div style={{ fontSize: '11.5px', fontWeight: '700', color: fbCaption.length > 500 ? '#DC2626' : '#64748B' }}>
                {fbCaption.length} / 500 ký tự khuyến nghị
              </div>
            </div>

            {/* Emoji Tray */}
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', padding: '6px 10px', background: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '700', marginRight: '4px' }}>Emoji:</span>
              {FB_EMOJIS.map(em => (
                <button key={em} type="button" onClick={() => insertFbEmoji(em)} className="emoji-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '15px', padding: '2px 4px', borderRadius: '4px' }}>{em}</button>
              ))}
            </div>

            {/* Photo Upload & Management (Dễ nạp ảnh thực tế) */}
            <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#002855', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <i className="fa-solid fa-images" style={{ color: '#1877F2' }} />
                  ẢNH ĐÍNH KÈM BÀI ĐĂNG ({fbSelectedPhotos.length} ảnh):
                  {fbSelectedPhotos.length > 1 && (
                    <span style={{ background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', padding: '2px 8px', borderRadius: '4px', fontSize: '10.5px', fontWeight: '800' }}>
                      Đăng Album {fbSelectedPhotos.length} ảnh cùng lúc
                    </span>
                  )}
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    ref={fbFileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    style={{ display: 'none' }}
                    onChange={handleFbPhotoUpload}
                  />
                  <button
                    type="button"
                    onClick={() => fbFileInputRef.current?.click()}
                    style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #1877F2', background: '#EFF6FF', color: '#1877F2', fontSize: '11.5px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                    title="Tải thêm ảnh từ máy tính của bạn vào bài đăng Facebook"
                  >
                    <i className="fa-solid fa-cloud-arrow-up" /> + Tải ảnh từ máy tính
                  </button>
                  {(eventPhotos || []).length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const allUrls = eventPhotos.map(p => p.url);
                        setFbSelectedPhotos(prev => Array.from(new Set([...prev, ...allUrls])));
                        if (showRollbackToast) showRollbackToast(`Đã nạp ${allUrls.length} ảnh từ hồ sơ sự kiện`);
                      }}
                      style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #BAE6FD', background: '#FFF', color: '#0284C7', fontSize: '11.5px', fontWeight: '700', cursor: 'pointer' }}
                      title="Nạp toàn bộ ảnh sự kiện đã phân tích trong hồ sơ"
                    >
                      🖼️ Nạp ảnh hồ sơ ({eventPhotos.length})
                    </button>
                  )}
                  {fbSelectedPhotos.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setFbSelectedPhotos([])}
                      style={{ padding: '5px 8px', borderRadius: '6px', border: '1px solid #FECACA', background: '#FFF', color: '#DC2626', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                      title="Xóa toàn bộ ảnh đã chọn"
                    >
                      ✕ Xóa hết
                    </button>
                  )}
                </div>
              </div>

              {/* Selected Photos Thumbnails with Delete button */}
              {fbSelectedPhotos.length === 0 ? (
                <div
                  onClick={() => fbFileInputRef.current?.click()}
                  style={{ border: '2px dashed #CBD5E1', borderRadius: '8px', padding: '16px', textAlign: 'center', color: '#64748B', fontSize: '12px', cursor: 'pointer', background: '#F8FAFC' }}
                >
                  <i className="fa-solid fa-image" style={{ fontSize: '24px', color: '#94A3B8', marginBottom: '6px', display: 'block' }} />
                  Chưa có ảnh nào được chọn. Nhấn để <strong>tải ảnh từ máy tính</strong> hoặc kéo thả ảnh vào đây.
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', maxHeight: '160px', overflowY: 'auto', padding: '4px' }}>
                  {fbSelectedPhotos.map((url, idx) => (
                    <div key={idx} style={{ position: 'relative', width: '74px', height: '74px', borderRadius: '8px', overflow: 'hidden', border: '2px solid #1877F2', flexShrink: 0, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                      <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <span style={{ position: 'absolute', bottom: '2px', left: '2px', background: 'rgba(0,0,0,0.65)', color: 'white', borderRadius: '4px', padding: '0 4px', fontSize: '9px', fontWeight: '800' }}>
                        #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFbSelectedPhotos(prev => prev.filter((_, i) => i !== idx));
                        }}
                        style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(220,38,38,0.85)', color: 'white', border: 'none', borderRadius: '50%', width: '18px', height: '18px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: '900' }}
                        title="Gỡ ảnh này khỏi bài đăng"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Publish Action Button */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button 
              type="button"
              onClick={publishToFacebookDirect} 
              disabled={isPublishingNow}
              className="action-btn" 
              style={{ width: '100%', padding: '13px', background: 'linear-gradient(135deg, #1877F2, #0284C7)', color: 'white', fontSize: '14px', fontWeight: '800', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 3px 10px rgba(24,119,242,0.35)', cursor: isPublishingNow ? 'not-allowed' : 'pointer' }}
            >
              <i className="fa-brands fa-facebook" style={{ fontSize: '18px' }} />
              {isPublishingNow ? 'Đang kết nối Meta API và đăng album ảnh...' : `🚀 ĐĂNG NGAY LÊN FANPAGE FACEBOOK ${fbSelectedPhotos.length > 1 ? `(ALBUM ${fbSelectedPhotos.length} ẢNH)` : (fbSelectedPhotos.length === 1 ? '(1 ẢNH)' : '')}`}
            </button>
            <div style={{ fontSize: '11px', color: '#64748B', textAlign: 'center' }}>
              Bài viết và toàn bộ album {fbSelectedPhotos.length > 0 ? `${fbSelectedPhotos.length} ảnh` : ''} sẽ được xuất bản trực tiếp lên dòng thời gian của Fanpage đã chọn.
            </div>
          </div>
        </div>

        {/* Right Column: Realistic Facebook Feed Card Preview */}
        <div style={{ position: 'sticky', top: '10px' }}>
          <div style={{ fontSize: '12px', fontWeight: '800', color: '#002855', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <i className="fa-solid fa-mobile-screen" style={{ color: '#1877F2' }} /> XEM TRƯỚC TRÊN BẢNG TIN FACEBOOK:
          </div>

          <div style={{ background: '#FFFFFF', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', border: '1px solid #CBD5E1' }}>
            {/* Page Header */}
            <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #F1F5F9' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg,#002855,#1877F2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '13px', fontWeight: '800', flexShrink: 0 }}>
                CĐ
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#050505', display: 'flex', alignItems: 'center', gap: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  Công Đoàn TDMU
                  <i className="fa-solid fa-circle-check" style={{ color: '#1877F2', fontSize: '12px' }} />
                </div>
                <div style={{ fontSize: '11px', color: '#65676B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Trang · Vừa xong · <i className="fa-solid fa-earth-asia" style={{ fontSize: '10px' }} />
                </div>
              </div>
              <div style={{ color: '#65676B', fontSize: '16px', fontWeight: '800', cursor: 'pointer', padding: '0 4px' }}>•••</div>
            </div>

            {/* Caption with Highlighted Hashtags */}
            <div style={{ padding: '12px 14px', fontSize: '13.5px', lineHeight: '1.6', color: '#050505', whiteSpace: 'pre-wrap', maxHeight: '180px', overflowY: 'auto' }}>
              {fbCaption ? (
                fbCaption.split(/(#[a-zA-Z0-9_À-ỹ]+)/g).map((part, i) =>
                  part.startsWith('#') ? (
                    <span key={i} style={{ color: '#1877F2', fontWeight: '600' }}>{part}</span>
                  ) : (
                    part
                  )
                )
              ) : (
                <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>
                  Nội dung bài đăng sẽ hiển thị trực quan tại đây...
                </span>
              )}
            </div>

            {/* Authentic Multi-Photo Dynamic Facebook Layout */}
            {fbSelectedPhotos.length === 1 && (
              <div style={{ width: '100%', height: '220px', overflow: 'hidden', background: '#000' }}>
                <img src={fbSelectedPhotos[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
            {fbSelectedPhotos.length === 2 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px', height: '180px', background: '#000' }}>
                {fbSelectedPhotos.slice(0, 2).map((url, i) => (
                  <img key={i} src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ))}
              </div>
            )}
            {fbSelectedPhotos.length === 3 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '2px', height: '200px', background: '#000' }}>
                <img src={fbSelectedPhotos[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: '2px', height: '100%' }}>
                  <img src={fbSelectedPhotos[1]} alt="" style={{ width: '100%', height: '99px', objectFit: 'cover' }} />
                  <img src={fbSelectedPhotos[2]} alt="" style={{ width: '100%', height: '99px', objectFit: 'cover' }} />
                </div>
              </div>
            )}
            {fbSelectedPhotos.length >= 4 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px', height: '200px', background: '#000' }}>
                <img src={fbSelectedPhotos[0]} alt="" style={{ width: '100%', height: '99px', objectFit: 'cover' }} />
                <img src={fbSelectedPhotos[1]} alt="" style={{ width: '100%', height: '99px', objectFit: 'cover' }} />
                <img src={fbSelectedPhotos[2]} alt="" style={{ width: '100%', height: '99px', objectFit: 'cover' }} />
                <div style={{ position: 'relative', width: '100%', height: '99px' }}>
                  <img src={fbSelectedPhotos[3]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {fbSelectedPhotos.length > 4 && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '800' }}>
                      +{fbSelectedPhotos.length - 3}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Engagement Counters */}
            <div style={{ padding: '8px 14px', borderTop: '1px solid #F1F5F9', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: '#65676B' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '13px' }}>👍❤️</span>
                <span>{activeDossier?.likesCount || 0}</span>
              </div>
              <div>{activeDossier?.commentsCount || 0} bình luận · {activeDossier?.sharesCount || 0} chia sẻ</div>
            </div>

            {/* Interactive Action Bar */}
            <div style={{ padding: '6px 14px', display: 'flex', justifyContent: 'space-around', background: '#FFF' }}>
              {['👍 Thích','💬 Bình luận','↗️ Chia sẻ'].map(a => (
                <button key={a} type="button" style={{ background: 'none', border: 'none', padding: '6px 12px', fontSize: '13px', color: '#65676B', fontWeight: '700', cursor: 'pointer', borderRadius: '6px', transition: 'background 0.2s' }}>
                  {a}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
