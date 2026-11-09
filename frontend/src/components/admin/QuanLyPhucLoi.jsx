import React, { useState, useEffect } from 'react';

const CATEGORIES = [
  { id: 'all', label: 'Tất Cả Chuyên Mục' },
  { id: 'le_tet', label: 'Chăm Lo Lễ Tết & Kỷ Niệm', color: '#D97706', bg: '#FEF3C7', icon: 'fa-gift' },
  { id: 'tro_cap', label: 'Trợ Cấp Khó Khăn & Hiếu Hỷ', color: '#2563EB', bg: '#EFF6FF', icon: 'fa-hand-holding-heart' },
  { id: 'vay_von', label: 'Vay Vốn Quỹ Trợ Vốn CEP', color: '#059669', bg: '#ECFDF5', icon: 'fa-sack-dollar' },
  { id: 'y_te', label: 'Khám Sức Khỏe & Tầm Soát', color: '#16A34A', bg: '#F0FDF4', icon: 'fa-notes-medical' },
  { id: 'nu_cong', label: 'Nữ Công & Trẻ Em', color: '#DB2777', bg: '#FDF2F8', icon: 'fa-children' },
  { id: 'uu_dai', label: 'Ưu Đãi Đoàn Viên', color: '#4B5563', bg: '#F3F4F6', icon: 'fa-tags' }
];

