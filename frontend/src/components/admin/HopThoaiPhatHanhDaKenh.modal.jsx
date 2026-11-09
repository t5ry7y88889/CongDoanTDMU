import React, { useState, useEffect } from 'react';

export default function HopThoaiPhatHanhDaKenh({
  isOpen,
  onClose,
  article,
  onPublishSuccess
}) {
  const [selectedChannels, setSelectedChannels] = useState({
    web: true,
    facebook: true,
    zalo: true
  });
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishResults, setPublishResults] = useState(null);
  const [showFbPreview, setShowFbPreview] = useState(false);
  const [showZaloPreview, setShowZaloPreview] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedChannels({ web: true, facebook: true, zalo: true });
      setIsPublishing(false);
      setPublishResults(null);
      setShowFbPreview(false);
      setShowZaloPreview(false);
    }
  }, [isOpen, article]);

  if (!isOpen || !article) return null;

  const toggleChannel = (channelKey) => {
    setSelectedChannels(prev => ({
      ...prev,
      [channelKey]: !prev[channelKey]
    }));
  };

  const selectedCount = Object.values(selectedChannels).filter(Boolean).length;

  const fbCaption = article.noi_dung_fb || article.NoiDungFB || article.fbCaption || `${article.title}\n\n${article.summary || article.sapo || ''}\n\n#CongDoanTDMU #TDMU`;
  const zaloText = article.noi_dung_zalo || article.NoiDungZalo || article.zaloText || `${article.title}\n\n${article.summary || article.sapo || ''}`;
  const imageUrl = article.image ? (article.image.startsWith('http') || article.image.startsWith('/') ? article.image : '/' + article.image) : '/images/banner.jpg';

  const handleExecutePublish = async () => {
    if (selectedCount === 0) {
      alert('Vui lòng chọn ít nhất 1 nền tảng để xuất bản!');
      return;
    }

    setIsPublishing(true);
    setPublishResults(null);

    const activeChannelList = [];
    if (selectedChannels.web) activeChannelList.push('web');
    if (selectedChannels.facebook) activeChannelList.push('facebook');
    if (selectedChannels.zalo) activeChannelList.push('zalo');

    try {
      const payload = {
        articleId: article.id,
        channels: activeChannelList,
        web: {
          title: article.title,
          summary: article.summary,
          content: article.content,
          image: imageUrl
        },
        facebook: {
          caption: fbCaption,
          articleTitle: article.title,
          imageUrl: imageUrl,
          imageUrls: [imageUrl].filter(Boolean)
        },
        zalo: {
          title: article.title,
          content: zaloText,
          imageUrl: imageUrl
        }
      };

      const res = await fetch('/api/publish/now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(r => r.json());

      if (res.success) {
        setPublishResults(res.data?.results || res.data || {});
        if (onPublishSuccess) {
          onPublishSuccess(res.data);
        }
      } else {
        alert('Lỗi xuất bản: ' + (res.error || res.message || 'Thao tác thất bại'));
      }
    } catch (err) {
      alert('Lỗi kết nối khi phát hành đa kênh: ' + err.message);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        boxSizing: 'border-box'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '680px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          border: '1px solid #CBD5E1',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ─── 1. HEADER ─── */}
        <div style={{
          padding: '16px 24px',
          background: 'linear-gradient(135deg, #002855 0%, #1E40AF 100%)',
          color: '#FFF',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px'
            }}>
              🚀
            </div>
            <div>
              <div style={{ fontSize: '15.5px', fontWeight: '800', letterSpacing: '0.3px' }}>
                Lựa Chọn Nền Tảng Xuất Bản Tin Bài
              </div>
              <div style={{ fontSize: '11.5px', color: '#93C5FD' }}>
                Công Đoàn Trường Đại học Thủ Dầu Một · Mã bài: #TDMU-{String(article.id).padStart(3, '0')}
              </div>
            </div>
          </div>
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
            title="Đóng cửa sổ"
          >
            ✕
          </button>
        </div>

        {/* ─── 2. BODY CONTENT ─── */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Khối tóm tắt bài viết */}
          <div style={{
            background: '#F8FAFC',
            padding: '12px 16px',
            borderRadius: '10px',
            border: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            gap: '14px'
          }}>
            <img
              src={imageUrl}
              alt=""
              style={{ width: '64px', height: '64px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0, border: '1px solid #CBD5E1' }}
              onError={(e) => { e.target.src = '/images/banner.jpg'; }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#0284C7', marginBottom: '2px' }}>
                {article.categoryName || 'Tin tức Công đoàn'} · Tác giả: {article.author || 'Cán bộ'}
              </div>
              <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {article.title}
              </div>
              <div style={{ fontSize: '11.5px', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                {article.summary || 'Tóm tắt bài viết đã sẵn sàng phát hành đa kênh.'}
              </div>
            </div>
          </div>

          {/* Danh sách lựa chọn nền tảng */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#002855' }}>
                CHỌN CÁC NỀN TẢNG BẠN MUỐN PHÁT HÀNH:
              </div>
              <div style={{ fontSize: '11.5px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedChannels({ web: true, facebook: true, zalo: true })}
                  style={{ background: 'none', border: 'none', color: '#0284C7', fontWeight: '700', cursor: 'pointer', padding: '0 4px' }}
                >
                  Chọn tất cả
                </button>
                <span style={{ color: '#CBD5E1' }}>|</span>
                <button
                  type="button"
                  onClick={() => setSelectedChannels({ web: false, facebook: false, zalo: false })}
                  style={{ background: 'none', border: 'none', color: '#64748B', fontWeight: '700', cursor: 'pointer', padding: '0 4px' }}
                >
                  Bỏ chọn
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

              {/* NỀN TẢNG 1: WEBSITE CÔNG ĐOÀN */}
              <div
                onClick={() => toggleChannel('web')}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: `2px solid ${selectedChannels.web ? '#0284C7' : '#E2E8F0'}`,
                  background: selectedChannels.web ? '#F0F9FF' : '#FFFFFF',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedChannels.web}
                  onChange={() => {}}
                  style={{ width: '18px', height: '18px', marginTop: '2px', cursor: 'pointer' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontWeight: '800', fontSize: '13.5px', color: '#002855', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <i className="fa-solid fa-globe text-primary" /> Cổng Thông Tin Điện Tử (Website Gốc TDMU)
                    </div>
                    <span style={{ fontSize: '10px', background: '#DCFCE7', color: '#15803D', padding: '2px 8px', borderRadius: '10px', fontWeight: '700' }}>
                      Chính thức
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '3px', lineHeight: '1.4' }}>
                    Cập nhật trạng thái bài viết sang <strong>"Đã Xuất Bản"</strong> trong cơ sở dữ liệu MSSQL và hiển thị ngay trên trang chủ tin tức Cổng thông tin.
                  </div>
                </div>
              </div>

              {/* NỀN TẢNG 2: FACEBOOK FANPAGE */}
              <div
                style={{
                  borderRadius: '10px',
                  border: `2px solid ${selectedChannels.facebook ? '#1877F2' : '#E2E8F0'}`,
                  background: selectedChannels.facebook ? '#EFF6FF' : '#FFFFFF',
                  padding: '12px 16px',
                  transition: 'all 0.15s ease'
                }}
              >
                <div
                  onClick={() => toggleChannel('facebook')}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}
                >
                  <input
                    type="checkbox"
                    checked={selectedChannels.facebook}
                    onChange={() => {}}
                    style={{ width: '18px', height: '18px', marginTop: '2px', cursor: 'pointer' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontWeight: '800', fontSize: '13.5px', color: '#1877F2', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <i className="fa-brands fa-facebook" style={{ fontSize: '16px' }} /> Trang Fanpage Facebook Công Đoàn TDMU
                      </div>
                      <span style={{ fontSize: '10px', background: '#DBEAFE', color: '#1D4ED8', padding: '2px 8px', borderRadius: '10px', fontWeight: '700' }}>
                        Meta Graph API
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748B', marginTop: '3px', lineHeight: '1.4' }}>
                      Xuất bản bài viết trực tiếp lên dòng thời gian của Fanpage kèm album ảnh và caption tối ưu hóa tương tác.
                    </div>
                  </div>
                </div>

                {/* Nút xem trước caption Facebook */}
                {selectedChannels.facebook && (
                  <div style={{ marginTop: '8px', paddingLeft: '30px' }}>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setShowFbPreview(!showFbPreview); }}
                      style={{ background: 'none', border: 'none', color: '#1D4ED8', fontSize: '11.5px', fontWeight: '700', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <i className={`fa-solid fa-chevron-${showFbPreview ? 'up' : 'down'}`} />
                      {showFbPreview ? 'Thu gọn nội dung Facebook' : 'Xem nội dung bản tin Facebook sẽ đăng'}
                    </button>
                    {showFbPreview && (
                      <div style={{ background: '#FFF', border: '1px solid #BFDBFE', borderRadius: '6px', padding: '10px', marginTop: '6px', fontSize: '12px', color: '#1E293B', whiteSpace: 'pre-wrap', maxHeight: '120px', overflowY: 'auto' }}>
                        {fbCaption}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* NỀN TẢNG 3: ZALO OA & NHÓM ZALO */}
              <div
                style={{
                  borderRadius: '10px',
                  border: `2px solid ${selectedChannels.zalo ? '#0068FF' : '#E2E8F0'}`,
                  background: selectedChannels.zalo ? '#F0F9FF' : '#FFFFFF',
                  padding: '12px 16px',
                  transition: 'all 0.15s ease'
                }}
              >
                <div
                  onClick={() => toggleChannel('zalo')}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}
                >
                  <input
                    type="checkbox"
                    checked={selectedChannels.zalo}
                    onChange={() => {}}
                    style={{ width: '18px', height: '18px', marginTop: '2px', cursor: 'pointer' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontWeight: '800', fontSize: '13.5px', color: '#0068FF', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <i className="fa-solid fa-robot" style={{ fontSize: '16px' }} /> Bot Zalo Tự Động Vào Nhóm Công Đoàn
                      </div>
                      <span style={{ fontSize: '10px', background: '#DCFCE7', color: '#15803D', padding: '2px 8px', borderRadius: '10px', fontWeight: '800' }}>
                        Bot Tự Động (zca-js)
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748B', marginTop: '3px', lineHeight: '1.4' }}>
                      Sử dụng Bot Zalo Công Đoàn (phiên đăng nhập ngầm) để tự động gửi bản tin trực tiếp vào Nhóm Zalo Công Đoàn TDMU.
                    </div>
                  </div>
                </div>

                {/* Nút xem trước & Tùy chọn chia sẻ Zalo 1-chạm */}
                {selectedChannels.zalo && (
                  <div style={{ marginTop: '8px', paddingLeft: '30px' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setShowZaloPreview(!showZaloPreview); }}
                        style={{ background: 'none', border: 'none', color: '#0369A1', fontSize: '11.5px', fontWeight: '700', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <i className={`fa-solid fa-chevron-${showZaloPreview ? 'up' : 'down'}`} />
                        {showZaloPreview ? 'Thu gọn nội dung Zalo' : 'Xem nội dung tin nhắn Zalo sẽ gửi'}
                      </button>
                      <span style={{ color: '#CBD5E1' }}>|</span>
                      <a
                        href={`https://zalo.me/share?url=${encodeURIComponent(typeof window !== 'undefined' ? (window.location.origin + '/bai-viet.html?id=' + article.id) : '')}&title=${encodeURIComponent(article.title || '')}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard?.writeText(`${article.title}\n\n${zaloText}`);
                        }}
                        style={{
                          color: '#0068FF',
                          fontSize: '11.5px',
                          fontWeight: '700',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: '#EFF6FF',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          border: '1px solid #BFDBFE'
                        }}
                        title="Chia sẻ 1-chạm: Mở thẳng Zalo chia sẻ cho nhóm hoặc cá nhân (Không cần Bot)"
                      >
                        <i className="fa-solid fa-share-nodes" /> Chia sẻ Zalo 1-chạm (Không cần Bot)
                      </a>
                    </div>
                    {showZaloPreview && (
                      <div style={{ background: '#FFF', border: '1px solid #BAE6FD', borderRadius: '6px', padding: '10px', marginTop: '6px', fontSize: '12px', color: '#1E293B', whiteSpace: 'pre-wrap', maxHeight: '120px', overflowY: 'auto' }}>
                        {zaloText}
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* KẾT QUẢ XUẤT BẢN SAU KHI GỬI */}
          {publishResults && (
            <div style={{
              background: '#F0FDF4',
              border: '1.5px solid #86EFAC',
              borderRadius: '10px',
              padding: '14px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#166534', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <i className="fa-solid fa-circle-check fs-5" /> KẾT QUẢ XUẤT BẢN CHI TIẾT:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12.5px' }}>
                {publishResults.web && (
                  <div style={{ color: publishResults.web.success ? '#15803D' : '#DC2626', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className={publishResults.web.success ? "fa-solid fa-check" : "fa-solid fa-xmark"} />
                    <strong>Cổng Website:</strong> {publishResults.web.success ? 'Đã cập nhật trạng thái xuất bản thành công!' : publishResults.web.error}
                  </div>
                )}
                {publishResults.facebook && (
                  <div style={{ color: publishResults.facebook.success ? '#15803D' : '#DC2626', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className={publishResults.facebook.success ? "fa-solid fa-check" : "fa-solid fa-xmark"} />
                    <strong>Facebook Fanpage:</strong> {publishResults.facebook.success ? (publishResults.facebook.message || 'Đã xuất bản bài viết lên Fanpage!') : publishResults.facebook.error}
                  </div>
                )}
                {publishResults.zalo && (
                  <div style={{ color: publishResults.zalo.success ? '#15803D' : '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <i className={publishResults.zalo.success ? "fa-solid fa-check" : "fa-solid fa-xmark"} />
                      <strong>Zalo:</strong> {publishResults.zalo.success ? (publishResults.zalo.message || 'Đã gửi bản tin thành công!') : publishResults.zalo.error}
                    </div>
                    <a
                      href={`https://zalo.me/share?url=${encodeURIComponent(typeof window !== 'undefined' ? (window.location.origin + '/bai-viet.html?id=' + article.id) : '')}&title=${encodeURIComponent(article.title || '')}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        fontSize: '11px',
                        background: '#0068FF',
                        color: '#FFF',
                        padding: '3px 10px',
                        borderRadius: '4px',
                        fontWeight: '700',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <i className="fa-solid fa-share-nodes" /> Mở Zalo Chia Sẻ ↗
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* ─── 3. FOOTER ACTIONS ─── */}
        <div style={{
          padding: '14px 24px',
          background: '#F8FAFC',
          borderTop: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0
        }}>
          <div style={{ fontSize: '12px', color: '#64748B' }}>
            {publishResults ? '🎉 Đã hoàn thành quy trình phát hành!' : `Đã chọn: ${selectedCount} nền tảng phát hành`}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 18px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                background: '#FFF',
                color: '#475569',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              {publishResults ? 'Đóng' : 'Hủy bỏ'}
            </button>
            {!publishResults ? (
              <button
                type="button"
                onClick={handleExecutePublish}
                disabled={isPublishing || selectedCount === 0}
                style={{
                  padding: '9px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  background: (isPublishing || selectedCount === 0) ? '#94A3B8' : 'linear-gradient(135deg, #002855 0%, #2563EB 100%)',
                  color: '#FFF',
                  fontSize: '13px',
                  fontWeight: '800',
                  cursor: (isPublishing || selectedCount === 0) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: (isPublishing || selectedCount === 0) ? 'none' : '0 3px 12px rgba(37,99,235,0.3)'
                }}
              >
                {isPublishing ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin" /> Đang phát hành...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-paper-plane" /> Xác Nhận Xuất Bản ({selectedCount})
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '9px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#16A34A',
                  color: '#FFF',
                  fontSize: '13px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <i className="fa-solid fa-check" /> Hoàn Tất
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
