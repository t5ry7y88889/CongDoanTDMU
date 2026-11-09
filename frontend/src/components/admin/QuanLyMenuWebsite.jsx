import React, { useState, useEffect } from 'react';

export default function QuanLyMenuWebsite() {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingMenu, setEditingMenu] = useState(null); // null = closed, {} = add, { id, ... } = edit
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    url: '',
    order: 1,
    icon: 'fa-link',
    targetBlank: false,
    isActive: true
  });

  const loadMenus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/navigation-menus?all=true').then(r => r.json());
      if (res.success && Array.isArray(res.data)) {
        setMenus(res.data);
      }
    } catch (err) {
      console.error('Lỗi nạp menu điều hướng:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenus();
  }, []);

  const openAddModal = () => {
    setFormData({
      title: '',
      url: '',
      order: menus.length + 1,
      icon: 'fa-link',
      targetBlank: false,
      isActive: true
    });
    setEditingMenu({});
  };

  const openEditModal = (m) => {
    setFormData({
      title: m.title || '',
      url: m.url || '',
      order: m.order !== undefined ? m.order : 0,
      icon: m.icon || 'fa-link',
      targetBlank: Boolean(m.targetBlank),
      isActive: m.isActive !== false
    });
    setEditingMenu(m);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Vui lòng nhập tiêu đề menu!');
      return;
    }
    if (!formData.url.trim()) {
      alert('Vui lòng nhập đường dẫn liên kết URL!');
      return;
    }

    setSaving(true);
    try {
      const isEdit = Boolean(editingMenu && editingMenu.id);
      const url = isEdit ? `/api/navigation-menus/${editingMenu.id}` : '/api/navigation-menus';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      }).then(r => r.json());

      if (res.success) {
        alert(`🎉 ${res.message || 'Đã lưu mục menu thành công!'}`);
        setEditingMenu(null);
        await loadMenus();
      } else {
        alert('Lỗi: ' + (res.error || 'Không thể lưu mục menu'));
      }
    } catch (err) {
      alert('Lỗi kết nối máy chủ: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (id, currentActive) => {
    try {
      const res = await fetch(`/api/navigation-menus/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentActive })
      }).then(r => r.json());

      if (res.success) {
        setMenus(prev => prev.map(m => m.id === id ? { ...m, isActive: !currentActive } : m));
      } else {
        alert('Lỗi: ' + (res.error || 'Không thể cập nhật'));
      }
    } catch (err) {
      alert('Lỗi kết nối: ' + err.message);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa mục menu "${title}" khỏi thanh điều hướng website?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/navigation-menus/${id}`, { method: 'DELETE' }).then(r => r.json());
      if (res.success) {
        setMenus(prev => prev.filter(m => m.id !== id));
        alert('✅ Đã xóa mục menu thành công!');
      } else {
        alert('Lỗi: ' + (res.error || 'Không thể xóa'));
      }
    } catch (err) {
      alert('Lỗi kết nối: ' + err.message);
    }
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: '#F8FAFC', padding: '28px 36px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#002855', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="fa-solid fa-compass" style={{ color: '#10B981' }} />
            Quản Trị Menu Điều Hướng Website (Portal Navigation)
          </h1>
          <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
            Quản trị danh mục menu thanh điều hướng trên website portal, cập nhật thứ tự, đường dẫn và trạng thái trực tiếp từ CSDL MSSQL (dbo.NAVIGATION_MENUS)
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={loadMenus}
            style={{
              background: '#FFFFFF',
              color: '#002855',
              border: '1px solid #CBD5E1',
              padding: '10px 16px',
              borderRadius: '8px',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <i className="fa-solid fa-rotate" /> Làm Mới
          </button>
          <button
            onClick={openAddModal}
            style={{
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              fontWeight: '700',
              fontSize: '13.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(16,185,129,0.3)'
            }}
          >
            <i className="fa-solid fa-plus" /> Thêm Mục Menu Mới
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#FFF', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
            <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '24px', marginBottom: '10px', color: '#10B981' }} />
            <div>Đang tải danh sách menu từ SQL Server...</div>
          </div>
        ) : menus.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
            <i className="fa-regular fa-compass" style={{ fontSize: '32px', marginBottom: '10px', color: '#CBD5E1' }} />
            <div>Chưa có mục menu nào. Hãy bấm "+ Thêm Mục Menu Mới".</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
              <thead>
                <tr style={{ background: '#F1F5F9', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: '700' }}>
                  <th style={{ padding: '14px 16px', width: '60px', textAlign: 'center' }}>STT</th>
                  <th style={{ padding: '14px 16px', minWidth: '220px' }}>Tiêu Đề Menu</th>
                  <th style={{ padding: '14px 16px', minWidth: '220px' }}>Đường Dẫn Liên Kết (URL)</th>
                  <th style={{ padding: '14px 16px', width: '100px', textAlign: 'center' }}>Thứ Tự</th>
                  <th style={{ padding: '14px 16px', width: '140px', textAlign: 'center' }}>Mở Cửa Sổ Mới</th>
                  <th style={{ padding: '14px 16px', width: '140px', textAlign: 'center' }}>Trạng Thái</th>
                  <th style={{ padding: '14px 16px', width: '160px', textAlign: 'center' }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {menus.map((m, index) => {
                  const active = m.isActive !== false;
                  return (
                    <tr
                      key={m.id}
                      style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                      onMouseLeave={e => e.currentTarget.style.background = '#FFF'}
                    >
                      <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '600', color: '#64748B' }}>
                        {index + 1}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ width: '30px', height: '30px', borderRadius: '6px', background: '#F1F5F9', color: '#002855', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}>
                            <i className={`fa-solid ${m.icon || 'fa-link'}`} />
                          </span>
                          <strong style={{ color: '#002855', fontSize: '14px' }}>{m.title}</strong>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '13px' }}>
                        <code style={{ background: '#F1F5F9', padding: '3px 8px', borderRadius: '4px', color: '#0284C7', fontFamily: 'monospace' }}>
                          {m.url}
                        </code>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '700', color: '#334155' }}>
                        {m.order || 0}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        {m.targetBlank ? (
                          <span style={{ background: '#E0E7FF', color: '#3730A3', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>
                            Tab mới (_blank)
                          </span>
                        ) : (
                          <span style={{ background: '#F1F5F9', color: '#475569', padding: '3px 8px', borderRadius: '4px', fontSize: '11px' }}>
                            Cùng tab
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        {active ? (
                          <span style={{ background: '#DEF7EC', color: '#03543F', padding: '4px 10px', borderRadius: '999px', fontSize: '11.5px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <i className="fa-solid fa-circle-check" /> Hiển thị
                          </span>
                        ) : (
                          <span style={{ background: '#F3F4F6', color: '#4B5563', padding: '4px 10px', borderRadius: '999px', fontSize: '11.5px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <i className="fa-solid fa-eye-slash" /> Tạm ẩn
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            onClick={() => openEditModal(m)}
                            title="Sửa mục menu"
                            style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8', borderRadius: '6px', padding: '6px 10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                          >
                            <i className="fa-solid fa-pen-to-square me-1" /> Sửa
                          </button>
                          <button
                            onClick={() => handleToggleActive(m.id, active)}
                            title={active ? 'Tạm ẩn menu này' : 'Bật hiển thị menu này'}
                            style={{ background: active ? '#FEF3C7' : '#DEF7EC', border: 'none', color: active ? '#B45309' : '#03543F', borderRadius: '6px', padding: '6px 10px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                          >
                            <i className={`fa-solid ${active ? 'fa-eye-slash' : 'fa-eye'}`} />
                          </button>
                          <button
                            onClick={() => handleDelete(m.id, m.title)}
                            title="Xóa menu"
                            style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', borderRadius: '6px', padding: '6px 10px', fontSize: '12px', cursor: 'pointer' }}
                          >
                            <i className="fa-solid fa-trash" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Add / Edit Menu */}
      {editingMenu && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '12px', width: '100%', maxWidth: '520px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
            <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg,#002855,#0284C7)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '16px', fontWeight: '800' }}>
                <i className="fa-solid fa-compass me-2" />
                {editingMenu.id ? `Chỉnh Sửa Mục Menu: ${formData.title}` : 'Thêm Mục Menu Điều Hướng Mới'}
              </div>
              <button onClick={() => setEditingMenu(null)} style={{ background: 'none', border: 'none', color: '#E2E8F0', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleSave} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Tiêu Đề Menu (*):</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    placeholder="VD: Hoạt Động Đoàn Thể"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Thứ Tự:</label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={e => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Đường Dẫn Liên Kết (URL) (*):</label>
                <input
                  type="text"
                  required
                  value={formData.url}
                  onChange={e => setFormData({ ...formData, url: e.target.value })}
                  placeholder="index.html, tin-tuc.html hoặc https://..."
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px', fontFamily: 'monospace' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Icon FontAwesome:</label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={e => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="fa-house, fa-newspaper, fa-link..."
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px', fontFamily: 'monospace' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '20px', alignItems: 'center', background: '#F8FAFC', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#334155' }}>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                    style={{ width: '16px', height: '16px' }}
                  />
                  <span>Hiển thị trên website</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#334155' }}>
                  <input
                    type="checkbox"
                    checked={formData.targetBlank}
                    onChange={e => setFormData({ ...formData, targetBlank: e.target.checked })}
                    style={{ width: '16px', height: '16px' }}
                  />
                  <span>Mở tab mới (_blank)</span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEditingMenu(null)}
                  style={{ padding: '8px 16px', border: '1px solid #CBD5E1', borderRadius: '6px', background: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ padding: '8px 20px', border: 'none', borderRadius: '6px', background: '#10B981', color: 'white', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
                >
                  {saving ? 'Đang lưu...' : (editingMenu.id ? 'Lưu Thay Đổi' : 'Thêm Mục Menu')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
