import React from 'react';

export default function ChannelConfigModal({
  accountModalOpen,
  setAccountModalOpen,
  editingChannel,
  editingAccountData,
  setEditingAccountData,
  saveAccountConfiguration,
  deleteAccountConfiguration
}) {
  if (!accountModalOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(5px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: '#FFFFFF', borderRadius: '14px', width: '100%', maxWidth: '540px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', background: editingChannel === 'facebook' ? 'linear-gradient(135deg,#1877F2,#1E40AF)' : 'linear-gradient(135deg,#0068FF,#0284C7)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: '800' }}>
            <i className={editingChannel === 'facebook' ? "fa-brands fa-facebook" : "fa-solid fa-comment-dots"} />
            <span>Cấu Hình Tài Khoản {editingChannel === 'facebook' ? 'Facebook Fanpage' : 'Zalo Gửi Tin'}</span>
          </div>
          <button type="button" onClick={() => setAccountModalOpen(false)} style={{ background: 'none', border: 'none', color: '#E2E8F0', fontSize: '20px', cursor: 'pointer', lineHeight: '1' }}>✕</button>
        </div>

        {/* Form Fields */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '72vh', overflowY: 'auto' }}>
          {/* Account Name */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: '800', color: '#002855', display: 'block', marginBottom: '4px' }}>
              TÊN TÀI KHOẢN HIỂN THỊ: *
            </label>
            <input
              type="text"
              value={editingAccountData.name || ''}
              onChange={e => setEditingAccountData(p => ({ ...p, name: e.target.value }))}
              placeholder={editingChannel === 'zalo' ? "VD: Ban Truyền Thông Công Đoàn Cơ Sở TDMU" : "VD: Fanpage Công Đoàn TDMU..."}
              style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '12.5px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {/* Account Type */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: '800', color: '#002855', display: 'block', marginBottom: '4px' }}>
              LOẠI HÌNH PHÁT HÀNH:
            </label>
            <select
              value={editingChannel === 'facebook' ? (editingAccountData.type === 'personal' ? 'personal' : 'page') : (editingAccountData.type === 'oa' ? 'oa' : 'group')}
              onChange={e => setEditingAccountData(p => ({ ...p, type: e.target.value }))}
              style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '12.5px', outline: 'none', boxSizing: 'border-box', background: '#FFF' }}
            >
              {editingChannel === 'zalo' ? (
                <>
                  <option value="group">👥 Nhóm Zalo Công Đoàn TDMU (Tự động đăng bài qua Bot QR)</option>
                  <option value="oa">🏢 Zalo Official Account Công Đoàn (Kết nối OA Token)</option>
                </>
              ) : (
                <>
                  <option value="page">🏢 Fanpage Doanh nghiệp / Đơn vị (Graph API v20.0)</option>
                  <option value="personal">👤 Trang cá nhân / Thử nghiệm</option>
                </>
              )}
            </select>
          </div>

          {/* Zalo-specific fields */}
          {editingChannel === 'zalo' && (
            <div style={{ background: '#F0F9FF', border: '1.5px solid #BAE6FD', padding: '14px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '800', color: '#0369A1', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <i className="fa-solid fa-users" /> TÊN NHÓM ZALO TIẾP NHẬN BẢN TIN: *
                </label>
                <input
                  type="text"
                  value={editingAccountData.groupName || 'Công đoàn Trường ĐH Thủ Dầu Một - Kênh Tin Tức'}
                  onChange={e => setEditingAccountData(p => ({ ...p, groupName: e.target.value }))}
                  placeholder="VD: Công đoàn Trường ĐH Thủ Dầu Một - Kênh Tin Tức & Thông Báo"
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #7DD3FC', borderRadius: '6px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', fontWeight: '700', color: '#002855' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '800', color: '#0369A1', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <i className="fa-solid fa-link" /> LINK NHÓM ZALO CÔNG ĐOÀN:
                </label>
                <input
                  type="text"
                  value={editingAccountData.groupLink || 'https://zalo.me/g/wdhpzaoap7wkxb074exv'}
                  onChange={e => setEditingAccountData(p => ({ ...p, groupLink: e.target.value }))}
                  placeholder="VD: https://zalo.me/g/wdhpzaoap7wkxb074exv"
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #7DD3FC', borderRadius: '6px', fontSize: '12.5px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '800', color: '#065F46', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <i className="fa-solid fa-hashtag" /> MÃ NHẬN DIỆN NHÓM (GROUP ID):
                </label>
                <input
                  type="text"
                  value={editingAccountData.groupId || 'tdmu_congdoan_official'}
                  onChange={e => setEditingAccountData(p => ({ ...p, groupId: e.target.value }))}
                  placeholder="VD: tdmu_congdoan_official"
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #6EE7B7', borderRadius: '6px', fontSize: '12.5px', outline: 'none', boxSizing: 'border-box', fontWeight: '600' }}
                />
              </div>

              {editingAccountData.type === 'oa' && (
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '800', color: '#0369A1', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <i className="fa-solid fa-key" /> ACCESS TOKEN ZALO OA DOANH NGHIỆP:
                  </label>
                  <input
                    type="password"
                    value={editingAccountData.oaToken || ''}
                    onChange={e => setEditingAccountData(p => ({ ...p, oaToken: e.target.value }))}
                    placeholder="Nhập Access Token Zalo OA"
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #7DD3FC', borderRadius: '6px', fontSize: '12.5px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              )}

              <div style={{ fontSize: '11.5px', color: '#0369A1', lineHeight: '1.5', background: '#E0F2FE', padding: '8px 12px', borderRadius: '6px' }}>
                💡 <strong>Kênh phát hành nội bộ:</strong> Tin bài duyệt xuất bản sẽ được Bot Công Đoàn tự động phát tới các Cán bộ, Giảng viên trong Nhóm Zalo Công đoàn đã chọn.
              </div>
            </div>
          )}

          {/* Facebook-specific fields */}
          {editingChannel === 'facebook' && (
            <div style={{ background: '#F8FAFC', border: '1.5px solid #E2E8F0', padding: '12px 14px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '800', color: '#1E40AF', display: 'block', marginBottom: '4px' }}>
                  FACEBOOK PAGE ID: *
                </label>
                <input
                  type="text"
                  value={editingAccountData.pageId || ''}
                  onChange={e => setEditingAccountData(p => ({ ...p, pageId: e.target.value }))}
                  placeholder="VD: 100083281234567"
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #93C5FD', borderRadius: '6px', fontSize: '12.5px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '800', color: '#1E40AF', display: 'block', marginBottom: '4px' }}>
                  PAGE ACCESS TOKEN: *
                </label>
                <input
                  type="password"
                  value={editingAccountData.accessToken || ''}
                  onChange={e => setEditingAccountData(p => ({ ...p, accessToken: e.target.value }))}
                  placeholder="Nhập Page Access Token dài hạn của Meta Graph API"
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #93C5FD', borderRadius: '6px', fontSize: '12.5px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div style={{ padding: '14px 20px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {editingAccountData.id && !editingAccountData.isDefault ? (
            <button
              type="button"
              onClick={() => deleteAccountConfiguration(editingChannel, editingAccountData.id)}
              style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #FECACA', background: '#FFF1F2', color: '#DC2626', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
            >
              Xóa tài khoản
            </button>
          ) : <div />}

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setAccountModalOpen(false)}
              style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: '12.5px', fontWeight: '700', cursor: 'pointer' }}
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={saveAccountConfiguration}
              style={{ padding: '8px 18px', borderRadius: '6px', border: 'none', background: '#002855', color: '#FEF08A', fontSize: '12.5px', fontWeight: '800', cursor: 'pointer' }}
            >
              Lưu Cấu Hình
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
