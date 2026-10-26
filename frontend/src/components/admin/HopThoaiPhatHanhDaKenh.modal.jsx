import React from 'react';

export default function OmnichannelModal({
  omnichannelModalOpen,
  setOmnichannelModalOpen,
  title,
  sapo,
  omniChannels,
  setOmniChannels,
  selectedFbAccId,
  setSelectedFbAccId,
  selectedZaloAccId,
  setSelectedZaloAccId,
  channelAccounts,
  publishResult,
  isPublishingNow,
  handleOmnichannelPublishNow
}) {
  if (!omnichannelModalOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(5px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: '#FFFFFF', borderRadius: '14px', width: '100%', maxWidth: '620px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ padding: '16px 22px', background: 'linear-gradient(135deg,#002855,#1E40AF)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px', fontWeight: '800' }}>
            <i className="fa-solid fa-satellite-dish" style={{ color: '#38BDF8' }} />
            <span>Xuất Bản Đa Kênh Tức Thì (Omnichannel Sync)</span>
          </div>
          <button type="button" onClick={() => setOmnichannelModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '20px', cursor: 'pointer', lineHeight: '1' }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '70vh', overflowY: 'auto' }}>
          {/* Article Preview Summary */}
          <div style={{ background: '#F8FAFC', padding: '12px 14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>BÀI VIẾT PHÁT HÀNH:</div>
            <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#0F172A', lineHeight: '1.4' }}>{title || 'Bản tin Công Đoàn TDMU'}</div>
            {sapo && <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px', fontStyle: 'italic', display: '-webkit-box', WebKitLineClamp: 2, WebKitBoxOrient: 'vertical', overflow: 'hidden' }}>{sapo}</div>}
          </div>

          {/* Channels Selector */}
          <div>
            <label style={{ fontSize: '12.5px', fontWeight: '800', color: '#002855', display: 'block', marginBottom: '8px' }}>
              CHỌN CÁC KÊNH PHÁT HÀNH ĐỒNG LOẠT:
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Website */}
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '10px 14px', borderRadius: '8px', border: `1.5px solid ${omniChannels.web ? '#0284C7' : '#E2E8F0'}`, background: omniChannels.web ? '#F0F9FF' : '#FFF', cursor: 'pointer' }}>
                <input type="checkbox" checked={omniChannels.web} onChange={e => setOmniChannels(p => ({ ...p, web: e.target.checked }))} style={{ marginTop: '3px', width: '16px', height: '16px' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#002855', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>🌐 Cổng Website Công Đoàn (Website Gốc)</span>
                    <span style={{ fontSize: '10px', background: '#DCFCE7', color: '#166534', padding: '1px 6px', borderRadius: '10px', fontWeight: '700' }}>MSSQL Live</span>
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>Cập nhật trạng thái 'Đã Xuất Bản' trong CSDL và hiển thị ra trang chủ tin tức.</div>
                </div>
              </label>

              {/* Facebook */}
              <div style={{ borderRadius: '8px', border: `1.5px solid ${omniChannels.fb ? '#1877F2' : '#E2E8F0'}`, background: omniChannels.fb ? '#EFF6FF' : '#FFF', padding: '10px 14px' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={omniChannels.fb} onChange={e => setOmniChannels(p => ({ ...p, fb: e.target.checked }))} style={{ marginTop: '3px', width: '16px', height: '16px' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#1877F2', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <i className="fa-brands fa-facebook" />
                      <span>Fanpage Facebook Công Đoàn TDMU</span>
                      <span style={{ fontSize: '10px', background: '#DBEAFE', color: '#1E40AF', padding: '1px 6px', borderRadius: '10px', fontWeight: '700' }}>Meta Graph API v20.0</span>
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>Tự động đăng kèm caption tối ưu, ảnh bìa và link bài viết.</div>
                  </div>
                </label>
                {omniChannels.fb && (
                  <div style={{ marginTop: '8px', paddingLeft: '28px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#1E40AF' }}>Tài khoản:</span>
                    <select
                      value={selectedFbAccId}
                      onChange={e => setSelectedFbAccId(e.target.value)}
                      style={{ flex: 1, padding: '4px 8px', borderRadius: '5px', border: '1px solid #93C5FD', fontSize: '11.5px', fontWeight: '600', color: '#1E293B', background: '#FFF' }}
                    >
                      {((channelAccounts || {}).facebook || []).map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.name} {acc.isDefault ? '(Mặc định)' : ''}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Zalo OA */}
              <div style={{ borderRadius: '8px', border: `1.5px solid ${omniChannels.zalo ? '#0068FF' : '#E2E8F0'}`, background: omniChannels.zalo ? '#F0F9FF' : '#FFF', padding: '10px 14px' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={omniChannels.zalo} onChange={e => setOmniChannels(p => ({ ...p, zalo: e.target.checked }))} style={{ marginTop: '3px', width: '16px', height: '16px' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#0068FF', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <i className="fa-solid fa-comment-dots" />
                      <span>Zalo Official Account (OA) TDMU</span>
                      <span style={{ fontSize: '10px', background: '#E0F2FE', color: '#0369A1', padding: '1px 6px', borderRadius: '10px', fontWeight: '700' }}>Open API v3.0</span>
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>Gửi bản tin thông báo trực tiếp đến cán bộ, đoàn viên theo dõi OA hoặc Tester.</div>
                  </div>
                </label>
                {omniChannels.zalo && (
                  <div style={{ marginTop: '8px', paddingLeft: '28px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#0369A1' }}>Tài khoản:</span>
                    <select
                      value={selectedZaloAccId}
                      onChange={e => setSelectedZaloAccId(e.target.value)}
                      style={{ flex: 1, padding: '4px 8px', borderRadius: '5px', border: '1px solid #7DD3FC', fontSize: '11.5px', fontWeight: '700', color: '#0F172A', background: '#FFF' }}
                    >
                      {((channelAccounts || {}).zalo || []).map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.name} {acc.groupName ? `(${acc.groupName})` : ''}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Execution Results View */}
          {publishResult && (
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px 14px' }}>
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#002855', marginBottom: '8px' }}>KẾT QUẢ ĐĂNG BÀI:</div>
              {publishResult.map((res, i) => (
                <div key={i} style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', color: res.status === 'success' ? '#166534' : '#DC2626', marginBottom: '4px' }}>
                  <i className={res.status === 'success' ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-xmark'} />
                  <strong>{res.channel.toUpperCase()}:</strong> {res.message}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 22px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button type="button" onClick={() => setOmnichannelModalOpen(false)} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: '12.5px', fontWeight: '700', cursor: 'pointer' }}>
            Đóng
          </button>
          <button
            type="button"
            onClick={handleOmnichannelPublishNow}
            disabled={isPublishingNow}
            style={{
              padding: '8px 20px',
              borderRadius: '6px',
              border: 'none',
              background: 'linear-gradient(135deg, #002855, #0284C7)',
              color: 'white',
              fontSize: '12.5px',
              fontWeight: '800',
              cursor: isPublishingNow ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {isPublishingNow ? <i className="fa-solid fa-spinner fa-spin" /> : <i className="fa-solid fa-paper-plane text-warning" />}
            {isPublishingNow ? 'Đang xuất bản...' : 'Xác Nhận Xuất Bản Đa Kênh'}
          </button>
        </div>
      </div>
    </div>
  );
}
