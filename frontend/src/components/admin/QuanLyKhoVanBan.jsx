import React, { useState, useEffect } from 'react';

export default function QuanLyKhoVanBan({ initialTab = 'documents' }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);
    const [documents, setDocuments] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [editingDoc, setEditingDoc] = useState(null);
  const [editingTpl, setEditingTpl] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form Document
  const [formDoc, setFormDoc] = useState({
    code: '',
    title: '',
    category: 'cong_van',
    date: new Date().toISOString().split('T')[0],
    signer: 'TS. Lê Thị Kim Út',
    file_url: '/uploads/documents/Thong_Bao_Cong_Doan_2026.pdf',
    description: ''
  });

  // Form Template
  const [formTpl, setFormTpl] = useState({
    title: '',
    code: 'BM-CĐCS',
    category: 'GiaNhap',
    file_url: '/uploads/templates/Don_Xin_Gia_Nhap_Cong_Doan.docx',
    description: ''
  });

  const loadDocuments = async () => {
    try {
      const res = await fetch('/api/documents').then(r => r.json());
      if (res.success && Array.isArray(res.data)) setDocuments(res.data);
    } catch (e) { console.error('Lỗi nạp văn bản:', e); }
  };

  const loadTemplates = async () => {
    try {
      const res = await fetch('/api/templates').then(r => r.json());
      if (res.success && Array.isArray(res.data)) setTemplates(res.data);
    } catch (e) { console.error('Lỗi nạp biểu mẫu:', e); }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([loadDocuments(), loadTemplates()]).finally(() => setLoading(false));
  }, []);

  // CRUD Document
  const openAddDoc = () => {
    setFormDoc({
      code: `${Math.floor(Math.random() * 50) + 10}/HD-CĐCS`,
      title: '',
      category: 'ke_hoach',
      date: new Date().toISOString().split('T')[0],
      signer: 'TS. Lê Thị Kim Út',
      file_url: '/uploads/documents/Ke_Hoach_Cong_Doan_2026.pdf',
      description: ''
    });
    setEditingDoc({});
  };

  const saveDoc = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const isEdit = Boolean(editingDoc && editingDoc.id);
      const url = isEdit ? `/api/documents/${editingDoc.id}` : '/api/documents';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formDoc)
      }).then(r => r.json());
      if (res.success) {
        alert(isEdit ? '✅ Đã cập nhật văn bản!' : '🎉 Đã thêm văn bản mới!');
        setEditingDoc(null);
        loadDocuments();
      } else alert('Lỗi: ' + res.error);
    } catch (err) { alert('Lỗi: ' + err.message); }
    finally { setSaving(false); }
  };

  const deleteDoc = async (id, title) => {
    if (!window.confirm(`Bạn có chắc muốn xóa văn bản "${title}"?`)) return;
    try {
      const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' }).then(r => r.json());
      if (res.success) {
        setDocuments(prev => prev.filter(d => d.id !== id));
        alert('✅ Đã xóa văn bản');
      }
    } catch (e) { alert('Lỗi: ' + e.message); }
  };

  // CRUD Template
  const openAddTpl = () => {
    setFormTpl({
      title: '',
      code: `BM-0${templates.length + 1}`,
      category: 'GiaNhap',
      file_url: '/uploads/templates/Bieu_Mau_Moi.docx',
      description: ''
    });
    setEditingTpl({});
  };

  const saveTpl = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formTpl)
      }).then(r => r.json());
      if (res.success) {
        alert('🎉 Đã thêm biểu mẫu mẫu mới!');
        setEditingTpl(null);
        loadTemplates();
      } else alert('Lỗi: ' + res.error);
    } catch (err) { alert('Lỗi: ' + err.message); }
    finally { setSaving(false); }
  };

  const deleteTpl = async (id, title) => {
    if (!window.confirm(`Bạn có chắc muốn xóa biểu mẫu "${title}"?`)) return;
    try {
      const res = await fetch(`/api/templates/${id}`, { method: 'DELETE' }).then(r => r.json());
      if (res.success) {
        setTemplates(prev => prev.filter(t => t.id !== id));
        alert('✅ Đã xóa biểu mẫu');
      }
    } catch (e) { alert('Lỗi: ' + e.message); }
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: '#F8FAFC', padding: '28px 36px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#002855', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="fa-solid fa-folder-open" style={{ color: '#10B981' }} />
            Quản Lý Kho Văn Bản &amp; Biểu Mẫu Nghiệp Vụ Công Đoàn
          </h1>
          <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
            Quản trị các văn bản chỉ đạo điều hành, nghị quyết, kế hoạch và các mẫu đơn nghiệp vụ cho đoàn viên tải về
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('documents')}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '13px',
            fontWeight: activeTab === 'documents' ? '800' : '600',
            cursor: 'pointer',
            background: activeTab === 'documents' ? '#002855' : '#FFF',
            color: activeTab === 'documents' ? '#FFF' : '#475569',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <i className="fa-solid fa-file-pdf" style={{ color: activeTab === 'documents' ? '#F87171' : '#64748B' }} />
          Kho Văn Bản Chỉ Đạo ({documents.length})
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '13px',
            fontWeight: activeTab === 'templates' ? '800' : '600',
            cursor: 'pointer',
            background: activeTab === 'templates' ? '#002855' : '#FFF',
            color: activeTab === 'templates' ? '#FFF' : '#475569',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <i className="fa-solid fa-file-word" style={{ color: activeTab === 'templates' ? '#38BDF8' : '#64748B' }} />
          Kho Biểu Mẫu Nghiệp Vụ ({templates.length})
        </button>
      </div>

      {/* DOCUMENTS TAB */}
      {activeTab === 'documents' && (
        <div style={{ background: '#FFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '24px', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#002855', margin: 0 }}>Danh Sách Văn Bản Chỉ Đạo &amp; Điều Hành</h3>
            <button
              onClick={openAddDoc}
              style={{ background: 'linear-gradient(135deg,#059669,#047857)', color: 'white', border: 'none', padding: '9px 18px', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <i className="fa-solid fa-plus" /> Thêm Văn Bản Mới
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1.5px solid #E2E8F0', color: '#475569', fontWeight: '700' }}>
                <th style={{ padding: '12px 14px', width: '130px' }}>Số / Ký Hiệu</th>
                <th style={{ padding: '12px 14px' }}>Trích Yếu Văn Bản</th>
                <th style={{ padding: '12px 14px', width: '130px' }}>Ngày Ban Hành</th>
                <th style={{ padding: '12px 14px', width: '160px' }}>Người Ký</th>
                <th style={{ padding: '12px 14px', width: '120px' }}>Tệp PDF</th>
                <th style={{ padding: '12px 14px', width: '90px', textAlign: 'center' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((d, i) => (
                <tr key={d.id || i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '12px 14px', fontWeight: '800', color: '#002855' }}>
                    <span style={{ fontFamily: 'monospace', background: '#F1F5F9', padding: '3px 6px', borderRadius: '4px' }}>{d.code || d.so_hieu}</span>
                  </td>
                  <td style={{ padding: '12px 14px', fontWeight: '600', color: '#1E293B' }}>{d.title || d.trich_yeu}</td>
                  <td style={{ padding: '12px 14px', color: '#64748B' }}>{(d.date || d.ngay_ban_hanh || '').split('T')[0]}</td>
                  <td style={{ padding: '12px 14px', color: '#0284C7', fontWeight: '600' }}>{d.signer || d.nguoi_ky || 'BTV Công Đoàn'}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <a href={d.file_url || d.file_path || '#'} target="_blank" rel="noreferrer" style={{ color: '#DC2626', fontWeight: '700', textDecoration: 'none' }}>
                      <i className="fa-solid fa-file-pdf me-1" /> Tải về
                    </a>
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                    <button onClick={() => deleteDoc(d.id, d.title || d.trich_yeu)} style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', padding: '4px 8px', borderRadius: '5px', cursor: 'pointer' }}><i className="fa-solid fa-trash" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TEMPLATES TAB */}
      {activeTab === 'templates' && (
        <div style={{ background: '#FFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '24px', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#002855', margin: 0 }}>Kho Biểu Mẫu Nghiệp Vụ Công Đoàn (Word / PDF)</h3>
            <button
              onClick={openAddTpl}
              style={{ background: 'linear-gradient(135deg,#0284C7,#0369A1)', color: 'white', border: 'none', padding: '9px 18px', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <i className="fa-solid fa-plus" /> Thêm Biểu Mẫu Mới
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1.5px solid #E2E8F0', color: '#475569', fontWeight: '700' }}>
                <th style={{ padding: '12px 14px', width: '90px', textAlign: 'center' }}>Mã BM</th>
                <th style={{ padding: '12px 14px' }}>Tên Biểu Mẫu &amp; Mục Đích Sử Dụng</th>
                <th style={{ padding: '12px 14px', width: '160px' }}>Chuyên Mục</th>
                <th style={{ padding: '12px 14px', width: '140px' }}>Tệp Đính Kèm</th>
                <th style={{ padding: '12px 14px', width: '90px', textAlign: 'center' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((t, i) => (
                <tr key={t.id || i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: '800', color: '#002855' }}>#{t.id || (i + 1)}</td>
                  <td style={{ padding: '12px 14px', fontWeight: '700', color: '#002855' }}>
                    <i className="fa-solid fa-file-word me-2 text-primary" />
                    {t.title || t.name}
                  </td>
                  <td style={{ padding: '12px 14px', color: '#64748B' }}>{t.category || 'Nghiệp vụ chung'}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <a href={t.file_url || t.filePath || '#'} target="_blank" rel="noreferrer" style={{ color: '#0284C7', fontWeight: '700', textDecoration: 'none' }}>
                      <i className="fa-solid fa-download me-1" /> Tải về (.docx)
                    </a>
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                    <button onClick={() => deleteTpl(t.id, t.title || t.name)} style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', padding: '4px 8px', borderRadius: '5px', cursor: 'pointer' }}><i className="fa-solid fa-trash" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL ADD DOC */}
      {editingDoc && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#FFF', borderRadius: '12px', width: '100%', maxWidth: '520px', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
            <div style={{ padding: '16px 20px', background: '#002855', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '800', fontSize: '15px' }}>Thêm Văn Bản Chỉ Đạo Mới</span>
              <button onClick={() => setEditingDoc(null)} style={{ background: 'none', border: 'none', color: '#CBD5E1', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={saveDoc} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Số / Ký Hiệu (*):</label>
                  <input type="text" required value={formDoc.code} onChange={e => setFormDoc({ ...formDoc, code: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px' }} placeholder="VD: 08/HD-CĐCS" />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Người Ký (*):</label>
                  <input type="text" required value={formDoc.signer} onChange={e => setFormDoc({ ...formDoc, signer: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px' }} placeholder="TS. Lê Thị Kim Út" />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Trích Yếu Văn Bản (*):</label>
                <textarea required rows={2} value={formDoc.title} onChange={e => setFormDoc({ ...formDoc, title: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px', resize: 'none' }} placeholder="Nhập trích yếu nội dung văn bản..." />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Đường Dẫn Tệp PDF (*):</label>
                  <input type="text" required value={formDoc.file_url} onChange={e => setFormDoc({ ...formDoc, file_url: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px' }} placeholder="/uploads/documents/Ke_Hoach.pdf" />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Ngày Ban Hành:</label>
                  <input type="date" value={formDoc.date} onChange={e => setFormDoc({ ...formDoc, date: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px' }} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button type="button" onClick={() => setEditingDoc(null)} style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#475569', padding: '8px 16px', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}>Hủy</button>
                <button type="submit" disabled={saving} style={{ background: '#059669', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}>{saving ? 'Đang lưu...' : 'Lưu Văn Bản'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ADD TPL */}
      {editingTpl && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#FFF', borderRadius: '12px', width: '100%', maxWidth: '500px', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
            <div style={{ padding: '16px 20px', background: '#002855', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '800', fontSize: '15px' }}>Thêm Biểu Mẫu Nghiệp Vụ Mới</span>
              <button onClick={() => setEditingTpl(null)} style={{ background: 'none', border: 'none', color: '#CBD5E1', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={saveTpl} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Tên Biểu Mẫu (*):</label>
                <input type="text" required value={formTpl.title} onChange={e => setFormTpl({ ...formTpl, title: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px' }} placeholder="VD: Đơn Đề Nghị Cấp Thẻ Đoàn Viên" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Mã Định Danh:</label>
                  <input type="text" value={formTpl.code} onChange={e => setFormTpl({ ...formTpl, code: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px' }} placeholder="BM-06" />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Chuyên Mục:</label>
                  <input type="text" value={formTpl.category} onChange={e => setFormTpl({ ...formTpl, category: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px' }} placeholder="Nghiệp vụ" />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Đường Dẫn Tệp Mẫu (*):</label>
                <input type="text" required value={formTpl.file_url} onChange={e => setFormTpl({ ...formTpl, file_url: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px' }} placeholder="/uploads/templates/Don_De_Nghi.docx" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button type="button" onClick={() => setEditingTpl(null)} style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#475569', padding: '8px 16px', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}>Hủy</button>
                <button type="submit" disabled={saving} style={{ background: '#0284C7', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}>{saving ? 'Đang lưu...' : 'Lưu Biểu Mẫu'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
