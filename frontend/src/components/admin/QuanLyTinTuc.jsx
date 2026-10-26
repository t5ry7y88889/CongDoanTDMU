import React, { useState, useEffect } from 'react';

export default function QuanLyTinTuc({ onEditArticle, onNewArticle }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'published' | 'draft' | 'pending'

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

  // Lọc và tìm kiếm
  const filteredArticles = articles.filter(a => {
    const matchStatus =
      filterStatus === 'all' ? true :
      filterStatus === 'published' ? (a.status === 'published' || !a.status) :
      a.status === filterStatus;

    const matchSearch = search.trim() === '' ? true :
      (a.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.sapo || a.summary || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.categoryName || '').toLowerCase().includes(search.toLowerCase());

    return matchStatus && matchSearch;
  });

  const countDrafts = articles.filter(a => a.status === 'draft').length;
  const countPublished = articles.filter(a => a.status === 'published' || !a.status).length;

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: '#F8FAFC', padding: '28px 36px' }}>
      {/* Tiêu đề & Nút Tạo bài */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#002855', margin: '0 0 6px 0' }}>
            <i className="fa-solid fa-newspaper" style={{ marginRight: '10px', color: '#2563EB' }} />
            Quản Lý Danh Sách Tin Bài Truyền Thông
          </h1>
          <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
            Hệ thống quản lý vòng đời bài viết: Đăng tải cổng thông tin, biên tập đa kênh Facebook và Zalo
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

      {/* Thẻ thống kê nhanh */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#FFF', borderRadius: '10px', padding: '16px 20px', border: '1px solid #E2E8F0', borderLeft: '4px solid #2563EB' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Tổng Số Bài Viết</div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#002855', marginTop: '4px' }}>{articles.length}</div>
        </div>
        <div style={{ background: '#FFF', borderRadius: '10px', padding: '16px 20px', border: '1px solid #E2E8F0', borderLeft: '4px solid #16A34A' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Đã Phát Hành Live</div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#16A34A', marginTop: '4px' }}>{countPublished}</div>
        </div>
        <div style={{ background: '#FFF', borderRadius: '10px', padding: '16px 20px', border: '1px solid #E2E8F0', borderLeft: '4px solid #F59E0B' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Bản Thảo Đang Viết</div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#D97706', marginTop: '4px' }}>{countDrafts}</div>
        </div>
      </div>

      {/* Bộ lọc và Tìm kiếm */}
      <div style={{ background: '#FFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '16px 20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setFilterStatus('all')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '700',
              border: filterStatus === 'all' ? '1px solid #002855' : '1px solid #CBD5E1',
              background: filterStatus === 'all' ? '#002855' : '#FFF',
              color: filterStatus === 'all' ? '#FFF' : '#475569',
              cursor: 'pointer'
            }}
          >
            Tất cả ({articles.length})
          </button>
          <button
            onClick={() => setFilterStatus('published')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '700',
              border: filterStatus === 'published' ? '1px solid #16A34A' : '1px solid #CBD5E1',
              background: filterStatus === 'published' ? '#F0FDF4' : '#FFF',
              color: filterStatus === 'published' ? '#16A34A' : '#475569',
              cursor: 'pointer'
            }}
          >
            Đã phát hành ({countPublished})
          </button>
          <button
            onClick={() => setFilterStatus('draft')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '700',
              border: filterStatus === 'draft' ? '1px solid #D97706' : '1px solid #CBD5E1',
              background: filterStatus === 'draft' ? '#FFFBEB' : '#FFF',
              color: filterStatus === 'draft' ? '#D97706' : '#475569',
              cursor: 'pointer'
            }}
          >
            Bản thảo ({countDrafts})
          </button>
        </div>

        {/* Ô tìm kiếm */}
        <div style={{ display: 'flex', alignItems: 'center', background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '6px 12px', width: '320px' }}>
          <i className="fa-solid fa-magnifying-glass" style={{ color: '#94A3B8', marginRight: '8px' }} />
          <input
            type="text"
            placeholder="Tìm theo tiêu đề bài viết..."
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
            <div>Không tìm thấy bài viết nào phù hợp</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
            <thead>
              <tr style={{ background: '#F1F5F9', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: '700' }}>
                <th style={{ padding: '14px 16px', width: '70px', textAlign: 'center' }}>STT</th>
                <th style={{ padding: '14px 16px', width: '110px' }}>Mã Bài</th>
                <th style={{ padding: '14px 16px' }}>Tiêu Đề Bài Báo</th>
                <th style={{ padding: '14px 16px', width: '180px' }}>Chuyên Mục</th>
                <th style={{ padding: '14px 16px', width: '130px', textAlign: 'center' }}>Trạng Thái</th>
                <th style={{ padding: '14px 16px', width: '150px' }}>Ngày Đăng</th>
                <th style={{ padding: '14px 16px', width: '160px', textAlign: 'center' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredArticles.map((article, index) => {
                const isDraft = article.status === 'draft';
                const serialNum = String(index + 1).padStart(2, '0');
                const articleCode = `#TDMU-${String(article.id).padStart(3, '0')}`;
                const pubDate = article.publishedAt || article.createdAt;
                const formattedDate = pubDate ? new Date(pubDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Chưa xuất bản';

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
                    {/* STT tuần tự */}
                    <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '700', color: '#64748B' }}>
                      {serialNum}
                    </td>

                    {/* Mã chuẩn hóa */}
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#2563EB', background: '#EFF6FF', padding: '3px 8px', borderRadius: '4px', fontSize: '12px' }}>
                        {articleCode}
                      </span>
                    </td>

                    {/* Tiêu đề bài viết */}
                    <td style={{ padding: '14px 16px' }}>
                      <div
                        onClick={() => onEditArticle(article)}
                        style={{ fontWeight: '700', color: '#002855', cursor: 'pointer', marginBottom: '3px' }}
                        title="Bấm để mở bài viết vào phòng biên tập"
                      >
                        {article.title || 'Bài viết chưa đặt tên'}
                      </div>
                      {article.sapo && (
                        <div style={{ fontSize: '12px', color: '#64748B', display: '-webkit-box', WebKitLineClamp: 1, WebKitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {article.sapo}
                        </div>
                      )}
                    </td>

                    {/* Chuyên mục */}
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ background: '#F1F5F9', color: '#334155', padding: '3px 9px', borderRadius: '12px', fontSize: '11.5px', fontWeight: '600' }}>
                        {article.categoryName || 'Hoạt động Công Đoàn'}
                      </span>
                    </td>

                    {/* Trạng thái */}
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      {isDraft ? (
                        <span style={{ background: '#FEF3C7', color: '#D97706', padding: '3px 10px', borderRadius: '12px', fontSize: '11.5px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <i className="fa-solid fa-file-pen" style={{ fontSize: '10px' }} /> Bản Nháp
                        </span>
                      ) : (
                        <span style={{ background: '#DCFCE7', color: '#16A34A', padding: '3px 10px', borderRadius: '12px', fontSize: '11.5px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <i className="fa-solid fa-circle-check" style={{ fontSize: '10px' }} /> Đã Phát Hành
                        </span>
                      )}
                    </td>

                    {/* Ngày tháng */}
                    <td style={{ padding: '14px 16px', color: '#64748B', fontSize: '12.5px' }}>
                      {formattedDate}
                    </td>

                    {/* Nút hành động */}
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          onClick={() => onEditArticle(article)}
                          title="Mở biên tập bài viết"
                          style={{
                            background: '#EFF6FF',
                            border: '1px solid #BFDBFE',
                            color: '#1D4ED8',
                            borderRadius: '6px',
                            padding: '5px 10px',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <i className="fa-solid fa-pen-to-square" /> Biên tập
                        </button>
                        <a
                          href={`/bai-viet?id=${article.id}`}
                          target="_blank"
                          rel="noreferrer"
                          title="Xem trên cổng web"
                          style={{
                            background: '#F8FAFC',
                            border: '1px solid #CBD5E1',
                            color: '#475569',
                            borderRadius: '6px',
                            padding: '5px 8px',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            textDecoration: 'none'
                          }}
                        >
                          <i className="fa-solid fa-arrow-up-right-from-square" />
                        </a>
                        <button
                          onClick={() => handleDelete(article.id, article.title)}
                          title="Xóa bài viết"
                          style={{
                            background: '#FEF2F2',
                            border: '1px solid #FECACA',
                            color: '#DC2626',
                            borderRadius: '6px',
                            padding: '5px 8px',
                            fontSize: '12px',
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
    </div>
  );
}
