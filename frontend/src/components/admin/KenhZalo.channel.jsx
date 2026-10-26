import React, { useRef } from 'react';
import { ZALO_TEMPLATES } from './hangSoAdmin';

export default function ZaloChannel({
  title,
  activeArticleId,
  zaloText,
  setZaloText,
  zaloPhoto,
  setZaloPhoto,
  senderPhoneInput,
  setSenderPhoneInput,
  recipientPhoneInput,
  setRecipientPhoneInput,
  zaloTargetMode,
  setZaloTargetMode,
  zaloGroupLink,
  setZaloGroupLink,
  zaloGroupName,
  setZaloGroupName,
  zaloBotStatus,
  openZaloQrModal,
  logoutZaloBot,
  startBotQrLogin,
  generateZaloWithAi,
  syncZaloFromWeb,
  insertArticleLinkToChannel,
  insertDocLinksToChannel,
  sendZaloMessageDirect,
  isPublishingNow,
  showRollbackToast,
  attachedFiles,
  eventPhotos
}) {
  const zaloFileInputRef = useRef(null);

  const applyTemplate = (tpl) => {
    setZaloText(tpl.text);
    if (showRollbackToast) showRollbackToast(`Đã áp dụng mẫu tin: "${tpl.label}"`);
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (re) => {
      setZaloPhoto(re.target.result);
      if (showRollbackToast) showRollbackToast('Đã nạp ảnh đính kèm cho tin Zalo');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Target Channel Banner: Focus 100% on Trade Union Group & Official Account */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FFFFFF', padding: '12px 18px', borderRadius: '12px', border: '1.5px solid #BAE6FD', boxShadow: '0 2px 6px rgba(0,0,0,0.03)', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, #002855, #0068FF)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
            <i className="fa-solid fa-users" />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '800', color: '#002855' }}>
              KÊNH PHÁT HÀNH: NHÓM ZALO CÔNG ĐOÀN TDMU
            </div>
            <div style={{ fontSize: '11px', color: '#64748B' }}>
              Ban Truyền Thông Công Đoàn Cơ Sở Trường Đại Học Thủ Dầu Một
            </div>
          </div>
        </div>

        {/* Bot Connection Quick Status Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {zaloBotStatus.isConnected ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '5px 12px', borderRadius: '20px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
              <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#065F46' }}>
                Bot Tự Động: <strong>{zaloBotStatus.botInfo?.name || 'Đã kết nối'}</strong>
              </span>
              <button
                type="button"
                onClick={logoutZaloBot}
                style={{ background: 'none', border: 'none', color: '#DC2626', fontSize: '11px', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                title="Đăng xuất bot"
              >
                [Ngắt]
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: '#D97706', fontWeight: '700', background: '#FEF3C7', padding: '4px 8px', borderRadius: '6px', border: '1px solid #FDE68A' }}>
                ⚠️ Bot ngầm chưa kích hoạt
              </span>
              <button
                type="button"
                onClick={startBotQrLogin}
                style={{ padding: '6px 12px', background: 'linear-gradient(135deg, #0068FF, #0284C7)', color: 'white', border: 'none', borderRadius: '6px', fontSize: '11.5px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', boxShadow: '0 2px 6px rgba(0,104,255,0.25)' }}
                title="Quét mã QR để kích hoạt bot tự động bắn tin vào nhóm"
              >
                <i className="fa-solid fa-qrcode" /> 📲 Quét QR Kết Nối Bot Zalo
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Trade Union Group Target Configuration */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', background: 'linear-gradient(135deg, #EFF6FF, #F8FAFC)', borderRadius: '12px', border: '1.5px solid #93C5FD', boxShadow: '0 2px 6px rgba(0,0,0,0.04)', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '320px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#0068FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '18px', flexShrink: 0 }}>
            <i className="fa-solid fa-users-rectangle" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#0369A1', textTransform: 'uppercase' }}>
                LINK / ID NHÓM ZALO CÔNG ĐOÀN TIẾP NHẬN BÀI ĐĂNG:
              </span>
              <span style={{ fontSize: '11px', color: '#0068FF', fontWeight: '800' }}>
                Đích đến: Nhóm Công Đoàn TDMU
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <input
                type="text"
                value={zaloGroupLink || 'https://zalo.me/g/wdhpzaoap7wkxb074exv'}
                onChange={e => setZaloGroupLink(e.target.value)}
                placeholder="Dán link nhóm Zalo (VD: https://zalo.me/g/wdhpzaoap7wkxb074exv)"
                style={{ flex: 1, padding: '7px 10px', borderRadius: '6px', border: '1.5px solid #60A5FA', fontSize: '13px', fontWeight: '700', color: '#002855', outline: 'none' }}
              />
              <button
                type="button"
                onClick={() => {
                  if (showRollbackToast) showRollbackToast('💾 Đã lưu link nhóm Zalo đích!');
                }}
                style={{ padding: '7px 12px', borderRadius: '6px', border: 'none', background: '#0068FF', color: 'white', fontSize: '11.5px', fontWeight: '800', cursor: 'pointer' }}
              >
                💾 Lưu Link
              </button>
              <button
                type="button"
                onClick={() => window.open(zaloGroupLink || 'https://zalo.me/g/wdhpzaoap7wkxb074exv', '_blank')}
                style={{ padding: '7px 10px', borderRadius: '6px', border: '1px solid #BAE6FD', background: '#FFFFFF', color: '#0369A1', fontSize: '11.5px', fontWeight: '700', cursor: 'pointer' }}
                title="Mở nhóm trên Zalo"
              >
                🌐 Mở Nhóm
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main 2-Column Split: Left Composer, Right Realistic Zalo Smartphone Preview */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 390px', gap: '22px', alignItems: 'start' }}>
        {/* Left Column: Zalo Message Composer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Source Article Live Indicator */}
          <div style={{ padding: '8px 12px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
              <span style={{ background: '#0068FF', color: 'white', fontSize: '9px', fontWeight: '800', padding: '2px 6px', borderRadius: '4px' }}>BÀI BÁO GỐC</span>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#1E40AF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {title || 'Chưa đặt tiêu đề bài báo'}
              </span>
            </div>
            <span style={{ fontSize: '11px', color: '#64748B', whiteSpace: 'nowrap' }}>
              🔗 {activeArticleId ? `ID: #${activeArticleId}` : 'Bản nháp Canvas'}
            </span>
          </div>

          {/* Sync + Link Tools Action Bar */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button type="button" onClick={generateZaloWithAi} className="action-btn" style={{ background: 'linear-gradient(135deg, #0068FF, #0284C7)', color: 'white', fontWeight: '800', boxShadow: '0 2px 6px rgba(0,104,255,0.25)' }} title="AI tự động tóm tắt thành bản tin ngắn gọn, dễ đọc, đính kèm link bài">
              ⚡ AI Tối Ưu Tin Zalo
            </button>
            <button type="button" onClick={syncZaloFromWeb} className="action-btn" style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', fontWeight: '700' }} title="Đồng bộ tức thì tiêu đề, tóm tắt và link bài vào khung soạn thảo">
              🔄 Đồng Bộ Nhanh
            </button>
            <button type="button" onClick={() => insertArticleLinkToChannel('zalo')} className="action-btn" style={{ background: '#FFF', color: '#0068FF', border: '1px solid #BAE6FD', fontWeight: '700', fontSize: '11.5px' }} title="Chèn nhanh link công khai của bài báo vào nội dung">
              🔗 Chèn Link Bài
            </button>
            <button type="button" onClick={() => insertDocLinksToChannel('zalo')} className="action-btn" style={{ background: '#FFF', color: '#059669', border: '1px solid #A7F3D0', fontWeight: '700', fontSize: '11.5px' }} title="Chèn link tải toàn bộ tài liệu đính kèm vào tin Zalo">
              📎 Chèn Link File ({(attachedFiles || []).filter(f => f.type !== 'image').length})
            </button>
          </div>

          {/* Quick templates pills */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '700' }}>Mẫu nhanh:</span>
            {ZALO_TEMPLATES.map(tpl => (
              <button key={tpl.label} type="button" onClick={() => applyTemplate(tpl)} className="fbpill" style={{ padding: '3px 9px', fontSize: '11px', background: '#F0F9FF', color: '#0369A1', border: '1px solid #BAE6FD' }}>
                {tpl.label}
              </button>
            ))}
          </div>

          {/* Zalo Message Composer Box */}
          <div style={{ background: '#FFFFFF', border: '1.5px solid #CBD5E1', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#002855', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <i className="fa-solid fa-message" style={{ color: '#0068FF' }} />
                NỘI DUNG TIN NHẮN ZALO
              </div>
              <div style={{ fontSize: '11.5px', fontWeight: '700', color: zaloText.length > 1000 ? '#DC2626' : '#64748B' }}>
                {zaloText.length} ký tự
              </div>
            </div>

            <textarea
              value={zaloText}
              onChange={e => setZaloText(e.target.value)}
              placeholder="Nhập nội dung tin nhắn gửi vào nhóm Zalo hoặc cá nhân đoàn viên..."
              rows={8}
              style={{ width: '100%', padding: '12px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '13.5px', lineHeight: '1.65', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical', background: '#FBFCFE' }}
            />

            {/* Photo Attachment */}
            <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#475569' }}>
                  Ảnh kèm theo tin nhắn (Banner / Thư mời / Infographic):
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    ref={zaloFileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handlePhotoUpload}
                  />
                  <button
                    type="button"
                    onClick={() => zaloFileInputRef.current?.click()}
                    style={{ padding: '3px 8px', borderRadius: '4px', border: '1px solid #0068FF', background: '#EFF6FF', color: '#0068FF', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                  >
                    + Tải ảnh mới
                  </button>
                  {zaloPhoto && (
                    <button
                      type="button"
                      onClick={() => setZaloPhoto('')}
                      style={{ padding: '3px 8px', borderRadius: '4px', border: '1px solid #FECACA', background: '#FFF', color: '#DC2626', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                    >
                      ✕ Gỡ ảnh
                    </button>
                  )}
                </div>
              </div>

              {/* Image Preview Banner */}
              {(zaloPhoto || ((eventPhotos || []).length > 0 && eventPhotos[0].url)) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#F8FAFC', padding: '8px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <img
                    src={zaloPhoto || eventPhotos[0]?.url}
                    alt=""
                    style={{ width: '60px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
                  />
                  <div style={{ flex: 1, minWidth: 0, fontSize: '11.5px', color: '#334155' }}>
                    <strong>{zaloPhoto ? 'Ảnh tự tải lên' : 'Ảnh tiêu điểm từ hồ sơ'}</strong>
                    <div style={{ fontSize: '10.5px', color: '#64748B' }}>Sẽ được đính kèm vào tin nhắn</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Direct Action Buttons - ONE PRIMARY ACTION */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              type="button"
              onClick={sendZaloMessageDirect}
              disabled={isPublishingNow}
              className="action-btn"
              style={{
                width: '100%',
                padding: '13px',
                background: 'linear-gradient(135deg, #0068FF, #0284C7)',
                color: 'white',
                fontSize: '14px',
                fontWeight: '800',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 3px 10px rgba(0,104,255,0.35)',
                cursor: isPublishingNow ? 'not-allowed' : 'pointer'
              }}
            >
              <i className="fa-solid fa-users-viewfinder" style={{ fontSize: '17px' }} />
              {isPublishingNow ? 'Đang gửi tin Zalo...' : '🚀 ĐĂNG BẢN TIN VÀO NHÓM ZALO CÔNG ĐOÀN'}
            </button>
            <div style={{ fontSize: '11px', color: '#64748B', textAlign: 'center' }}>
              Bản tin sẽ được Bot Công Đoàn tự động phát hành tới các Cán bộ, Giảng viên trong Nhóm Zalo Công Đoàn đã chọn.
            </div>
          </div>
        </div>

        {/* Right Column: Realistic Zalo Smartphone Preview (Công Đoàn Review Box) */}
        <div style={{ position: 'sticky', top: '10px' }}>
          <div style={{ fontSize: '12px', fontWeight: '800', color: '#002855', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <i className="fa-solid fa-mobile-screen" style={{ color: '#0068FF' }} /> XEM TRƯỚC TIN NHẮN CÔNG ĐOÀN (ZALO):
          </div>

          <div style={{ background: '#E5EBF5', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', border: '2px solid #CBD5E1' }}>
            {/* Phone Top Bar */}
            <div style={{ background: '#0068FF', padding: '6px 14px 2px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white', fontSize: '11px', fontWeight: '700' }}>
              <span>09:41</span>
              <div style={{ display: 'flex', gap: '6px', fontSize: '10px' }}>
                <i className="fa-solid fa-signal" />
                <i className="fa-solid fa-wifi" />
                <i className="fa-solid fa-battery-full" />
              </div>
            </div>

            {/* Zalo Công Đoàn Chat Header */}
            <div style={{ background: '#0068FF', padding: '8px 12px 10px', display: 'flex', alignItems: 'center', gap: '10px', color: 'white' }}>
              <span style={{ fontSize: '16px', fontWeight: '900', cursor: 'pointer' }}>‹</span>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#FFFFFF', color: '#002855', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: '900', flexShrink: 0, overflow: 'hidden', border: '1.5px solid #FCD34D', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }}>
                <img src="/images/logo_cong_doan.png" alt="Công đoàn" style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13.5px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '5px', letterSpacing: '-0.2px' }}>
                  Công Đoàn Trường ĐH Thủ Dầu Một
                  <span style={{ background: '#38BDF8', color: '#002855', fontSize: '9px', fontWeight: '900', padding: '1px 5px', borderRadius: '10px' }}>✓ OA</span>
                </div>
                <div style={{ fontSize: '10px', opacity: 0.95, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ADE80', display: 'inline-block' }}></span>
                  Đang hoạt động • Kênh Tin Tức &amp; Chăm Lo Đoàn Viên
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', fontSize: '14px', opacity: 0.9 }}>
                <i className="fa-solid fa-phone" title="Gọi thoại" />
                <i className="fa-solid fa-video" title="Gọi video" />
                <i className="fa-solid fa-bars" title="Tuỳ chọn" />
              </div>
            </div>

            {/* Chat Messages Canvas */}
            <div style={{ padding: '14px 12px', minHeight: '280px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Date Pill */}
              <div style={{ alignSelf: 'center', background: '#D1D5DB', color: '#374151', padding: '2px 10px', borderRadius: '10px', fontSize: '10px', fontWeight: '700' }}>
                HÔM NAY
              </div>

              {/* Speech Bubble */}
              <div style={{ background: '#FFFFFF', borderRadius: '14px 14px 14px 2px', padding: '12px', boxShadow: '0 2px 6px rgba(0,0,0,0.08)', maxWidth: '92%', border: '1px solid #E2E8F0' }}>
                {/* Attached Banner Image */}
                {(zaloPhoto || ((eventPhotos || []).length > 0 && eventPhotos[0].url)) && (
                  <div style={{ width: '100%', height: '140px', borderRadius: '8px', overflow: 'hidden', marginBottom: '10px', background: '#000' }}>
                    <img src={zaloPhoto || eventPhotos[0]?.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}

                {/* Message Header */}
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#0068FF', textTransform: 'uppercase', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <i className="fa-solid fa-bullhorn" /> CÔNG ĐOÀN TDMU THÔNG BÁO
                </div>
                <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#002855', marginBottom: '6px' }}>
                  {title || 'THÔNG BÁO HOẠT ĐỘNG CÔNG ĐOÀN'}
                </div>

                {/* Message Body */}
                <div style={{ fontSize: '12.5px', lineHeight: '1.6', color: '#1E293B', whiteSpace: 'pre-wrap', maxHeight: '200px', overflowY: 'auto' }}>
                  {zaloText || <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>Nội dung tin nhắn sẽ hiển thị trực quan tại đây...</span>}
                </div>

                {/* Action CTA Button inside Zalo Bubble */}
                <div style={{ marginTop: '10px', padding: '8px 10px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '6px', textAlign: 'center', fontSize: '12px', fontWeight: '700', color: '#0068FF', cursor: 'pointer' }}>
                  👉 Xem toàn văn bài viết trên Web ➔
                </div>

                {/* Message Timestamp & Double Tick */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', fontSize: '10px', color: '#94A3B8', marginTop: '6px' }}>
                  <span>Vừa xong</span>
                  <span style={{ color: '#0068FF', fontWeight: '900' }}>✓✓</span>
                </div>
              </div>
            </div>

            {/* Footer Tip Card */}
            <div style={{ background: '#F8FAFC', padding: '8px 12px', borderTop: '1px solid #CBD5E1', fontSize: '11px', color: '#475569' }}>
              📱 <strong>Kênh phát hành:</strong> <strong>Công Đoàn Trường ĐH Thủ Dầu Một</strong> ➔ Gửi tới: <strong>Toàn thể Đoàn viên &amp; Cán bộ GV</strong>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
