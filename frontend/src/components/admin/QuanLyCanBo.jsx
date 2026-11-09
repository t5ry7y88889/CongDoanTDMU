import React, { useState, useEffect } from 'react';

export default function QuanLyCanBo({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'active' | 'locked'

  // Modal thêm cán bộ mới
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    unit: 'Viện Công Nghệ Số',
    position: 'Cán bộ Công đoàn',
    role: 'Editor',
    phone: '',
    avatar: ''
  });

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users').then(r => r.json());
      if (res.success && Array.isArray(res.data)) {
        setUsers(res.data);
      }
    } catch (err) {
      console.error('Lỗi nạp cán bộ:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // 1. Phân quyền thực tế: Gọi API cập nhật vai trò trực tiếp vào CSDL MSSQL
  const handleUpdateRole = async (userId, newRole) => {
    try {
      const res = await fetch(`/api/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      }).then(r => r.json());

      if (res.success) {
        setUsers(prev => prev.map(u => (u.id === userId || u.UserId === userId) ? { ...u, role: newRole } : u));
        alert(`✅ ${res.message || 'Cập nhật phân quyền cán bộ thành công!'}`);
      } else {
        alert('❌ ' + (res.message || 'Không thể cập nhật phân quyền!'));
      }
    } catch (err) {
      alert('Lỗi kết nối máy chủ: ' + err.message);
    }
  };

  // 2. Chuẩn hóa quy tắc: Không xóa tài khoản, chỉ bật/tắt kích hoạt hoặc khóa
  const handleToggleStatus = async (user) => {
    const isCurrentlyActive = (user.is_active !== undefined ? user.is_active : (user.active !== undefined ? user.active : (user.TrangThai !== 0)));
    const newActive = isCurrentlyActive ? 0 : 1;
    const actionText = isCurrentlyActive ? 'KHÓA / VÔ HIỆU HÓA' : 'KÍCH HOẠT MỞ LẠI';

    if (!window.confirm(`Bạn có chắc chắn muốn ${actionText} tài khoản cán bộ "${user.ho_ten || user.name}" không?\n(Dữ liệu lịch sử và vết kiểm duyệt của cán bộ vẫn được bảo toàn nguyên vẹn)`)) {
      return;
    }

    try {
      const res = await fetch(`/api/users/${user.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: newActive })
      }).then(r => r.json());

      if (res.success) {
        setUsers(prev => prev.map(u => (u.id === user.id) ? { ...u, is_active: newActive, active: newActive, TrangThai: newActive } : u));
        alert(`✅ ${res.message || 'Cập nhật trạng thái tài khoản thành công!'}`);
      } else {
        alert('❌ ' + (res.message || 'Không thể đổi trạng thái tài khoản!'));
      }
    } catch (err) {
      alert('Lỗi kết nối máy chủ: ' + err.message);
    }
  };

  // 3. Tải ảnh đại diện cán bộ từ máy tính
  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const res = await fetch('/api/upload/image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: ev.target.result, filename: file.name })
          }).then(r => r.json());

          if (res.success && res.url) {
            setNewUserForm(p => ({ ...p, avatar: res.url }));
          } else {
            alert(res.message || 'Lỗi tải ảnh đại diện');
          }
        } catch (fetchErr) {
          alert('Lỗi tải tệp: ' + fetchErr.message);
        } finally {
          setUploadingAvatar(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      alert('Lỗi đọc tệp: ' + err.message);
      setUploadingAvatar(false);
    }
  };

  // 4. Tạo cán bộ & phân quyền mới
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUserForm.name.trim() || !newUserForm.email.trim()) {
      alert('Vui lòng nhập họ tên và email công vụ!');
      return;
    }
    setCreating(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUserForm)
      }).then(r => r.json());

      if (res.success) {
        alert('🎉 Đã tạo mới tài khoản cán bộ và cấp quyền thành công!');
        setIsModalOpen(false);
        setNewUserForm({
          name: '',
          email: '',
          unit: 'Viện Công Nghệ Số',
          position: 'Cán bộ Công đoàn',
          role: 'Editor',
          phone: '',
          avatar: ''
        });
        loadUsers();
      } else {
        alert('❌ ' + (res.message || 'Không thể tạo cán bộ mới!'));
      }
    } catch (err) {
      alert('Lỗi kết nối máy chủ: ' + err.message);
    } finally {
      setCreating(false);
    }
  };

  const filteredUsers = users.map(u => {
    const rawRole = (u.role || 'Editor').toLowerCase();
    const isActive = (u.is_active !== undefined ? u.is_active : (u.active !== undefined ? u.active : (u.TrangThai !== 0)));
    return {
      ...u,
      normalizedRole: rawRole,
      isActiveBool: Boolean(isActive && isActive !== 0 && isActive !== '0')
    };
  }).filter(u => {
    const matchesSearch = !search ||
      (u.ho_ten || u.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.unit || u.department || '').toLowerCase().includes(search.toLowerCase());

    const matchesRole = filterRole === 'all' || u.normalizedRole === filterRole.toLowerCase();
    const matchesStatus = filterStatus === 'all' || (filterStatus === 'active' ? u.isActiveBool : !u.isActiveBool);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const totalUsers = users.length;
  const adminCount = users.filter(u => (u.role || '').toLowerCase() === 'admin').length;
  const editorCount = users.filter(u => (u.role || '').toLowerCase() === 'editor').length;
  const contributorCount = users.filter(u => (u.role || '').toLowerCase() === 'contributor').length;
  const memberCount = users.filter(u => ['member', 'doanvien', 'doan_vien'].includes((u.role || '').toLowerCase())).length;

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px', background: '#F8FAFC' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#002855', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="fa-solid fa-users-gear" style={{ color: '#0284C7' }} />
            Quản Lý Tài Khoản &amp; Phân Quyền Cán Bộ
          </h1>
          <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
            Hệ thống phân cấp 4 nhóm vai trò: Quản Trị Viên (Admin), Biên Tập Viên (Editor), Cộng Tác Viên (Contributor), Đoàn Viên (Member). Tài khoản không thể xóa, chỉ bật/tắt trạng thái hoạt động để bảo toàn vết kiểm duyệt.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          style={{
            padding: '10px 18px',
            background: 'linear-gradient(135deg, #002855, #0284C7)',
            color: '#FFF',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '700',
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)'
          }}
        >
          <i className="fa-solid fa-user-plus" /> Thêm Cán Bộ / Cấp Quyền
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#FFF', padding: '16px 20px', borderRadius: '10px', border: '1px solid #E2E8F0', borderLeft: '4px solid #0284C7' }}>
          <div style={{ fontSize: '11.5px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>TỔNG CÁN BỘ</div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#002855', marginTop: '4px' }}>{totalUsers}</div>
        </div>
        <div style={{ background: '#FFF', padding: '16px 20px', borderRadius: '10px', border: '1px solid #E2E8F0', borderLeft: '4px solid #DC2626' }}>
          <div style={{ fontSize: '11.5px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>QUẢN TRỊ VIÊN (ADMIN)</div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#DC2626', marginTop: '4px' }}>{adminCount}</div>
        </div>
        <div style={{ background: '#FFF', padding: '16px 20px', borderRadius: '10px', border: '1px solid #E2E8F0', borderLeft: '4px solid #2563EB' }}>
          <div style={{ fontSize: '11.5px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>BIÊN TẬP VIÊN (EDITOR)</div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#2563EB', marginTop: '4px' }}>{editorCount}</div>
        </div>
        <div style={{ background: '#FFF', padding: '16px 20px', borderRadius: '10px', border: '1px solid #E2E8F0', borderLeft: '4px solid #D97706' }}>
          <div style={{ fontSize: '11.5px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>CỘNG TÁC VIÊN</div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#D97706', marginTop: '4px' }}>{contributorCount}</div>
        </div>
        <div style={{ background: '#FFF', padding: '16px 20px', borderRadius: '10px', border: '1px solid #E2E8F0', borderLeft: '4px solid #7C3AED' }}>
          <div style={{ fontSize: '11.5px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>ĐOÀN VIÊN (MEMBER)</div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#7C3AED', marginTop: '4px' }}>{memberCount}</div>
        </div>
      </div>

      {/* Filters and Search */}
      <div style={{ background: '#FFF', padding: '16px 20px', borderRadius: '12px 12px 0 0', border: '1px solid #E2E8F0', borderBottom: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setFilterRole('all')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: filterRole === 'all' ? '1px solid #002855' : '1px solid #CBD5E1',
              background: filterRole === 'all' ? '#002855' : '#FFF',
              color: filterRole === 'all' ? '#FFF' : '#475569',
              fontWeight: '700',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Tất cả vai trò ({totalUsers})
          </button>
          <button
            onClick={() => setFilterRole('admin')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: filterRole === 'admin' ? '1px solid #DC2626' : '1px solid #CBD5E1',
              background: filterRole === 'admin' ? '#FEF2F2' : '#FFF',
              color: filterRole === 'admin' ? '#DC2626' : '#475569',
              fontWeight: '700',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Quản trị ({adminCount})
          </button>
          <button
            onClick={() => setFilterRole('editor')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: filterRole === 'editor' ? '1px solid #2563EB' : '1px solid #CBD5E1',
              background: filterRole === 'editor' ? '#EFF6FF' : '#FFF',
              color: filterRole === 'editor' ? '#2563EB' : '#475569',
              fontWeight: '700',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Biên tập viên ({editorCount})
          </button>
          <button
            onClick={() => setFilterRole('contributor')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: filterRole === 'contributor' ? '1px solid #D97706' : '1px solid #CBD5E1',
              background: filterRole === 'contributor' ? '#FFFBEB' : '#FFF',
              color: filterRole === 'contributor' ? '#D97706' : '#475569',
              fontWeight: '700',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Cộng tác viên ({contributorCount})
          </button>
          <button
            onClick={() => setFilterRole('member')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: filterRole === 'member' ? '1px solid #7C3AED' : '1px solid #CBD5E1',
              background: filterRole === 'member' ? '#F5F3FF' : '#FFF',
              color: filterRole === 'member' ? '#7C3AED' : '#475569',
              fontWeight: '700',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Đoàn viên ({memberCount})
          </button>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #CBD5E1',
              fontSize: '12px',
              fontWeight: '600',
              color: '#334155',
              background: '#FFF'
            }}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">🟢 Đang hoạt động</option>
            <option value="locked">🔴 Đã khóa / Tắt</option>
          </select>
        </div>

        <div style={{ position: 'relative', width: '280px' }}>
          <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '10px', top: '10px', color: '#94A3B8', fontSize: '12px' }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo tên, email, đơn vị..."
            style={{ width: '100%', padding: '7px 10px 7px 30px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '12.5px', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
      </div>

      {/* Users Table */}
      <div style={{ background: '#FFF', border: '1px solid #E2E8F0', borderRadius: '0 0 12px 12px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', color: '#475569', fontSize: '11.5px', fontWeight: '800', textTransform: 'uppercase' }}>
              <th style={{ padding: '12px 16px', width: '50px' }}>STT</th>
              <th style={{ padding: '12px 16px' }}>Cán Bộ &amp; Học Vị</th>
              <th style={{ padding: '12px 16px' }}>Email Công Vụ</th>
              <th style={{ padding: '12px 16px' }}>Đơn Vị Công Tác</th>
              <th style={{ padding: '12px 16px', width: '200px' }}>Phân Quyền Vai Trò</th>
              <th style={{ padding: '12px 16px', width: '140px' }}>Trạng Thái</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', width: '140px' }}>Tắt / Mở Tài Khoản</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ padding: '36px', textAlign: 'center', color: '#94A3B8' }}>
                  <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '8px' }} /> Đang tải danh sách cán bộ...
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: '36px', textAlign: 'center', color: '#94A3B8' }}>
                  Không tìm thấy cán bộ nào phù hợp điều kiện.
                </td>
              </tr>
            ) : (
              filteredUsers.map((u, idx) => {
                const stt = String(idx + 1).padStart(2, '0');
                const roleLower = (u.role || 'Editor').toLowerCase();
                const isActive = u.isActiveBool;

                return (
                  <tr key={u.id || idx} style={{ borderBottom: '1px solid #F1F5F9', background: !isActive ? '#F8FAFC' : '#FFF', opacity: !isActive ? 0.75 : 1 }}>
                    <td style={{ padding: '14px 16px', fontWeight: '700', color: '#94A3B8' }}>{stt}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: roleLower === 'admin' ? '#002855' : (roleLower === 'editor' ? '#0284C7' : '#D97706'),
                          color: '#FFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: '800',
                          overflow: 'hidden',
                          flexShrink: 0
                        }}>
                          {u.avatar ? (
                            <img src={u.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
                          ) : (
                            (u.ho_ten || u.name || 'CB').split(' ').slice(-1)[0].slice(0, 2).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: '700', color: '#002855' }}>{u.ho_ten || u.name}</div>
                          <div style={{ fontSize: '11px', color: '#64748B' }}>{u.position || 'Cán bộ Công đoàn'}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#334155' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{u.email}</span>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#475569' }}>
                      {u.unit || u.department || 'ĐH Thủ Dầu Một'}
                    </td>
                    
                    {/* Inline Role Selector: Thực tế, đổi vai trò gọi thẳng API MSSQL */}
                    <td style={{ padding: '14px 16px' }}>
                      <select
                        value={roleLower}
                        onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '700',
                          border: roleLower === 'admin' ? '1px solid #FECACA' : (roleLower === 'editor' ? '1px solid #BFDBFE' : (roleLower === 'contributor' ? '1px solid #FDE68A' : '1px solid #DDD6FE')),
                          background: roleLower === 'admin' ? '#FEF2F2' : (roleLower === 'editor' ? '#EFF6FF' : (roleLower === 'contributor' ? '#FFFBEB' : '#F5F3FF')),
                          color: roleLower === 'admin' ? '#DC2626' : (roleLower === 'editor' ? '#2563EB' : (roleLower === 'contributor' ? '#D97706' : '#7C3AED')),
                          cursor: 'pointer',
                          outline: 'none'
                        }}
                      >
                        <option value="admin">Quản Trị Viên (Admin)</option>
                        <option value="editor">Biên Tập Viên (Editor)</option>
                        <option value="contributor">Cộng Tác Viên (Contributor)</option>
                        <option value="member">Đoàn Viên (Member)</option>
                      </select>
                    </td>

                    {/* Trạng thái Bật / Tắt */}
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        borderRadius: '9999px',
                        fontSize: '11.5px',
                        fontWeight: '700',
                        background: isActive ? '#DCFCE7' : '#FEE2E2',
                        color: isActive ? '#166534' : '#991B1B',
                        border: `1px solid ${isActive ? '#86EFAC' : '#FCA5A5'}`
                      }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isActive ? '#16A34A' : '#DC2626' }} />
                        {isActive ? 'Đang hoạt động' : 'Đang bị khóa'}
                      </span>
                    </td>

                    {/* Thao tác: Bật / Tắt (Khóa / Kích hoạt) - KHÔNG XÓA */}
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <button
                        onClick={() => handleToggleStatus(u)}
                        title={isActive ? 'Khóa tài khoản này' : 'Mở lại kích hoạt tài khoản'}
                        style={{
                          background: isActive ? '#FFF1F2' : '#F0FDF4',
                          color: isActive ? '#E11D48' : '#16A34A',
                          border: `1px solid ${isActive ? '#FECDD3' : '#BBF7D0'}`,
                          borderRadius: '6px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <i className={`fa-solid ${isActive ? 'fa-lock' : 'fa-lock-open'}`} />
                        <span>{isActive ? 'Khóa tài khoản' : 'Mở kích hoạt'}</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL THÊM CÁN BỘ & CẤP QUYỀN MỚI */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#FFF',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '540px',
            overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
            border: '1px solid #E2E8F0'
          }}>
            <div style={{ padding: '16px 20px', background: '#002855', color: '#FFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '15px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-user-shield" style={{ color: '#38BDF8' }} />
                <span>Thêm Cán Bộ &amp; Cấp Quyền Hệ Thống Mới</span>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#FFF', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Họ và Tên Cán Bộ (*):
                </label>
                <input
                  type="text"
                  required
                  value={newUserForm.name}
                  onChange={e => setNewUserForm({ ...newUserForm, name: e.target.value })}
                  placeholder="VD: TS. Nguyễn Văn A"
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Email Công Vụ (*):
                </label>
                <input
                  type="email"
                  required
                  value={newUserForm.email}
                  onChange={e => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  placeholder="VD: canboa@tdmu.edu.vn"
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Đơn Vị Công Tác:
                  </label>
                  <input
                    type="text"
                    value={newUserForm.unit}
                    onChange={e => setNewUserForm({ ...newUserForm, unit: e.target.value })}
                    placeholder="VD: Viện Công Nghệ Số"
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Chức Danh / Vị Trí:
                  </label>
                  <input
                    type="text"
                    value={newUserForm.position}
                    onChange={e => setNewUserForm({ ...newUserForm, position: e.target.value })}
                    placeholder="VD: Giảng viên, Tổ phó CĐ"
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Cấp Quyền Ban Đầu (*):
                  </label>
                  <select
                    value={newUserForm.role}
                    onChange={e => setNewUserForm({ ...newUserForm, role: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box', fontWeight: '700', color: '#002855' }}
                  >
                    <option value="Admin">Quản Trị Viên (Admin - Toàn quyền)</option>
                    <option value="Editor">Biên Tập Viên (Editor - Viết &amp; duyệt bài)</option>
                    <option value="Contributor">Cộng Tác Viên (Contributor - Viết bài nháp)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Số Điện Thoại:
                  </label>
                  <input
                    type="text"
                    value={newUserForm.phone}
                    onChange={e => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                    placeholder="0274.3815.184"
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Tải ảnh đại diện từ máy tính */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Ảnh Đại Diện Cán Bộ:
                </label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <label style={{
                    background: '#F1F5F9',
                    border: '1px solid #CBD5E1',
                    padding: '8px 14px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '700',
                    color: '#334155',
                    cursor: uploadingAvatar ? 'wait' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <i className={uploadingAvatar ? "fa-solid fa-spinner fa-spin" : "fa-solid fa-cloud-arrow-up"} />
                    <span>{uploadingAvatar ? 'Đang tải...' : 'Chọn ảnh từ máy'}</span>
                    <input type="file" accept="image/*" onChange={handleAvatarUpload} disabled={uploadingAvatar} style={{ display: 'none' }} />
                  </label>
                  <input
                    type="text"
                    value={newUserForm.avatar}
                    onChange={e => setNewUserForm({ ...newUserForm, avatar: e.target.value })}
                    placeholder="Đường dẫn ảnh hoặc chọn từ máy..."
                    style={{ flex: 1, padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '12px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', borderTop: '1px solid #F1F5F9', paddingTop: '14px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#475569', padding: '8px 18px', borderRadius: '6px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  style={{ background: 'linear-gradient(135deg, #002855, #0284C7)', color: '#FFF', border: 'none', padding: '8px 22px', borderRadius: '6px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', boxShadow: '0 2px 6px rgba(2,132,199,0.3)' }}
                >
                  {creating ? 'Đang lưu CSDL...' : 'Tạo Tài Khoản & Cấp Quyền'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
