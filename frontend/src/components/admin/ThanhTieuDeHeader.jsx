import React from 'react';

export default function AdminTopHeader({
  activeNav,
  navTitles,
  sidebarCollapsed,
  setSidebarCollapsed,
  activeArticleId,
  isSaving,
  lastSaveTime,
  setDraftsOpen,
  draftsList,
  resetArticle,
  handleAuditClick,
  setOmnichannelModalOpen,
  publishLive,
  setSettingsOpen
}) {
  return (
    <header style={{ height: '54px', borderBottom: '1px solid #E2E8F0', background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', zIndex: 90, flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="btn-icon-subtle"
          title="Thu gọn/Mở rộng menu"
          style={{ width: '32px', height: '32px', borderRadius: '6px', border: '1px solid #E2E8F0', background: '#F8FAFC', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <i className="fa-solid fa-bars" style={{ fontSize: '13px', color: '#475569' }} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A', margin: 0 }}>{navTitles[activeNav] || 'Admin Studio'}</h2>
          {activeNav === 'ai-creator' && (
            <span style={{ background: '#EFF6FF', color: '#1D4ED8', fontSize: '10.5px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px', border: '1px solid #BFDBFE' }}>
              Bản Tin #{activeArticleId}
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {activeNav === 'ai-creator' && (
          <>
            <div style={{ fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '5px' }}>
              {isSaving ? (
                <><i className="fa-solid fa-spinner fa-spin text-primary" /> Đang lưu...</>
              ) : lastSaveTime ? (
                <><i className="fa-solid fa-check text-success" /> Đã lưu lúc {lastSaveTime}</>
              ) : null}
            </div>

            <button
              onClick={() => setDraftsOpen(true)}
              className="btn btn-sm btn-outline-secondary"
              style={{ fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <i className="fa-solid fa-box-archive" /> Tủ Bản Thảo
              <span className="badge bg-primary rounded-pill">{draftsList.length}</span>
            </button>

            <button
              onClick={resetArticle}
              className="btn btn-sm btn-outline-secondary"
              style={{ fontSize: '12px', fontWeight: '700' }}
              title="Làm mới bài viết"
            >
              <i className="fa-solid fa-rotate-left me-1" /> Tạo Mới
            </button>

            <button
              onClick={handleAuditClick}
              className="btn btn-sm btn-outline-primary"
              style={{ fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <i className="fa-solid fa-clipboard-check text-primary" /> Kiểm Định Báo Chí
            </button>

            <button
              onClick={() => setOmnichannelModalOpen(true)}
              className="btn btn-sm"
              style={{ background: 'linear-gradient(135deg,#002855,#0284C7)', color: '#FFF', fontSize: '12px', fontWeight: '800', border: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <i className="fa-solid fa-share-nodes text-warning" /> Đăng Đa Kênh
            </button>

            <button
              onClick={publishLive}
              className="btn btn-sm"
              style={{ background: '#002855', color: '#FEF08A', fontSize: '12px', fontWeight: '800', border: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <i className="fa-solid fa-paper-plane" /> Đăng Bài Ngay
            </button>
          </>
        )}

        <button
          onClick={() => setSettingsOpen(true)}
          className="btn-icon-subtle"
          title="Cấu hình API Key AI & Mạng xã hội"
          style={{ width: '32px', height: '32px', borderRadius: '6px', border: '1px solid #E2E8F0', background: '#F8FAFC', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <i className="fa-solid fa-gear" style={{ fontSize: '13px', color: '#475569' }} />
        </button>
      </div>
    </header>
  );
}
