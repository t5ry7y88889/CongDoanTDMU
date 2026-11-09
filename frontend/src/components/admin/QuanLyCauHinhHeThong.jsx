import React, { useState, useEffect } from 'react';

export default function QuanLyCauHinhHeThong() {
  const [subTab, setSubTab] = useState('notices'); // 'notices' | 'links' | 'categories' | 'site'
  const [loading, setLoading] = useState(false);

  // 1. Data States
  const [notices, setNotices] = useState([]);
  const [links, setLinks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [siteSettings, setSiteSettings] = useState({
    siteName: 'CÔNG ĐOÀN TRƯỜNG ĐẠI HỌC THỦ DẦU MỘT',
    brandSub: 'THU DAU MOT UNIVERSITY TRADE UNION',
    hotline: '(0274) 3.815.184',
    email: 'congdoan@tdmu.edu.vn',
    address: 'Số 06, đường Trần Văn Ơn, P. Phú Hòa, TP. Thủ Dầu Một, Bình Dương',
    slogan: 'Đổi mới - Dân chủ - Đoàn kết - Phát triển vì quyền lợi đoàn viên'
  });

  // Modal States
  const [modalItem, setModalItem] = useState(null); // null = closed, {} = add, { id... } = edit
  const [modalType, setModalType] = useState('');   // 'notice' | 'link' | 'category'
  const [saving, setSaving] = useState(false);

  // Form states
  const [formNotice, setFormNotice] = useState({ title: '', content: '', icon: 'fa-bullhorn', orderIndex: 1, linkUrl: '' });
  const [formLink, setFormLink] = useState({ title: '', url: '', orderIndex: 1 });
  const [formCategory, setFormCategory] = useState({ name: '', slug: '', description: '' });

  // Loaders
  const loadNotices = async () => {
    try {
      const res = await fetch('/api/quick-notices').then(r => r.json());
      if (res.success && Array.isArray(res.data)) setNotices(res.data);
    } catch (e) { console.error('Lỗi nạp notices:', e); }
  };

  const loadLinks = async () => {
    try {
      const res = await fetch('/api/external-links').then(r => r.json());
      if (res.success && Array.isArray(res.data)) setLinks(res.data);
    } catch (e) { console.error('Lỗi nạp links:', e); }
  };

  const loadCategories = async () => {
    try {
      const res = await fetch('/api/categories').then(r => r.json());
      if (res.success && Array.isArray(res.data)) setCategories(res.data);
    } catch (e) { console.error('Lỗi nạp categories:', e); }
  };

  const loadSiteSettings = async () => {
    try {
      const res = await fetch('/api/settings').then(r => r.json());
      if (res.success && res.data) setSiteSettings(prev => ({ ...prev, ...res.data }));
    } catch (e) { console.error('Lỗi nạp settings:', e); }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([loadNotices(), loadLinks(), loadCategories(), loadSiteSettings()]).finally(() => setLoading(false));
  }, []);

  // CRUD Notices
  const openNoticeModal = (item = null) => {
    setModalType('notice');
    if (item) {
      setFormNotice({ title: item.title, content: item.content || '', icon: item.icon || 'fa-bullhorn', orderIndex: item.orderIndex || 1, linkUrl: item.linkUrl || '' });
      setModalItem(item);
    } else {
      setFormNotice({ title: '', content: '', icon: 'fa-bullhorn', orderIndex: notices.length + 1, linkUrl: '' });
      setModalItem({});
    }
  };

  const saveNotice = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const isEdit = Boolean(modalItem && modalItem.id);
      const url = isEdit ? `/api/quick-notices/${modalItem.id}` : '/api/quick-notices';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formNotice)
      }).then(r => r.json());
      if (res.success) {
        alert(isEdit ? '✅ Đã cập nhật thông báo nhanh!' : '🎉 Đã thêm thông báo nhanh mới!');
        setModalItem(null);
        loadNotices();
      } else alert('Lỗi: ' + res.error);
    } catch (err) { alert('Lỗi kết nối: ' + err.message); }
    finally { setSaving(false); }
  };

  const deleteNotice = async (id, title) => {
    if (!window.confirm(`Bạn có chắc muốn xóa thông báo "${title}"?`)) return;
    try {
      const res = await fetch(`/api/quick-notices/${id}`, { method: 'DELETE' }).then(r => r.json());
      if (res.success) {
        setNotices(prev => prev.filter(n => n.id !== id));
        alert('✅ Đã xóa thông báo nhanh');
      }
    } catch (e) { alert('Lỗi: ' + e.message); }
  };

  // CRUD External Links
  const openLinkModal = (item = null) => {
    setModalType('link');
    if (item) {
      setFormLink({ title: item.title, url: item.url, orderIndex: item.orderIndex || 1 });
      setModalItem(item);
    } else {
      setFormLink({ title: '', url: 'https://', orderIndex: links.length + 1 });
      setModalItem({});
    }
  };

  const saveLink = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const isEdit = Boolean(modalItem && modalItem.id);
      const url = isEdit ? `/api/external-links/${modalItem.id}` : '/api/external-links';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formLink)
      }).then(r => r.json());
      if (res.success) {
        alert(isEdit ? '✅ Đã cập nhật liên kết!' : '🎉 Đã thêm liên kết ngoài!');
        setModalItem(null);
        loadLinks();
      } else alert('Lỗi: ' + res.error);
    } catch (err) { alert('Lỗi kết nối: ' + err.message); }
    finally { setSaving(false); }
  };

  const deleteLink = async (id, title) => {
    if (!window.confirm(`Bạn có chắc muốn xóa liên kết "${title}"?`)) return;
    try {
      const res = await fetch(`/api/external-links/${id}`, { method: 'DELETE' }).then(r => r.json());
      if (res.success) {
        setLinks(prev => prev.filter(l => l.id !== id));
        alert('✅ Đã xóa liên kết ngoài');
      }
    } catch (e) { alert('Lỗi: ' + e.message); }
  };

  // CRUD Categories
  const openCategoryModal = (item = null) => {
    setModalType('category');
    if (item) {
      setFormCategory({ name: item.name, slug: item.slug || '', description: item.description || '' });
      setModalItem(item);
    } else {
      setFormCategory({ name: '', slug: '', description: '' });
      setModalItem({});
    }
  };

  const saveCategory = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const isEdit = Boolean(modalItem && modalItem.id);
      const url = isEdit ? `/api/categories/${modalItem.id}` : '/api/categories';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formCategory)
      }).then(r => r.json());
      if (res.success) {
        alert(isEdit ? '✅ Đã cập nhật chuyên mục!' : '🎉 Đã thêm chuyên mục mới!');
        setModalItem(null);
        loadCategories();
      } else alert('Lỗi: ' + res.error);
    } catch (err) { alert('Lỗi kết nối: ' + err.message); }
    finally { setSaving(false); }
  };

  const deleteCategory = async (id, name) => {
    if (!window.confirm(`Bạn có chắc muốn xóa chuyên mục "${name}"?`)) return;
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' }).then(r => r.json());
      if (res.success) {
        setCategories(prev => prev.filter(c => c.id !== id));
        alert('✅ Đã xóa chuyên mục');
      }
    } catch (e) { alert('Lỗi: ' + e.message); }
  };

  // Save General Site Settings
  const saveGeneralSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(siteSettings)
      }).then(r => r.json());
      if (res.success) {
        alert('🎉 Đã lưu cấu hình chung website thành công!');
      } else alert('Lỗi: ' + res.error);
    } catch (err) { alert('Lỗi kết nối: ' + err.message); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: '#F8FAFC', padding: '28px 36px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#002855', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="fa-solid fa-sliders" style={{ color: '#0284C7' }} />
            Quản Lý Cấu Hình &amp; Tiện Ích Động Website
          </h1>
          <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
            Quản trị các thành phần động trên website: Thông báo nhanh, Liên kết hữu ích ngoài, Chuyên mục tin tức &amp; Thông tin chung
          </p>
        </div>
      </div>

      {/* Sub Tabs Bar */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', borderBottom: '2px solid #E2E8F0', paddingBottom: '12px', flexWrap: 'wrap' }}>
        {[
          { id: 'notices', label: 'Thông Báo Nhanh (Ticker)', icon: 'fa-bullhorn', count: notices.length },
          { id: 'links', label: 'Liên Kết Ngoài Hữu Ích', icon: 'fa-globe', count: links.length },
          { id: 'categories', label: 'Chuyên Mục Tin Tức', icon: 'fa-folder-tree', count: categories.length },
          { id: 'site', label: 'Cấu Hình Website Chung', icon: 'fa-gear' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '13px',
              fontWeight: subTab === t.id ? '800' : '600',
              cursor: 'pointer',
              background: subTab === t.id ? '#002855' : '#FFFFFF',
              color: subTab === t.id ? '#FFFFFF' : '#475569',
              boxShadow: subTab === t.id ? '0 4px 12px rgba(0,40,85,0.2)' : '0 1px 3px rgba(0,0,0,0.05)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <i className={`fa-solid ${t.icon}`} style={{ color: subTab === t.id ? '#38BDF8' : '#64748B' }} />
            <span>{t.label}</span>
            {t.count !== undefined && (
              <span style={{
                background: subTab === t.id ? 'rgba(255,255,255,0.2)' : '#F1F5F9',
                color: subTab === t.id ? '#FFF' : '#002855',
                padding: '1px 7px',
                borderRadius: '10px',
                fontSize: '11px',
                fontWeight: '800'
              }}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── SUBTAB 1: THÔNG BÁO NHANH ──────────────────────────────── */}
      {subTab === 'notices' && (
        <div style={{ background: '#FFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '24px', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#002855', margin: 0 }}>
                Danh Sách Thông Báo Nhanh (Trình Chiếu Thanh Chạy Trang Chủ)
              </h3>
              <p style={{ fontSize: '12.5px', color: '#64748B', margin: '4px 0 0 0' }}>Hiển thị ở dải thanh thông báo động ngay dưới Banner chính</p>
            </div>
            <button
              onClick={() => openNoticeModal()}
              style={{ background: 'linear-gradient(135deg,#0284C7,#0369A1)', color: 'white', border: 'none', padding: '9px 16px', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <i className="fa-solid fa-plus" /> Thêm Thông Báo Nhanh
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1.5px solid #E2E8F0', color: '#475569', fontWeight: '700' }}>
                <th style={{ padding: '12px 14px', width: '60px', textAlign: 'center' }}>Thứ Tự</th>
                <th style={{ padding: '12px 14px', width: '220px' }}>Tiêu Đề / Chủ Đề</th>
                <th style={{ padding: '12px 14px' }}>Nội Dung Thông Báo</th>
                <th style={{ padding: '12px 14px', width: '200px' }}>Đường Dẫn Chi Tiết</th>
                <th style={{ padding: '12px 14px', width: '100px', textAlign: 'center' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {notices.map((n, i) => (
                <tr key={n.id || i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: '800', color: '#002855' }}>#{n.orderIndex || (i + 1)}</td>
                  <td style={{ padding: '12px 14px', fontWeight: '700', color: '#002855' }}>
                    <i className={`fa-solid ${n.icon || 'fa-bullhorn'} me-2 text-warning`} />
                    {n.title}
                  </td>
                  <td style={{ padding: '12px 14px', color: '#334155' }}>{n.content}</td>
                  <td style={{ padding: '12px 14px', color: '#0284C7', fontSize: '12px' }}>{n.linkUrl || '—'}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button onClick={() => openNoticeModal(n)} style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8', padding: '4px 8px', borderRadius: '5px', cursor: 'pointer' }}><i className="fa-solid fa-pen" /></button>
                      <button onClick={() => deleteNotice(n.id, n.title)} style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', padding: '4px 8px', borderRadius: '5px', cursor: 'pointer' }}><i className="fa-solid fa-trash" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── SUBTAB 2: LIÊN KẾT NGOÀI HỮU ÍCH ────────────────────────── */}
      {subTab === 'links' && (
        <div style={{ background: '#FFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '24px', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#002855', margin: 0 }}>
                Danh Sách Liên Kết Website Hữu Ích
              </h3>
              <p style={{ fontSize: '12.5px', color: '#64748B', margin: '4px 0 0 0' }}>Hiển thị ở cột bên phải trang chủ (Tổng LĐLĐ, LĐLĐ Tỉnh, Cổng ĐH TDMU...)</p>
            </div>
            <button
              onClick={() => openLinkModal()}
              style={{ background: 'linear-gradient(135deg,#10B981,#059669)', color: 'white', border: 'none', padding: '9px 16px', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <i className="fa-solid fa-plus" /> Thêm Liên Kết Ngoài
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1.5px solid #E2E8F0', color: '#475569', fontWeight: '700' }}>
                <th style={{ padding: '12px 14px', width: '60px', textAlign: 'center' }}>Thứ Tự</th>
                <th style={{ padding: '12px 14px', width: '280px' }}>Tên Cơ Quan / Đơn Vị</th>
                <th style={{ padding: '12px 14px' }}>Địa Chỉ URL</th>
                <th style={{ padding: '12px 14px', width: '100px', textAlign: 'center' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {links.map((l, i) => (
                <tr key={l.id || i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: '800', color: '#002855' }}>#{l.orderIndex || (i + 1)}</td>
                  <td style={{ padding: '12px 14px', fontWeight: '700', color: '#002855' }}>
                    <i className="fa-solid fa-arrow-up-right-from-square me-2 text-success" />
                    {l.title}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <a href={l.url} target="_blank" rel="noreferrer" style={{ color: '#0284C7', textDecoration: 'none' }}>{l.url}</a>
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button onClick={() => openLinkModal(l)} style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8', padding: '4px 8px', borderRadius: '5px', cursor: 'pointer' }}><i className="fa-solid fa-pen" /></button>
                      <button onClick={() => deleteLink(l.id, l.title)} style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', padding: '4px 8px', borderRadius: '5px', cursor: 'pointer' }}><i className="fa-solid fa-trash" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── SUBTAB 3: CHUYÊN MỤC TIN TỨC ─────────────────────────────── */}
      {subTab === 'categories' && (
        <div style={{ background: '#FFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '24px', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#002855', margin: 0 }}>
                Quản Trị Chuyên Mục Tin Tức &amp; Bài Viết
              </h3>
              <p style={{ fontSize: '12.5px', color: '#64748B', margin: '4px 0 0 0' }}>Phân loại các tuyến bài viết trên Cổng thông tin (CSDL MSSQL)</p>
            </div>
            <button
              onClick={() => openCategoryModal()}
              style={{ background: 'linear-gradient(135deg,#8B5CF6,#7C3AED)', color: 'white', border: 'none', padding: '9px 16px', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <i className="fa-solid fa-plus" /> Thêm Chuyên Mục Mới
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1.5px solid #E2E8F0', color: '#475569', fontWeight: '700' }}>
                <th style={{ padding: '12px 14px', width: '60px', textAlign: 'center' }}>Mã</th>
                <th style={{ padding: '12px 14px', width: '240px' }}>Tên Chuyên Mục</th>
                <th style={{ padding: '12px 14px', width: '180px' }}>Slug Định Danh</th>
                <th style={{ padding: '12px 14px' }}>Mô Tả Chuyên Mục</th>
                <th style={{ padding: '12px 14px', width: '100px', textAlign: 'center' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c, i) => (
                <tr key={c.id || i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: '800', color: '#002855' }}>#{c.id || (i + 1)}</td>
                  <td style={{ padding: '12px 14px', fontWeight: '700', color: '#002855' }}>
                    <i className="fa-solid fa-folder me-2 text-primary" />
                    {c.name}
                  </td>
                  <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: '#64748B' }}>{c.slug || '—'}</td>
                  <td style={{ padding: '12px 14px', color: '#475569' }}>{c.description || 'Chuyên mục tin bài chính thức'}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button onClick={() => openCategoryModal(c)} style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8', padding: '4px 8px', borderRadius: '5px', cursor: 'pointer' }}><i className="fa-solid fa-pen" /></button>
                      <button onClick={() => deleteCategory(c.id, c.name)} style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', padding: '4px 8px', borderRadius: '5px', cursor: 'pointer' }}><i className="fa-solid fa-trash" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── SUBTAB 4: CẤU HÌNH WEBSITE CHUNG ────────────────────────── */}
      {subTab === 'site' && (
        <div style={{ background: '#FFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '28px', maxWidth: '800px', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#002855', margin: '0 0 4px 0' }}>
            Cấu Hình Thông Tin Chung Cổng Thông Tin
          </h3>
          <p style={{ fontSize: '12.5px', color: '#64748B', margin: '0 0 20px 0' }}>Các thông tin này hiển thị trên thanh Header, Footer và Hotline liên hệ</p>

          <form onSubmit={saveGeneralSettings} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Tiêu Đề Cổng Thông Tin (*):</label>
              <input
                type="text"
                required
                value={siteSettings.siteName}
                onChange={e => setSiteSettings({ ...siteSettings, siteName: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Tên Tiếng Anh Phụ Đề:</label>
              <input
                type="text"
                value={siteSettings.brandSub}
                onChange={e => setSiteSettings({ ...siteSettings, brandSub: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px' }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Đường Dây Nóng (Hotline):</label>
                <input
                  type="text"
                  value={siteSettings.hotline}
                  onChange={e => setSiteSettings({ ...siteSettings, hotline: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Hộp Thư Điện Tử (Email):</label>
                <input
                  type="email"
                  value={siteSettings.email}
                  onChange={e => setSiteSettings({ ...siteSettings, email: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px' }}
                />
              </div>
            </div>
            <div>
              <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Địa Chỉ Trụ Sở Công Đoàn:</label>
              <input
                type="text"
                value={siteSettings.address}
                onChange={e => setSiteSettings({ ...siteSettings, address: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Khẩu Hiệu Hành Động:</label>
              <input
                type="text"
                value={siteSettings.slogan}
                onChange={e => setSiteSettings({ ...siteSettings, slogan: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px' }}
              />
            </div>
            <div style={{ marginTop: '10px' }}>
              <button
                type="submit"
                disabled={saving}
                style={{ background: '#002855', color: '#FCD34D', border: 'none', padding: '10px 24px', borderRadius: '8px', fontWeight: '800', fontSize: '13.5px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,40,85,0.2)' }}
              >
                {saving ? 'Đang lưu...' : 'Lưu Thay Đổi Cấu Hình'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── MODALS (Notices, Links, Categories) ────────────────────── */}
      {modalItem && modalType === 'notice' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#FFF', borderRadius: '12px', width: '100%', maxWidth: '520px', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
            <div style={{ padding: '16px 20px', background: '#002855', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '800', fontSize: '15px' }}>{modalItem.id ? 'Sửa Thông Báo Nhanh' : 'Thêm Thông Báo Nhanh'}</span>
              <button onClick={() => setModalItem(null)} style={{ background: 'none', border: 'none', color: '#CBD5E1', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={saveNotice} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Tiêu Đề / Chủ Đề (*):</label>
                <input type="text" required value={formNotice.title} onChange={e => setFormNotice({ ...formNotice, title: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px' }} placeholder="VD: Khám Sức Khỏe Đoàn Viên 2026" />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Nội Dung Chi Tiết (*):</label>
                <textarea required rows={3} value={formNotice.content} onChange={e => setFormNotice({ ...formNotice, content: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px', resize: 'none' }} placeholder="Nhập nội dung vắn tắt hiển thị trên dòng chạy..." />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Đường Dẫn Chi Tiết:</label>
                  <input type="text" value={formNotice.linkUrl} onChange={e => setFormNotice({ ...formNotice, linkUrl: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px' }} placeholder="/phuc-loi-doan-vien" />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Thứ Tự:</label>
                  <input type="number" min="1" value={formNotice.orderIndex} onChange={e => setFormNotice({ ...formNotice, orderIndex: parseInt(e.target.value) || 1 })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px' }} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setModalItem(null)} style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#475569', padding: '8px 16px', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}>Hủy</button>
                <button type="submit" disabled={saving} style={{ background: '#0284C7', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}>{saving ? 'Đang lưu...' : 'Lưu Thông Báo'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalItem && modalType === 'link' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#FFF', borderRadius: '12px', width: '100%', maxWidth: '500px', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
            <div style={{ padding: '16px 20px', background: '#002855', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '800', fontSize: '15px' }}>{modalItem.id ? 'Sửa Liên Kết Ngoài' : 'Thêm Liên Kết Ngoài'}</span>
              <button onClick={() => setModalItem(null)} style={{ background: 'none', border: 'none', color: '#CBD5E1', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={saveLink} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Tên Cơ Quan / Đơn Vị (*):</label>
                <input type="text" required value={formLink.title} onChange={e => setFormLink({ ...formLink, title: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px' }} placeholder="VD: Liên Đoàn Lao Động Tỉnh Bình Dương" />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Địa Chỉ URL (*):</label>
                <input type="url" required value={formLink.url} onChange={e => setFormLink({ ...formLink, url: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px' }} placeholder="https://ldld.binhduong.gov.vn" />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Thứ Tự Hiển Thị:</label>
                <input type="number" min="1" value={formLink.orderIndex} onChange={e => setFormLink({ ...formLink, orderIndex: parseInt(e.target.value) || 1 })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setModalItem(null)} style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#475569', padding: '8px 16px', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}>Hủy</button>
                <button type="submit" disabled={saving} style={{ background: '#10B981', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}>{saving ? 'Đang lưu...' : 'Lưu Liên Kết'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalItem && modalType === 'category' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#FFF', borderRadius: '12px', width: '100%', maxWidth: '500px', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
            <div style={{ padding: '16px 20px', background: '#002855', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '800', fontSize: '15px' }}>{modalItem.id ? 'Sửa Chuyên Mục' : 'Thêm Chuyên Mục Mới'}</span>
              <button onClick={() => setModalItem(null)} style={{ background: 'none', border: 'none', color: '#CBD5E1', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={saveCategory} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Tên Chuyên Mục (*):</label>
                <input type="text" required value={formCategory.name} onChange={e => setFormCategory({ ...formCategory, name: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px' }} placeholder="VD: Hoạt Động Phong Trào" />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Slug Định Danh:</label>
                <input type="text" value={formCategory.slug} onChange={e => setFormCategory({ ...formCategory, slug: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px' }} placeholder="hoat-dong-phong-trao" />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Mô Tả:</label>
                <textarea rows={2} value={formCategory.description} onChange={e => setFormCategory({ ...formCategory, description: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px', resize: 'none' }} placeholder="Mô tả tóm tắt nội dung của chuyên mục..." />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setModalItem(null)} style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#475569', padding: '8px 16px', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}>Hủy</button>
                <button type="submit" disabled={saving} style={{ background: '#7C3AED', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}>{saving ? 'Đang lưu...' : 'Lưu Chuyên Mục'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
