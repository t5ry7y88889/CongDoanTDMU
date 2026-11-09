import React, { useRef, useState } from 'react';
import { SAMPLE_DOSSIERS } from '../../data/sampleDossiers';

export default function KhungKhoiDongBaiMoi({
  onStartWriting,
  onLoadSampleDossier,
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
  const [showDossierModal, setShowDossierModal] = useState(false);
  const [loadingDossierId, setLoadingDossierId] = useState(null);

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
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowDossierModal(true);
              }}
              style={{
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: '#FFF',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: 'clamp(11.5px, 0.95vw, 13px)',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 8px rgba(16,185,129,0.3)'
              }}
              title="Chọn nhanh từ 6 bộ hồ sơ thực tế có sẵn file Word và Ảnh chụp để thử nghiệm AI viết bài"
            >
              <i className="fa-solid fa-folder-tree" /> 📁 Chọn Hồ Sơ Mẫu (Thử Nghiệm AI)
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

        {/* Chủ Đề & Hồ Sơ Mẫu Thực Tế (Tích hợp sẵn File Word + Ảnh hiện trường) */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ fontSize: 'clamp(12px, 0.95vw, 13px)', fontWeight: '700', color: '#002855' }}>
              <i className="fa-solid fa-folder-open" style={{ marginRight: '6px', color: '#2563EB' }} />
              6 Bộ Hồ sơ Tư liệu Mẫu Thực tế (Kèm tệp Word & Ảnh để thử nghiệm AI):
            </div>
            <button
              type="button"
              onClick={() => setShowDossierModal(true)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#2563EB',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              Xem toàn bộ 6 hồ sơ &rarr;
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px' }}>
            {SAMPLE_DOSSIERS.map((item) => {
              const isLoadingThis = loadingDossierId === item.id;
              return (
                <div
                  key={item.id}
                  style={{
                    background: '#FFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                    transition: 'all 0.18s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = item.color || '#2563EB';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(37,99,235,0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#E2E8F0';
                    e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.02)';
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span
                        style={{
                          background: `${item.color}15`,
                          color: item.color,
                          fontSize: '11px',
                          fontWeight: '700',
                          padding: '2px 8px',
                          borderRadius: '12px'
                        }}
                      >
                        <i className={`fa-solid ${item.icon}`} style={{ marginRight: '4px' }} />
                        {item.badge}
                      </span>
                      <span style={{ fontSize: '11px', color: '#059669', fontWeight: '600' }}>
                        <i className="fa-solid fa-file-word" /> Tệp Word + Ảnh nhúng
                      </span>
                    </div>

                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#002855', marginBottom: '4px', lineHeight: '1.4' }}>
                      {item.title}
                    </div>

                    <div style={{ fontSize: '11.5px', color: '#64748B', lineHeight: '1.45', marginBottom: '8px' }}>
                      {item.desc}
                    </div>

                    <div style={{ fontSize: '11px', color: '#0284C7', background: '#F0F9FF', padding: '3px 8px', borderRadius: '4px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <i className="fa-solid fa-file-word" /> {item.docName}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', paddingTop: '8px', borderTop: '1px solid #F1F5F9' }}>
                    <button
                      type="button"
                      disabled={isLoadingThis || isGenerating}
                      onClick={async () => {
                        setLoadingDossierId(item.id);
                        if (onLoadSampleDossier) {
                          await onLoadSampleDossier(item, false);
                        } else {
                          setPromptInput(item.prompt);
                        }
                        setLoadingDossierId(null);
                      }}
                      style={{
                        flex: 1,
                        background: '#F1F5F9',
                        color: '#334155',
                        border: '1px solid #CBD5E1',
                        borderRadius: '6px',
                        padding: '6px 8px',
                        fontSize: '11.5px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px'
                      }}
                      title="Nạp file Word và ảnh sự kiện vào bộ nhớ soạn thảo"
                    >
                      {isLoadingThis ? <i className="fa-solid fa-spinner fa-spin" /> : <i className="fa-solid fa-download" />}
                      Nạp Tư Liệu
                    </button>

                    <button
                      type="button"
                      disabled={isLoadingThis || isGenerating}
                      onClick={async () => {
                        setLoadingDossierId(item.id);
                        if (onLoadSampleDossier) {
                          await onLoadSampleDossier(item, true);
                        }
                        setLoadingDossierId(null);
                      }}
                      style={{
                        flex: 1.2,
                        background: 'linear-gradient(135deg, #002855 0%, #2563EB 100%)',
                        color: '#FFF',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 8px',
                        fontSize: '11.5px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px'
                      }}
                      title="Nạp ngay hồ sơ và kích hoạt AI chấp bút bài báo trực tiếp"
                    >
                      {isLoadingThis ? <i className="fa-solid fa-spinner fa-spin" /> : <i className="fa-solid fa-bolt" />}
                      ⚡ Viết Ngay
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Chọn Toàn Bộ 6 Hồ Sơ Mẫu */}
        {showDossierModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 40, 85, 0.6)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
            onClick={() => setShowDossierModal(false)}
          >
            <div
              style={{
                background: '#FFF',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '850px',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
                padding: '24px'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: '#002855' }}>
                    <i className="fa-solid fa-folder-tree text-primary me-2" />
                    Kho Hồ Sơ Mẫu Tư Liệu Thực Tế Công Đoàn TDMU
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>
                    Chọn 1 hồ sơ dưới đây để nạp đầy đủ tệp Word (.docx) và Ảnh hiện trường (.jpg) cho AI chấp bút:
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDossierModal(false)}
                  style={{
                    border: 'none',
                    background: '#F1F5F9',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#64748B'
                  }}
                >
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {SAMPLE_DOSSIERS.map((dossier, i) => (
                  <div
                    key={dossier.id}
                    style={{
                      border: '1px solid #E2E8F0',
                      borderRadius: '12px',
                      padding: '16px',
                      background: '#F8FAFC',
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '16px',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ flex: '1 1 350px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span style={{ background: dossier.color, color: '#FFF', fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px' }}>
                          #{i + 1}
                        </span>
                        <span style={{ fontSize: '14px', fontWeight: '800', color: '#002855' }}>
                          {dossier.title}
                        </span>
                      </div>
                      <div style={{ fontSize: '12.5px', color: '#475569', marginBottom: '8px' }}>
                        {dossier.desc}
                      </div>
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '11.5px', color: '#64748B' }}>
                        <span><i className="fa-solid fa-file-word text-primary me-1" /> {dossier.docName}</span>
                        <span><i className="fa-solid fa-camera-retro text-success me-1" /> Tự động trích xuất ảnh nhúng từ tệp Word</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                      <button
                        type="button"
                        onClick={async () => {
                          setShowDossierModal(false);
                          if (onLoadSampleDossier) await onLoadSampleDossier(dossier, false);
                        }}
                        style={{
                          background: '#FFF',
                          color: '#002855',
                          border: '1px solid #CBD5E1',
                          padding: '8px 14px',
                          borderRadius: '6px',
                          fontSize: '12.5px',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        <i className="fa-solid fa-download me-1" /> Nạp Tư Liệu
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          setShowDossierModal(false);
                          if (onLoadSampleDossier) await onLoadSampleDossier(dossier, true);
                        }}
                        style={{
                          background: 'linear-gradient(135deg, #002855 0%, #2563EB 100%)',
                          color: '#FFF',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '6px',
                          fontSize: '12.5px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <i className="fa-solid fa-bolt" /> ⚡ Nạp & Chấp Bút AI Ngay
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

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
