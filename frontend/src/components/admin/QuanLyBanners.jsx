import React, { useState, useEffect } from 'react';

export default function QuanLyBanners() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingBanner, setEditingBanner] = useState(null); // null = closed, {} = new, { id... } = edit
  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);

  // Form state
  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    image: '',
    linkUrl: '',
    orderIndex: 1,
    isActive: true
  });

  const loadBanners = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/banners?all=1').then(r => r.json());
      if (res.success && Array.isArray(res.data)) {
        setBanners(res.data);
      }
    } catch (err) {
      console.error('Lỗi nạp banners:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBanners();
  }, []);

  const openAddModal = () => {
    setForm({
      title: '',
      subtitle: '',
      image: '/images/banner.jpg',
      linkUrl: '/gioi-thieu',
      orderIndex: banners.length + 1,
      isActive: true
    });
    setEditingBanner({});
  };

  const openEditModal = (b) => {
    setForm({
      title: b.title || b.TieuDe || '',
      subtitle: b.subtitle || b.PhuDe || '',
      image: b.image || b.HinhAnhUrl || '/images/banner.jpg',
      linkUrl: b.linkUrl || b.DuongDanLienKet || '',
      orderIndex: b.orderIndex || b.ThuTu || 1,
      isActive: b.isActive !== undefined ? b.isActive : (b.IsActive !== undefined ? b.IsActive : true)
    });
    setEditingBanner(b);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      alert('Vui lòng nhập tiêu đề banner!');
      return;
    }
    setSaving(true);
    try {
      const isEdit = Boolean(editingBanner && editingBanner.id);
      const url = isEdit ? `/api/banners/${editingBanner.id}` : '/api/banners';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      }).then(r => r.json());

      if (res.success) {
        alert(`🎉 ${isEdit ? 'Đã cập nhật banner thành công!' : 'Đã thêm banner mới thành công!'}`);
        setEditingBanner(null);
        await loadBanners();
      } else {
        alert('Lỗi: ' + (res.error || 'Không thể lưu banner'));
      }
    } catch (err) {
      alert('Lỗi kết nối máy chủ: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa banner "${title}"?`)) return;
    try {
      const res = await fetch(`/api/banners/${id}`, { method: 'DELETE' }).then(r => r.json());
      if (res.success) {
        setBanners(prev => prev.filter(b => b.id !== id));
        alert('✅ Đã xóa banner thành công!');
      } else {
        alert('Lỗi: ' + (res.error || 'Không thể xóa banner'));
      }
    } catch (err) {
      alert('Lỗi kết nối: ' + err.message);
    }
  };

    const handleUploadImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImg(true);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const base64 = ev.target.result;
          const res = await fetch('/api/upload/image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: base64, filename: file.name })
          }).then(r => r.json());
          if (res.success && res.url) {
            setForm(prev => ({ ...prev, image: res.url }));
          } else {
            alert(res.message || 'Lỗi tải ảnh lên máy chủ!');
          }
        } catch (fetchErr) {
          alert('Lỗi kết nối upload: ' + fetchErr.message);
        } finally {
          setUploadingImg(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      alert('Lỗi đọc tệp ảnh: ' + err.message);
      setUploadingImg(false);
    }
  };

  const toggleActive = async (b) => {
    const newStatus = !(b.isActive !== undefined ? b.isActive : b.IsActive);
    try {
      const res = await fetch(`/api/banners/${b.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...b, isActive: newStatus })
      }).then(r => r.json());
      if (res.success) {
        setBanners(prev => prev.map(item => item.id === b.id ? { ...item, isActive: newStatus, IsActive: newStatus } : item));
      }
    } catch (err) {
      console.error('Lỗi đổi trạng thái banner:', err);
    }
  };

  const filteredBanners = banners.filter(b => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    const title = (b.title || b.TieuDe || '').toLowerCase();
    const sub = (b.subtitle || b.PhuDe || '').toLowerCase();
    return title.includes(q) || sub.includes(q);
  });

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: '#F8FAFC', padding: '28px 36px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#002855', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="fa-solid fa-images" style={{ color: '#F43F5E' }} />
            Quản Trị Banners &amp; Slider Trình Chiếu Trang Chủ
          </h1>
          <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
            Quản lý các hình ảnh và khẩu hiệu tuyên truyền trình chiếu trên slider đầu trang chủ (CSDL Microsoft SQL Server)
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={loadBanners}
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
              background: 'linear-gradient(135deg, #F43F5E 0%, #E11D48 100%)',
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
              boxShadow: '0 4px 12px rgba(244,63,94,0.3)'
            }}
          >
            <i className="fa-solid fa-plus" /> Thêm Banner Mới
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#FFF', borderRadius: '10px', padding: '16px 20px', border: '1px solid #E2E8F0', borderLeft: '4px solid #F43F5E' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Tổng Banner</div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#002855', marginTop: '4px' }}>{banners.length}</div>
        </div>
        <div style={{ background: '#FFF', borderRadius: '10px', padding: '16px 20px', border: '1px solid #E2E8F0', borderLeft: '4px solid #10B981' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Đang Hiển Thị Trang Chủ</div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#059669', marginTop: '4px' }}>
            {banners.filter(b => b.isActive || b.IsActive).length}
          </div>
        </div>
        <div style={{ background: '#FFF', borderRadius: '10px', padding: '16px 20px', border: '1px solid #E2E8F0', borderLeft: '4px solid #64748B' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Đang Ẩn</div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#64748B', marginTop: '4px' }}>
            {banners.filter(b => !(b.isActive || b.IsActive)).length}
          </div>
        </div>
      </div>

      {/* Search Toolbar */}
      <div style={{ background: '#FFF', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '14px 20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
        <div style={{ position: 'relative', width: '320px' }}>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo tiêu đề, khẩu hiệu..."
            style={{ width: '100%', padding: '8px 12px 8px 34px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
          />
          <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', fontSize: '12px' }} />
        </div>
        <span style={{ fontSize: '12.5px', color: '#64748B' }}>
          Hiển thị <strong>{filteredBanners.length}</strong> / {banners.length} banner
        </span>
      </div>

      {/* Banner Cards Grid */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#64748B' }}>
          <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '28px', color: '#F43F5E', marginBottom: '12px' }} />
          <div>Đang nạp dữ liệu banners từ CSDL MSSQL...</div>
        </div>
      ) : filteredBanners.length === 0 ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#64748B', background: '#FFF', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
          <i className="fa-regular fa-image" style={{ fontSize: '36px', color: '#CBD5E1', marginBottom: '10px' }} />
          <div>Không tìm thấy banner nào phù hợp</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
          {filteredBanners.map((b, idx) => {
            const active = b.isActive !== undefined ? b.isActive : b.IsActive;
            const title = b.title || b.TieuDe || 'Banner';
            const subtitle = b.subtitle || b.PhuDe || '';
            const img = b.image || b.HinhAnhUrl || '/images/banner.jpg';
            const order = b.orderIndex || b.ThuTu || (idx + 1);
            const link = b.linkUrl || b.DuongDanLienKet || '#';

            return (
              <div
                key={b.id || idx}
                style={{
                  background: '#FFF',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  overflow: 'hidden',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {/* Image Preview with Badges */}
                <div style={{ position: 'relative', height: '180px', background: '#0F172A', overflow: 'hidden' }}>
                  <img
                    src={img}
                    alt={title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: active ? 1 : 0.45 }}
                    onError={(e) => { e.target.src = '/images/banner.jpg'; }}
                  />
                  <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', gap: '6px' }}>
                    <span style={{ background: '#002855', color: 'white', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '800' }}>
                      Thứ tự: #{order}
                    </span>
                    <span
                      style={{
                        background: active ? '#10B981' : '#64748B',
                        color: 'white',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '700'
                      }}
                    >
                      {active ? '● Hiển thị' : '○ Đang ẩn'}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div style={{ padding: '16px 18px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontSize: '14.5px', fontWeight: '800', color: '#002855', margin: '0 0 6px 0', lineHeight: 1.4 }}>
                      {title}
                    </h3>
                    {subtitle && (
                      <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 10px 0', lineHeight: 1.5, display: '-webkit-box', WebKitLineClamp: 2, WebKitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {subtitle}
                      </p>
                    )}
                    <div style={{ fontSize: '11.5px', color: '#94A3B8', wordBreak: 'break-all' }}>
                      <i className="fa-solid fa-link me-1" style={{ color: '#0284C7' }} /> {link}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #F1F5F9' }}>
                    <button
                      onClick={() => toggleActive(b)}
                      style={{
                        background: active ? '#FEF2F2' : '#F0FDF4',
                        border: `1px solid ${active ? '#FECACA' : '#BBF7D0'}`,
                        color: active ? '#DC2626' : '#16A34A',
                        padding: '5px 10px',
                        borderRadius: '6px',
                        fontSize: '11.5px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      <i className={`fa-solid ${active ? 'fa-eye-slash' : 'fa-eye'} me-1`} />
                      {active ? 'Ẩn Banner' : 'Hiện Banner'}
                    </button>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => openEditModal(b)}
                        style={{
                          background: '#EFF6FF',
                          border: '1px solid #BFDBFE',
                          color: '#1D4ED8',
                          padding: '5px 10px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        <i className="fa-solid fa-pen-to-square me-1" /> Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(b.id, title)}
                        style={{
                          background: '#FEF2F2',
                          border: '1px solid #FECACA',
                          color: '#DC2626',
                          padding: '5px 10px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        <i className="fa-solid fa-trash me-1" /> Xóa
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADD / EDIT MODAL */}
      {editingBanner && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '12px', width: '100%', maxWidth: '560px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
            <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg, #002855, #001A38)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '15px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-images" style={{ color: '#F43F5E' }} />
                <span>{editingBanner.id ? 'Chỉnh Sửa Banner Trình Chiếu' : 'Thêm Banner Slider Mới'}</span>
              </div>
              <button onClick={() => setEditingBanner(null)} style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleSave} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Tiêu Đề Banner (*):
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="VD: CÔNG ĐOÀN CƠ SỞ TRƯỜNG ĐẠI HỌC THỦ DẦU MỘT"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Khẩu Hiệu / Phụ Đề:
                </label>
                <input
                  type="text"
                  value={form.subtitle}
                  onChange={e => setForm({ ...form, subtitle: e.target.value })}
                  placeholder="VD: Đổi mới - Dân chủ - Đoàn kết - Phát triển vì quyền lợi đoàn viên"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Hình Ảnh Banner (Chọn từ máy tính hoặc dán URL):
                </label>
                
                {/* Chọn ảnh trực tiếp từ máy tính */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
                  <label style={{
                    background: 'linear-gradient(135deg, #0284C7, #0369A1)',
                    color: '#FFF',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '12.5px',
                    fontWeight: '700',
                    cursor: uploadingImg ? 'wait' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 4px rgba(2,132,199,0.2)'
                  }}>
                    <i className={uploadingImg ? "fa-solid fa-spinner fa-spin" : "fa-solid fa-cloud-arrow-up"} />
                    <span>{uploadingImg ? 'Đang tải ảnh lên...' : 'Chọn ảnh từ máy tính'}</span>
                    <input type="file" accept="image/*" onChange={handleUploadImage} disabled={uploadingImg} style={{ display: 'none' }} />
                  </label>
                  <span style={{ fontSize: '12px', color: '#64748B' }}>hoặc dán đường dẫn ảnh bên dưới:</span>
                </div>

                <input
                  type="text"
                  required
                  value={form.image}
                  onChange={e => setForm({ ...form, image: e.target.value })}
                  placeholder="VD: /uploads/banner_hoat_dong.jpg hoặc /images/banner.jpg"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }}
                />

                {form.image && (
                  <div style={{ marginTop: '8px', height: '120px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #CBD5E1', position: 'relative', background: '#0F172A' }}>
                    <img
                      src={form.image}
                      alt="Xem trước banner"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => { e.target.src = '/images/banner.jpg'; }}
                    />
                    <div style={{ position: 'absolute', bottom: '6px', right: '8px', background: 'rgba(0,0,0,0.65)', color: '#FFF', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>
                      Xem trước
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Đường Dẫn Khi Bấm Vào:
                  </label>
                  <input
                    type="text"
                    value={form.linkUrl}
                    onChange={e => setForm({ ...form, linkUrl: e.target.value })}
                    placeholder="/gioi-thieu"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Thứ Tự Hiển Thị:
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.orderIndex}
                    onChange={e => setForm({ ...form, orderIndex: parseInt(e.target.value) || 1 })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <input
                  type="checkbox"
                  id="isActiveBanner"
                  checked={form.isActive}
                  onChange={e => setForm({ ...form, isActive: e.target.checked })}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="isActiveBanner" style={{ fontSize: '13px', fontWeight: '600', color: '#002855', cursor: 'pointer' }}>
                  Kích hoạt hiển thị trực tiếp lên Slider Trang Chủ
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEditingBanner(null)}
                  style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#475569', padding: '8px 16px', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ background: '#F43F5E', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}
                >
                  {saving ? 'Đang lưu...' : (editingBanner.id ? 'Cập Nhật Banner' : 'Lưu Banner Mới')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