export default function QuanLyPhucLoi() {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState('all');
  const [search, setSearch] = useState('');
  const [editingPolicy, setEditingPolicy] = useState(null); // null = closed, {} = add, { id... } = edit
  const [saving, setSaving] = useState(false);

  // Form State
  const [form, setForm] = useState({
    code: '',
    title: '',
    category: 'le_tet',
    target: 'Toàn thể đoàn viên, cán bộ, giảng viên, người lao động Trường ĐH Thủ Dầu Một',
    date: new Date().toISOString().split('T')[0],
    description: '',
    file_url: '/uploads/welfare/Quy_Dinh_Cham_Lo_Doan_Vien_2026.pdf',
    file_size: '2.5 MB'
  });

  const loadPolicies = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/welfare').then(r => r.json());
      if (res.success && Array.isArray(res.data)) {
        setPolicies(res.data);
      }
    } catch (err) {
      console.error('Lỗi nạp danh sách phúc lợi:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPolicies();
  }, []);

  const openAddModal = () => {
    setForm({
      code: `${Math.floor(Math.random() * 80) + 10}/QĐ-CĐCS`,
      title: '',
      category: 'le_tet',
      target: 'Toàn thể đoàn viên, cán bộ, giảng viên, người lao động Trường ĐH Thủ Dầu Một',
      date: new Date().toISOString().split('T')[0],
      description: '',
      file_url: '/uploads/welfare/Quy_Che_Phuc_Loi_2026.pdf',
      file_size: '2.4 MB'
    });
    setEditingPolicy({});
  };

  const openEditModal = (p) => {
    setForm({
      code: p.code || '',
      title: p.title || '',
      category: p.category || 'le_tet',
      target: p.target || p.target_audience || p.DoiTuongHuong || '',
      date: (p.date || '').split('T')[0] || new Date().toISOString().split('T')[0],
      description: p.description || p.MoTaNgan || '',
      file_url: p.file_url || p.FileDinhKemUrl || '',
      file_size: p.file_size || '2.0 MB'
    });
    setEditingPolicy(p);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      alert('Vui lòng nhập trích yếu / tiêu đề văn bản chính sách!');
      return;
    }
    setSaving(true);
    try {
      const isEdit = Boolean(editingPolicy && editingPolicy.id);
      const url = isEdit ? `/api/welfare/${editingPolicy.id}` : '/api/welfare';
      const method = isEdit ? 'PUT' : 'POST';

      const payload = {
        ...form,
        issuer: 'Ban Thường Vụ Công Đoàn TDMU',
        status: 'published'
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(r => r.json());

      if (res.success) {
        alert(`🎉 ${isEdit ? 'Đã cập nhật văn bản phúc lợi!' : 'Đã đăng tải văn bản phúc lợi mới!'}`);
        setEditingPolicy(null);
        await loadPolicies();
      } else {
        alert('Lỗi: ' + (res.error || 'Không thể lưu văn bản'));
      }
    } catch (err) {
      alert('Lỗi kết nối máy chủ: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa văn bản "${title}" khỏi Kho Phúc Lợi?`)) return;
    try {
      const res = await fetch(`/api/welfare/${id}`, { method: 'DELETE' }).then(r => r.json());
      if (res.success) {
        setPolicies(prev => prev.filter(p => p.id !== id));
        alert('✅ Đã xóa văn bản phúc lợi thành công!');
      } else {
        alert('Lỗi: ' + (res.error || 'Không thể xóa'));
      }
    } catch (err) {
      alert('Lỗi kết nối: ' + err.message);
    }
  };

  const filtered = policies.filter(p => {
    const matchesCat = filterCat === 'all' || p.category === filterCat;
    const q = search.toLowerCase().trim();
    if (!q) return matchesCat;
    const code = (p.code || '').toLowerCase();
    const title = (p.title || '').toLowerCase();
    const desc = (p.description || '').toLowerCase();
    return matchesCat && (code.includes(q) || title.includes(q) || desc.includes(q));
  });

  const getCatBadge = (catKey) => {
    const c = CATEGORIES.find(x => x.id === catKey) || CATEGORIES[1];
    return (
      <span style={{ background: c.bg, color: c.color, padding: '4px 9px', borderRadius: '4px', fontSize: '11.5px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
        <i className={`fa-solid ${c.icon}`} /> {c.label}
      </span>
    );
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: '#F8FAFC', padding: '28px 36px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#002855', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="fa-solid fa-hand-holding-heart" style={{ color: '#F59E0B' }} />
            Quản Lý Văn Bản &amp; Chính Sách Phúc Lợi (Kho Văn Bản Phúc Lợi)
          </h1>
          <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
            Đăng tải và quản lý các văn bản quy chế, kế hoạch chăm lo đoàn viên đính kèm file PDF chính thức từ CSDL Microsoft SQL Server
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={loadPolicies}
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
              background: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)',
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
              boxShadow: '0 4px 12px rgba(220,38,38,0.3)'
            }}
          >
            <i className="fa-solid fa-file-circle-plus" /> Thêm Văn Bản Phúc Lợi (PDF)
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#FFF', borderRadius: '10px', padding: '16px 20px', border: '1px solid #E2E8F0', borderLeft: '4px solid #DC2626' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Tổng Văn Bản Phúc Lợi</div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#002855', marginTop: '4px' }}>{policies.length} văn bản</div>
        </div>
        <div style={{ background: '#FFF', borderRadius: '10px', padding: '16px 20px', border: '1px solid #E2E8F0', borderLeft: '4px solid #2563EB' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Chuyên Mục Chăm Lo</div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#2563EB', marginTop: '4px' }}>
            {new Set(policies.map(p => p.category)).size} danh mục
          </div>
        </div>
        <div style={{ background: '#FFF', borderRadius: '10px', padding: '16px 20px', border: '1px solid #E2E8F0', borderLeft: '4px solid #10B981' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Tổng Lượt Tải Tệp PDF</div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#059669', marginTop: '4px' }}>
            {policies.reduce((acc, p) => acc + (parseInt(p.downloads_count || p.LuotTai) || 0), 0)} lượt
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div style={{ background: '#FFF', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '14px 20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setFilterCat(cat.id)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '12.5px',
                fontWeight: filterCat === cat.id ? '700' : '600',
                cursor: 'pointer',
                background: filterCat === cat.id ? '#DC2626' : '#F1F5F9',
                color: filterCat === cat.id ? '#FFFFFF' : '#475569'
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
        <div style={{ position: 'relative', width: '280px' }}>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo số hiệu, trích yếu..."
            style={{ width: '100%', padding: '8px 12px 8px 34px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
          />
          <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', fontSize: '12px' }} />
        </div>
      </div>

      {/* Policies Table */}
      <div style={{ background: '#FFF', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748B' }}>
            <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '28px', color: '#DC2626', marginBottom: '12px' }} />
            <div>Đang tải kho văn bản phúc lợi từ MSSQL...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748B' }}>
            <i className="fa-regular fa-folder-open" style={{ fontSize: '36px', color: '#CBD5E1', marginBottom: '10px' }} />
            <div>Không tìm thấy văn bản chính sách phúc lợi nào</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
            <thead>
              <tr style={{ background: '#F1F5F9', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: '700' }}>
                <th style={{ padding: '14px 16px', width: '130px' }}>Số / Ký Hiệu</th>
                <th style={{ padding: '14px 16px' }}>Trích Yếu &amp; Nội Dung Quy Định</th>
                <th style={{ padding: '14px 16px', width: '200px' }}>Chuyên Mục</th>
                <th style={{ padding: '14px 16px', width: '120px' }}>Ngày Ban Hành</th>
                <th style={{ padding: '14px 16px', width: '180px' }}>Tệp Đính Kèm (PDF)</th>
                <th style={{ padding: '14px 16px', width: '90px', textAlign: 'center' }}>Lượt Tải</th>
                <th style={{ padding: '14px 16px', width: '110px', textAlign: 'center' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, idx) => (
                <tr
                  key={item.id || idx}
                  style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                  onMouseLeave={e => e.currentTarget.style.background = '#FFF'}
                >
                  <td style={{ padding: '14px 16px', fontWeight: '800', color: '#002855' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '13px', background: '#F1F5F9', padding: '3px 8px', borderRadius: '4px', border: '1px solid #CBD5E1' }}>
                      {item.code || `PL-0${item.id}`}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: '700', color: '#002855', fontSize: '14px', lineHeight: 1.4 }}>
                      {item.title}
                    </div>
                    {item.description && (
                      <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px', lineHeight: 1.5 }}>
                        {item.description}
                      </div>
                    )}
                    {item.target && (
                      <div style={{ fontSize: '11.5px', color: '#0284C7', marginTop: '3px' }}>
                        <i className="fa-solid fa-users me-1" /> Đối tượng: {item.target}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {getCatBadge(item.category)}
                  </td>
                  <td style={{ padding: '14px 16px', color: '#475569', fontSize: '12.5px', whiteSpace: 'nowrap' }}>
                    <i className="fa-regular fa-calendar me-1 text-muted" />
                    {(item.date || '').split('T')[0]}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <a
                      href={item.file_url || '#'}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: '#FEF2F2',
                        border: '1px solid #FECACA',
                        color: '#DC2626',
                        padding: '5px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '700',
                        textDecoration: 'none'
                      }}
                    >
                      <i className="fa-solid fa-file-pdf" />
                      <span>Tải PDF ({item.file_size || '2.0 MB'})</span>
                    </a>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '700', color: '#64748B' }}>
                    {item.downloads_count || item.LuotTai || 0}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button
                        onClick={() => openEditModal(item)}
                        style={{
                          background: '#EFF6FF',
                          border: '1px solid #BFDBFE',
                          color: '#1D4ED8',
                          padding: '5px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        <i className="fa-solid fa-pen-to-square" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, item.title)}
                        style={{
                          background: '#FEF2F2',
                          border: '1px solid #FECACA',
                          color: '#DC2626',
                          padding: '5px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        <i className="fa-solid fa-trash" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL THÊM / SỬA VĂN BẢN PHÚC LỢI */}
      {editingPolicy && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '12px', width: '100%', maxWidth: '580px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
            <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg, #002855, #001A38)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '15px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-file-pdf" style={{ color: '#F87171' }} />
                <span>{editingPolicy.id ? 'Cập Nhật Văn Bản Phúc Lợi' : 'Đăng Tải Văn Bản Phúc Lợi (Kèm PDF)'}</span>
              </div>
              <button onClick={() => setEditingPolicy(null)} style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleSave} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Số / Ký Hiệu (*):</label>
                  <input
                    type="text"
                    required
                    value={form.code}
                    onChange={e => setForm({ ...form, code: e.target.value })}
                    placeholder="VD: 14/KH-CĐCS"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Chuyên Mục Chăm Lo (*):</label>
                  <select
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px', background: '#FFF' }}
                  >
                    {CATEGORIES.filter(c => c.id !== 'all').map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Trích Yếu &amp; Tiêu Đề Văn Bản (*):</label>
                <textarea
                  required
                  rows={2}
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="VD: Kế hoạch Tổ chức Khám sức khỏe định kỳ và Tầm soát bệnh nghề nghiệp năm 2026"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px', resize: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Đối Tượng Áp Dụng:</label>
                <input
                  type="text"
                  value={form.target}
                  onChange={e => setForm({ ...form, target: e.target.value })}
                  placeholder="VD: 100% Cán bộ, Giảng viên, Người lao động TDMU"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Đường Dẫn Tệp PDF Đính Kèm (*):</label>
                  <input
                    type="text"
                    required
                    value={form.file_url}
                    onChange={e => setForm({ ...form, file_url: e.target.value })}
                    placeholder="/uploads/welfare/Ke_Hoach_Kham_Suc_Khoe_2026.pdf"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Ngày Ban Hành:</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Tóm Tắt Nội Dung Chính Sách:</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Tóm tắt ngắn gọn nội dung chỉ đạo, quy định hoặc hướng dẫn để đoàn viên nắm nhanh..."
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px', resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEditingPolicy(null)}
                  style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#475569', padding: '8px 16px', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ background: '#DC2626', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}
                >
                  {saving ? 'Đang lưu...' : (editingPolicy.id ? 'Cập Nhật Văn Bản' : 'Lưu & Đăng Tải')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
