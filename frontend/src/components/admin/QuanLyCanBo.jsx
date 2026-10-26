import React, { useState, useEffect } from 'react';

export default function QuanLyCanBo({ onOpenAuthModal, currentUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setUsers(data.data);
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

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tài khoản cán bộ "${name}" khỏi hệ thống?`)) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' }).then(r => r.json());
      if (res.success) {
        setUsers(prev => prev.filter(u => u.id !== id));
      }
    } catch (err) {
      alert('Lỗi xóa cán bộ: ' + err.message);
    }
  };

  const filteredUsers = users.map(u => ({
    ...u,
    normalizedRole: (u.role || 'editor').toLowerCase()
  })).filter(u => {
    const matchesSearch = !search ||
      (u.ho_ten || u.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.unit || u.department || '').toLowerCase().includes(search.toLowerCase());

    const matchesRole = filterRole === 'all' || u.normalizedRole === filterRole.toLowerCase();

    return matchesSearch && matchesRole;
  });

  const totalUsers = users.length;
  const adminCount = users.filter(u => (u.role || '').toLowerCase() === 'admin').length;
  const editorCount = users.filter(u => (u.role || '').toLowerCase() === 'editor').length;
  const contributorCount = users.filter(u => (u.role || '').toLowerCase() === 'contributor').length;

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px', background: '#F8FAFC' }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#002855', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="fa-solid fa-users-gear" style={{ color: '#0284C7' }} />
            Quản Lý Tài Khoản & Phân Quyền Cán Bộ
          </h1>
          <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
            Hệ thống phân cấp 3 nhóm vai trò: Quản Trị Viên (Admin), Biên Tập Viên (Editor), Cộng Tác Viên (Contributor)
          </p>
        </div>
        <button
          onClick={onOpenAuthModal}
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
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
      </div>

      {/* Search and Filters */}
      <div style={{ background: '#FFF', padding: '16px 20px', borderRadius: '12px 12px 0 0', border: '1px solid #E2E8F0', borderBottom: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
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
            Tất cả ({totalUsers})
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
              <th style={{ padding: '12px 16px', width: '60px' }}>STT</th>
              <th style={{ padding: '12px 16px' }}>Họ Và Tên Cán Bộ</th>
              <th style={{ padding: '12px 16px' }}>Email Công Vụ</th>
              <th style={{ padding: '12px 16px' }}>Đơn Vị Công Tác</th>
              <th style={{ padding: '12px 16px' }}>Vai Trò / Cấp Quyền</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ padding: '36px', textAlign: 'center', color: '#94A3B8' }}>
                  <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '8px' }} /> Đang tải danh sách cán bộ...
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '36px', textAlign: 'center', color: '#94A3B8' }}>
                  Không tìm thấy cán bộ nào phù hợp điều kiện.
                </td>
              </tr>
            ) : (
              filteredUsers.map((u, idx) => {
                const stt = String(idx + 1).padStart(2, '0');
                const role = (u.normalizedRole || u.role || 'editor').toLowerCase();
                const roleBadge = role === 'admin'
                  ? { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA', text: 'Quản Trị Viên (Admin)' }
                  : role === 'editor'
                  ? { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE', text: 'Biên Tập Viên (Editor)' }
                  : { bg: '#FFFBEB', color: '#D97706', border: '#FDE68A', text: 'Cộng Tác Viên (Contributor)' };

                return (
                  <tr key={u.id || idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '14px 16px', fontWeight: '700', color: '#94A3B8' }}>{stt}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: role === 'admin' ? '#002855' : (role === 'editor' ? '#0284C7' : '#D97706'),
                          color: '#FFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          fontWeight: '800'
                        }}>
                          {(u.ho_ten || u.name || 'CB').split(' ').slice(-1)[0].slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: '700', color: '#002855' }}>{u.ho_ten || u.name}</div>
                          <div style={{ fontSize: '11px', color: '#94A3B8' }}>Mã CB: #CB-{String(u.id || idx + 1).padStart(3, '0')}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#334155' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{u.email}</span>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#475569' }}>
                      {u.unit || u.department || 'ĐH Thủ Dầu Một'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '11.5px',
                        fontWeight: '700',
                        background: roleBadge.bg,
                        color: roleBadge.color,
                        border: `1px solid ${roleBadge.border}`,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: roleBadge.color }} />
                        {roleBadge.text}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      {u.role !== 'admin' ? (
                        <button
                          onClick={() => handleDelete(u.id, u.ho_ten || u.name)}
                          title="Xóa tài khoản"
                          style={{
                            background: '#FEF2F2',
                            color: '#DC2626',
                            border: '1px solid #FECACA',
                            borderRadius: '6px',
                            padding: '5px 10px',
                            fontSize: '11.5px',
                            fontWeight: '700',
                            cursor: 'pointer'
                          }}
                        >
                          <i className="fa-solid fa-trash me-1" /> Xóa
                        </button>
                      ) : (
                        <span style={{ fontSize: '11.5px', color: '#94A3B8', fontWeight: '600' }}>Mặc định</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
