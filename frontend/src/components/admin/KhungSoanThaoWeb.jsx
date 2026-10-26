import React from 'react';
import CKArticleEditor from '../editor/CKArticleEditor';

export default function WebEditorCanvas({
  title,
  setTitle,
  sapo,
  setSapo,
  bodyHtml,
  setBodyHtml,
  ckeditorInstanceRef,
  isDraggingOver,
  handleDragOver,
  handleDragLeave,
  handleDrop
}) {
  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        flex: 1,
        overflowY: 'auto',
        background: '#F8FAFC',
        padding: '24px 32px',
        position: 'relative'
      }}
    >
      {isDraggingOver && (
        <div
          style={{
            position: 'absolute',
            inset: '16px',
            background: 'rgba(0, 40, 85, 0.88)',
            color: 'white',
            borderRadius: '12px',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px dashed #FEF08A'
          }}
        >
          <i className="fa-solid fa-cloud-arrow-up fa-3x mb-3 text-warning" />
          <h4 className="fw-bold">Thả hồ sơ tư liệu / ảnh sự kiện vào đây</h4>
          <p className="text-light small">Hệ thống sẽ tự động bóc tách nội dung và nạp vào Studio</p>
        </div>
      )}

      <div
        style={{
          maxWidth: '920px',
          margin: '0 auto',
          background: '#FFF',
          borderRadius: '12px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          border: '1px solid #E2E8F0',
          padding: '40px 48px'
        }}
      >
        {/* Tiêu đề bài báo */}
        <textarea
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nhập tiêu đề bài viết (Headline)..."
          rows={2}
          style={{
            width: '100%',
            fontSize: '24px',
            fontWeight: '800',
            lineHeight: 1.35,
            border: 'none',
            outline: 'none',
            resize: 'none',
            color: '#002855',
            fontFamily: 'Roboto, sans-serif',
            marginBottom: '16px'
          }}
          spellCheck={false}
        />

        {/* Sa-pô bài báo */}
        <textarea
          value={sapo}
          onChange={(e) => setSapo(e.target.value)}
          placeholder="Tóm tắt nội dung mở đầu bài viết (Sa-pô / Lead deck)..."
          rows={3}
          style={{
            width: '100%',
            fontSize: '15px',
            fontWeight: '500',
            lineHeight: 1.6,
            border: 'none',
            outline: 'none',
            resize: 'none',
            color: '#475569',
            fontStyle: 'italic',
            borderLeft: '3px solid #002855',
            paddingLeft: '14px',
            marginBottom: '24px'
          }}
          spellCheck={false}
        />

        {/* Trình soạn thảo CKEditor 5 tiêu chuẩn */}
        <div className="ckeditor-canvas-wrapper" style={{ minHeight: '520px' }}>
          <CKArticleEditor
            content={bodyHtml}
            onChange={(val) => setBodyHtml(val)}
            editorRef={ckeditorInstanceRef}
          />
        </div>
      </div>
    </div>
  );
}
