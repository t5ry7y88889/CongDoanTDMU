import React, { useState, useEffect } from 'react'
import { api, formatDate } from '../api.js'

export default function Dashboard({ notify }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.stats()
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false))
  }, [])

  const cards = stats
    ? [
        { icon: 'fa-newspaper', cls: 'icon-navy', num: stats.totalArticles ?? 0, lbl: 'Bài viết' },
        { icon: 'fa-folder-open', cls: 'icon-gold', num: stats.totalDocuments ?? 0, lbl: 'Văn bản' },
        { icon: 'fa-heart', cls: 'icon-red', num: stats.totalWelfareApplications ?? stats.welfareApplications ?? 0, lbl: 'Đơn trợ cấp' },
        { icon: 'fa-envelope-open-text', cls: 'icon-blue', num: stats.totalFeedback ?? stats.feedbackCount ?? 0, lbl: 'Góp ý' },
        { icon: 'fa-comment-dots', cls: 'icon-green', num: stats.totalComments ?? stats.commentCount ?? 0, lbl: 'Bình luận' },
        { icon: 'fa-chart-simple', cls: 'icon-gold', num: stats.totalMonthlyReports ?? stats.monthlyReports ?? 0, lbl: 'Báo cáo' },
        { icon: 'fa-users', cls: 'icon-navy', num: stats.totalStaff ?? stats.staffCount ?? 0, lbl: 'Cán bộ đoàn viên' },
        { icon: 'fa-hand-holding-heart', cls: 'icon-red', num: stats.totalSupportAmount ? (Number(stats.totalSupportAmount) || 0) : 0, lbl: 'Kinh phí chăm lo (đ)' }
      ]
    : []

  const paths = [
    { icon: 'fa-newspaper', label: 'Quản lý bài viết', desc: 'Duyệt & xuất bản tin tức', hash: 'articles' },
    { icon: 'fa-wand-magic-sparkles', label: 'Studio sáng tạo', desc: 'Biên tập đa kênh với AI', hash: 'studio' },
    { icon: 'fa-folder-open', label: 'Văn bản', desc: 'Đăng tải văn bản chỉ đạo', hash: 'documents' },
    { icon: 'fa-heart', label: 'Chăm lo & trợ cấp', desc: 'Xét duyệt hồ sơ trợ cấp', hash: 'welfare' },
    { icon: 'fa-envelope-open-text', label: 'Góp ý & thư ngỏ', desc: 'Trả lời hòm thư góp ý', hash: 'feedback' },
    { icon: 'fa-chart-simple', label: 'Báo cáo hoạt động', desc: 'Thu thập & xếp loại báo cáo', hash: 'reports' }
  ]

  return (
    <div>
      <div className="grid-4">
        {cards.length ? cards.map((c, i) => (
          <div className="stat-card" key={i}>
            <div className={`icon ${c.cls}`}><i className={`fa-solid ${c.icon}`}></i></div>
            <div>
              <div className="num">{typeof c.num === 'number' && c.num >= 1000000 ? Number(c.num).toLocaleString('vi-VN') : Number(c.num).toLocaleString('vi-VN')}</div>
              <div className="lbl">{c.lbl}</div>
            </div>
          </div>
        )) : (
          !loading && <div className="empty" style={{ gridColumn: '1 / -1' }}><i className="fa-solid fa-circle-exclamation"></i>Không lấy được số liệu thống kê — kiểm tra kết nối SQL Server.</div>
        )}
      </div>

      <div className="card">
        <div className="card-head"><h2><i className="fa-solid fa-bolt me-2" style={{ color: '#F59E0B' }}></i>Công việc nhanh</h2></div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            {paths.map((p) => (
              <a key={p.hash} href={`#${p.hash}`} className="card" style={{ padding: '16px', border: '1px solid var(--line)', borderRadius: 12, display: 'block', transition: 'box-shadow .15s' }} onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,40,85,0.12)'} onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}>
                <div style={{ fontSize: 20, color: '#002855', marginBottom: 8 }}><i className={`fa-solid ${p.icon}`}></i></div>
                <div style={{ fontWeight: 700 }}>{p.label}</div>
                <div style={{ fontSize: 12, color: '#64748B' }}>{p.desc}</div>
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <div className="card-head">
          <h2><i className="fa-solid fa-clock-rotate-left me-2" style={{ color: '#2563EB' }}></i>Nhật ký hoạt động gần đây</h2>
          <span className="badge badge-info">Hệ điều hành</span>
        </div>
        <div className="card-body" style={{ padding: '14px 18px' }}>
          <ActivityFallback stats={stats} />
        </div>
      </div>
    </div>
  )
}

function ActivityFallback({ stats }) {
  const articles = stats?.recentArticles || stats?.latestArticles || []
  const items = Array.isArray(articles) ? articles.slice(0, 6) : []
  if (!items.length) return <div className="empty"><i className="fa-solid fa-inbox"></i>Chưa có hoạt động gần đây.</div>
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {items.map((a) => (
        <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid #F1F5F9' }}>
          <span className="badge badge-secondary">{formatDate(a.createdAt || a.publishedDate)}</span>
          <span style={{ flex: 1, fontWeight: 600 }}>{a.title || a.Title || 'Bài viết'}</span>
          <span className="badge badge-gold">{a.statusName || a.status || ''}</span>
        </div>
      ))}
    </div>
  )
}