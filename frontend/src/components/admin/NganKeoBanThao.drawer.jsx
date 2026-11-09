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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending_review':
        return <span style={{ background: '#FEF3C7', color: '#D97706', padding: '2px 7px', borderRadius: '4px', fontSize: '10.5px', fontWeight: '700' }}>⏳ Chờ duyệt</span>;
      case 'requires_revision':
        return <span style={{ background: '#FEE2E2', color: '#DC2626', padding: '2px 7px', borderRadius: '4px', fontSize: '10.5px', fontWeight: '700' }}>↩️ Yêu cầu sửa</span>;
      case 'approved':
        return <span style={{ background: '#DCFCE7', color: '#16A34A', padding: '2px 7px', borderRadius: '4px', fontSize: '10.5px', fontWeight: '700' }}>✅ Đã duyệt</span>;
      case 'published':
        return <span style={{ background: '#DBEAFE', color: '#2563EB', padding: '2px 7px', borderRadius: '4px', fontSize: '10.5px', fontWeight: '700' }}>🌐 Đã xuất bản</span>;
      default:
        return <span style={{ background: '#F1F5F9', color: '#64748B', padding: '2px 7px', borderRadius: '4px', fontSize: '10.5px', fontWeight: '700' }}>📝 Bản nháp</span>;
    }
  };

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
          width: '420px',
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
            Tủ Bản Thảo Đa Kênh ({draftsList.length})
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
              <p>Chưa có bản thảo nào trong tủ.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {draftsList.map(draft => {
                const hasFb = Boolean(draft.noi_dung_fb || draft.NoiDungFB || draft.packageData?.facebook?.caption);
                const hasZalo = Boolean(draft.noi_dung_zalo || draft.NoiDungZalo || draft.packageData?.zalo?.message);

                return (
                  <div
                    key={draft.id}
                    style={{
                      border: draft.status === 'requires_revision' ? '1.5px solid #F87171' : '1px solid #E2E8F0',
                      borderRadius: '8px',
                      padding: '12px',
                      background: draft.status === 'requires_revision' ? '#FEF2F2' : '#F8FAFC',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onClick={() => {
                      loadDraft(draft);
                      setDraftsOpen(false);
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                      <div style={{ fontWeight: '700', fontSize: '13px', color: '#0F172A', lineHeight: 1.4, flex: 1, marginRight: '8px' }}>
                        {draft.title || 'Bản thảo chưa đặt tên'}
                      </div>
                      <span style={{ fontSize: '10.5px', color: '#2563EB', background: '#EFF6FF', padding: '1px 5px', borderRadius: '4px', fontWeight: '700' }}>
                        #{draft.id}
                      </span>
                    </div>

                    {draft.reviewNotes && (
                      <div style={{ fontSize: '11px', color: '#DC2626', background: '#FEE2E2', padding: '5px 8px', borderRadius: '5px', marginBottom: '8px', lineHeight: 1.3 }}>
                        <strong>⚠️ Ý kiến BTV:</strong> {draft.reviewNotes}
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '10px', background: '#E2E8F0', color: '#334155', padding: '1px 5px', borderRadius: '3px' }}>🌐 Web</span>
                      {hasFb && <span style={{ fontSize: '10px', background: '#DBEAFE', color: '#1D4ED8', padding: '1px 5px', borderRadius: '3px' }}>📘 FB</span>}
                      {hasZalo && <span style={{ fontSize: '10px', background: '#DCFCE7', color: '#15803D', padding: '1px 5px', borderRadius: '3px' }}>💬 Zalo</span>}
                    </div>

                    <div style={{ fontSize: '11.5px', color: '#64748B', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {getStatusBadge(draft.status)}
                        <span>{draft.updatedAt ? new Date(draft.updatedAt).toLocaleDateString('vi-VN') : 'Mới cập nhật'}</span>
                      </div>
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
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
