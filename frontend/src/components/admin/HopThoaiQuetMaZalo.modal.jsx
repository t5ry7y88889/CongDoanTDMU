import React from 'react';

export default function ZaloQrModal({
  zaloQrModalOpen,
  setZaloQrModalOpen,
  zaloQrImage,
  zaloQrMessage,
  zaloQrStatus,
  startBotQrLogin
}) {
  if (!zaloQrModalOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 15, 38, 0.75)', backdropFilter: 'blur(5px)', zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ background: '#FFFFFF', borderRadius: '16px', maxWidth: '450px', width: '100%', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', border: '2px solid #0068FF', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #002855, #0068FF)', padding: '16px 20px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="fa-solid fa-robot" style={{ fontSize: '20px', color: '#60A5FA' }} />
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800' }}>KẾT NỐI BOT ZALO TỰ ĐỘNG</h3>
              <div style={{ fontSize: '11px', color: '#BFDBFE' }}>Tự động bắn tin vào nhóm Zalo 100% ngầm</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setZaloQrModalOpen(false)}
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center' }}>
          {/* QR Code Container */}
          <div style={{ width: '260px', height: '260px', borderRadius: '12px', border: '2px dashed #93C5FD', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
            {zaloQrImage ? (
              <img src={zaloQrImage} alt="Zalo QR Code" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#0068FF' }}>
                <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '32px' }} />
                <span style={{ fontSize: '12px', fontWeight: '700' }}>Đang sinh mã QR kết nối...</span>
              </div>
            )}
          </div>

          {/* Status Message */}
          <div style={{ background: zaloQrStatus === 'success' ? '#ECFDF5' : (zaloQrStatus === 'scanned' ? '#FEF3C7' : '#EFF6FF'), border: `1px solid ${zaloQrStatus === 'success' ? '#A7F3D0' : (zaloQrStatus === 'scanned' ? '#FDE68A' : '#BFDBFE')}`, borderRadius: '8px', padding: '10px 14px', width: '100%', boxSizing: 'border-box' }}>
            <div style={{ fontSize: '12.5px', fontWeight: '800', color: zaloQrStatus === 'success' ? '#065F46' : (zaloQrStatus === 'scanned' ? '#92400E' : '#0369A1') }}>
              {zaloQrMessage || 'Vui lòng mở app Zalo trên điện thoại để quét mã'}
            </div>
          </div>

          {/* Instructions */}
          <div style={{ textAlign: 'left', width: '100%', background: '#F8FAFC', padding: '12px 14px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px', color: '#334155', lineHeight: '1.6' }}>
            <strong style={{ color: '#002855' }}>3 BƯỚC KÍCH HOẠT NHANH:</strong>
            <div style={{ marginTop: '4px' }}>1. Mở ứng dụng <strong>Zalo trên điện thoại</strong> (tài khoản đã tham gia nhóm Zalo).</div>
            <div>2. Chọn biểu tượng <strong>Quét mã QR</strong> ở góc trên bên phải Zalo.</div>
            <div>3. Quét mã QR này và chọn <strong>"Đăng nhập"</strong> trên điện thoại.</div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', background: '#F1F5F9', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            type="button"
            onClick={startBotQrLogin}
            style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#0284C7', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <i className="fa-solid fa-arrows-rotate" /> Tạo lại mã
          </button>
          <button
            type="button"
            onClick={() => setZaloQrModalOpen(false)}
            style={{ padding: '7px 18px', borderRadius: '6px', border: 'none', background: '#64748B', color: 'white', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
