import React from 'react';

export default function AiSettingsModal({
  settingsOpen,
  setSettingsOpen,
  geminiKey,
  setGeminiKey,
  groqKey,
  setGroqKey,
  saveAiSettings
}) {
  if (!settingsOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: '#FFFFFF', borderRadius: '12px', width: '100%', maxWidth: '520px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
        <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg,#002855,#001A38)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '800' }}>
            <i className="fa-solid fa-sliders" style={{ color: '#38BDF8' }} />
            <span>Cấu Hình API Key AI Vision &amp; Biên Tập Tin Bài</span>
          </div>
          <button type="button" onClick={() => setSettingsOpen(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '18px', cursor: 'pointer', lineHeight: '1' }}>✕</button>
        </div>
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ fontSize: '12px', color: '#475569', lineHeight: '1.5', background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '10px 12px', borderRadius: '8px' }}>
            💡 <strong>AI Vision tự động:</strong> Khi nạp ảnh, hệ thống sẽ sử dụng <strong>Google Gemini Flash</strong> hoặc <strong>Groq Llama 3.2 Vision</strong> để trực tiếp đọc chữ trên backdrop, băng rôn và nhận diện nhân vật, hoạt động để tự động đặt tiêu đề báo chí trung thực, không hardcode.
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#002855', marginBottom: '6px' }}>
              🔑 Google Gemini API Key (Khuyên Dùng cho Vision &amp; Viết Bài):
            </label>
            <input
              type="password"
              value={geminiKey}
              onChange={e => setGeminiKey(e.target.value)}
              placeholder="AIzaSy..."
              style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #CBD5E1', borderRadius: '6px', fontSize: '12.5px', outline: 'none', boxSizing: 'border-box' }}
            />
            <span style={{ fontSize: '10.5px', color: '#64748B', marginTop: '4px', display: 'block' }}>Hỗ trợ Gemini Flash với khả năng nhận diện hình ảnh hiện trường siêu sắc nét.</span>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#002855', marginBottom: '6px' }}>
              ⚡ Groq API Key (Dự phòng siêu tốc):
            </label>
            <input
              type="password"
              value={groqKey}
              onChange={e => setGroqKey(e.target.value)}
              placeholder="gsk_..."
              style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #CBD5E1', borderRadius: '6px', fontSize: '12.5px', outline: 'none', boxSizing: 'border-box' }}
            />
            <span style={{ fontSize: '10.5px', color: '#64748B', marginTop: '4px', display: 'block' }}>Tự động dùng Llama 3.2 11B Vision để đọc ảnh khi cần.</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
            <button type="button" onClick={() => setSettingsOpen(false)} style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#F8FAFC', color: '#475569', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>Hủy</button>
            <button type="button" onClick={() => saveAiSettings(geminiKey, groqKey)} style={{ padding: '8px 18px', borderRadius: '6px', border: 'none', background: 'linear-gradient(135deg,#002855,#2563EB)', color: 'white', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>💾 Lưu Cấu Hình</button>
          </div>
        </div>
      </div>
    </div>
  );
}
