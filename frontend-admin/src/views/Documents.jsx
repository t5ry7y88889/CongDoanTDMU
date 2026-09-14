import React, { useState, useEffect } from 'react'
import { api, formatDate, statusBadge } from '../api.js'

const emptyForm = {
  reference_number: '', title: '', category: '', issuer: '', issued_date: '',
  signer: '', file_url: '', file_size: 0, validity: 'con_hieu_luc', notes: ''
}

export default function Documents({ notify }) {
  const [docs, setDocs] = useState([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const catBadges = {
    'tuyen-truyen': 'badge-gold', 'nghi-quyet': 'badge-blue', 'chi-dao': 'badge-info',
    'quy-che': 'badge-info', 'ke-hoach': 'badge-success', 'cong-van': 'badge-success', 'khac': 'badge-secondary'
  }
  const catLabels = {
    'tuyen-truyen': 'Tuyên truyền', 'nghi-quyet': 'Nghị quyết', 'chi-dao': 'Chỉ đạo',
    'quy-che': 'Quy chế', 'ke-hoach': 'Kế hoạch', 'cong-van': 'Công văn', 'khac': 'Văn bản'
  }

  const load = () => {
    setLoading(true)
    api.documents().then((d) => setDocs(Array.isArray(d) ? d : []))
      .catch((e) => notify('error', e.message)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = docs.filter((d) => {
    if (filter !== 'all' && (d.category || '') !== filter) return false
    const q = search.trim().toLowerCase()
    if (!q) return true
    return [d.reference_number, d.title, d.issuer, d.signer].join(' ').toLowerCase().includes(q)
  })

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setModalOpen(true) }

  const openEdit = (d) => {
    setEditingId(d.id)
    setForm({
      reference_number: d.reference_number || '', title: d.title || '', category: d.category || 'kien-thuc',
      issuer: d.issuer || '', issued_date: d.issued_date || '', signer: d.signer || '',
      file_url: d.file_url || '', file_size: d.file_size || 0, validity: d.validity || 'con_hieu_luc', notes: d.notes || ''
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.title.trim()) { notify('warn', 'Vui lòng nhập tên văn bản'); return }
    setSaving(true)
    try {
      if (editingId) { await api.updateDocument(editingId, form); notify('success', 'Đã cập nhật văn bản') }
      else { await api.createDocument(form); notify('success', 'Đã đăng văn bản') }
      setModalOpen(false); load()
    } catch (e) { notify('error', e.message) } finally { setSaving(false) }
  }

  const handleDelete = async (d) => {
    if (!window.confirm(`Xóa văn bản “${d.title}” ?`)) return
    try { await api.deleteDocument(d.id); notify('success', 'Đã xóa'); load() } catch (e) { notify('error', e.message) }
  }

  const handleParse = async () => {
    if (!form.file_url.trim()) { notify('warn', 'Nhập URL tệp DOCX để trích xuất'); return }
    try {
      const r = await api.parseDocx({ url: form.file_url })
      setForm((f) => ({ ...f, title: f.title || r.title || '', content: r.content || '' }))
      notify('success', r.text ? 'Đã trích xuất nội dung từ DOCX' : 'Đã phân tích tệp')
    } catch (e) { notify('error', e.message) }
  }

  return (
    <div>
      <div className="card">
        <div className="card-head">
          <h2><i className="fa-solid fa-folder-open me-2" style={{ color: '#F59E0B' }}></i>Danh sách văn bản ({filtered.length})</h2>
          <button className="btn btn-gold" onClick={openCreate}><i className="fa-solid fa-upload"></i>Đăng văn bản</button>
        </div>
        <div className="card-body">
          <div className="filter-bar">
            <input type="search" placeholder="Tìm số hiệu, tiêu đề…" value={search} onChange={(e) => setSearch(e.target.value)} />
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">Tất cả loại</option>
              {Object.keys(catLabels).map((k) => <option key={k} value={k}>{catLabels[k]}({docs.filter((d) => d.category === k).length})</option>)}
            </select>
          </div>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr><th>Số hiệu</th><th>Tiêu đề</th><th>Loại</th><th>Ngày ban hành</th><th>Người ký</th><th>Hiệu lực</th><th>Lượt tải</th><th style={{ width: 130 }}>Thao tác</th></tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <tr key={d.id}>
                    <td style={{ fontWeight: 700, color: '#DC2626' }}><i className="fa-solid fa-file-pdf me-2"></i>{d.reference_number || 'N/A'}</td>
                    <td style={{ fontWeight: 600, maxWidth: 280 }}>{d.title}</td>
                    <td><span className={`badge ${catBadges[d.category] || 'badge-secondary'}`}>{catLabels[d.category] || d.category || 'Văn bản'}</span></td>
                    <td className="text-secondary">{formatDate(d.issued_date)}</td>
                    <td>{d.signer || '-'}</td>
                    <td><span className={`badge ${(d.validity || 'con_hieu_luc') === 'con_hieu_luc' ? 'badge-success' : 'badge-secondary'}`}>{(d.validity || 'con_hieu_luc') === 'con_hieu_luc' ? 'Còn hiệu lực' : 'Hết hiệu lực'}</span></td>
                    <td><span className="badge badge-info"><i className="fa-solid fa-download me-1"></i>{d.download_count || 0}</span></td>
                    <td>
                      <div className="row-actions">
                        <button className="btn btn-sm btn-outline" onClick={() => openEdit(d)}><i className="fa-solid fa-pen"></i></button>
                        <button className="btn btn-sm btn-outline" title="Mở" onClick={() => window.open(d.file_url || `/api/documents/download/${d.id}`, '_blank')}><i className="fa-solid fa-eye"></i></button>
                        <button className="btn btn-sm btn-red" onClick={() => handleDelete(d)}><i className="fa-solid fa-trash"></i></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && !filtered.length && <div className="empty"><i className="fa-solid fa-folder-open"></i>Không có văn bản nào.</div>}
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="modal wide">
            <div className="modal-head">
              <h3><i className="fa-solid fa-file-circle-plus me-2" style={{ color: '#F59E0B' }}></i>{editingId ? 'Sửa văn bản' : 'Đăng văn bản mới'}</h3>
              <button className="modal-close" onClick={() => setModalOpen(false)}><i className="fa-solid fa-xmark"></i></button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-field">
                  <label>Số hiệu văn bản *</label>
                  <input value={form.reference_number} onChange={(e) => setForm({ ...form, reference_number: e.target.value })} placeholder="VD: 12/CĐ-TDMU" />
                </div>
                <div className="form-field">
                  <label>Loại văn bản</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    {Object.keys(catLabels).map((k) => <option key={k} value={k}>{catLabels[k]}</option>)}
                  </select>
                </div>
                <div className="form-field full">
                  <label>Tên văn bản *</label>
                  <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>
                <div className="form-field"><label>Cơ quan ban hành</label><input value={form.issuer} onChange={(e) => setForm({ ...form, issuer: e.target.value })} /></div>
                <div className="form-field"><label>Người ký</label><input value={form.signer} onChange={(e) => setForm({ ...form, signer: e.target.value })} /></div>
                <div className="form-field"><label>Ngày ban hành</label><input type="date" value={form.issued_date} onChange={(e) => setForm({ ...form, issued_date: e.target.value })} /></div>
                <div className="form-field">
                  <label>Hiệu lực</label>
                  <select value={form.validity} onChange={(e) => setForm({ ...form, validity: e.target.value })}>
                    <option value="con_hieu_luc">Còn hiệu lực</option>
                    <option value="het_hieu_luc">Hết hiệu lực</option>
                  </select>
                </div>
                <div className="form-field full">
                  <label>Đường dẫn tệp (URL)</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input value={form.file_url} onChange={(e) => setForm({ ...form, file_url: e.target.value })} style={{ flex: 1 }} placeholder="/uploads/documents/…" />
                    <button className="btn btn-sm btn-outline" onClick={handleParse} title="Trích xuất DOCX"><i className="fa-solid fa-file-word"></i></button>
                  </div>
                </div>
                <div className="form-field full">
                  <label>Ghi chú</label>
                  <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
                </div>
              </div>
              <div className="form-actions">
                <button className="btn btn-outline" onClick={() => setModalOpen(false)}>Hủy</button>
                <button className="btn btn-gold" onClick={handleSave} disabled={saving}>
                  <i className="fa-solid fa-save me-1"></i>{saving ? 'Đang lưu…' : 'Lưu văn bản'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}