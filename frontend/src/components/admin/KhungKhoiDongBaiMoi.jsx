import React, { useRef, useState } from 'react';

export default function KhungKhoiDongBaiMoi({
  onStartWriting,
  onManualStart,
  onOpenDrafts,
  draftsCount = 0,
  attachedFiles,
  eventPhotos,
  onDropFiles,
  onRemoveFile,
  onRemovePhoto,
  promptInput,
  setPromptInput,
  isGenerating
}) {
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  const handlePickFolder = async (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    // 1. Modern File System Access API: Mở trực tiếp hộp thoại chọn thư mục của Hệ điều hành
    if (typeof window !== 'undefined' && window.showDirectoryPicker) {
      try {
        const dirHandle = await window.showDirectoryPicker();
        const files = [];
        async function readDir(handle) {
          for await (const entry of handle.values()) {
            if (entry.kind === 'file') {
              try {
                const file = await entry.getFile();
                files.push(file);
              } catch {}
            } else if (entry.kind === 'directory') {
              await readDir(entry);
            }
          }
        }
        await readDir(dirHandle);
        if (files.length > 0 && onDropFiles) {
          onDropFiles({ dataTransfer: { files, items: [] }, preventDefault: () => {}, stopPropagation: () => {} });
        }
        return;
      } catch (err) {
        if (err.name === 'AbortError') return; // Người dùng ấn Hủy
        console.warn('showDirectoryPicker fallback sang input element:', err);
      }
    }

    // 2. Fallback sang thẻ input webkitdirectory
    if (folderInputRef.current) {
      try {
        folderInputRef.current.webkitdirectory = true;
        folderInputRef.current.directory = true;
        folderInputRef.current.setAttribute('webkitdirectory', '');
        folderInputRef.current.setAttribute('directory', '');
        folderInputRef.current.setAttribute('mozdirectory', '');
      } catch {}
      folderInputRef.current.click();
    }
  };
  const [isDragOver, setIsDragOver] = useState(false);
  const attachedDocFiles = (attachedFiles || []).filter(f => f.type !== "image");

  const samplePrompts = [
    {
      title: 'Chào mừng Ngày Nhà giáo Việt Nam 20/11',
      desc: 'Tôn vinh các tấm gương giảng viên tiêu biểu và phong trào thi đua dạy tốt'
    },
    {
      title: 'Kỷ niệm Ngày Phụ nữ Việt Nam 20/10',
      desc: 'Hội thi Duyên dáng Áo dài, tọa đàm xây dựng gia đình hạnh phúc'
    },
    {
      title: 'Giải Bóng đá Truyền thống TDMU',
      desc: 'Sôi nổi tranh tài giữa các tổ công đoàn, rèn luyện thể lực và tinh thần đoàn kết'
    },
    {
      title: 'Hội nghị Cán bộ Viên chức & Người lao động',
      desc: 'Tổng kết phong trào công đoàn, thực hiện quy chế dân chủ và chăm lo đời sống'
    }
  ];

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    setIsDragOver(false);
    if (onDropFiles) onDropFiles(e);
  };

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        background: 'linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: 'clamp(24px, 4vw, 48px) clamp(16px, 3vw, 32px)',
        position: 'relative'
      }}
    >
      <div style={{ maxWidth: '820px', width: '100%' }}>
        {/* Tiêu đề & Giới thiệu chuẩn mực */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: '#EFF6FF',
              color: '#1D4ED8',
              padding: '6px 16px',
              borderRadius: '20px',
              fontSize: 'clamp(11.5px, 0.9vw, 13px)',
              fontWeight: '700',
              marginBottom: '14px',
              border: '1px solid #DBEAFE'
            }}
          >
            <i className="fa-solid fa-feather-pointed" /> CÔNG ĐOÀN TRƯỜNG ĐẠI HỌC THỦ DẦU MỘT
          </div>
          <h1
            style={{
              fontSize: 'clamp(22px, 2.4vw, 28px)',
              fontWeight: '800',
              color: '#002855',
              margin: '0 0 10px 0',
              lineHeight: '1.35',
              wordBreak: 'normal',
              overflowWrap: 'break-word'
            }}
          >
            Khởi Tạo Bài Viết Mới
          </h1>
          <p
            style={{
              fontSize: 'clamp(13px, 1.1vw, 14.5px)',
              color: '#475569',
              margin: '0 auto',
              maxWidth: '620px',
              lineHeight: '1.6',
              wordBreak: 'normal',
              overflowWrap: 'break-word'
            }}
          >
            Tải lên tài liệu và hình ảnh sự kiện để tổng hợp tin bài, hỗ trợ đồng bộ xuất bản lên Cổng thông tin, Facebook và Zalo.
          </p>
        </div>

        {/* Khung Kéo Thả Tài Liệu & Ảnh */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            background: isDragOver ? '#EFF6FF' : '#FFF',
            border: isDragOver ? '2.5px dashed #2563EB' : '2px dashed #CBD5E1',
            borderRadius: '14px',
            padding: 'clamp(24px, 3.5vw, 36px) clamp(16px, 2.5vw, 28px)',
            textAlign: 'center',
            marginBottom: '20px',
            boxShadow: '0 4px 16px rgba(0, 40, 85, 0.04)',
            transition: 'all 0.2s ease',
            cursor: 'pointer'
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            multiple
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0 && onDropFiles) {
                onDropFiles({ dataTransfer: { files: Array.from(e.target.files), items: [] }, preventDefault: () => {}, stopPropagation: () => {} });
              }
              e.target.value = '';
            }}
          />
          <input
            type="file"
            ref={(el) => {
              folderInputRef.current = el;
              if (el) {
                try {
                  el.setAttribute('webkitdirectory', '');
                  el.setAttribute('directory', '');
                  el.setAttribute('mozdirectory', '');
                  el.webkitdirectory = true;
                } catch {}
              }
            }}
            multiple
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0 && onDropFiles) {
                onDropFiles({ dataTransfer: { files: Array.from(e.target.files), items: [] }, preventDefault: () => {}, stopPropagation: () => {} });
              }
            }}
          />

          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#EFF6FF',
              color: '#2563EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              margin: '0 auto 14px'
            }}
          >
            <i className="fa-solid fa-cloud-arrow-up" />
          </div>

          <h3
            style={{
              fontSize: 'clamp(15px, 1.4vw, 17px)',
              fontWeight: '700',
              color: '#002855',
              margin: '0 0 6px 0',
              lineHeight: '1.4',
              wordBreak: 'normal',
              overflowWrap: 'break-word'
            }}
          >
            Kéo thả tài liệu sự kiện hoặc ảnh chụp vào đây
          </h3>
          <p
            style={{
              fontSize: 'clamp(12px, 1vw, 13px)',
              color: '#64748B',
              margin: '0 0 18px 0',
              lineHeight: '1.5',
              wordBreak: 'normal',
              overflowWrap: 'break-word'
            }}
          >
            Hỗ trợ tài liệu Word (<code>.docx</code>), PDF (<code>.pdf</code>), Excel (<code>.xlsx</code>) và Ảnh chụp sự kiện (<code>.jpg, .png</code>)
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              style={{
                background: '#002855',
                color: '#FFF',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: 'clamp(11.5px, 0.95vw, 13px)',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <i className="fa-solid fa-file-arrow-up" /> Chọn Tệp Từ Máy
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlePickFolder(e);
              }}
              style={{
                background: '#F8FAFC',
                color: '#334155',
                border: '1px solid #CBD5E1',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: 'clamp(11.5px, 0.95vw, 13px)',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              title="Mở bảng chọn thư mục trên máy tính để nạp toàn bộ tệp bên trong"
            >
              <i className="fa-solid fa-folder-open" style={{ color: '#F59E0B' }} /> Chọn Thư Mục
            </button>
          </div>
        </div>

        {/* Danh sách tệp & ảnh đã nạp */}
        {((attachedDocFiles && attachedDocFiles.length > 0) || (eventPhotos && eventPhotos.length > 0)) && (
          <div style={{ background: '#FFF', borderRadius: '10px', padding: '16px 20px', border: '1px solid #E2E8F0', marginBottom: '20px' }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#002855', marginBottom: '10px' }}>
              <i className="fa-solid fa-paperclip me-1" /> Tư liệu đã đính kèm ({((attachedDocFiles?.length || 0) + (eventPhotos?.length || 0))} mục):
            </div>

            {attachedDocFiles && attachedDocFiles.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: eventPhotos?.length ? '10px' : '0' }}>
                {attachedDocFiles.map((file, i) => (
                  <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', color: '#334155' }}>
                    <i className="fa-solid fa-file-lines text-primary" /> {file.name}
                    {onRemoveFile && (
                      <button onClick={() => onRemoveFile(i)} style={{ border: 'none', background: 'transparent', color: '#94A3B8', cursor: 'pointer', padding: 0 }}>
                        <i className="fa-solid fa-xmark" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            )}

            {eventPhotos && eventPhotos.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {eventPhotos.map((photo, i) => (
                  <div key={i} style={{ position: 'relative', width: '60px', height: '60px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #CBD5E1' }}>
                    <img src={typeof photo === 'string' ? photo : (photo.dataUrl || photo.url)} alt="Event" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    {onRemovePhoto && (
                      <button
                        onClick={() => onRemovePhoto(i)}
                        style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '16px', height: '16px', fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                      >
                        <i className="fa-solid fa-xmark" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Ô Nhập Định Hướng Nội Dung */}
        <div style={{ background: '#FFF', borderRadius: '14px', padding: 'clamp(18px, 2.5vw, 24px)', border: '1px solid #E2E8F0', boxShadow: '0 4px 16px rgba(0, 40, 85, 0.04)', marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: 'clamp(13px, 1.05vw, 14px)', fontWeight: '700', color: '#002855', marginBottom: '8px' }}>
            <i className="fa-solid fa-pen-nib" style={{ marginRight: '6px', color: '#2563EB' }} />
            Định hướng nội dung hoặc thông điệp bài viết:
          </label>
          <textarea
            rows={3}
            placeholder="Ví dụ: 'Soạn thảo bài viết đưa tin Lễ kỷ niệm ngày Nhà giáo Việt Nam 20/11, biểu dương các gương mặt giảng viên tiêu biểu và trích dẫn phát biểu của Ban Thường vụ...'"
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            style={{
              width: '100%',
              border: '1px solid #CBD5E1',
              borderRadius: '8px',
              padding: '12px 14px',
              fontSize: 'clamp(13px, 1.05vw, 14px)',
              color: '#1E293B',
              outline: 'none',
              resize: 'vertical',
              boxSizing: 'border-box',
              fontFamily: 'inherit',
              lineHeight: '1.5',
              transition: 'border-color 0.2s',
              marginBottom: '14px',
              wordBreak: 'normal',
              overflowWrap: 'break-word'
            }}
            onFocus={(e) => (e.target.style.borderColor = '#2563EB')}
            onBlur={(e) => (e.target.style.borderColor = '#CBD5E1')}
          />

          <button
            onClick={onStartWriting}
            disabled={isGenerating}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #002855 0%, #2563EB 100%)',
              color: 'white',
              border: 'none',
              padding: '12px 20px',
              borderRadius: '8px',
              fontWeight: '700',
              fontSize: 'clamp(13.5px, 1.1vw, 14.5px)',
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(37,99,235,0.25)',
              transition: 'opacity 0.2s'
            }}
          >
            {isGenerating ? (
              <>
                <i className="fa-solid fa-spinner fa-spin" /> Đang tổng hợp nội dung bài viết...
              </>
            ) : (
              <>
                <i className="fa-solid fa-feather" />
                TỔNG HỢP VÀ BẮT ĐẦU SOẠN THẢO BÀI VIẾT
              </>
            )}
          </button>
        </div>

        {/* Chủ Đề Mẫu Thường Gặp */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: 'clamp(12px, 0.95vw, 13px)', fontWeight: '700', color: '#64748B', marginBottom: '8px' }}>
            <i className="fa-regular fa-bookmark" style={{ marginRight: '6px' }} />
            Chủ đề gợi ý thường gặp (bấm để chọn nhanh):
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
            {samplePrompts.map((item, idx) => (
              <div
                key={idx}
                onClick={() => setPromptInput(`Soạn thảo bài viết: "${item.title}". Trọng tâm: ${item.desc}`)}
                style={{
                  background: '#FFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#2563EB';
                  e.currentTarget.style.background = '#F8FAFC';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E2E8F0';
                  e.currentTarget.style.background = '#FFF';
                }}
              >
                <div style={{ fontSize: 'clamp(12px, 1vw, 13px)', fontWeight: '700', color: '#002855', marginBottom: '3px', lineHeight: '1.4', wordBreak: 'normal' }}>
                  {item.title}
                </div>
                <div style={{ fontSize: 'clamp(11px, 0.9vw, 11.5px)', color: '#64748B', lineHeight: '1.45', wordBreak: 'normal' }}>
                  {item.desc}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Nút Chuyển Vào Soạn Thảo Thủ Công */}
        <div style={{ textAlign: 'center', paddingTop: '8px', borderTop: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              onClick={onOpenDrafts}
              style={{
                background: '#FFF',
                border: '1.5px solid #002855',
                color: '#002855',
                padding: '8px 18px',
                borderRadius: '8px',
                fontSize: 'clamp(12px, 1vw, 13px)',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}
            >
              <i className="fa-solid fa-box-archive" style={{ color: '#2563EB' }} />
              Mở Tủ Bản Thảo {draftsCount > 0 ? `(${draftsCount} bài đã lưu)` : ''}
            </button>
            <button
              type="button"
              onClick={onManualStart}
              style={{
                background: '#F8FAFC',
                border: '1px solid #CBD5E1',
                color: '#334155',
                padding: '8px 18px',
                borderRadius: '8px',
                fontSize: 'clamp(12px, 1vw, 13px)',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <i className="fa-solid fa-pen-to-square" style={{ color: '#059669' }} />
              Bắt đầu bằng văn bản trống (Soạn thảo thủ công) &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
