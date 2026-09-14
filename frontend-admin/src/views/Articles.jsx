import React, { useState, useEffect } from 'react'
import { api, statusBadge, formatDate } from '../api.js'

const emptyForm = { title: '', categoryId: '', author: '', summary: '', content: '', image: '', status: 'published' }

export default function Articles({ notify }) {
  const [articles, setArticles] = useState([])
  const [categories, setCategories] = useState([])
  const [filter, setFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    Promise.all([api.articles(), api.categories()])
      .then(([a, c]) => { setArticles(Array.isArray(a) ? a : []); setCategories(Array.isArray(c) ? c : []) })
      .catch((e) => notify('error', e.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, []) // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = articles.filter((a) => {
    if (statusFilter !== 'all' && (a.status || '') !== statusFilter) return false
    if (filter !== 'all' && String(a.categoryId) !== String(filter)) return false
    const q = search.trim().toLowerCase()
    if (!q) return true
    return [a.title, a.author, a.authorName, a.summary].join(' ').toLowerCase().includes(q)
  })

  const catName = (id) => {
    const c = categories.find((x) => String(x.id) === String(id))
    return c ? (c.name || c.Name) : 'Không phân loại'
  }

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setModalOpen(true) }

  const openEdit = (a) => {
    setEditingId(a.id)
    setForm({
      title: a.title || '', categoryId: String(a.categoryId || ''),
      author: a.author || a.authorName || '', summary: a.summary || '',
      content: a.content || '', image: a.image || a.featuredImage || '', status: a.status || 'published'
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.title.trim()) { notify('warn', 'Vui lòng nhập tiêu đề'); return }
    setSaving(true)
    try {
      if (editingId) {
        await api.updateArticle(editingId, form)
        notify('success', 'Đã cập nhật bài viết')
      } else {
        await api.createArticle(form)
        notify('success', 'Đã tạo bài viết')
      }
      setModalOpen(false)
      load()
    } catch (e) { notify('error', e.message) } finally { setSaving(false) }
  }

  const handleDelete = async (a) => {
    if (!window.confirm(`Xóa bài viết “${a.title}” ?`)) return
    try { await api.deleteArticle(a.id); notify('success', 'Đã xóa'); load() }
    catch (e) { notify('error', e.message) }
  }

  const handleApprove = async (a) => {
    try { await api.approveArticle(a.id); notify('success', 'Đã duyệt'); load() }
    catch (e) { notify('error', e.message) }
  }

  const countBy = (s) => (s === 'all' ? articles.length : articles.filter((a) => (a.status || '') === s).length)

  return (
    <div>
      <div className="card">
        <div className="card-head">
          <h2><i className="fa-solid fa-newspaper me-2" style={{ color: '#002855' }}></i>Danh sách bài viết ({filtered.length})</h2>
          <button className="btn btn-gold" onClick={openCreate}><i className="fa-solid fa-plus"></i>Bài viết mới</button>
        </div>
        <div className="card-body">
          <div className="filter-bar">
            <input type="search" placeholder="Tìm tiêu đề, tác giả…" value={search} onChange={(e) => setSearch(e.target.value)} />
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">Tất cả chuyên mục</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name || c.Name}</option>)}
            </select>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['all', 'published', 'draft', 'pending', 'rejected'].map((s) => (
                <button key={s} className={`btn btn-sm ${statusFilter === s ? 'btn-navy' : 'btn-outline'}`} onClick={() => setStatusFilter(s)}>
                  {s === 'all' ? 'Tất cả' : statusBadge(s)[1]} <span className="badge badge-secondary">{countBy(s)}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Tiêu đề</th><th>Chuyên mục</th><th>Tác giả</th><th>Trạng thái</th><th>Ngày</th><th style={{ width: 200 }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => {
                  const [cls, label] = statusBadge(a.status)
                  return (
                    <tr key={a.id}>
                      <td style={{ fontWeight: 600, maxWidth: 320 }}>{a.title}</td>
                      <td>{catName(a.categoryId)}</td>
                      <td>{a.author || a.authorName || '-'}</td>
                      <td><span className={`badge ${cls}`}>{label}</span></td>
                      <td className="text-secondary">{formatDate(a.createdAt)}</td>
                      <td>
                        <div className="row-actions">
                          <button className="btn btn-sm btn-outline" onClick={() => openEdit(a)} title="Sửa"><i className="fa-solid fa-pen"></i></button>
                          {a.status === 'pending' && <button className="btn btn-sm btn-green" onClick={() => handleApprove(a)} title="Duyệt"><i className="fa-solid fa-check"></i></button>}
                          <button className="btn btn-sm btn-outline" title="Mở xem" onClick={() => window.open(`/bai-viet/${a.slug || a.id}`, '_blank')}><i className="fa-solid fa-eye"></i></button>
                          <button className="btn btn-sm btn-red" onClick={() => handleDelete(a)} title="Xóa"><i className="fa-solid fa-trash"></i></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {!loading && !filtered.length && <div className="empty"><i className="fa-solid fa-newspaper"></i>Không có bài viết nào.</div>}
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="modal wide">
            <div className="modal-head">
              <h3><i className="fa-solid fa-pen-to-square me-2" style={{ color: '#002855' }}></i>{editingId ? 'Sửa bài viết' : 'Tạo bài viết mới'}</h3>
              <button className="modal-close" onClick={() => setModalOpen(false)}><i className="fa-solid fa-xmark"></i></button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-field full">
                  <label>Tiêu đề *</label>
                  <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Tiêu đề bài viết" />
                </div>
                <div className="form-field">
                  <label>Chuyên mục</label>
                  <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                    <option value="">Chưa phân loại</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name || c.Name}</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label>Tác giả</label>
                  <input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
                </div>
                <div className="form-field">
                  <label>Ảnh đại diện (URL)</label>
                  <input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="https://…" />
                </div>
                <div className="form-field">
                  <label>Trạng thái</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="draft">Bản nháp</option>
                    <option value="pending">Chờ duyệt</option>
                    <option value="published">Đã xuất bản</option>
                    <option value="rejected">Từ chối</option>
                  </select>
                </div>
                <div className="form-field full">
                  <label>Tóm tắt</label>
                  <textarea value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} rows={3} />
                </div>
                <div className="form-field full">
                  <label>Nội dung</label>
                  <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={12} />
                </div>
              </div>
              <div className="form-actions">
                <button className="btn btn-outline" onClick={() => setModalOpen(false)}>Hủy</button>
                <button className="btn btn-gold" onClick={handleSave} disabled={saving}>
                  <i className="fa-solid fa-save me-1"></i>{saving ? 'Đang lưu…' : 'Lưu bài viết'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}