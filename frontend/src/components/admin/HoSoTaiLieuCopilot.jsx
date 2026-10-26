import React, { useRef } from 'react';

export default function CopilotDossier({
  attachedFiles,
  eventPhotos,
  processFiles,
  removeAttachedFile,
  clearAllAttachments,
  updatePhotoCaption,
  insertPhoto,
  triggerAiVision,
  setFeaturedPhoto,
  removePhoto
}) {
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  return (
    <div style={{ background: '#FFF', border: '1px solid #BAE6FD', borderRadius: '8px', padding: '10px 12px', boxShadow: '0 2px 8px rgba(2,132,199,0.08)', marginBottom: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '1px solid #E0F2FE', paddingBottom: '6px' }}>
        <div style={{ fontSize: '11.5px', fontWeight: '800', color: '#0369A1', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <i className="fa-solid fa-folder-open" style={{ color: '#0284C7' }} />
          <span>Hồ Sơ Tư Liệu ({(attachedFiles || []).length} tệp • {(eventPhotos || []).length} ảnh)</span>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            style={{ display: 'none' }}
            onChange={e => processFiles(e.target.files)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', borderRadius: '4px', padding: '3px 8px', fontSize: '10.5px', fontWeight: '700', cursor: 'pointer' }}
            title="Thêm tệp Word, PDF, Excel hoặc ảnh"
          >
            + Nạp tệp
          </button>
          {(attachedFiles || []).length > 0 && (
            <button
              type="button"
              onClick={clearAllAttachments}
              style={{ background: '#FFF1F2', color: '#E11D48', border: '1px solid #FECDD3', borderRadius: '4px', padding: '3px 8px', fontSize: '10.5px', fontWeight: '700', cursor: 'pointer' }}
              title="Xóa toàn bộ hồ sơ đã nạp"
            >
              🗑️ Xóa hết
            </button>
          )}
        </div>
      </div>

      {/* File list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: (eventPhotos || []).length > 0 ? '8px' : '0' }}>
        {(attachedFiles || []).filter(f => f.type !== 'image').length === 0 && (eventPhotos || []).length === 0 ? (
          <div style={{ fontSize: '11px', color: '#94A3B8', textAlign: 'center', padding: '10px 0', lineHeight: '1.5' }}>
            Chưa có tài liệu. Bấm <strong>"+ Nạp tệp"</strong> hoặc kéo thả file vào Canvas.
          </div>
        ) : (
          (attachedFiles || []).filter(f => f.type !== 'image').map((f, fi) => (
            <div key={fi} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '4px', padding: '4px 8px', fontSize: '10.5px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                <span style={{ background: f.name.endsWith('.xlsx') ? '#16A34A' : f.name.endsWith('.pdf') ? '#DC2626' : f.name.endsWith('.pptx') ? '#EA580C' : '#2563EB', color: 'white', fontSize: '8px', fontWeight: '900', padding: '1px 4px', borderRadius: '2px' }}>
                  {f.name.split('.').pop().toUpperCase()}
                </span>
                <span style={{ color: '#1E293B', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }} title={f.name}>{f.name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '9.5px', color: '#15803D', fontWeight: '700' }}>✓ Sẵn sàng</span>
                <button
                  type="button"
                  onClick={() => removeAttachedFile(f.name)}
                  style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '12px', padding: '0 3px', fontWeight: 'bold' }}
                  title="Xóa tệp này khỏi hồ sơ"
                >
                  ✕
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Photo grid */}
      {(eventPhotos || []).length > 0 && (
        <div>
          <div style={{ fontSize: '10px', fontWeight: '700', color: '#64748B', marginBottom: '5px' }}>📸 ẢNH SỰ KIỆN SẴN SÀNG CHÈN:</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
            {eventPhotos.map((p, pidx) => (
              <div key={pidx} style={{ border: p.isFeatured ? '1.5px solid #2563EB' : '1px solid #E2E8F0', borderRadius: '6px', overflow: 'hidden', background: '#FFF', position: 'relative' }}>
                <div style={{ position: 'relative' }}>
                  <img src={p.url} alt={p.caption} style={{ width: '100%', height: '64px', objectFit: 'cover', display: 'block' }} />
                  {p.isAnalyzingVision && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(2,132,199,0.78)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', gap: '2px', fontSize: '8.5px', fontWeight: '800' }}>
                      <i className="fa-solid fa-eye fa-bounce" style={{ fontSize: '13px' }} />
                      <span>AI Vision đang xem...</span>
                    </div>
                  )}
                </div>
                <div style={{ padding: '2px 3px' }}>
                  <input
                    type="text"
                    value={p.caption || ''}
                    onChange={e => updatePhotoCaption(pidx, e.target.value)}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      border: '1px solid #E2E8F0',
                      borderRadius: '3px',
                      padding: '2px 4px',
                      fontSize: '8.5px',
                      fontWeight: '600',
                      color: '#1E293B',
                      background: '#F8FAFC'
                    }}
                    title="Bấm để chỉnh sửa tiêu đề chú thích ảnh"
                    placeholder="AI Vision đang đặt tiêu đề..."
                  />
                </div>
                <div style={{ display: 'flex', gap: '2px', padding: '2px 4px', background: '#F8FAFC', borderTop: '1px solid #F1F5F9' }}>
                  <button type="button" onClick={() => insertPhoto(p.url, p.caption)} style={{ flex: 1, background: '#EFF6FF', color: '#1D4ED8', border: 'none', borderRadius: '3px', fontSize: '8.5px', fontWeight: '700', padding: '2px', cursor: 'pointer' }} title="Chèn vào CKEditor 5">+ Chèn</button>
                  <button type="button" onClick={() => triggerAiVision(pidx)} disabled={p.isAnalyzingVision} style={{ background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0', borderRadius: '3px', fontSize: '8.5px', fontWeight: '700', padding: '2px 4px', cursor: 'pointer' }} title="Nhờ AI Vision nhìn lại ảnh này và tự đặt tiêu đề mới">👁️ AI</button>
                  <button type="button" onClick={() => setFeaturedPhoto(pidx)} style={{ background: p.isFeatured ? '#2563EB' : '#F1F5F9', color: p.isFeatured ? 'white' : '#64748B', border: 'none', borderRadius: '3px', fontSize: '8.5px', fontWeight: '700', padding: '2px 4px', cursor: 'pointer' }} title={p.isFeatured ? 'Ảnh đại diện' : 'Đặt làm ảnh đại diện'}>★</button>
                  <button type="button" onClick={() => removePhoto(pidx)} style={{ background: '#FFF1F2', color: '#E11D48', border: 'none', borderRadius: '3px', fontSize: '8.5px', fontWeight: '700', padding: '2px 5px', cursor: 'pointer' }} title="Xóa ảnh này khỏi hồ sơ">✕</button>
                </div>
                {p.isFeatured && <span style={{ position: 'absolute', top: '2px', left: '2px', background: '#2563EB', color: 'white', fontSize: '7px', fontWeight: '800', padding: '1px 3px', borderRadius: '2px' }}>Đại diện</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
