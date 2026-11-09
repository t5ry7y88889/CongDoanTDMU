import React, { useState, useEffect } from 'react';

export default function QuanLyCoCauToChuc() {
  const [cadres, setCadres] = useState([]);
  const [units, setUnits] = useState([]);
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'btv' | 'bch' | 'ubkt' | 'boards' | 'units'
  const [search, setSearch] = useState('');

  // Modal State
  const [editingCadre, setEditingCadre] = useState(null); // null = closed, {} = add, { id, ... } = edit
  const [editingUnit, setEditingUnit] = useState(null);   // null = closed, {} = add, { id, ... } = edit
  const [editingBoard, setEditingBoard] = useState(null); // null = closed, {} = add, { id, ... } = edit
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Form State: Cán Bộ
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

  // Form State: Ban
  const [formBoard, setFormBoard] = useState({
    name: '',
    tenure: 'Nhiệm kỳ 2023 - 2028',
    description: '',
    orderIndex: 1
  });

  // Form State: Tổ Công Đoàn
  const [formUnit, setFormUnit] = useState({
    code: '',
    name: '',
    leader: '',
    email: '',
    phone: '',
    office: ''
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

  // ─── CADRE ACTIONS ─────────────────────────────────────────────────────────
  const openAddCadreModal = () => {
    setFormCadre({
      name: '',
      degree: 'Thạc sĩ',
      role: 'Ủy viên Ban Chấp hành',
      unit: 'Khoa Công nghệ Thông tin',
      unit_id: units[0]?.id || 1,
      board_id: boards[0]?.id || 1,
      email: '',
      phone: '',
      photo: 'https://congdoan.tdmu.edu.vn/img/ckeditor/Images/Danh.jpg',
      duties: 'Phụ trách công tác chuyên môn và phong trào đoàn viên.'
    });
    setEditingCadre({});
  };

  const openEditCadreModal = (c) => {
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

    const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
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
            setFormCadre(prev => ({ ...prev, photo: res.url }));
          } else {
            alert(res.message || 'Lỗi tải ảnh cán bộ!');
          }
        } catch (fetchErr) {
          alert('Lỗi kết nối upload: ' + fetchErr.message);
        } finally {
          setUploadingPhoto(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      alert('Lỗi đọc file: ' + err.message);
      setUploadingPhoto(false);
    }
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

  // ─── BOARD (BAN) ACTIONS ────────────────────────────────────────────────────
  const openAddBoardModal = () => {
    setFormBoard({
      name: '',
      tenure: 'Nhiệm kỳ 2023 - 2028',
      description: '',
      orderIndex: boards.length + 1
    });
    setEditingBoard({});
  };

  const openEditBoardModal = (b) => {
    setFormBoard({
      name: b.name || b.TenToChuc || '',
      tenure: b.tenure || b.NhiemKy || 'Nhiệm kỳ 2023 - 2028',
      description: b.description || b.MoTaChucNang || '',
      orderIndex: b.orderIndex !== undefined ? b.orderIndex : (b.ThuTuHienThi || 0)
    });
    setEditingBoard(b);
  };

  const handleSaveBoard = async (e) => {
    e.preventDefault();
    if (!formBoard.name.trim()) {
      alert('Vui lòng nhập Tên Ban / Bộ phận!');
      return;
    }
    setSaving(true);
    try {
      const isEdit = Boolean(editingBoard && (editingBoard.id || editingBoard.MaToChuc));
      const boardId = editingBoard.id || editingBoard.MaToChuc;
      const url = isEdit ? `/api/organizations/${boardId}` : '/api/organizations';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formBoard)
      }).then(r => r.json());

      if (res.success) {
        alert(`🎉 ${res.message || 'Đã lưu thông tin Ban thành công!'}`);
        setEditingBoard(null);
        await loadOrgData();
      } else {
        alert('Lỗi: ' + (res.error || 'Không thể lưu Ban'));
      }
    } catch (err) {
      alert('Lỗi kết nối: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBoard = async (id, name) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa "${name}" khỏi cơ cấu tổ chức? Các cán bộ thuộc Ban này sẽ được giữ lại nhưng không thuộc ban nào.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/organizations/${id}`, { method: 'DELETE' }).then(r => r.json());
      if (res.success) {
        alert('✅ Đã xóa Ban thành công!');
        await loadOrgData();
      } else {
        alert('Lỗi: ' + (res.error || 'Không thể xóa Ban'));
      }
    } catch (err) {
      alert('Lỗi kết nối: ' + err.message);
    }
  };

  // ─── UNIT (TỔ CÔNG ĐOÀN) ACTIONS ──────────────────────────────────────────
  const openAddUnitModal = () => {
    const nextNum = units.length + 1;
    setFormUnit({
      code: 'TCD_' + String(nextNum).padStart(2, '0'),
      name: '',
      leader: '',
      email: '',
      phone: '',
      office: ''
    });
    setEditingUnit({});
  };

  const openEditUnitModal = (u) => {
    setFormUnit({
      code: u.code || u.MaDinhDanh || '',
      name: u.name || u.TenToCongDoan || '',
      leader: u.leader || u.ToTruong || '',
      email: u.email || u.EmailLienHe || '',
      phone: u.phone || u.SoDienThoai || '',
      office: u.office || u.DiaChiVanPhong || ''
    });
    setEditingUnit(u);
  };

  const handleSaveUnit = async (e) => {
    e.preventDefault();
    if (!formUnit.name.trim()) {
      alert('Vui lòng nhập Tên Tổ Công Đoàn!');
      return;
    }
    setSaving(true);
    try {
      const isEdit = Boolean(editingUnit && (editingUnit.id || editingUnit.MaToCongDoan));
      const unitId = editingUnit.id || editingUnit.MaToCongDoan;
      const url = isEdit ? `/api/to-cong-doan/${unitId}` : '/api/to-cong-doan';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formUnit)
      }).then(r => r.json());

      if (res.success) {
        alert(`🎉 ${res.message || 'Đã lưu thông tin Tổ Công đoàn thành công!'}`);
        setEditingUnit(null);
        await loadOrgData();
      } else {
        alert('Lỗi: ' + (res.error || 'Không thể lưu Tổ Công đoàn'));
      }
    } catch (err) {
      alert('Lỗi kết nối: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUnit = async (id, name) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa "${name}"? Hành động này sẽ gỡ liên kết các đoàn viên thuộc tổ này.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/to-cong-doan/${id}`, { method: 'DELETE' }).then(r => r.json());
      if (res.success) {
        alert('✅ Đã xóa Tổ Công đoàn thành công!');
        await loadOrgData();
      } else {
        alert('Lỗi: ' + (res.error || 'Không thể xóa tổ công đoàn'));
      }
    } catch (err) {
      alert('Lỗi kết nối: ' + err.message);
    }
  };

  // ─── LỌC CÁN BỘ THEO BAN ───────────────────────────────────────────────────
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#002855', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="fa-solid fa-sitemap" style={{ color: '#0284C7' }} />
            Quản Lý Cơ Cấu Tổ Chức & Cán Bộ Công Đoàn
          </h1>
          <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
            Quản trị Ban Thường Vụ, Ban Chấp Hành, Ủy Ban Kiểm Tra, các Ban chuyên đề và 16 Tổ Công đoàn cơ sở trực tiếp từ CSDL MSSQL
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={loadOrgData}
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
          {filterTab === 'boards' ? (
            <button
              onClick={openAddBoardModal}
              style={{
                background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
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
                boxShadow: '0 4px 12px rgba(124,58,237,0.3)'
              }}
            >
              <i className="fa-solid fa-plus" /> Thêm Ban Mới
            </button>
          ) : filterTab === 'units' ? (
            <button
              onClick={openAddUnitModal}
              style={{
                background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
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
                boxShadow: '0 4px 12px rgba(2,132,199,0.3)'
              }}
            >
              <i className="fa-solid fa-plus" /> Thêm Tổ Công Đoàn Mới
            </button>
          ) : (
            <button
              onClick={openAddCadreModal}
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
          )}
        </div>
      </div>

      {/* Thẻ Thống Kê Nhanh */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
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
        <div style={{ background: '#FFF', borderRadius: '10px', padding: '16px 20px', border: '1px solid #E2E8F0', borderLeft: '4px solid #7C3AED' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#7C3AED', textTransform: 'uppercase' }}>Các Ban / Cơ Quan</div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#7C3AED', marginTop: '4px' }}>{boards.length}</div>
        </div>
        <div style={{ background: '#FFF', borderRadius: '10px', padding: '16px 20px', border: '1px solid #E2E8F0', borderLeft: '4px solid #0284C7' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#0284C7', textTransform: 'uppercase' }}>Tổ Công Đoàn Cơ Sở</div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#0284C7', marginTop: '4px' }}>{units.length}</div>
        </div>
      </div>

      {/* Thanh Bộ Lọc & Tìm Kiếm */}
      <div style={{ background: '#FFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '16px 20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: `Tất cả (${cadres.length})`, color: '#002855' },
            { id: 'btv', label: `Ban Thường Vụ (${countBTV})`, color: '#D97706' },
            { id: 'bch', label: `Ban Chấp Hành (${countBCH})`, color: '#2563EB' },
            { id: 'ubkt', label: `Ủy Ban Kiểm Tra (${countUBKT})`, color: '#16A34A' },
            { id: 'boards', label: `Quản Lý Các Ban (${boards.length})`, color: '#7C3AED' },
            { id: 'units', label: `Tổ Công Đoàn Cơ Sở (${units.length})`, color: '#0284C7' }
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

        {filterTab !== 'units' && filterTab !== 'boards' && (
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

      {/* ── NỘI DUNG 1: BẢNG CÁN BỘ CÔNG ĐOÀN ───────────────────────────── */}
      {filterTab !== 'units' && filterTab !== 'boards' && (
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
                  <th style={{ padding: '14px 16px', width: '220px' }}>Liên Hệ</th>
                  <th style={{ padding: '14px 16px', width: '120px', textAlign: 'center' }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredCadres.map((c, index) => {
                  const roleStr = c.role || c.ChucVuCongDoan || 'Ủy viên';
                  const isPresident = roleStr.toLowerCase().includes('chủ tịch') && !roleStr.toLowerCase().includes('phó');
                  const isVice = roleStr.toLowerCase().includes('phó chủ tịch');
                  return (
                    <tr
                      key={c.id || c.MaNhanSu || index}
                      style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                      onMouseLeave={e => e.currentTarget.style.background = '#FFF'}
                    >
                      <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '600', color: '#64748B' }}>
                        {String(index + 1).padStart(2, '0')}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <img
                          src={c.photo || c.HinhAnh || 'https://congdoan.tdmu.edu.vn/img/ckeditor/Images/Danh.jpg'}
                        onError={(e) => { e.target.onerror = null; e.target.src = '/images/default_avatar.png'; }}
                          alt={c.name}
                          style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #E2E8F0' }}
                          onError={(e) => { e.target.src = 'https://congdoan.tdmu.edu.vn/img/ckeditor/Images/Danh.jpg'; }}
                        />
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: '700', color: '#002855', fontSize: '14px' }}>{c.name || c.HoVaTen}</div>
                        <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                          <span style={{ color: '#0284C7', fontWeight: '600' }}>{c.degree || c.HocHamHocVi || 'Cử nhân'}</span>
                          <span style={{ margin: '0 6px', color: '#CBD5E1' }}>•</span>
                          <span>Mã: #{c.code || c.MaCanBo || `CB_${c.id}`}</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '700',
                            background: isPresident ? '#FEF3C7' : isVice ? '#FEF9C3' : '#F1F5F9',
                            color: isPresident ? '#92400E' : isVice ? '#854D0E' : '#334155'
                          }}
                        >
                          {roleStr}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '13px', color: '#334155' }}>
                        <div style={{ fontWeight: '600' }}>{c.unit || c.unit_name || c.ChucVuChuyenMon || 'Công đoàn Trường TDMU'}</div>
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
                            onClick={() => openEditCadreModal(c)}
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

      {/* ── NỘI DUNG 2: BẢNG CÁC BAN (dbo.ORGANIZATIONS) ─────────────────── */}
      {filterTab === 'boards' && (
        <div style={{ background: '#FFF', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ padding: '14px 20px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: '700', color: '#002855', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-shield-halved text-primary" />
              Danh Sách Các Ban / Hội Đồng Công Đoàn (dbo.ORGANIZATIONS)
            </div>
            <button
              onClick={openAddBoardModal}
              style={{ background: '#7C3AED', color: 'white', border: 'none', padding: '7px 14px', borderRadius: '6px', fontSize: '12.5px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <i className="fa-solid fa-plus" /> Thêm Ban Mới
            </button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
            <thead>
              <tr style={{ background: '#F1F5F9', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: '700' }}>
                <th style={{ padding: '14px 16px', width: '60px', textAlign: 'center' }}>STT</th>
                <th style={{ padding: '14px 16px', minWidth: '220px' }}>Tên Ban / Cơ Quan</th>
                <th style={{ padding: '14px 16px', width: '180px' }}>Nhiệm Kỳ</th>
                <th style={{ padding: '14px 16px', minWidth: '260px' }}>Chức Năng & Quyền Hạn</th>
                <th style={{ padding: '14px 16px', width: '90px', textAlign: 'center' }}>Thứ Tự</th>
                <th style={{ padding: '14px 16px', width: '130px', textAlign: 'center' }}>Trạng Thái</th>
                <th style={{ padding: '14px 16px', width: '140px', textAlign: 'center' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {boards.map((b, index) => (
                <tr
                  key={b.id || b.MaToChuc}
                  style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                  onMouseLeave={e => e.currentTarget.style.background = '#FFF'}
                >
                  <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '600', color: '#64748B' }}>
                    {index + 1}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <i className="fa-solid fa-shield-halved" style={{ color: '#7C3AED' }} />
                      <strong style={{ color: '#002855', fontSize: '14px' }}>{b.name || b.TenToChuc}</strong>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '12.5px', color: '#475569' }}>
                    <span style={{ background: '#F1F5F9', padding: '3px 8px', borderRadius: '4px', fontWeight: '600' }}>
                      {b.tenure || b.NhiemKy || 'Nhiệm kỳ 2023 - 2028'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '12.5px', color: '#334155' }}>
                    {b.description || b.MoTaChucNang || 'Chức năng, quyền hạn theo Điều lệ Công đoàn.'}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '700', color: '#0284C7' }}>
                    {b.orderIndex !== undefined ? b.orderIndex : (b.ThuTuHienThi || (index + 1))}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <span style={{ background: '#DEF7EC', color: '#03543F', padding: '4px 10px', borderRadius: '999px', fontSize: '11.5px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <i className="fa-solid fa-circle-check" /> Hoạt động
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button
                        onClick={() => openEditBoardModal(b)}
                        title="Chỉnh sửa Ban"
                        style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8', borderRadius: '6px', padding: '5px 8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                      >
                        <i className="fa-solid fa-pen-to-square me-1" /> Sửa
                      </button>
                      <button
                        onClick={() => handleDeleteBoard(b.id || b.MaToChuc, b.name || b.TenToChuc)}
                        title="Xóa Ban"
                        style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', borderRadius: '6px', padding: '5px 8px', fontSize: '12px', cursor: 'pointer' }}
                      >
                        <i className="fa-solid fa-trash" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── NỘI DUNG 3: BẢNG 16 TỔ CÔNG ĐOÀN (dbo.UNION_BRANCHES) ───────── */}
      {filterTab === 'units' && (
        <div style={{ background: '#FFF', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ padding: '14px 20px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: '700', color: '#002855', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-users-rectangle text-primary" />
              Danh Sách Tổ Công Đoàn Cơ Sở (dbo.UNION_BRANCHES)
            </div>
            <button
              onClick={openAddUnitModal}
              style={{ background: '#0284C7', color: 'white', border: 'none', padding: '7px 14px', borderRadius: '6px', fontSize: '12.5px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <i className="fa-solid fa-plus" /> Thêm Tổ Công Đoàn Mới
            </button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
            <thead>
              <tr style={{ background: '#F1F5F9', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: '700' }}>
                <th style={{ padding: '14px 16px', width: '90px', textAlign: 'center' }}>Mã Tổ</th>
                <th style={{ padding: '14px 16px' }}>Tên Tổ Công Đoàn Trực Thuộc</th>
                <th style={{ padding: '14px 16px', width: '220px' }}>Tổ Trưởng Phụ Trách</th>
                <th style={{ padding: '14px 16px', width: '220px' }}>Email Liên Hệ</th>
                <th style={{ padding: '14px 16px', width: '160px' }}>Số Điện Thoại</th>
                <th style={{ padding: '14px 16px', width: '160px', textAlign: 'center' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {units.map((u, index) => (
                <tr
                  key={u.id || u.MaToCongDoan || index}
                  style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                  onMouseLeave={e => e.currentTarget.style.background = '#FFF'}
                >
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#0284C7', background: '#E0F2FE', padding: '3px 8px', borderRadius: '4px' }}>
                      {u.code || u.MaDinhDanh || `TCD_${String(index + 1).padStart(2, '0')}`}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: '700', color: '#002855' }}>
                    {u.name || u.TenToCongDoan}
                  </td>
                  <td style={{ padding: '14px 16px', color: '#334155' }}>
                    <strong>{u.leader || u.ToTruong || 'Ban Chấp Hành Tổ'}</strong>
                  </td>
                  <td style={{ padding: '14px 16px', color: '#0284C7' }}>
                    <i className="fa-solid fa-envelope me-1 text-muted" /> {u.email || u.EmailLienHe || 'tcd@tdmu.edu.vn'}
                  </td>
                  <td style={{ padding: '14px 16px', color: '#64748B' }}>
                    <i className="fa-solid fa-phone me-1 text-success" /> {u.phone || u.SoDienThoai || '0274.3822058'}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button
                        onClick={() => openEditUnitModal(u)}
                        title="Chỉnh sửa Tổ Công đoàn"
                        style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8', borderRadius: '6px', padding: '5px 8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                      >
                        <i className="fa-solid fa-pen-to-square me-1" /> Sửa
                      </button>
                      <button
                        onClick={() => handleDeleteUnit(u.id || u.MaToCongDoan, u.name || u.TenToCongDoan)}
                        title="Xóa Tổ Công đoàn"
                        style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', borderRadius: '6px', padding: '5px 8px', fontSize: '12px', cursor: 'pointer' }}
                      >
                        <i className="fa-solid fa-trash" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── MODAL THÊM / CHỈNH SỬA CÁN BỘ ─────────────────────────────────── */}
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
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Thuộc Ban / Cơ Quan Lãnh Đạo:</label>
                  <select
                    value={formCadre.board_id}
                    onChange={e => setFormCadre({ ...formCadre, board_id: parseInt(e.target.value) })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px' }}
                  >
                    {boards.map(b => (
                      <option key={b.id || b.MaToChuc} value={b.id || b.MaToChuc}>
                        {b.name || b.TenToChuc}
                      </option>
                    ))}
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
                    placeholder="VD: Khoa Kỹ thuật Công nghệ"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Thuộc Tổ Công Đoàn Cơ Sở:</label>
                  <select
                    value={formCadre.unit_id}
                    onChange={e => setFormCadre({ ...formCadre, unit_id: parseInt(e.target.value) })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px' }}
                  >
                    {units.map(u => (
                      <option key={u.id || u.MaToCongDoan} value={u.id || u.MaToCongDoan}>
                        {u.name || u.TenToCongDoan}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Email Liên Hệ:</label>
                  <input
                    type="email"
                    value={formCadre.email}
                    onChange={e => setFormCadre({ ...formCadre, email: e.target.value })}
                    placeholder="email@tdmu.edu.vn"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Số Điện Thoại:</label>
                  <input
                    type="text"
                    value={formCadre.phone}
                    onChange={e => setFormCadre({ ...formCadre, phone: e.target.value })}
                    placeholder="09xx xxx xxx"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Ảnh Chân Dung Cán Bộ (Chọn từ máy tính):</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <label style={{
                    background: '#F1F5F9',
                    border: '1px solid #CBD5E1',
                    padding: '8px 14px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '700',
                    color: '#334155',
                    cursor: uploadingPhoto ? 'wait' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <i className={uploadingPhoto ? "fa-solid fa-spinner fa-spin" : "fa-solid fa-cloud-arrow-up"} />
                    <span>{uploadingPhoto ? 'Đang tải...' : 'Chọn ảnh từ máy'}</span>
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} disabled={uploadingPhoto} style={{ display: 'none' }} />
                  </label>
                  <input
                    type="text"
                    value={formCadre.photo}
                    onChange={e => setFormCadre({ ...formCadre, photo: e.target.value })}
                    placeholder="URL ảnh hoặc chọn tệp..."
                    style={{ flex: 1, padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '12.5px' }}
                  />
                  {formCadre.photo && (
                    <img
                      src={formCadre.photo}
                      alt=""
                      style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #CBD5E1' }}
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                  )}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Nhiệm Vụ Phân Công:</label>
                <textarea
                  rows="2"
                  value={formCadre.duties}
                  onChange={e => setFormCadre({ ...formCadre, duties: e.target.value })}
                  placeholder="Ghi chú phân công nhiệm vụ chi tiết..."
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEditingCadre(null)}
                  style={{ padding: '8px 16px', border: '1px solid #CBD5E1', borderRadius: '6px', background: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ padding: '8px 20px', border: 'none', borderRadius: '6px', background: '#002855', color: 'white', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
                >
                  {saving ? 'Đang lưu...' : (editingCadre.id ? 'Cập Nhật Hồ Sơ' : 'Thêm Cán Bộ')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL THÊM / CHỈNH SỬA BAN (dbo.ORGANIZATIONS) ────────────────── */}
      {editingBoard && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '12px', width: '100%', maxWidth: '540px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
            <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg,#7C3AED,#6D28D9)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '16px', fontWeight: '800' }}>
                <i className="fa-solid fa-shield-halved me-2" />
                {editingBoard.id ? `Chỉnh Sửa Ban: ${formBoard.name}` : 'Thêm Ban / Hội Đồng Mới'}
              </div>
              <button onClick={() => setEditingBoard(null)} style={{ background: 'none', border: 'none', color: '#E2E8F0', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleSaveBoard} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Tên Ban / Cơ Quan (*):</label>
                  <input
                    type="text"
                    required
                    value={formBoard.name}
                    onChange={e => setFormBoard({ ...formBoard, name: e.target.value })}
                    placeholder="VD: Ban Nữ Công, Ban Tuyên Giáo..."
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Thứ Tự:</label>
                  <input
                    type="number"
                    value={formBoard.orderIndex}
                    onChange={e => setFormBoard({ ...formBoard, orderIndex: parseInt(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Nhiệm Kỳ Hoạt Động:</label>
                <input
                  type="text"
                  value={formBoard.tenure}
                  onChange={e => setFormBoard({ ...formBoard, tenure: e.target.value })}
                  placeholder="Nhiệm kỳ 2023 - 2028"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Chức Năng & Quyền Hạn:</label>
                <textarea
                  rows="3"
                  value={formBoard.description}
                  onChange={e => setFormBoard({ ...formBoard, description: e.target.value })}
                  placeholder="Mô tả chức năng, quyền hạn hoạt động của Ban..."
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEditingBoard(null)}
                  style={{ padding: '8px 16px', border: '1px solid #CBD5E1', borderRadius: '6px', background: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ padding: '8px 20px', border: 'none', borderRadius: '6px', background: '#7C3AED', color: 'white', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
                >
                  {saving ? 'Đang lưu...' : (editingBoard.id ? 'Lưu Thay Đổi' : 'Thêm Ban Mới')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL THÊM / CHỈNH SỬA TỔ CÔNG ĐOÀN (dbo.UNION_BRANCHES) ───── */}
      {editingUnit && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '12px', width: '100%', maxWidth: '540px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
            <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg,#002855,#0284C7)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '16px', fontWeight: '800' }}>
                <i className="fa-solid fa-users-rectangle me-2" />
                {editingUnit.id ? `Cập Nhật Tổ Công Đoàn: ${formUnit.name}` : 'Thêm Tổ Công Đoàn Cơ Sở Mới'}
              </div>
              <button onClick={() => setEditingUnit(null)} style={{ background: 'none', border: 'none', color: '#E2E8F0', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleSaveUnit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Mã Tổ (*):</label>
                  <input
                    type="text"
                    required
                    value={formUnit.code}
                    onChange={e => setFormUnit({ ...formUnit, code: e.target.value })}
                    placeholder="TCD_01"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px', fontFamily: 'monospace' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Tên Tổ Công Đoàn (*):</label>
                  <input
                    type="text"
                    required
                    value={formUnit.name}
                    onChange={e => setFormUnit({ ...formUnit, name: e.target.value })}
                    placeholder="VD: Tổ Công đoàn 1 - Khối Hiệu Bộ"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Tổ Trưởng / Người Phụ Trách:</label>
                <input
                  type="text"
                  value={formUnit.leader}
                  onChange={e => setFormUnit({ ...formUnit, leader: e.target.value })}
                  placeholder="Đ/c Nguyễn Văn A"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Email Liên Hệ:</label>
                  <input
                    type="email"
                    value={formUnit.email}
                    onChange={e => setFormUnit({ ...formUnit, email: e.target.value })}
                    placeholder="tcd01@tdmu.edu.vn"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Số Điện Thoại:</label>
                  <input
                    type="text"
                    value={formUnit.phone}
                    onChange={e => setFormUnit({ ...formUnit, phone: e.target.value })}
                    placeholder="0274.3822058"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Văn Phòng / Địa Điểm Sinh Hoạt:</label>
                <input
                  type="text"
                  value={formUnit.office}
                  onChange={e => setFormUnit({ ...formUnit, office: e.target.value })}
                  placeholder="Phòng A1.204, Khu hiệu bộ TDMU"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEditingUnit(null)}
                  style={{ padding: '8px 16px', border: '1px solid #CBD5E1', borderRadius: '6px', background: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ padding: '8px 20px', border: 'none', borderRadius: '6px', background: '#0284C7', color: 'white', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
                >
                  {saving ? 'Đang lưu...' : (editingUnit.id ? 'Lưu Thay Đổi' : 'Thêm Tổ Mới')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
