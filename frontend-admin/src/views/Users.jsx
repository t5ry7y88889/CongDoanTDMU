import React, { useState, useEffect } from 'react'
import { api } from '../api.js'

const emptyForm = { name: '', email: '', role: 'viewer', password: '' }

function roleBadge(role) {
  const map = {
    admin: ['badge-danger', 'Quản trị'],
    editor: ['badge-gold', 'Biên tập'],
    viewer: ['badge-secondary', 'Người xem']
  }
  const [cls, label] = map[role] || ['badge-secondary', role || '-']
  return [cls, label]
}

export default function Users({ notify }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    api.users().then((d) => setUsers(Array.isArray(d) ? d : []))
      .catch((e) => notify('error', e.message)).finally(() => setLoading(false))
  }

  useEffect(load, []) // eslint-disable-line react-hooks/exhaustive-deps

  const openCreate = () => { setForm(emptyForm); setModalOpen(true) }

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim()) { notify('warn', 'Vui lòng nhập họ tên và email'); return }
    setSaving(true)
    try {
      await api.createUser(form)
      notify('success', 'Đã tạo tài khoản')
      setModalOpen(false); load()
    } catch (e) { notify('error', e.message) } finally { setSaving(false) }
  }

  const handleDelete = async (u) => {
    if (!window.confirm(`Xóa tài khoản “${u.name || u.fullName || u.email}” ?`)) return
    try { await api.deleteUser(u.id); notify('success', 'Đã xóa'); load() }
    catch (e) { notify('error', e.message) }
  }

  return (
    <div>
      <div className="card">
        <div className="card-head">
          <h2><i className="fa-solid fa-users-gear me-2" style={{ color: '#002855' }}></i>Tài khoản ({users.length})</h2>
          <button className="btn btn-gold" onClick={openCreate}><i className="fa-solid fa-user-plus"></i>Thêm tài khoản</button>
        </div>
        <div className="card-body">
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr><th>Họ tên</th><th>Email</th><th>Vai trò</th><th>Đơn vị</th><th>Trạng thái</th><th style={{ width: 110 }}>Thao tác</th></tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const [cls, label] = roleBadge(u.role)
                  const [scls, slabel] = statusBadgeLocal(u.status)
                  return (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 600 }}>{u.name || u.fullName || '-'}</td>
                      <td>{u.email || '-'}</td>
                      <td><span className={`badge ${cls}`}>{label}</span></td>
                      <td className="text-secondary">{u.unit || '-'}</td>
                      <td><span className={`badge ${scls}`}>{slabel}</span></td>
                      <td>
                        <div className="row-actions">
                          <button className="btn btn-sm btn-red" onClick={() => handleDelete(u)} title="Xóa"><i className="fa-solid fa-trash"></i></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {!loading && !users.length && <div className="empty"><i className="fa-solid fa-users-gear"></i>Không có tài khoản nào.</div>}
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="modal">
            <div className="modal-head">
              <h3><i className="fa-solid fa-user-plus me-2" style={{ color: '#002855' }}></i>Thêm tài khoản</h3>
              <button className="modal-close" onClick={() => setModalOpen(false)}><i className="fa-solid fa-xmark"></i></button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-field full">
                  <label>Họ tên *</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Họ tên người dùng" />
                </div>
                <div className="form-field full">
                  <label>Email *</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@tdmu.edu.vn" />
                </div>
                <div className="form-field">
                  <label>Vai trò</label>
                  <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                    <option value="admin">Quản trị</option>
                    <option value="editor">Biên tập</option>
                    <option value="viewer">Người xem</option>
                  </select>
                </div>
                <div className="form-field">
                  <label>Mật khẩu</label>
                  <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Mật khẩu đăng nhập" />
                </div>
              </div>
              <div className="form-actions">
                <button className="btn btn-outline" onClick={() => setModalOpen(false)}>Hủy</button>
                <button className="btn btn-gold" onClick={handleSave} disabled={saving}>
                  <i className="fa-solid fa-save me-1"></i>{saving ? 'Đang lưu…' : 'Tạo tài khoản'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function statusBadgeLocal(status) {
  const map = {
    active: ['badge-success', 'Hoạt động'],
    inactive: ['badge-warning', 'Vô hiệu'],
    disabled: ['badge-secondary', 'Tắt'],
    new: ['badge-info', 'Mới']
  }
  if (status == null) return ['badge-secondary', '-']
  const s = String(status).toLowerCase()
  return map[s] || ['badge-secondary', status]
}