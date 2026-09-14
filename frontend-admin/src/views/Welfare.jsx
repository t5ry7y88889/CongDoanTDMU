import React, { useState, useEffect } from 'react'
import { api, money, formatDate, statusBadge } from '../api.js'

export default function Welfare({ notify }) {
  const [tab, setTab] = useState('applications')
  const [benefits, setBenefits] = useState([])
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)

  const [reviewOpen, setReviewOpen] = useState(false)
  const [item, setItem] = useState(null)
  const [form, setForm] = useState({ status: 'pending', approved_amount: '', note: '', reviewer: 'Ban Chấp hành' })
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    Promise.all([api.welfareBenefits(), api.welfareApplications()])
      .then(([b, a]) => { setBenefits(Array.isArray(b) ? b : []); setApplications(Array.isArray(a) ? a : []) })
      .catch((e) => notify('error', e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const openReview = (app) => {
    setItem(app)
    setForm({
      status: app.status || 'pending',
      approved_amount: app.approved_amount ?? app.amount_approved ?? '',
      note: app.decision_note || app.note || app.notes || '',
      reviewer: app.approved_by || app.reviewer_name || 'Ban Chấp hành'
    })
    setReviewOpen(true)
  }

  const handleSaveReview = async () => {
    if (!item) return
    setSaving(true)
    try {
      await api.updateWelfareApplication(item.id, {
        ...form,
        approved_amount: String(form.approved_amount).replace(/[^\d]/g, ''),
        reviewer_name: form.reviewer
      })
      notify('success', 'Đã cập nhật xét duyệt đơn')
      setReviewOpen(false)
      load()
    } catch (e) { notify('error', e.message) } finally { setSaving(false) }
  }

  const handleDelete = async (app) => {
    if (!window.confirm(`Xóa đơn trợ cấp của ${app.full_name} ?`)) return
    try { await api.deleteWelfareApplication(app.id); notify('success', 'Đã xóa'); load() }
    catch (e) { notify('error', e.message) }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button className={`btn ${tab === 'applications' ? 'btn-navy' : 'btn-outline'}`} onClick={() => setTab('applications')}>
          <i className="fa-solid fa-file-signature me-1"></i>Đơn trợ cấp ({applications.length})
        </button>
        <button className={`btn ${tab === 'benefits' ? 'btn-navy' : 'btn-outline'}`} onClick={() => setTab('benefits')}>
          <i className="fa-solid fa-gift me-1"></i>Chính sách phúc lợi ({benefits.length})
        </button>
      </div>

      {tab === 'benefits' && (
        <div className="card">
          <div className="card-head"><h2><i className="fa-solid fa-gift me-2" style={{ color: '#DC2626' }}></i>Danh sách chính sách chăm lo</h2></div>
          <div className="card-body">
            <div className="tbl-wrap">
              <table className="tbl">
                <thead><tr><th>Mã</th><th>Tiêu đề</th><th>Chuyên mục</th><th>Đối tượng hưởng</th><th>Mức hỗ trợ</th><th>Trạng thái</th></tr></thead>
                <tbody>
                  {benefits.map((b) => (
                    <tr key={b.id}>
                      <td style={{ fontWeight: 700, color: '#DC2626' }}>{b.code}</td>
                      <td style={{ fontWeight: 600, maxWidth: 320 }}>{b.title}</td>
                      <td><span className="badge badge-gold">{b.category || '-'}</span></td>
                      <td className="text-secondary">{b.eligibleSubjects || b.target_audience || '-'}</td>
                      <td style={{ fontWeight: 700, color: '#16A34A' }}>{b.amount || b.budget_range || '-'}</td>
                      <td><span className={`badge ${statusBadge(b.status)[0]}`}>{statusBadge(b.status)[1]}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!loading && !benefits.length && <div className="empty"><i className="fa-solid fa-gift"></i>Chưa có chính sách nào.</div>}
            </div>
          </div>
        </div>
      )}

      {tab === 'applications' && (
        <div className="card">
          <div className="card-head"><h2><i className="fa-solid fa-file-signature me-2" style={{ color: '#16A34A' }}></i>Danh sách đơn xin trợ cấp</h2></div>
          <div className="card-body">
            <div className="tbl-wrap">
              <table className="tbl">
                <thead><tr><th>Người nộp</th><th>Đơn vị</th><th>Loại trợ cấp</th><th>Số đề xuất</th><th>Số duyệt</th><th>Trạng thái</th><th>Ngày nộp</th><th style={{ width: 110 }}>Thao tác</th></tr></thead>
                <tbody>
                  {applications.map((a) => (
                    <tr key={a.id}>
                      <td style={{ fontWeight: 600 }}>{a.full_name}</td>
                      <td className="text-secondary">{a.unit || '-'}</td>
                      <td>{a.supportType || a.type || '-'}</td>
                      <td>{money(a.requested_amount ?? a.amount_requested)}</td>
                      <td style={{ fontWeight: 700, color: '#16A34A' }}>{money(a.approved_amount || 0)}</td>
                      <td><span className={`badge ${statusBadge(a.status)[0]}`}>{statusBadge(a.status)[1]}</span></td>
                      <td className="text-secondary">{formatDate(a.submitted_at || a.submittedAt)}</td>
                      <td>
                        <div className="row-actions">
                          <button className="btn btn-sm btn-outline" onClick={() => openReview(a)} title="Xét duyệt"><i className="fa-solid fa-magnifying-glass"></i></button>
                          <button className="btn btn-sm btn-red" onClick={() => handleDelete(a)} title="Xóa"><i className="fa-solid fa-trash"></i></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!loading && !applications.length && <div className="empty"><i className="fa-solid fa-file-signature"></i>Chưa có đơn trợ cấp nào.</div>}
            </div>
          </div>
        </div>
      )}

      {reviewOpen && item && (
        <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setReviewOpen(false)}>
          <div className="modal">
            <div className="modal-head">
              <h3><i className="fa-solid fa-clipboard-check me-2" style={{ color: '#16A34A' }}></i>Xét duyệt đơn — {item.full_name}</h3>
              <button className="modal-close" onClick={() => setReviewOpen(false)}><i className="fa-solid fa-xmark"></i></button>
            </div>
            <div className="modal-body">
              <div style={{ background: '#F8FAFC', padding: '12px 14px', borderRadius: 10, fontSize: 13, color: '#475569', marginBottom: 16 }}>
                Đơn vị: <strong>{item.unit || '-'}</strong> · Loại: <strong>{item.supportType || item.type || '-'}</strong><br />
                Đề xuất: <strong>{money(item.requested_amount ?? item.amount_requested)}</strong> · Ngày nộp: <strong>{formatDate(item.submitted_at || item.submittedAt)}</strong>
                {item.reason && <><br />Lý do: {item.reason}</>}
              </div>
              <div className="form-grid">
                <div className="form-field">
                  <label>Trạng thái</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="pending">Chờ duyệt</option>
                    <option value="approved">Đã duyệt</option>
                    <option value="rejected">Từ chối</option>
                  </select>
                </div>
                <div className="form-field">
                  <label>Số tiền duyệt (đ)</label>
                  <input value={form.approved_amount} onChange={(e) => setForm({ ...form, approved_amount: e.target.value })} placeholder="1,500,000" />
                </div>
                <div className="form-field">
                  <label>Người duyệt</label>
                  <input value={form.reviewer} onChange={(e) => setForm({ ...form, reviewer: e.target.value })} />
                </div>
                <div className="form-field">
                  <label>Ghi chú quyết định</label>
                  <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Quyết định số…" />
                </div>
              </div>
              <div className="form-actions">
                <button className="btn btn-outline" onClick={() => setReviewOpen(false)}>Hủy</button>
                {form.status === 'approved' && <button className="btn btn-green" onClick={handleSaveReview} disabled={saving}><i className="fa-solid fa-check me-1"></i>{saving ? 'Đang lưu…' : 'Duyệt hỗ trợ'}</button>}
                {form.status === 'rejected' && <button className="btn btn-red" onClick={handleSaveReview} disabled={saving}><i className="fa-solid fa-xmark me-1"></i>{saving ? 'Đang lưu…' : 'Từ chối đơn'}</button>}
                {form.status === 'pending' && <button className="btn btn-gold" onClick={handleSaveReview} disabled={saving}><i className="fa-solid fa-save me-1"></i>{saving ? 'Đang lưu…' : 'Lưu trạng thái'}</button>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}