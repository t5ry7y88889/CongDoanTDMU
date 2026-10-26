import React from 'react';

export default function DraftsDrawer({
  draftsOpen,
  setDraftsOpen,
  draftsList,
  draftsLoading,
  loadDraft,
  deleteDraft
}) {
  if (!draftsOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,0.4)',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'flex-end',
        backdropFilter: 'blur(2px)'
      }}
      onClick={() => setDraftsOpen(false)}
    >
      <div
        style={{
          width: '380px',
          height: '100%',
          background: '#FFF',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1001
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#002855' }}>
            <i className="fa-solid fa-box-archive text-primary me-2" />
            Tủ Bản Thảo Tin Bài ({draftsList.length})
          </h4>
          <button onClick={() => setDraftsOpen(false)} className="btn-close" style={{ cursor: 'pointer', border: 'none', background: 'transparent' }}>
            <i className="fa-solid fa-xmark fs-5 text-muted" />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {draftsLoading ? (
            <div className="text-center py-5 text-muted">
              <i className="fa-solid fa-spinner fa-spin fa-2x text-primary mb-2" />
              <div>Đang tải danh sách bản thảo...</div>
            </div>
          ) : draftsList.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="fa-solid fa-folder-open fa-3x mb-3 text-secondary" />
              <p>Chưa có bản thảo nào được lưu.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {draftsList.map(draft => (
                <div
                  key={draft.id}
                  style={{
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    padding: '12px',
                    background: '#F8FAFC',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => {
                    loadDraft(draft);
                    setDraftsOpen(false);
                  }}
                >
                  <div style={{ fontWeight: '700', fontSize: '13px', color: '#0F172A', marginBottom: '4px' }}>
                    {draft.title || 'Bài viết chưa đặt tên'}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748B', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{draft.updatedAt ? new Date(draft.updatedAt).toLocaleString('vi-VN') : 'Mới cập nhật'}</span>
                    <button
                      type="button"
                      className="btn btn-sm btn-link text-danger p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteDraft(draft.id);
                      }}
                      title="Xóa bản thảo"
                    >
                      <i className="fa-solid fa-trash-can" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
