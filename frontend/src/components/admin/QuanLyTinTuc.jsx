import React, { useState, useEffect } from 'react';
import ModalThamDinhBaiViet from './ModalThamDinhBaiViet';
import HopThoaiPhatHanhDaKenh from './HopThoaiPhatHanhDaKenh.modal';

export default function QuanLyTinTuc({ onEditArticle, onNewArticle, currentUser }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'pending_review' | 'requires_revision' | 'approved' | 'published' | 'draft'
  const [reviewModalArticle, setReviewModalArticle] = useState(null);
  const [publishModalArticle, setPublishModalArticle] = useState(null);

  const loadArticles = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bai-viet');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setArticles(data.data);
      }
    } catch (err) {
      console.error('Lỗi nạp bài viết:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArticles();
  }, []);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa bài viết "${title}" khỏi hệ thống?`)) return;
    try {
      const res = await fetch(`/api/bai-viet/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setArticles(prev => prev.filter(a => a.id !== id));
      } else {
        alert(data.message || 'Không thể xóa bài viết');
      }
    } catch (err) {
      alert('Lỗi kết nối máy chủ');
    }
  };

  // Xử lý Phê duyệt bài viết (Editor / Admin)
  const handleApprove = async (articleId, notes) => {
    try {
      const res = await fetch(`/api/articles/${articleId}/review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          reviewNotes: notes,
          reviewerName: currentUser?.ho_ten || 'Ban Biên Tập'
        })
      }).then(r => r.json());

      if (res.success) {
        alert('✅ Đã phê duyệt bài viết! Bài viết đã mở khóa sẵn sàng để xuất bản đa kênh.');
        loadArticles();
        if (reviewModalArticle && reviewModalArticle.id === articleId) {
          setReviewModalArticle(prev => ({ ...prev, status: 'approved', reviewNotes: notes }));
        }
        return true;
      } else {
        alert('Lỗi: ' + (res.message || 'Không thể duyệt bài'));
        return false;
      }
    } catch (err) {
      alert('Lỗi kết nối: ' + err.message);
      return false;
    }
  };

  // Xử lý Trả bài yêu cầu sửa đổi
  const handleRequestRevision = async (articleId, notes) => {
    try {
      const res = await fetch(`/api/articles/${articleId}/review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'request_revision',
          reviewNotes: notes,
          reviewerName: currentUser?.ho_ten || 'Ban Biên Tập'
        })
      }).then(r => r.json());

      if (res.success) {
        alert('↩️ Đã trả bài và gửi phản hồi chỉnh sửa đến cán bộ viết bài!');
        loadArticles();
        if (reviewModalArticle && reviewModalArticle.id === articleId) {
          setReviewModalArticle(prev => ({ ...prev, status: 'requires_revision', reviewNotes: notes }));
        }
        return true;
      } else {
        alert('Lỗi: ' + (res.message || 'Không thể trả bài'));
        return false;
      }
    } catch (err) {
      alert('Lỗi kết nối: ' + err.message);
      return false;
    }
  };

  // Xử lý Mở hộp thoại lựa chọn nền tảng xuất bản (Website, Facebook, Zalo)
  const handlePublishLive = (art) => {
    if (art.status !== 'approved') {
      alert('Chưa thể xuất bản! Bài viết bắt buộc phải được "Phê Duyệt" trước khi phát hành.');
      return;
    }
    setPublishModalArticle(art);
  };

  // Lọc và tìm kiếm
  const filteredArticles = articles.filter(a => {
    const artStatus = a.status || (a.isDraft ? 'draft' : 'published');
    const matchStatus =
      filterStatus === 'all' ? true :
      filterStatus === 'published' ? (artStatus === 'published') :
      artStatus === filterStatus;

    const matchSearch = search.trim() === '' ? true :
      (a.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.sapo || a.summary || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.author || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.categoryName || '').toLowerCase().includes(search.toLowerCase());

    return matchStatus && matchSearch;
  });

  const countDrafts = articles.filter(a => a.status === 'draft').length;
  const countPending = articles.filter(a => a.status === 'pending_review').length;
  const countRevision = articles.filter(a => a.status === 'requires_revision').length;
  const countApproved = articles.filter(a => a.status === 'approved').length;
  const countPublished = articles.filter(a => a.status === 'published' || !a.status).length;

  const renderStatusBadge = (status, article = {}) => {
    const isResubmitted = article.isResubmitted || 
      (status === 'pending_review' && Boolean(article.reviewNotes || article.ghi_chu_kiem_duyet));

    if (isResubmitted) {
      return (
        <span style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1.5px solid #60A5FA', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 6px rgba(37,99,235,0.15)' }}>
          <i className="fa-solid fa-arrows-rotate" style={{ fontSize: '10px' }} /> Đã Sửa (Gửi lại)
        </span>
      );
    }

    switch (status) {
      case 'pending_review':
        return (
          <span style={{ background: '#FEF3C7', color: '#D97706', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <i className="fa-solid fa-clock-rotate-left" style={{ fontSize: '10px' }} /> Chờ Thẩm Định
          </span>
        );
      case 'requires_revision':
        return (
          <span style={{ background: '#FEE2E2', color: '#DC2626', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <i className="fa-solid fa-arrow-rotate-left" style={{ fontSize: '10px' }} /> Yêu Cầu Sửa
          </span>
        );
      case 'approved':
        return (
          <span style={{ background: '#DCFCE7', color: '#16A34A', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <i className="fa-solid fa-circle-check" style={{ fontSize: '10px' }} /> Đã Phê Duyệt
          </span>
        );
      case 'published':
        return (
          <span style={{ background: '#DBEAFE', color: '#2563EB', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <i className="fa-solid fa-globe" style={{ fontSize: '10px' }} /> Đã Phát Hành
          </span>
        );
      default:
        return (
          <span style={{ background: '#F1F5F9', color: '#64748B', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <i className="fa-solid fa-file-pen" style={{ fontSize: '10px' }} /> Bản Nháp
          </span>
        );
    }
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: '#F8FAFC', padding: '28px 36px', boxSizing: 'border-box' }}>
      {/* Tiêu đề & Nút Tạo bài */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#002855', margin: '0 0 6px 0' }}>
            <i className="fa-solid fa-newspaper" style={{ marginRight: '10px', color: '#2563EB' }} />
            Quy Trình Kiểm Duyệt & Quản Lý Tin Bài
          </h1>
          <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
            Biên tập viên thẩm định bài viết từ cán bộ, gửi nhận xét trả bài hoặc phê duyệt xuất bản đa kênh
          </p>
        </div>
        <button
          onClick={onNewArticle}
          style={{
            background: 'linear-gradient(135deg, #002855 0%, #2563EB 100%)',
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
            boxShadow: '0 4px 12px rgba(37,99,235,0.25)'
          }}
        >
          <i className="fa-solid fa-plus" /> Soạn Bài Viết Mới
        </button>
      </div>

      {/* Thẻ thống kê quy trình kiểm duyệt */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        <div style={{ background: '#FFF', borderRadius: '10px', padding: '14px 18px', border: '1px solid #E2E8F0', borderLeft: '4px solid #002855' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Tổng Bài Viết</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#002855', marginTop: '4px' }}>{articles.length}</div>
        </div>
        <div style={{ background: '#FFF', borderRadius: '10px', padding: '14px 18px', border: '1px solid #E2E8F0', borderLeft: '4px solid #D97706' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#D97706', textTransform: 'uppercase' }}>⏳ Chờ Thẩm Định</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#D97706', marginTop: '4px' }}>{countPending}</div>
        </div>
        <div style={{ background: '#FFF', borderRadius: '10px', padding: '14px 18px', border: '1px solid #E2E8F0', borderLeft: '4px solid #DC2626' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#DC2626', textTransform: 'uppercase' }}>↩️ Yêu Cầu Sửa</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#DC2626', marginTop: '4px' }}>{countRevision}</div>
        </div>
        <div style={{ background: '#FFF', borderRadius: '10px', padding: '14px 18px', border: '1px solid #E2E8F0', borderLeft: '4px solid #16A34A' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#16A34A', textTransform: 'uppercase' }}>✅ Đã Phê Duyệt</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#16A34A', marginTop: '4px' }}>{countApproved}</div>
        </div>
        <div style={{ background: '#FFF', borderRadius: '10px', padding: '14px 18px', border: '1px solid #E2E8F0', borderLeft: '4px solid #2563EB' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#2563EB', textTransform: 'uppercase' }}>🌐 Đã Phát Hành</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#2563EB', marginTop: '4px' }}>{countPublished}</div>
        </div>
      </div>

      {/* Bộ lọc và Tìm kiếm */}
      <div style={{ background: '#FFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '14px 18px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: `Tất cả (${articles.length})` },
            { id: 'pending_review', label: `⏳ Chờ duyệt (${countPending})`, color: '#D97706', bg: '#FFFBEB' },
            { id: 'requires_revision', label: `↩️ Yêu cầu sửa (${countRevision})`, color: '#DC2626', bg: '#FEF2F2' },
            { id: 'approved', label: `✅ Đã duyệt (${countApproved})`, color: '#16A34A', bg: '#F0FDF4' },
            { id: 'published', label: `🌐 Đã phát hành (${countPublished})`, color: '#2563EB', bg: '#EFF6FF' },
            { id: 'draft', label: `📝 Bản nháp (${countDrafts})`, color: '#64748B', bg: '#F8FAFC' }
          ].map(tab => {
            const active = filterStatus === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12.5px',
                  fontWeight: '700',
                  border: active ? (tab.color ? `1.5px solid ${tab.color}` : '1.5px solid #002855') : '1px solid #CBD5E1',
                  background: active ? (tab.bg || '#002855') : '#FFF',
                  color: active ? (tab.color || '#FFF') : '#475569',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Ô tìm kiếm */}
        <div style={{ display: 'flex', alignItems: 'center', background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '6px 12px', width: '280px' }}>
          <i className="fa-solid fa-magnifying-glass" style={{ color: '#94A3B8', marginRight: '8px' }} />
          <input
            type="text"
            placeholder="Tìm theo tiêu đề, tác giả..."
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
      </div>

      {/* Bảng danh sách bài viết chuẩn hóa */}
      <div style={{ background: '#FFF', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
            <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '24px', marginBottom: '10px', color: '#2563EB' }} />
            <div>Đang tải dữ liệu bài viết từ cơ sở dữ liệu...</div>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
            <i className="fa-regular fa-folder-open" style={{ fontSize: '32px', marginBottom: '10px', color: '#CBD5E1' }} />
            <div>Không tìm thấy bài viết nào phù hợp bộ lọc</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#F1F5F9', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: '700' }}>
                <th style={{ padding: '12px 14px', width: '50px', textAlign: 'center' }}>STT</th>
                <th style={{ padding: '12px 14px', width: '95px' }}>Mã Bài</th>
                <th style={{ padding: '12px 14px' }}>Tiêu Đề & Kênh Phát Hành</th>
                <th style={{ padding: '12px 14px', width: '150px' }}>Tác Giả</th>
                <th style={{ padding: '12px 14px', width: '130px', textAlign: 'center' }}>Trạng Thái</th>
                <th style={{ padding: '12px 14px', width: '110px' }}>Ngày Cập Nhật</th>
                <th style={{ padding: '12px 14px', width: '190px', textAlign: 'center' }}>Quy Trình Duyệt</th>
              </tr>
            </thead>
            <tbody>
              {filteredArticles.map((article, index) => {
                const serialNum = String(index + 1).padStart(2, '0');
                const articleCode = `#TDMU-${String(article.id).padStart(3, '0')}`;
                const pubDate = article.updatedAt || article.NgayCapNhat || article.publishedAt || article.createdAt;
                const formattedDate = pubDate ? new Date(pubDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) : '---';
                const hasFb = Boolean(article.noi_dung_fb || article.NoiDungFB || article.fbCaption);
                const hasZalo = Boolean(article.noi_dung_zalo || article.NoiDungZalo || article.zaloText);
                const isPublished = article.status === 'published';

                return (
                  <tr
                    key={article.id}
                    style={{
                      borderBottom: '1px solid #F1F5F9',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* STT */}
                    <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: '700', color: '#64748B' }}>
                      {serialNum}
                    </td>

                    {/* Mã chuẩn hóa */}
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#2563EB', background: '#EFF6FF', padding: '2px 6px', borderRadius: '4px', fontSize: '11.5px' }}>
                        {articleCode}
                      </span>
                    </td>

                    {/* Tiêu đề bài viết & Ảnh Thumbnail & 3 Định dạng */}
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '48px',
                            height: '36px',
                            borderRadius: '5px',
                            overflow: 'hidden',
                            background: '#0F172A',
                            flexShrink: 0,
                            cursor: 'pointer',
                            border: '1px solid #E2E8F0'
                          }}
                          onClick={() => {
                            if (isPublished) {
                              window.open(`/bai-viet.html?id=${article.id}`, '_blank');
                            } else {
                              setReviewModalArticle(article);
                            }
                          }}
                          title={isPublished ? "Bài viết đã đăng - Bấm để xem trên Cổng thông tin" : "Bấm để thẩm định bài viết"}
                        >
                          <img
                            src={article.image ? (article.image.startsWith('http') || article.image.startsWith('/') ? article.image : '/' + article.image) : '/images/banner.jpg'}
                            alt=""
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => { e.target.onerror = null; e.target.src = '/images/banner.jpg'; }}
                          />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            onClick={() => {
                              if (isPublished) {
                                window.open(`/bai-viet.html?id=${article.id}`, '_blank');
                              } else {
                                setReviewModalArticle(article);
                              }
                            }}
                            style={{ fontWeight: '700', color: '#002855', cursor: 'pointer', marginBottom: '2px', lineHeight: 1.3 }}
                            title={isPublished ? "Bài viết đã phát hành - Bấm để xem trực tiếp trên Web" : "Bấm để mở modal thẩm định"}
                          >
                            {article.title || 'Bài viết chưa đặt tên'}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ background: '#F1F5F9', color: '#475569', padding: '1px 6px', borderRadius: '4px', fontSize: '10.5px' }}>
                              {article.categoryName || 'Chung'}
                            </span>
                            <span style={{ fontSize: '10px', background: '#E2E8F0', color: '#334155', padding: '1px 4px', borderRadius: '3px' }}>🌐 Web</span>
                            {hasFb && <span style={{ fontSize: '10px', background: '#DBEAFE', color: '#1D4ED8', padding: '1px 4px', borderRadius: '3px' }}>📘 FB</span>}
                            {hasZalo && <span style={{ fontSize: '10px', background: '#DCFCE7', color: '#15803D', padding: '1px 4px', borderRadius: '3px' }}>💬 Zalo</span>}
                          </div>
                          {article.reviewNotes && !isPublished && (
                            <div style={{ fontSize: '11px', color: '#DC2626', marginTop: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              ⚠️ <em>{article.reviewNotes}</em>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Tác giả */}
                    <td style={{ padding: '12px 14px', color: '#334155', fontSize: '12px' }}>
                      <strong>{article.author || 'Cán Bộ Cơ Sở'}</strong>
                    </td>

                    {/* Trạng thái */}
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      {renderStatusBadge(article.status, article)}
                    </td>

                    {/* Ngày tháng */}
                    <td style={{ padding: '12px 14px', color: '#64748B', fontSize: '12px' }}>
                      {formattedDate}
                    </td>

                    {/* Nút hành động / Quy trình duyệt */}
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '5px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        {isPublished ? (
                          <>
                            {/* Bài ĐÃ DUYỆT ĐĂNG: Khóa modal thẩm định, chỉ mở thẳng bài viết trên Cổng Web */}
                            <a
                              href={`/bai-viet.html?id=${article.id}`}
                              target="_blank"
                              rel="noreferrer"
                              title="Xem bài viết đã phát hành trên Cổng thông tin"
                              style={{
                                background: '#EFF6FF',
                                border: '1.5px solid #60A5FA',
                                color: '#1D4ED8',
                                borderRadius: '6px',
                                padding: '5px 10px',
                                fontSize: '11.5px',
                                fontWeight: '800',
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                boxShadow: '0 1px 3px rgba(37,99,235,0.1)'
                              }}
                            >
                              <i className="fa-solid fa-arrow-up-right-from-square" /> Xem Bài Viết ↗
                            </a>

                            {/* Nút chia sẻ Zalo 1-Chạm tiện lợi */}
                            <a
                              href={`https://zalo.me/share?url=${encodeURIComponent(window.location.origin + '/bai-viet.html?id=' + article.id)}&title=${encodeURIComponent(article.title || '')}`}
                              target="_blank"
                              rel="noreferrer"
                              title="Chia sẻ nhanh lên Zalo 1-chạm (Không cần Bot)"
                              style={{
                                background: '#F0FDF4',
                                border: '1px solid #86EFAC',
                                color: '#15803D',
                                borderRadius: '6px',
                                padding: '5px 7px',
                                fontSize: '11px',
                                fontWeight: '700',
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}
                            >
                              <i className="fa-solid fa-share-nodes" /> Zalo
                            </a>
                          </>
                        ) : (
                          <>
                            {/* Nút Thẩm Định / Chi Tiết dành cho bài chờ duyệt / yêu cầu sửa */}
                            <button
                              onClick={() => setReviewModalArticle(article)}
                              title="Thẩm định nội dung và phê duyệt"
                              style={{
                                background: article.status === 'pending_review' ? '#FEF3C7' : '#EFF6FF',
                                border: article.status === 'pending_review' ? '1px solid #F59E0B' : '1px solid #BFDBFE',
                                color: article.status === 'pending_review' ? '#B45309' : '#1D4ED8',
                                borderRadius: '5px',
                                padding: '4px 8px',
                                fontSize: '11.5px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}
                            >
                              <i className="fa-solid fa-magnifying-glass" />
                              {article.status === 'pending_review' ? 'Thẩm định' : 'Chi tiết'}
                            </button>

                            {/* Nút Xuất bản nếu đã duyệt */}
                            {article.status === 'approved' && (
                              <button
                                onClick={() => handlePublishLive(article)}
                                title="Xuất bản ngay bài viết này"
                                style={{
                                  background: '#DCFCE7',
                                  border: '1px solid #86EFAC',
                                  color: '#15803D',
                                  borderRadius: '5px',
                                  padding: '4px 8px',
                                  fontSize: '11.5px',
                                  fontWeight: '700',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '3px'
                                }}
                              >
                                <i className="fa-solid fa-paper-plane" /> Xuất bản
                              </button>
                            )}
                          </>
                        )}

                        {/* Nút Xóa bài viết */}
                        <button
                          onClick={() => handleDelete(article.id, article.title)}
                          title="Xóa bài viết"
                          style={{
                            background: '#FEF2F2',
                            border: '1px solid #FECACA',
                            color: '#DC2626',
                            borderRadius: '5px',
                            padding: '4px 6px',
                            fontSize: '11px',
                            cursor: 'pointer'
                          }}
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

      {/* Modal Thẩm Định & Phê Duyệt Bài Viết */}
      {reviewModalArticle && (
        <ModalThamDinhBaiViet
          isOpen={Boolean(reviewModalArticle)}
          onClose={() => setReviewModalArticle(null)}
          article={reviewModalArticle}
          onApprove={handleApprove}
          onRequestRevision={handleRequestRevision}
          onPublishLive={handlePublishLive}
        />
      )}

      {/* Modal Xuất Bản Lựa Chọn Đa Kênh (Website, Facebook, Zalo) */}
      {publishModalArticle && (
        <HopThoaiPhatHanhDaKenh
          isOpen={Boolean(publishModalArticle)}
          onClose={() => setPublishModalArticle(null)}
          article={publishModalArticle}
          onPublishSuccess={() => {
            loadArticles();
          }}
        />
      )}
    </div>
  );
}
