import React, { useState, useEffect } from 'react';

export default function QuanLyCoCauToChuc() {
  const [cadres, setCadres] = useState([]);
  const [units, setUnits] = useState([]);
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'btv' | 'bch' | 'ubkt' | 'units'
  const [search, setSearch] = useState('');

  // Modal State
  const [editingCadre, setEditingCadre] = useState(null); // null = closed, {} = add new, { id, ... } = edit
  const [editingUnit, setEditingUnit] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formCadre, setFormCadre] = useState({
    name: '',
    degree: 'Thạc sĩ',
    role: 'Ủy viên Ban Chấp hành',
    unit: 'Công đoàn Trường TDMU',
    unit_id: 1,
    board_id: 1,
    email: '',
    phone: '',
    photo: 'https://congdoan.tdmu.edu.vn/img/ckeditor/Images/Danh.jpg',
    duties: ''
  });

  const loadOrgData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/org-full-tree').then(r => r.json());
      if (res.success && res.data) {
        setCadres(res.data.cadres || []);
        setUnits(res.data.units || []);
        setBoards(res.data.boards || []);
      }
    } catch (err) {
      console.error('Lỗi tải dữ liệu cơ cấu tổ chức:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrgData();
  }, []);

  const openAddModal = () => {
    setFormCadre({
      name: '',
      degree: 'Thạc sĩ',
      role: 'Ủy viên Ban Chấp hành',
      unit: 'Khoa Công nghệ Thông tin',
      unit_id: units[0]?.id || 1,
      board_id: 1,
      email: '',
      phone: '',
      photo: 'https://congdoan.tdmu.edu.vn/img/ckeditor/Images/Danh.jpg',
      duties: 'Phụ trách công tác chuyên môn và phong trào đoàn viên.'
    });
    setEditingCadre({});
  };

  const openEditModal = (c) => {
    setFormCadre({
      name: c.name || c.HoVaTen || '',
      degree: c.degree || c.HocHamHocVi || 'Thạc sĩ',
      role: c.role || c.ChucVuCongDoan || 'Ủy viên Ban Chấp hành',
      unit: c.unit || c.unit_name || c.ChucVuChuyenMon || 'Công đoàn Trường TDMU',
      unit_id: c.unit_id || c.MaToCongDoan || 1,
      board_id: c.board_id || c.MaToChuc || 1,
      email: c.email || c.Email || '',
      phone: c.phone || c.SoDienThoai || '',
      photo: c.photo || c.HinhAnh || 'https://congdoan.tdmu.edu.vn/img/ckeditor/Images/Danh.jpg',
      duties: c.duties || c.NhiemVuPhanCong || ''
    });
    setEditingCadre(c);
  };

  const handleSaveCadre = async (e) => {
    e.preventDefault();
    if (!formCadre.name.trim()) {
      alert('Vui lòng nhập họ và tên cán bộ!');
      return;
    }
    setSaving(true);
    try {
      const isEdit = Boolean(editingCadre && editingCadre.id);
      const url = isEdit ? `/api/members/${editingCadre.id}` : '/api/members';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formCadre)
      }).then(r => r.json());

      if (res.success) {
        alert(`🎉 ${res.message || (isEdit ? 'Cập nhật thành công!' : 'Thêm cán bộ mới thành công!')}`);
        setEditingCadre(null);
        await loadOrgData();
      } else {
        alert('Lỗi: ' + (res.error || 'Không thể lưu thông tin'));
      }
    } catch (err) {
      alert('Lỗi kết nối máy chủ: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCadre = async (id, name) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa cán bộ "${name}" khỏi cơ cấu tổ chức Công đoàn?`)) return;
    try {
      const res = await fetch(`/api/members/${id}`, { method: 'DELETE' }).then(r => r.json());
      if (res.success) {
        setCadres(prev => prev.filter(c => c.id !== id && c.MaNhanSu !== id));
        alert('✅ Đã xóa cán bộ thành công!');
      } else {
        alert('Lỗi: ' + (res.error || 'Không thể xóa'));
      }
    } catch (err) {
      alert('Lỗi kết nối: ' + err.message);
    }
  };

  const handleSaveUnit = async (e) => {
    e.preventDefault();
    if (!editingUnit) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/to-cong-doan/${editingUnit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingUnit)
      }).then(r => r.json());
      if (res.success) {
        alert('🎉 Đã cập nhật thông tin Tổ Công đoàn thành công!');
        setEditingUnit(null);
        await loadOrgData();
      } else {
        alert('Lỗi: ' + (res.error || 'Không thể cập nhật'));
      }
    } catch (err) {
      alert('Lỗi kết nối: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Lọc theo Ban
  const countBTV = cadres.filter(c => {
    const r = (c.role || c.ChucVuCongDoan || '').toLowerCase();
    return r.includes('chủ tịch') || r.includes('thường vụ') || c.board_id === 1;
  }).length;

  const countBCH = cadres.filter(c => {
    const r = (c.role || c.ChucVuCongDoan || '').toLowerCase();
    return c.board_id === 1 || r.includes('bch') || r.includes('chấp hành') || r.includes('chủ tịch');
  }).length;

  const countUBKT = cadres.filter(c => {
    const r = (c.role || c.ChucVuCongDoan || '').toLowerCase();
    return c.board_id === 2 || r.includes('ubkt') || r.includes('kiểm tra');
  }).length;

  const filteredCadres = cadres.filter(c => {
    const r = (c.role || c.ChucVuCongDoan || '').toLowerCase();
    const matchTab =
      filterTab === 'all' ? true :
      filterTab === 'btv' ? (r.includes('chủ tịch') || r.includes('thường vụ') || c.board_id === 1) :
      filterTab === 'bch' ? (c.board_id === 1 || r.includes('bch') || r.includes('chấp hành') || r.includes('chủ tịch')) :
      filterTab === 'ubkt' ? (c.board_id === 2 || r.includes('ubkt') || r.includes('kiểm tra')) : true;

    const q = search.trim().toLowerCase();
    const matchSearch = !q ? true :
      (c.name || c.HoVaTen || '').toLowerCase().includes(q) ||
      (c.role || c.ChucVuCongDoan || '').toLowerCase().includes(q) ||
      (c.unit || c.unit_name || c.ChucVuChuyenMon || '').toLowerCase().includes(q) ||
      (c.email || c.Email || '').toLowerCase().includes(q);

    return matchTab && matchSearch;
  });

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: '#F8FAFC', padding: '28px 36px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#002855', margin: '0 0 6px 0' }}>
            <i className="fa-solid fa-sitemap" style={{ marginRight: '10px', color: '#0284C7' }} />
            Quản Lý Cơ Cấu Tổ Chức & Cán Bộ Công Đoàn
          </h1>
          <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
            Cập nhật nhân sự Ban Thường Vụ, Ban Chấp Hành, Ủy Ban Kiểm Tra và 16 Tổ Công đoàn cơ sở trực tiếp vào CSDL Microsoft SQL Server
          </p>
        </div>
        <button
          onClick={openAddModal}
          style={{
            background: 'linear-gradient(135deg, #002855 0%, #0284C7 100%)',
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
            boxShadow: '0 4px 12px rgba(2,132,199,0.25)'
          }}
        >
          <i className="fa-solid fa-user-plus" /> Thêm Cán Bộ Mới
        </button>
      </div>

      {/* Thẻ Thống Kê Nhanh */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#FFF', borderRadius: '10px', padding: '16px 20px', border: '1px solid #E2E8F0', borderLeft: '4px solid #002855' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Tổng Số Cán Bộ</div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#002855', marginTop: '4px' }}>{cadres.length}</div>
        </div>
        <div style={{ background: '#FFF', borderRadius: '10px', padding: '16px 20px', border: '1px solid #E2E8F0', borderLeft: '4px solid #F59E0B' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Ban Thường Vụ</div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#D97706', marginTop: '4px' }}>{countBTV}</div>
        </div>
        <div style={{ background: '#FFF', borderRadius: '10px', padding: '16px 20px', border: '1px solid #E2E8F0', borderLeft: '4px solid #2563EB' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Ban Chấp Hành</div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#2563EB', marginTop: '4px' }}>{countBCH}</div>
        </div>
        <div style={{ background: '#FFF', borderRadius: '10px', padding: '16px 20px', border: '1px solid #E2E8F0', borderLeft: '4px solid #16A34A' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Ủy Ban Kiểm Tra</div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#16A34A', marginTop: '4px' }}>{countUBKT}</div>
        </div>
        <div style={{ background: '#FFF', borderRadius: '10px', padding: '16px 20px', border: '1px solid #E2E8F0', borderLeft: '4px solid #DC2626' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Tổ Công Đoàn Cơ Sở</div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#DC2626', marginTop: '4px' }}>{units.length}</div>
        </div>
      </div>

      {/* Tabs & Tìm kiếm */}
      <div style={{ background: '#FFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '16px 20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: `Tất cả (${cadres.length})`, color: '#002855' },
            { id: 'btv', label: `Ban Thường Vụ (${countBTV})`, color: '#D97706' },
            { id: 'bch', label: `Ban Chấp Hành (${countBCH})`, color: '#2563EB' },
            { id: 'ubkt', label: `Ủy Ban Kiểm Tra (${countUBKT})`, color: '#16A34A' },
            { id: 'units', label: `16 Tổ Công Đoàn (${units.length})`, color: '#DC2626' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id)}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '700',
                border: filterTab === tab.id ? `1px solid ${tab.color}` : '1px solid #CBD5E1',
                background: filterTab === tab.id ? tab.color : '#FFF',
                color: filterTab === tab.id ? '#FFF' : '#475569',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {filterTab !== 'units' && (
          <div style={{ display: 'flex', alignItems: 'center', background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '6px 12px', width: '300px' }}>
            <i className="fa-solid fa-magnifying-glass" style={{ color: '#94A3B8', marginRight: '8px' }} />
            <input
              type="text"
              placeholder="Tìm theo họ tên, chức vụ, đơn vị..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '13px', color: '#1E293B' }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ border: 'none', background: 'transparent', color: '#94A3B8', cursor: 'pointer', padding: 0 }}>
                <i className="fa-solid fa-xmark" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* NỘI DUNG 1: BẢNG CÁN BỘ CÔNG ĐOÀN */}
      {filterTab !== 'units' && (
        <div style={{ background: '#FFF', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
              <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '24px', marginBottom: '10px', color: '#0284C7' }} />
              <div>Đang tải danh sách cơ cấu cán bộ từ SQL Server...</div>
            </div>
          ) : filteredCadres.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
              <i className="fa-regular fa-folder-open" style={{ fontSize: '32px', marginBottom: '10px', color: '#CBD5E1' }} />
              <div>Không tìm thấy cán bộ nào</div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
              <thead>
                <tr style={{ background: '#F1F5F9', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: '700' }}>
                  <th style={{ padding: '14px 16px', width: '60px', textAlign: 'center' }}>STT</th>
                  <th style={{ padding: '14px 16px', width: '70px', textAlign: 'center' }}>Ảnh</th>
                  <th style={{ padding: '14px 16px' }}>Họ Và Tên / Học Vị</th>
                  <th style={{ padding: '14px 16px', width: '220px' }}>Chức Vụ Công Đoàn</th>
                  <th style={{ padding: '14px 16px', width: '220px' }}>Đơn Vị Chuyên Môn</th>
                  <th style={{ padding: '14px 16px', width: '180px' }}>Email / SĐT</th>
                  <th style={{ padding: '14px 16px', width: '130px', textAlign: 'center' }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredCadres.map((c, idx) => {
                  const roleStr = c.role || c.ChucVuCongDoan || 'Ủy viên';
                  const isPresident = roleStr.toLowerCase().includes('chủ tịch');
                  const isVice = roleStr.toLowerCase().includes('phó');
                  const isUbkt = roleStr.toLowerCase().includes('ubkt') || roleStr.toLowerCase().includes('kiểm tra');

                  return (
                    <tr
                      key={c.id || idx}
                      style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s ease' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '700', color: '#64748B' }}>
                        {String(idx + 1).padStart(2, '0')}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <img
                          src={c.photo || c.HinhAnh || 'https://congdoan.tdmu.edu.vn/img/ckeditor/Images/Danh.jpg'}
                          alt={c.name}
                          style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #E2E8F0' }}
                          onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'; }}
                        />
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: '700', color: '#002855' }}>
                          {c.name || c.HoVaTen}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748B' }}>
                          <span style={{ background: '#EFF6FF', color: '#1D4ED8', padding: '1px 6px', borderRadius: '4px', fontWeight: '600', marginRight: '6px' }}>
                            {c.degree || c.HocHamHocVi || 'Cử nhân'}
                          </span>
                          Mã: #{c.code || c.MaCanBo || `CB_${c.id}`}
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '700',
                          background: isPresident ? '#FEF3C7' : (isVice ? '#E0F2FE' : (isUbkt ? '#DCFCE7' : '#F1F5F9')),
                          color: isPresident ? '#B45309' : (isVice ? '#0369A1' : (isUbkt ? '#15803D' : '#334155'))
                        }}>
                          {roleStr}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', color: '#334155', fontSize: '13px' }}>
                        <div>{c.unit || c.unit_name || c.ChucVuChuyenMon || 'ĐH Thủ Dầu Một'}</div>
                        {c.duties && (
                          <div style={{ fontSize: '11px', color: '#64748B', display: '-webkit-box', WebKitLineClamp: 1, WebKitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {c.duties}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '12px', color: '#64748B' }}>
                        <div><i className="fa-solid fa-envelope me-1" style={{ color: '#0284C7' }} /> {c.email || c.Email || 'Chưa cập nhật'}</div>
                        {c.phone && <div><i className="fa-solid fa-phone me-1" style={{ color: '#16A34A' }} /> {c.phone}</div>}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            onClick={() => openEditModal(c)}
                            title="Chỉnh sửa thông tin cán bộ"
                            style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8', borderRadius: '6px', padding: '5px 8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                          >
                            <i className="fa-solid fa-pen-to-square" />
                          </button>
                          <button
                            onClick={() => handleDeleteCadre(c.id || c.MaNhanSu, c.name || c.HoVaTen)}
                            title="Xóa cán bộ"
                            style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', borderRadius: '6px', padding: '5px 8px', fontSize: '12px', cursor: 'pointer' }}
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
          )}
        </div>
      )}

      {/* NỘI DUNG 2: BẢNG 16 TỔ CÔNG ĐOÀN */}
      {filterTab === 'units' && (
        <div style={{ background: '#FFF', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
            <thead>
              <tr style={{ background: '#F1F5F9', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: '700' }}>
                <th style={{ padding: '14px 16px', width: '70px', textAlign: 'center' }}>Mã Tổ</th>
                <th style={{ padding: '14px 16px' }}>Tên Tổ Công Đoàn Trực Thuộc</th>
                <th style={{ padding: '14px 16px', width: '220px' }}>Tổ Trưởng Phụ Trách</th>
                <th style={{ padding: '14px 16px', width: '220px' }}>Email Liên Hệ</th>
                <th style={{ padding: '14px 16px', width: '140px', textAlign: 'center' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {units.map((u) => (
                <tr key={u.id || u.MaToCongDoan} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#0284C7', background: '#E0F2FE', padding: '2px 8px', borderRadius: '4px' }}>
                      {u.code || u.MaDinhDanh || `TCD${u.id}`}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: '700', color: '#002855' }}>
                    {u.name || u.TenToCongDoan}
                  </td>
                  <td style={{ padding: '14px 16px', color: '#1E293B' }}>
                    <i className="fa-solid fa-user-tie me-1 text-primary" /> {u.leader || u.ToTruong || 'Chưa phân công'}
                  </td>
                  <td style={{ padding: '14px 16px', color: '#64748B', fontSize: '12.5px' }}>
                    <i className="fa-solid fa-envelope me-1 text-secondary" /> {u.email || u.EmailLienHe || 'congdoan@tdmu.edu.vn'}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <button
                      onClick={() => setEditingUnit({ ...u })}
                      style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8', borderRadius: '6px', padding: '5px 12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                    >
                      <i className="fa-solid fa-pen" /> Sửa thông tin
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL THÊM / CHỈNH SỬA CÁN BỘ */}
      {editingCadre && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '12px', width: '100%', maxWidth: '640px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
            <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg,#002855,#0284C7)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '16px', fontWeight: '800' }}>
                <i className="fa-solid fa-user-pen me-2" /> {editingCadre.id ? 'Cập Nhật Hồ Sơ Cán Bộ' : 'Thêm Cán Bộ Vào Cơ Cấu Tổ Chức'}
              </div>
              <button onClick={() => setEditingCadre(null)} style={{ background: 'none', border: 'none', color: '#E2E8F0', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleSaveCadre} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '78vh', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Họ Và Tên (*):</label>
                  <input
                    type="text"
                    required
                    value={formCadre.name}
                    onChange={e => setFormCadre({ ...formCadre, name: e.target.value })}
                    placeholder="VD: ThS. Nguyễn Minh Danh"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Học Hàm / Học Vị:</label>
                  <select
                    value={formCadre.degree}
                    onChange={e => setFormCadre({ ...formCadre, degree: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px' }}
                  >
                    <option value="Tiến sĩ">Tiến sĩ</option>
                    <option value="Thạc sĩ">Thạc sĩ</option>
                    <option value="Cử nhân">Cử nhân</option>
                    <option value="Kỹ sư">Kỹ sư</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Chức Vụ Công Đoàn:</label>
                  <input
                    type="text"
                    required
                    value={formCadre.role}
                    onChange={e => setFormCadre({ ...formCadre, role: e.target.value })}
                    placeholder="VD: Phó Chủ tịch Công đoàn, Chủ nhiệm UBKT"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Thuộc Cơ Quan Lãnh Đạo:</label>
                  <select
                    value={formCadre.board_id}
                    onChange={e => setFormCadre({ ...formCadre, board_id: parseInt(e.target.value) })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px' }}
                  >
                    <option value={1}>Ban Chấp Hành / Ban Thường Vụ</option>
                    <option value={2}>Ủy Ban Kiểm Tra</option>
                    <option value={3}>Ban Nữ Công Quần Chúng</option>
                    <option value={4}>Tổ Công Đoàn Cơ Sở</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Đơn Vị Chuyên Môn / Khoa:</label>
                  <input
                    type="text"
                    value={formCadre.unit}
                    onChange={e => setFormCadre({ ...formCadre, unit: e.target.value })}
                    placeholder="VD: Phòng Quản lý Khoa học"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Trực Thuộc Tổ Công Đoàn:</label>
                  <select
                    value={formCadre.unit_id}
                    onChange={e => setFormCadre({ ...formCadre, unit_id: parseInt(e.target.value) })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px' }}
                  >
                    {units.map(u => (
                      <option key={u.id} value={u.id}>{u.code || `TCD${u.id}`} - {u.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Email TDMU:</label>
                  <input
                    type="email"
                    value={formCadre.email}
                    onChange={e => setFormCadre({ ...formCadre, email: e.target.value })}
                    placeholder="canbo@tdmu.edu.vn"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Số Điện Thoại:</label>
                  <input
                    type="text"
                    value={formCadre.phone}
                    onChange={e => setFormCadre({ ...formCadre, phone: e.target.value })}
                    placeholder="0912.xxx.xxx"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Link Ảnh Đại Diện (Avatar):</label>
                <input
                  type="text"
                  value={formCadre.photo}
                  onChange={e => setFormCadre({ ...formCadre, photo: e.target.value })}
                  placeholder="https://... hoặc /uploads/avatar.jpg"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Nhiệm Vụ Phân Công Chi Tiết:</label>
                <textarea
                  rows={3}
                  value={formCadre.duties}
                  onChange={e => setFormCadre({ ...formCadre, duties: e.target.value })}
                  placeholder="Phụ trách công tác chuyên môn, kiểm tra giám sát và các phong trào thi đua..."
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEditingCadre(null)}
                  style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#475569', padding: '8px 16px', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ background: '#0284C7', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}
                >
                  {saving ? 'Đang lưu...' : (editingCadre.id ? 'Cập Nhật Hồ Sơ' : 'Lưu Cán Bộ Mới')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CHỈNH SỬA TỔ CÔNG ĐOÀN */}
      {editingUnit && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '12px', width: '100%', maxWidth: '520px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
            <div style={{ padding: '16px 20px', background: '#002855', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '16px', fontWeight: '800' }}>
                <i className="fa-solid fa-pen-to-square me-2" /> Cập Nhật Thông Tin Tổ Công Đoàn
              </div>
              <button onClick={() => setEditingUnit(null)} style={{ background: 'none', border: 'none', color: '#E2E8F0', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleSaveUnit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Tên Tổ Công Đoàn (*):</label>
                <input
                  type="text"
                  required
                  value={editingUnit.name || editingUnit.TenToCongDoan || ''}
                  onChange={e => setEditingUnit({ ...editingUnit, name: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Tổ Trưởng Phụ Trách (*):</label>
                <input
                  type="text"
                  required
                  value={editingUnit.leader || editingUnit.ToTruong || ''}
                  onChange={e => setEditingUnit({ ...editingUnit, leader: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Email Liên Hệ:</label>
                <input
                  type="email"
                  value={editingUnit.email || editingUnit.EmailLienHe || ''}
                  onChange={e => setEditingUnit({ ...editingUnit, email: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEditingUnit(null)}
                  style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#475569', padding: '8px 16px', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ background: '#002855', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}
                >
                  {saving ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
