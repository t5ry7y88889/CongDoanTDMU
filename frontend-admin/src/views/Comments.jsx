import React, { useState, useEffect } from 'react'
import { api, statusBadge, formatDate } from '../api.js'

function truncate(text, n = 80) {
  const s = text || ''
  return s.length > n ? s.slice(0, n) + '…' : s
}

export default function Comments({ notify }) {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    api.comments().then((d) => setComments(Array.isArray(d) ? d : []))
      .catch((e) => notify('error', e.message)).finally(() => setLoading(false))
  }

  useEffect(load, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async (c) => {
    const title = c.article_title || c.commentText || ''
    if (!window.confirm(`Xóa bình luận${title ? ` “${truncate(title, 40)}”` : ''} ?`)) return
    try { await api.deleteComment(c.id); notify('success', 'Đã xóa'); load() }
    catch (e) { notify('error', e.message) }
  }

  return (
    <div className="card">
      <div className="card-head">
        <h2><i className="fa-solid fa-comment-dots me-2" style={{ color: '#002855' }}></i>Bình luận ({comments.length})</h2>
      </div>
      <div className="card-body">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr><th>Bài viết</th><th>Tác giả</th><th>Nội dung</th><th>Trạng thái</th><th>Ngày</th><th style={{ width: 110 }}>Thao tác</th></tr>
            </thead>
            <tbody>
              {comments.map((c) => {
                const [cls, label] = statusBadge(c.status)
                return (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600, maxWidth: 220 }}>{truncate(c.article_title, 60) || '-'}</td>
                    <td>{c.authorName || c.author || '-'}</td>
                    <td className="text-secondary" style={{ maxWidth: 320 }}>{truncate(c.commentText || c.content)}</td>
                    <td><span className={`badge ${cls}`}>{label}</span></td>
                    <td className="text-secondary">{formatDate(c.createdAt)}</td>
                    <td>
                      <div className="row-actions">
                        <button className="btn btn-sm btn-red" onClick={() => handleDelete(c)} title="Xóa"><i className="fa-solid fa-trash"></i></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {!loading && !comments.length && <div className="empty"><i className="fa-solid fa-comment-dots"></i>Không có bình luận nào.</div>}
        </div>
      </div>
    </div>
  )
}